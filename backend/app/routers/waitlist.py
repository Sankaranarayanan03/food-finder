from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_
from app.database import get_db
from app.models import Waitlist, WaitlistStatus, Restaurant, User
from app.schemas import WaitlistCreate, WaitlistOut
from app.auth import get_current_user

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

@router.post("", response_model=WaitlistOut, status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    waitlist_in: WaitlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify restaurant exists
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == waitlist_in.restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    # Calculate queue position
    count_res = await db.execute(
        select(func.count(Waitlist.id)).where(
            and_(
                Waitlist.restaurant_id == waitlist_in.restaurant_id,
                Waitlist.status == WaitlistStatus.WAITING
            )
        )
    )
    current_queue_len = count_res.scalar() or 0
    next_position = current_queue_len + 1

    entry = Waitlist(
        customer_id=current_user.id,
        restaurant_id=waitlist_in.restaurant_id,
        guest_count=waitlist_in.guest_count,
        preferred_time=waitlist_in.preferred_time,
        queue_position=next_position,
        status=WaitlistStatus.WAITING
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return WaitlistOut(
        id=entry.id,
        customer_id=entry.customer_id,
        customer_name=current_user.full_name,
        restaurant_id=entry.restaurant_id,
        restaurant_name=rest.name,
        guest_count=entry.guest_count,
        preferred_time=entry.preferred_time,
        queue_position=entry.queue_position,
        status=entry.status,
        created_at=entry.created_at
    )

@router.get("/my-waitlist", response_model=List[WaitlistOut])
async def get_my_waitlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Waitlist)
        .where(Waitlist.customer_id == current_user.id)
        .options(selectinload(Waitlist.restaurant))
        .order_by(Waitlist.created_at.desc())
    )
    result = await db.execute(query)
    entries = result.scalars().all()

    return [
        WaitlistOut(
            id=w.id,
            customer_id=w.customer_id,
            customer_name=current_user.full_name,
            restaurant_id=w.restaurant_id,
            restaurant_name=w.restaurant.name if w.restaurant else "Restaurant",
            guest_count=w.guest_count,
            preferred_time=w.preferred_time,
            queue_position=w.queue_position,
            status=w.status,
            created_at=w.created_at
        )
        for w in entries
    ]
