from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.models import (
    UserRole, TableStatus, FoodStatus, ParkingStatus, BookingStatus, 
    ComplaintStatus, WaitlistStatus, VerificationStatus
)

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    full_name: str
    email: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


# --- Menu Item Schemas ---
class MenuItemBase(BaseModel):
    name: str
    category: str
    price: float
    is_vegetarian: bool = False
    is_available: bool = True
    description: Optional[str] = None
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemOut(MenuItemBase):
    id: int
    restaurant_id: int

    class Config:
        from_attributes = True


# --- Table Schemas ---
class TableBase(BaseModel):
    table_number: str
    capacity: int = Field(..., gt=0)
    is_active: bool = True

class TableCreate(TableBase):
    pass

class TableOut(TableBase):
    id: int
    restaurant_id: int

    class Config:
        from_attributes = True


# --- Restaurant Schemas ---
class RestaurantBase(BaseModel):
    name: str
    city: str
    address: str
    lat: float
    lng: float
    cuisine: str
    price_range: str = "₹₹"
    avg_cost_for_two: int = 500
    description: Optional[str] = None
    phone: Optional[str] = None
    open_time: str = "10:00"
    close_time: str = "23:00"

class RestaurantCreate(RestaurantBase):
    image_url: Optional[str] = None

class RestaurantStatusUpdate(BaseModel):
    is_open: Optional[bool] = None
    table_status: Optional[TableStatus] = None
    food_status: Optional[FoodStatus] = None
    parking_status: Optional[ParkingStatus] = None
    wait_time_mins: Optional[int] = Field(None, ge=0)

class RestaurantOut(RestaurantBase):
    id: int
    owner_id: int
    rating: float
    review_count: int
    image_url: Optional[str] = None
    is_open: bool
    table_status: TableStatus
    food_status: FoodStatus
    parking_status: ParkingStatus
    wait_time_mins: int
    last_status_updated: datetime
    distance_km: Optional[float] = None
    travel_time_mins: Optional[int] = None

    class Config:
        from_attributes = True

class RestaurantDetailOut(RestaurantOut):
    menu_items: List[MenuItemOut] = []
    tables: List[TableOut] = []

    class Config:
        from_attributes = True


# --- Booking Schemas ---
class BookingCreate(BaseModel):
    restaurant_id: int
    booking_date: str = Field(..., description="YYYY-MM-DD format")
    booking_time: str = Field(..., description="HH:MM format")
    guest_count: int = Field(..., gt=0, le=20)
    special_requests: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    booking_ref: str
    customer_id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    restaurant_city: Optional[str] = None
    restaurant_address: Optional[str] = None
    restaurant_phone: Optional[str] = None
    table_id: Optional[int] = None
    table_number: Optional[str] = None
    booking_date: str
    booking_time: str
    guest_count: int
    special_requests: Optional[str] = None
    status: BookingStatus
    verification_code: str
    verification_status: VerificationStatus = VerificationStatus.PENDING
    code_used: bool = False
    check_in_time: Optional[datetime] = None
    checked_in_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Check-in Verification Schemas ---
class CheckInRequest(BaseModel):
    verification_code: str = Field(..., min_length=6, max_length=10)

class CheckInResponse(BaseModel):
    success: bool
    message: str
    booking_ref: str
    customer_name: str
    restaurant_name: str
    guest_count: int
    booking_time: str
    points_awarded: int = 10
    check_in_time: datetime


# --- Loyalty Schemas ---
class LoyaltyPointOut(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    booking_id: int
    points: int
    earned_at: datetime

    class Config:
        from_attributes = True

class FrequentVisitorStat(BaseModel):
    restaurant_id: int
    restaurant_name: str
    city: str
    visit_count: int
    last_visit: datetime


# --- Review Schemas ---
class ReviewCreate(BaseModel):
    booking_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str = Field(..., min_length=3)
    photo_url: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    restaurant_id: int
    booking_id: int
    rating: float
    comment: str
    photo_url: Optional[str] = None
    is_verified_visit: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    restaurant_id: int
    booking_id: Optional[int] = None
    complaint_type: str
    description: str = Field(..., min_length=10)

class ComplaintResponseUpdate(BaseModel):
    owner_response: Optional[str] = None
    admin_notes: Optional[str] = None
    status: Optional[ComplaintStatus] = None

class ComplaintOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    restaurant_id: int
    restaurant_name: Optional[str] = None
    booking_id: Optional[int] = None
    complaint_type: str
    description: str
    status: ComplaintStatus
    owner_response: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Waitlist Schemas ---
class WaitlistCreate(BaseModel):
    restaurant_id: int
    guest_count: int = Field(..., gt=0)
    preferred_time: str

class WaitlistOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    restaurant_id: int
    restaurant_name: Optional[str] = None
    guest_count: int
    preferred_time: str
    queue_position: int
    status: WaitlistStatus
    created_at: datetime

    class Config:
        from_attributes = True


# --- AI Recommendation Schemas ---
class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Natural language search query")
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None

class AlternativeMatch(BaseModel):
    restaurant: RestaurantOut
    match_reason: str
    score: float

class AIRecommendationResponse(BaseModel):
    parsed_intent: dict
    best_match: Optional[RestaurantOut] = None
    recommendation_reason: Optional[str] = None
    alternatives: List[AlternativeMatch] = []


# --- Admin & Owner AI Supervisor Schemas ---
class AdminAIQueryRequest(BaseModel):
    query: str = Field(..., min_length=2)

class AdminAIQueryResponse(BaseModel):
    query: str
    answer: str
    metrics: Optional[dict] = None

class OwnerAIQueryRequest(BaseModel):
    restaurant_id: Optional[int] = None
    query: str = Field(..., min_length=2)

class OwnerAIQueryResponse(BaseModel):
    query: str
    answer: str
    requires_confirmation: bool = False
    pending_action: Optional[str] = None
    pending_params: Optional[dict] = None
    data: Optional[dict] = None

class OwnerAIMutationRequest(BaseModel):
    restaurant_id: int
    action: str
    params: dict

class OwnerAIMutationResponse(BaseModel):
    success: bool
    message: str
    updated_data: Optional[dict] = None

