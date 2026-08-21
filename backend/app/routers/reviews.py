from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from app.database import get_db
from app.models import Review, Booking, BookingStatus, Restaurant, User, UserRole
from app.schemas import ReviewCreate, ReviewOut
from app.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_verified_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch booking
    booking_res = await db.execute(
        select(Booking).where(Booking.id == review_in.booking_id)
    )
    booking = booking_res.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    # 2. Check ownership
    if booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review reservations you booked.")

    # 3. ENFORCE HARD REQUIREMENT: Verified Check-in mandatory
    if booking.status != BookingStatus.CHECKED_IN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests with a completed, verified check-in at the restaurant may leave a review."
        )

    # 4. Check if already reviewed
    existing_rev = await db.execute(
        select(Review).where(Review.booking_id == booking.id)
    )
    if existing_rev.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a verified review for this visit."
        )

    # 5. Create Review
    new_review = Review(
        customer_id=current_user.id,
        restaurant_id=booking.restaurant_id,
        booking_id=booking.id,
        rating=review_in.rating,
        comment=review_in.comment,
        photo_url=review_in.photo_url,
        is_verified_visit=True
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    # 6. Recalculate restaurant rating & review count
    rest_reviews = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.restaurant_id == booking.restaurant_id
        )
    )
    avg_rating, count = rest_reviews.first()
    
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == booking.restaurant_id))
    rest = rest_res.scalars().first()
    if rest and avg_rating is not None:
        rest.rating = round(float(avg_rating), 1)
        rest.review_count = count
        await db.commit()

    return ReviewOut(
        id=new_review.id,
        customer_id=new_review.customer_id,
        customer_name=current_user.full_name,
        restaurant_id=new_review.restaurant_id,
        booking_id=new_review.booking_id,
        rating=new_review.rating,
        comment=new_review.comment,
        photo_url=new_review.photo_url,
        is_verified_visit=True,
        created_at=new_review.created_at
    )

@router.get("/restaurant/{restaurant_id}", response_model=List[ReviewOut])
async def get_restaurant_reviews(
    restaurant_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Review)
        .where(Review.restaurant_id == restaurant_id)
        .options(selectinload(Review.customer))
        .order_by(Review.created_at.desc())
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    return [
        ReviewOut(
            id=r.id,
            customer_id=r.customer_id,
            customer_name=r.customer.full_name if r.customer else "Verified Diner",
            restaurant_id=r.restaurant_id,
            booking_id=r.booking_id,
            rating=r.rating,
            comment=r.comment,
            photo_url=r.photo_url,
            is_verified_visit=r.is_verified_visit,
            created_at=r.created_at
        )
        for r in reviews
    ]
