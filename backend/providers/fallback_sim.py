"""
fallback_sim.py - High Fidelity NTES Telemetry Simulator
Simulates live train movement, dynamic delays, and NTES-compatible payloads
for the 4 tracked Indian Railways trains.
"""

import time
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from .base import TrainDataProvider
from .timing_utils import (
    compute_delay_minutes,
    add_delay_to_time,
    format_status_label,
    format_status_class,
    format_delay_note,
    log_timing_audit
)
from backend.ml.ml_engine import get_ml_engine
from backend.database import get_feedback_for_train

logger = logging.getLogger("trainly.fallback_sim")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

IST = timezone(timedelta(hours=5, minutes=30))

TRAIN_CONFIGS = {
    "22490": {
        "train_no": "22490",
        "name": "22490 Vande Bharat",
        "full_name": "22490 Meerut City → Varanasi Jn",
        "type": "Vande Bharat Express",
        "origin": "Meerut City Jn",
        "destination": "Varanasi Jn",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Currently between Lucknow Charbagh and Ayodhya Dham Jn",
        "current_near_station": "Lucknow Charbagh",
        "next_station_code": "AY",
        "next_station_name": "Ayodhya Dham Jn",
        "next_eta": "15:40",
        "confidence": 92,
        "speed_kmh": 108,
        "current_section_idx": 4,  # Between LKO (idx 4) and AY (idx 5)
        "section_progress": 0.45,
        "stations": [
            {"code": "MTC", "name": "Meerut City Jn", "km": 0, "day": 1, "sched_arr": "06:30", "sched_dep": "06:35", "act_arr": "06:30", "act_dep": "06:35", "status": "departed", "delay_min": 0, "lat": 28.9800, "lon": 77.7064, "type": "origin"},
            {"code": "HPU", "name": "Hapur Jn", "km": 37, "day": 1, "sched_arr": "07:08", "sched_dep": "07:10", "act_arr": "07:07", "act_dep": "07:09", "status": "departed", "delay_min": -1, "lat": 28.7306, "lon": 77.7759, "type": "stop"},
            {"code": "MB", "name": "Moradabad Jn", "km": 140, "day": 1, "sched_arr": "08:35", "sched_dep": "08:40", "act_arr": "08:33", "act_dep": "08:38", "status": "departed", "delay_min": -2, "lat": 28.8386, "lon": 78.7733, "type": "stop"},
            {"code": "BE", "name": "Bareilly Jn", "km": 230, "day": 1, "sched_arr": "09:56", "sched_dep": "09:58", "act_arr": "09:55", "act_dep": "09:58", "status": "departed", "delay_min": 0, "lat": 28.3670, "lon": 79.4304, "type": "stop"},
            {"code": "LKO", "name": "Lucknow Charbagh", "km": 465, "day": 1, "sched_arr": "13:40", "sched_dep": "13:50", "act_arr": "13:40", "act_dep": "13:50", "status": "departed", "delay_min": 0, "lat": 26.8324, "lon": 80.9230, "type": "stop"},
            {"code": "AY", "name": "Ayodhya Dham Jn", "km": 595, "day": 1, "sched_arr": "15:40", "sched_dep": "15:45", "status": "current", "delay_min": 0, "lat": 26.7922, "lon": 82.1998, "type": "current"},
            {"code": "BSB", "name": "Varanasi Jn", "km": 783, "day": 1, "sched_arr": "18:25", "sched_dep": "18:25", "status": "upcoming", "delay_min": 0, "lat": 25.3283, "lon": 82.9863, "type": "destination"}
        ]
    },
    "12951": {
        "train_no": "12951",
        "name": "12951 Rajdhani",
        "full_name": "12951 Mumbai Central → New Delhi",
        "type": "Rajdhani Express",
        "origin": "Mumbai Central",
        "destination": "New Delhi",
        "current_status_label": "Scheduled",
        "current_status_class": "scheduled",
        "is_started": False,
        "base_delay_min": 0.0,
        "current_subtext": "Scheduled to depart from Mumbai Central at 17:00 IST",
        "current_near_station": "Mumbai Central",
        "next_station_code": "MMCT",
        "next_station_name": "Mumbai Central",
        "next_eta": "17:00",
        "confidence": 95,
        "speed_kmh": 0,
        "current_section_idx": 0,
        "section_progress": 0.0,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "day": 1, "sched_arr": "17:00", "sched_dep": "17:00", "act_arr": None, "act_dep": None, "status": "current", "delay_min": 0, "lat": 18.9696, "lon": 72.8194, "type": "origin"},
            {"code": "BVI", "name": "Borivali", "km": 30, "day": 1, "sched_arr": "17:22", "sched_dep": "17:24", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 19.2288, "lon": 72.8575, "type": "stop"},
            {"code": "ST", "name": "Surat", "km": 263, "day": 1, "sched_arr": "19:43", "sched_dep": "19:48", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "day": 1, "sched_arr": "21:06", "sched_dep": "21:16", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 22.3107, "lon": 73.1812, "type": "stop"},
            {"code": "RTM", "name": "Ratlam Jn", "km": 653, "day": 2, "sched_arr": "00:25", "sched_dep": "00:28", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 23.3441, "lon": 75.0376, "type": "stop"},
            {"code": "KOTA", "name": "Kota Jn", "km": 920, "day": 2, "sched_arr": "03:15", "sched_dep": "03:20", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 25.2235, "lon": 75.8648, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1386, "day": 2, "sched_arr": "08:32", "sched_dep": "08:32", "act_arr": None, "act_dep": None, "status": "upcoming", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12615": {
        "train_no": "12615",
        "name": "12615 GT Express",
        "full_name": "12615 Chennai Central → New Delhi",
        "type": "Superfast Express",
        "origin": "Chennai Central",
        "destination": "New Delhi",
        "current_status_label": "+35 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 35.0,
        "current_subtext": "Currently between Nagpur Jn and Itarsi Jn approaching Central Railway mainline",
        "current_near_station": "Nagpur Jn",
        "next_station_code": "ET",
        "next_station_name": "Itarsi Jn",
        "next_eta": "17:15",
        "confidence": 74,
        "speed_kmh": 72,
        "current_section_idx": 5,  # Between NGP (idx 5) and ET (idx 6)
        "section_progress": 0.38,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "day": 1, "sched_arr": "18:50", "sched_dep": "18:50", "act_arr": "18:50", "act_dep": "18:50", "status": "departed", "delay_min": 0, "lat": 13.0827, "lon": 80.2707, "type": "origin"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "day": 2, "sched_arr": "00:50", "sched_dep": "01:00", "act_arr": "00:58", "act_dep": "01:10", "status": "departed", "delay_min": 10, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "WL", "name": "Warangal", "km": 638, "day": 2, "sched_arr": "03:48", "sched_dep": "03:50", "act_arr": "04:05", "act_dep": "04:08", "status": "departed", "delay_min": 18, "lat": 17.9689, "lon": 79.5941, "type": "stop"},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 881, "day": 2, "sched_arr": "07:35", "sched_dep": "07:40", "act_arr": "08:02", "act_dep": "08:08", "status": "departed", "delay_min": 28, "lat": 19.8547, "lon": 79.3524, "type": "stop"},
            {"code": "WR", "name": "Wardha Jn", "km": 960, "day": 2, "sched_arr": "09:08", "sched_dep": "09:10", "act_arr": "09:43", "act_dep": "09:45", "status": "departed", "delay_min": 35, "lat": 20.7453, "lon": 78.6022, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1039, "day": 2, "sched_arr": "11:25", "sched_dep": "11:30", "act_arr": "11:58", "act_dep": "12:05", "status": "departed", "delay_min": 35, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "ET", "name": "Itarsi Jn", "km": 1337, "day": 2, "sched_arr": "16:40", "sched_dep": "16:50", "status": "current", "delay_min": 35, "lat": 21.6111, "lon": 77.7554, "type": "current"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1429, "day": 2, "sched_arr": "18:40", "sched_dep": "18:45", "status": "upcoming", "delay_min": 42, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1721, "day": 2, "sched_arr": "22:50", "sched_dep": "22:55", "status": "upcoming", "delay_min": 38, "lat": 25.4484, "lon": 78.5685, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1819, "day": 2, "sched_arr": "23:55", "sched_dep": "23:57", "status": "upcoming", "delay_min": 35, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 1937, "day": 3, "sched_arr": "01:48", "sched_dep": "01:53", "status": "upcoming", "delay_min": 32, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 2182, "day": 3, "sched_arr": "05:10", "sched_dep": "05:10", "status": "upcoming", "delay_min": 30, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "22536": {
        "train_no": "22536",
        "name": "Manduadih Exp",
        "full_name": "Manduadih → Rameswaram",
        "type": "Weekly Superfast Express",
        "origin": "Manduadih (Banaras)",
        "destination": "Rameswaram",
        "current_status_label": "+2h 40m",
        "current_status_class": "delayed-severe",
        "is_started": True,
        "base_delay_min": 160.0,
        "current_subtext": "Currently between Vijayawada Jn and Ongole awaiting clearance",
        "current_near_station": "Vijayawada Jn",
        "next_station_code": "OGL",
        "next_station_name": "Ongole",
        "next_eta": "05:08",
        "confidence": 58,
        "speed_kmh": 46,
        "current_section_idx": 7,  # Between BZA (idx 7) and OGL (idx 8)
        "section_progress": 0.22,
        "stations": [
            {"code": "BSBS", "name": "Manduadih (Banaras)", "km": 0, "day": 1, "sched_arr": "20:00", "sched_dep": "20:00", "act_arr": "20:00", "act_dep": "20:00", "status": "departed", "delay_min": 0, "lat": 25.2974, "lon": 82.9664, "type": "origin"},
            {"code": "PCOI", "name": "Prayagraj Chheoki", "km": 125, "day": 1, "sched_arr": "22:40", "sched_dep": "22:45", "act_arr": "23:15", "act_dep": "23:20", "status": "departed", "delay_min": 35, "lat": 25.3854, "lon": 81.8687, "type": "stop"},
            {"code": "JBP", "name": "Jabalpur Jn", "km": 494, "day": 2, "sched_arr": "04:50", "sched_dep": "05:00", "act_arr": "06:05", "act_dep": "06:15", "status": "departed", "delay_min": 75, "lat": 23.1686, "lon": 79.9339, "type": "stop"},
            {"code": "ET", "name": "Itarsi Jn", "km": 738, "day": 2, "sched_arr": "08:50", "sched_dep": "09:00", "act_arr": "10:45", "act_dep": "10:55", "status": "departed", "delay_min": 115, "lat": 21.6111, "lon": 77.7554, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1036, "day": 2, "sched_arr": "13:25", "sched_dep": "13:30", "act_arr": "15:45", "act_dep": "15:52", "status": "departed", "delay_min": 140, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 1245, "day": 2, "sched_arr": "17:05", "sched_dep": "17:10", "act_arr": "19:30", "act_dep": "19:35", "status": "departed", "delay_min": 145, "lat": 19.8547, "lon": 79.3524, "type": "stop"},
            {"code": "WL", "name": "Warangal", "km": 1488, "day": 2, "sched_arr": "20:33", "sched_dep": "20:35", "act_arr": "23:06", "act_dep": "23:08", "status": "departed", "delay_min": 153, "lat": 17.9689, "lon": 79.5941, "type": "stop"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1695, "day": 3, "sched_arr": "00:20", "sched_dep": "00:30", "act_arr": "03:00", "act_dep": "03:10", "status": "departed", "delay_min": 160, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "OGL", "name": "Ongole", "km": 1834, "day": 3, "sched_arr": "02:28", "sched_dep": "02:30", "status": "current", "delay_min": 160, "lat": 15.5057, "lon": 80.0499, "type": "current"},
            {"code": "MS", "name": "Chennai Egmore", "km": 2126, "day": 3, "sched_arr": "08:10", "sched_dep": "08:25", "status": "upcoming", "delay_min": 165, "lat": 13.0784, "lon": 80.2606, "type": "stop"},
            {"code": "VM", "name": "Villupuram Jn", "km": 2285, "day": 3, "sched_arr": "10:50", "sched_dep": "10:55", "status": "upcoming", "delay_min": 170, "lat": 11.9398, "lon": 79.4975, "type": "stop"},
            {"code": "TPJ", "name": "Tiruchchirappalli Jn", "km": 2444, "day": 3, "sched_arr": "13:40", "sched_dep": "13:45", "status": "upcoming", "delay_min": 175, "lat": 10.7905, "lon": 78.6946, "type": "stop"},
            {"code": "MNM", "name": "Manamadurai Jn", "km": 2595, "day": 3, "sched_arr": "19:40", "sched_dep": "19:45", "status": "upcoming", "delay_min": 180, "lat": 9.6974, "lon": 78.4485, "type": "stop"},
            {"code": "RMD", "name": "Ramanathapuram", "km": 2675, "day": 3, "sched_arr": "20:38", "sched_dep": "20:40", "status": "upcoming", "delay_min": 185, "lat": 9.3639, "lon": 78.8395, "type": "stop"},
            {"code": "RMM", "name": "Rameswaram", "km": 2791, "day": 3, "sched_arr": "22:30", "sched_dep": "22:30", "status": "upcoming", "delay_min": 190, "lat": 9.2881, "lon": 79.3174, "type": "destination"}
        ]
    },
    "12004": {
        "train_no": "12004",
        "name": "12004 Shatabdi",
        "full_name": "12004 New Delhi → Lucknow Charbagh",
        "type": "Shatabdi Express",
        "origin": "New Delhi",
        "destination": "Lucknow Charbagh",
        "current_status_label": "Arrived",
        "current_status_class": "completed",
        "is_started": True,
        "is_completed": True,
        "base_delay_min": 0.0,
        "current_subtext": "Arrived at Lucknow Charbagh at 12:40 IST (Journey Completed)",
        "current_near_station": "Lucknow Charbagh",
        "next_station_code": "LKO",
        "next_station_name": "Lucknow Charbagh",
        "next_eta": "12:40",
        "confidence": 100,
        "speed_kmh": 0,
        "current_section_idx": 5,
        "section_progress": 1.0,
        "stations": [
            {"code": "NDLS", "name": "New Delhi", "km": 0, "day": 1, "sched_arr": "06:10", "sched_dep": "06:10", "act_arr": "06:10", "act_dep": "06:10", "status": "departed", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "origin"},
            {"code": "GZB", "name": "Ghaziabad Jn", "km": 25, "day": 1, "sched_arr": "06:53", "sched_dep": "06:55", "act_arr": "06:53", "act_dep": "06:55", "status": "departed", "delay_min": 0, "lat": 28.6678, "lon": 77.4350, "type": "stop"},
            {"code": "ALJN", "name": "Aligarh Jn", "km": 131, "day": 1, "sched_arr": "07:47", "sched_dep": "07:49", "act_arr": "07:47", "act_dep": "07:49", "status": "departed", "delay_min": 0, "lat": 27.8974, "lon": 78.0880, "type": "stop"},
            {"code": "TDL", "name": "Tundla Jn", "km": 209, "day": 1, "sched_arr": "08:43", "sched_dep": "08:45", "act_arr": "08:42", "act_dep": "08:45", "status": "departed", "delay_min": 0, "lat": 27.2081, "lon": 78.2384, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 440, "day": 1, "sched_arr": "11:20", "sched_dep": "11:25", "act_arr": "11:20", "act_dep": "11:25", "status": "departed", "delay_min": 0, "lat": 26.4547, "lon": 80.3507, "type": "stop"},
            {"code": "LKO", "name": "Lucknow Charbagh", "km": 512, "day": 1, "sched_arr": "12:40", "sched_dep": "12:40", "act_arr": "12:40", "act_dep": "12:40", "status": "departed", "delay_min": 0, "lat": 26.8324, "lon": 80.9230, "type": "destination"}
        ]
    },
    "12625": {
        "train_no": "12625",
        "name": "12625 Kerala Express",
        "full_name": "12625 Thiruvananthapuram Central → New Delhi",
        "type": "Superfast Express",
        "origin": "Thiruvananthapuram Central",
        "destination": "New Delhi",
        "current_status_label": "+18 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 18.0,
        "current_subtext": "Currently between Palakkad Jn and Coimbatore Jn on the Southern Railway corridor",
        "current_near_station": "Palakkad Jn",
        "next_station_code": "CBE",
        "next_station_name": "Coimbatore Jn",
        "next_eta": "21:13",
        "confidence": 84,
        "speed_kmh": 82,
        "current_section_idx": 5,
        "section_progress": 0.40,
        "stations": [
            {"code": "TVC", "name": "Thiruvananthapuram Central", "km": 0, "day": 1, "sched_arr": "12:30", "sched_dep": "12:30", "act_arr": "12:30", "act_dep": "12:30", "status": "departed", "delay_min": 0, "lat": 8.4870, "lon": 76.9525, "type": "origin"},
            {"code": "QLN", "name": "Kollam Jn", "km": 65, "day": 1, "sched_arr": "13:35", "sched_dep": "13:38", "act_arr": "13:37", "act_dep": "13:40", "status": "departed", "delay_min": 2, "lat": 8.8879, "lon": 76.6033, "type": "stop"},
            {"code": "KTYM", "name": "Kottayam", "km": 161, "day": 1, "sched_arr": "15:25", "sched_dep": "15:28", "act_arr": "15:32", "act_dep": "15:35", "status": "departed", "delay_min": 7, "lat": 9.5898, "lon": 76.5222, "type": "stop"},
            {"code": "ERN", "name": "Ernakulam Town", "km": 220, "day": 1, "sched_arr": "16:40", "sched_dep": "16:45", "act_arr": "16:52", "act_dep": "16:58", "status": "departed", "delay_min": 13, "lat": 9.9926, "lon": 76.2882, "type": "stop"},
            {"code": "TCR", "name": "Thrissur", "km": 292, "day": 1, "sched_arr": "17:47", "sched_dep": "17:50", "act_arr": "18:03", "act_dep": "18:06", "status": "departed", "delay_min": 16, "lat": 10.5186, "lon": 76.2110, "type": "stop"},
            {"code": "PGT", "name": "Palakkad Jn", "km": 367, "day": 1, "sched_arr": "19:12", "sched_dep": "19:15", "act_arr": "19:30", "act_dep": "19:33", "status": "departed", "delay_min": 18, "lat": 10.7867, "lon": 76.6548, "type": "stop"},
            {"code": "CBE", "name": "Coimbatore Jn", "km": 423, "day": 1, "sched_arr": "20:52", "sched_dep": "20:55", "status": "current", "delay_min": 18, "lat": 11.0018, "lon": 76.9629, "type": "current"},
            {"code": "ED", "name": "Erode Jn", "km": 524, "day": 1, "sched_arr": "22:20", "sched_dep": "22:25", "status": "upcoming", "delay_min": 18, "lat": 11.3410, "lon": 77.7172, "type": "stop"},
            {"code": "SA", "name": "Salem Jn", "km": 584, "day": 1, "sched_arr": "23:22", "sched_dep": "23:25", "status": "upcoming", "delay_min": 18, "lat": 11.6643, "lon": 78.1460, "type": "stop"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1175, "day": 2, "sched_arr": "10:20", "sched_dep": "10:30", "status": "upcoming", "delay_min": 20, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1839, "day": 2, "sched_arr": "21:10", "sched_dep": "21:15", "status": "upcoming", "delay_min": 22, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 2228, "day": 3, "sched_arr": "03:45", "sched_dep": "03:55", "status": "upcoming", "delay_min": 22, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2618, "day": 3, "sched_arr": "09:05", "sched_dep": "09:07", "status": "upcoming", "delay_min": 18, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 2736, "day": 3, "sched_arr": "10:50", "sched_dep": "10:55", "status": "upcoming", "delay_min": 15, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 3031, "day": 3, "sched_arr": "13:40", "sched_dep": "13:40", "status": "upcoming", "delay_min": 15, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12301": {
        "train_no": "12301",
        "name": "12301 Howrah Rajdhani",
        "full_name": "12301 Howrah Jn → New Delhi",
        "type": "Rajdhani Express",
        "origin": "Howrah Jn",
        "destination": "New Delhi",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 3.0,
        "current_subtext": "Currently cruising past Gaya Jn on the Grand Chord high-speed route",
        "current_near_station": "Gaya Jn",
        "next_station_code": "DDU",
        "next_station_name": "Pt. Deen Dayal Upadhyaya Jn",
        "next_eta": "00:48",
        "confidence": 94,
        "speed_kmh": 124,
        "current_section_idx": 4,
        "section_progress": 0.52,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "day": 1, "sched_arr": "16:50", "sched_dep": "16:50", "act_arr": "16:50", "act_dep": "16:50", "status": "departed", "delay_min": 0, "lat": 22.5839, "lon": 88.3426, "type": "origin"},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "day": 1, "sched_arr": "18:57", "sched_dep": "19:00", "act_arr": "18:56", "act_dep": "19:00", "status": "departed", "delay_min": 0, "lat": 23.6871, "lon": 86.9746, "type": "stop"},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 258, "day": 1, "sched_arr": "19:55", "sched_dep": "20:00", "act_arr": "19:55", "act_dep": "20:01", "status": "departed", "delay_min": 1, "lat": 23.7957, "lon": 86.4304, "type": "stop"},
            {"code": "PNME", "name": "Parasnath", "km": 306, "day": 1, "sched_arr": "20:40", "sched_dep": "20:42", "act_arr": "20:42", "act_dep": "20:44", "status": "departed", "delay_min": 2, "lat": 23.9554, "lon": 86.0827, "type": "stop"},
            {"code": "GAYA", "name": "Gaya Jn", "km": 458, "day": 1, "sched_arr": "22:31", "sched_dep": "22:34", "act_arr": "22:34", "act_dep": "22:37", "status": "departed", "delay_min": 3, "lat": 24.8037, "lon": 85.0064, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya Jn", "km": 663, "day": 2, "sched_arr": "00:45", "sched_dep": "00:55", "status": "current", "delay_min": 3, "lat": 25.2818, "lon": 83.1235, "type": "current"},
            {"code": "PRYJ", "name": "Prayagraj Jn", "km": 816, "day": 2, "sched_arr": "02:43", "sched_dep": "02:45", "status": "upcoming", "delay_min": 3, "lat": 25.4358, "lon": 81.8463, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 1010, "day": 2, "sched_arr": "04:50", "sched_dep": "04:55", "status": "upcoming", "delay_min": 2, "lat": 26.4547, "lon": 80.3507, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1451, "day": 2, "sched_arr": "10:05", "sched_dep": "10:05", "status": "upcoming", "delay_min": 2, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12002": {
        "train_no": "12002",
        "name": "12002 Bhopal Shatabdi",
        "full_name": "12002 New Delhi → Rani Kamlapati (Bhopal)",
        "type": "Shatabdi Express",
        "origin": "New Delhi",
        "destination": "Rani Kamlapati (Bhopal)",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Currently operating at 135 km/h between Agra Cantt and Gwalior Jn (Daytime Express)",
        "current_near_station": "Agra Cantt",
        "next_station_code": "GWL",
        "next_station_name": "Gwalior Jn",
        "next_eta": "09:23",
        "confidence": 96,
        "speed_kmh": 136,
        "current_section_idx": 2,
        "section_progress": 0.65,
        "stations": [
            {"code": "NDLS", "name": "New Delhi", "km": 0, "day": 1, "sched_arr": "06:00", "sched_dep": "06:00", "act_arr": "06:00", "act_dep": "06:00", "status": "departed", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "origin"},
            {"code": "MTJ", "name": "Mathura Jn", "km": 141, "day": 1, "sched_arr": "07:19", "sched_dep": "07:20", "act_arr": "07:19", "act_dep": "07:20", "status": "departed", "delay_min": 0, "lat": 27.4924, "lon": 77.6737, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 195, "day": 1, "sched_arr": "07:50", "sched_dep": "07:55", "act_arr": "07:50", "act_dep": "07:55", "status": "departed", "delay_min": 0, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 313, "day": 1, "sched_arr": "09:23", "sched_dep": "09:28", "status": "current", "delay_min": 0, "lat": 26.2183, "lon": 78.1828, "type": "current"},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 410, "day": 1, "sched_arr": "10:45", "sched_dep": "10:50", "status": "upcoming", "delay_min": 0, "lat": 25.4484, "lon": 78.5685, "type": "stop"},
            {"code": "LAR", "name": "Lalitpur Jn", "km": 501, "day": 1, "sched_arr": "11:42", "sched_dep": "11:43", "status": "upcoming", "delay_min": 0, "lat": 24.6908, "lon": 78.4140, "type": "stop"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 702, "day": 1, "sched_arr": "14:07", "sched_dep": "14:12", "status": "upcoming", "delay_min": 0, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "RKMP", "name": "Rani Kamlapati", "km": 708, "day": 1, "sched_arr": "14:40", "sched_dep": "14:40", "status": "upcoming", "delay_min": 0, "lat": 23.2081, "lon": 77.4398, "type": "destination"}
        ]
    },
    "12723": {
        "train_no": "12723",
        "name": "12723 Telangana Express",
        "full_name": "12723 Hyderabad Deccan → New Delhi",
        "type": "Superfast Express",
        "origin": "Hyderabad Deccan",
        "destination": "New Delhi",
        "current_status_label": "+8 min",
        "current_status_class": "delayed-low",
        "is_started": True,
        "base_delay_min": 8.0,
        "current_subtext": "Currently between Balharshah Jn and Nagpur Jn on the Central corridor",
        "current_near_station": "Balharshah Jn",
        "next_station_code": "NGP",
        "next_station_name": "Nagpur Jn",
        "next_eta": "15:28",
        "confidence": 85,
        "speed_kmh": 95,
        "current_section_idx": 4,
        "section_progress": 0.42,
        "stations": [
            {"code": "HYB", "name": "Hyderabad Deccan", "km": 0, "day": 1, "sched_arr": "06:00", "sched_dep": "06:00", "act_arr": "06:00", "act_dep": "06:00", "status": "departed", "delay_min": 0, "lat": 17.3916, "lon": 78.4674, "type": "origin"},
            {"code": "SC", "name": "Secunderabad Jn", "km": 9, "day": 1, "sched_arr": "06:20", "sched_dep": "06:25", "act_arr": "06:20", "act_dep": "06:25", "status": "departed", "delay_min": 0, "lat": 17.4344, "lon": 78.5016, "type": "stop"},
            {"code": "KZJ", "name": "Kazipet Jn", "km": 141, "day": 1, "sched_arr": "08:03", "sched_dep": "08:05", "act_arr": "08:05", "act_dep": "08:08", "status": "departed", "delay_min": 3, "lat": 17.9818, "lon": 79.5262, "type": "stop"},
            {"code": "RDM", "name": "Ramagundam", "km": 234, "day": 1, "sched_arr": "09:28", "sched_dep": "09:30", "act_arr": "09:32", "act_dep": "09:35", "status": "departed", "delay_min": 5, "lat": 18.7562, "lon": 79.5161, "type": "stop"},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 367, "day": 1, "sched_arr": "12:15", "sched_dep": "12:20", "act_arr": "12:22", "act_dep": "12:28", "status": "departed", "delay_min": 8, "lat": 19.8547, "lon": 79.3524, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 575, "day": 1, "sched_arr": "15:20", "sched_dep": "15:25", "status": "current", "delay_min": 8, "lat": 21.1524, "lon": 79.0888, "type": "current"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 965, "day": 1, "sched_arr": "21:45", "sched_dep": "21:55", "status": "upcoming", "delay_min": 8, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1257, "day": 2, "sched_arr": "02:10", "sched_dep": "02:18", "status": "upcoming", "delay_min": 8, "lat": 25.4484, "lon": 78.5685, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1355, "day": 2, "sched_arr": "03:22", "sched_dep": "03:24", "status": "upcoming", "delay_min": 5, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 1473, "day": 2, "sched_arr": "05:00", "sched_dep": "05:05", "status": "upcoming", "delay_min": 5, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1670, "day": 2, "sched_arr": "07:40", "sched_dep": "07:40", "status": "upcoming", "delay_min": 5, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12839": {
        "train_no": "12839",
        "name": "12839 Howrah Chennai Mail",
        "full_name": "12839 Howrah Jn → Chennai Central",
        "type": "Superfast Mail",
        "origin": "Howrah Jn",
        "destination": "Chennai Central",
        "current_status_label": "+22 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 22.0,
        "current_subtext": "Currently approaching Bhubaneswar on the East Coast trunk line",
        "current_near_station": "Bhubaneswar",
        "next_station_code": "BAM",
        "next_station_name": "Brahmapur",
        "next_eta": "09:12",
        "confidence": 82,
        "speed_kmh": 78,
        "current_section_idx": 4,
        "section_progress": 0.55,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "day": 1, "sched_arr": "23:55", "sched_dep": "23:55", "act_arr": "23:55", "act_dep": "23:55", "status": "departed", "delay_min": 0, "lat": 22.5839, "lon": 88.3426, "type": "origin"},
            {"code": "KGP", "name": "Kharagpur Jn", "km": 115, "day": 2, "sched_arr": "01:35", "sched_dep": "01:40", "act_arr": "01:42", "act_dep": "01:48", "status": "departed", "delay_min": 8, "lat": 22.3302, "lon": 87.3237, "type": "stop"},
            {"code": "BLS", "name": "Baleshwar", "km": 231, "day": 2, "sched_arr": "03:08", "sched_dep": "03:13", "act_arr": "03:18", "act_dep": "03:24", "status": "departed", "delay_min": 11, "lat": 21.4934, "lon": 86.9317, "type": "stop"},
            {"code": "CTC", "name": "Cuttack Jn", "km": 409, "day": 2, "sched_arr": "05:40", "sched_dep": "05:45", "act_arr": "05:58", "act_dep": "06:05", "status": "departed", "delay_min": 20, "lat": 20.4632, "lon": 85.8943, "type": "stop"},
            {"code": "BBS", "name": "Bhubaneswar", "km": 437, "day": 2, "sched_arr": "06:20", "sched_dep": "06:25", "act_arr": "06:42", "act_dep": "06:48", "status": "departed", "delay_min": 22, "lat": 20.2666, "lon": 85.8436, "type": "stop"},
            {"code": "BAM", "name": "Brahmapur", "km": 584, "day": 2, "sched_arr": "08:50", "sched_dep": "08:55", "status": "current", "delay_min": 22, "lat": 19.3150, "lon": 84.7941, "type": "current"},
            {"code": "VSKP", "name": "Visakhapatnam", "km": 873, "day": 2, "sched_arr": "13:50", "sched_dep": "14:10", "status": "upcoming", "delay_min": 25, "lat": 17.7215, "lon": 83.2878, "type": "stop"},
            {"code": "RJY", "name": "Rajahmundry", "km": 1074, "day": 2, "sched_arr": "17:08", "sched_dep": "17:10", "status": "upcoming", "delay_min": 25, "lat": 17.0005, "lon": 81.7800, "type": "stop"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1223, "day": 2, "sched_arr": "19:50", "sched_dep": "20:00", "status": "upcoming", "delay_min": 20, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "NLR", "name": "Nellore", "km": 1478, "day": 2, "sched_arr": "23:28", "sched_dep": "23:30", "status": "upcoming", "delay_min": 18, "lat": 14.4426, "lon": 79.9865, "type": "stop"},
            {"code": "MAS", "name": "Chennai Central", "km": 1661, "day": 3, "sched_arr": "03:45", "sched_dep": "03:45", "status": "upcoming", "delay_min": 15, "lat": 13.0827, "lon": 80.2707, "type": "destination"}
        ]
    },
    "12903": {
        "train_no": "12903",
        "name": "12903 Golden Temple Mail",
        "full_name": "12903 Mumbai Central → Amritsar Jn",
        "type": "Superfast Mail",
        "origin": "Mumbai Central",
        "destination": "Amritsar Jn",
        "current_status_label": "+15 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 15.0,
        "current_subtext": "Currently crossing the Gujarat–Madhya Pradesh border approaching Ratlam Jn",
        "current_near_station": "Vadodara Jn",
        "next_station_code": "RTM",
        "next_station_name": "Ratlam Jn",
        "next_eta": "03:30",
        "confidence": 83,
        "speed_kmh": 85,
        "current_section_idx": 3,
        "section_progress": 0.48,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "day": 1, "sched_arr": "18:45", "sched_dep": "18:45", "act_arr": "18:45", "act_dep": "18:45", "status": "departed", "delay_min": 0, "lat": 18.9696, "lon": 72.8194, "type": "origin"},
            {"code": "BVI", "name": "Borivali", "km": 30, "day": 1, "sched_arr": "19:15", "sched_dep": "19:18", "act_arr": "19:16", "act_dep": "19:20", "status": "departed", "delay_min": 2, "lat": 19.2288, "lon": 72.8575, "type": "stop"},
            {"code": "ST", "name": "Surat", "km": 263, "day": 1, "sched_arr": "22:00", "sched_dep": "22:05", "act_arr": "22:08", "act_dep": "22:15", "status": "departed", "delay_min": 10, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "day": 1, "sched_arr": "23:34", "sched_dep": "23:44", "act_arr": "23:46", "act_dep": "23:58", "status": "departed", "delay_min": 14, "lat": 22.3107, "lon": 73.1812, "type": "stop"},
            {"code": "RTM", "name": "Ratlam Jn", "km": 653, "day": 2, "sched_arr": "03:15", "sched_dep": "03:25", "status": "current", "delay_min": 15, "lat": 23.3441, "lon": 75.0376, "type": "current"},
            {"code": "KOTA", "name": "Kota Jn", "km": 920, "day": 2, "sched_arr": "07:10", "sched_dep": "07:20", "status": "upcoming", "delay_min": 15, "lat": 25.2235, "lon": 75.8648, "type": "stop"},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 1378, "day": 2, "sched_arr": "13:50", "sched_dep": "14:05", "status": "upcoming", "delay_min": 12, "lat": 28.5884, "lon": 77.2534, "type": "stop"},
            {"code": "GZB", "name": "Ghaziabad Jn", "km": 1409, "day": 2, "sched_arr": "14:43", "sched_dep": "14:45", "status": "upcoming", "delay_min": 12, "lat": 28.6678, "lon": 77.4350, "type": "stop"},
            {"code": "UMB", "name": "Ambala Cantt", "km": 1639, "day": 2, "sched_arr": "19:05", "sched_dep": "19:10", "status": "upcoming", "delay_min": 10, "lat": 30.3610, "lon": 76.8185, "type": "stop"},
            {"code": "LDH", "name": "Ludhiana Jn", "km": 1753, "day": 2, "sched_arr": "20:43", "sched_dep": "20:53", "status": "upcoming", "delay_min": 10, "lat": 30.9120, "lon": 75.8538, "type": "stop"},
            {"code": "ASR", "name": "Amritsar Jn", "km": 1893, "day": 2, "sched_arr": "23:40", "sched_dep": "23:40", "status": "upcoming", "delay_min": 10, "lat": 31.6340, "lon": 74.8723, "type": "destination"}
        ]
    },
    "12137": {
        "train_no": "12137",
        "name": "12137 Punjab Mail",
        "full_name": "12137 Mumbai CSMT → Firozpur Cantt",
        "type": "Superfast Mail",
        "origin": "Mumbai CSMT",
        "destination": "Firozpur Cantt",
        "current_status_label": "+30 min",
        "current_status_class": "delayed",
        "is_started": True,
        "base_delay_min": 30.0,
        "current_subtext": "Currently crossing Khandesh division between Bhusaval and Itarsi",
        "current_near_station": "Bhusaval Jn",
        "next_station_code": "ET",
        "next_station_name": "Itarsi Jn",
        "next_eta": "08:30",
        "confidence": 76,
        "speed_kmh": 80,
        "current_section_idx": 4,
        "section_progress": 0.40,
        "stations": [
            {"code": "CSMT", "name": "Mumbai CSMT", "km": 0, "day": 1, "sched_arr": "19:35", "sched_dep": "19:35", "act_arr": "19:35", "act_dep": "19:35", "status": "departed", "delay_min": 0, "lat": 18.9400, "lon": 72.8354, "type": "origin"},
            {"code": "DR", "name": "Dadar", "km": 9, "day": 1, "sched_arr": "19:47", "sched_dep": "19:50", "act_arr": "19:49", "act_dep": "19:52", "status": "departed", "delay_min": 2, "lat": 19.0178, "lon": 72.8478, "type": "stop"},
            {"code": "KYN", "name": "Kalyan Jn", "km": 54, "day": 1, "sched_arr": "20:32", "sched_dep": "20:35", "act_arr": "20:38", "act_dep": "20:43", "status": "departed", "delay_min": 8, "lat": 19.2437, "lon": 73.1355, "type": "stop"},
            {"code": "NK", "name": "Nashik Road", "km": 188, "day": 1, "sched_arr": "23:35", "sched_dep": "23:40", "act_arr": "23:55", "act_dep": "00:02", "status": "departed", "delay_min": 22, "lat": 19.9975, "lon": 73.7898, "type": "stop"},
            {"code": "BSL", "name": "Bhusaval Jn", "km": 445, "day": 2, "sched_arr": "03:00", "sched_dep": "03:05", "act_arr": "03:28", "act_dep": "03:35", "status": "departed", "delay_min": 30, "lat": 21.0455, "lon": 75.8011, "type": "stop"},
            {"code": "ET", "name": "Itarsi Jn", "km": 751, "day": 2, "sched_arr": "08:00", "sched_dep": "08:10", "status": "current", "delay_min": 30, "lat": 21.6111, "lon": 77.7554, "type": "current"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 843, "day": 2, "sched_arr": "09:45", "sched_dep": "09:50", "status": "upcoming", "delay_min": 28, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1232, "day": 2, "sched_arr": "15:26", "sched_dep": "15:28", "status": "upcoming", "delay_min": 25, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 1350, "day": 2, "sched_arr": "17:50", "sched_dep": "17:55", "status": "upcoming", "delay_min": 20, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1545, "day": 2, "sched_arr": "21:25", "sched_dep": "21:40", "status": "upcoming", "delay_min": 18, "lat": 28.6427, "lon": 77.2195, "type": "stop"},
            {"code": "BTI", "name": "Bhatinda Jn", "km": 1843, "day": 3, "sched_arr": "02:55", "sched_dep": "03:20", "status": "upcoming", "delay_min": 15, "lat": 30.2110, "lon": 74.9455, "type": "stop"},
            {"code": "FZR", "name": "Firozpur Cantt", "km": 1931, "day": 3, "sched_arr": "05:10", "sched_dep": "05:10", "status": "upcoming", "delay_min": 15, "lat": 30.9237, "lon": 74.6139, "type": "destination"}
        ]
    },
    "16031": {
        "train_no": "16031",
        "name": "16031 Andaman Express",
        "full_name": "16031 Chennai Central → SMVD Katra",
        "type": "Express",
        "origin": "Chennai Central",
        "destination": "SMVD Katra",
        "current_status_label": "+55 min",
        "current_status_class": "delayed",
        "is_started": True,
        "base_delay_min": 55.0,
        "current_subtext": "Currently held in Nagpur yard for central junction crossing clearance",
        "current_near_station": "Nagpur Jn",
        "next_station_code": "ET",
        "next_station_name": "Itarsi Jn",
        "next_eta": "05:00",
        "confidence": 64,
        "speed_kmh": 68,
        "current_section_idx": 4,
        "section_progress": 0.35,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "day": 1, "sched_arr": "05:15", "sched_dep": "05:15", "act_arr": "05:15", "act_dep": "05:15", "status": "departed", "delay_min": 0, "lat": 13.0827, "lon": 80.2707, "type": "origin"},
            {"code": "GDR", "name": "Gudur Jn", "km": 138, "day": 1, "sched_arr": "07:13", "sched_dep": "07:15", "act_arr": "07:22", "act_dep": "07:25", "status": "departed", "delay_min": 10, "lat": 14.1481, "lon": 79.8499, "type": "stop"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "day": 1, "sched_arr": "11:55", "sched_dep": "12:05", "act_arr": "12:25", "act_dep": "12:40", "status": "departed", "delay_min": 35, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "WL", "name": "Warangal", "km": 638, "day": 1, "sched_arr": "15:00", "sched_dep": "15:05", "act_arr": "15:35", "act_dep": "15:42", "status": "departed", "delay_min": 37, "lat": 17.9689, "lon": 79.5941, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1039, "day": 1, "sched_arr": "22:55", "sched_dep": "23:05", "act_arr": "23:48", "act_dep": "23:58", "status": "departed", "delay_min": 53, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "ET", "name": "Itarsi Jn", "km": 1337, "day": 2, "sched_arr": "04:05", "sched_dep": "04:15", "status": "current", "delay_min": 55, "lat": 21.6111, "lon": 77.7554, "type": "current"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1429, "day": 2, "sched_arr": "05:55", "sched_dep": "06:00", "status": "upcoming", "delay_min": 55, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1721, "day": 2, "sched_arr": "10:45", "sched_dep": "10:53", "status": "upcoming", "delay_min": 50, "lat": 25.4484, "lon": 78.5685, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 1937, "day": 2, "sched_arr": "13:50", "sched_dep": "13:55", "status": "upcoming", "delay_min": 45, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 2132, "day": 2, "sched_arr": "18:10", "sched_dep": "18:25", "status": "upcoming", "delay_min": 40, "lat": 28.6427, "lon": 77.2195, "type": "stop"},
            {"code": "UMB", "name": "Ambala Cantt", "km": 2331, "day": 2, "sched_arr": "21:55", "sched_dep": "22:00", "status": "upcoming", "delay_min": 35, "lat": 30.3610, "lon": 76.8185, "type": "stop"},
            {"code": "JAT", "name": "Jammu Tawi", "km": 2708, "day": 3, "sched_arr": "06:15", "sched_dep": "06:25", "status": "upcoming", "delay_min": 30, "lat": 32.7060, "lon": 74.8795, "type": "stop"},
            {"code": "SVDK", "name": "SMVD Katra", "km": 2786, "day": 3, "sched_arr": "09:20", "sched_dep": "09:20", "status": "upcoming", "delay_min": 30, "lat": 32.9928, "lon": 74.9317, "type": "destination"}
        ]
    },
    "12801": {
        "train_no": "12801",
        "name": "12801 Purushottam Express",
        "full_name": "12801 Puri → New Delhi",
        "type": "Superfast Express",
        "origin": "Puri",
        "destination": "New Delhi",
        "current_status_label": "+14 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 14.0,
        "current_subtext": "Currently traversing Jharkhand mineral corridor between Tatanagar and Bokaro",
        "current_near_station": "Tatanagar Jn",
        "next_station_code": "BKSC",
        "next_station_name": "Bokaro Steel City",
        "next_eta": "09:04",
        "confidence": 86,
        "speed_kmh": 92,
        "current_section_idx": 4,
        "section_progress": 0.44,
        "stations": [
            {"code": "PURI", "name": "Puri", "km": 0, "day": 1, "sched_arr": "21:55", "sched_dep": "21:55", "act_arr": "21:55", "act_dep": "21:55", "status": "departed", "delay_min": 0, "lat": 19.8135, "lon": 85.8312, "type": "origin"},
            {"code": "BBS", "name": "Bhubaneswar", "km": 63, "day": 1, "sched_arr": "23:00", "sched_dep": "23:05", "act_arr": "23:03", "act_dep": "23:09", "status": "departed", "delay_min": 4, "lat": 20.2666, "lon": 85.8436, "type": "stop"},
            {"code": "CTC", "name": "Cuttack Jn", "km": 91, "day": 1, "sched_arr": "23:35", "sched_dep": "23:40", "act_arr": "23:41", "act_dep": "23:46", "status": "departed", "delay_min": 6, "lat": 20.4632, "lon": 85.8943, "type": "stop"},
            {"code": "BLS", "name": "Baleshwar", "km": 306, "day": 2, "sched_arr": "02:06", "sched_dep": "02:11", "act_arr": "02:15", "act_dep": "02:22", "status": "departed", "delay_min": 11, "lat": 21.4934, "lon": 86.9317, "type": "stop"},
            {"code": "TATA", "name": "Tatanagar Jn", "km": 481, "day": 2, "sched_arr": "06:12", "sched_dep": "06:22", "act_arr": "06:26", "act_dep": "06:38", "status": "departed", "delay_min": 16, "lat": 22.7712, "lon": 86.2029, "type": "stop"},
            {"code": "BKSC", "name": "Bokaro Steel City", "km": 568, "day": 2, "sched_arr": "08:45", "sched_dep": "08:50", "status": "current", "delay_min": 14, "lat": 23.6693, "lon": 86.1511, "type": "current"},
            {"code": "GAYA", "name": "Gaya Jn", "km": 749, "day": 2, "sched_arr": "12:35", "sched_dep": "12:40", "status": "upcoming", "delay_min": 14, "lat": 24.7964, "lon": 85.0080, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 954, "day": 2, "sched_arr": "15:30", "sched_dep": "15:40", "status": "upcoming", "delay_min": 12, "lat": 25.2818, "lon": 83.1205, "type": "stop"},
            {"code": "PRYJ", "name": "Prayagraj Jn", "km": 1107, "day": 2, "sched_arr": "18:30", "sched_dep": "18:35", "status": "upcoming", "delay_min": 10, "lat": 25.4358, "lon": 81.8463, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 1301, "day": 2, "sched_arr": "21:10", "sched_dep": "21:15", "status": "upcoming", "delay_min": 8, "lat": 26.4547, "lon": 80.3507, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1742, "day": 3, "sched_arr": "04:00", "sched_dep": "04:00", "status": "upcoming", "delay_min": 5, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12649": {
        "train_no": "12649",
        "name": "12649 Karnataka Sampark Kranti",
        "full_name": "12649 Yesvantpur Jn → Hazrat Nizamuddin",
        "type": "Sampark Kranti",
        "origin": "Yesvantpur Jn",
        "destination": "Hazrat Nizamuddin",
        "current_status_label": "+10 min",
        "current_status_class": "delayed-low",
        "is_started": True,
        "base_delay_min": 10.0,
        "current_subtext": "Currently cruising past Hubballi Junction through South Western Railway",
        "current_near_station": "Hubballi Jn",
        "next_station_code": "KCG",
        "next_station_name": "Kacheguda",
        "next_eta": "08:20",
        "confidence": 88,
        "speed_kmh": 88,
        "current_section_idx": 3,
        "section_progress": 0.52,
        "stations": [
            {"code": "YPR", "name": "Yesvantpur Jn", "km": 0, "day": 1, "sched_arr": "13:50", "sched_dep": "13:50", "act_arr": "13:50", "act_dep": "13:50", "status": "departed", "delay_min": 0, "lat": 13.0238, "lon": 77.5505, "type": "origin"},
            {"code": "ASK", "name": "Arsikere Jn", "km": 160, "day": 1, "sched_arr": "15:53", "sched_dep": "15:55", "act_arr": "15:58", "act_dep": "16:02", "status": "departed", "delay_min": 7, "lat": 13.3134, "lon": 76.2570, "type": "stop"},
            {"code": "DVG", "name": "Davangere", "km": 320, "day": 1, "sched_arr": "17:50", "sched_dep": "17:52", "act_arr": "17:58", "act_dep": "18:02", "status": "departed", "delay_min": 10, "lat": 14.4644, "lon": 75.9218, "type": "stop"},
            {"code": "UBL", "name": "Hubballi Jn", "km": 464, "day": 1, "sched_arr": "21:10", "sched_dep": "21:20", "act_arr": "21:21", "act_dep": "21:32", "status": "departed", "delay_min": 12, "lat": 15.3533, "lon": 75.1415, "type": "stop"},
            {"code": "KCG", "name": "Kacheguda", "km": 978, "day": 2, "sched_arr": "08:10", "sched_dep": "08:20", "status": "current", "delay_min": 10, "lat": 17.3916, "lon": 78.5028, "type": "current"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1562, "day": 2, "sched_arr": "17:15", "sched_dep": "17:20", "status": "upcoming", "delay_min": 10, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1951, "day": 2, "sched_arr": "23:30", "sched_dep": "23:40", "status": "upcoming", "delay_min": 8, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2341, "day": 3, "sched_arr": "04:58", "sched_dep": "05:00", "status": "upcoming", "delay_min": 5, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2650, "day": 3, "sched_arr": "09:15", "sched_dep": "09:15", "status": "upcoming", "delay_min": 5, "lat": 28.5884, "lon": 77.2534, "type": "destination"}
        ]
    },
    "12267": {
        "train_no": "12267",
        "name": "12267 Mumbai Ahmedabad Duronto",
        "full_name": "12267 Mumbai Central → Ahmedabad Jn",
        "type": "Duronto Express",
        "origin": "Mumbai Central",
        "destination": "Ahmedabad Jn",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Non-stop high speed overnight corridor between Surat and Ahmedabad",
        "current_near_station": "Surat",
        "next_station_code": "ADI",
        "next_station_name": "Ahmedabad Jn",
        "next_eta": "05:55",
        "confidence": 95,
        "speed_kmh": 105,
        "current_section_idx": 1,
        "section_progress": 0.65,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "day": 1, "sched_arr": "23:25", "sched_dep": "23:25", "act_arr": "23:25", "act_dep": "23:25", "status": "departed", "delay_min": 0, "lat": 18.9696, "lon": 72.8194, "type": "origin"},
            {"code": "ST", "name": "Surat", "km": 263, "day": 2, "sched_arr": "03:22", "sched_dep": "03:27", "act_arr": "03:20", "act_dep": "03:25", "status": "departed", "delay_min": -2, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 493, "day": 2, "sched_arr": "05:55", "sched_dep": "05:55", "status": "upcoming", "delay_min": 0, "lat": 23.0225, "lon": 72.5714, "type": "destination"}
        ]
    },
    "22691": {
        "train_no": "22691",
        "name": "22691 Bengaluru Rajdhani",
        "full_name": "22691 KSR Bengaluru → Hazrat Nizamuddin",
        "type": "Rajdhani Express",
        "origin": "KSR Bengaluru",
        "destination": "Hazrat Nizamuddin",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 2.0,
        "current_subtext": "High priority run approaching Secunderabad on the South Central corridor",
        "current_near_station": "Secunderabad Jn",
        "next_station_code": "BPQ",
        "next_station_name": "Balharshah Jn",
        "next_eta": "12:22",
        "confidence": 94,
        "speed_kmh": 112,
        "current_section_idx": 3,
        "section_progress": 0.45,
        "stations": [
            {"code": "SBC", "name": "KSR Bengaluru", "km": 0, "day": 1, "sched_arr": "20:00", "sched_dep": "20:00", "act_arr": "20:00", "act_dep": "20:00", "status": "departed", "delay_min": 0, "lat": 12.9784, "lon": 77.5694, "type": "origin"},
            {"code": "SSPN", "name": "Sai P Nilayam", "km": 169, "day": 1, "sched_arr": "22:48", "sched_dep": "22:50", "act_arr": "22:49", "act_dep": "22:52", "status": "departed", "delay_min": 2, "lat": 14.1526, "lon": 77.8080, "type": "stop"},
            {"code": "GTL", "name": "Guntakal Jn", "km": 335, "day": 2, "sched_arr": "01:30", "sched_dep": "01:35", "act_arr": "01:31", "act_dep": "01:36", "status": "departed", "delay_min": 1, "lat": 15.1744, "lon": 77.3712, "type": "stop"},
            {"code": "SC", "name": "Secunderabad Jn", "km": 648, "day": 2, "sched_arr": "07:05", "sched_dep": "07:15", "act_arr": "07:08", "act_dep": "07:18", "status": "departed", "delay_min": 3, "lat": 17.4344, "lon": 78.5016, "type": "stop"},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 1015, "day": 2, "sched_arr": "12:20", "sched_dep": "12:25", "status": "current", "delay_min": 2, "lat": 19.8547, "lon": 79.3524, "type": "current"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1223, "day": 2, "sched_arr": "14:55", "sched_dep": "15:00", "status": "upcoming", "delay_min": 2, "lat": 21.1524, "lon": 79.0888, "type": "stop"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1612, "day": 2, "sched_arr": "20:55", "sched_dep": "21:05", "status": "upcoming", "delay_min": 0, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2002, "day": 3, "sched_arr": "01:50", "sched_dep": "01:52", "status": "upcoming", "delay_min": 0, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2311, "day": 3, "sched_arr": "05:30", "sched_dep": "05:30", "status": "upcoming", "delay_min": 0, "lat": 28.5884, "lon": 77.2534, "type": "destination"}
        ]
    },
    "12273": {
        "train_no": "12273",
        "name": "12273 Howrah NDLS Duronto",
        "full_name": "12273 Howrah Jn → New Delhi",
        "type": "Duronto Express",
        "origin": "Howrah Jn",
        "destination": "New Delhi",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 5.0,
        "current_subtext": "Approaching Pt. Deen Dayal Upadhyaya Junction on priority path",
        "current_near_station": "Patna Jn",
        "next_station_code": "DDU",
        "next_station_name": "Pt. Deen Dayal Upadhyaya",
        "next_eta": "19:45",
        "confidence": 92,
        "speed_kmh": 110,
        "current_section_idx": 3,
        "section_progress": 0.50,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "day": 1, "sched_arr": "08:35", "sched_dep": "08:35", "act_arr": "08:35", "act_dep": "08:35", "status": "departed", "delay_min": 0, "lat": 22.5839, "lon": 88.3426, "type": "origin"},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "day": 1, "sched_arr": "10:54", "sched_dep": "10:59", "act_arr": "10:57", "act_dep": "11:03", "status": "departed", "delay_min": 4, "lat": 23.6871, "lon": 86.9746, "type": "stop"},
            {"code": "JSME", "name": "Jasidih Jn", "km": 311, "day": 1, "sched_arr": "12:25", "sched_dep": "12:27", "act_arr": "12:30", "act_dep": "12:34", "status": "departed", "delay_min": 7, "lat": 24.5161, "lon": 86.6436, "type": "stop"},
            {"code": "PNBE", "name": "Patna Jn", "km": 532, "day": 1, "sched_arr": "16:30", "sched_dep": "16:40", "act_arr": "16:36", "act_dep": "16:47", "status": "departed", "delay_min": 7, "lat": 25.6022, "lon": 85.1376, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 744, "day": 1, "sched_arr": "19:40", "sched_dep": "19:50", "status": "current", "delay_min": 5, "lat": 25.2818, "lon": 83.1205, "type": "current"},
            {"code": "CNB", "name": "Kanpur Central", "km": 1091, "day": 1, "sched_arr": "23:45", "sched_dep": "23:50", "status": "upcoming", "delay_min": 5, "lat": 26.4547, "lon": 80.3507, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 1531, "day": 2, "sched_arr": "06:25", "sched_dep": "06:25", "status": "upcoming", "delay_min": 3, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12009": {
        "train_no": "12009",
        "name": "12009 Mumbai ADI Shatabdi",
        "full_name": "12009 Mumbai Central → Ahmedabad Jn",
        "type": "Shatabdi Express",
        "origin": "Mumbai Central",
        "destination": "Ahmedabad Jn",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Cruising punctually along Western Railway's Surat–Vadodara corridor",
        "current_near_station": "Surat",
        "next_station_code": "BRC",
        "next_station_name": "Vadodara Jn",
        "next_eta": "10:48",
        "confidence": 96,
        "speed_kmh": 115,
        "current_section_idx": 3,
        "section_progress": 0.60,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "day": 1, "sched_arr": "06:20", "sched_dep": "06:20", "act_arr": "06:20", "act_dep": "06:20", "status": "departed", "delay_min": 0, "lat": 18.9696, "lon": 72.8194, "type": "origin"},
            {"code": "BVI", "name": "Borivali", "km": 30, "day": 1, "sched_arr": "06:43", "sched_dep": "06:45", "act_arr": "06:43", "act_dep": "06:45", "status": "departed", "delay_min": 0, "lat": 19.2288, "lon": 72.8575, "type": "stop"},
            {"code": "VAPI", "name": "Vapi", "km": 170, "day": 1, "sched_arr": "08:14", "sched_dep": "08:16", "act_arr": "08:14", "act_dep": "08:16", "status": "departed", "delay_min": 0, "lat": 20.3705, "lon": 72.9106, "type": "stop"},
            {"code": "ST", "name": "Surat", "km": 263, "day": 1, "sched_arr": "09:15", "sched_dep": "09:18", "act_arr": "09:15", "act_dep": "09:18", "status": "departed", "delay_min": 0, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "day": 1, "sched_arr": "10:48", "sched_dep": "10:53", "status": "current", "delay_min": 0, "lat": 22.3107, "lon": 73.1812, "type": "current"},
            {"code": "ANND", "name": "Anand Jn", "km": 428, "day": 1, "sched_arr": "11:24", "sched_dep": "11:26", "status": "upcoming", "delay_min": 0, "lat": 22.5645, "lon": 72.9289, "type": "stop"},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 493, "day": 1, "sched_arr": "12:45", "sched_dep": "12:45", "status": "upcoming", "delay_min": 0, "lat": 23.0225, "lon": 72.5714, "type": "destination"}
        ]
    },
    "12431": {
        "train_no": "12431",
        "name": "12431 Trivandrum Rajdhani",
        "full_name": "12431 Thiruvananthapuram → Hazrat Nizamuddin",
        "type": "Rajdhani Express",
        "origin": "Thiruvananthapuram Central",
        "destination": "Hazrat Nizamuddin",
        "current_status_label": "+12 min",
        "current_status_class": "delayed-low",
        "is_started": True,
        "base_delay_min": 12.0,
        "current_subtext": "Cruising scenic Konkan Railway line approaching Madgaon Junction",
        "current_near_station": "Madgaon",
        "next_station_code": "PNVL",
        "next_station_name": "Panvel",
        "next_eta": "19:47",
        "confidence": 86,
        "speed_kmh": 90,
        "current_section_idx": 4,
        "section_progress": 0.40,
        "stations": [
            {"code": "TVC", "name": "Thiruvananthapuram Central", "km": 0, "day": 1, "sched_arr": "19:15", "sched_dep": "19:15", "act_arr": "19:15", "act_dep": "19:15", "status": "departed", "delay_min": 0, "lat": 8.4870, "lon": 76.9525, "type": "origin"},
            {"code": "ERS", "name": "Ernakulam Jn", "km": 206, "day": 1, "sched_arr": "22:30", "sched_dep": "22:35", "act_arr": "22:35", "act_dep": "22:42", "status": "departed", "delay_min": 7, "lat": 9.9674, "lon": 76.2996, "type": "stop"},
            {"code": "SRR", "name": "Shoranur Jn", "km": 313, "day": 2, "sched_arr": "00:45", "sched_dep": "00:50", "act_arr": "00:52", "act_dep": "00:58", "status": "departed", "delay_min": 8, "lat": 10.7627, "lon": 76.2764, "type": "stop"},
            {"code": "MAJN", "name": "Mangaluru Jn", "km": 620, "day": 2, "sched_arr": "05:20", "sched_dep": "05:25", "act_arr": "05:32", "act_dep": "05:39", "status": "departed", "delay_min": 14, "lat": 12.8698, "lon": 74.8732, "type": "stop"},
            {"code": "MAO", "name": "Madgaon", "km": 934, "day": 2, "sched_arr": "10:00", "sched_dep": "10:10", "act_arr": "10:12", "act_dep": "10:24", "status": "departed", "delay_min": 14, "lat": 15.2736, "lon": 73.9582, "type": "stop"},
            {"code": "PNVL", "name": "Panvel", "km": 1430, "day": 2, "sched_arr": "19:35", "sched_dep": "19:40", "status": "current", "delay_min": 12, "lat": 18.9894, "lon": 73.1175, "type": "current"},
            {"code": "ST", "name": "Surat", "km": 1708, "day": 2, "sched_arr": "23:51", "sched_dep": "23:56", "status": "upcoming", "delay_min": 10, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "BRC", "name": "Vadodara Jn", "km": 1837, "day": 3, "sched_arr": "01:10", "sched_dep": "01:20", "status": "upcoming", "delay_min": 10, "lat": 22.3107, "lon": 73.1812, "type": "stop"},
            {"code": "KOTA", "name": "Kota Jn", "km": 2365, "day": 3, "sched_arr": "07:10", "sched_dep": "07:20", "status": "upcoming", "delay_min": 8, "lat": 25.2235, "lon": 75.8648, "type": "stop"},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2823, "day": 3, "sched_arr": "12:30", "sched_dep": "12:30", "status": "upcoming", "delay_min": 5, "lat": 28.5884, "lon": 77.2534, "type": "destination"}
        ]
    },
    "12423": {
        "train_no": "12423",
        "name": "12423 Dibrugarh Rajdhani",
        "full_name": "12423 Dibrugarh → New Delhi",
        "type": "Rajdhani Express",
        "origin": "Dibrugarh",
        "destination": "New Delhi",
        "current_status_label": "+18 min",
        "current_status_class": "delayed-mid",
        "is_started": True,
        "base_delay_min": 18.0,
        "current_subtext": "Navigating North Bengal Dooars corridor towards Katihar Junction",
        "current_near_station": "New Jalpaiguri",
        "next_station_code": "KIR",
        "next_station_name": "Katihar Jn",
        "next_eta": "16:38",
        "confidence": 81,
        "speed_kmh": 96,
        "current_section_idx": 4,
        "section_progress": 0.46,
        "stations": [
            {"code": "DBRG", "name": "Dibrugarh", "km": 0, "day": 1, "sched_arr": "20:55", "sched_dep": "20:55", "act_arr": "20:55", "act_dep": "20:55", "status": "departed", "delay_min": 0, "lat": 27.4728, "lon": 94.9120, "type": "origin"},
            {"code": "DMV", "name": "Dimapur", "km": 208, "day": 2, "sched_arr": "01:05", "sched_dep": "01:12", "act_arr": "01:15", "act_dep": "01:24", "status": "departed", "delay_min": 12, "lat": 25.9060, "lon": 93.7270, "type": "stop"},
            {"code": "LMG", "name": "Lumding Jn", "km": 278, "day": 2, "sched_arr": "03:00", "sched_dep": "03:05", "act_arr": "03:14", "act_dep": "03:22", "status": "departed", "delay_min": 17, "lat": 25.7513, "lon": 93.1706, "type": "stop"},
            {"code": "GHY", "name": "Guwahati", "km": 459, "day": 2, "sched_arr": "06:30", "sched_dep": "06:45", "act_arr": "06:50", "act_dep": "07:08", "status": "departed", "delay_min": 23, "lat": 26.1833, "lon": 91.7533, "type": "stop"},
            {"code": "NJP", "name": "New Jalpaiguri", "km": 888, "day": 2, "sched_arr": "13:15", "sched_dep": "13:25", "act_arr": "13:34", "act_dep": "13:46", "status": "departed", "delay_min": 21, "lat": 26.6858, "lon": 88.4429, "type": "stop"},
            {"code": "KIR", "name": "Katihar Jn", "km": 1056, "day": 2, "sched_arr": "16:20", "sched_dep": "16:30", "status": "current", "delay_min": 18, "lat": 25.5414, "lon": 87.5714, "type": "current"},
            {"code": "BJU", "name": "Barauni Jn", "km": 1236, "day": 2, "sched_arr": "19:05", "sched_dep": "19:15", "status": "upcoming", "delay_min": 15, "lat": 25.4347, "lon": 86.0020, "type": "stop"},
            {"code": "PPTA", "name": "Patliputra", "km": 1344, "day": 2, "sched_arr": "21:40", "sched_dep": "21:50", "status": "upcoming", "delay_min": 15, "lat": 25.6154, "lon": 85.0888, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 1556, "day": 3, "sched_arr": "00:55", "sched_dep": "01:05", "status": "upcoming", "delay_min": 12, "lat": 25.2818, "lon": 83.1205, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 1903, "day": 3, "sched_arr": "04:40", "sched_dep": "04:45", "status": "upcoming", "delay_min": 10, "lat": 26.4547, "lon": 80.3507, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 2343, "day": 3, "sched_arr": "10:30", "sched_dep": "10:30", "status": "upcoming", "delay_min": 8, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12621": {
        "train_no": "12621",
        "name": "12621 Tamil Nadu Express",
        "full_name": "12621 Chennai Central → New Delhi",
        "type": "Superfast Express",
        "origin": "Chennai Central",
        "destination": "New Delhi",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 6.0,
        "current_subtext": "Punctually traversing the Grand Trunk corridor towards Nagpur Junction",
        "current_near_station": "Balharshah Jn",
        "next_station_code": "NGP",
        "next_station_name": "Nagpur Jn",
        "next_eta": "13:56",
        "confidence": 90,
        "speed_kmh": 98,
        "current_section_idx": 3,
        "section_progress": 0.50,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "day": 1, "sched_arr": "22:00", "sched_dep": "22:00", "act_arr": "22:00", "act_dep": "22:00", "status": "departed", "delay_min": 0, "lat": 13.0827, "lon": 80.2707, "type": "origin"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "day": 2, "sched_arr": "03:55", "sched_dep": "04:05", "act_arr": "03:58", "act_dep": "04:10", "status": "departed", "delay_min": 5, "lat": 16.5186, "lon": 80.6199, "type": "stop"},
            {"code": "WL", "name": "Warangal", "km": 638, "day": 2, "sched_arr": "06:50", "sched_dep": "06:52", "act_arr": "06:54", "act_dep": "06:58", "status": "departed", "delay_min": 6, "lat": 17.9689, "lon": 79.5941, "type": "stop"},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 881, "day": 2, "sched_arr": "10:35", "sched_dep": "10:40", "act_arr": "10:42", "act_dep": "10:48", "status": "departed", "delay_min": 8, "lat": 19.8547, "lon": 79.3524, "type": "stop"},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1089, "day": 2, "sched_arr": "13:50", "sched_dep": "13:55", "status": "current", "delay_min": 6, "lat": 21.1524, "lon": 79.0888, "type": "current"},
            {"code": "ET", "name": "Itarsi Jn", "km": 1387, "day": 2, "sched_arr": "18:30", "sched_dep": "18:35", "status": "upcoming", "delay_min": 5, "lat": 21.6111, "lon": 77.7554, "type": "stop"},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1479, "day": 2, "sched_arr": "20:10", "sched_dep": "20:20", "status": "upcoming", "delay_min": 5, "lat": 23.2599, "lon": 77.4126, "type": "stop"},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1869, "day": 3, "sched_arr": "01:32", "sched_dep": "01:34", "status": "upcoming", "delay_min": 3, "lat": 26.2183, "lon": 78.1828, "type": "stop"},
            {"code": "AGC", "name": "Agra Cantt", "km": 1987, "day": 3, "sched_arr": "03:05", "sched_dep": "03:10", "status": "upcoming", "delay_min": 3, "lat": 27.1591, "lon": 77.9902, "type": "stop"},
            {"code": "NDLS", "name": "New Delhi", "km": 2182, "day": 3, "sched_arr": "06:30", "sched_dep": "06:30", "status": "upcoming", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "12215": {
        "train_no": "12215",
        "name": "12215 DEE BDTS Garib Rath",
        "full_name": "12215 Delhi Sarai Rohilla → Bandra Terminus",
        "type": "Garib Rath Express",
        "origin": "Delhi Sarai Rohilla",
        "destination": "Bandra Terminus",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 7.0,
        "current_subtext": "Currently speeding through Rajasthan towards Abu Road",
        "current_near_station": "Ajmer Jn",
        "next_station_code": "ABR",
        "next_station_name": "Abu Road",
        "next_eta": "20:12",
        "confidence": 89,
        "speed_kmh": 90,
        "current_section_idx": 3,
        "section_progress": 0.48,
        "stations": [
            {"code": "DEE", "name": "Delhi Sarai Rohilla", "km": 0, "day": 1, "sched_arr": "08:55", "sched_dep": "08:55", "act_arr": "08:55", "act_dep": "08:55", "status": "departed", "delay_min": 0, "lat": 28.6607, "lon": 77.1843, "type": "origin"},
            {"code": "GGN", "name": "Gurgaon", "km": 31, "day": 1, "sched_arr": "09:28", "sched_dep": "09:30", "act_arr": "09:30", "act_dep": "09:33", "status": "departed", "delay_min": 3, "lat": 28.4595, "lon": 77.0266, "type": "stop"},
            {"code": "JP", "name": "Jaipur", "km": 303, "day": 1, "sched_arr": "13:15", "sched_dep": "13:25", "act_arr": "13:22", "act_dep": "13:34", "status": "departed", "delay_min": 9, "lat": 26.9196, "lon": 75.7878, "type": "stop"},
            {"code": "AII", "name": "Ajmer Jn", "km": 438, "day": 1, "sched_arr": "15:40", "sched_dep": "15:55", "act_arr": "15:48", "act_dep": "16:05", "status": "departed", "delay_min": 10, "lat": 26.4499, "lon": 74.6399, "type": "stop"},
            {"code": "ABR", "name": "Abu Road", "km": 744, "day": 1, "sched_arr": "20:05", "sched_dep": "20:15", "status": "current", "delay_min": 7, "lat": 24.4784, "lon": 72.7806, "type": "current"},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 935, "day": 1, "sched_arr": "23:20", "sched_dep": "23:30", "status": "upcoming", "delay_min": 5, "lat": 23.0225, "lon": 72.5714, "type": "stop"},
            {"code": "ST", "name": "Surat", "km": 1165, "day": 2, "sched_arr": "02:47", "sched_dep": "02:52", "status": "upcoming", "delay_min": 5, "lat": 21.2049, "lon": 72.8407, "type": "stop"},
            {"code": "BDTS", "name": "Bandra Terminus", "km": 1431, "day": 2, "sched_arr": "07:35", "sched_dep": "07:35", "status": "upcoming", "delay_min": 3, "lat": 19.0544, "lon": 72.8402, "type": "destination"}
        ]
    },
    "12259": {
        "train_no": "12259",
        "name": "12259 Sealdah NDLS Duronto",
        "full_name": "12259 Sealdah → New Delhi",
        "type": "Duronto Express",
        "origin": "Sealdah",
        "destination": "New Delhi",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 4.0,
        "current_subtext": "Speeding across Grand Chord automated section towards Kanpur Central",
        "current_near_station": "Pt. Deen Dayal Upadhyaya",
        "next_station_code": "CNB",
        "next_station_name": "Kanpur Central",
        "next_eta": "05:24",
        "confidence": 93,
        "speed_kmh": 110,
        "current_section_idx": 2,
        "section_progress": 0.55,
        "stations": [
            {"code": "SDAH", "name": "Sealdah", "km": 0, "day": 1, "sched_arr": "17:00", "sched_dep": "17:00", "act_arr": "17:00", "act_dep": "17:00", "status": "departed", "delay_min": 0, "lat": 22.5697, "lon": 88.3713, "type": "origin"},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 266, "day": 1, "sched_arr": "20:50", "sched_dep": "20:55", "act_arr": "20:53", "act_dep": "21:00", "status": "departed", "delay_min": 5, "lat": 23.7957, "lon": 86.4304, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 671, "day": 2, "sched_arr": "01:25", "sched_dep": "01:35", "act_arr": "01:30", "act_dep": "01:42", "status": "departed", "delay_min": 7, "lat": 25.2818, "lon": 83.1205, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 1018, "day": 2, "sched_arr": "05:20", "sched_dep": "05:25", "status": "current", "delay_min": 4, "lat": 26.4547, "lon": 80.3507, "type": "current"},
            {"code": "NDLS", "name": "New Delhi", "km": 1458, "day": 2, "sched_arr": "11:00", "sched_dep": "11:00", "status": "upcoming", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    },
    "20607": {
        "train_no": "20607",
        "name": "20607 Chennai Mysuru VB",
        "full_name": "20607 Chennai Central → Mysuru Jn",
        "type": "Vande Bharat Express",
        "origin": "Chennai Central",
        "destination": "Mysuru Jn",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Semi-high speed operation approaching Bengaluru city limits",
        "current_near_station": "Krishnarajapuram",
        "next_station_code": "SBC",
        "next_station_name": "KSR Bengaluru",
        "next_eta": "09:55",
        "confidence": 95,
        "speed_kmh": 110,
        "current_section_idx": 2,
        "section_progress": 0.60,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "day": 1, "sched_arr": "05:50", "sched_dep": "05:50", "act_arr": "05:50", "act_dep": "05:50", "status": "departed", "delay_min": 0, "lat": 13.0827, "lon": 80.2707, "type": "origin"},
            {"code": "KPD", "name": "Katpadi Jn", "km": 130, "day": 1, "sched_arr": "07:13", "sched_dep": "07:15", "act_arr": "07:13", "act_dep": "07:15", "status": "departed", "delay_min": 0, "lat": 12.9738, "lon": 79.1362, "type": "stop"},
            {"code": "KJM", "name": "Krishnarajapuram", "km": 342, "day": 1, "sched_arr": "09:08", "sched_dep": "09:10", "act_arr": "09:08", "act_dep": "09:10", "status": "departed", "delay_min": 0, "lat": 13.0003, "lon": 77.6836, "type": "stop"},
            {"code": "SBC", "name": "KSR Bengaluru", "km": 359, "day": 1, "sched_arr": "09:55", "sched_dep": "10:00", "status": "current", "delay_min": 0, "lat": 12.9784, "lon": 77.5694, "type": "current"},
            {"code": "MYS", "name": "Mysuru Jn", "km": 497, "day": 1, "sched_arr": "12:20", "sched_dep": "12:20", "status": "upcoming", "delay_min": 0, "lat": 12.3160, "lon": 76.6456, "type": "destination"}
        ]
    },
    "12019": {
        "train_no": "12019",
        "name": "12019 Howrah Ranchi Shatabdi",
        "full_name": "12019 Howrah Jn → Ranchi Jn",
        "type": "Shatabdi Express",
        "origin": "Howrah Jn",
        "destination": "Ranchi Jn",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 0.0,
        "current_subtext": "Punctually traversing the coal belt towards Bokaro Steel City",
        "current_near_station": "Dhanbad Jn",
        "next_station_code": "BKSC",
        "next_station_name": "Bokaro Steel City",
        "next_eta": "10:55",
        "confidence": 95,
        "speed_kmh": 100,
        "current_section_idx": 3,
        "section_progress": 0.50,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "day": 1, "sched_arr": "06:05", "sched_dep": "06:05", "act_arr": "06:05", "act_dep": "06:05", "status": "departed", "delay_min": 0, "lat": 22.5839, "lon": 88.3426, "type": "origin"},
            {"code": "DGR", "name": "Durgapur", "km": 171, "day": 1, "sched_arr": "07:48", "sched_dep": "07:50", "act_arr": "07:48", "act_dep": "07:50", "status": "departed", "delay_min": 0, "lat": 23.5204, "lon": 87.3119, "type": "stop"},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "day": 1, "sched_arr": "08:24", "sched_dep": "08:26", "act_arr": "08:24", "act_dep": "08:26", "status": "departed", "delay_min": 0, "lat": 23.6871, "lon": 86.9746, "type": "stop"},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 258, "day": 1, "sched_arr": "09:23", "sched_dep": "09:28", "act_arr": "09:23", "act_dep": "09:28", "status": "departed", "delay_min": 0, "lat": 23.7957, "lon": 86.4304, "type": "stop"},
            {"code": "BKSC", "name": "Bokaro Steel City", "km": 308, "day": 1, "sched_arr": "10:55", "sched_dep": "11:00", "status": "current", "delay_min": 0, "lat": 23.6693, "lon": 86.1511, "type": "current"},
            {"code": "RNC", "name": "Ranchi Jn", "km": 421, "day": 1, "sched_arr": "13:15", "sched_dep": "13:15", "status": "upcoming", "delay_min": 0, "lat": 23.3441, "lon": 85.3096, "type": "destination"}
        ]
    },
    "12245": {
        "train_no": "12245",
        "name": "12245 Howrah YPR Duronto",
        "full_name": "12245 Howrah Jn → Yesvantpur Jn",
        "type": "Duronto Express",
        "origin": "Howrah Jn",
        "destination": "Yesvantpur Jn",
        "current_status_label": "+8 min",
        "current_status_class": "delayed-low",
        "is_started": True,
        "base_delay_min": 8.0,
        "current_subtext": "Speeding through North Coastal Andhra corridor towards Vijayawada",
        "current_near_station": "Vizianagaram Jn",
        "next_station_code": "BZA",
        "next_station_name": "Vijayawada Jn",
        "next_eta": "04:13",
        "confidence": 88,
        "speed_kmh": 95,
        "current_section_idx": 2,
        "section_progress": 0.45,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "day": 1, "sched_arr": "10:50", "sched_dep": "10:50", "act_arr": "10:50", "act_dep": "10:50", "status": "departed", "delay_min": 0, "lat": 22.5839, "lon": 88.3426, "type": "origin"},
            {"code": "BBS", "name": "Bhubaneswar", "km": 437, "day": 1, "sched_arr": "16:20", "sched_dep": "16:30", "act_arr": "16:28", "act_dep": "16:40", "status": "departed", "delay_min": 10, "lat": 20.2666, "lon": 85.8436, "type": "stop"},
            {"code": "VZM", "name": "Vizianagaram Jn", "km": 820, "day": 1, "sched_arr": "21:50", "sched_dep": "22:00", "act_arr": "22:00", "act_dep": "22:12", "status": "departed", "delay_min": 12, "lat": 18.1167, "lon": 83.4167, "type": "stop"},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1223, "day": 2, "sched_arr": "04:05", "sched_dep": "04:15", "status": "current", "delay_min": 8, "lat": 16.5186, "lon": 80.6199, "type": "current"},
            {"code": "RU", "name": "Renigunta Jn", "km": 1596, "day": 2, "sched_arr": "09:25", "sched_dep": "09:30", "status": "upcoming", "delay_min": 5, "lat": 13.6288, "lon": 79.5117, "type": "stop"},
            {"code": "YPR", "name": "Yesvantpur Jn", "km": 1947, "day": 2, "sched_arr": "15:50", "sched_dep": "15:50", "status": "upcoming", "delay_min": 5, "lat": 13.0238, "lon": 77.5505, "type": "destination"}
        ]
    },
    "12393": {
        "train_no": "12393",
        "name": "12393 Sampoorna Kranti Exp",
        "full_name": "12393 Rajendra Nagar Patna → New Delhi",
        "type": "Superfast Express",
        "origin": "Rajendra Nagar Patna",
        "destination": "New Delhi",
        "current_status_label": "On time",
        "current_status_class": "ontime",
        "is_started": True,
        "base_delay_min": 4.0,
        "current_subtext": "Cruising past Pt. Deen Dayal Upadhyaya Junction on high-priority track",
        "current_near_station": "Pt. Deen Dayal Upadhyaya",
        "next_station_code": "CNB",
        "next_station_name": "Kanpur Central",
        "next_eta": "02:29",
        "confidence": 92,
        "speed_kmh": 105,
        "current_section_idx": 3,
        "section_progress": 0.45,
        "stations": [
            {"code": "RJPB", "name": "Rajendra Nagar Patna", "km": 0, "day": 1, "sched_arr": "19:25", "sched_dep": "19:25", "act_arr": "19:25", "act_dep": "19:25", "status": "departed", "delay_min": 0, "lat": 25.5973, "lon": 85.1678, "type": "origin"},
            {"code": "PNBE", "name": "Patna Jn", "km": 3, "day": 1, "sched_arr": "19:35", "sched_dep": "19:45", "act_arr": "19:35", "act_dep": "19:45", "status": "departed", "delay_min": 0, "lat": 25.6022, "lon": 85.1376, "type": "stop"},
            {"code": "ARA", "name": "Ara Jn", "km": 52, "day": 1, "sched_arr": "20:20", "sched_dep": "20:22", "act_arr": "20:22", "act_dep": "20:26", "status": "departed", "delay_min": 4, "lat": 25.5560, "lon": 84.6603, "type": "stop"},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 214, "day": 1, "sched_arr": "22:20", "sched_dep": "22:30", "act_arr": "22:24", "act_dep": "22:36", "status": "departed", "delay_min": 6, "lat": 25.2818, "lon": 83.1205, "type": "stop"},
            {"code": "CNB", "name": "Kanpur Central", "km": 561, "day": 2, "sched_arr": "02:25", "sched_dep": "02:30", "status": "current", "delay_min": 4, "lat": 26.4547, "lon": 80.3507, "type": "current"},
            {"code": "NDLS", "name": "New Delhi", "km": 1001, "day": 2, "sched_arr": "07:55", "sched_dep": "07:55", "status": "upcoming", "delay_min": 0, "lat": 28.6427, "lon": 77.2195, "type": "destination"}
        ]
    }
}

class NTESMockFallbackProvider(TrainDataProvider):
    def __init__(self):
        self.start_epoch = time.time()
        self.ml_engine = get_ml_engine()

    def _interpolate_coords(self, stn1: dict, stn2: dict, frac: float):
        lat = stn1["lat"] + (stn2["lat"] - stn1["lat"]) * frac
        lon = stn1["lon"] + (stn2["lon"] - stn1["lon"]) * frac
        return round(lat, 4), round(lon, 4)

    def get_train_position(self, train_no: str) -> Dict[str, Any]:
        cfg = TRAIN_CONFIGS.get(train_no, TRAIN_CONFIGS["22490"])
        stations = cfg["stations"]
        curr_idx = cfg["current_section_idx"]
        is_not_started = (cfg.get("current_status_class") == "scheduled" or not cfg.get("is_started", True))
        is_completed = (
            cfg.get("is_completed", False)
            or cfg.get("current_status_class") == "completed"
            or cfg.get("current_status_label") == "Arrived"
            or curr_idx >= len(stations) - 1
        )

        if is_completed:
            dest_stn = stations[-1]
            return {
                "train_no": train_no,
                "train_name": cfg["name"],
                "lat": dest_stn["lat"],
                "lon": dest_stn["lon"],
                "speed_kmh": 0,
                "status_label": "Arrived",
                "status_class": "completed",
                "current_section": f"Arrived at {dest_stn['name']} (Final Station)",
                "current_subtext": cfg.get("current_subtext", f"Arrived at {dest_stn['name']} · Journey Completed"),
                "progress_in_section": 1.0,
                "updated_at": datetime.now(IST).isoformat(),
                "last_updated_secs_ago": 1,
                "data_source": "NTES Live Telemetry (CRIS Pravah Compatible)",
                "is_stale": False
            }

        if is_not_started:
            origin_stn = stations[0]
            return {
                "train_no": train_no,
                "train_name": cfg["name"],
                "lat": origin_stn["lat"],
                "lon": origin_stn["lon"],
                "speed_kmh": 0,
                "status_label": "Scheduled",
                "status_class": "scheduled",
                "current_section": f"At {origin_stn['name']} (Origin Platform)",
                "current_subtext": cfg["current_subtext"],
                "progress_in_section": 0.0,
                "updated_at": datetime.now(IST).isoformat(),
                "last_updated_secs_ago": 1,
                "data_source": "NTES Live Telemetry (CRIS Pravah Compatible)",
                "is_stale": False
            }

        # Smooth continuous real-time progress along the section
        sec_cycle_sec = 80.0
        elapsed = (time.time() - self.start_epoch) % sec_cycle_sec
        base_offset = cfg.get("section_progress", 0.5) * sec_cycle_sec
        cycle_pos = (elapsed + base_offset) % sec_cycle_sec
        progress = max(0.02, min(0.98, cycle_pos / sec_cycle_sec))

        s_from = stations[curr_idx]
        next_idx = min(len(stations) - 1, curr_idx + 1)
        s_to = stations[next_idx]
        lat, lon = self._interpolate_coords(s_from, s_to, progress)
        
        # Speed fluctuation (+/- 2 km/h) mimicking GPS satellite readings
        jitter_speed = cfg["speed_kmh"] + int(math.sin(time.time() * 0.7) * 2)

        return {
            "train_no": train_no,
            "train_name": cfg["name"],
            "lat": lat,
            "lon": lon,
            "speed_kmh": jitter_speed,
            "status_label": cfg["current_status_label"],
            "status_class": cfg["current_status_class"],
            "current_section": f"{s_from['name']} → {s_to['name']}",
            "current_subtext": cfg["current_subtext"],
            "progress_in_section": round(progress, 3),
            "updated_at": datetime.now(IST).isoformat(),
            "last_updated_secs_ago": int((time.time() - self.start_epoch) % 4) + 1,
            "data_source": "NTES Live Telemetry (CRIS Pravah Compatible)",
            "is_stale": False
        }

    def get_train_journey(self, train_no: str) -> Dict[str, Any]:
        cfg = TRAIN_CONFIGS.get(train_no, TRAIN_CONFIGS["22490"])
        stations = cfg["stations"]
        curr_sec_idx = cfg["current_section_idx"]
        curr_delay = cfg["base_delay_min"]
        is_not_started = (cfg.get("current_status_class") == "scheduled" or not cfg.get("is_started", True))
        is_completed = (
            cfg.get("is_completed", False)
            or cfg.get("current_status_class") == "completed"
            or cfg.get("current_status_label") == "Arrived"
            or curr_sec_idx >= len(stations) - 1
        )

        if is_completed:
            dest_stn = stations[-1]
            journey_stops = []
            for idx, s in enumerate(stations):
                sched_time = s["sched_dep"] if idx == 0 else s["sched_arr"]
                act_time = s.get("act_arr") or s.get("act_dep") or sched_time
                delay = float(s.get("delay_min", 0.0))
                status_note = format_delay_note(delay)
                is_dest = (idx == len(stations) - 1)

                journey_stops.append({
                    "station_code": s["code"],
                    "station_name": s["name"],
                    "status_type": "departed",
                    "role": "destination" if is_dest else ("origin" if idx == 0 else "passed"),
                    "scheduled_time": sched_time,
                    "actual_time": act_time,
                    "predicted_time": None,
                    "delay_min": delay,
                    "is_departed": True,
                    "is_arrived": is_dest,
                    "time_display": f"Arrived {act_time} IST · Reached final destination" if is_dest else f"Departed {act_time} · {status_note}",
                    "status_note": "Reached final destination" if is_dest else status_note,
                    "confidence_pct": 100 if is_dest else None,
                    "lat": s["lat"],
                    "lon": s["lon"]
                })

            pos = self.get_train_position(train_no)
            return {
                "train_no": train_no,
                "train_name": cfg["name"],
                "full_name": cfg["full_name"],
                "origin": cfg["origin"],
                "destination": cfg["destination"],
                "is_departed": True,
                "is_completed": True,
                "train_status": "COMPLETED",
                "current_status_label": "Arrived",
                "current_status_class": "completed",
                "current_subtext": cfg.get("current_subtext", f"Arrived at {dest_stn['name']} at {dest_stn.get('act_arr', dest_stn['sched_arr'])} IST (Reached final destination)"),
                "why_this_eta": f"{cfg['name']} has successfully reached its final destination ({dest_stn['name']}). Journey completed.",
                "live_position": pos,
                "journey_log": journey_stops,
                "route_polyline": [{"lat": s["lat"], "lon": s["lon"], "name": s["name"], "code": s["code"]} for s in stations]
            }

        if is_not_started:
            journey_stops = []
            for idx, s in enumerate(stations):
                if idx == 0:
                    journey_stops.append({
                        "station_code": s["code"],
                        "station_name": s["name"],
                        "status_type": "current",
                        "role": "origin",
                        "scheduled_time": s["sched_dep"],
                        "actual_time": None,
                        "predicted_time": s["sched_dep"],
                        "delay_min": 0.0,
                        "is_departed": False,
                        "time_display": f"Scheduled departure {s['sched_dep']} IST · Yet to depart",
                        "status_note": "Yet to depart",
                        "confidence_pct": 95,
                        "lat": s["lat"],
                        "lon": s["lon"]
                    })
                else:
                    journey_stops.append({
                        "station_code": s["code"],
                        "station_name": s["name"],
                        "status_type": "upcoming",
                        "role": "destination" if idx == len(stations) - 1 else "upcoming",
                        "scheduled_time": s["sched_arr"],
                        "actual_time": None,
                        "predicted_time": s["sched_arr"],
                        "delay_min": 0.0,
                        "is_departed": False,
                        "time_display": f"Scheduled {s['sched_arr']} · Journey yet to start",
                        "status_note": "Journey yet to start",
                        "confidence_pct": max(55, 95 - idx * 4),
                        "lat": s["lat"],
                        "lon": s["lon"]
                    })
            pos = self.get_train_position(train_no)
            return {
                "train_no": train_no,
                "train_name": cfg["name"],
                "full_name": cfg["full_name"],
                "origin": cfg["origin"],
                "destination": cfg["destination"],
                "is_departed": False,
                "train_status": "NOT_STARTED",
                "current_status_label": "Scheduled",
                "current_status_class": "scheduled",
                "current_subtext": cfg["current_subtext"],
                "why_this_eta": f"{cfg['name']} has not departed yet. Scheduled to depart from {cfg['origin']} at {stations[0]['sched_dep']} IST.",
                "live_position": pos,
                "journey_log": journey_stops,
                "route_polyline": [{"lat": s["lat"], "lon": s["lon"], "name": s["name"], "code": s["code"]} for s in stations]
            }

        # Fetch passenger reports
        feedback = get_feedback_for_train(train_no)
        feedback_count = len(feedback)

        # Dynamic calculation for each station stop
        journey_stops = []
        explanation_card = None

        for idx, s in enumerate(stations):
            is_completed = idx <= curr_sec_idx
            is_current = idx == curr_sec_idx + 1
            is_upcoming = idx > curr_sec_idx + 1

            sched_time = s["sched_dep"] if idx == 0 else s["sched_arr"]
            stn_day = s.get("day", 1)

            if is_completed:
                # Past stop: record actual times distinctly from scheduled times
                if idx == 0:
                    act_time = s.get("act_dep", s["sched_dep"])
                    delay = compute_delay_minutes(s["sched_dep"], act_time, sched_day=stn_day)
                    disp_time = act_time
                else:
                    act_time = s.get("act_arr", s["sched_arr"])
                    delay = compute_delay_minutes(s["sched_arr"], act_time, sched_day=stn_day)
                    disp_time = s.get("act_dep", act_time)

                status_note = format_delay_note(delay)
                log_timing_audit(
                    train_no=train_no,
                    station_code=s["code"],
                    station_name=s["name"],
                    sched_time=sched_time,
                    actual_time=act_time,
                    computed_delay=delay,
                    context="DepartedHalt"
                )

                journey_stops.append({
                    "station_code": s["code"],
                    "station_name": s["name"],
                    "status_type": "departed",
                    "role": "origin" if idx == 0 else "passed",
                    "scheduled_time": sched_time,
                    "actual_time": act_time,
                    "predicted_time": None,
                    "delay_min": delay,
                    "time_display": f"Departed {disp_time} · {status_note}",
                    "confidence_pct": None,
                    "lat": s["lat"],
                    "lon": s["lon"]
                })
            else:
                # Current and upcoming stops:
                # actual_time is None (has not occurred yet)
                stops_ahead = idx - curr_sec_idx
                rem_km = s["km"] - stations[curr_sec_idx]["km"]
                section_congestion = 0.85 if train_no == "22536" else (0.65 if train_no == "12615" else 0.20)
                priority = 1 if train_no == "22490" else (2 if train_no == "12951" else (3 if train_no == "12615" else 4))

                prediction = self.ml_engine.predict_eta(
                    train_no=train_no,
                    priority=priority,
                    current_delay_min=curr_delay,
                    delay_trend=2.0 if curr_delay > 10 else 0.0,
                    hour_of_day=14,
                    day_of_week=2,
                    section_hist_avg=15.0,
                    section_congestion=section_congestion,
                    weather_flag=0,
                    rem_dist_km=rem_km,
                    stops_ahead=stops_ahead,
                    passenger_reports=feedback_count,
                    scheduled_arrival_str=sched_time,
                    section_name=f"{stations[curr_sec_idx]['name']}–{s['name']}",
                    station_name=s["name"]
                )

                if is_current:
                    pred_delay = int(round(curr_delay))
                    # Predict arrival using precise add_delay_to_time
                    pred_time = add_delay_to_time(sched_time, pred_delay)
                    conf = cfg["confidence"]
                    status_note = format_delay_note(pred_delay)

                    journey_stops.append({
                        "station_code": s["code"],
                        "station_name": s["name"],
                        "status_type": "current",
                        "role": "current",
                        "scheduled_time": sched_time,
                        "actual_time": None,
                        "predicted_time": pred_time,
                        "delay_min": pred_delay,
                        "time_display": f"Predicted {pred_time} · {status_note}",
                        "confidence_pct": conf,
                        "lat": s["lat"],
                        "lon": s["lon"]
                    })
                    explanation_card = prediction["explanation"]
                else:
                    pred_delay = int(round(prediction["predicted_delay_min"]))
                    pred_time = add_delay_to_time(sched_time, pred_delay)
                    conf = max(45, cfg["confidence"] - (stops_ahead * 6))
                    status_note = format_delay_note(pred_delay)

                    journey_stops.append({
                        "station_code": s["code"],
                        "station_name": s["name"],
                        "status_type": "upcoming",
                        "role": "destination" if idx == len(stations) - 1 else "upcoming",
                        "scheduled_time": sched_time,
                        "actual_time": None,
                        "predicted_time": pred_time,
                        "delay_min": pred_delay,
                        "time_display": f"Predicted {pred_time} · {status_note}",
                        "confidence_pct": conf,
                        "lat": s["lat"],
                        "lon": s["lon"]
                    })

        pos = self.get_train_position(train_no)
        status_label = format_status_label(curr_delay, is_not_started)
        status_class = format_status_class(curr_delay, is_not_started)

        return {
            "train_no": train_no,
            "train_name": cfg["name"],
            "full_name": cfg["full_name"],
            "origin": cfg["origin"],
            "destination": cfg["destination"],
            "is_departed": True,
            "train_status": "RUNNING",
            "current_status_label": status_label,
            "current_status_class": status_class,
            "current_subtext": cfg["current_subtext"],
            "why_this_eta": explanation_card or cfg["current_subtext"],
            "live_position": pos,
            "journey_log": journey_stops,
            "route_polyline": [{"lat": s["lat"], "lon": s["lon"], "name": s["name"], "code": s["code"]} for s in stations]
        }

    def get_train_eta(self, train_no: str) -> Dict[str, Any]:
        return self.get_train_journey(train_no)

    def get_fleet_summary(self) -> List[Dict[str, Any]]:
        fleet = []
        for t_no, cfg in TRAIN_CONFIGS.items():
            pos = self.get_train_position(t_no)
            is_completed = (cfg.get("is_completed", False) or cfg.get("current_status_class") == "completed" or cfg.get("current_status_label") == "Arrived")
            is_not_started = not is_completed and (cfg.get("current_status_class") == "scheduled" or not cfg.get("is_started", True))
            curr_delay = cfg["base_delay_min"]
            stations = cfg["stations"]
            curr_idx = cfg["current_section_idx"]
            next_idx = min(len(stations) - 1, curr_idx + 1)
            next_stn = stations[next_idx]

            # Dynamic next_eta calculation:
            if is_completed:
                next_eta = stations[-1].get("act_arr", stations[-1]["sched_arr"])
                next_stn_name = "Terminated"
                why_eta = f"Arrived at {stations[-1]['name']} at {next_eta} IST. Journey completed."
            elif is_not_started:
                next_eta = stations[0]["sched_dep"]
                next_stn_name = next_stn["name"].replace(" Jn", "")
                why_eta = f"Scheduled to depart {cfg['origin']} at {next_eta} IST."
            else:
                next_eta = add_delay_to_time(next_stn["sched_arr"], curr_delay)
                next_stn_name = next_stn["name"].replace(" Jn", "")
                why_eta = self.ml_engine.generate_explanation(
                    train_no=t_no,
                    priority=1 if t_no == "22490" else (2 if t_no == "12951" else (3 if t_no == "12615" else 4)),
                    current_delay_min=curr_delay,
                    section_congestion=0.8 if t_no in ["22536", "12615"] else 0.2,
                    section_hist_avg=20.0,
                    weather_flag=0,
                    passenger_reports=3,
                    section_name=pos["current_section"],
                    predicted_delay=curr_delay
                )

            status_label = format_status_label(curr_delay, is_not_started, is_completed)
            status_class = format_status_class(curr_delay, is_not_started, is_completed)

            fleet.append({
                "train_no": t_no,
                "name": cfg["name"],
                "full_name": cfg["full_name"],
                "origin": cfg["origin"],
                "destination": cfg["destination"],
                "status_label": status_label,
                "status_class": status_class,
                "delay_min": curr_delay,
                "currently_near": cfg["current_near_station"],
                "next_station": next_stn_name,
                "next_eta": next_eta,
                "confidence_pct": cfg["confidence"],
                "speed_kmh": pos["speed_kmh"],
                "why_this_eta": why_eta,
                "updated_secs_ago": pos["last_updated_secs_ago"]
            })
        return fleet
