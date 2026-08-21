import time
from datetime import datetime, date, timedelta
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, update
from app.database import get_db
from app.models import (
    Booking, BookingStatus, LoyaltyPoint, Restaurant, User, 
    UserRole, VerificationStatus
)
from app.schemas import CheckInRequest, CheckInResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/checkin", tags=["Restaurant Check-in"])

# In-memory sliding-window rate limiter for brute-force protection on 6-digit codes
# Maps user_id / ip -> list of failed attempt timestamps
FAILED_ATTEMPTS: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = 15
RATE_LIMIT_WINDOW_SECONDS = 60

def check_rate_limit(key: str):
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(key, [])
    # Filter attempts within the window
    valid_attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    FAILED_ATTEMPTS[key] = valid_attempts

    if len(valid_attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many invalid check-in attempts. Please wait 1 minute before trying again."
        )

def record_failed_attempt(key: str):
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(key, [])
    attempts.append(now)
    FAILED_ATTEMPTS[key] = attempts

@router.post("/verify-code", response_model=CheckInResponse)
async def verify_checkin_code(
    payload: CheckInRequest,
    request: Request,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    rate_limit_key = f"user_{current_user.id}"
    check_rate_limit(rate_limit_key)

    code = payload.verification_code.strip()
    if not code or len(code) != 6 or not code.isdigit():
        record_failed_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # Fetch restaurants owned by current user (if owner)
    owned_rest_ids = []
    if current_user.role == UserRole.RESTAURANT_OWNER:
        rest_res = await db.execute(select(Restaurant.id).where(Restaurant.owner_id == current_user.id))
        owned_rest_ids = [row[0] for row in rest_res.all()]
        if not owned_rest_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own any active restaurants to process check-ins."
            )

    # 1. Code exists check
    query = (
        select(Booking)
        .where(Booking.verification_code == code)
        .options(
            selectinload(Booking.customer),
            selectinload(Booking.restaurant)
        )
    )
    result = await db.execute(query)
    booking = result.scalars().first()

    if not booking:
        record_failed_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # 2. Code belongs to the restaurant the owner is logged into
    if current_user.role == UserRole.RESTAURANT_OWNER and booking.restaurant_id not in owned_rest_ids:
        record_failed_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # 3. Booking status is CONFIRMED (not CANCELLED)
    if booking.status == BookingStatus.CANCELLED:
        record_failed_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # 4. Booking date is valid for check-in (not far future or ancient past)
    try:
        b_date = datetime.strptime(booking.booking_date, "%Y-%m-%d").date()
        today = date.today()
        # Allow check-in today or within +/- 1 day for boundary edge-cases
        if b_date < (today - timedelta(days=2)) or b_date > (today + timedelta(days=2)):
            record_failed_attempt(rate_limit_key)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code."
            )
    except ValueError:
        pass

    # 5. Code has not already been used check
    if booking.code_used or booking.status == BookingStatus.CHECKED_IN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code already used."
        )

    # Atomic Concurrency Guard:
    # Update booking atomically WHERE id = booking.id AND code_used = False
    now = datetime.utcnow()
    stmt = (
        update(Booking)
        .where(and_(Booking.id == booking.id, Booking.code_used == False))
        .values(
            status=BookingStatus.CHECKED_IN,
            verification_status=VerificationStatus.VERIFIED,
            code_used=True,
            checked_in_at=now,
            check_in_time=now,
            verified_by=current_user.id
        )
    )
    update_res = await db.execute(stmt)
    if update_res.rowcount == 0:
        # Another concurrent request already processed this code
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code already used."
        )

    # Award Loyalty Points (+10 points) idempotently
    existing_points = await db.execute(
        select(LoyaltyPoint).where(LoyaltyPoint.booking_id == booking.id)
    )
    points_awarded = 0
    if not existing_points.scalars().first():
        loyalty = LoyaltyPoint(
            customer_id=booking.customer_id,
            restaurant_id=booking.restaurant_id,
            booking_id=booking.id,
            points=10,
            earned_at=now
        )
        db.add(loyalty)
        points_awarded = 10

    await db.commit()
    await db.refresh(booking)

    # Reset failed attempts counter on successful check-in
    FAILED_ATTEMPTS.pop(rate_limit_key, None)

    # Safe response: name, guests, time without leaking customer email/phone
    customer_display_name = booking.customer.full_name if booking.customer else "Valued Guest"
    restaurant_display_name = booking.restaurant.name if booking.restaurant else "Restaurant"

    return CheckInResponse(
        success=True,
        message="✓ CUSTOMER VERIFIED — ✓ CHECK-IN SUCCESSFUL",
        booking_ref=booking.booking_ref,
        customer_name=customer_display_name,
        restaurant_name=restaurant_display_name,
        guest_count=booking.guest_count,
        booking_time=f"{booking.booking_date} at {booking.booking_time}",
        points_awarded=points_awarded,
        check_in_time=booking.checked_in_at or now
    )
