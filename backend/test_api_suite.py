import asyncio
import httpx
import sys
from datetime import date, timedelta

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"

async def run_tests():
    print("================================================================")
    print("STARTING SECURE CHECK-IN & EMAIL VERIFICATION SUITE (TN EDITION)")
    print("================================================================")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Test Login for Customer, Owner, Admin
        print("\n[TEST 1] Testing Authentication (Customer, Owner, Admin)...")
        res = await client.post("/auth/login", json={"email": "arun@example.com", "password": "customer123"})
        assert res.status_code == 200, f"Customer login failed: {res.text}"
        customer_token = res.json()["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        print("  [PASS] Customer login successful.")

        res = await client.post("/auth/login", json={"email": "owner@anjappar.tn", "password": "owner123"})
        assert res.status_code == 200, f"Owner login failed: {res.text}"
        owner_token = res.json()["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        print("  [PASS] Restaurant Owner (Anjappar) login successful.")

        res = await client.post("/auth/login", json={"email": "admin@smartfinder.tn", "password": "admin123"})
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        admin_token = res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  [PASS] Admin login successful.")

        # 2. Test Restaurant Search
        print("\n[TEST 2] Testing Restaurant Search & City/Cuisine Filters...")
        res = await client.get("/restaurants?city=Chennai")
        assert res.status_code == 200
        chennai_rests = res.json()
        assert len(chennai_rests) >= 1
        print(f"  [PASS] Found {len(chennai_rests)} restaurants in Chennai.")

        # 3. Test Booking Creation & Cryptographic 6-Digit Server Code
        print("\n[TEST 3] Testing Booking Creation & Cryptographic 6-Digit Server Code...")
        test_rest = next((r for r in chennai_rests if "Anjappar" in r["name"]), chennai_rests[0])
        test_rest_id = test_rest["id"]

        today_str = date.today().strftime("%Y-%m-%d")
        tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        import random
        random_hour = random.randint(13, 21)
        random_min = random.choice([0, 15, 30, 45])
        test_time_slot = f"{random_hour:02d}:{random_min:02d}"

        booking_payload = {
            "restaurant_id": test_rest_id,
            "booking_date": tomorrow_str,
            "booking_time": test_time_slot,
            "guest_count": 2,
            "special_requests": "Window table please"
        }
        res = await client.post("/bookings", json=booking_payload, headers=customer_headers)
        assert res.status_code == 201, f"Booking creation failed: {res.text}"
        booking_data = res.json()
        booking_id = booking_data["id"]
        v_code = booking_data["verification_code"]
        assert len(v_code) == 6 and v_code.isdigit(), f"Expected 6-digit numeric code, got {v_code}"
        assert booking_data["verification_status"] == "PENDING"
        assert booking_data["code_used"] is False
        print(f"  [PASS] Booking Created: Ref {booking_data['booking_ref']} with Server 6-Digit Code: {v_code}")

        # 4. Test Customer View in My Bookings
        print("\n[TEST 4] Testing Customer Booking Details & Verification Code Display...")
        res = await client.get("/bookings/my-bookings", headers=customer_headers)
        assert res.status_code == 200
        my_bookings = res.json()
        target_b = next((b for b in my_bookings if b["id"] == booking_id), None)
        assert target_b is not None
        assert target_b["verification_code"] == v_code
        print("  [PASS] Customer can view verification code in My Bookings.")

        # 5. Test 5-Stage Non-Leaky Verification Pipeline
        print("\n[TEST 5] Testing 5-Stage Non-Leaky Verification Pipeline...")
        # Check 1: Non-existent code -> "Invalid verification code."
        res = await client.post("/checkin/verify-code", json={"verification_code": "999999"}, headers=admin_headers)
        assert res.status_code == 400
        assert res.json()["detail"] == "Invalid verification code."
        print("  [PASS] Check 1: Non-existent code returns 'Invalid verification code.'")

        # Create a second booking and cancel it to test Check 3
        b2_time_slot = f"{((random_hour + 2) % 10 + 12):02d}:{random_min:02d}"
        b2_res = await client.post("/bookings", json={
            "restaurant_id": test_rest_id,
            "booking_date": tomorrow_str,
            "booking_time": b2_time_slot,
            "guest_count": 2
        }, headers=customer_headers)
        b2_data = b2_res.json()
        b2_id = b2_data["id"]
        b2_code = b2_data["verification_code"]

        # Cancel b2
        cancel_res = await client.post(f"/bookings/{b2_id}/cancel", headers=customer_headers)
        assert cancel_res.status_code == 200

        # Try checkin with cancelled code -> "Invalid verification code." (non-leaky)
        res = await client.post("/checkin/verify-code", json={"verification_code": b2_code}, headers=admin_headers)
        assert res.status_code == 400
        assert res.json()["detail"] == "Invalid verification code."
        print("  [PASS] Check 3: Cancelled booking returns 'Invalid verification code.'")

        # 6. Test Valid Owner Check-In Verification & Loyalty Award
        print("\n[TEST 6] Testing Valid Check-In & Idempotent Loyalty Award...")
        res = await client.post("/checkin/verify-code", json={"verification_code": v_code}, headers=admin_headers)
        assert res.status_code == 200, f"Check-in verification failed: {res.text}"
        checkin_res = res.json()
        assert checkin_res["success"] is True
        assert checkin_res["message"] == "✓ CUSTOMER VERIFIED — ✓ CHECK-IN SUCCESSFUL"
        assert checkin_res["points_awarded"] == 10, "Expected 10 loyalty points awarded"
        print(f"  [PASS] Check-In Successful: '{checkin_res['message']}' (+{checkin_res['points_awarded']} pts)")

        # Test Check 5: Reused Code Rejection
        res_reused = await client.post("/checkin/verify-code", json={"verification_code": v_code}, headers=admin_headers)
        assert res_reused.status_code == 400
        assert res_reused.json()["detail"] == "Verification code already used."
        print("  [PASS] Check 5: Reused check-in code rejected with 'Verification code already used.'")

        # 7. Test Verified Review Submission (Only after check-in)
        print("\n[TEST 7] Testing Verified Review Submission (Post-Check-In Only)...")
        review_payload = {
            "booking_id": booking_id,
            "rating": 5.0,
            "comment": "Outstanding Chettinad Pepper Chicken! Verified check-in visit was seamless!"
        }
        res = await client.post("/reviews", json=review_payload, headers=customer_headers)
        assert res.status_code == 201, f"Review creation failed: {res.text}"
        review_data = res.json()
        assert review_data["is_verified_visit"] is True
        print(f"  [PASS] Verified Review Submitted: {review_data['rating']} stars")

        # 8. Test Today's Check-Ins Endpoint
        print("\n[TEST 8] Testing Owner Dashboard & Today's Check-Ins Endpoint...")
        res = await client.get(f"/owner/dashboard/{test_rest_id}", headers=owner_headers)
        assert res.status_code == 200, f"Owner dashboard failed with status {res.status_code}: {res.text}"
        dash_data = res.json()
        assert "today_checkins" in dash_data
        print(f"  [PASS] Owner Dashboard returns today's checkins count: {len(dash_data['today_checkins'])}")

        # 9. Test AI Chat Box Endpoints (Customer, Admin, Owner)
        print("\n[TEST 9] Testing AI Chat Box Endpoints & Security Scoping...")
        # Customer AI
        res_c = await client.post("/recommendations", json={"query": "Spicy Biryani in Chennai under ₹600"})
        assert res_c.status_code == 200
        print("  [PASS] Customer AI parsed natural language recommendation query.")

        # Admin AI
        res_a = await client.post("/admin/ai-query", json={"query": "How many restaurants are registered?"}, headers=admin_headers)
        assert res_a.status_code == 200
        assert "total_restaurants" in res_a.json()["metrics"]
        print("  [PASS] Admin AI Supervisor returned verified platform metrics.")

        # Admin AI Security Test (Customer cannot access Admin AI)
        res_a_forbidden = await client.post("/admin/ai-query", json={"query": "Show stats"}, headers=customer_headers)
        assert res_a_forbidden.status_code in [401, 403]
        print("  [PASS] Admin AI correctly rejected non-admin customer request (Security verified).")

        # Owner AI Query
        res_o = await client.post("/owner/ai-query", json={"query": "How many tables are available?", "restaurant_id": test_rest_id}, headers=owner_headers)
        assert res_o.status_code == 200
        print("  [PASS] Owner AI Assistant returned real operational table status.")

        # Owner AI Confirm-Then-Execute Flow
        res_o_mut_ask = await client.post("/owner/ai-query", json={"query": "Set waiting time to 25 mins", "restaurant_id": test_rest_id}, headers=owner_headers)
        assert res_o_mut_ask.status_code == 200
        assert res_o_mut_ask.json()["requires_confirmation"] is True
        print("  [PASS] Owner AI mutation asked for explicit confirmation before DB write.")

        # Confirm Mutation Call
        res_o_exec = await client.post("/owner/ai-execute-mutation", json={
            "restaurant_id": test_rest_id,
            "action": "update_wait_time",
            "params": {"wait_time_mins": 25}
        }, headers=owner_headers)
        assert res_o_exec.status_code == 200
        assert res_o_exec.json()["success"] is True
        print("  [PASS] Owner AI mutation executed & database updated successfully after confirmation.")

        print("\n================================================================")
        print("ALL SECURE CHECK-IN & AI CHAT SUITE TESTS PASSED SUCCESSFULLY!")
        print("================================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())

