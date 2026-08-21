import secrets
import string
import logging
from datetime import datetime, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, func, or_
from app.database import get_db
from app.models import (
    Booking, BookingStatus, Restaurant, RestaurantTable, User, 
    UserRole, TableStatus, VerificationStatus
)
from app.schemas import BookingCreate, BookingOut
from app.auth import get_current_user, require_role
from app.services.email import send_booking_confirmation_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bookings", tags=["Bookings"])

def generate_verification_code() -> str:
    """Generate a cryptographically random 6-digit verification code"""
    return "".join(secrets.choice(string.digits) for _ in range(6))

def generate_booking_ref() -> str:
    """Generate a readable booking reference like SRF-10025"""
    rand_num = secrets.randbelow(90000) + 10000
    return f"SRF-{rand_num}"

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(UserRole.CUSTOMER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate Date (No past dates)
    try:
        b_date = datetime.strptime(booking_in.booking_date, "%Y-%m-%d").date()
        today = date.today()
        if b_date < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot book a reservation for a past date."
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking date format. Expected YYYY-MM-DD."
        )

    # 2. Validate Restaurant exists and is open
    rest_result = await db.execute(select(Restaurant).where(Restaurant.id == booking_in.restaurant_id))
    restaurant = rest_result.scalars().first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found.")

    if not restaurant.is_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{restaurant.name} is currently closed. Please choose another date or time."
        )

    if restaurant.table_status == TableStatus.FULL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{restaurant.name} is currently fully booked. You can join the waitlist instead."
        )

    # 3. Check operating hours
    # Booking time format HH:MM
    try:
        b_time = datetime.strptime(booking_in.booking_time, "%H:%M").time()
        open_t = datetime.strptime(restaurant.open_time, "%H:%M").time()
        close_t = datetime.strptime(restaurant.close_time, "%H:%M").time()
        
        if close_t > open_t:
            if not (open_t <= b_time <= close_t):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Selected time {booking_in.booking_time} is outside operating hours ({restaurant.open_time} - {restaurant.close_time})."
                )
    except ValueError:
        pass

    # 4. Atomic Double-Booking & Overbooking Prevention
    # Fetch active tables for the restaurant
    tables_result = await db.execute(
        select(RestaurantTable).where(
            and_(
                RestaurantTable.restaurant_id == restaurant.id,
                RestaurantTable.is_active == True,
                RestaurantTable.capacity >= booking_in.guest_count
            )
        ).order_by(RestaurantTable.capacity.asc())
    )
    candidate_tables = tables_result.scalars().all()

    if not candidate_tables:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No suitable table found for {booking_in.guest_count} guests at this restaurant."
        )

    # Find an unreserved table for this date and time slot
    assigned_table = None
    for table in candidate_tables:
        # Check if table already booked for this date and slot
        existing_booking_res = await db.execute(
            select(Booking).where(
                and_(
                    Booking.restaurant_id == restaurant.id,
                    Booking.table_id == table.id,
                    Booking.booking_date == booking_in.booking_date,
                    Booking.booking_time == booking_in.booking_time,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN])
                )
            )
        )
        if not existing_booking_res.scalars().first():
            assigned_table = table
            break

    if not assigned_table:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"All available tables for {booking_in.guest_count} guests are fully booked at {booking_in.booking_time} on {booking_in.booking_date}. Please pick another time or join the waitlist."
        )

    # 5. Generate Unique 6-Digit Verification Code (Unique across all active/unused bookings)
    for _ in range(20):
        code_candidate = generate_verification_code()
        active_code_check = await db.execute(
            select(Booking).where(
                and_(
                    Booking.verification_code == code_candidate,
                    Booking.code_used == False,
                    Booking.status != BookingStatus.CANCELLED
                )
            )
        )
        if not active_code_check.scalars().first():
            verification_code = code_candidate
            break
    else:
        verification_code = generate_verification_code()

    # Generate unique booking reference
    booking_ref = generate_booking_ref()

    new_booking = Booking(
        booking_ref=booking_ref,
        customer_id=current_user.id,
        restaurant_id=restaurant.id,
        table_id=assigned_table.id,
        booking_date=booking_in.booking_date,
        booking_time=booking_in.booking_time,
        guest_count=booking_in.guest_count,
        special_requests=booking_in.special_requests,
        status=BookingStatus.CONFIRMED,
        verification_code=verification_code,
        verification_status=VerificationStatus.PENDING,
        code_used=False
    )
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)

    # 6. Dispatch Transactional Email Confirmation in background (non-blocking)
    address_parts = [p for p in [restaurant.address, restaurant.city] if p and p.strip()]
    full_address = ", ".join(address_parts) if address_parts else f"{restaurant.name}, Tamil Nadu"

    background_tasks.add_task(
        send_booking_confirmation_email,
        to_email=current_user.email,
        customer_name=current_user.full_name,
        restaurant_name=restaurant.name,
        booking_date=new_booking.booking_date,
        booking_time=new_booking.booking_time,
        guest_count=new_booking.guest_count,
        verification_code=verification_code,
        booking_ref=booking_ref,
        restaurant_address=full_address,
        lat=restaurant.lat,
        lng=restaurant.lng
    )

    return BookingOut(
        id=new_booking.id,
        booking_ref=new_booking.booking_ref,
        customer_id=new_booking.customer_id,
        restaurant_id=new_booking.restaurant_id,
        restaurant_name=restaurant.name,
        restaurant_city=restaurant.city,
        restaurant_address=restaurant.address,
        restaurant_phone=restaurant.phone,
        table_id=assigned_table.id,
        table_number=assigned_table.table_number,
        booking_date=new_booking.booking_date,
        booking_time=new_booking.booking_time,
        guest_count=new_booking.guest_count,
        special_requests=new_booking.special_requests,
        status=new_booking.status,
        verification_code=new_booking.verification_code,
        verification_status=new_booking.verification_status,
        code_used=new_booking.code_used,
        check_in_time=new_booking.check_in_time,
        checked_in_at=new_booking.checked_in_at,
        verified_by=new_booking.verified_by,
        created_at=new_booking.created_at
    )

@router.get("/my-bookings", response_model=List[BookingOut])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Booking)
        .where(Booking.customer_id == current_user.id)
        .options(
            selectinload(Booking.restaurant),
            selectinload(Booking.table)
        )
        .order_by(Booking.created_at.desc())
    )
    result = await db.execute(query)
    bookings = result.scalars().all()

    out = []
    for b in bookings:
        out.append(
            BookingOut(
                id=b.id,
                booking_ref=b.booking_ref,
                customer_id=b.customer_id,
                restaurant_id=b.restaurant_id,
                restaurant_name=b.restaurant.name if b.restaurant else None,
                restaurant_city=b.restaurant.city if b.restaurant else None,
                restaurant_address=b.restaurant.address if b.restaurant else None,
                restaurant_phone=b.restaurant.phone if b.restaurant else None,
                table_id=b.table_id,
                table_number=b.table.table_number if b.table else None,
                booking_date=b.booking_date,
                booking_time=b.booking_time,
                guest_count=b.guest_count,
                special_requests=b.special_requests,
                status=b.status,
                verification_code=b.verification_code,
                verification_status=b.verification_status,
                code_used=b.code_used,
                check_in_time=b.check_in_time,
                checked_in_at=b.checked_in_at,
                verified_by=b.verified_by,
                created_at=b.created_at
            )
        )
    return out

@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if current_user.role != UserRole.ADMIN and booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to cancel this booking.")

    if booking.status == BookingStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="Cannot cancel an already completed / checked-in reservation.")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    return {"message": "Booking successfully cancelled", "booking_ref": booking.booking_ref}
