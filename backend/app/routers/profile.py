from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_
from app.database import get_db
from app.models import (
    User, Booking, BookingStatus, LoyaltyPoint, Review, Favorite, Restaurant
)
from app.schemas import LoyaltyPointOut, FrequentVisitorStat, RestaurantOut
from app.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Customer Profile"])

@router.get("/me")
async def get_customer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Total Loyalty Points
    points_res = await db.execute(
        select(func.sum(LoyaltyPoint.points)).where(LoyaltyPoint.customer_id == current_user.id)
    )
    total_loyalty_points = points_res.scalar() or 0

    # 2. Total Verified Visits (Checked-in bookings)
    visits_res = await db.execute(
        select(func.count(Booking.id)).where(
            and_(
                Booking.customer_id == current_user.id,
                Booking.status == BookingStatus.CHECKED_IN
            )
        )
    )
    verified_visits_count = visits_res.scalar() or 0

    # 3. Total Bookings count
    bookings_res = await db.execute(
        select(func.count(Booking.id)).where(Booking.customer_id == current_user.id)
    )
    total_bookings_count = bookings_res.scalar() or 0

    # 4. Total Reviews written
    reviews_res = await db.execute(
        select(func.count(Review.id)).where(Review.customer_id == current_user.id)
    )
    total_reviews_count = reviews_res.scalar() or 0

    # 5. Frequent Visitor Tracking (Per restaurant visit count)
    freq_res = await db.execute(
        select(
            Booking.restaurant_id,
            Restaurant.name,
            Restaurant.city,
            func.count(Booking.id).label("visit_count"),
            func.max(Booking.check_in_time).label("last_visit")
        )
        .join(Restaurant, Booking.restaurant_id == Restaurant.id)
        .where(
            and_(
                Booking.customer_id == current_user.id,
                Booking.status == BookingStatus.CHECKED_IN
            )
        )
        .group_by(Booking.restaurant_id, Restaurant.name, Restaurant.city)
        .order_by(func.count(Booking.id).desc())
    )
    frequent_restaurants = []
    for row in freq_res.all():
        frequent_restaurants.append({
            "restaurant_id": row[0],
            "restaurant_name": row[1],
            "city": row[2],
            "visit_count": row[3],
            "last_visit": row[4]
        })

    # 6. Favorite Restaurants
    fav_res = await db.execute(
        select(Restaurant)
        .join(Favorite, Favorite.restaurant_id == Restaurant.id)
        .where(Favorite.customer_id == current_user.id)
    )
    favorites = [RestaurantOut.model_validate(r) for r in fav_res.scalars().all()]

    # 7. Preferred / Favorite Cuisines derived from bookings
    cuisine_res = await db.execute(
        select(Restaurant.cuisine, func.count(Booking.id))
        .join(Restaurant, Booking.restaurant_id == Restaurant.id)
        .where(Booking.customer_id == current_user.id)
        .group_by(Restaurant.cuisine)
        .order_by(func.count(Booking.id).desc())
        .limit(3)
    )
    favorite_cuisines = [row[0] for row in cuisine_res.all()]
    if not favorite_cuisines:
        favorite_cuisines = ["Chettinad", "South Indian", "Biryani"]

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "created_at": current_user.created_at
        },
        "stats": {
            "loyalty_points": total_loyalty_points,
            "verified_visits": verified_visits_count,
            "total_bookings": total_bookings_count,
            "reviews_written": total_reviews_count
        },
        "frequent_visits": frequent_restaurants,
        "favorite_cuisines": favorite_cuisines,
        "favorites": favorites
    }

@router.post("/favorites/toggle/{restaurant_id}")
async def toggle_favorite(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Favorite).where(
            and_(
                Favorite.customer_id == current_user.id,
                Favorite.restaurant_id == restaurant_id
            )
        )
    )
    existing_fav = result.scalars().first()
    if existing_fav:
        await db.delete(existing_fav)
        await db.commit()
        return {"is_favorite": False, "message": "Removed from favorites"}
    else:
        new_fav = Favorite(customer_id=current_user.id, restaurant_id=restaurant_id)
        db.add(new_fav)
        await db.commit()
        return {"is_favorite": True, "message": "Added to favorites"}

@router.get("/loyalty")
async def get_loyalty_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns loyalty tier, progress to next tier, points history, and tier perks."""
    # Total points
    points_res = await db.execute(
        select(func.sum(LoyaltyPoint.points)).where(LoyaltyPoint.customer_id == current_user.id)
    )
    total_points = points_res.scalar() or 0

    # Tier logic: Bronze < 50, Silver < 150, Gold < 350, Platinum 350+
    TIERS = [
        {"name": "Bronze", "min": 0, "max": 50, "color": "#CD7F32", "perks": ["5% off next booking", "Priority waitlist"]},
        {"name": "Silver", "min": 50, "max": 150, "color": "#94A3B8", "perks": ["10% off on weekdays", "Free table upgrade", "Complimentary dessert"]},
        {"name": "Gold", "min": 150, "max": 350, "color": "#F59E0B", "perks": ["15% off all bookings", "Express check-in", "Birthday special", "Reserved premium table"]},
        {"name": "Platinum", "min": 350, "max": 9999, "color": "#7C3AED", "perks": ["20% off always", "VIP lounge access", "Chef's table", "Complimentary welcome drink", "Personal concierge"]},
    ]

    current_tier = TIERS[0]
    next_tier = TIERS[1]
    for i, t in enumerate(TIERS):
        if total_points >= t["min"]:
            current_tier = t
            next_tier = TIERS[i + 1] if i + 1 < len(TIERS) else None

    if next_tier:
        progress_pct = int(((total_points - current_tier["min"]) / (next_tier["min"] - current_tier["min"])) * 100)
        points_to_next = next_tier["min"] - total_points
    else:
        progress_pct = 100
        points_to_next = 0

    # Points history (last 10)
    history_res = await db.execute(
        select(
            LoyaltyPoint.points,
            LoyaltyPoint.earned_at,
            Restaurant.name.label("restaurant_name"),
            Booking.booking_ref
        )
        .join(Restaurant, LoyaltyPoint.restaurant_id == Restaurant.id)
        .join(Booking, LoyaltyPoint.booking_id == Booking.id)
        .where(LoyaltyPoint.customer_id == current_user.id)
        .order_by(LoyaltyPoint.earned_at.desc())
        .limit(10)
    )
    history = []
    for row in history_res.all():
        history.append({
            "points": row[0],
            "earned_at": row[1],
            "restaurant_name": row[2],
            "booking_ref": row[3]
        })

    return {
        "total_points": total_points,
        "current_tier": current_tier,
        "next_tier": next_tier,
        "progress_pct": min(progress_pct, 100),
        "points_to_next": max(points_to_next, 0),
        "tiers": TIERS,
        "history": history
    }
