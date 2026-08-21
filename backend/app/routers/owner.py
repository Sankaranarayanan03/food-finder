import re
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_, desc
from app.database import get_db
from app.models import (
    User, UserRole, Restaurant, RestaurantTable, MenuItem, Booking,
    BookingStatus, Complaint, Review, LoyaltyPoint, TableStatus, FoodStatus, ParkingStatus
)
from app.schemas import (
    RestaurantOut, RestaurantDetailOut, BookingOut, TableOut, TableCreate,
    MenuItemOut, MenuItemCreate, ComplaintOut, ReviewOut,
    OwnerAIQueryRequest, OwnerAIQueryResponse, OwnerAIMutationRequest, OwnerAIMutationResponse
)
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/owner", tags=["Restaurant Owner Portal"])

@router.post("/ai-query", response_model=OwnerAIQueryResponse)
async def owner_ai_assistant_query(
    payload: OwnerAIQueryRequest,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Find restaurant owned by current_user or payload.restaurant_id
    if payload.restaurant_id:
        rest_res = await db.execute(select(Restaurant).where(Restaurant.id == payload.restaurant_id))
    else:
        rest_res = await db.execute(select(Restaurant).where(Restaurant.owner_id == current_user.id))
    
    rest = rest_res.scalars().first()
    if not rest:
        # Fallback to first restaurant if admin or test owner
        r_all = await db.execute(select(Restaurant).limit(1))
        rest = r_all.scalars().first()
        
    if not rest:
        return OwnerAIQueryResponse(
            query=payload.query,
            answer="No restaurant associated with your account was found."
        )

    q = payload.query.lower()
    rest_id = rest.id
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # 1. Operational Mutation Requests (Confirm-Then-Execute Flow)
    wait_match = re.search(r'(?:set|update|change)\s*(?:waiting|wait)?\s*time\s*(?:to)?\s*(\d+)', q)
    if wait_match:
        new_wait = int(wait_match.group(1))
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⚠️ **Confirm Operational Change:**\n\nDo you want to update the live waiting time for **{rest.name}** to **{new_wait} minutes**?",
            requires_confirmation=True,
            pending_action="update_wait_time",
            pending_params={"restaurant_id": rest_id, "wait_time_mins": new_wait}
        )

    if "mark tables full" in q or "set table full" in q or "tables full" in q:
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⚠️ **Confirm Operational Change:**\n\nDo you want to mark table status as **FULL** for **{rest.name}**?",
            requires_confirmation=True,
            pending_action="update_table_status",
            pending_params={"restaurant_id": rest_id, "table_status": "FULL"}
        )

    if "mark tables available" in q or "set table available" in q or "tables available" in q:
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⚠️ **Confirm Operational Change:**\n\nDo you want to set table status to **AVAILABLE** for **{rest.name}**?",
            requires_confirmation=True,
            pending_action="update_table_status",
            pending_params={"restaurant_id": rest_id, "table_status": "AVAILABLE"}
        )

    if "close restaurant" in q or "mark restaurant closed" in q or "set closed" in q:
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⚠️ **Confirm Operational Change:**\n\nDo you want to mark **{rest.name}** as **CLOSED** for current service?",
            requires_confirmation=True,
            pending_action="update_open_status",
            pending_params={"restaurant_id": rest_id, "is_open": False}
        )

    if "open restaurant" in q or "mark restaurant open" in q or "set open" in q:
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⚠️ **Confirm Operational Change:**\n\nDo you want to mark **{rest.name}** as **OPEN** for service?",
            requires_confirmation=True,
            pending_action="update_open_status",
            pending_params={"restaurant_id": rest_id, "is_open": True}
        )

    # 2. Cancelled Bookings ("cancelled", "cancelled bookings")
    if "cancelled" in q:
        cancelled_res = await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.status == BookingStatus.CANCELLED)))
        cancelled_cnt = cancelled_res.scalar() or 0
        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"🚫 **{rest.name} Cancelled Bookings:**\n\n• Total Cancelled Bookings: **{cancelled_cnt}**\n• Automatic table release: Active",
            data={"cancelled": cancelled_cnt}
        )

    # 3. Check-ins & Passcodes ("check-in", "checkin", "checked in", "code", "verify")
    if "check-in" in q or "checkin" in q or "checked in" in q or "code" in q or "verify" in q:
        checked_in = (await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.status == BookingStatus.CHECKED_IN)))).scalar() or 0
        pending_checkins = (await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.status == BookingStatus.CONFIRMED)))).scalar() or 0

        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"🔑 **{rest.name} Today's Check-In Summary:**\n\n• Verified Check-Ins Today: **{checked_in}** diners\n• Pending Arrivals: **{pending_checkins}** guests expected\n• Verify 6-digit codes in your Owner Terminal.",
            data={"checked_in": checked_in, "pending_checkins": pending_checkins}
        )

    # 4. Today's Bookings & Expected Guests ("booking", "guest", "expected", "tonight", "today")
    if "booking" in q or "guest" in q or "expected" in q or "tonight" in q or "today" in q:
        total_b = (await db.execute(select(func.count(Booking.id)).where(Booking.restaurant_id == rest_id))).scalar() or 0
        today_b = (await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.booking_date == today_str)))).scalar() or 0
        confirmed = (await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.status == BookingStatus.CONFIRMED)))).scalar() or 0
        checked_in = (await db.execute(select(func.count(Booking.id)).where(and_(Booking.restaurant_id == rest_id, Booking.status == BookingStatus.CHECKED_IN)))).scalar() or 0
        
        # Expected total guest count
        guest_sum_res = await db.execute(select(func.sum(Booking.guest_count)).where(and_(Booking.restaurant_id == rest_id, Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]))))
        expected_guests = guest_sum_res.scalar() or 0

        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"📅 **{rest.name} Today's Booking Overview:**\n\n• Today's Bookings: **{today_b}**\n• Expected Guests Tonight: **{expected_guests}** diners\n• Confirmed Pending: **{confirmed}** | Checked-In: **{checked_in}**\n• Lifetime Total: **{total_b}**",
            data={"today_b": today_b, "expected_guests": expected_guests, "confirmed": confirmed, "checked_in": checked_in}
        )

    # 5. Popular Menu Items ("popular menu", "popular items", "menu")
    if "popular" in q or "menu" in q:
        items_res = await db.execute(select(MenuItem).where(MenuItem.restaurant_id == rest_id).limit(6))
        items = items_res.scalars().all()
        if items:
            item_list = "\n".join([f"• **{item.name}** ({item.category}) - ₹{item.price} [{'Available' if item.is_available else 'Unavailable'}]" for item in items])
            return OwnerAIQueryResponse(
                query=payload.query,
                answer=f"🍛 **{rest.name} Top Menu Items:**\n\n{item_list}",
                data={"menu_items_count": len(items)}
            )
        else:
            return OwnerAIQueryResponse(
                query=payload.query,
                answer=f"No menu items registered yet for **{rest.name}**."
            )

    # 6. Busiest Booking Time ("busiest", "peak", "busiest booking time")
    if "busiest" in q or "peak" in q or "busiest time" in q:
        time_res = await db.execute(
            select(Booking.booking_time, func.count(Booking.id).label("cnt"))
            .where(Booking.restaurant_id == rest_id)
            .group_by(Booking.booking_time)
            .order_by(desc("cnt"))
            .limit(3)
        )
        t_data = time_res.all()
        if t_data:
            top_t_str = ", ".join([f"{t[0]} ({t[1]} bookings)" for t in t_data])
            return OwnerAIQueryResponse(
                query=payload.query,
                answer=f"⏰ **{rest.name} Peak Booking Times:**\n\n• Busiest Slot: **{t_data[0][0]}**\n• Top Demand Times: {top_t_str}",
                data={"busiest_slot": t_data[0][0]}
            )
        else:
            return OwnerAIQueryResponse(
                query=payload.query,
                answer=f"• Busiest Slot: **19:30 - 21:00** (Standard peak dinner hour for {rest.city})."
            )

    # 7. Tables, Waiting Time & Parking ("table", "wait", "parking", "capacity", "8 pm")
    if "table" in q or "wait" in q or "parking" in q or "capacity" in q:
        tables_res = await db.execute(select(func.count(RestaurantTable.id)).where(RestaurantTable.restaurant_id == rest_id))
        total_tables = tables_res.scalar() or 0

        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"🪑 **{rest.name} Operational Live Status:**\n\n• Table Status: **{rest.table_status.value}** ({total_tables} registered physical tables)\n• Live Wait Time: **{rest.wait_time_mins} minutes**\n• Parking Status: **{rest.parking_status.value}**\n• Restaurant Open Status: **{'OPEN' if rest.is_open else 'CLOSED'}**",
            data={"table_status": rest.table_status.value, "wait_time_mins": rest.wait_time_mins, "parking_status": rest.parking_status.value, "is_open": rest.is_open}
        )

    # 8. Reviews, Rating & Complaints & Loyalty ("review", "rating", "complaint", "loyalty")
    if "review" in q or "rating" in q or "complaint" in q or "loyalty" in q:
        loyalty_res = await db.execute(select(func.sum(LoyaltyPoint.points)).where(LoyaltyPoint.restaurant_id == rest_id))
        loyalty_pts = loyalty_res.scalar() or 0
        cmp_res = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.restaurant_id == rest_id, Complaint.status != "RESOLVED")))
        pending_cmp = cmp_res.scalar() or 0

        return OwnerAIQueryResponse(
            query=payload.query,
            answer=f"⭐ **{rest.name} Rating & Reputation:**\n\n• Average Rating: **{rest.rating}★** ({rest.review_count} verified reviews)\n• Pending Complaints: **{pending_cmp}**\n• Total Loyalty Points Issued: **{loyalty_pts} pts**",
            data={"rating": rest.rating, "loyalty_pts": loyalty_pts, "pending_cmp": pending_cmp}
        )

    # Unrecognized query fallback
    return OwnerAIQueryResponse(
        query=payload.query,
        answer="I don't have enough verified information to answer that."
    )


@router.post("/ai-execute-mutation", response_model=OwnerAIMutationResponse)
async def owner_ai_execute_mutation(
    payload: OwnerAIMutationRequest,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == payload.restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    action = payload.action
    params = payload.params

    if action == "update_wait_time":
        new_wait = int(params.get("wait_time_mins", 15))
        rest.wait_time_mins = new_wait
        rest.last_status_updated = datetime.utcnow()
        await db.commit()
        await db.refresh(rest)
        return OwnerAIMutationResponse(
            success=True,
            message=f"✓ Waiting time updated to {new_wait} minutes for {rest.name}.",
            updated_data={"wait_time_mins": rest.wait_time_mins}
        )

    if action == "update_table_status":
        status_val = params.get("table_status", "AVAILABLE")
        rest.table_status = TableStatus.FULL if status_val == "FULL" else TableStatus.AVAILABLE
        rest.last_status_updated = datetime.utcnow()
        await db.commit()
        await db.refresh(rest)
        return OwnerAIMutationResponse(
            success=True,
            message=f"✓ Table status updated to {rest.table_status.value} for {rest.name}.",
            updated_data={"table_status": rest.table_status.value}
        )

    if action == "update_open_status":
        is_open_val = bool(params.get("is_open", True))
        rest.is_open = is_open_val
        rest.last_status_updated = datetime.utcnow()
        await db.commit()
        await db.refresh(rest)
        return OwnerAIMutationResponse(
            success=True,
            message=f"✓ Operational status updated to {'OPEN' if rest.is_open else 'CLOSED'} for {rest.name}.",
            updated_data={"is_open": rest.is_open}
        )

    return OwnerAIMutationResponse(
        success=False,
        message="Unrecognized operational action."
    )

@router.get("/restaurants", response_model=List[RestaurantOut])
async def get_owner_restaurants(
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Restaurant).order_by(Restaurant.name.asc())
    result = await db.execute(query)
    restaurants = result.scalars().all()
    return [RestaurantOut.model_validate(r) for r in restaurants]

@router.get("/dashboard/{restaurant_id}")
async def get_owner_dashboard_metrics(
    restaurant_id: int,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve restaurant details
    rest_res = await db.execute(
        select(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .options(
            selectinload(Restaurant.tables),
            selectinload(Restaurant.menu_items)
        )
    )
    restaurant = rest_res.scalars().first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    # Total Bookings
    total_b_res = await db.execute(
        select(func.count(Booking.id)).where(Booking.restaurant_id == restaurant_id)
    )
    total_bookings = total_b_res.scalar() or 0

    # Confirmed & Checked-in counts
    confirmed_b_res = await db.execute(
        select(func.count(Booking.id)).where(
            and_(Booking.restaurant_id == restaurant_id, Booking.status == BookingStatus.CONFIRMED)
        )
    )
    active_confirmed = confirmed_b_res.scalar() or 0

    checked_in_res = await db.execute(
        select(func.count(Booking.id)).where(
            and_(Booking.restaurant_id == restaurant_id, Booking.status == BookingStatus.CHECKED_IN)
        )
    )
    checked_in_count = checked_in_res.scalar() or 0

    # Total Loyalty points issued
    loyalty_res = await db.execute(
        select(func.sum(LoyaltyPoint.points)).where(LoyaltyPoint.restaurant_id == restaurant_id)
    )
    total_loyalty_awarded = loyalty_res.scalar() or 0

    # Pending Complaints
    complaints_res = await db.execute(
        select(func.count(Complaint.id)).where(
            and_(Complaint.restaurant_id == restaurant_id, Complaint.status != "RESOLVED")
        )
    )
    pending_complaints = complaints_res.scalar() or 0

    # Recent Bookings & Today's Check-ins
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    bookings_res = await db.execute(
        select(Booking)
        .where(Booking.restaurant_id == restaurant_id)
        .options(selectinload(Booking.customer), selectinload(Booking.table))
        .order_by(Booking.created_at.desc())
        .limit(20)
    )
    recent_bookings = []
    today_checkins = []
    
    for b in bookings_res.scalars().all():
        b_dict = {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "customer_name": b.customer.full_name if b.customer else "Guest",
            "customer_phone": b.customer.phone if b.customer else None,
            "booking_date": b.booking_date,
            "booking_time": b.booking_time,
            "guest_count": b.guest_count,
            "status": b.status,
            "table_number": b.table.table_number if b.table else "Auto-assigned",
            "verification_code": b.verification_code,
            "verification_status": b.verification_status if hasattr(b, 'verification_status') else "PENDING",
            "code_used": b.code_used if hasattr(b, 'code_used') else False,
            "check_in_time": b.checked_in_at or b.check_in_time
        }
        recent_bookings.append(b_dict)

        # Today's check-ins filter: booking date is today OR checked in today
        if b.booking_date == today_str or (b.checked_in_at and b.checked_in_at.strftime("%Y-%m-%d") == today_str):
            today_checkins.append({
                "booking_id": b.id,
                "booking_ref": b.booking_ref,
                "customer_name": b.customer.full_name if b.customer else "Guest",
                "booking_time": f"{b.booking_date} {b.booking_time}",
                "guest_count": b.guest_count,
                "verification_status": b.verification_status if hasattr(b, 'verification_status') else ("VERIFIED" if b.status == BookingStatus.CHECKED_IN else "PENDING"),
                "check_in_time": b.checked_in_at or b.check_in_time,
                "status": b.status
            })

    return {
        "restaurant": RestaurantOut.model_validate(restaurant),
        "stats": {
            "total_bookings": total_bookings,
            "active_confirmed": active_confirmed,
            "checked_in_visits": checked_in_count,
            "loyalty_points_awarded": total_loyalty_awarded,
            "pending_complaints": pending_complaints,
            "tables_count": len(restaurant.tables),
            "menu_items_count": len(restaurant.menu_items)
        },
        "recent_bookings": recent_bookings,
        "today_checkins": today_checkins
    }

@router.get("/today-checkins/{restaurant_id}")
async def get_today_checkins(
    restaurant_id: int,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = rest_res.scalars().first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    bookings_res = await db.execute(
        select(Booking)
        .where(
            and_(
                Booking.restaurant_id == restaurant_id,
                Booking.booking_date == today_str
            )
        )
        .options(selectinload(Booking.customer))
        .order_by(Booking.booking_time.asc())
    )

    items = []
    for b in bookings_res.scalars().all():
        items.append({
            "booking_id": b.id,
            "booking_ref": b.booking_ref,
            "customer_name": b.customer.full_name if b.customer else "Guest",
            "booking_time": b.booking_time,
            "guest_count": b.guest_count,
            "verification_status": b.verification_status if hasattr(b, 'verification_status') else ("VERIFIED" if b.status == BookingStatus.CHECKED_IN else "PENDING"),
            "check_in_time": b.checked_in_at or b.check_in_time,
            "status": b.status
        })
    return items

@router.get("/tables/{restaurant_id}", response_model=List[TableOut])
async def get_restaurant_tables(
    restaurant_id: int,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    result = await db.execute(
        select(RestaurantTable).where(RestaurantTable.restaurant_id == restaurant_id)
    )
    return [TableOut.model_validate(t) for t in result.scalars().all()]

@router.post("/tables/{restaurant_id}", response_model=TableOut)
async def add_table(
    restaurant_id: int,
    table_in: TableCreate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    new_t = RestaurantTable(
        restaurant_id=restaurant_id,
        table_number=table_in.table_number,
        capacity=table_in.capacity,
        is_active=table_in.is_active
    )
    db.add(new_t)
    await db.commit()
    await db.refresh(new_t)
    return TableOut.model_validate(new_t)

@router.post("/menu/{restaurant_id}", response_model=MenuItemOut)
async def add_menu_item(
    restaurant_id: int,
    item_in: MenuItemCreate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    menu_item = MenuItem(
        restaurant_id=restaurant_id,
        name=item_in.name,
        category=item_in.category,
        price=item_in.price,
        is_vegetarian=item_in.is_vegetarian,
        is_available=item_in.is_available,
        description=item_in.description,
        image_url=item_in.image_url
    )
    db.add(menu_item)
    await db.commit()
    await db.refresh(menu_item)
    return MenuItemOut.model_validate(menu_item)
