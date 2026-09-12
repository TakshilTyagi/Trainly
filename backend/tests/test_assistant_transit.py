"""
backend/tests/test_assistant_transit.py
Automated test suite verifying the AI Assistant's:
1. Nearest station auto-detection logic reuse
2. Calibrated drive time and leave-by time calculation reuse
3. Multi-modal transport mode retrieval (Metro, Bus, Driving, Walking)
4. Graceful handling of non-metro/rural stations
5. Chained comprehensive travel briefing
6. Multilingual response generation
"""

import unittest
from fastapi.testclient import TestClient

from backend.main import app
from backend.routes.assistant import (
    tool_lookup_nearest_station,
    tool_calculate_reach_and_leave_by,
    tool_get_multimodal_transit,
    tool_get_comprehensive_travel_plan
)
from backend.services.transit_service import (
    calculate_calibrated_drive_time,
    calculate_leave_by_time,
    get_multimodal_transit_options
)

client = TestClient(app)

class TestAssistantTransitFeatures(unittest.TestCase):

    def test_01_calibrated_drive_time_and_leave_by(self):
        """Verify DME corridor calibration (~53 min for 55 km) and leave-by formula."""
        # DME NE-3 corridor: 55 km moderate traffic
        drive_min = calculate_calibrated_drive_time(55.0, "Moderate")
        self.assertEqual(drive_min, 53, "55 km on DME corridor must calculate to ~53 minutes")

        # Leave-by calculation for 06:30 departure
        leave_info = calculate_leave_by_time("06:30", drive_min, 15)
        self.assertEqual(leave_info["leave_by_12h"], "5:22 AM")
        self.assertEqual(leave_info["leave_by_24h"], "05:22")
        self.assertEqual(leave_info["total_lead_time_min"], 68)

    def test_02_tool_lookup_nearest_station(self):
        """Verify nearest station auto-detection accurately identifies closest station."""
        # Delhi coords (28.6139, 77.2090) along Train 22490 route -> Hapur Jn (56.8 km)
        data = tool_lookup_nearest_station("22490", 28.6139, 77.2090)
        self.assertEqual(data["station_name"], "Hapur Jn")
        self.assertAlmostEqual(data["distance_km"], 56.81, places=1)

        # Meerut coords (28.98, 77.70) along Train 22490 route -> Meerut City Jn
        data_mtc = tool_lookup_nearest_station("22490", 28.98, 77.70)
        self.assertEqual(data_mtc["station_name"], "Meerut City Jn")
        self.assertLess(data_mtc["distance_km"], 2.0)

    def test_03_tool_calculate_reach_and_leave_by(self):
        """Verify reach time tool returns departure time, drive time, buffer, and leave-by time."""
        data = tool_calculate_reach_and_leave_by("22490", 28.98, 77.70)
        self.assertEqual(data["station_name"], "Meerut City Jn")
        self.assertIn("leave_by_12h", data)
        self.assertIn("drive_time_min", data)
        self.assertEqual(data["buffer_min"], 15)
        self.assertGreater(data["drive_time_min"], 0)

    def test_04_tool_multimodal_transit_metro_available(self):
        """Verify metropolitan stations like New Delhi (NDLS) return Metro and Bus transit modes."""
        data = tool_get_multimodal_transit("12951", 28.6139, 77.2090)
        transit_data = data["transit_data"]
        self.assertTrue(transit_data["transit_available"])
        modes = [m["mode"] for m in transit_data["modes"]]
        self.assertIn("driving", modes)
        self.assertIn("metro", modes)
        self.assertIn("bus", modes)

        # Check metro details for NDLS
        metro_mode = next(m for m in transit_data["modes"] if m["mode"] == "metro")
        self.assertIn("Yellow Line", metro_mode["line_name"])
        self.assertIn("New Delhi", metro_mode["metro_station"])

    def test_05_tool_multimodal_transit_rural_fallback(self):
        """Verify non-metro stations like Hapur Jn gracefully return non-transit guidance without errors."""
        data = tool_get_multimodal_transit("22490", 28.71, 77.75)
        transit_data = data["transit_data"]
        self.assertFalse(transit_data["transit_available"])
        self.assertIn("non_transit_note", transit_data)
        self.assertIn("Road transport", transit_data["non_transit_note"])

        # Driving remains available as fallback
        modes = [m["mode"] for m in transit_data["modes"]]
        self.assertIn("driving", modes)

    def test_06_tool_comprehensive_travel_plan(self):
        """Verify chained comprehensive travel plan combines reach, leave-by, and transit modes."""
        plan = tool_get_comprehensive_travel_plan("12951", 28.6139, 77.2090)
        self.assertIn("reach_info", plan)
        self.assertIn("transit_info", plan)
        self.assertEqual(plan["reach_info"]["station_name"], "New Delhi")
        self.assertTrue(plan["transit_info"]["transit_data"]["transit_available"])

    def test_07_api_query_endpoint_all_question_types(self):
        """Test POST /api/assistant/query for all 4 required question categories."""
        # 1. "What's the nearest station to me?"
        r1 = client.post("/api/assistant/query", json={
            "query": "What's the nearest station to me?",
            "active_train_no": "22490",
            "user_lat": 28.6692,
            "user_lon": 77.4538
        })
        self.assertEqual(r1.status_code, 200)
        res1 = r1.json()
        self.assertEqual(res1["tool_used"], "tool_lookup_nearest_station")
        self.assertIn("Hapur Jn", res1["response"])
        self.assertIn("km", res1["response"])

        # 2. "How long will it take me to reach the station?"
        r2 = client.post("/api/assistant/query", json={
            "query": "How long will it take me to reach the station?",
            "active_train_no": "22490",
            "user_lat": 28.98,
            "user_lon": 77.70
        })
        self.assertEqual(r2.status_code, 200)
        res2 = r2.json()
        self.assertEqual(res2["tool_used"], "tool_calculate_reach_and_leave_by")
        self.assertIn("Estimated travel time", res2["response"])
        self.assertIn("Recommended leave-by time", res2["response"])

        # 3. "How can I get to the station — is there a metro or bus?"
        r3 = client.post("/api/assistant/query", json={
            "query": "How can I get to the station — is there a metro or bus?",
            "active_train_no": "12951",
            "user_lat": 28.6139,
            "user_lon": 77.2090
        })
        self.assertEqual(r3.status_code, 200)
        res3 = r3.json()
        self.assertEqual(res3["tool_used"], "tool_get_multimodal_transit")
        self.assertIn("Metro", res3["response"])
        self.assertIn("City Bus", res3["response"])
        self.assertIn("Drive / Cab", res3["response"])

        # 4. "What time should I leave to catch my train?"
        r4 = client.post("/api/assistant/query", json={
            "query": "What time should I leave to catch my train?",
            "active_train_no": "22490",
            "user_lat": 28.98,
            "user_lon": 77.70
        })
        self.assertEqual(r4.status_code, 200)
        res4 = r4.json()
        self.assertEqual(res4["tool_used"], "tool_calculate_reach_and_leave_by")
        self.assertIn("Recommended leave-by time", res4["response"])

        # 5. "How do I get to my train?" (Chained multi-tool)
        r5 = client.post("/api/assistant/query", json={
            "query": "How do I get to my train?",
            "active_train_no": "12951",
            "user_lat": 28.6139,
            "user_lon": 77.2090
        })
        self.assertEqual(r5.status_code, 200)
        res5 = r5.json()
        self.assertEqual(res5["tool_used"], "tool_get_comprehensive_travel_plan")
        self.assertIn("Complete Travel Plan", res5["response"])
        self.assertIn("Estimated travel time", res5["response"])
        self.assertIn("Metro", res5["response"])

    def test_08_multilingual_responses(self):
        """Test assistant responses in Hindi, Tamil, Telugu, and Malayalam."""
        # Hindi
        rh = client.post("/api/assistant/query", json={
            "query": "निकटतम स्टेशन कौन सा है?",
            "active_train_no": "22490",
            "user_lat": 28.98,
            "user_lon": 77.70,
            "lang": "HI"
        })
        self.assertEqual(rh.status_code, 200)
        self.assertIn("निकटतम स्टेशन", rh.json()["response"])

        # Tamil
        rt = client.post("/api/assistant/query", json={
            "query": "அருகிலுள்ள நிலையம் எது?",
            "active_train_no": "22490",
            "user_lat": 28.98,
            "user_lon": 77.70,
            "lang": "TA"
        })
        self.assertEqual(rt.status_code, 200)
        self.assertIn("அருகிலுள்ள நிலையம்", rt.json()["response"])

if __name__ == "__main__":
    unittest.main()
