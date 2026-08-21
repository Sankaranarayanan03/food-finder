import re
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Restaurant, TableStatus, FoodStatus, ParkingStatus
from app.schemas import (
    AIQueryRequest, AIRecommendationResponse, RestaurantOut, AlternativeMatch
)
from app.routers.restaurants import calculate_distance

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])

TN_CITIES = [
    "chennai", "coimbatore", "madurai", "salem", "erode", "tiruchirappalli", "trichy",
    "tirunelveli", "thanjavur", "dindigul", "ooty", "tiruppur", "thoothukudi", "tuticorin",
    "vellore", "hosur", "kanchipuram"
]

CUISINE_KEYWORDS = {
    "chettinad": ["chettinad", "chettinadu", "pepper chicken", "karaikudi", "nattu kozhi"],
    "kongunadu": ["kongu", "kongunadu", "pallipalayam", "coimbatore special"],
    "madurai": ["madurai", "kari dosa", "bun parotta", "jigarthanda", "amma mess", "virudhunagar"],
    "biryani": ["biryani", "briyani", "thalappakatti", "seeraga samba", "dum biryani", "hyderabadi", "bucket biryani"],
    "vegetarian": ["veg", "vegetarian", "pure veg", "brahmin", "annapoorna", "sangeetha", "saravana bhavan", "tiffin"],
    "non-vegetarian": ["non veg", "non-veg", "chicken", "mutton", "meat", "gravy"],
    "seafood": ["seafood", "fish", "meen", "prawn", "crab", "vanjaram", "coastal", "nethili", "squid"],
    "parotta": ["parotta", "kothu", "salna", "ceylon parotta", "parota", "bun parotta"],
    "dosa": ["dosa", "dosai", "ghee roast", "kari dosa", "rava roast", "masala dosa", "podi dosa"],
    "idli": ["idli", "mallipoo", "podi idli", "murugan idli", "mini idli", "vada"],
    "traditional meals": ["meals", "banana leaf", "sodhi", "thali", "sappadu", "full meals", "elai sappadu"],
    "cafe & snacks": ["cafe", "coffee", "tea", "filter coffee", "snacks", "dessert", "bakery", "ice cream"]
}

GREETING_WORDS = ["hi", "hello", "vanakkam", "hey", "good morning", "good evening", "good afternoon", "help", "who are you", "what can you do"]

def parse_natural_language_intent(query_str: str) -> dict:
    q = query_str.lower().strip()
    
    # Check if query is a greeting
    is_greeting = any(q == g or q.startswith(g + " ") or q.endswith(" " + g) for g in GREETING_WORDS)

    intent = {
        "is_greeting": is_greeting,
        "city": None,
        "cuisine": None,
        "max_budget": None,
        "max_distance_km": None,
        "min_rating": None,
        "req_parking": False,
        "req_table": False,
        "req_veg": False,
        "req_open": False,
        "req_wait": False,
        "req_family": False,
        "req_romantic": False,
        "req_breakfast": False,
        "req_luxury": False,
        "keywords": []
    }

    # 1. Detect City
    for c in TN_CITIES:
        if c in q:
            intent["city"] = "Tiruchirappalli" if c == "trichy" else ("Thoothukudi" if c == "tuticorin" else c.title())
            break

    # 2. Detect Veg / Non-Veg & Cuisine
    is_explicit_nonveg = any(term in q for term in ["non-veg", "non veg", "nonveg", "chicken", "mutton", "fish", "meat", "seafood", "biryani", "prawn"])
    if ("vegetarian" in q or "pure veg" in q or "only veg" in q or "veg restaurant" in q or "veg food" in q) and not is_explicit_nonveg:
        intent["req_veg"] = True
        intent["cuisine"] = "Vegetarian"

    for cuisine_key, synonyms in CUISINE_KEYWORDS.items():
        if any(syn in q for syn in synonyms):
            intent["cuisine"] = cuisine_key.title()
            if cuisine_key == "vegetarian" and not is_explicit_nonveg:
                intent["req_veg"] = True
            break

    # 3. Detect Ambience & Experience Intent (Romantic, Family, Luxury, Breakfast)
    if any(term in q for term in ["romantic", "date night", "candle light", "candlelight", "couple", "anniversary"]):
        intent["req_romantic"] = True
    if any(term in q for term in ["family", "kids", "children", "group", "family dinner"]):
        intent["req_family"] = True
    if any(term in q for term in ["luxury", "fine dining", "5 star", "five star", "premium", "fancy"]):
        intent["req_luxury"] = True
    if any(term in q for term in ["breakfast", "tiffin", "morning", "coffee", "idli", "vada", "pongal"]):
        intent["req_breakfast"] = True

    # 4. Detect Budget (e.g. "under 500", "under ₹500", "below 1000", "< 800", "budget of 600", "cheap", "affordable")
    budget_match = re.search(r'(?:under|below|less than|within|budget of|<|<=)\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})', q)
    if budget_match:
        intent["max_budget"] = int(budget_match.group(1))
    elif any(term in q for term in ["cheap", "budget", "affordable", "pocket friendly"]):
        intent["max_budget"] = 400

    # 5. Detect Distance (e.g. "within 5 km", "under 10km", "near me", "closest", "nearby")
    dist_match = re.search(r'(?:within|under|less than|radius of)\s*(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers)', q)
    if dist_match:
        intent["max_distance_km"] = float(dist_match.group(1))
    elif any(term in q for term in ["near me", "closest", "nearby", "around me", "my location"]):
        intent["max_distance_km"] = 10.0

    # 6. Detect Rating requirement (e.g. "4 star", "4.5+", "top rated", "highly rated", "best")
    rating_match = re.search(r'(\d(?:\.\d)?)\s*(?:\+|star|stars|rating)', q)
    if rating_match:
        intent["min_rating"] = float(rating_match.group(1))
    elif any(term in q for term in ["top rated", "highly rated", "best", "popular", "famous", "top"]):
        intent["min_rating"] = 4.5

    # 7. Detect Operational & Amenity Flags (Parking, Table, Open Now, Wait Time)
    if any(term in q for term in ["parking", "car park", "vehicle", "valet"]):
        intent["req_parking"] = True
    if any(term in q for term in ["table", "available table", "seat", "seating", "book table", "reserve", "slot"]):
        intent["req_table"] = True
    if any(term in q for term in ["open now", "currently open", "open today", "open status"]):
        intent["req_open"] = True
    if any(term in q for term in ["waiting time", "wait time", "shortest wait", "no wait", "quick seat", "fastest"]):
        intent["req_wait"] = True

    return intent

@router.post("", response_model=AIRecommendationResponse)
async def get_ai_recommendations(
    payload: AIQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    intent = parse_natural_language_intent(payload.query)
    
    # Fetch all restaurants
    result = await db.execute(select(Restaurant))
    restaurants = result.scalars().all()

    # User coordinates
    u_lat = payload.user_lat if payload.user_lat is not None else 13.0827
    u_lng = payload.user_lng if payload.user_lng is not None else 80.2707

    # If greeting query, return warm intro with top recommended spot
    if intent["is_greeting"]:
        best_rest = max(restaurants, key=lambda r: r.rating) if restaurants else None
        r_out = RestaurantOut.model_validate(best_rest) if best_rest else None
        if r_out:
            r_out.distance_km = calculate_distance(u_lat, u_lng, best_rest.lat, best_rest.lng)
            r_out.travel_time_mins = max(5, int((r_out.distance_km / 25.0) * 60))

        other_rests = [r for r in restaurants if r.id != (best_rest.id if best_rest else 0)]
        alts = []
        for r in other_rests[:4]:
            ro = RestaurantOut.model_validate(r)
            ro.distance_km = calculate_distance(u_lat, u_lng, r.lat, r.lng)
            ro.travel_time_mins = max(5, int((ro.distance_km / 25.0) * 60))
            alts.append(AlternativeMatch(restaurant=ro, match_reason=f"Popular {r.cuisine} spot in {r.city}", score=90.0))

        return AIRecommendationResponse(
            parsed_intent=intent,
            best_match=r_out,
            recommendation_reason="Vanakkam! 👋 I am your Smart Restaurant Finder AI Assistant. Ask me anything like 'Vegetarian in Coimbatore under ₹500', 'Best Biryani in Chennai', or 'Romantic dinner with parking'!",
            alternatives=alts
        )

    scored_candidates = []
    
    for r in restaurants:
        score = 0.0
        reasons = []

        # Distance calculation
        dist = calculate_distance(u_lat, u_lng, r.lat, r.lng)
        travel_mins = max(5, int((dist / 25.0) * 60))

        # City Match
        if intent["city"]:
            if intent["city"].lower() in r.city.lower():
                score += 40
                reasons.append(f"Located in {r.city}")
            else:
                score -= 30
        else:
            score += 10 # generic bonus

        # Cuisine / Food Match
        if intent["cuisine"]:
            if intent["cuisine"].lower() in r.cuisine.lower() or intent["cuisine"].lower() in (r.description or "").lower():
                score += 35
                reasons.append(f"Authentic {r.cuisine} match")
            elif intent["req_veg"] and ("veg" in r.cuisine.lower() or "veg" in (r.description or "").lower()):
                score += 30
                reasons.append("Vegetarian specialty")
        
        # Romantic & Special Ambiance Match
        if intent["req_romantic"]:
            if r.rating >= 4.5 and r.avg_cost_for_two >= 500:
                score += 25
                reasons.append("Great romantic ambiance & fine dining experience")

        # Luxury & Fine Dining Match
        if intent["req_luxury"]:
            if r.avg_cost_for_two >= 800:
                score += 25
                reasons.append("Premium fine dining spot")

        # Breakfast / Tiffin Match
        if intent["req_breakfast"]:
            if "veg" in r.cuisine.lower() or "breakfast" in (r.description or "").lower() or "idli" in (r.description or "").lower() or "cafe" in r.cuisine.lower():
                score += 25
                reasons.append("Authentic breakfast & tiffin menu")

        # Budget Match
        if intent["max_budget"]:
            if r.avg_cost_for_two <= intent["max_budget"]:
                score += 20
                reasons.append(f"Well within budget (₹{r.avg_cost_for_two} for two vs limit ₹{intent['max_budget']})")
            else:
                score -= 15

        # Distance Match
        if intent["max_distance_km"]:
            if dist <= intent["max_distance_km"]:
                score += 20
                reasons.append(f"Nearby at {dist} km")
            else:
                score -= 10
        else:
            if dist <= 10:
                score += 10

        # Parking Requirement
        if intent["req_parking"]:
            if r.parking_status == ParkingStatus.AVAILABLE:
                score += 15
                reasons.append("Guaranteed parking available")
            elif r.parking_status == ParkingStatus.FULL:
                score -= 20

        # Table Availability
        if intent["req_table"]:
            if r.table_status == TableStatus.AVAILABLE:
                score += 20
                reasons.append("Live table ready with zero delay")
            elif r.table_status == TableStatus.FULL:
                score -= 25

        # Wait Time Requirement
        if intent["req_wait"]:
            score += max(0, 30 - r.wait_time_mins)
            reasons.append(f"Short wait time ({r.wait_time_mins} mins)")

        # Open Status Check
        if r.is_open:
            score += 15
            if intent["req_open"]:
                reasons.append("Currently open & accepting diners")
        else:
            if intent["req_open"]:
                score -= 100
            else:
                score -= 50

        # Rating Bonus
        score += (r.rating * 5)
        if r.rating >= 4.7:
            reasons.append(f"Elite {r.rating}★ customer rating")

        r_out = RestaurantOut.model_validate(r)
        r_out.distance_km = dist
        r_out.travel_time_mins = travel_mins

        reason_str = " • ".join(reasons) if reasons else f"Great {r.cuisine} restaurant in {r.city}"
        scored_candidates.append((score, r_out, reason_str))

    # Sort descending by score
    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    if not scored_candidates:
        return AIRecommendationResponse(
            parsed_intent=intent,
            best_match=None,
            recommendation_reason="No matching restaurants found for this criteria in Tamil Nadu.",
            alternatives=[]
        )

    best_score, best_match, best_reason = scored_candidates[0]
    
    # Formulate alternatives
    alternatives = []
    for sc, cand, reas in scored_candidates[1:5]:
        alternatives.append(
            AlternativeMatch(
                restaurant=cand,
                match_reason=reas,
                score=round(sc, 1)
            )
        )

    return AIRecommendationResponse(
        parsed_intent=intent,
        best_match=best_match,
        recommendation_reason=f"Top AI Pick: {best_reason}",
        alternatives=alternatives
    )

