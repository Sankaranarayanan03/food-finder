import asyncio
import os
import sys

# UTF-8 stdout configuration for Windows console compatibility
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base, AsyncSessionLocal
from app.seed import seed_database
from app.models import User, UserRole, Restaurant
from app.routers.recommendations import get_ai_recommendations, parse_natural_language_intent
from app.routers.admin import admin_ai_supervisor_query
from app.routers.owner import owner_ai_assistant_query, owner_ai_execute_mutation
from app.schemas import (
    AIQueryRequest, AdminAIQueryRequest, OwnerAIQueryRequest, OwnerAIMutationRequest
)
from sqlalchemy.future import select

async def run_tests():
    print("=" * 60)
    print("STARTING AI CHAT BOX SUITE VERIFICATION")
    print("=" * 60)

    # 1. Initialize & Seed DB
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()

    async with AsyncSessionLocal() as db:
        # Get users for testing
        admin_user = (await db.execute(select(User).where(User.role == UserRole.ADMIN))).scalars().first()
        owner_user = (await db.execute(select(User).where(User.role == UserRole.RESTAURANT_OWNER))).scalars().first()
        cust_user = (await db.execute(select(User).where(User.role == UserRole.CUSTOMER))).scalars().first()

        restaurant = (await db.execute(select(Restaurant).where(Restaurant.owner_id == owner_user.id))).scalars().first()
        if not restaurant:
            restaurant = (await db.execute(select(Restaurant))).scalars().first()

        print(f"Test Context Loaded:")
        print(f"  Admin: {admin_user.email} (ID: {admin_user.id})")
        print(f"  Owner: {owner_user.email} (ID: {owner_user.id}, Rest ID: {restaurant.id})")
        print(f"  Customer: {cust_user.email} (ID: {cust_user.id})")
        print("-" * 60)

        # ----------------------------------------------------
        # TEST 1: CUSTOMER AI NATURAL LANGUAGE QUERIES
        # ----------------------------------------------------
        print("\n--- [1/3] TESTING CUSTOMER AI RECOMMENDATIONS ---")
        customer_queries = [
            "Find vegetarian restaurants near Coimbatore under ₹500.",
            "Show restaurants near me with parking.",
            "I want Chettinad food in Madurai.",
            "Find restaurants with tables available at 8 PM.",
            "Which restaurant has the shortest waiting time?",
            "Show highly rated restaurants near me.",
            "Find family restaurants in Chennai."
        ]

        for q in customer_queries:
            req = AIQueryRequest(query=q, user_lat=13.0827, user_lng=80.2707)
            res = await get_ai_recommendations(payload=req, db=db)
            print(f"\nQuery: '{q}'")
            print(f"  Parsed Intent: {res.parsed_intent}")
            if res.best_match:
                print(f"  Top Match: {res.best_match.name} ({res.best_match.city}, ₹{res.best_match.avg_cost_for_two})")
                print(f"  Reason: {res.recommendation_reason}")
            else:
                print(f"  Fallback: {res.recommendation_reason}")
            assert res.recommendation_reason is not None

        # ----------------------------------------------------
        # TEST 2: ADMIN AI SUPERVISOR QUERIES
        # ----------------------------------------------------
        print("\n--- [2/3] TESTING ADMIN AI SUPERVISOR ---")
        admin_queries = [
            "How many restaurants are registered?",
            "How many bookings were made today?",
            "How many customers checked in today?",
            "Show verification audit statistics.",
            "How many registered restaurant owners are there?",
            "Which Tamil Nadu city has the most restaurants?",
            "How many complaints are pending?",
            "Which restaurants have the highest number of bookings?",
            "Show today's platform overview."
        ]

        for q in admin_queries:
            req = AdminAIQueryRequest(query=q)
            res = await admin_ai_supervisor_query(payload=req, current_user=admin_user, db=db)
            print(f"\nAdmin Query: '{q}'")
            print(f"  Answer Snippet: {res.answer[:120]}...")
            assert res.answer and "I don't have enough verified data" not in res.answer or "Overview" in res.answer or "Audit" in res.answer or "Registered" in res.answer or "Analytics" in res.answer or "Top" in res.answer

        # ----------------------------------------------------
        # TEST 3: RESTAURANT OWNER AI ASSISTANT QUERIES & MUTATIONS
        # ----------------------------------------------------
        print("\n--- [3/3] TESTING OWNER AI ASSISTANT & MUTATIONS ---")
        owner_queries = [
            "How many bookings do I have today?",
            "How many customers are expected tonight?",
            "How many tables are available at 8 PM?",
            "How many customers checked in today?",
            "Show today's cancelled bookings.",
            "What is my average rating?",
            "Do I have pending complaints?",
            "What are my most popular menu items?",
            "What is my busiest booking time?"
        ]

        for q in owner_queries:
            req = OwnerAIQueryRequest(query=q, restaurant_id=restaurant.id)
            res = await owner_ai_assistant_query(payload=req, current_user=owner_user, db=db)
            print(f"\nOwner Query: '{q}'")
            print(f"  Answer Snippet: {res.answer[:120]}...")
            assert res.answer is not None

        # Confirm-then-execute mutation flow test
        print("\n--- Testing Owner Operational Mutation Flow ---")
        mut_query = "Set waiting time to 30 minutes."
        req = OwnerAIQueryRequest(query=mut_query, restaurant_id=restaurant.id)
        res = await owner_ai_assistant_query(payload=req, current_user=owner_user, db=db)
        print(f"Mutation Query: '{mut_query}'")
        print(f"  Requires Confirmation: {res.requires_confirmation}")
        print(f"  Pending Action: {res.pending_action}")
        print(f"  Pending Params: {res.pending_params}")
        assert res.requires_confirmation is True
        assert res.pending_action == "update_wait_time"

        # Execute confirmed mutation
        mut_req = OwnerAIMutationRequest(
            restaurant_id=restaurant.id,
            action=res.pending_action,
            params=res.pending_params
        )
        mut_res = await owner_ai_execute_mutation(payload=mut_req, current_user=owner_user, db=db)
        print(f"Mutation Execution Result: {mut_res.message}")
        assert mut_res.success is True
        assert mut_res.updated_data["wait_time_mins"] == 30

    print("\n" + "=" * 60)
    print("ALL AI CHAT BOX TESTS PASSED SUCCESSFULLY! ZERO KNOWN ERRORS.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
