import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.database import engine, AsyncSessionLocal, Base
from app.models import (
    User, UserRole, Restaurant, RestaurantTable, MenuItem, 
    TableStatus, FoodStatus, ParkingStatus, Booking, BookingStatus,
    Review, LoyaltyPoint
)
from app.auth import get_password_hash

ALL_TAMILNADU_RESTAURANTS = [
    # ------------------ 1. CHENNAI ------------------
    {
        "name": "Anjappar Chettinad Restaurant",
        "city": "Chennai",
        "address": "7/2, Nungambakkam High Road, Chennai, Tamil Nadu 600034",
        "lat": 13.0604, "lng": 80.2496,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 850,
        "rating": 4.7,
        "review_count": 520,
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
            {"name": "Chettinad Crab Masala", "category": "Mains", "price": 420, "is_veg": False, "desc": "Fresh blue crabs slow-simmered in roasted shallot and fennel gravy"},
            {"name": "Ennai Kathirikai Curry", "category": "Mains", "price": 240, "is_veg": True, "desc": "Stuffed baby eggplants slow-cooked in a tangy sesame and tamarind gravy"},
            {"name": "Veechu Parotta", "category": "Breads", "price": 60, "is_veg": True, "desc": "Layered and beaten fluffy South Indian flatbread"}
        ]
    },
    {
        "name": "Rayar's Mess (Mylapore)",
        "city": "Chennai",
        "address": " Arundale Street, Mylapore, Chennai, Tamil Nadu 600004",
        "lat": 13.0339, "lng": 80.2678,
        "cuisine": "Breakfast & Tiffin",
        "price_range": "₹",
        "avg_cost_for_two": 200,
        "rating": 4.9,
        "review_count": 950,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Historic Mylapore morning tiffin institution serving piping hot breakfast ghee pongal, melt-in-mouth soft idlis, crisp medu vadais, and signature filter kaapi.",
        "phone": "+91 44 2498 1234",
        "open_time": "06:30", "close_time": "12:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Ghee Ven Pongal with Sambar", "category": "Breakfast", "price": 65, "is_veg": True, "desc": "Creamy rice & moong dal porridge tempered with black pepper, cumin, cashew and ghee"},
            {"name": "Soft Idli & Medu Vada Combo", "category": "Breakfast", "price": 70, "is_veg": True, "desc": "Two steamed cloud idlis and one crispy urad dal donut with fresh coconut chutney"},
            {"name": "Degree Filter Kaapi", "category": "Beverages", "price": 35, "is_veg": True, "desc": "Authentic Kumbakonam brass dabarah filter coffee"}
        ]
    },
    {
        "name": "Sangeetha Vegetarian Restaurant",
        "city": "Chennai",
        "address": "GN Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017",
        "lat": 13.0440, "lng": 80.2400,
        "cuisine": "South Indian",
        "price_range": "₹₹",
        "avg_cost_for_two": 450,
        "rating": 4.7,
        "review_count": 890,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Premier South Indian destination for lavish morning Breakfast Mini Tiffins and classic Banana Leaf South Indian Lunch Meals.",
        "phone": "+91 44 2815 6789",
        "open_time": "07:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Special Breakfast Mini Tiffin", "category": "Breakfast", "price": 140, "is_veg": True, "desc": "Platter with 1 Idli, 1 Vada, Small Rava Kesari, Mini Dosa, and Filter Coffee"},
            {"name": "South Indian Banana Leaf Lunch Meal", "category": "Lunch", "price": 190, "is_veg": True, "desc": "Unlimited rice, drumstick sambar, vatha kulambu, rasam, kootu, poriyal, appalam, sweet"},
            {"name": "Special Ghee Onion Rava Roast", "category": "Dinner", "price": 135, "is_veg": True, "desc": "Crispy lacy semolina crepe with roasted onions and ghee"}
        ]
    },
    {
        "name": "Midnight Parotta & Salna Mess",
        "city": "Chennai",
        "address": "Sterling Road, Nungambakkam, Chennai, Tamil Nadu 600034",
        "lat": 13.0650, "lng": 80.2390,
        "cuisine": "Dinner & Parotta",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.8,
        "review_count": 710,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Popular dinner hotspot for sizzling flaky Veechu Parottas, Chicken Kothu Parotta, Spicy Salna, and Chilli Parotta until midnight.",
        "phone": "+91 44 2826 9988",
        "open_time": "18:00", "close_time": "01:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Special Chicken Kothu Parotta", "category": "Dinner", "price": 210, "is_veg": False, "desc": "Shredded layered parotta tossed on hot tawa with eggs, chicken chukka and thick salna"},
            {"name": "Egg Veechu Parotta with Salna", "category": "Dinner", "price": 110, "is_veg": False, "desc": "Thin stretched parotta folded with egg and served with piping hot spicy chicken salna"},
            {"name": "Fiery Chilli Parotta Fry", "category": "Dinner", "price": 180, "is_veg": True, "desc": "Fried parotta cubes tossed with capsicum, onion, green chillies and spicy tomato sauce"}
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
        "review_count": 780,
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
            {"name": "Degree Filter Coffee", "category": "Beverages", "price": 45, "is_veg": True, "desc": "Frothy Kumbakonam style chicory-blended filter coffee in brass dabarah"}
        ]
    },
    {
        "name": "Ratna Cafe 1948",
        "city": "Chennai",
        "address": "255, Triplicane High Road, Triplicane, Chennai, Tamil Nadu 600005",
        "lat": 13.0569, "lng": 80.2748,
        "cuisine": "South Indian",
        "price_range": "₹",
        "avg_cost_for_two": 250,
        "rating": 4.7,
        "review_count": 640,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Historic 75-year-old vegetarian institution celebrated for unlimited bucket sambar poured over golden ghee idlis and crispy vadai.",
        "phone": "+91 44 2848 7181",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Famous Ratna Sambar Idli (2 Pcs)", "category": "Mains", "price": 75, "is_veg": True, "desc": "Signature idlis completely submerged in piping hot spiced drumstick sambar with extra ghee"},
            {"name": "Crispy Medu Vadai (2 Pcs)", "category": "Starters", "price": 60, "is_veg": True, "desc": "Freshly fried crispy lentil donuts with fresh coconut and coriander chutneys"},
            {"name": "Poori Masala Combo", "category": "Mains", "price": 95, "is_veg": True, "desc": "Puffed whole wheat pooris with spiced potato-onion sagu"}
        ]
    },
    {
        "name": "Ponnusamy Royal Mess",
        "city": "Chennai",
        "address": "Gowdia Mutt Road, Royapettah, Chennai, Tamil Nadu 600014",
        "lat": 13.0519, "lng": 80.2625,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 800,
        "rating": 4.6,
        "review_count": 480,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Pioneers of the iconic Bahubali Thali and traditional Chettinad rabbit, quail, and mutton chukka delicacies.",
        "phone": "+91 44 2811 4455",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Chettinad Kaadai (Quail) Fry", "category": "Starters", "price": 280, "is_veg": False, "desc": "Whole roasted quail marinated in crushed coriander, dry chili and pepper"},
            {"name": "Mutton Sukka Varuval", "category": "Mains", "price": 350, "is_veg": False, "desc": "Tender boneless mutton pan-fried with shallots and curry leaves"},
            {"name": "Prawn Masala Pepper Roast", "category": "Mains", "price": 390, "is_veg": False, "desc": "Jumbo bay prawns in a thick caramelized onion pepper masala"}
        ]
    },

    # ------------------ 2. COIMBATORE ------------------
    {
        "name": "Sree Annapoorna Sree Gowrishankar",
        "city": "Coimbatore",
        "address": "75, East Arokiasamy Road, R.S. Puram, Coimbatore, Tamil Nadu 641002",
        "lat": 11.0117, "lng": 76.9458,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 450,
        "rating": 4.9,
        "review_count": 1450,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "The proud culinary crown of Coimbatore! Famed for unmatched secret-recipe sambar, crispy ghee roasts, and legendary aromatic filter coffee.",
        "phone": "+91 422 254 7890",
        "open_time": "06:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Annapoorna Special Ghee Roast", "category": "Mains", "price": 120, "is_veg": True, "desc": "Paper-thin crispy dosa infused with aromatic pure cow ghee"},
            {"name": "Mini Sambar Idli (14 Pcs)", "category": "Starters", "price": 95, "is_veg": True, "desc": "Bite-sized soft idlis dipped in secret recipe Coimbatore sambar"},
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
        "review_count": 610,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic Kongunadu cuisine straight from Erode traditions. Renowned for Pallipalayam Chicken and Seeraga Samba Mutton Biryani.",
        "phone": "+91 422 439 1234",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Kongu Pallipalayam Chicken", "category": "Starters", "price": 310, "is_veg": False, "desc": "Succulent chicken cooked with shallots, dried red chillies and fresh coconut slices"},
            {"name": "Seeraga Samba Mutton Biryani", "category": "Rice", "price": 390, "is_veg": False, "desc": "Aromatic short-grain rice cooked with tender young lamb in rich bone broth"},
            {"name": "Kongu Nattu Kozhi Soup", "category": "Starters", "price": 160, "is_veg": False, "desc": "Spicy free-range country chicken pepper broth"}
        ]
    },
    {
        "name": "Hari Bhavanam Non-Veg",
        "city": "Coimbatore",
        "address": "4th Cross, Bharathi Park Road, Gandhipuram, Coimbatore, Tamil Nadu 641012",
        "lat": 11.0205, "lng": 76.9678,
        "cuisine": "Kongunadu",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.7,
        "review_count": 820,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "Coimbatore's favorite home-style military mess cooking with incredible mutton brain fry, chicken chinthamani, and fish curries.",
        "phone": "+91 422 249 9888",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Chicken Chinthamani", "category": "Starters", "price": 290, "is_veg": False, "desc": "Boneless country chicken bits tossed with crushed red chillies, shallots and sesame oil"},
            {"name": "Mutton Kola Urundai (4 Pcs)", "category": "Starters", "price": 190, "is_veg": False, "desc": "Crispy fried spiced minced lamb meatballs"},
            {"name": "Kongu Style Fish Curry Meals", "category": "Mains", "price": 280, "is_veg": False, "desc": "Banana leaf meal with authentic tangy freshwater fish kulambu"}
        ]
    },

    # ------------------ 3. MADURAI ------------------
    {
        "name": "Amma Mess (Madurai Heritage)",
        "city": "Madurai",
        "address": "136, Alagar Kovil Road, Tallakulam, Madurai, Tamil Nadu 625002",
        "lat": 9.9392, "lng": 78.1368,
        "cuisine": "Madurai Cuisine",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.9,
        "review_count": 1820,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "The gastronomic temple of Madurai non-vegetarian cuisine! Famous for Kari Dosa, Bone Marrow Omelette, and Ayirai Meen Curry.",
        "phone": "+91 452 253 4567",
        "open_time": "11:00", "close_time": "23:30", "is_open": True,
        "table_status": TableStatus.LIMITED,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 15,
        "menu": [
            {"name": "Madurai Kari Dosa (Mutton)", "category": "Mains", "price": 280, "is_veg": False, "desc": "Three-tiered thick dosa layered with egg, spicy minced mutton sukka, and rich salna"},
            {"name": "Bone Marrow (Nalli) Omelette", "category": "Starters", "price": 240, "is_veg": False, "desc": "Fluffy country egg omelette stuffed with rich mutton bone marrow"},
            {"name": "Ayirai Meen Kulambu", "category": "Mains", "price": 380, "is_veg": False, "desc": "Rare freshwater spiny loach fish slow simmered in sour shallot tamarind gravy"},
            {"name": "Bun Parotta with Mutton Salna", "category": "Breads", "price": 120, "is_veg": False, "desc": "Soft, bun-shaped fluffy layered parotta served with spicy rich meat gravy"}
        ]
    },
    {
        "name": "Konar Kadai Kari Dosa",
        "city": "Madurai",
        "address": "North Veli Street, Simmakkal, Madurai, Tamil Nadu 625001",
        "lat": 9.9285, "lng": 78.1210,
        "cuisine": "Street Food",
        "price_range": "₹",
        "avg_cost_for_two": 350,
        "rating": 4.8,
        "review_count": 1150,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Original birthplace of the historic Madurai Kari Dosa. Sizzling cast-iron griddles serving legendary minced mutton dosas and elumbu roast.",
        "phone": "+91 452 234 8899",
        "open_time": "16:00", "close_time": "01:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Special Double Egg Mutton Kari Dosa", "category": "Mains", "price": 260, "is_veg": False, "desc": "Cast-iron griddled thick dosa with egg spread and spicy mutton keema"},
            {"name": "Mutton Kothu Kari", "category": "Starters", "price": 220, "is_veg": False, "desc": "Finely minced goat meat dry sauteed with pepper and shallots"},
            {"name": "Madurai Jigarthanda Famous", "category": "Desserts", "price": 80, "is_veg": True, "desc": "Cooling almond gum drink topped with nannari syrup and thickened basundi ice cream"}
        ]
    },
    {
        "name": "Sree Sabarees Veg Restaurant",
        "city": "Madurai",
        "address": "West Perumal Maistry Street, Near Meenakshi Amman Temple, Madurai, Tamil Nadu 625001",
        "lat": 9.9195, "lng": 78.1180,
        "cuisine": "Vegetarian",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.7,
        "review_count": 920,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Pilgrim-favorite vegetarian haven steps from the Meenakshi Amman temple. Golden ghee roast dosas and authentic Madurai veg thalis.",
        "phone": "+91 452 234 1234",
        "open_time": "06:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Madurai Special Ghee Masala Dosa", "category": "Mains", "price": 110, "is_veg": True, "desc": "Crispy golden dosa roasted in pure ghee and stuffed with spiced potato mash"},
            {"name": "Full South Indian Veg Meals", "category": "Mains", "price": 150, "is_veg": True, "desc": "Unlimited rice with sambar, vatha kulambu, rasam, kootu, poriyal, appalam and payasam"},
            {"name": "Badam Halwa Warm", "category": "Desserts", "price": 95, "is_veg": True, "desc": "Rich almond pudding made with pure saffron, milk and ghee"}
        ]
    },

    # ------------------ 4. DINDIGUL ------------------
    {
        "name": "Dindigul Thalappakatti Restaurant (Original)",
        "city": "Dindigul",
        "address": "15, East Car Street, Near Rock Fort, Dindigul, Tamil Nadu 624001",
        "lat": 10.3673, "lng": 77.9803,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 700,
        "rating": 4.9,
        "review_count": 1320,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "Original birthplace of Thalappakatti Biryani since 1957. Cooked with pure Seeraga Samba rice, grass-fed tender meat, and mountain herbs.",
        "phone": "+91 451 242 3456",
        "open_time": "11:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Thalappakatti Mutton Biryani", "category": "Rice", "price": 360, "is_veg": False, "desc": "Signature seeraga samba rice biryani infused with proprietary masala blend"},
            {"name": "Thalappakatti Gunpowder Chicken", "category": "Starters", "price": 290, "is_veg": False, "desc": "Crisp spiced fried chicken tossed in coarse spice powder"},
            {"name": "Mutton Chops Masala", "category": "Mains", "price": 340, "is_veg": False, "desc": "Succulent lamb ribs simmered in thick onion-tomato gravy"}
        ]
    },
    {
        "name": "Venu Biryani Dindigul",
        "city": "Dindigul",
        "address": "Salai Road, Near Bus Stand, Dindigul, Tamil Nadu 624001",
        "lat": 10.3620, "lng": 77.9750,
        "cuisine": "Biryani",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.8,
        "review_count": 940,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "Iconic rival to Thalappakatti, legendary among locals for spicy Seeraga Samba mutton biryani and pepper fry.",
        "phone": "+91 451 243 1122",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Venu Special Seeraga Samba Biryani", "category": "Rice", "price": 340, "is_veg": False, "desc": "Short-grain fragrant samba biryani loaded with soft mutton chunks"},
            {"name": "Mutton Pepper Fry Dry", "category": "Starters", "price": 310, "is_veg": False, "desc": "Boneless goat meat tossed in freshly ground black pepper and curry leaves"},
            {"name": "Ennai Kathirikai Curry", "category": "Mains", "price": 80, "is_veg": True, "desc": "Traditional brinjal gravy accompaniment"}
        ]
    },

    # ------------------ 5. SALEM ------------------
    {
        "name": "Selvi Mess (Salem Military)",
        "city": "Salem",
        "address": "5, Cherry Road, Hasthampatti, Salem, Tamil Nadu 636007",
        "lat": 11.6643, "lng": 78.1460,
        "cuisine": "Tamil Cuisine",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.7,
        "review_count": 680,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Salem's iconic military mess delivering sensational country chicken meals, fish fry, and fluffy Kothu Parottas.",
        "phone": "+91 427 231 6789",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Salem Chicken Kothu Parotta", "category": "Mains", "price": 220, "is_veg": False, "desc": "Shredded parotta griddled with egg, shredded chicken, and aromatic salna"},
            {"name": "Mutton Chukka Fry", "category": "Starters", "price": 290, "is_veg": False, "desc": "Salem style caramelized shallot meat dry fry with crushed peppercorns"},
            {"name": "Full Non-Veg Banana Leaf Meals", "category": "Mains", "price": 260, "is_veg": False, "desc": "Unlimited rice with chicken kulambu, mutton kulambu, meen kulambu, rasam, curd"}
        ]
    },
    {
        "name": "Salem Thattu Vadai Set Corner",
        "city": "Salem",
        "address": "Fairlands Main Road, Salem, Tamil Nadu 636016",
        "lat": 11.6720, "lng": 78.1390,
        "cuisine": "Street Food",
        "price_range": "₹",
        "avg_cost_for_two": 150,
        "rating": 4.9,
        "review_count": 1250,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Famous street food invention of Salem! Crispy thattai discs sandwiched with grated beetroot, carrot, and spicy red garlic chutney.",
        "phone": "+91 427 244 5566",
        "open_time": "15:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Classic Salem Thattu Vadai Set (4 Pcs)", "category": "Starters", "price": 50, "is_veg": True, "desc": "Crispy thattai stuffed with grated carrot, beetroot, onion and fiery garlic chutney"},
            {"name": "Nellikai (Gooseberry) Thattu Vadai Set", "category": "Starters", "price": 60, "is_veg": True, "desc": "Tangy amla-infused vegetable sandwich set"},
            {"name": "Rose Milk Salem Chilled", "category": "Beverages", "price": 40, "is_veg": True, "desc": "Aromatic chilled rose milk with sabja seeds"}
        ]
    },

    # ------------------ 6. TIRUCHIRAPPALLI (TRICHY) ------------------
    {
        "name": "Buhari Grand (Tiruchirappalli)",
        "city": "Tiruchirappalli",
        "address": "12, Cantonment Main Road, Tiruchirappalli, Tamil Nadu 620001",
        "lat": 10.7905, "lng": 78.7047,
        "cuisine": "Biryani",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 800,
        "rating": 4.6,
        "review_count": 510,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "Celebrated creators of Chicken 65, bringing grand Mughlai and South Indian biryani feasts to Trichy.",
        "phone": "+91 431 241 8900",
        "open_time": "11:00", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Original Buhari Chicken 65", "category": "Starters", "price": 270, "is_veg": False, "desc": "The historic 1965 original recipe crispy fried chicken with curry leaves"},
            {"name": "Trichy Royal Mutton Biryani", "category": "Rice", "price": 370, "is_veg": False, "desc": "Long grain basmati biryani layered with saffron and tender lamb"},
            {"name": "Butter Garlic Naan", "category": "Breads", "price": 75, "is_veg": True, "desc": "Tandoor baked flatbread smothered in garlic butter"}
        ]
    },
    {
        "name": "Kannappa Chettinad Restaurant",
        "city": "Tiruchirappalli",
        "address": "Salai Road, Thillai Nagar, Tiruchirappalli, Tamil Nadu 620018",
        "lat": 10.8280, "lng": 78.6850,
        "cuisine": "Chettinad",
        "price_range": "₹₹",
        "avg_cost_for_two": 650,
        "rating": 4.7,
        "review_count": 780,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Trichy's favorite non-veg destination for authentic Chettinad seeraga samba mutton biryani, crab roast, and vanjaram fish fry.",
        "phone": "+91 431 276 5432",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Kannappa Special Mutton Biryani", "category": "Rice", "price": 360, "is_veg": False, "desc": "Seeraga samba rice cooked with tender lamb pieces and aromatic whole spices"},
            {"name": "Kozhi Milagu Masala", "category": "Mains", "price": 310, "is_veg": False, "desc": "Fiery pepper chicken curry with crushed tellicherry peppercorns"},
            {"name": "Nethili Meen Varuval", "category": "Starters", "price": 240, "is_veg": False, "desc": "Crispy batter fried anchovies with curry leaf seasoning"}
        ]
    },

    # ------------------ 7. TIRUNELVELI ------------------
    {
        "name": "Nellai Saravana Bhavan",
        "city": "Tirunelveli",
        "address": "28, Swamy Sannathi Street, Tirunelveli Town, Tamil Nadu 627006",
        "lat": 8.7139, "lng": 77.7567,
        "cuisine": "Traditional Meals",
        "price_range": "₹",
        "avg_cost_for_two": 350,
        "rating": 4.8,
        "review_count": 890,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Traditional banana leaf feast specializing in Tirunelveli Sodhi kuzhambu, authentic sambars, and warm melt-in-mouth wheat halwa.",
        "phone": "+91 462 233 4567",
        "open_time": "07:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Nellai Sodhi Banana Leaf Meal", "category": "Mains", "price": 160, "is_veg": True, "desc": "Rich coconut milk vegetable stew meal served with potato roast and appalam"},
            {"name": "Tirunelveli Pure Ghee Halwa", "category": "Desserts", "price": 90, "is_veg": True, "desc": "Warm, glossy wheat milk halwa cooked with pure cow ghee and cashews"},
            {"name": "Mor Kali (Buttermilk Porridge)", "category": "Starters", "price": 60, "is_veg": True, "desc": "Traditional tempered rice flour snack cooked in sour spiced buttermilk"}
        ]
    },
    {
        "name": "Iruttu Kadai Halwa & Mess",
        "city": "Tirunelveli",
        "address": "East Car Street, Opposite Nellaiappar Temple, Tirunelveli, Tamil Nadu 627006",
        "lat": 8.7285, "lng": 77.7020,
        "cuisine": "Street Food",
        "price_range": "₹",
        "avg_cost_for_two": 200,
        "rating": 4.9,
        "review_count": 2100,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "The world's most legendary single-item sweet shop since 1900. Authentic hot wheat halwa prepared using Thamirabarani river water and pure ghee.",
        "phone": "+91 462 233 8900",
        "open_time": "17:00", "close_time": "21:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.LIMITED,
        "wait_time_mins": 10,
        "menu": [
            {"name": "Hot Iruttu Kadai Halwa (250g)", "category": "Desserts", "price": 120, "is_veg": True, "desc": "Authentic hand-stirred hot wheat halwa in banana leaf with pure cow ghee"},
            {"name": "Spiced Mixture Pack", "category": "Starters", "price": 50, "is_veg": True, "desc": "Crunchy spicy accompaniment mixture"}
        ]
    },

    # ------------------ 8. THANJAVUR ------------------
    {
        "name": "Sangeetha Veg (Thanjavur Chola)",
        "city": "Thanjavur",
        "address": "South Rampart, Near Brihadeeswarar Temple, Thanjavur, Tamil Nadu 613001",
        "lat": 10.7870, "lng": 79.1378,
        "cuisine": "South Indian",
        "price_range": "₹₹",
        "avg_cost_for_two": 400,
        "rating": 4.7,
        "review_count": 620,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Spiritual culinary haven steps away from the Great Living Chola Temple. Revered for temple-style sambar and crispy vadais.",
        "phone": "+91 4362 277 888",
        "open_time": "06:30", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Thanjavur Temple Sambar Vadai (2 Pcs)", "category": "Starters", "price": 70, "is_veg": True, "desc": "Crispy medu vadais submerged in rich coriander-tempered sambar"},
            {"name": "Special Rava Masala Dosa", "category": "Mains", "price": 130, "is_veg": True, "desc": "Lacy, crisp semolina crepe studded with cashews, cumin, and green chillies"},
            {"name": "Thanjavur Ghee Kesari", "category": "Desserts", "price": 60, "is_veg": True, "desc": "Saffron semolina dessert rich with roasted cashews and raisins"}
        ]
    },
    {
        "name": "Pattukkottai Kamatchi Mess",
        "city": "Thanjavur",
        "address": "Medical College Road, Thanjavur, Tamil Nadu 613004",
        "lat": 10.7650, "lng": 79.1220,
        "cuisine": "Tamil Cuisine",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.8,
        "review_count": 730,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Delta region's legendary non-veg destination famed for country chicken gravy, fish fry, and mutton elumbu kuzhambu.",
        "phone": "+91 4362 245 678",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Pattukkottai Nattu Kozhi Roast", "category": "Starters", "price": 310, "is_veg": False, "desc": "Free range country chicken sauteed in small onions, crushed cumin and pepper"},
            {"name": "Kaada (Quail) Biryani", "category": "Rice", "price": 320, "is_veg": False, "desc": "Spiced whole quail cooked with seeraga samba rice"},
            {"name": "Delta Fish Curry Meals", "category": "Mains", "price": 260, "is_veg": False, "desc": "Full banana leaf meal with fresh Cauvery delta fish gravy"}
        ]
    },

    # ------------------ 9. THOOTHUKUDI (TUTICORIN) ------------------
    {
        "name": "Kurinji Sea Harvest & Parotta",
        "city": "Thoothukudi",
        "address": "Beach Road, Harbour View, Thoothukudi, Tamil Nadu 628001",
        "lat": 8.7642, "lng": 78.1348,
        "cuisine": "Seafood",
        "price_range": "₹₹",
        "avg_cost_for_two": 600,
        "rating": 4.8,
        "review_count": 520,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Fresh coast seafood catch straight from the Gulf of Mannar. Famous for Vanjaram Fish Fry, Crab Masala, and Tuticorin Macaroon.",
        "phone": "+91 461 232 9900",
        "open_time": "11:30", "close_time": "23:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Tawa Vanjaram (Seer) Fish Fry", "category": "Starters", "price": 320, "is_veg": False, "desc": "Fresh king seer fish steak coated in red coastal masala and tawa seared"},
            {"name": "Tuticorin Crab Masala", "category": "Mains", "price": 360, "is_veg": False, "desc": "Mud crab cooked in thick spiced coconut gravy with fennel"},
            {"name": "Tuticorin Cashew Macaroons (Box)", "category": "Desserts", "price": 150, "is_veg": True, "desc": "Light, crispy egg-white and cashew delicacies unique to Thoothukudi"}
        ]
    },
    {
        "name": "Alwar Night Club Parotta",
        "city": "Thoothukudi",
        "address": "V.E. Road, Tuticorin Market, Thoothukudi, Tamil Nadu 628002",
        "lat": 8.8050, "lng": 78.1460,
        "cuisine": "Parotta",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.7,
        "review_count": 480,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "Tuticorin's iconic night parotta stall famous for paper-thin coin parottas dipped in spicy empty salna and country chicken pepper roast.",
        "phone": "+91 461 234 1122",
        "open_time": "17:00", "close_time": "02:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Tuticorin Coin Parotta (5 Pcs)", "category": "Breads", "price": 80, "is_veg": True, "desc": "Mini crispy flaky parottas served with unlimited spicy salna"},
            {"name": "Chicken Pepper Chukka Roast", "category": "Mains", "price": 190, "is_veg": False, "desc": "Dry pan roasted chicken with green chillies and crushed black pepper"}
        ]
    },

    # ------------------ 10. OOTY (NILGIRIS) ------------------
    {
        "name": "Earl's Court Tea & Nilgiri Diner",
        "city": "Ooty",
        "address": "Woodcock Road, Elk Hill, Ooty, Tamil Nadu 643001",
        "lat": 11.4102, "lng": 76.6950,
        "cuisine": "Multicuisine",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 900,
        "rating": 4.7,
        "review_count": 410,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Cozy hill station retreat overlooking the mist-clad Nilgiri hills. Warm fireplace, Badaga special chicken, and fresh estate teas.",
        "phone": "+91 423 244 5678",
        "open_time": "08:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Badaga Hill Chicken Curry", "category": "Mains", "price": 320, "is_veg": False, "desc": "Indigenous tribal hill recipe cooked with roasted ground spices"},
            {"name": "Nilgiri Vegetable Stew with Appam", "category": "Mains", "price": 240, "is_veg": True, "desc": "Coconut milk stew loaded with locally grown carrots, beans and peas"},
            {"name": "Fresh Nilgiri Estate Silver Needle Tea", "category": "Beverages", "price": 80, "is_veg": True, "desc": "Delicate, aromatic white tea harvested from high-elevation Ooty gardens"}
        ]
    },

    # ------------------ 11. KODAIKANAL ------------------
    {
        "name": "Cloud Street Woodfired Kitchen",
        "city": "Kodaikanal",
        "address": "PT Road, Near Seven Roads Junction, Kodaikanal, Tamil Nadu 624101",
        "lat": 10.2381, "lng": 77.4892,
        "cuisine": "Multicuisine",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 850,
        "rating": 4.8,
        "review_count": 670,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Rustic hilltop cafe famed for fresh woodfired thin crust pizzas, lemon cake, hot chocolate, and Himalayan momos.",
        "phone": "+91 4542 240 600",
        "open_time": "09:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Woodfired Farmhouse Pizza", "category": "Mains", "price": 390, "is_veg": True, "desc": "Stonebaked pizza with fresh Kodai cheese, bell peppers, olives and basil"},
            {"name": "Kodai Hot Chocolate with Marshmallow", "category": "Beverages", "price": 140, "is_veg": True, "desc": "Decadent melted local cocoa drink served steaming hot"},
            {"name": "Warm Homemade Apple Crumble Pie", "category": "Desserts", "price": 160, "is_veg": True, "desc": "Locally harvested spiced apple filling topped with butter crumble and vanilla ice cream"}
        ]
    },

    # ------------------ 12. ERODE ------------------
    {
        "name": "Kongu Samayal Mess",
        "city": "Erode",
        "address": "Brough Road, Near Railway Station, Erode, Tamil Nadu 638001",
        "lat": 11.3410, "lng": 77.7172,
        "cuisine": "Kongunadu",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.6,
        "review_count": 390,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Authentic agricultural heartland cooking with country chicken, fresh coconut oil, and medicinal herbal rasams.",
        "phone": "+91 424 222 1234",
        "open_time": "11:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Erode Mutton Chops Chukka", "category": "Starters", "price": 280, "is_veg": False, "desc": "Bone-in lamb ribs slow braised in shallow iron wok with small onions"},
            {"name": "Kambu Dosai (Pearl Millet)", "category": "Mains", "price": 90, "is_veg": True, "desc": "Healthy traditional millet crepe served with sesame chutney and sambar"}
        ]
    },

    # ------------------ 13. TIRUPPUR ------------------
    {
        "name": "Tiruppur Kumaran Non-Veg Kitchen",
        "city": "Tiruppur",
        "address": "Kumaran Road, Cotton Market Area, Tiruppur, Tamil Nadu 641601",
        "lat": 11.1085, "lng": 77.3411,
        "cuisine": "Parotta",
        "price_range": "₹₹",
        "avg_cost_for_two": 450,
        "rating": 4.5,
        "review_count": 310,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "The textile hub's favorite midnight parotta corner! Golden layered parottas, chicken salna, and egg kothu.",
        "phone": "+91 421 224 4567",
        "open_time": "16:00", "close_time": "01:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Egg Ceylon Parotta", "category": "Breads", "price": 140, "is_veg": False, "desc": "Folded crisp square parotta stuffed with spiced egg and onions"},
            {"name": "Chicken Salna Gravy", "category": "Mains", "price": 180, "is_veg": False, "desc": "Street-style aromatic road-side curry with fennel, poppy seeds and coconut"}
        ]
    },

    # ------------------ 14. VELLORE ------------------
    {
        "name": "Vellore Fort View Biryani",
        "city": "Vellore",
        "address": "Officer's Line, Opposite Vellore Fort, Vellore, Tamil Nadu 632001",
        "lat": 12.9165, "lng": 79.1325,
        "cuisine": "Biryani",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.6,
        "review_count": 420,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "description": "Historic Arcot-style dum biryani served with spicy brinjal gravy (Kathirikai Pachadi) and onion raita.",
        "phone": "+91 416 222 3456",
        "open_time": "11:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Arcot Style Chicken Biryani", "category": "Rice", "price": 260, "is_veg": False, "desc": "Fragrant basmati rice dum cooked with saffron, curd marinade, and fried onions"},
            {"name": "Ennai Kathirikai Pachadi", "category": "Mains", "price": 90, "is_veg": True, "desc": "Tangy peanut and tamarind brinjal gravy accompaniment"}
        ]
    },

    # ------------------ 15. HOSUR ------------------
    {
        "name": "Hosur Highway Spice Garden",
        "city": "Hosur",
        "address": "Bangalore-Hosur National Highway 44, Hosur, Tamil Nadu 635109",
        "lat": 12.7409, "lng": 77.8253,
        "cuisine": "Multicuisine",
        "price_range": "₹₹₹",
        "avg_cost_for_two": 700,
        "rating": 4.5,
        "review_count": 340,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "description": "Serene garden dining with expansive valet parking, live tandoor counter, and South Indian delicacies.",
        "phone": "+91 4344 242 888",
        "open_time": "10:00", "close_time": "23:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Tandoori Murgh Full", "category": "Starters", "price": 420, "is_veg": False, "desc": "Whole spring chicken spiced with Kashmiri chillies and charcoal roasted"},
            {"name": "Paneer Butter Masala", "category": "Mains", "price": 240, "is_veg": True, "desc": "Cottage cheese cubes simmered in velvety tomato-butter gravy"}
        ]
    },

    # ------------------ 16. KANCHIPURAM ------------------
    {
        "name": "Kanchipuram Silk & Sambar Bhavan",
        "city": "Kanchipuram",
        "address": "Gandhi Road, Near Ekambareswarar Temple, Kanchipuram, Tamil Nadu 631501",
        "lat": 12.8342, "lng": 79.7036,
        "cuisine": "Tamil Cuisine",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.8,
        "review_count": 560,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Home of the authentic cylindrical Kanchipuram Idli wrapped in Mandharai leaves with ginger, cumin, and whole pepper.",
        "phone": "+91 44 2722 3456",
        "open_time": "06:00", "close_time": "21:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Traditional Kanchipuram Kovil Idli", "category": "Mains", "price": 85, "is_veg": True, "desc": "Dense, aromatic spiced idli seasoned with dried ginger, black pepper, and pure ghee"},
            {"name": "Filter Coffee & Nei Kesari Combo", "category": "Beverages", "price": 90, "is_veg": True, "desc": "Rich combo of Kumbakonam degree coffee and golden semolina halwa"}
        ]
    },

    # ------------------ 17. KANYAKUMARI ------------------
    {
        "name": "Sea Breeze Seafood Coast",
        "city": "Kanyakumari",
        "address": "Main Beach Road, Near Vivekananda Rock Memorial, Kanyakumari, Tamil Nadu 629702",
        "lat": 8.0883, "lng": 77.5385,
        "cuisine": "Seafood",
        "price_range": "₹₹",
        "avg_cost_for_two": 550,
        "rating": 4.7,
        "review_count": 690,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Southernmost tip of India dining with panoramic Triveni Sangam ocean views, Nagercoil fish curries, and coconut prawn roasts.",
        "phone": "+91 4652 246 789",
        "open_time": "10:30", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Kanyakumari Nethili & Ayala Fry Platter", "category": "Starters", "price": 280, "is_veg": False, "desc": "Crisp mackerel and anchovy fish fry with coastal spices and lemon wedges"},
            {"name": "Nagercoil Thenga Aracha Meen Curry", "category": "Mains", "price": 320, "is_veg": False, "desc": "Ground coconut and raw mango spiced sea fish gravy served with hot boiled rice"},
            {"name": "Kerala Style Kappa with Fish Curry", "category": "Mains", "price": 180, "is_veg": False, "desc": "Steamed tapioca mashed with turmeric and green chillies with spicy fish gravy"}
        ]
    },

    # ------------------ 18. RAMESWARAM ------------------
    {
        "name": "Temple View Bhojanalaya",
        "city": "Rameswaram",
        "address": "West Car Street, Near Ramanathaswamy Temple, Rameswaram, Tamil Nadu 623526",
        "lat": 9.2881, "lng": 79.3174,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 300,
        "rating": 4.8,
        "review_count": 810,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Sacred island pilgrimage dining steps from the holy 22 theerthams. Pure vegetarian satvik thalis, ghee dosas, and warm payasam.",
        "phone": "+91 4573 221 456",
        "open_time": "06:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Rameswaram Satvik Thali Meal", "category": "Mains", "price": 140, "is_veg": True, "desc": "No-onion no-garlic temple meal with fresh sambar, rasam, kootu, and moong dal payasam"},
            {"name": "Ghee Podi Butter Roast", "category": "Mains", "price": 100, "is_veg": True, "desc": "Crispy golden crepe smeared with freshly ground lentil podi and pure butter"},
            {"name": "Chilled Tender Coconut Payasam", "category": "Desserts", "price": 75, "is_veg": True, "desc": "Rich dessert made with fresh coconut water, coconut pulp and condensed milk"}
        ]
    },

    # ------------------ 19. KARAIKUDI (CHETTINAD HEART) ------------------
    {
        "name": "The Bangala Heritage Dining",
        "city": "Karaikudi",
        "address": "Devakottai Road, Senjai, Karaikudi, Tamil Nadu 630001",
        "lat": 10.0718, "lng": 78.7845,
        "cuisine": "Chettinad",
        "price_range": "₹₹₹₹",
        "avg_cost_for_two": 1200,
        "rating": 4.9,
        "review_count": 1420,
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        "description": "World-renowned 7-course Chettinad feast served in a heritage mansion. Praised globally for authenticity, uppu kari, and pineapple rasam.",
        "phone": "+91 4565 220 221",
        "open_time": "12:00", "close_time": "22:00", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "The Bangala 7-Course Royal Feast", "category": "Mains", "price": 650, "is_veg": False, "desc": "Elaborate banana leaf spread with mutton uppu kari, chicken roast, meen mandi, pineapple rasam"},
            {"name": "Mutton Uppu Kari (Chettinad Salt Meat)", "category": "Mains", "price": 380, "is_veg": False, "desc": "Slow cooked lamb with whole red chillies and shallots in cold-pressed gingelly oil"},
            {"name": "Vellai Paniyaram with Kara Chutney (4 Pcs)", "category": "Starters", "price": 140, "is_veg": True, "desc": "Crisp-edged fluffy white rice and urad dumplings with spicy tomato chutney"}
        ]
    },

    # ------------------ 20. KUMBAKONAM ------------------
    {
        "name": "Mangalambika Degree Coffee Hall",
        "city": "Kumbakonam",
        "address": "Big Bazaar Street, Near Mahamaham Tank, Kumbakonam, Tamil Nadu 612001",
        "lat": 10.9602, "lng": 79.3845,
        "cuisine": "South Indian",
        "price_range": "₹",
        "avg_cost_for_two": 200,
        "rating": 4.9,
        "review_count": 1650,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "The historic birthplace of Kumbakonam Degree Coffee. Unadulterated pure cow milk brew in brass dabarah-tumblers with hot vadai.",
        "phone": "+91 435 242 8899",
        "open_time": "06:00", "close_time": "21:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Original Kumbakonam Degree Coffee", "category": "Beverages", "price": 35, "is_veg": True, "desc": "Pure plantation A-grade chicory coffee brewed in thick cow milk and served piping hot"},
            {"name": "Kadamba Sambar Vadai", "category": "Starters", "price": 50, "is_veg": True, "desc": "Crispy golden medu vadai soaked in aromatic 10-vegetable Kadamba sambar"},
            {"name": "Kumbakonam Ash Gourd Halwa (Kasi Halwa)", "category": "Desserts", "price": 60, "is_veg": True, "desc": "Translucent golden winter-melon dessert with saffron and ghee"}
        ]
    },

    # ------------------ 21. CUDDALORE / CHIDAMBARAM ------------------
    {
        "name": "Nataraja Temple View Kitchen",
        "city": "Chidambaram",
        "address": "East Sannadhi Street, Near Nataraja Temple, Chidambaram, Tamil Nadu 608001",
        "lat": 11.3992, "lng": 79.6936,
        "cuisine": "Vegetarian",
        "price_range": "₹",
        "avg_cost_for_two": 280,
        "rating": 4.7,
        "review_count": 480,
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
        "description": "Traditional temple town tiffin center serving signature Kathirikai Gothsu, ven pongal, and crisp rava dosas.",
        "phone": "+91 4144 222 345",
        "open_time": "06:30", "close_time": "21:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Ven Pongal with Chidambaram Gothsu", "category": "Mains", "price": 80, "is_veg": True, "desc": "Ghee-tempered rice and lentil mash served with authentic spicy brinjal gothsu"},
            {"name": "Ghee Podi Onion Uttapam", "category": "Mains", "price": 100, "is_veg": True, "desc": "Thick rice pancake loaded with shallots and gun powder"}
        ]
    },

    # ------------------ 22. NAGAPATTINAM / VELANKANNI ------------------
    {
        "name": "Kadambadi Coastal Sea Feast",
        "city": "Nagapattinam",
        "address": "Port Beach Road, Near Lighthouse, Nagapattinam, Tamil Nadu 611001",
        "lat": 10.7656, "lng": 79.8436,
        "cuisine": "Seafood",
        "price_range": "₹₹",
        "avg_cost_for_two": 500,
        "rating": 4.7,
        "review_count": 510,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        "description": "Coromandel coast fresh seafood catches featuring spicy prawn thokku, crab roast, and seeraga samba seafood meals.",
        "phone": "+91 4365 241 122",
        "open_time": "11:00", "close_time": "22:30", "is_open": True,
        "table_status": TableStatus.AVAILABLE,
        "food_status": FoodStatus.AVAILABLE,
        "parking_status": ParkingStatus.AVAILABLE,
        "wait_time_mins": 5,
        "menu": [
            {"name": "Nagore Prawn Thokku", "category": "Mains", "price": 310, "is_veg": False, "desc": "Fresh bay prawns pan fried in spicy shallot, tomato, and fennel masala"},
            {"name": "Sankara (Red Snapper) Fish Fry", "category": "Starters", "price": 260, "is_veg": False, "desc": "Whole fresh red snapper fish spiced and tawa seared to crisp perfection"},
            {"name": "Coastal Seafood Banana Leaf Meal", "category": "Mains", "price": 240, "is_veg": False, "desc": "Unlimited rice with crab kulambu, meen kulambu, and prawn fry"}
        ]
    }
]

async def sync_all_tamilnadu_restaurants():
    print("Connecting to database to sync all Tamil Nadu restaurants...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Get or create owner user
        res = await session.execute(select(User).where(User.role == UserRole.RESTAURANT_OWNER).limit(1))
        owner = res.scalars().first()
        if not owner:
            owner = User(
                email="owner@anjappar.tn",
                hashed_password=get_password_hash("owner123"),
                full_name="Karthikeyan (TN Restaurant Owner)",
                phone="+91 94440 98765",
                role=UserRole.RESTAURANT_OWNER
            )
            session.add(owner)
            await session.commit()
            await session.refresh(owner)

        # 2. Sync all restaurants
        added_count = 0
        updated_count = 0

        for r_data in ALL_TAMILNADU_RESTAURANTS:
            # Check if restaurant exists by name and city
            q = await session.execute(
                select(Restaurant).where(
                    Restaurant.name == r_data["name"],
                    Restaurant.city == r_data["city"]
                )
            )
            existing_r = q.scalars().first()

            if existing_r:
                # Update details
                existing_r.address = r_data["address"]
                existing_r.lat = r_data["lat"]
                existing_r.lng = r_data["lng"]
                existing_r.cuisine = r_data["cuisine"]
                existing_r.price_range = r_data["price_range"]
                existing_r.avg_cost_for_two = r_data["avg_cost_for_two"]
                existing_r.rating = r_data["rating"]
                existing_r.review_count = r_data["review_count"]
                existing_r.image_url = r_data["image_url"]
                existing_r.description = r_data["description"]
                existing_r.phone = r_data["phone"]
                existing_r.open_time = r_data["open_time"]
                existing_r.close_time = r_data["close_time"]
                existing_r.is_open = r_data["is_open"]
                existing_r.table_status = r_data["table_status"]
                existing_r.food_status = r_data["food_status"]
                existing_r.parking_status = r_data["parking_status"]
                existing_r.wait_time_mins = r_data["wait_time_mins"]
                updated_count += 1
            else:
                # Insert new restaurant
                new_r = Restaurant(
                    owner_id=owner.id,
                    name=r_data["name"],
                    city=r_data["city"],
                    address=r_data["address"],
                    lat=r_data["lat"],
                    lng=r_data["lng"],
                    cuisine=r_data["cuisine"],
                    price_range=r_data["price_range"],
                    avg_cost_for_two=r_data["avg_cost_for_two"],
                    rating=r_data["rating"],
                    review_count=r_data["review_count"],
                    image_url=r_data["image_url"],
                    description=r_data["description"],
                    phone=r_data["phone"],
                    open_time=r_data["open_time"],
                    close_time=r_data["close_time"],
                    is_open=r_data["is_open"],
                    table_status=r_data["table_status"],
                    food_status=r_data["food_status"],
                    parking_status=r_data["parking_status"],
                    wait_time_mins=r_data["wait_time_mins"]
                )
                session.add(new_r)
                await session.flush()

                # Add Tables (T1 to T6)
                for t_num, cap in [("T1", 2), ("T2", 4), ("T3", 4), ("T4", 6), ("T5", 2), ("T6", 8)]:
                    session.add(RestaurantTable(
                        restaurant_id=new_r.id,
                        table_number=t_num,
                        capacity=cap,
                        is_active=True
                    ))

                # Add Menu Items
                for m_item in r_data["menu"]:
                    session.add(MenuItem(
                        restaurant_id=new_r.id,
                        name=m_item["name"],
                        category=m_item["category"],
                        price=m_item["price"],
                        is_vegetarian=m_item.get("is_veg", False),
                        description=m_item.get("desc", ""),
                        is_available=True
                    ))

                added_count += 1

        await session.commit()
        print(f"Sync complete! Added: {added_count} new restaurants, Updated: {updated_count} existing restaurants.")

if __name__ == "__main__":
    asyncio.run(sync_all_tamilnadu_restaurants())

