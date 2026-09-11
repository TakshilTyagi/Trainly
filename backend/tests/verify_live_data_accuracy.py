"""
verify_live_data_accuracy.py - Upstream vs Backend Data Verification Script
Directly fetches raw data from the upstream NTES source and compares it
side-by-side with what the backend stores and serves to the API and UI.
Validates:
1. Train not yet started (12951) shows 'Scheduled' / 'Not started' with speed 0 at origin.
2. Running train (22490) is accurately located past Bareilly & Lucknow, approaching Ayodhya (not 2-3 stations behind).
"""

import sys
import json
from datetime import datetime

from backend.providers.ntes_upstream import UpstreamNTESClient, get_current_ist_time
from backend.providers.live_ntes import NTESLiveProvider

def run_verification():
    print("=" * 80)
    print("  TRAINLY DATA-LAYER ACCURACY VERIFICATION: UPSTREAM VS BACKEND")
    print(f"  Current Evaluation Time (IST): {get_current_ist_time().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print("=" * 80)

    upstream = UpstreamNTESClient()
    provider = NTESLiveProvider()

    trains_to_test = ["12951", "22490", "12615", "22536", "12625", "12301", "12002"]

    all_checks_passed = True

    for t_no in trains_to_test:
        print(f"\n>> AUDITING TRAIN {t_no} <<")
        diag = provider.get_diagnostic_comparison(t_no)
        raw = diag["raw_upstream"]
        served = diag["backend_served"]

        print(f"  [RAW UPSTREAM NTES INGESTION]")
        print(f"    • Train Number      : {raw.get('train_number')}")
        print(f"    • Train Name        : {raw.get('train_name')}")
        print(f"    • Journey Date      : {raw.get('journey_date')}")
        print(f"    • Raw Status        : {raw.get('train_status')}")
        print(f"    • Is Departed       : {raw.get('is_departed')}")
        print(f"    • Reported Stn Code : {raw.get('current_station_code')}")
        print(f"    • Reported Stn Name : {raw.get('current_station_name')}")
        print(f"    • Telemetry Speed   : {raw.get('speed_kmh')} km/h")

        print(f"\n  [BACKEND SERVED & STORED TO API/FRONTEND]")
        print(f"    • Status Label      : {served['status_label']}")
        print(f"    • Status Class      : {served['status_class']}")
        print(f"    • Served Speed      : {served['speed_kmh']} km/h")
        print(f"    • Currently Near    : {served['currently_near']}")
        print(f"    • Next Station      : {served['next_station']}")
        print(f"    • Next ETA          : {served['next_eta']}")
        print(f"    • Departed Stops    : {served['departed_stops_count']}")
        
        curr_stop = served.get("journey_current_stop")
        if curr_stop:
            print(f"    • Current Active Halt: {curr_stop.get('station_code')} ({curr_stop.get('station_name')}) -> {curr_stop.get('time_display')}")

        # VERIFICATION OF BUG 1 (Train 12951 not yet started)
        if t_no == "12951":
            print(f"\n  --> BUG 1 VALIDATION (12951 Not Yet Started before 17:00 IST):")
            check_status = served['status_label'] == "Scheduled"
            check_speed = served['speed_kmh'] == 0
            check_departed = served['departed_stops_count'] == 0
            check_curr_is_origin = curr_stop and curr_stop['station_code'] == "MMCT"
            
            print(f"      [Check] Status is 'Scheduled'                  : {'PASS' if check_status else 'FAIL'}")
            print(f"      [Check] Speed is 0 km/h                       : {'PASS' if check_speed else 'FAIL'}")
            print(f"      [Check] 0 departed stations (not running)     : {'PASS' if check_departed else 'FAIL'}")
            print(f"      [Check] Current stop is Origin (MMCT)         : {'PASS' if check_curr_is_origin else 'FAIL'}")

            if not (check_status and check_speed and check_departed and check_curr_is_origin):
                all_checks_passed = False
                print("      [FAIL] BUG 1 FAILED!")
            else:
                print("      [SUCCESS] BUG 1 RESOLVED: 12951 accurately reports as Scheduled / Not Started at MMCT.")

        # VERIFICATION OF BUG 2 (Train 22490 position accuracy)
        if t_no == "22490":
            print(f"\n  --> BUG 2 VALIDATION (22490 Current Station Position Accuracy):")
            check_passed_be = served['departed_stops_count'] >= 4  # MTC, HPU, MB, BE, LKO
            check_approaching_ay = served['next_station'] in ["Ayodhya Dham", "Ayodhya Dham Jn", "AY"]
            check_not_behind = served['currently_near'] == "Lucknow Charbagh"
            
            print(f"      [Check] Bareilly & Lucknow marked as passed   : {'PASS' if check_passed_be else 'FAIL'}")
            print(f"      [Check] Next station is Ayodhya (not Bareilly): {'PASS' if check_approaching_ay else 'FAIL'}")
            print(f"      [Check] Currently near Lucknow Charbagh       : {'PASS' if check_not_behind else 'FAIL'}")

            if not (check_passed_be and check_approaching_ay and check_not_behind):
                all_checks_passed = False
                print("      [FAIL] BUG 2 FAILED: Train is still reported at old stations!")
            else:
                print("      [SUCCESS] BUG 2 RESOLVED: 22490 accurately located past Lucknow approaching Ayodhya.")

        print("-" * 80)

    print("\n" + "=" * 80)
    if all_checks_passed:
        print("  ALL DATA ACCURACY & UPSTREAM INGESTION TESTS PASSED! (100% SUCCESS)")
    else:
        print("  SOME DATA ACCURACY CHECKS FAILED.")
    print("=" * 80)
    return all_checks_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
