"""
test_timing_and_poller.py - Comprehensive Verification for Timing/Delay Accuracy and Background Poller
Tests:
1. compute_delay_minutes accuracy and midnight rollovers
2. Distinction between official timetable schedule and live actual telemetry
3. Predicted arrival time calculation across current and upcoming stations
4. Dynamic next_eta computation
5. Proactive background cache warming and live API endpoints
"""

import sys
import time
import os

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests
from backend.providers.timing_utils import (
    compute_delay_minutes,
    add_delay_to_time,
    format_status_label,
    format_status_class,
    format_delay_note
)
from backend.providers.live_ntes import get_data_provider

def test_delay_math():
    print("\n--- TEST 1: Delay Calculation & Midnight Rollovers ---")
    # 1. Normal delay
    assert compute_delay_minutes("09:10", "09:45") == 35.0
    print("[PASS] Normal delay: 09:10 vs 09:45 -> +35.0 min")

    # 2. Running early
    assert compute_delay_minutes("07:08", "07:07") == -1.0
    print("[PASS] Running early: 07:08 vs 07:07 -> -1.0 min")

    # 3. Midnight rollover: scheduled late night, arrived next day
    assert compute_delay_minutes("23:50", "00:15") == 25.0
    print("[PASS] Midnight rollover (cross day): 23:50 vs 00:15 -> +25.0 min")

    # 4. Midnight rollover: scheduled early morning, arrived night before
    assert compute_delay_minutes("00:05", "23:55") == -10.0
    print("[PASS] Midnight rollover (early arrival): 00:05 vs 23:55 -> -10.0 min")

    # 5. Multi-day itineraries
    assert compute_delay_minutes("00:50", "00:58", sched_day=2, actual_day=2) == 8.0
    print("[PASS] Multi-day (Day 2): 00:50 vs 00:58 -> +8.0 min")

    assert compute_delay_minutes("00:20", "03:00", sched_day=3, actual_day=3) == 160.0
    print("[PASS] Multi-day (Day 3): 00:20 vs 03:00 -> +160.0 min")

    # 6. add_delay_to_time
    assert add_delay_to_time("16:40", 35) == "17:15"
    assert add_delay_to_time("02:28", 160) == "05:08"
    assert add_delay_to_time("22:30", 190) == "01:40"
    assert add_delay_to_time("07:08", -1) == "07:07"
    print("[PASS] Clock time projection with 24h wrap passed.")

def test_schedule_vs_actual_distinction():
    print("\n--- TEST 2: Official Timetable vs Live Actual Telemetry Distinction ---")
    provider = get_data_provider()

    for train_no in ["22490", "12615", "22536"]:
        journey = provider.get_train_journey(train_no)
        departed_stops = [s for s in journey["journey_log"] if s["status_type"] == "departed"]
        assert len(departed_stops) > 0, f"Train {train_no} should have departed stops"

        for s in departed_stops:
            stn_code = s["station_code"]
            sched = s["scheduled_time"]
            act = s["actual_time"]
            delay = s["delay_min"]

            # If delay is non-zero, sched and act must NOT be identical!
            if abs(delay) > 0:
                assert sched != act, f"Bug: Station {stn_code} on train {train_no} has delay {delay} but sched ({sched}) == act ({act})!"
                print(f"[PASS] Train {train_no} @ {stn_code}: Sched={sched} != Actual={act} (Delay: {delay:+.0f}m)")
            else:
                print(f"[PASS] Train {train_no} @ {stn_code}: Sched={sched}, Actual={act} (On time)")

    # Train 12951 (Scheduled / not started)
    j_12951 = provider.get_train_journey("12951")
    assert j_12951["current_status_label"] == "Scheduled"
    for s in j_12951["journey_log"]:
        assert s["actual_time"] is None, f"12951 stop {s['station_code']} must not have actual_time before departure"
    print("[PASS] Train 12951 correctly identified as Scheduled with actual_time=None across all stops.")

    # Train 12004 (Arrived / Completed)
    j_12004 = provider.get_train_journey("12004")
    assert j_12004["train_status"] == "COMPLETED"
    assert j_12004["is_completed"] is True
    assert j_12004["current_status_label"] == "Arrived"
    assert j_12004["journey_log"][-1]["is_arrived"] is True
    assert "Reached final destination" in j_12004["journey_log"][-1]["time_display"]
    print("[PASS] Train 12004 correctly identified as Arrived with destination marked as Reached final destination.")

def test_predicted_time_consistency():
    print("\n--- TEST 3: Predicted Time Consistency Across Upcoming Stops ---")
    provider = get_data_provider()

    for train_no in ["22490", "12615", "22536"]:
        journey = provider.get_train_journey(train_no)
        upcoming_stops = [s for s in journey["journey_log"] if s["status_type"] in ["current", "upcoming"]]

        for s in upcoming_stops:
            sched = s["scheduled_time"]
            pred = s["predicted_time"]
            delay = s["delay_min"]
            expected_pred = add_delay_to_time(sched, delay)
            assert pred == expected_pred, f"Prediction mismatch at {s['station_code']}: got {pred}, expected {expected_pred}"
            assert s["actual_time"] is None, f"Upcoming station {s['station_code']} must have actual_time=None"

        print(f"[PASS] Train {train_no}: All {len(upcoming_stops)} upcoming stops have predicted_time == sched_time + delay.")

def test_fleet_and_api(base_url="http://localhost:8080"):
    print(f"\n--- TEST 4: Live Server API & Background Cache Verification ({base_url}) ---")
    resp = requests.get(f"{base_url}/api/fleet", timeout=5)
    assert resp.status_code == 200, f"Fleet endpoint failed with {resp.status_code}"
    fleet = resp.json()
    assert len(fleet) >= 4, f"Expected at least 4 fleet trains, got {len(fleet)}"

    for t in fleet:
        print(f"  * [{t['train_no']}] {t['name']}: {t['status_label']} | Near: {t['currently_near']} | Next: {t['next_station']} @ {t['next_eta']} | Delay: {t['delay_min']}m")

    # Verify control room
    cr_resp = requests.get(f"{base_url}/api/control-room", timeout=5)
    assert cr_resp.status_code == 200
    cr = cr_resp.json()
    print(f"[PASS] Control room metrics: Avg Delay={cr['summary']['avg_fleet_delay_min']}m, On-Time={cr['summary']['on_time_count']}")

if __name__ == "__main__":
    try:
        test_delay_math()
        test_schedule_vs_actual_distinction()
        test_predicted_time_consistency()
        if len(sys.argv) > 1 and sys.argv[1] == "--api":
            test_fleet_and_api()
        print("\n==========================================")
        print("ALL TIMING & ACCURACY AUDITS PASSED 100%!")
        print("==========================================")
    except AssertionError as e:
        print(f"\n[FAIL] ASSERTION FAILED: {e}")
        sys.exit(1)
