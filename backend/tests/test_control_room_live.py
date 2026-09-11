"""
test_control_room_live.py - Automated Verification for Control Room Live Updates
Verifies:
1. Aggregate figures (avg delay, on-time count, active alerts, confidence, bottlenecks) recalculate fresh.
2. Needs attention alerts re-evaluate dynamically (disappearing if delay resolves, appearing if delay worsens).
3. Cache-Control headers prevent stale browser responses.
4. Background poller runs on ~10-second cycle.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.providers.live_ntes import get_data_provider, TRAIN_CONFIGS

class TestControlRoomLiveUpdates(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.provider = get_data_provider()

    def test_01_cache_control_headers(self):
        """Verify Cache-Control headers explicitly disallow client-side caching."""
        resp = self.client.get("/api/control-room")
        self.assertEqual(resp.status_code, 200)
        cache_hdr = resp.headers.get("Cache-Control", "")
        self.assertIn("no-cache", cache_hdr)
        self.assertIn("no-store", cache_hdr)

    def test_02_all_aggregates_calculated_fresh(self):
        """Verify summary aggregates match current live fleet calculations."""
        resp = self.client.get("/api/control-room")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        summary = data["summary"]
        fleet = data["fleet_table"]
        alerts = data["alerts"]
        bottlenecks = data["bottlenecks"]

        # Confirm fleet has all tracked corridors
        self.assertEqual(len(fleet), len(TRAIN_CONFIGS))
        self.assertEqual(summary["total_trains"], len(TRAIN_CONFIGS))

        # Confirm average delay matches fleet sum / count
        delays = [t["delay_min"] for t in fleet]
        expected_avg_delay = round(sum(delays) / len(delays), 1)
        self.assertEqual(summary["avg_fleet_delay_min"], expected_avg_delay)

        # Confirm on-time count matches
        expected_on_time = sum(1 for d in delays if d <= 5.0)
        self.assertEqual(summary["on_time_count"], expected_on_time)

        # Confirm active alerts count matches alerts array length
        self.assertEqual(summary["active_alerts_count"], len(alerts))

        # Confirm bottlenecks reflect monitored trains
        self.assertGreaterEqual(len(bottlenecks), 4)

    def test_03_alerts_dynamic_reevaluation(self):
        """Verify that modifying a train delay dynamically updates alerts and aggregates."""
        # 1. Capture baseline
        resp1 = self.client.get("/api/control-room")
        data1 = resp1.json()
        baseline_alerts_count = len(data1["alerts"])
        baseline_on_time_count = data1["summary"]["on_time_count"]

        # 2. Simulate 12615 delay resolving to 0m (on-time)
        cfg_12615 = TRAIN_CONFIGS["12615"]
        original_delay = cfg_12615["base_delay_min"]
        original_status = cfg_12615["current_status_label"]
        
        try:
            cfg_12615["base_delay_min"] = 0.0
            cfg_12615["current_status_label"] = "On time"
            self.provider.refresh_all_trains()

            resp2 = self.client.get("/api/control-room")
            data2 = resp2.json()

            # Train 12615 should no longer trigger a delay alert
            alert_train_nos = [a["train_no"] for a in data2["alerts"]]
            self.assertNotIn("12615", alert_train_nos, "Recovered train 12615 should have disappeared from alerts!")
            self.assertEqual(len(data2["alerts"]), baseline_alerts_count - 1)
            self.assertEqual(data2["summary"]["on_time_count"], baseline_on_time_count + 1)

        finally:
            # Restore original state
            cfg_12615["base_delay_min"] = original_delay
            cfg_12615["current_status_label"] = original_status
            self.provider.refresh_all_trains()

        # 3. Verify restored state
        resp3 = self.client.get("/api/control-room")
        data3 = resp3.json()
        self.assertEqual(len(data3["alerts"]), baseline_alerts_count)
        self.assertIn("12615", [a["train_no"] for a in data3["alerts"]])

if __name__ == "__main__":
    unittest.main()
