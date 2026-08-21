from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Complaint, ComplaintStatus, Restaurant, User, UserRole, Booking
from app.schemas import ComplaintCreate, ComplaintResponseUpdate, ComplaintOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def file_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify restaurant exists
    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == complaint_in.restaurant_id))
    rest = rest_res.scalars().first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    # If booking_id provided, verify
    if complaint_in.booking_id:
        b_res = await db.execute(select(Booking).where(Booking.id == complaint_in.booking_id))
        booking = b_res.scalars().first()
        if not booking or (booking.customer_id != current_user.id and current_user.role != UserRole.ADMIN):
            raise HTTPException(status_code=400, detail="Invalid booking ID provided for complaint.")

    new_complaint = Complaint(
        customer_id=current_user.id,
        restaurant_id=complaint_in.restaurant_id,
        booking_id=complaint_in.booking_id,
        complaint_type=complaint_in.complaint_type,
        description=complaint_in.description,
        status=ComplaintStatus.PENDING
    )
    db.add(new_complaint)
    await db.commit()
    await db.refresh(new_complaint)

    return ComplaintOut(
        id=new_complaint.id,
        customer_id=new_complaint.customer_id,
        customer_name=current_user.full_name,
        restaurant_id=new_complaint.restaurant_id,
        restaurant_name=rest.name,
        booking_id=new_complaint.booking_id,
        complaint_type=new_complaint.complaint_type,
        description=new_complaint.description,
        status=new_complaint.status,
        owner_response=new_complaint.owner_response,
        admin_notes=new_complaint.admin_notes,
        created_at=new_complaint.created_at,
        updated_at=new_complaint.updated_at
    )

@router.get("/my-complaints", response_model=List[ComplaintOut])
async def get_customer_complaints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Complaint)
        .where(Complaint.customer_id == current_user.id)
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

@router.patch("/{complaint_id}", response_model=ComplaintOut)
async def update_complaint(
    complaint_id: int,
    update_data: ComplaintResponseUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(
            selectinload(Complaint.restaurant),
            selectinload(Complaint.customer)
        )
    )
    result = await db.execute(query)
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESTAURANT_OWNER:
        if complaint.restaurant.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only manage complaints for your own restaurant.")
        if update_data.owner_response:
            complaint.owner_response = update_data.owner_response
            complaint.status = ComplaintStatus.RESPONDED

    if current_user.role == UserRole.ADMIN:
        if update_data.admin_notes:
            complaint.admin_notes = update_data.admin_notes
        if update_data.status:
            complaint.status = update_data.status
        if update_data.owner_response:
            complaint.owner_response = update_data.owner_response

    await db.commit()
    await db.refresh(complaint)

    return ComplaintOut(
        id=complaint.id,
        customer_id=complaint.customer_id,
        customer_name=complaint.customer.full_name if complaint.customer else "Customer",
        restaurant_id=complaint.restaurant_id,
        restaurant_name=complaint.restaurant.name if complaint.restaurant else "Restaurant",
        booking_id=complaint.booking_id,
        complaint_type=complaint.complaint_type,
        description=complaint.description,
        status=complaint.status,
        owner_response=complaint.owner_response,
        admin_notes=complaint.admin_notes,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at
    )
