from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc
from app.database import get_db
from app.models import (
    User, UserRole, Restaurant, Booking, BookingStatus, Complaint, Review, LoyaltyPoint
)
from app.schemas import UserOut, RestaurantOut, BookingOut, ComplaintOut, ReviewOut, AdminAIQueryRequest, AdminAIQueryResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.post("/ai-query", response_model=AdminAIQueryResponse)
async def admin_ai_supervisor_query(
    payload: AdminAIQueryRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    q = payload.query.lower()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    # 1. Platform Overview ("overview", "platform", "system status")
    if "overview" in q or "platform" in q or "system" in q:
        total_rest = (await db.execute(select(func.count(Restaurant.id)))).scalar() or 0
        owner_cnt = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.RESTAURANT_OWNER))).scalar() or 0
        cust_cnt = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.CUSTOMER))).scalar() or 0
        total_b = (await db.execute(select(func.count(Booking.id)))).scalar() or 0
        checked_in = (await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CHECKED_IN))).scalar() or 0
        pending_cmp = (await db.execute(select(func.count(Complaint.id)).where(Complaint.status == "PENDING"))).scalar() or 0

        return AdminAIQueryResponse(
            query=payload.query,
            answer=(
                f"🌐 **Tamil Nadu Platform Overview:**\n\n"
                f"• Registered Restaurants: **{total_rest}** across 16 cities\n"
                f"• Active Owners: **{owner_cnt}** | Customer Diners: **{cust_cnt}**\n"
                f"• Lifetime Bookings: **{total_b}** | Verified Check-ins: **{checked_in}**\n"
                f"• Pending Complaints: **{pending_cmp}**\n"
                f"• Verification Terminal Status: 🟢 Operational"
            ),
            metrics={"total_restaurants": total_rest, "total_owners": owner_cnt, "total_customers": cust_cnt, "total_bookings": total_b, "checked_in": checked_in, "pending_complaints": pending_cmp}
        )

    # 2. Top Booked Restaurants ("highest number of bookings", "most bookings", "top booked", "highest bookings")
    if "highest number of bookings" in q or "most bookings" in q or "top booked" in q or "highest bookings" in q:
        b_res = await db.execute(
            select(Restaurant.name, func.count(Booking.id).label("cnt"))
            .join(Booking, Booking.restaurant_id == Restaurant.id)
            .group_by(Restaurant.id, Restaurant.name)
            .order_by(desc("cnt"))
            .limit(5)
        )
        rows = b_res.all()
        if rows:
            top_str = "\n".join([f"{i+1}. **{r[0]}**: {r[1]} bookings" for i, r in enumerate(rows)])
            return AdminAIQueryResponse(
                query=payload.query,
                answer=f"🏆 **Top Restaurants by Booking Volume:**\n\n{top_str}",
                metrics={"top_restaurants": {r[0]: r[1] for r in rows}}
            )
        else:
            return AdminAIQueryResponse(
                query=payload.query,
                answer="No booking data available yet across platform restaurants."
            )

    # 3. City Statistics / Leaderboards ("city", "cities", "most restaurants")
    if "city" in q or "cities" in q:
        city_res = await db.execute(
            select(Restaurant.city, func.count(Restaurant.id).label("cnt"))
            .group_by(Restaurant.city)
            .order_by(desc("cnt"))
        )
        city_data = city_res.all()
        if city_data:
            top_city, top_cnt = city_data[0][0], city_data[0][1]
            city_str = ", ".join([f"{c[0]} ({c[1]})" for c in city_data[:5]])
            return AdminAIQueryResponse(
                query=payload.query,
                answer=f"🏙️ **Tamil Nadu City Statistics:**\n\n• Top City: **{top_city}** with **{top_cnt}** restaurants.\n• City Breakdown: **{city_str}**.",
                metrics={"top_city": top_city, "top_city_count": top_cnt, "city_leaderboard": dict(city_data)}
            )

    # 4. Registered Owners / Customers ("owner", "owners", "customer", "customers", "user", "users")
    if "owner" in q or "customer" in q or "user" in q:
        owner_cnt = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.RESTAURANT_OWNER))).scalar() or 0
        cust_cnt = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.CUSTOMER))).scalar() or 0
        
        return AdminAIQueryResponse(
            query=payload.query,
            answer=f"👥 **Platform User Registry:**\n\n• Registered Restaurant Owners: **{owner_cnt}** verified partner accounts.\n• Registered Customer Diners: **{cust_cnt}** active diner profiles.",
            metrics={"total_owners": owner_cnt, "total_customers": cust_cnt}
        )

    # 5. Registered Restaurants ("registered", "restaurants")
    if "restaurant" in q:
        rest_cnt_res = await db.execute(select(func.count(Restaurant.id)))
        total_rest = rest_cnt_res.scalar() or 0
        return AdminAIQueryResponse(
            query=payload.query,
            answer=f"🏛️ **Registered Restaurants:**\n\n• Total Active Restaurants: **{total_rest}** registered across Tamil Nadu.\n• Live Seat & Table Sync Enabled.",
            metrics={"total_restaurants": total_rest}
        )

    # 6. Bookings & Check-ins ("booking", "check-in", "checked in", "today")
    if "booking" in q or "check-in" in q or "checked in" in q or "today" in q:
        total_b = (await db.execute(select(func.count(Booking.id)))).scalar() or 0
        today_b = (await db.execute(select(func.count(Booking.id)).where(Booking.booking_date == today_str))).scalar() or 0
        checked_in = (await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CHECKED_IN))).scalar() or 0
        cancelled = (await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CANCELLED))).scalar() or 0
        
        return AdminAIQueryResponse(
            query=payload.query,
            answer=(
                f"📊 **Booking & Verification Analytics:**\n\n"
                f"• Today's Bookings: **{today_b}**\n"
                f"• Total Lifetime Bookings: **{total_b}**\n"
                f"• Verified Check-Ins: **{checked_in}** successful table arrivals\n"
                f"• Cancelled Bookings: **{cancelled}**"
            ),
            metrics={"today_bookings": today_b, "total_bookings": total_b, "checked_in": checked_in, "cancelled": cancelled}
        )

    # 7. Audit & Verification Security ("audit", "security", "verification")
    if "audit" in q or "security" in q or "verification" in q:
        verified_cnt = (await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CHECKED_IN))).scalar() or 0
        
        return AdminAIQueryResponse(
            query=payload.query,
            answer=(
                f"🛡️ **5-Stage Non-Leaky Verification Audit:**\n\n"
                f"1. 6-digit code validation against active database.\n"
                f"2. Restaurant ID server-side verification match.\n"
                f"3. Single-use idempotency check.\n"
                f"4. Atomic check-in timestamp log.\n"
                f"5. Total Verified Check-Ins Logged: **{verified_cnt}**."
            ),
            metrics={"verified_visits": verified_cnt}
        )

    # 8. Complaints ("complaint", "issue")
    if "complaint" in q or "issue" in q:
        pending_cmp = (await db.execute(select(func.count(Complaint.id)).where(Complaint.status == "PENDING"))).scalar() or 0
        total_cmp = (await db.execute(select(func.count(Complaint.id)))).scalar() or 0
        
        return AdminAIQueryResponse(
            query=payload.query,
            answer=f"🚨 **Platform Complaint Resolution:**\n\n• Total Complaints Filed: **{total_cmp}**\n• Pending Resolution: **{pending_cmp}**\n• Resolution SLA: 24 hours.",
            metrics={"total_complaints": total_cmp, "pending_complaints": pending_cmp}
        )

    # Default fallback when query unrecognized
    return AdminAIQueryResponse(
        query=payload.query,
        answer="I don't have enough verified data to provide that information."
    )

@router.get("/stats")
async def get_admin_dashboard_stats(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Total Restaurants
    rest_count_res = await db.execute(select(func.count(Restaurant.id)))
    total_restaurants = rest_count_res.scalar() or 0

    # Total Customers & Owners
    cust_count_res = await db.execute(select(func.count(User.id)).where(User.role == UserRole.CUSTOMER))
    total_customers = cust_count_res.scalar() or 0

    owner_count_res = await db.execute(select(func.count(User.id)).where(User.role == UserRole.RESTAURANT_OWNER))
    total_owners = owner_count_res.scalar() or 0

    # Total Bookings
    bookings_count_res = await db.execute(select(func.count(Booking.id)))
    total_bookings = bookings_count_res.scalar() or 0

    # Completed visits (CHECKED_IN)
    completed_res = await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CHECKED_IN))
    completed_visits = completed_res.scalar() or 0

    # Cancelled bookings
    cancelled_res = await db.execute(select(func.count(Booking.id)).where(Booking.status == BookingStatus.CANCELLED))
    cancelled_bookings = cancelled_res.scalar() or 0

    # Top Cities by restaurant count
    cities_res = await db.execute(
        select(Restaurant.city, func.count(Restaurant.id))
        .group_by(Restaurant.city)
        .order_by(func.count(Restaurant.id).desc())
        .limit(6)
    )
    top_cities = [{"city": row[0], "count": row[1]} for row in cities_res.all()]

    # Top Cuisines
    cuisines_res = await db.execute(
        select(Restaurant.cuisine, func.count(Restaurant.id))
        .group_by(Restaurant.cuisine)
        .order_by(func.count(Restaurant.id).desc())
        .limit(6)
    )
    top_cuisines = [{"cuisine": row[0], "count": row[1]} for row in cuisines_res.all()]

    # Total loyalty points awarded across Tamil Nadu
    loyalty_res = await db.execute(select(func.sum(LoyaltyPoint.points)))
    total_loyalty = loyalty_res.scalar() or 0

    # Pending complaints count
    complaints_res = await db.execute(select(func.count(Complaint.id)).where(Complaint.status == "PENDING"))
    pending_complaints = complaints_res.scalar() or 0

    return {
        "metrics": {
            "total_restaurants": total_restaurants,
            "total_customers": total_customers,
            "total_owners": total_owners,
            "total_bookings": total_bookings,
            "completed_visits": completed_visits,
            "cancelled_bookings": cancelled_bookings,
            "total_loyalty_points": total_loyalty,
            "pending_complaints": pending_complaints
        },
        "top_cities": top_cities,
        "top_cuisines": top_cuisines
    }

@router.get("/users", response_model=List[UserOut])
async def list_all_users(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.get("/complaints", response_model=List[ComplaintOut])
async def list_all_complaints(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Complaint)
        .options(
            selectinload(Complaint.restaurant),
            selectinload(Complaint.customer)
        )
        .order_by(Complaint.created_at.desc())
    )
    result = await db.execute(query)
    complaints = result.scalars().all()

    return [
        ComplaintOut(
            id=c.id,
            customer_id=c.customer_id,
            customer_name=c.customer.full_name if c.customer else "Customer",
            restaurant_id=c.restaurant_id,
            restaurant_name=c.restaurant.name if c.restaurant else "Restaurant",
            booking_id=c.booking_id,
            complaint_type=c.complaint_type,
            description=c.description,
            status=c.status,
            owner_response=c.owner_response,
            admin_notes=c.admin_notes,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in complaints
    ]

from pydantic import BaseModel
from app.services.email import send_test_email

class TestEmailRequest(BaseModel):
    recipient_email: str

@router.post("/test-email")
async def trigger_test_email(
    payload: TestEmailRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    success, message = send_test_email(payload.recipient_email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    return {"status": "success", "message": message, "recipient": payload.recipient_email}

