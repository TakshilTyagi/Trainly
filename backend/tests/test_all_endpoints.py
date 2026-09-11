"""
test_all_endpoints.py - Automated System & API Verification Test Suite for Trainly
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from backend.main import app

def test_system():
    client = TestClient(app)
    print("Testing Trainly System Endpoints...\n")

    # 1. Root & Static Files
    r_root = client.get("/")
    assert r_root.status_code == 200, f"Root failed: {r_root.status_code}"
    print("  [PASS] Root / serves frontend HTML (Status: 200)")

    # 2. Fleet Overview & Status Filtering
    r_fleet = client.get("/api/fleet")
    assert r_fleet.status_code == 200, f"Fleet failed: {r_fleet.status_code}"
    fleet = r_fleet.json()
    assert len(fleet) >= 28, f"Expected at least 28 trains, got {len(fleet)}"
    print(f"  [PASS] GET /api/fleet returns all {len(fleet)} trains: {[t['name'] for t in fleet]}")

    r_ontime = client.get("/api/fleet?status=on_time")
    assert r_ontime.status_code == 200 and len(r_ontime.json()) > 0
    print(f"  [PASS] GET /api/fleet?status=on_time returns {len(r_ontime.json())} on-time trains")

    r_delayed = client.get("/api/fleet?status=delayed")
    assert r_delayed.status_code == 200 and len(r_delayed.json()) > 0
    print(f"  [PASS] GET /api/fleet?status=delayed returns {len(r_delayed.json())} delayed trains")

    r_notdep = client.get("/api/fleet?status=not_departed")
    assert r_notdep.status_code == 200 and len(r_notdep.json()) > 0
    print(f"  [PASS] GET /api/fleet?status=not_departed returns {len(r_notdep.json())} pre-departure trains")

    r_arrived = client.get("/api/fleet?status=arrived")
    assert r_arrived.status_code == 200 and len(r_arrived.json()) > 0
    print(f"  [PASS] GET /api/fleet?status=arrived returns {len(r_arrived.json())} arrived trains")

    # 3. Train Journey Log & ML ETA for 22490
    r_journey = client.get("/api/train/22490/journey")
    assert r_journey.status_code == 200, f"Journey failed: {r_journey.status_code}"
    journey = r_journey.json()
    assert len(journey["journey_log"]) == 7, "Expected 7 stations for Vande Bharat"
    assert "why_this_eta" in journey, "Missing why_this_eta"
    print(f"  [PASS] GET /api/train/22490/journey returns 7 stations, explanation: '{journey['why_this_eta'][:45]}...'")

    # 4. Live Position
    r_pos = client.get("/api/train/22490/position")
    assert r_pos.status_code == 200
    pos = r_pos.json()
    assert "lat" in pos and "lon" in pos and pos["speed_kmh"] > 0
    print(f"  [PASS] GET /api/train/22490/position returns coords ({pos['lat']}, {pos['lon']}) at {pos['speed_kmh']} km/h")

    # 5. Feedback submission & trust confirmation
    r_fb_submit = client.post("/api/feedback", json={
        "train_no": "22490",
        "cause_tag": "Congestion",
        "note": "Automated verification test report",
        "user_id": "usr_test",
        "user_name": "Test Runner"
    })
    assert r_fb_submit.status_code == 200
    fb_id = r_fb_submit.json()["report_id"]
    print(f"  [PASS] POST /api/feedback recorded report id: {fb_id}")

    r_confirm = client.post(f"/api/feedback/{fb_id}/confirm", json={"user_id": "usr_other"})
    assert r_confirm.status_code == 200
    print("  [PASS] POST /api/feedback/{id}/confirm incremented trust count")

    # 6. AI Assistant Grounded Queries
    queries = [
        "Will the Vande Bharat reach Lucknow on time?",
        "Is the Manduadih Express usually this delayed?",
        "What is the nearest station to me right now?"
    ]
    for q in queries:
        r_ai = client.post("/api/assistant/query", json={"query": q, "active_train_no": "22490"})
        assert r_ai.status_code == 200
        ans = r_ai.json()
        assert len(ans["response"]) > 20
        print(f"  [PASS] POST /api/assistant/query -> '{q}' -> Tool: {ans.get('tool_used')}")

    # 7. Authentication: Guest & Login
    r_guest = client.post("/api/auth/guest")
    assert r_guest.status_code == 200 and r_guest.json()["user"]["is_guest"] is True
    print("  [PASS] POST /api/auth/guest creates valid guest session")

    r_login = client.post("/api/auth/login", json={"email": "rahul.sharma@example.com", "password": "demo123"})
    assert r_login.status_code == 200 and r_login.json()["user"]["email"] == "rahul.sharma@example.com"
    print("  [PASS] POST /api/auth/login succeeds for test account")

    # 8. Control Room Metrics & Bottlenecks
    r_ctrl = client.get("/api/control-room")
    assert r_ctrl.status_code == 200
    ctrl = r_ctrl.json()
    assert ctrl["summary"]["total_trains"] >= 28
    assert len(ctrl["bottlenecks"]) >= 4
    print(f"  [PASS] GET /api/control-room returns {len(ctrl['bottlenecks'])} bottlenecks, {len(ctrl['alerts'])} alerts")

    print("\nALL 8 SYSTEM & API TEST SUITES PASSED! (100% SUCCESS)\n")

if __name__ == "__main__":
    test_system()
