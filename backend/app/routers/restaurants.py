import math
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_
from app.database import get_db
from app.models import Restaurant, User, UserRole, TableStatus, FoodStatus, ParkingStatus
from app.schemas import (
    RestaurantOut, RestaurantDetailOut, RestaurantStatusUpdate, RestaurantCreate
)
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])

# Active WebSocket connections manager for real-time live availability updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine formula in KM
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@router.get("", response_model=List[RestaurantOut])
async def search_restaurants(
    city: Optional[str] = Query(None, description="City name in Tamil Nadu"),
    cuisine: Optional[str] = Query(None, description="Cuisine type"),
    search: Optional[str] = Query(None, description="Search keyword for name/cuisine/city"),
    price_range: Optional[str] = Query(None, description="₹, ₹₹, ₹₹₹, ₹₹₹₹"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    open_now: Optional[bool] = Query(None),
    table_status: Optional[TableStatus] = Query(None),
    food_status: Optional[FoodStatus] = Query(None),
    parking_status: Optional[ParkingStatus] = Query(None),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    max_distance_km: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("rating", description="rating, distance, wait_time, price_asc, price_desc"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Restaurant)

    # City filter
    if city and city.strip() and city.lower() != "all":
        query = query.where(Restaurant.city.ilike(f"%{city.strip()}%"))

    # Cuisine filter
    if cuisine and cuisine.strip() and cuisine.lower() != "all":
        query = query.where(Restaurant.cuisine.ilike(f"%{cuisine.strip()}%"))

    # Keyword search with intelligent synonym expansion for Lunch, Breakfast, Dinner, Fast Food
    if search and search.strip():
        s_clean = search.strip().lower()
        search_terms = [f"%{search.strip()}%"]
        
        if "lunch" in s_clean:
            search_terms.extend(["%meals%", "%thali%", "%biryani%", "%sappadu%", "%curry%", "%rice%", "%lunch%", "%banana leaf%", "%full meals%"])
        elif "breakfast" in s_clean:
            search_terms.extend(["%tiffin%", "%idli%", "%dosa%", "%pongal%", "%poori%", "%vada%", "%morning%", "%breakfast%", "%kaapi%", "%coffee%"])
        elif "dinner" in s_clean:
            search_terms.extend(["%chettinad%", "%parotta%", "%dosa%", "%biryani%", "%night%", "%roast%", "%dinner%", "%salna%", "%kothu%", "%kari dosa%"])
        elif "fast" in s_clean:
            search_terms.extend(["%snack%", "%kothu%", "%burger%", "%roll%", "%cafe%", "%street%", "%fast food%", "%fastfood%", "%thattu vadai%"])
        
        or_clauses = []
        for term in search_terms:
            or_clauses.extend([
                Restaurant.name.ilike(term),
                Restaurant.cuisine.ilike(term),
                Restaurant.city.ilike(term),
                Restaurant.description.ilike(term)
            ])
        query = query.where(or_(*or_clauses))

    # Price range
    if price_range:
        query = query.where(Restaurant.price_range == price_range)

    # Min rating
    if min_rating:
        query = query.where(Restaurant.rating >= min_rating)

    # Open now
    if open_now is True:
        query = query.where(Restaurant.is_open == True)

    # Table availability
    if table_status:
        query = query.where(Restaurant.table_status == table_status)

    # Food availability
    if food_status:
        query = query.where(Restaurant.food_status == food_status)

    # Parking availability
    if parking_status:
        query = query.where(Restaurant.parking_status == parking_status)

    result = await db.execute(query)
    restaurants = result.scalars().all()

    # Calculate distance and travel time if user coordinates provided
    output = []
    for r in restaurants:
        r_out = RestaurantOut.model_validate(r)
        if user_lat is not None and user_lng is not None:
            dist = calculate_distance(user_lat, user_lng, r.lat, r.lng)
            r_out.distance_km = dist
            # Estimate travel time based on avg city speed 25 km/h
            r_out.travel_time_mins = max(5, int((dist / 25.0) * 60))
        else:
            # Default mock distance from center of Chennai
            dist = calculate_distance(13.0827, 80.2707, r.lat, r.lng)
            r_out.distance_km = dist
            r_out.travel_time_mins = max(5, int((dist / 25.0) * 60))

        if max_distance_km is not None and r_out.distance_km > max_distance_km:
            continue

        output.append(r_out)

    # Sort results
    if sort_by == "distance" and any(x.distance_km is not None for x in output):
        output.sort(key=lambda x: x.distance_km or 9999)
    elif sort_by == "wait_time":
        output.sort(key=lambda x: x.wait_time_mins)
    elif sort_by == "price_asc":
        output.sort(key=lambda x: x.avg_cost_for_two)
    elif sort_by == "price_desc":
        output.sort(key=lambda x: x.avg_cost_for_two, reverse=True)
    else:
        # Default rating desc
        output.sort(key=lambda x: x.rating, reverse=True)

    return output

@router.get("/cities", response_model=List[str])
async def get_tamil_nadu_cities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Restaurant.city).distinct())
    cities = [row[0] for row in result.all() if row[0]]
    # Ensure primary TN cities are represented
    all_tn_cities = [
        "Chennai", "Coimbatore", "Madurai", "Salem", "Erode", "Tiruchirappalli", 
        "Tirunelveli", "Thanjavur", "Dindigul", "Ooty", "Tiruppur", "Thoothukudi", 
        "Vellore", "Hosur", "Kanchipuram"
    ]
    merged = list(dict.fromkeys(cities + all_tn_cities))
    return sorted(merged)

@router.get("/cuisines", response_model=List[str])
async def get_cuisines(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Restaurant.cuisine).distinct())
    cuisines = [row[0] for row in result.all() if row[0]]
    standard_cuisines = [
        "Tamil Cuisine", "South Indian", "Chettinad", "Kongunadu", "Madurai Cuisine",
        "Vegetarian", "Non-Vegetarian", "Biryani", "Seafood", "Dosa", "Idli",
        "Parotta", "Traditional Meals", "Street Food", "Multicuisine"
    ]
    merged = list(dict.fromkeys(cuisines + standard_cuisines))
    return sorted(merged)

@router.get("/trending", response_model=List[RestaurantOut])
async def get_trending_restaurants(
    limit: int = 8,
    db: AsyncSession = Depends(get_db)
):
    """Returns restaurants trending by recent bookings + rating composite score."""
    from sqlalchemy import desc, func
    from app.models import Booking, BookingStatus
    from datetime import timedelta

    # Get top-booked restaurant IDs in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    booking_counts = await db.execute(
        select(
            Booking.restaurant_id,
            func.count(Booking.id).label("book_count")
        )
        .where(Booking.created_at >= thirty_days_ago)
        .group_by(Booking.restaurant_id)
        .order_by(desc("book_count"))
        .limit(limit * 2)
    )
    hot_ids = [row[0] for row in booking_counts.all()]

    if hot_ids:
        # Fetch those restaurants ordered by booking count
        result = await db.execute(
            select(Restaurant).where(Restaurant.id.in_(hot_ids))
        )
        restaurants = result.scalars().all()
        # Sort by composite: 0.6 * rating + 0.4 * normalized_bookings
        max_books = len(hot_ids)
        def score(r):
            idx_score = (max_books - hot_ids.index(r.id)) / max(max_books, 1)
            return 0.6 * r.rating + 0.4 * idx_score * 5
        restaurants = sorted(restaurants, key=score, reverse=True)
    else:
        # Fallback: top rated open restaurants
        result = await db.execute(
            select(Restaurant)
            .where(Restaurant.is_open == True)
            .order_by(desc(Restaurant.rating))
            .limit(limit)
        )
        restaurants = result.scalars().all()

    output = []
    for r in restaurants[:limit]:
        r_out = RestaurantOut.model_validate(r)
        dist = calculate_distance(13.0827, 80.2707, r.lat, r.lng)
        r_out.distance_km = dist
        r_out.travel_time_mins = max(5, int((dist / 25.0) * 60))
        output.append(r_out)
    return output

@router.get("/autocomplete")
async def autocomplete_restaurants(
    q: str = Query("", min_length=1),
    db: AsyncSession = Depends(get_db)
):
    """Returns lightweight name/city/cuisine suggestions for live autocomplete."""
    if not q or len(q.strip()) < 1:
        return []
    kw = f"%{q.strip()}%"
    result = await db.execute(
        select(Restaurant.id, Restaurant.name, Restaurant.city, Restaurant.cuisine, Restaurant.rating)
        .where(
            or_(
                Restaurant.name.ilike(kw),
                Restaurant.city.ilike(kw),
                Restaurant.cuisine.ilike(kw),
            )
        )
        .order_by(Restaurant.rating.desc())
        .limit(8)
    )
    suggestions = []
    for row in result.all():
        suggestions.append({
            "id": row[0],
            "name": row[1],
            "city": row[2],
            "cuisine": row[3],
            "rating": row[4],
            "type": "restaurant"
        })
    return suggestions


@router.get("/{restaurant_id}", response_model=RestaurantDetailOut)
async def get_restaurant_details(
    restaurant_id: int, 
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .options(
            selectinload(Restaurant.menu_items),
            selectinload(Restaurant.tables)
        )
    )
    result = await db.execute(query)
    restaurant = result.scalars().first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    out = RestaurantDetailOut.model_validate(restaurant)
    if user_lat is not None and user_lng is not None:
        dist = calculate_distance(user_lat, user_lng, restaurant.lat, restaurant.lng)
        out.distance_km = dist
        out.travel_time_mins = max(5, int((dist / 25.0) * 60))
    else:
        dist = calculate_distance(13.0827, 80.2707, restaurant.lat, restaurant.lng)
        out.distance_km = dist
        out.travel_time_mins = max(5, int((dist / 25.0) * 60))
    return out

@router.patch("/{restaurant_id}/status", response_model=RestaurantOut)
async def update_restaurant_availability(
    restaurant_id: int,
    status_update: RestaurantStatusUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalars().first()
    # Automatically associate restaurant ownership if operated by this owner
    if current_user.role == UserRole.RESTAURANT_OWNER:
        restaurant.owner_id = current_user.id

    if status_update.is_open is not None:
        restaurant.is_open = status_update.is_open
    if status_update.table_status is not None:
        restaurant.table_status = status_update.table_status
    if status_update.food_status is not None:
        restaurant.food_status = status_update.food_status
    if status_update.parking_status is not None:
        restaurant.parking_status = status_update.parking_status
    if status_update.wait_time_mins is not None:
        restaurant.wait_time_mins = status_update.wait_time_mins

    await db.commit()
    await db.refresh(restaurant)

    out = RestaurantOut.model_validate(restaurant)
    
    # Broadcast live status update over WebSocket
    await ws_manager.broadcast({
        "type": "AVAILABILITY_UPDATE",
        "restaurant_id": restaurant.id,
        "is_open": restaurant.is_open,
        "table_status": restaurant.table_status.value,
        "food_status": restaurant.food_status.value,
        "parking_status": restaurant.parking_status.value,
        "wait_time_mins": restaurant.wait_time_mins
    })

    return out

# WebSocket endpoint for real-time live availability broadcast
@router.websocket("/ws/live-updates")
async def live_availability_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive and listen
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
