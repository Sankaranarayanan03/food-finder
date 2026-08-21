import asyncio
import re
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.database import engine, AsyncSessionLocal, Base
from app.models import (
    User, UserRole, Restaurant, RestaurantTable, MenuItem, 
    TableStatus, FoodStatus, ParkingStatus, Booking, BookingStatus,
    Review, LoyaltyPoint, Waitlist, WaitlistStatus
)
from app.auth import get_password_hash

# Complete authentic Tamil Nadu restaurant dataset covering all major 38 districts & hubs
TN_RESTAURANTS_SEED = [
    # 1. CHENNAI
    {
        "name": "Anjappar Chettinad Restaurant",
        "city": "Chennai",
        "address": "7/2, Nungambakkam High Road, Chennai, Tamil Nadu 600034",
        "lat": 13.0604, "lng": 80.2496,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 850,
        "rating": 4.7,
        "review_count": 342,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Legendary pioneer in authentic Chettinad spice heritage since 1964. Famous for fiery pepper chicken, crab roast, and mutton biryani.",
        "phone": "+91 44 2827 1234",
        "open_time": "11:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Chettinad Pepper Chicken", "category": "Starters", "price": 320, "is_veg": False, "desc": "Tender chicken tossed with freshly ground tellicherry black pepper and curry leaves"},
            {"name": "Nattu Kozhi Biryani", "category": "Rice", "price": 380, "is_veg": False, "desc": "Country chicken cooked with fragrant seeraga samba rice and authentic Chettinad spices"},
            {"name": "Chettinad Kozhi Varuval", "category": "Mains", "price": 340, "is_veg": False, "desc": "Spicy shallow-fried chicken dry roast with crushed spices"},
            {"name": "Ennai Kathirikai Curry", "category": "Mains", "price": 240, "is_veg": True, "desc": "Stuffed baby eggplants slow-cooked in a tangy sesame and tamarind gravy"},
            {"name": "Veechu Parotta", "category": "Breads", "price": 60, "is_veg": True, "desc": "Layered and beaten fluffy South Indian flatbread"},
            {"name": "Jigarthanda Special", "category": "Desserts", "price": 120, "is_veg": True, "desc": "Chilled beverage with almond gum, nannari syrup, basundi, and ice cream"}
        ]
    },
    {
        "name": "Murugan Idli Shop",
        "city": "Chennai",
        "address": "46, Besant Road, T. Nagar, Chennai, Tamil Nadu 600017",
        "lat": 13.0418, "lng": 80.2341,
        "cuisine": "Idli",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.8,
        "review_count": 520,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "World-famous cloud-soft mallipoo idlis served with 4 signature chutneys and rich gun powder with pure ghee.",
        "phone": "+91 44 2434 5678",
        "open_time": "07:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Malli Poo Ghee Idli (2 Pcs)", "category": "Mains", "price": 70, "is_veg": True, "desc": "Steamed fluffy rice cakes drenched in piping hot sambar & 4 fresh chutneys"},
            {"name": "Ghee Podi Masala Dosa", "category": "Mains", "price": 140, "is_veg": True, "desc": "Crispy golden crepe smeared with spicy idli podi and potato masala"},
            {"name": "Sweet Pongal", "category": "Desserts", "price": 85, "is_veg": True, "desc": "Traditional jaggery & rice pudding tempered with cashews and cardamom in pure ghee"},
            {"name": "Degree Filter Coffee", "category": "Beverages", "price": 45, "is_veg": True, "desc": "Frothy Kumbakonam style chicory-blended filter coffee in brass dabarah"}
        ]
    },
    {
        "name": "Ponnusamy Royal Mess",
        "city": "Chennai",
        "address": "55, Commander-In-Chief Road, Egmore, Chennai, Tamil Nadu 600008",
        "lat": 13.0732, "lng": 80.2609,
        "cuisine": "Seafood",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 800,
        "rating": 4.6,
        "review_count": 289,
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "description": "Famed for its gigantic 32-inch Special Bahubali Thali and spicy coastal Chettinad seafood delicacies since 1954.",
        "phone": "+91 44 2827 8899",
        "open_time": "12:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Nethili Fish Fry", "category": "Starters", "price": 280, "is_veg": False, "desc": "Crispy fried anchovies marinating in spicy red chili garlic paste"},
            {"name": "Vanjaram Fish Tawa Fry", "category": "Starters", "price": 450, "is_veg": False, "desc": "King fish steak pan-fried on iron girdle with Chettinad spices"},
            {"name": "Prawn Thokku Meals", "category": "Mains", "price": 390, "is_veg": False, "desc": "Traditional banana leaf meals served with spicy prawns roast gravy"}
        ]
    },
    {
        "name": "Ratna Cafe 1948",
        "city": "Chennai",
        "address": "255, Triplicane High Road, Triplicane, Chennai, Tamil Nadu 600005",
        "lat": 13.0583, "lng": 80.2745,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 250,
        "rating": 4.7,
        "review_count": 610,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Heritage South Indian tiffin spot renowned across India for unlimited piping hot bucket sambar poured over fluffy idlis.",
        "phone": "+91 44 2844 1234",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Ratna Sambar Idli (2 Pcs)", "category": "Mains", "price": 65, "is_veg": True, "desc": "Idlis submerged in unlimited aromatic Ghee Sambar"},
            {"name": "Onion Rava Dosa", "category": "Mains", "price": 110, "is_veg": True, "desc": "Crispy semolina crepe laced with finely chopped onions, cumin and cashews"},
            {"name": "Medhu Vadai", "category": "Starters", "price": 45, "is_veg": True, "desc": "Crispy fried lentil donut with ginger and green chilies"}
        ]
    },

    # 2. COIMBATORE
    {
        "name": "Sree Annapoorna Sree Gowrishankar",
        "city": "Coimbatore",
        "address": "75, East Arokiasamy Road, R.S. Puram, Coimbatore, Tamil Nadu 641002",
        "lat": 11.0117, "lng": 76.9458,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 450,
        "rating": 4.9,
        "review_count": 890,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "The proud pride of Coimbatore! Famed for unmatched sambar, crispy roast dosas, and legendary aromatic filter coffee.",
        "phone": "+91 422 254 7890",
        "open_time": "06:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Annapoorna Special Ghee Roast", "category": "Mains", "price": 120, "is_veg": True, "desc": "Paper-thin crispy dosa infused with aromatic pure cow ghee"},
            {"name": "Mini Sambar Idli (14 Pcs)", "category": "Starters", "price": 95, "is_veg": True, "desc": "Bite-sized soft idlis dipped in secret recipe Coimbatore sambar"},
            {"name": "Poori Masala Platter", "category": "Mains", "price": 100, "is_veg": True, "desc": "Fluffy golden pooris served with spiced onion-potato gravy"},
            {"name": "Signature Filter Kaapi", "category": "Beverages", "price": 40, "is_veg": True, "desc": "Iconic freshly brewed Kumbakonam-style filter coffee"}
        ]
    },
    {
        "name": "Junior Kuppanna (Kongunadu)",
        "city": "Coimbatore",
        "address": "Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004",
        "lat": 11.0289, "lng": 77.0028,
        "cuisine": "Kongunadu",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 750,
        "rating": 4.6,
        "review_count": 412,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Kongunadu non-veg specialist famous for Mutton Chukka, Pallipalayam Chicken, and banana leaf rice meals since 1960.",
        "phone": "+91 422 257 6677",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 15,
        "menu": [
            {"name": "Pallipalayam Chicken Fry", "category": "Starters", "price": 340, "is_veg": False, "desc": "Traditional Erode specialty chicken sautéed with shallow fried coconut slices & red chili"},
            {"name": "Kongu Mutton Chukka", "category": "Starters", "price": 420, "is_veg": False, "desc": "Tender lamb pieces slow-cooked with shallots and hand-pounded spices"},
            {"name": "Kuppanna Special Biryani", "category": "Rice", "price": 360, "is_veg": False, "desc": "Seeraga samba mutton biryani cooked over firewood dam"}
        ]
    },
    {
        "name": "Hari Bhavanam",
        "city": "Coimbatore",
        "address": "12, 4th Street, Gandhipuram, Coimbatore, Tamil Nadu 641012",
        "lat": 11.0183, "lng": 76.9644,
        "cuisine": "Kongunadu",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.7,
        "review_count": 310,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Famous Coimbatore non-vegetarian hub serving authentic village style Nattu Kozhi and Brain Fry.",
        "phone": "+91 422 249 1122",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Nattu Kozhi Soup", "category": "Soups", "price": 120, "is_veg": False, "desc": "Spicy country chicken broth infused with pepper"},
            {"name": "Mutton Kari Dosa", "category": "Mains", "price": 240, "is_veg": False, "desc": "Thick dosa topped with minced mutton and egg coat"}
        ]
    },

    # 3. MADURAI
    {
        "name": "Amma Mess (Madurai Heritage)",
        "city": "Madurai",
        "address": "136, Alagar Kovil Road, Tallakulam, Madurai, Tamil Nadu 625002",
        "lat": 9.9391, "lng": 78.1378,
        "cuisine": "Chettinad",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.9,
        "review_count": 1120,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Culinary pilgrimage site of Madurai! Iconic creator of Bone Marrow (Nalli) Omelette, Crab Omelette, and Ayira Fish Curry.",
        "phone": "+91 452 253 8899",
        "open_time": "12:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 20,
        "menu": [
            {"name": "Nalli (Bone Marrow) Omelette", "category": "Starters", "price": 290, "is_veg": False, "desc": "Signature egg omelette infused with rich mutton bone marrow sauce"},
            {"name": "Ayirai Meen Kuzhambu", "category": "Mains", "price": 450, "is_veg": False, "desc": "Rare spiny eel fish slow cooked in traditional Madurai clay pot gravy"},
            {"name": "Kola Urundai (4 Pcs)", "category": "Starters", "price": 220, "is_veg": False, "desc": "Crispy deep-fried minced mutton spice balls"},
            {"name": "Madurai Jigarthanda Extra Icecream", "category": "Desserts", "price": 90, "is_veg": True, "desc": "Authentic Madurai almond gum & basundi nectar drink"}
        ]
    },
    {
        "name": "Simmakkal Konar Mess",
        "city": "Madurai",
        "address": "79, North Veli Street, Simmakkal, Madurai, Tamil Nadu 625001",
        "lat": 9.9252, "lng": 78.1198,
        "cuisine": "Kari Dosa",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.8,
        "review_count": 780,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Originator of the world-famous Madurai Kari Dosa (triple-layered thick dosa with egg and spicy minced mutton).",
        "phone": "+91 452 234 1122",
        "open_time": "18:00", "close_time": "01:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Madurai Mutton Kari Dosa", "category": "Mains", "price": 260, "is_veg": False, "desc": "Legendary 3-tier dosa layered with plain batter, beaten egg, and spicy minced lamb"},
            {"name": "Elumbu Nalli Fry", "category": "Starters", "price": 310, "is_veg": False, "desc": "Spiced mutton marrow bones pan-roasted with curry leaves"},
            {"name": "Chicken Kari Dosa", "category": "Mains", "price": 220, "is_veg": False, "desc": "Layered dosa with spicy shredded chicken roast"}
        ]
    },

    # 4. TIRUCHIRAPPALLI (TRICHY)
    {
        "name": "Shri Sangeethas",
        "city": "Tiruchirappalli",
        "address": "2, Collector Office Road, Cantonment, Tiruchirappalli, Tamil Nadu 620001",
        "lat": 10.8050, "lng": 78.6856,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.7,
        "review_count": 650,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Trichy's premier vegetarian destination! Exceptional South Indian thali meals, ghee roast, and continental delights.",
        "phone": "+91 431 241 4488",
        "open_time": "06:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Special South Indian Meals", "category": "Mains", "price": 180, "is_veg": True, "desc": "Unlimited rice served with 3 curries, kootu, poriyal, rasam, appalam & payasam"},
            {"name": "Ghee Paper Masala Dosa", "category": "Mains", "price": 130, "is_veg": True, "desc": "Extra crisp long dosa roast with potato stuffing"}
        ]
    },
    {
        "name": "Kannappa Hotel",
        "city": "Tiruchirappalli",
        "address": "Central Bus Stand Road, Cantonment, Tiruchirappalli, Tamil Nadu 620001",
        "lat": 10.8012, "lng": 78.6834,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 700,
        "rating": 4.6,
        "review_count": 390,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Famous Trichy Chettinad non-veg hotel known for mutton biryani, brain fry, and fish curry meals.",
        "phone": "+91 431 246 1133",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Kannappa Mutton Biryani", "category": "Rice", "price": 350, "is_veg": False, "desc": "Spicy traditional seeraga samba mutton biryani"},
            {"name": "Mutton Brain Fry", "category": "Starters", "price": 280, "is_veg": False, "desc": "Tender lamb goat brain tossed in red chili and pepper"}
        ]
    },

    # 5. SALEM
    {
        "name": "Selvi Mess",
        "city": "Salem",
        "address": "Meyyanur Bypass Road, Near New Bus Stand, Salem, Tamil Nadu 636009",
        "lat": 11.6643, "lng": 78.1460,
        "cuisine": "Non-Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.7,
        "review_count": 480,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Salem's iconic non-veg haven famous for spicy country chicken gravy, mutton thali meals, and quail roast.",
        "phone": "+91 427 244 5566",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Salem Chicken Chukka", "category": "Starters", "price": 260, "is_veg": False, "desc": "Dry chicken fry spiced with hand pounded Salem chilies"},
            {"name": "Kaada (Quail) Fry", "category": "Starters", "price": 210, "is_veg": False, "desc": "Whole roasted Japanese quail marinated in native spices"}
        ]
    },

    # 6. TIRUNELVELI
    {
        "name": "Iruttukadai Halwa & Mess",
        "city": "Tirunelveli",
        "address": "East Car Street, Opp Nellaiappar Temple, Tirunelveli, Tamil Nadu 627006",
        "lat": 8.7284, "lng": 77.6891,
        "cuisine": "Halwa & Tiffin",
        "price_range": "₹",
        "avg_cost_for_two": 200,
        "rating": 4.9,
        "review_count": 1450,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "World-famous legendary shop opening every evening at 5 PM! Melting wheat halwa prepared using Thamirabarani water and pure ghee.",
        "phone": "+91 462 233 4455",
        "open_time": "17:00", "close_time": "21:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 15,
        "menu": [
            {"name": "Original Tirunelveli Wheat Halwa (250g)", "category": "Desserts", "price": 100, "is_veg": True, "desc": "Piping hot ghee-dripping wheat halwa cooked over copper cauldrons"},
            {"name": "Kothu Parotta Special", "category": "Mains", "price": 120, "is_veg": False, "desc": "Shredded parotta cooked on hot flat top with egg and salna"}
        ]
    },

    # 7. ERODE
    {
        "name": "Kokkarako Country Chicken",
        "city": "Erode",
        "address": "Brough Road, Erode, Tamil Nadu 638001",
        "lat": 11.3410, "lng": 77.7172,
        "cuisine": "Kongunadu",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.6,
        "review_count": 270,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic Erode style organic Nattu Kozhi fry and turmeric rice meals.",
        "phone": "+91 424 222 3344",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Erode Turmeric Chicken Roast", "category": "Starters", "price": 270, "is_veg": False, "desc": "Fresh farm chicken roasted with fresh organic Erode turmeric"}
        ]
    },

    # 8. THANJAVUR
    {
        "name": "Sree Ariya Bhavan",
        "city": "Thanjavur",
        "address": "Gandhi Road, Opp. Big Temple, Thanjavur, Tamil Nadu 613001",
        "lat": 10.7870, "lng": 79.1378,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.7,
        "review_count": 510,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Traditional Chola heritage veg restaurant facing the majestic Brihadishvara Temple.",
        "phone": "+91 4362 277 889",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Thanjavur Degree Coffee", "category": "Beverages", "price": 35, "is_veg": True, "desc": "Authentic pure milk brass filter coffee"},
            {"name": "Special South Indian Thali", "category": "Mains", "price": 140, "is_veg": True, "desc": "Traditional Delta region rice meals with vathal kuzhambu"}
        ]
    },

    # 9. VELLORE
    {
        "name": "Darling Residency Restaurant",
        "city": "Vellore",
        "address": "11/8, Officers Line, Vellore, Tamil Nadu 632001",
        "lat": 12.9165, "lng": 79.1325,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 700,
        "rating": 4.6,
        "review_count": 340,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Vellore's landmark dining hub serving spicy Ambur style Mutton Biryani and tandoori specials.",
        "phone": "+91 416 221 3001",
        "open_time": "11:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Ambur Dum Mutton Biryani", "category": "Rice", "price": 340, "is_veg": False, "desc": "Seeraga samba rice dum biryani cooked in wood fire Ambur style"}
        ]
    },

    # 10. DINDIGUL
    {
        "name": "Dindigul Thalappakatti Original",
        "city": "Dindigul",
        "address": "1, Main Bazaar, Grand Trunk Road, Dindigul, Tamil Nadu 624001",
        "lat": 10.3624, "lng": 77.9695,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 750,
        "rating": 4.8,
        "review_count": 920,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "The birth place of legendary Thalappakatti Biryani since 1957! Prepared using secret aromatic spices & Kannivadi tender lamb.",
        "phone": "+91 451 243 2211",
        "open_time": "11:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Thalappakatti Mutton Biryani", "category": "Rice", "price": 370, "is_veg": False, "desc": "Iconic Dindigul seeraga samba mutton biryani"},
            {"name": "Black Pepper Chicken Fry", "category": "Starters", "price": 310, "is_veg": False, "desc": "Dry chicken tossed with fresh ground Dindigul pepper"}
        ]
    },

    # 11. THOOTHUKUDI (TUTICORIN)
    {
        "name": "Alwar Butter Biscuit & Sea Food Mess",
        "city": "Thoothukudi",
        "address": "Beach Road, Opp Old Port, Thoothukudi, Tamil Nadu 628001",
        "lat": 8.8052, "lng": 78.1452,
        "cuisine": "Seafood",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.7,
        "review_count": 330,
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "description": "Coastal Tuticorin seafood hub known for fresh Crab Fry, Prawns masala, and macaroons.",
        "phone": "+91 461 232 9988",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Tuticorin Crab Masala", "category": "Mains", "price": 360, "is_veg": False, "desc": "Fresh sea crab cooked in thick spiced coconut sauce"}
        ]
    },

    # 12. KANCHIPURAM
    {
        "name": "Sri Rama Bhavan",
        "city": "Kanchipuram",
        "address": "Gandhi Road, Near Kamakshi Amman Temple, Kanchipuram, Tamil Nadu 631501",
        "lat": 12.8342, "lng": 79.7036,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 250,
        "rating": 4.6,
        "review_count": 420,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Famous silk city vegetarian restaurant serving traditional Kanchipuram Kovil Idli.",
        "phone": "+91 44 2722 3456",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Kanchipuram Kovil Idli", "category": "Mains", "price": 80, "is_veg": True, "desc": "Spiced cylindrical idli seasoned with ginger, pepper, cumin, and ghee"}
        ]
    },

    # 13. OOTY (THE NILGIRIS)
    {
        "name": "Earl's Court Tea & Nilgiri Diner",
        "city": "Ooty",
        "address": "Club Road, Fingerpost, Ooty, The Nilgiris, Tamil Nadu 643001",
        "lat": 11.4102, "lng": 76.6950,
        "cuisine": "Nilgiri Continental",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 900,
        "rating": 4.8,
        "review_count": 310,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Colonial hill station restaurant serving hot Nilgiri high tea, homemade chocolates, and English roast dinners.",
        "phone": "+91 423 244 4001",
        "open_time": "08:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Nilgiri Fresh Hill Tea Pot", "category": "Beverages", "price": 90, "is_veg": True, "desc": "Brewed from hand-picked Nilgiri estate tea leaves"},
            {"name": "Ooty Homemade Chocolate Platter", "category": "Desserts", "price": 180, "is_veg": True, "desc": "Assorted dark chocolate, hazelnut & raisin fudges"}
        ]
    },

    # 14. KODAIKANAL
    {
        "name": "Cloud 9 Alpine Restaurant",
        "city": "Kodaikanal",
        "address": "Coaker's Walk Road, Kodaikanal, Tamil Nadu 624101",
        "lat": 10.2381, "lng": 77.4892,
        "cuisine": "Multi-Cuisine",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 850,
        "rating": 4.7,
        "review_count": 290,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Mist-shrouded hilltop cafe overlooking Kodai lake serving hot soups, pastas, and wood-fired pizzas.",
        "phone": "+91 4542 240 112",
        "open_time": "09:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Woodfired Farmhouse Pizza", "category": "Mains", "price": 380, "is_veg": True, "desc": "Thin crust pizza topped with Kodai mozzarella & hill mushrooms"}
        ]
    },

    # 15. TIRUPPUR
    {
        "name": "Kongunadu Samayal Mess",
        "city": "Tiruppur",
        "address": "Avinashi Road, Tiruppur, Tamil Nadu 641603",
        "lat": 11.1085, "lng": 77.3411,
        "cuisine": "Kongunadu",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.6,
        "review_count": 220,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Knit city's favorite non-veg mess serving spicy mutton chukka and banana leaf meals.",
        "phone": "+91 421 223 8899",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Tiruppur Special Mutton Chops", "category": "Starters", "price": 320, "is_veg": False, "desc": "Spicy roasted goat chops dry gravy"}
        ]
    },

    # 16. HOSUR
    {
        "name": "Sri Krishna Highway Hub",
        "city": "Hosur",
        "address": "Bangalore NH 44, Hosur, Tamil Nadu 635109",
        "lat": 12.7409, "lng": 77.8253,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.7,
        "review_count": 680,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Popular highway pitstop for travelers on NH44. Known for quick service ghee roast dosas and mysore pak.",
        "phone": "+91 4344 266 777",
        "open_time": "06:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Hosur Special Ghee Masala Dosa", "category": "Mains", "price": 110, "is_veg": True, "desc": "Crispy golden dosa topped with fresh potato masala & butter"}
        ]
    },

    # 17. KARAIKUDI (SIVAGANGA)
    {
        "name": "Bangala Chettinad Heritage Manor",
        "city": "Karaikudi",
        "address": "Devakottai Road, Senjai, Karaikudi, Tamil Nadu 630001",
        "lat": 10.0735, "lng": 78.7845,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹₹",
        "avg_cost_for_two": 1200,
        "rating": 4.9,
        "review_count": 540,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic Chettinad ancestral mansion serving 7-course traditional banana leaf feasts prepared by native master chefs.",
        "phone": "+91 4565 220 221",
        "open_time": "12:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "7-Course Royal Chettinad Feast", "category": "Mains", "price": 600, "is_veg": False, "desc": "Complete ancestral Chettinad banquet including Crab, Mutton Kola & Payasam"}
        ]
    },

    # 18. KUMBAKONAM
    {
        "name": "Mangalambigai Coffee Tiffin Home",
        "city": "Kumbakonam",
        "address": "Town High School Road, Kumbakonam, Tamil Nadu 612001",
        "lat": 10.9602, "lng": 79.3845,
        "cuisine": "Degree Coffee",
        "price_range": "₹",
        "avg_cost_for_two": 200,
        "rating": 4.9,
        "review_count": 730,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Hallowed temple town coffee shrine! Authentic 100% cow milk Kumbakonam Degree Filter Coffee brewed fresh since 1914.",
        "phone": "+91 435 242 1122",
        "open_time": "05:30", "close_time": "21:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Original Kumbakonam Degree Filter Coffee", "category": "Beverages", "price": 30, "is_veg": True, "desc": "Piping hot unadulterated milk chicory coffee served in traditional brass dabarah"}
        ]
    },

    # 19. NAGERCOIL / KANYAKUMARI
    {
        "name": "Sea View Sunset Diner",
        "city": "Kanyakumari",
        "address": "Beach Road, Near Sunset Point, Kanyakumari, Tamil Nadu 629702",
        "lat": 8.0883, "lng": 77.5385,
        "cuisine": "Coastal Seafood",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 800,
        "rating": 4.7,
        "review_count": 410,
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "description": "Oceanfront restaurant overlooking the confluence of 3 seas (Indian Ocean, Arabian Sea, Bay of Bengal). Serves fresh Kanyakumari fish curry.",
        "phone": "+91 4652 246 100",
        "open_time": "10:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Kanyakumari Fish Curry & Red Rice", "category": "Mains", "price": 320, "is_veg": False, "desc": "Fresh catch of the day cooked with ground coconut and raw mango"}
        ]
    },

    # 20. RAMANATHAPURAM & RAMESWARAM
    {
        "name": "Sri Saravana Bhavan Rameswaram",
        "city": "Rameswaram",
        "address": "West Car Street, Opp. Ramanathaswamy Temple, Rameswaram, Tamil Nadu 623526",
        "lat": 9.2881, "lng": 79.3174,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.6,
        "review_count": 590,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Pilgrim vegetarian restaurant right outside Rameswaram temple serving fresh tiffin and thali meals.",
        "phone": "+91 4573 221 445",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Temple Special Ghee Pongal", "category": "Mains", "price": 75, "is_veg": True, "desc": "Steaming hot rice lentil pongal drizzled with ghee & cashews"}
        ]
    },

    # 21. CHENNAI - ADYAR ANANDA BHAVAN (A2B)
    {
        "name": "Adyar Ananda Bhavan (A2B)",
        "city": "Chennai",
        "address": "1, Sardar Patel Road, Adyar, Chennai, Tamil Nadu 600020",
        "lat": 13.0060, "lng": 80.2570,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 350,
        "rating": 4.8,
        "review_count": 980,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Premier South Indian vegetarian chain! Famous for steaming hot morning Breakfast (Ghee Roast, Idli, Medhu Vada), fast food tiffin snacks, and lavish South Indian Lunch thali meals.",
        "phone": "+91 44 2441 2233",
        "open_time": "06:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "A2B Special Ghee Masala Dosa", "category": "Breakfast & Dinner", "price": 125, "is_veg": True, "desc": "Crispy golden crepe filled with spiced potato masala & pure cow ghee"},
            {"name": "South Indian Royal Lunch Thali", "category": "Lunch", "price": 190, "is_veg": True, "desc": "Full banana leaf lunch meals with 3 curry varieties, sambar, rasam, payasam & appalam"},
            {"name": "Mini Idli Sambar Platter", "category": "Breakfast & Fast Food", "price": 85, "is_veg": True, "desc": "14 mini button idlis soaked in piping hot sambar"},
            {"name": "Filter Coffee & Sweets Combo", "category": "Beverages", "price": 60, "is_veg": True, "desc": "Iconic filter kaapi served with hot Gulab Jamun or Mysore Pak"}
        ]
    },

    # 22. CHENNAI - HOTEL SARAVANA BHAVAN
    {
        "name": "Hotel Saravana Bhavan",
        "city": "Chennai",
        "address": "21, Kennet Lane, Egmore, Chennai, Tamil Nadu 600008",
        "lat": 13.0782, "lng": 80.2601,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.7,
        "review_count": 1250,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Global pioneer of South Indian vegetarian dining. Known worldwide for traditional Breakfast (Pongal, Poori Masala), midday Lunch meals, and crispy Dinner dosas.",
        "phone": "+91 44 2819 1234",
        "open_time": "06:30", "close_time": "22:45", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Rava Onion Dosa", "category": "Breakfast & Dinner", "price": 130, "is_veg": True, "desc": "Lacy semolina crepe studded with onions, green chilies, cashews & cumin"},
            {"name": "Saravana Special Executive Lunch", "category": "Lunch", "price": 210, "is_veg": True, "desc": "Deluxe South Indian & North Indian combo lunch thali"},
            {"name": "Ven Pongal & Medhu Vada", "category": "Breakfast", "price": 110, "is_veg": True, "desc": "Piping hot pepper-cumin rice pongal served with crunchy lentil donut"}
        ]
    },

    # 23. SALEM / CHENNAI - SALEM RR BIRYANI UNAVAGAM
    {
        "name": "Salem RR Biryani Unavagam",
        "city": "Chennai",
        "address": "100 Feet Road, Vadapalani, Chennai, Tamil Nadu 600026",
        "lat": 13.0500, "lng": 80.2120,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 700,
        "rating": 4.7,
        "review_count": 840,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Legendary Salem style Seeraga Samba Biryani house! World-famous for spicy Mutton Biryani, Nattu Kozhi fry, and heavy non-veg Lunch & Dinner feasts.",
        "phone": "+91 44 2365 7788",
        "open_time": "11:00", "close_time": "23:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Salem RR Seeraga Samba Mutton Biryani", "category": "Lunch & Dinner", "price": 360, "is_veg": False, "desc": "Traditional Salem style tender lamb biryani cooked in woodfire dam"},
            {"name": "Nattu Kozhi Chukka Fry", "category": "Starters", "price": 320, "is_veg": False, "desc": "Country chicken dry roast tossed with crushed black pepper & garlic"},
            {"name": "Chicken 65 Biryani Combo", "category": "Lunch", "price": 290, "is_veg": False, "desc": "Fragrant biryani rice served with crispy spicy chicken 65 pieces"}
        ]
    },

    # 24. COIMBATORE - SREE GOWRI SHANKAR
    {
        "name": "Sree Gowri Shankar Veg Restaurant",
        "city": "Coimbatore",
        "address": "104, Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012",
        "lat": 11.0190, "lng": 76.9650,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 380,
        "rating": 4.8,
        "review_count": 670,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Coimbatore's beloved vegetarian hub serving iconic morning Breakfast tiffin, authentic South Indian Lunch meals, and fast food snacks.",
        "phone": "+91 422 223 4567",
        "open_time": "06:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Gowri Shankar Ghee Roast Dosa", "category": "Breakfast & Dinner", "price": 115, "is_veg": True, "desc": "Cone-shaped extra crispy ghee dosa served with 3 chutneys"},
            {"name": "Kongu Special South Indian Lunch Meals", "category": "Lunch", "price": 160, "is_veg": True, "desc": "Banana leaf meals with drumstick sambar, rasam, curd & sweets"}
        ]
    },

    # 25. MADURAI - MADURAI KUMAR MESS
    {
        "name": "Madurai Kumar Mess",
        "city": "Madurai",
        "address": "14, West Veli Street, Near Railway Station, Madurai, Tamil Nadu 625001",
        "lat": 9.9190, "lng": 78.1150,
        "cuisine": "Chettinad",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.8,
        "review_count": 890,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic Madurai non-veg dining landmark serving spicy mutton kola urundai, Ayira fish curry, and grand banana leaf Lunch & Dinner feasts.",
        "phone": "+91 452 234 5678",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Madurai Mutton Kola Urundai (4 Pcs)", "category": "Starters", "price": 210, "is_veg": False, "desc": "Crispy deep-fried minced mutton spice balls"},
            {"name": "Non-Veg Deluxe Banana Leaf Lunch Meals", "category": "Lunch", "price": 280, "is_veg": False, "desc": "Unlimited rice served with mutton gravy, chicken gravy, fish gravy & omelette"},
            {"name": "Bun Parotta & Mutton Chukka", "category": "Dinner", "price": 240, "is_veg": False, "desc": "Fluffy thick bun parottas served with spicy dry lamb roast"}
        ]
    },

    # 26. DINDIGUL - DINDIGUL VENU BIRYANI
    {
        "name": "Dindigul Venu Biryani",
        "city": "Dindigul",
        "address": "9, Salai Road, Near Bus Stand, Dindigul, Tamil Nadu 624001",
        "lat": 10.3600, "lng": 77.9710,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 720,
        "rating": 4.8,
        "review_count": 760,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Historic competitor to Thalappakatti! Famed across South India for its tangy, spicy Seeraga Samba mutton biryani, liver fry, and Lunch & Dinner feasts.",
        "phone": "+91 451 242 3344",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Venu Special Mutton Biryani", "category": "Lunch & Dinner", "price": 360, "is_veg": False, "desc": "Authentic Dindigul seeraga samba mutton biryani cooked with raw spices"},
            {"name": "Mutton Liver Pepper Fry", "category": "Starters", "price": 280, "is_veg": False, "desc": "Tender lamb liver sautéed with shallots & crushed peppercorns"}
        ]
    },

    # 27. ERODE - BHAVANI FAST FOOD & TIFFIN CENTER
    {
        "name": "Bhavani Fast Food & Tiffin Center",
        "city": "Erode",
        "address": "12, Perundurai Road, Erode, Tamil Nadu 638011",
        "lat": 11.3450, "lng": 77.7200,
        "cuisine": "Fast Food",
        "price_range": "₹",
        "avg_cost_for_two": 280,
        "rating": 4.6,
        "review_count": 430,
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "description": "High-speed fast food & evening tiffin spot! Popular for Kothu Parotta, Egg Dosa, Chili Chicken fast food, and night Dinner snacks.",
        "phone": "+91 424 225 6789",
        "open_time": "16:00", "close_time": "01:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Chicken Kothu Parotta Special", "category": "Fast Food & Dinner", "price": 140, "is_veg": False, "desc": "Shredded parottas chopped on griddle with chicken, egg & spicy salna"},
            {"name": "Street Style Chili Chicken Fry", "category": "Fast Food", "price": 180, "is_veg": False, "desc": "Crispy fried boneless chicken tossed with onions & capsicum"}
        ]
    },

    # 28. TRICHY - TRICHY VASANTHA BHAVAN
    {
        "name": "Trichy Vasantha Bhavan",
        "city": "Tiruchirappalli",
        "address": "15, Karur Bypass Road, Thillai Nagar, Tiruchirappalli, Tamil Nadu 620018",
        "lat": 10.8250, "lng": 78.6900,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 360,
        "rating": 4.7,
        "review_count": 520,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Thillai Nagar's favorite vegetarian diner! Known for morning tiffin Breakfast (Pongal, Vada, Poori), fast food snacks, and South Indian Lunch thali.",
        "phone": "+91 431 274 1234",
        "open_time": "06:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 0,
        "menu": [
            {"name": "Ghee Rava Masala Dosa", "category": "Breakfast & Dinner", "price": 120, "is_veg": True, "desc": "Crispy semolina dosa laced with roasted cashews & cumin"},
            {"name": "Traditional South Indian Lunch Meals", "category": "Lunch", "price": 150, "is_veg": True, "desc": "Unlimited meals with 3 vegetable gravies, sambar, rasam & payasam"}
        ]
    },

    # 29. CHENNAI - WRITERS CAFE & BAKERY
    {
        "name": "Writers Cafe & Artisanal Bakery",
        "city": "Chennai",
        "address": "98, Peters Road, Gopalapuram, Chennai, Tamil Nadu 600086",
        "lat": 13.0530, "lng": 80.2550,
        "cuisine": "Fast Food",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 650,
        "rating": 4.8,
        "review_count": 610,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Charming European style cafe & fast food joint! Serves gourmet burgers, woodfired pizzas, fresh artisanal baked breads, fast food snacks, and coffee.",
        "phone": "+91 44 2811 5566",
        "open_time": "09:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Artisanal Cheese & Mushroom Burger", "category": "Fast Food", "price": 260, "is_veg": True, "desc": "Brioche bun filled with grilled Portobello mushroom patty & melted cheddar"},
            {"name": "Woodfired Margherita Pizza", "category": "Fast Food & Dinner", "price": 320, "is_veg": True, "desc": "Thin crust pizza topped with fresh basil & buffalo mozzarella"}
        ]
    },

    # 30. MADURAI - USILAMPATTI MUTTON MESS
    {
        "name": "Usilampatti Mutton Mess",
        "city": "Madurai",
        "address": "45, KK Nagar Main Road, Madurai, Tamil Nadu 625020",
        "lat": 9.9320, "lng": 78.1450,
        "cuisine": "Non-Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.7,
        "review_count": 480,
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic Usilampatti rural style non-veg mess! Known for fiery Nattu Kozhi fry, Mutton Chukka, and heavy banana leaf Lunch & Dinner meals.",
        "phone": "+91 452 258 9012",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Usilampatti Mutton Chukka Meals", "category": "Lunch", "price": 270, "is_veg": False, "desc": "Banana leaf meals served with spicy roasted lamb chukka & bone gravy"},
            {"name": "Nattu Kozhi Milagu Varuval", "category": "Starters", "price": 290, "is_veg": False, "desc": "Country chicken dry roast seasoned with freshly crushed black pepper"}
        ]
    }
]

async def seed_database():
    """Idempotent Database Seeder for Smart Restaurant Finder (TN Edition)"""
    async with AsyncSessionLocal() as session:
        print("Initializing database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # 1. Create Default Users (Customer, Owner, Admin)
        print("Checking default user accounts...")
        customer_res = await session.execute(select(User).where(User.email == "customer@demo.com"))
        customer_user = customer_res.scalars().first()
        if not customer_user:
            customer_user = User(
                email="customer@demo.com",
                hashed_password=get_password_hash("password123"),
                full_name="Arun Kumar",
                phone="+91 9876543210",
                role=UserRole.CUSTOMER
            )
            session.add(customer_user)

        owner_res = await session.execute(select(User).where(User.email == "owner@anjappar.com"))
        owner_user = owner_res.scalars().first()
        if not owner_user:
            owner_user = User(
                email="owner@anjappar.com",
                hashed_password=get_password_hash("password123"),
                full_name="S. Anjappar",
                phone="+91 9840012345",
                role=UserRole.RESTAURANT_OWNER
            )
            session.add(owner_user)

        admin_res = await session.execute(select(User).where(User.email == "admin@srf.com"))
        admin_user = admin_res.scalars().first()
        if not admin_user:
            admin_user = User(
                email="admin@srf.com",
                hashed_password=get_password_hash("password123"),
                full_name="Platform Admin",
                phone="+91 9999999999",
                role=UserRole.ADMIN
            )
            session.add(admin_user)

        await session.commit()
        await session.refresh(customer_user)
        await session.refresh(owner_user)
        await session.refresh(admin_user)

        # 2. Seed Restaurants
        print("Seeding authentic Tamil Nadu restaurants...")
        created_restaurants = []

        for rest_data in TN_RESTAURANTS_SEED:
            existing_res = await session.execute(
                select(Restaurant).where(Restaurant.name == rest_data["name"])
            )
            existing = existing_res.scalars().first()
            if existing:
                created_restaurants.append(existing)
                continue

            restaurant = Restaurant(
                owner_id=owner_user.id,
                name=rest_data["name"],
                city=rest_data["city"],
                address=rest_data["address"],
                lat=rest_data["lat"],
                lng=rest_data["lng"],
                cuisine=rest_data["cuisine"],
                price_range=rest_data["price_range"],
                avg_cost_for_two=rest_data["avg_cost_for_two"],
                rating=rest_data["rating"],
                review_count=rest_data["review_count"],
                image_url=rest_data["image_url"],
                description=rest_data["description"],
                phone=rest_data["phone"],
                open_time=rest_data["open_time"],
                close_time=rest_data["close_time"],
                is_open=rest_data["is_open"],
                table_status=rest_data["table_status"],
                food_status=rest_data["food_status"],
                parking_status=rest_data["parking_status"],
                wait_time_mins=rest_data["wait_time_mins"],
            )
            session.add(restaurant)
            await session.flush()
            created_restaurants.append(restaurant)

            # Create Tables for the restaurant (8 tables of varying capacity)
            for t_num in range(1, 9):
                capacity = 2 if t_num <= 2 else (4 if t_num <= 6 else 6)
                table = RestaurantTable(
                    restaurant_id=restaurant.id,
                    table_number=f"T-{t_num:02d}",
                    capacity=capacity,
                    is_active=True
                )
                session.add(table)

            # Create Menu Items
            for m in rest_data.get("menu", []):
                menu_item = MenuItem(
                    restaurant_id=restaurant.id,
                    name=m["name"],
                    category=m["category"],
                    price=float(m["price"]),
                    is_vegetarian=m["is_veg"],
                    description=m.get("desc", ""),
                    is_available=True
                )
                session.add(menu_item)

        await session.commit()

        # 3. Create Demo Booking for Customer if not present
        demo_rest = created_restaurants[0]
        today_str = datetime.now().strftime("%Y-%m-%d")

        existing_b = await session.execute(select(Booking).where(Booking.booking_ref == "SRF-10025"))
        if not existing_b.scalars().first():
            sample_booking = Booking(
                booking_ref="SRF-10025",
                customer_id=customer_user.id,
                restaurant_id=demo_rest.id,
                booking_date=today_str,
                booking_time="19:30",
                guest_count=2,
                status=BookingStatus.CONFIRMED,
                verification_code="583214",
                special_requests="Window side table preferred please"
            )
            session.add(sample_booking)

            past_booking = Booking(
                booking_ref="SRF-10012",
                customer_id=customer_user.id,
                restaurant_id=demo_rest.id,
                booking_date=(datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                booking_time="13:00",
                guest_count=4,
                status=BookingStatus.CHECKED_IN,
                verification_code="291834",
                check_in_time=datetime.utcnow() - timedelta(days=2)
            )
            session.add(past_booking)
            await session.commit()
            await session.refresh(past_booking)

            loyalty = LoyaltyPoint(
                customer_id=customer_user.id,
                restaurant_id=demo_rest.id,
                booking_id=past_booking.id,
                points=10,
                earned_at=datetime.utcnow() - timedelta(days=2)
            )
            session.add(loyalty)

            review = Review(
                customer_id=customer_user.id,
                restaurant_id=demo_rest.id,
                booking_id=past_booking.id,
                rating=5.0,
                comment="Unbelievable Chettinad Pepper Chicken! Fluffy parottas and quick service. Verified visit was seamless!",
                is_verified_visit=True,
                created_at=datetime.utcnow() - timedelta(days=2)
            )
            session.add(review)
            await session.commit()

        print("Database seeded successfully with users, restaurants, tables, menus, bookings, reviews & loyalty records!")

if __name__ == "__main__":
    asyncio.run(seed_database())
