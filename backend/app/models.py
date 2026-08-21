import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, 
    Enum, Text, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    RESTAURANT_OWNER = "RESTAURANT_OWNER"
    ADMIN = "ADMIN"

class TableStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LIMITED = "LIMITED"
    FULL = "FULL"

class FoodStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LIMITED = "LIMITED"
    UNAVAILABLE = "UNAVAILABLE"

class ParkingStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LIMITED = "LIMITED"
    FULL = "FULL"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CANCELLED = "CANCELLED"

class ComplaintStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESPONDED = "RESPONDED"
    RESOLVED = "RESOLVED"

class WaitlistStatus(str, enum.Enum):
    WAITING = "WAITING"
    NOTIFIED = "NOTIFIED"
    SEATED = "SEATED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owned_restaurants = relationship("Restaurant", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer", foreign_keys="[Booking.customer_id]", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="customer", cascade="all, delete-orphan")
    loyalty_records = relationship("LoyaltyPoint", back_populates="customer", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="customer", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="customer", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="customer", cascade="all, delete-orphan")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    cuisine = Column(String(150), nullable=False, index=True)
    price_range = Column(String(20), default="₹₹", nullable=False) # ₹, ₹₹, ₹₹₹, ₹₹₹₹
    avg_cost_for_two = Column(Integer, default=500, nullable=False)
    rating = Column(Float, default=4.5, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Operating Hours
    open_time = Column(String(10), default="10:00", nullable=False)
    close_time = Column(String(10), default="23:00", nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)

    # Real-Time Availability (Owner controlled)
    table_status = Column(Enum(TableStatus), default=TableStatus.AVAILABLE, nullable=False)
    food_status = Column(Enum(FoodStatus), default=FoodStatus.AVAILABLE, nullable=False)
    parking_status = Column(Enum(ParkingStatus), default=ParkingStatus.AVAILABLE, nullable=False)
    wait_time_mins = Column(Integer, default=5, nullable=False) # 5, 10, 20+ mins
    last_status_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="owned_restaurants")
    tables = relationship("RestaurantTable", back_populates="restaurant", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="restaurant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    loyalty_records = relationship("LoyaltyPoint", back_populates="restaurant", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="restaurant", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="restaurant", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="restaurant", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_restaurant_city_cuisine", "city", "cuisine"),
        Index("idx_restaurant_rating", "rating"),
    )


class RestaurantTable(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    table_number = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False, default=4)
    is_active = Column(Boolean, default=True, nullable=False)

    restaurant = relationship("Restaurant", back_populates="tables")
    bookings = relationship("Booking", back_populates="table")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "table_number", name="uq_restaurant_table_num"),
        CheckConstraint("capacity > 0", name="chk_table_capacity_positive"),
    )


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. SRF-10025
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id", ondelete="SET NULL"), nullable=True)
    
    booking_date = Column(String(20), nullable=False) # YYYY-MM-DD
    booking_time = Column(String(10), nullable=False) # HH:MM
    guest_count = Column(Integer, nullable=False)
    special_requests = Column(Text, nullable=True)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    
    # Server-generated 6-digit verification code & verification fields
    verification_code = Column(String(10), nullable=False, index=True)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    code_used = Column(Boolean, default=False, nullable=False, index=True)
    
    # Check-in timestamp & verification metadata
    check_in_time = Column(DateTime, nullable=True)
    checked_in_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("User", back_populates="bookings", foreign_keys=[customer_id])
    restaurant = relationship("Restaurant", back_populates="bookings")
    table = relationship("RestaurantTable", back_populates="bookings")
    verifier = relationship("User", foreign_keys=[verified_by])
    review = relationship("Review", back_populates="booking", uselist=False)
    loyalty_point = relationship("LoyaltyPoint", back_populates="booking", uselist=False)
    complaints = relationship("Complaint", back_populates="booking")

    __table_args__ = (
        CheckConstraint("guest_count > 0", name="chk_guest_count_positive"),
        Index("idx_booking_rest_date_time", "restaurant_id", "booking_date", "booking_time", "status"),
        Index("idx_booking_active_code", "verification_code", "code_used"),
    )


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # Starters, Mains, Breads, Rice, Desserts, Beverages
    price = Column(Float, nullable=False)
    is_vegetarian = Column(Boolean, default=False, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)

    restaurant = relationship("Restaurant", back_populates="menu_items")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    is_verified_visit = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")


class LoyaltyPoint(Base):
    __tablename__ = "loyalty_points"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    points = Column(Integer, default=10, nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="loyalty_records")
    restaurant = relationship("Restaurant", back_populates="loyalty_records")
    booking = relationship("Booking", back_populates="loyalty_point")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    
    complaint_type = Column(String(100), nullable=False) # e.g. "Food Quality", "Service Delay", "Billing Issue", "Hygiene"
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False)
    owner_response = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="complaints")
    restaurant = relationship("Restaurant", back_populates="complaints")
    booking = relationship("Booking", back_populates="complaints")


class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    guest_count = Column(Integer, nullable=False)
    preferred_time = Column(String(20), nullable=False)
    queue_position = Column(Integer, nullable=False, default=1)
    status = Column(Enum(WaitlistStatus), default=WaitlistStatus.WAITING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="waitlist_entries")
    restaurant = relationship("Restaurant", back_populates="waitlist_entries")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="favorites")
    restaurant = relationship("Restaurant", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("customer_id", "restaurant_id", name="uq_user_fav_restaurant"),
    )
