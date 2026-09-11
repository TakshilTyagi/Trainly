"""
dataset_generator.py - Historical Delay Dataset Generator for Trainly
Generates realistic historical delay records across the 4 tracked Indian Railways trains.
Differentiates between real baseline parameters and simulated variations.
"""

import json
import random
from datetime import datetime, timedelta

# Train definitions with stations and distances (km)
TRAINS_DATA = {
    "22490": {
        "name": "Vande Bharat Express",
        "origin": "Meerut City Jn",
        "destination": "Varanasi Jn",
        "priority": 1,  # Highest priority
        "base_delay_mean": 3.0,
        "base_delay_std": 4.0,
        "stations": [
            {"code": "MTC", "name": "Meerut City Jn", "km": 0, "sched_arr": "06:30", "sched_dep": "06:35", "lat": 28.9800, "lon": 77.7064},
            {"code": "HPU", "name": "Hapur Jn", "km": 37, "sched_arr": "07:08", "sched_dep": "07:10", "lat": 28.7306, "lon": 77.7759},
            {"code": "MB", "name": "Moradabad Jn", "km": 140, "sched_arr": "08:35", "sched_dep": "08:40", "lat": 28.8386, "lon": 78.7733},
            {"code": "BE", "name": "Bareilly Jn", "km": 230, "sched_arr": "09:56", "sched_dep": "09:58", "lat": 28.3670, "lon": 79.4304},
            {"code": "LKO", "name": "Lucknow Charbagh", "km": 465, "sched_arr": "13:40", "sched_dep": "13:50", "lat": 26.8324, "lon": 80.9230},
            {"code": "AY", "name": "Ayodhya Dham Jn", "km": 595, "sched_arr": "15:40", "sched_dep": "15:45", "lat": 26.7922, "lon": 82.1998},
            {"code": "BSB", "name": "Varanasi Jn", "km": 783, "sched_arr": "18:25", "sched_dep": "18:25", "lat": 25.3283, "lon": 82.9863}
        ]
    },
    "12951": {
        "name": "Mumbai Rajdhani",
        "origin": "Mumbai Central",
        "destination": "New Delhi",
        "priority": 2,
        "base_delay_mean": 12.0,
        "base_delay_std": 8.0,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "sched_arr": "17:00", "sched_dep": "17:00", "lat": 18.9696, "lon": 72.8194},
            {"code": "BVI", "name": "Borivali", "km": 30, "sched_arr": "17:22", "sched_dep": "17:24", "lat": 19.2288, "lon": 72.8575},
            {"code": "ST", "name": "Surat", "km": 263, "sched_arr": "19:43", "sched_dep": "19:48", "lat": 21.2049, "lon": 72.8407},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "sched_arr": "21:06", "sched_dep": "21:16", "lat": 22.3107, "lon": 73.1812},
            {"code": "RTM", "name": "Ratlam Jn", "km": 653, "sched_arr": "00:25", "sched_dep": "00:28", "lat": 23.3441, "lon": 75.0376},
            {"code": "KOTA", "name": "Kota Jn", "km": 920, "sched_arr": "03:15", "sched_dep": "03:20", "lat": 25.2235, "lon": 75.8648},
            {"code": "NDLS", "name": "New Delhi", "km": 1386, "sched_arr": "08:32", "sched_dep": "08:32", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12615": {
        "name": "Grand Trunk (GT) Express",
        "origin": "Chennai Central",
        "destination": "New Delhi",
        "priority": 3,
        "base_delay_mean": 30.0,
        "base_delay_std": 18.0,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "sched_arr": "18:50", "sched_dep": "18:50", "lat": 13.0827, "lon": 80.2707},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "sched_arr": "00:50", "sched_dep": "01:00", "lat": 16.5186, "lon": 80.6199},
            {"code": "WL", "name": "Warangal", "km": 638, "sched_arr": "03:48", "sched_dep": "03:50", "lat": 17.9689, "lon": 79.5941},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 881, "sched_arr": "07:35", "sched_dep": "07:40", "lat": 19.8547, "lon": 79.3524},
            {"code": "WR", "name": "Wardha Jn", "km": 960, "sched_arr": "09:08", "sched_dep": "09:10", "lat": 20.7453, "lon": 78.6022},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1039, "sched_arr": "11:25", "sched_dep": "11:30", "lat": 21.1524, "lon": 79.0888},
            {"code": "ET", "name": "Itarsi Jn", "km": 1337, "sched_arr": "16:40", "sched_dep": "16:50", "lat": 21.6111, "lon": 77.7554},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1429, "sched_arr": "18:40", "sched_dep": "18:45", "lat": 23.2599, "lon": 77.4126},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1721, "sched_arr": "22:50", "sched_dep": "22:55", "lat": 25.4484, "lon": 78.5685},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1819, "sched_arr": "23:55", "sched_dep": "23:57", "lat": 26.2183, "lon": 78.1828},
            {"code": "AGC", "name": "Agra Cantt", "km": 1937, "sched_arr": "01:48", "sched_dep": "01:53", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 2182, "sched_arr": "05:10", "sched_dep": "05:10", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "22536": {
        "name": "Manduadih–Rameswaram Express",
        "origin": "Manduadih (Banaras)",
        "destination": "Rameswaram",
        "priority": 4,  # Most prone to delays
        "base_delay_mean": 115.0,
        "base_delay_std": 50.0,
        "stations": [
            {"code": "BSBS", "name": "Banaras / Manduadih", "km": 0, "sched_arr": "20:00", "sched_dep": "20:00", "lat": 25.2974, "lon": 82.9664},
            {"code": "PCOI", "name": "Prayagraj Chheoki", "km": 125, "sched_arr": "22:40", "sched_dep": "22:45", "lat": 25.3854, "lon": 81.8687},
            {"code": "JBP", "name": "Jabalpur Jn", "km": 494, "sched_arr": "04:50", "sched_dep": "05:00", "lat": 23.1686, "lon": 79.9339},
            {"code": "ET", "name": "Itarsi Jn", "km": 738, "sched_arr": "08:50", "sched_dep": "09:00", "lat": 21.6111, "lon": 77.7554},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1036, "sched_arr": "13:25", "sched_dep": "13:30", "lat": 21.1524, "lon": 79.0888},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 1245, "sched_arr": "17:05", "sched_dep": "17:10", "lat": 19.8547, "lon": 79.3524},
            {"code": "WL", "name": "Warangal", "km": 1488, "sched_arr": "20:33", "sched_dep": "20:35", "lat": 17.9689, "lon": 79.5941},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1695, "sched_arr": "00:20", "sched_dep": "00:30", "lat": 16.5186, "lon": 80.6199},
            {"code": "OGL", "name": "Ongole", "km": 1834, "sched_arr": "02:28", "sched_dep": "02:30", "lat": 15.5057, "lon": 80.0499},
            {"code": "MS", "name": "Chennai Egmore", "km": 2126, "sched_arr": "08:10", "sched_dep": "08:25", "lat": 13.0784, "lon": 80.2606},
            {"code": "VM", "name": "Villupuram Jn", "km": 2285, "sched_arr": "10:50", "sched_dep": "10:55", "lat": 11.9398, "lon": 79.4975},
            {"code": "TPJ", "name": "Tiruchchirappalli Jn", "km": 2444, "sched_arr": "13:40", "sched_dep": "13:45", "lat": 10.7905, "lon": 78.6946},
            {"code": "MNM", "name": "Manamadurai Jn", "km": 2595, "sched_arr": "19:40", "sched_dep": "19:45", "lat": 9.6974, "lon": 78.4485},
            {"code": "RMD", "name": "Ramanathapuram", "km": 2675, "sched_arr": "20:38", "sched_dep": "20:40", "lat": 9.3639, "lon": 78.8395},
            {"code": "RMM", "name": "Rameswaram", "km": 2791, "sched_arr": "22:30", "sched_dep": "22:30", "lat": 9.2881, "lon": 79.3174}
        ]
    },
    "12625": {
        "name": "Kerala Superfast Express",
        "origin": "Thiruvananthapuram Central",
        "destination": "New Delhi",
        "priority": 3,
        "base_delay_mean": 20.0,
        "base_delay_std": 12.0,
        "stations": [
            {"code": "TVC", "name": "Thiruvananthapuram Central", "km": 0, "sched_arr": "12:30", "sched_dep": "12:30", "lat": 8.4870, "lon": 76.9525},
            {"code": "QLN", "name": "Kollam Jn", "km": 65, "sched_arr": "13:35", "sched_dep": "13:38", "lat": 8.8879, "lon": 76.6033},
            {"code": "KTYM", "name": "Kottayam", "km": 161, "sched_arr": "15:25", "sched_dep": "15:28", "lat": 9.5898, "lon": 76.5222},
            {"code": "ERN", "name": "Ernakulam Town", "km": 220, "sched_arr": "16:40", "sched_dep": "16:45", "lat": 9.9926, "lon": 76.2882},
            {"code": "TCR", "name": "Thrissur", "km": 292, "sched_arr": "17:47", "sched_dep": "17:50", "lat": 10.5186, "lon": 76.2110},
            {"code": "PGT", "name": "Palakkad Jn", "km": 367, "sched_arr": "19:12", "sched_dep": "19:15", "lat": 10.7867, "lon": 76.6548},
            {"code": "CBE", "name": "Coimbatore Jn", "km": 423, "sched_arr": "20:52", "sched_dep": "20:55", "lat": 11.0018, "lon": 76.9629},
            {"code": "ED", "name": "Erode Jn", "km": 524, "sched_arr": "22:20", "sched_dep": "22:25", "lat": 11.3410, "lon": 77.7172},
            {"code": "SA", "name": "Salem Jn", "km": 584, "sched_arr": "23:22", "sched_dep": "23:25", "lat": 11.6643, "lon": 78.1460},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1175, "sched_arr": "10:20", "sched_dep": "10:30", "lat": 16.5186, "lon": 80.6199},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1839, "sched_arr": "21:10", "sched_dep": "21:15", "lat": 21.1524, "lon": 79.0888},
            {"code": "BPL", "name": "Bhopal Jn", "km": 2228, "sched_arr": "03:45", "sched_dep": "03:55", "lat": 23.2599, "lon": 77.4126},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2618, "sched_arr": "09:05", "sched_dep": "09:07", "lat": 26.2183, "lon": 78.1828},
            {"code": "AGC", "name": "Agra Cantt", "km": 2736, "sched_arr": "10:50", "sched_dep": "10:55", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 3031, "sched_arr": "13:40", "sched_dep": "13:40", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12301": {
        "name": "Howrah Rajdhani Express",
        "origin": "Howrah Jn",
        "destination": "New Delhi",
        "priority": 1,
        "base_delay_mean": 6.0,
        "base_delay_std": 5.0,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "sched_arr": "16:50", "sched_dep": "16:50", "lat": 22.5839, "lon": 88.3426},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "sched_arr": "18:57", "sched_dep": "19:00", "lat": 23.6871, "lon": 86.9746},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 258, "sched_arr": "19:55", "sched_dep": "20:00", "lat": 23.7957, "lon": 86.4304},
            {"code": "PNME", "name": "Parasnath", "km": 306, "sched_arr": "20:40", "sched_dep": "20:42", "lat": 23.9554, "lon": 86.0827},
            {"code": "GAYA", "name": "Gaya Jn", "km": 458, "sched_arr": "22:31", "sched_dep": "22:34", "lat": 24.8037, "lon": 85.0064},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya Jn", "km": 663, "sched_arr": "00:45", "sched_dep": "00:55", "lat": 25.2818, "lon": 83.1235},
            {"code": "PRYJ", "name": "Prayagraj Jn", "km": 816, "sched_arr": "02:43", "sched_dep": "02:45", "lat": 25.4358, "lon": 81.8463},
            {"code": "CNB", "name": "Kanpur Central", "km": 1010, "sched_arr": "04:50", "sched_dep": "04:55", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 1451, "sched_arr": "10:05", "sched_dep": "10:05", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12002": {
        "name": "Bhopal Shatabdi Express",
        "origin": "New Delhi",
        "destination": "Rani Kamlapati (Bhopal)",
        "priority": 2,
        "base_delay_mean": 4.0,
        "base_delay_std": 4.0,
        "stations": [
            {"code": "NDLS", "name": "New Delhi", "km": 0, "sched_arr": "06:00", "sched_dep": "06:00", "lat": 28.6427, "lon": 77.2195},
            {"code": "MTJ", "name": "Mathura Jn", "km": 141, "sched_arr": "07:19", "sched_dep": "07:20", "lat": 27.4924, "lon": 77.6737},
            {"code": "AGC", "name": "Agra Cantt", "km": 195, "sched_arr": "07:50", "sched_dep": "07:55", "lat": 27.1591, "lon": 77.9902},
            {"code": "GWL", "name": "Gwalior Jn", "km": 313, "sched_arr": "09:23", "sched_dep": "09:28", "lat": 26.2183, "lon": 78.1828},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 410, "sched_arr": "10:45", "sched_dep": "10:50", "lat": 25.4484, "lon": 78.5685},
            {"code": "LAR", "name": "Lalitpur Jn", "km": 501, "sched_arr": "11:42", "sched_dep": "11:43", "lat": 24.6908, "lon": 78.4140},
            {"code": "BPL", "name": "Bhopal Jn", "km": 702, "sched_arr": "14:07", "sched_dep": "14:12", "lat": 23.2599, "lon": 77.4126},
            {"code": "RKMP", "name": "Rani Kamlapati", "km": 708, "sched_arr": "14:40", "sched_dep": "14:40", "lat": 23.2081, "lon": 77.4398}
        ]
    },
    "12723": {
        "name": "Telangana Express",
        "origin": "Hyderabad Deccan",
        "destination": "New Delhi",
        "priority": 2,
        "base_delay_mean": 8.0,
        "base_delay_std": 6.0,
        "stations": [
            {"code": "HYB", "name": "Hyderabad Deccan", "km": 0, "sched_arr": "06:00", "sched_dep": "06:00", "lat": 17.3916, "lon": 78.4674},
            {"code": "SC", "name": "Secunderabad Jn", "km": 9, "sched_arr": "06:20", "sched_dep": "06:25", "lat": 17.4344, "lon": 78.5016},
            {"code": "KZJ", "name": "Kazipet Jn", "km": 141, "sched_arr": "08:03", "sched_dep": "08:05", "lat": 17.9818, "lon": 79.5262},
            {"code": "RDM", "name": "Ramagundam", "km": 234, "sched_arr": "09:28", "sched_dep": "09:30", "lat": 18.7562, "lon": 79.5161},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 367, "sched_arr": "12:15", "sched_dep": "12:20", "lat": 19.8547, "lon": 79.3524},
            {"code": "NGP", "name": "Nagpur Jn", "km": 575, "sched_arr": "15:20", "sched_dep": "15:25", "lat": 21.1524, "lon": 79.0888},
            {"code": "BPL", "name": "Bhopal Jn", "km": 965, "sched_arr": "21:45", "sched_dep": "21:55", "lat": 23.2599, "lon": 77.4126},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1257, "sched_arr": "02:10", "sched_dep": "02:18", "lat": 25.4484, "lon": 78.5685},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1355, "sched_arr": "03:22", "sched_dep": "03:24", "lat": 26.2183, "lon": 78.1828},
            {"code": "AGC", "name": "Agra Cantt", "km": 1473, "sched_arr": "05:00", "sched_dep": "05:05", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 1670, "sched_arr": "07:40", "sched_dep": "07:40", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12839": {
        "name": "Howrah Chennai Mail",
        "origin": "Howrah Jn",
        "destination": "Chennai Central",
        "priority": 3,
        "base_delay_mean": 22.0,
        "base_delay_std": 14.0,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "sched_arr": "23:55", "sched_dep": "23:55", "lat": 22.5839, "lon": 88.3426},
            {"code": "KGP", "name": "Kharagpur Jn", "km": 115, "sched_arr": "01:35", "sched_dep": "01:40", "lat": 22.3302, "lon": 87.3237},
            {"code": "BLS", "name": "Baleshwar", "km": 231, "sched_arr": "03:08", "sched_dep": "03:13", "lat": 21.4934, "lon": 86.9317},
            {"code": "CTC", "name": "Cuttack Jn", "km": 409, "sched_arr": "05:40", "sched_dep": "05:45", "lat": 20.4632, "lon": 85.8943},
            {"code": "BBS", "name": "Bhubaneswar", "km": 437, "sched_arr": "06:20", "sched_dep": "06:25", "lat": 20.2666, "lon": 85.8436},
            {"code": "BAM", "name": "Brahmapur", "km": 584, "sched_arr": "08:50", "sched_dep": "08:55", "lat": 19.3150, "lon": 84.7941},
            {"code": "VSKP", "name": "Visakhapatnam", "km": 873, "sched_arr": "13:50", "sched_dep": "14:10", "lat": 17.7215, "lon": 83.2878},
            {"code": "RJY", "name": "Rajahmundry", "km": 1074, "sched_arr": "17:08", "sched_dep": "17:10", "lat": 17.0005, "lon": 81.7800},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1223, "sched_arr": "19:50", "sched_dep": "20:00", "lat": 16.5186, "lon": 80.6199},
            {"code": "NLR", "name": "Nellore", "km": 1478, "sched_arr": "23:28", "sched_dep": "23:30", "lat": 14.4426, "lon": 79.9865},
            {"code": "MAS", "name": "Chennai Central", "km": 1661, "sched_arr": "03:45", "sched_dep": "03:45", "lat": 13.0827, "lon": 80.2707}
        ]
    },
    "12903": {
        "name": "Golden Temple Mail",
        "origin": "Mumbai Central",
        "destination": "Amritsar Jn",
        "priority": 3,
        "base_delay_mean": 15.0,
        "base_delay_std": 10.0,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "sched_arr": "18:45", "sched_dep": "18:45", "lat": 18.9696, "lon": 72.8194},
            {"code": "BVI", "name": "Borivali", "km": 30, "sched_arr": "19:15", "sched_dep": "19:18", "lat": 19.2288, "lon": 72.8575},
            {"code": "ST", "name": "Surat", "km": 263, "sched_arr": "22:00", "sched_dep": "22:05", "lat": 21.2049, "lon": 72.8407},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "sched_arr": "23:34", "sched_dep": "23:44", "lat": 22.3107, "lon": 73.1812},
            {"code": "RTM", "name": "Ratlam Jn", "km": 653, "sched_arr": "03:15", "sched_dep": "03:25", "lat": 23.3441, "lon": 75.0376},
            {"code": "KOTA", "name": "Kota Jn", "km": 920, "sched_arr": "07:10", "sched_dep": "07:20", "lat": 25.2235, "lon": 75.8648},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 1378, "sched_arr": "13:50", "sched_dep": "14:05", "lat": 28.5884, "lon": 77.2534},
            {"code": "GZB", "name": "Ghaziabad Jn", "km": 1409, "sched_arr": "14:43", "sched_dep": "14:45", "lat": 28.6678, "lon": 77.4350},
            {"code": "UMB", "name": "Ambala Cantt", "km": 1639, "sched_arr": "19:05", "sched_dep": "19:10", "lat": 30.3610, "lon": 76.8185},
            {"code": "LDH", "name": "Ludhiana Jn", "km": 1753, "sched_arr": "20:43", "sched_dep": "20:53", "lat": 30.9120, "lon": 75.8538},
            {"code": "ASR", "name": "Amritsar Jn", "km": 1893, "sched_arr": "23:40", "sched_dep": "23:40", "lat": 31.6340, "lon": 74.8723}
        ]
    },
    "12137": {
        "name": "Punjab Mail",
        "origin": "Mumbai CSMT",
        "destination": "Firozpur Cantt",
        "priority": 3,
        "base_delay_mean": 28.0,
        "base_delay_std": 16.0,
        "stations": [
            {"code": "CSMT", "name": "Mumbai CSMT", "km": 0, "sched_arr": "19:35", "sched_dep": "19:35", "lat": 18.9400, "lon": 72.8354},
            {"code": "DR", "name": "Dadar", "km": 9, "sched_arr": "19:47", "sched_dep": "19:50", "lat": 19.0178, "lon": 72.8478},
            {"code": "KYN", "name": "Kalyan Jn", "km": 54, "sched_arr": "20:32", "sched_dep": "20:35", "lat": 19.2437, "lon": 73.1355},
            {"code": "NK", "name": "Nashik Road", "km": 188, "sched_arr": "23:35", "sched_dep": "23:40", "lat": 19.9975, "lon": 73.7898},
            {"code": "BSL", "name": "Bhusaval Jn", "km": 445, "sched_arr": "03:00", "sched_dep": "03:05", "lat": 21.0455, "lon": 75.8011},
            {"code": "ET", "name": "Itarsi Jn", "km": 751, "sched_arr": "08:00", "sched_dep": "08:10", "lat": 21.6111, "lon": 77.7554},
            {"code": "BPL", "name": "Bhopal Jn", "km": 843, "sched_arr": "09:45", "sched_dep": "09:50", "lat": 23.2599, "lon": 77.4126},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1232, "sched_arr": "15:26", "sched_dep": "15:28", "lat": 26.2183, "lon": 78.1828},
            {"code": "AGC", "name": "Agra Cantt", "km": 1350, "sched_arr": "17:50", "sched_dep": "17:55", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 1545, "sched_arr": "21:25", "sched_dep": "21:40", "lat": 28.6427, "lon": 77.2195},
            {"code": "BTI", "name": "Bhatinda Jn", "km": 1843, "sched_arr": "02:55", "sched_dep": "03:20", "lat": 30.2110, "lon": 74.9455},
            {"code": "FZR", "name": "Firozpur Cantt", "km": 1931, "sched_arr": "05:10", "sched_dep": "05:10", "lat": 30.9237, "lon": 74.6139}
        ]
    },
    "16031": {
        "name": "Andaman Express",
        "origin": "Chennai Central",
        "destination": "SMVD Katra",
        "priority": 4,
        "base_delay_mean": 50.0,
        "base_delay_std": 25.0,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "sched_arr": "05:15", "sched_dep": "05:15", "lat": 13.0827, "lon": 80.2707},
            {"code": "GDR", "name": "Gudur Jn", "km": 138, "sched_arr": "07:13", "sched_dep": "07:15", "lat": 14.1481, "lon": 79.8499},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "sched_arr": "11:55", "sched_dep": "12:05", "lat": 16.5186, "lon": 80.6199},
            {"code": "WL", "name": "Warangal", "km": 638, "sched_arr": "15:00", "sched_dep": "15:05", "lat": 17.9689, "lon": 79.5941},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1039, "sched_arr": "22:55", "sched_dep": "23:05", "lat": 21.1524, "lon": 79.0888},
            {"code": "ET", "name": "Itarsi Jn", "km": 1337, "sched_arr": "04:05", "sched_dep": "04:15", "lat": 21.6111, "lon": 77.7554},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1429, "sched_arr": "05:55", "sched_dep": "06:00", "lat": 23.2599, "lon": 77.4126},
            {"code": "VGLJ", "name": "VGL Jhansi Jn", "km": 1721, "sched_arr": "10:45", "sched_dep": "10:53", "lat": 25.4484, "lon": 78.5685},
            {"code": "AGC", "name": "Agra Cantt", "km": 1937, "sched_arr": "13:50", "sched_dep": "13:55", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 2132, "sched_arr": "18:10", "sched_dep": "18:25", "lat": 28.6427, "lon": 77.2195},
            {"code": "UMB", "name": "Ambala Cantt", "km": 2331, "sched_arr": "21:55", "sched_dep": "22:00", "lat": 30.3610, "lon": 76.8185},
            {"code": "JAT", "name": "Jammu Tawi", "km": 2708, "sched_arr": "06:15", "sched_dep": "06:25", "lat": 32.7060, "lon": 74.8795},
            {"code": "SVDK", "name": "SMVD Katra", "km": 2786, "sched_arr": "09:20", "sched_dep": "09:20", "lat": 32.9928, "lon": 74.9317}
        ]
    },
    "12801": {
        "name": "Purushottam Express",
        "origin": "Puri",
        "destination": "New Delhi",
        "priority": 2,
        "base_delay_mean": 14.0,
        "base_delay_std": 8.0,
        "stations": [
            {"code": "PURI", "name": "Puri", "km": 0, "sched_arr": "21:55", "sched_dep": "21:55", "lat": 19.8135, "lon": 85.8312},
            {"code": "BBS", "name": "Bhubaneswar", "km": 63, "sched_arr": "23:00", "sched_dep": "23:05", "lat": 20.2666, "lon": 85.8436},
            {"code": "CTC", "name": "Cuttack Jn", "km": 91, "sched_arr": "23:35", "sched_dep": "23:40", "lat": 20.4632, "lon": 85.8943},
            {"code": "BLS", "name": "Baleshwar", "km": 306, "sched_arr": "02:06", "sched_dep": "02:11", "lat": 21.4934, "lon": 86.9317},
            {"code": "TATA", "name": "Tatanagar Jn", "km": 481, "sched_arr": "06:12", "sched_dep": "06:22", "lat": 22.7712, "lon": 86.2029},
            {"code": "BKSC", "name": "Bokaro Steel City", "km": 568, "sched_arr": "08:45", "sched_dep": "08:50", "lat": 23.6693, "lon": 86.1511},
            {"code": "GAYA", "name": "Gaya Jn", "km": 749, "sched_arr": "12:35", "sched_dep": "12:40", "lat": 24.7964, "lon": 85.0080},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 954, "sched_arr": "15:30", "sched_dep": "15:40", "lat": 25.2818, "lon": 83.1205},
            {"code": "PRYJ", "name": "Prayagraj Jn", "km": 1107, "sched_arr": "18:30", "sched_dep": "18:35", "lat": 25.4358, "lon": 81.8463},
            {"code": "CNB", "name": "Kanpur Central", "km": 1301, "sched_arr": "21:10", "sched_dep": "21:15", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 1742, "sched_arr": "04:00", "sched_dep": "04:00", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12649": {
        "name": "Karnataka Sampark Kranti",
        "origin": "Yesvantpur Jn",
        "destination": "Hazrat Nizamuddin",
        "priority": 2,
        "base_delay_mean": 10.0,
        "base_delay_std": 6.0,
        "stations": [
            {"code": "YPR", "name": "Yesvantpur Jn", "km": 0, "sched_arr": "13:50", "sched_dep": "13:50", "lat": 13.0238, "lon": 77.5505},
            {"code": "ASK", "name": "Arsikere Jn", "km": 160, "sched_arr": "15:53", "sched_dep": "15:55", "lat": 13.3134, "lon": 76.2570},
            {"code": "DVG", "name": "Davangere", "km": 320, "sched_arr": "17:50", "sched_dep": "17:52", "lat": 14.4644, "lon": 75.9218},
            {"code": "UBL", "name": "Hubballi Jn", "km": 464, "sched_arr": "21:10", "sched_dep": "21:20", "lat": 15.3533, "lon": 75.1415},
            {"code": "KCG", "name": "Kacheguda", "km": 978, "sched_arr": "08:10", "sched_dep": "08:20", "lat": 17.3916, "lon": 78.5028},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1562, "sched_arr": "17:15", "sched_dep": "17:20", "lat": 21.1524, "lon": 79.0888},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1951, "sched_arr": "23:30", "sched_dep": "23:40", "lat": 23.2599, "lon": 77.4126},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2341, "sched_arr": "04:58", "sched_dep": "05:00", "lat": 26.2183, "lon": 78.1828},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2650, "sched_arr": "09:15", "sched_dep": "09:15", "lat": 28.5884, "lon": 77.2534}
        ]
    },
    "12267": {
        "name": "Mumbai Ahmedabad Duronto",
        "origin": "Mumbai Central",
        "destination": "Ahmedabad Jn",
        "priority": 1,
        "base_delay_mean": 3.0,
        "base_delay_std": 3.0,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "sched_arr": "23:25", "sched_dep": "23:25", "lat": 18.9696, "lon": 72.8194},
            {"code": "ST", "name": "Surat", "km": 263, "sched_arr": "03:22", "sched_dep": "03:27", "lat": 21.2049, "lon": 72.8407},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 493, "sched_arr": "05:55", "sched_dep": "05:55", "lat": 23.0225, "lon": 72.5714}
        ]
    },
    "22691": {
        "name": "Bengaluru Rajdhani",
        "origin": "KSR Bengaluru",
        "destination": "Hazrat Nizamuddin",
        "priority": 1,
        "base_delay_mean": 4.0,
        "base_delay_std": 3.0,
        "stations": [
            {"code": "SBC", "name": "KSR Bengaluru", "km": 0, "sched_arr": "20:00", "sched_dep": "20:00", "lat": 12.9784, "lon": 77.5694},
            {"code": "SSPN", "name": "Sai P Nilayam", "km": 169, "sched_arr": "22:48", "sched_dep": "22:50", "lat": 14.1526, "lon": 77.8080},
            {"code": "GTL", "name": "Guntakal Jn", "km": 335, "sched_arr": "01:30", "sched_dep": "01:35", "lat": 15.1744, "lon": 77.3712},
            {"code": "SC", "name": "Secunderabad Jn", "km": 648, "sched_arr": "07:05", "sched_dep": "07:15", "lat": 17.4344, "lon": 78.5016},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 1015, "sched_arr": "12:20", "sched_dep": "12:25", "lat": 19.8547, "lon": 79.3524},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1223, "sched_arr": "14:55", "sched_dep": "15:00", "lat": 21.1524, "lon": 79.0888},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1612, "sched_arr": "20:55", "sched_dep": "21:05", "lat": 23.2599, "lon": 77.4126},
            {"code": "GWL", "name": "Gwalior Jn", "km": 2002, "sched_arr": "01:50", "sched_dep": "01:52", "lat": 26.2183, "lon": 78.1828},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2311, "sched_arr": "05:30", "sched_dep": "05:30", "lat": 28.5884, "lon": 77.2534}
        ]
    },
    "12273": {
        "name": "Howrah NDLS Duronto",
        "origin": "Howrah Jn",
        "destination": "New Delhi",
        "priority": 1,
        "base_delay_mean": 6.0,
        "base_delay_std": 4.0,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "sched_arr": "08:35", "sched_dep": "08:35", "lat": 22.5839, "lon": 88.3426},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "sched_arr": "10:54", "sched_dep": "10:59", "lat": 23.6871, "lon": 86.9746},
            {"code": "JSME", "name": "Jasidih Jn", "km": 311, "sched_arr": "12:25", "sched_dep": "12:27", "lat": 24.5161, "lon": 86.6436},
            {"code": "PNBE", "name": "Patna Jn", "km": 532, "sched_arr": "16:30", "sched_dep": "16:40", "lat": 25.6022, "lon": 85.1376},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 744, "sched_arr": "19:40", "sched_dep": "19:50", "lat": 25.2818, "lon": 83.1205},
            {"code": "CNB", "name": "Kanpur Central", "km": 1091, "sched_arr": "23:45", "sched_dep": "23:50", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 1531, "sched_arr": "06:25", "sched_dep": "06:25", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12009": {
        "name": "Mumbai ADI Shatabdi",
        "origin": "Mumbai Central",
        "destination": "Ahmedabad Jn",
        "priority": 1,
        "base_delay_mean": 3.0,
        "base_delay_std": 3.0,
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "km": 0, "sched_arr": "06:20", "sched_dep": "06:20", "lat": 18.9696, "lon": 72.8194},
            {"code": "BVI", "name": "Borivali", "km": 30, "sched_arr": "06:43", "sched_dep": "06:45", "lat": 19.2288, "lon": 72.8575},
            {"code": "VAPI", "name": "Vapi", "km": 170, "sched_arr": "08:14", "sched_dep": "08:16", "lat": 20.3705, "lon": 72.9106},
            {"code": "ST", "name": "Surat", "km": 263, "sched_arr": "09:15", "sched_dep": "09:18", "lat": 21.2049, "lon": 72.8407},
            {"code": "BRC", "name": "Vadodara Jn", "km": 392, "sched_arr": "10:48", "sched_dep": "10:53", "lat": 22.3107, "lon": 73.1812},
            {"code": "ANND", "name": "Anand Jn", "km": 428, "sched_arr": "11:24", "sched_dep": "11:26", "lat": 22.5645, "lon": 72.9289},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 493, "sched_arr": "12:45", "sched_dep": "12:45", "lat": 23.0225, "lon": 72.5714}
        ]
    },
    "12431": {
        "name": "Trivandrum Rajdhani",
        "origin": "Thiruvananthapuram Central",
        "destination": "Hazrat Nizamuddin",
        "priority": 1,
        "base_delay_mean": 10.0,
        "base_delay_std": 6.0,
        "stations": [
            {"code": "TVC", "name": "Thiruvananthapuram Central", "km": 0, "sched_arr": "19:15", "sched_dep": "19:15", "lat": 8.4870, "lon": 76.9525},
            {"code": "ERS", "name": "Ernakulam Jn", "km": 206, "sched_arr": "22:30", "sched_dep": "22:35", "lat": 9.9674, "lon": 76.2996},
            {"code": "SRR", "name": "Shoranur Jn", "km": 313, "sched_arr": "00:45", "sched_dep": "00:50", "lat": 10.7627, "lon": 76.2764},
            {"code": "MAJN", "name": "Mangaluru Jn", "km": 620, "sched_arr": "05:20", "sched_dep": "05:25", "lat": 12.8698, "lon": 74.8732},
            {"code": "MAO", "name": "Madgaon", "km": 934, "sched_arr": "10:00", "sched_dep": "10:10", "lat": 15.2736, "lon": 73.9582},
            {"code": "PNVL", "name": "Panvel", "km": 1430, "sched_arr": "19:35", "sched_dep": "19:40", "lat": 18.9894, "lon": 73.1175},
            {"code": "ST", "name": "Surat", "km": 1708, "sched_arr": "23:51", "sched_dep": "23:56", "lat": 21.2049, "lon": 72.8407},
            {"code": "BRC", "name": "Vadodara Jn", "km": 1837, "sched_arr": "01:10", "sched_dep": "01:20", "lat": 22.3107, "lon": 73.1812},
            {"code": "KOTA", "name": "Kota Jn", "km": 2365, "sched_arr": "07:10", "sched_dep": "07:20", "lat": 25.2235, "lon": 75.8648},
            {"code": "NZM", "name": "Hazrat Nizamuddin", "km": 2823, "sched_arr": "12:30", "sched_dep": "12:30", "lat": 28.5884, "lon": 77.2534}
        ]
    },
    "12423": {
        "name": "Dibrugarh Rajdhani",
        "origin": "Dibrugarh",
        "destination": "New Delhi",
        "priority": 1,
        "base_delay_mean": 16.0,
        "base_delay_std": 9.0,
        "stations": [
            {"code": "DBRG", "name": "Dibrugarh", "km": 0, "sched_arr": "20:55", "sched_dep": "20:55", "lat": 27.4728, "lon": 94.9120},
            {"code": "DMV", "name": "Dimapur", "km": 208, "sched_arr": "01:05", "sched_dep": "01:12", "lat": 25.9060, "lon": 93.7270},
            {"code": "LMG", "name": "Lumding Jn", "km": 278, "sched_arr": "03:00", "sched_dep": "03:05", "lat": 25.7513, "lon": 93.1706},
            {"code": "GHY", "name": "Guwahati", "km": 459, "sched_arr": "06:30", "sched_dep": "06:45", "lat": 26.1833, "lon": 91.7533},
            {"code": "NJP", "name": "New Jalpaiguri", "km": 888, "sched_arr": "13:15", "sched_dep": "13:25", "lat": 26.6858, "lon": 88.4429},
            {"code": "KIR", "name": "Katihar Jn", "km": 1056, "sched_arr": "16:20", "sched_dep": "16:30", "lat": 25.5414, "lon": 87.5714},
            {"code": "BJU", "name": "Barauni Jn", "km": 1236, "sched_arr": "19:05", "sched_dep": "19:15", "lat": 25.4347, "lon": 86.0020},
            {"code": "PPTA", "name": "Patliputra", "km": 1344, "sched_arr": "21:40", "sched_dep": "21:50", "lat": 25.6154, "lon": 85.0888},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 1556, "sched_arr": "00:55", "sched_dep": "01:05", "lat": 25.2818, "lon": 83.1205},
            {"code": "CNB", "name": "Kanpur Central", "km": 1903, "sched_arr": "04:40", "sched_dep": "04:45", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 2343, "sched_arr": "10:30", "sched_dep": "10:30", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12621": {
        "name": "Tamil Nadu Express",
        "origin": "Chennai Central",
        "destination": "New Delhi",
        "priority": 2,
        "base_delay_mean": 7.0,
        "base_delay_std": 5.0,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "sched_arr": "22:00", "sched_dep": "22:00", "lat": 13.0827, "lon": 80.2707},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 431, "sched_arr": "03:55", "sched_dep": "04:05", "lat": 16.5186, "lon": 80.6199},
            {"code": "WL", "name": "Warangal", "km": 638, "sched_arr": "06:50", "sched_dep": "06:52", "lat": 17.9689, "lon": 79.5941},
            {"code": "BPQ", "name": "Balharshah Jn", "km": 881, "sched_arr": "10:35", "sched_dep": "10:40", "lat": 19.8547, "lon": 79.3524},
            {"code": "NGP", "name": "Nagpur Jn", "km": 1089, "sched_arr": "13:50", "sched_dep": "13:55", "lat": 21.1524, "lon": 79.0888},
            {"code": "ET", "name": "Itarsi Jn", "km": 1387, "sched_arr": "18:30", "sched_dep": "18:35", "lat": 21.6111, "lon": 77.7554},
            {"code": "BPL", "name": "Bhopal Jn", "km": 1479, "sched_arr": "20:10", "sched_dep": "20:20", "lat": 23.2599, "lon": 77.4126},
            {"code": "GWL", "name": "Gwalior Jn", "km": 1869, "sched_arr": "01:32", "sched_dep": "01:34", "lat": 26.2183, "lon": 78.1828},
            {"code": "AGC", "name": "Agra Cantt", "km": 1987, "sched_arr": "03:05", "sched_dep": "03:10", "lat": 27.1591, "lon": 77.9902},
            {"code": "NDLS", "name": "New Delhi", "km": 2182, "sched_arr": "06:30", "sched_dep": "06:30", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "12215": {
        "name": "DEE BDTS Garib Rath",
        "origin": "Delhi Sarai Rohilla",
        "destination": "Bandra Terminus",
        "priority": 2,
        "base_delay_mean": 8.0,
        "base_delay_std": 5.0,
        "stations": [
            {"code": "DEE", "name": "Delhi Sarai Rohilla", "km": 0, "sched_arr": "08:55", "sched_dep": "08:55", "lat": 28.6607, "lon": 77.1843},
            {"code": "GGN", "name": "Gurgaon", "km": 31, "sched_arr": "09:28", "sched_dep": "09:30", "lat": 28.4595, "lon": 77.0266},
            {"code": "JP", "name": "Jaipur", "km": 303, "sched_arr": "13:15", "sched_dep": "13:25", "lat": 26.9196, "lon": 75.7878},
            {"code": "AII", "name": "Ajmer Jn", "km": 438, "sched_arr": "15:40", "sched_dep": "15:55", "lat": 26.4499, "lon": 74.6399},
            {"code": "ABR", "name": "Abu Road", "km": 744, "sched_arr": "20:05", "sched_dep": "20:15", "lat": 24.4784, "lon": 72.7806},
            {"code": "ADI", "name": "Ahmedabad Jn", "km": 935, "sched_arr": "23:20", "sched_dep": "23:30", "lat": 23.0225, "lon": 72.5714},
            {"code": "ST", "name": "Surat", "km": 1165, "sched_arr": "02:47", "sched_dep": "02:52", "lat": 21.2049, "lon": 72.8407},
            {"code": "BDTS", "name": "Bandra Terminus", "km": 1431, "sched_arr": "07:35", "sched_dep": "07:35", "lat": 19.0544, "lon": 72.8402}
        ]
    },
    "12259": {
        "name": "Sealdah NDLS Duronto",
        "origin": "Sealdah",
        "destination": "New Delhi",
        "priority": 1,
        "base_delay_mean": 5.0,
        "base_delay_std": 4.0,
        "stations": [
            {"code": "SDAH", "name": "Sealdah", "km": 0, "sched_arr": "17:00", "sched_dep": "17:00", "lat": 22.5697, "lon": 88.3713},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 266, "sched_arr": "20:50", "sched_dep": "20:55", "lat": 23.7957, "lon": 86.4304},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 671, "sched_arr": "01:25", "sched_dep": "01:35", "lat": 25.2818, "lon": 83.1205},
            {"code": "CNB", "name": "Kanpur Central", "km": 1018, "sched_arr": "05:20", "sched_dep": "05:25", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 1458, "sched_arr": "11:00", "sched_dep": "11:00", "lat": 28.6427, "lon": 77.2195}
        ]
    },
    "20607": {
        "name": "Chennai Mysuru VB",
        "origin": "Chennai Central",
        "destination": "Mysuru Jn",
        "priority": 1,
        "base_delay_mean": 2.0,
        "base_delay_std": 2.0,
        "stations": [
            {"code": "MAS", "name": "Chennai Central", "km": 0, "sched_arr": "05:50", "sched_dep": "05:50", "lat": 13.0827, "lon": 80.2707},
            {"code": "KPD", "name": "Katpadi Jn", "km": 130, "sched_arr": "07:13", "sched_dep": "07:15", "lat": 12.9738, "lon": 79.1362},
            {"code": "KJM", "name": "Krishnarajapuram", "km": 342, "sched_arr": "09:08", "sched_dep": "09:10", "lat": 13.0003, "lon": 77.6836},
            {"code": "SBC", "name": "KSR Bengaluru", "km": 359, "sched_arr": "09:55", "sched_dep": "10:00", "lat": 12.9784, "lon": 77.5694},
            {"code": "MYS", "name": "Mysuru Jn", "km": 497, "sched_arr": "12:20", "sched_dep": "12:20", "lat": 12.3160, "lon": 76.6456}
        ]
    },
    "12019": {
        "name": "Howrah Ranchi Shatabdi",
        "origin": "Howrah Jn",
        "destination": "Ranchi Jn",
        "priority": 1,
        "base_delay_mean": 3.0,
        "base_delay_std": 3.0,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "sched_arr": "06:05", "sched_dep": "06:05", "lat": 22.5839, "lon": 88.3426},
            {"code": "DGR", "name": "Durgapur", "km": 171, "sched_arr": "07:48", "sched_dep": "07:50", "lat": 23.5204, "lon": 87.3119},
            {"code": "ASN", "name": "Asansol Jn", "km": 200, "sched_arr": "08:24", "sched_dep": "08:26", "lat": 23.6871, "lon": 86.9746},
            {"code": "DHN", "name": "Dhanbad Jn", "km": 258, "sched_arr": "09:23", "sched_dep": "09:28", "lat": 23.7957, "lon": 86.4304},
            {"code": "BKSC", "name": "Bokaro Steel City", "km": 308, "sched_arr": "10:55", "sched_dep": "11:00", "lat": 23.6693, "lon": 86.1511},
            {"code": "RNC", "name": "Ranchi Jn", "km": 421, "sched_arr": "13:15", "sched_dep": "13:15", "lat": 23.3441, "lon": 85.3096}
        ]
    },
    "12245": {
        "name": "Howrah YPR Duronto",
        "origin": "Howrah Jn",
        "destination": "Yesvantpur Jn",
        "priority": 1,
        "base_delay_mean": 9.0,
        "base_delay_std": 5.0,
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "km": 0, "sched_arr": "10:50", "sched_dep": "10:50", "lat": 22.5839, "lon": 88.3426},
            {"code": "BBS", "name": "Bhubaneswar", "km": 437, "sched_arr": "16:20", "sched_dep": "16:30", "lat": 20.2666, "lon": 85.8436},
            {"code": "VZM", "name": "Vizianagaram Jn", "km": 820, "sched_arr": "21:50", "sched_dep": "22:00", "lat": 18.1167, "lon": 83.4167},
            {"code": "BZA", "name": "Vijayawada Jn", "km": 1223, "sched_arr": "04:05", "sched_dep": "04:15", "lat": 16.5186, "lon": 80.6199},
            {"code": "RU", "name": "Renigunta Jn", "km": 1596, "sched_arr": "09:25", "sched_dep": "09:30", "lat": 13.6288, "lon": 79.5117},
            {"code": "YPR", "name": "Yesvantpur Jn", "km": 1947, "sched_arr": "15:50", "sched_dep": "15:50", "lat": 13.0238, "lon": 77.5505}
        ]
    },
    "12393": {
        "name": "Sampoorna Kranti Exp",
        "origin": "Rajendra Nagar Patna",
        "destination": "New Delhi",
        "priority": 2,
        "base_delay_mean": 5.0,
        "base_delay_std": 4.0,
        "stations": [
            {"code": "RJPB", "name": "Rajendra Nagar Patna", "km": 0, "sched_arr": "19:25", "sched_dep": "19:25", "lat": 25.5973, "lon": 85.1678},
            {"code": "PNBE", "name": "Patna Jn", "km": 3, "sched_arr": "19:35", "sched_dep": "19:45", "lat": 25.6022, "lon": 85.1376},
            {"code": "ARA", "name": "Ara Jn", "km": 52, "sched_arr": "20:20", "sched_dep": "20:22", "lat": 25.5560, "lon": 84.6603},
            {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "km": 214, "sched_arr": "22:20", "sched_dep": "22:30", "lat": 25.2818, "lon": 83.1205},
            {"code": "CNB", "name": "Kanpur Central", "km": 561, "sched_arr": "02:25", "sched_dep": "02:30", "lat": 26.4547, "lon": 80.3507},
            {"code": "NDLS", "name": "New Delhi", "km": 1001, "sched_arr": "07:55", "sched_dep": "07:55", "lat": 28.6427, "lon": 77.2195}
        ]
    }
}

def generate_historical_dataset(num_trips_per_train=120, output_path=None):
    """
    Generates training records.
    """
    import os
    if output_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(script_dir, "historical_delay_dataset.json")

    random.seed(42)

    records = []
    base_date = datetime(2026, 1, 1)

    for train_no, meta in TRAINS_DATA.items():
        stations = meta["stations"]
        num_stations = len(stations)

        for trip_idx in range(num_trips_per_train):
            trip_date = base_date + timedelta(days=trip_idx * (3 if train_no == "22536" else 1))
            day_of_week = trip_date.weekday()
            
            # Weather flag: 0: Clear (80%), 1: Fog (12%), 2: Rain (8%)
            weather_r = random.random()
            weather_flag = 1 if weather_r < 0.12 else (2 if weather_r < 0.20 else 0)
            
            trip_multiplier = max(0.2, random.gauss(1.0, 0.25))
            current_delay = max(0.0, random.gauss(meta["base_delay_mean"] * 0.5, meta["base_delay_std"] * 0.4))
            prev_delay = current_delay
            
            for curr_idx in range(num_stations - 1):
                curr_stn = stations[curr_idx]
                curr_km = curr_stn["km"]
                
                section_congestion = round(random.uniform(0.1, 0.95), 2)
                section_name = f"{curr_stn['name']}–{stations[curr_idx+1]['name']}"
                if any(b in section_name for b in ["Vijayawada", "Wardha", "Nagpur", "Ratlam", "Hapur"]):
                    section_congestion = min(1.0, section_congestion + 0.25)
                
                section_add = max(0.0, random.gauss(
                    meta["base_delay_mean"] / num_stations * trip_multiplier * (1 + section_congestion),
                    meta["base_delay_std"] / num_stations
                ))
                
                if weather_flag == 1:
                    section_add += random.uniform(5, 18)
                elif weather_flag == 2:
                    section_add += random.uniform(2, 8)
                    
                new_delay = current_delay + section_add
                delay_trend = new_delay - prev_delay
                prev_delay = current_delay
                current_delay = new_delay
                
                p_reports = 0
                if current_delay > 20:
                    p_reports = random.randint(1, int(current_delay // 10) + 3)
                
                hour_of_day = (int(curr_stn["sched_dep"].split(":")[0]) + int(current_delay // 60)) % 24

                for target_idx in range(curr_idx + 1, num_stations):
                    target_stn = stations[target_idx]
                    rem_dist = target_stn["km"] - curr_km
                    stops_ahead = target_idx - curr_idx
                    
                    section_hist_avg = round(meta["base_delay_mean"] * (stops_ahead / num_stations), 1)
                    buffer_recovery = (rem_dist / 100.0) * 1.5 if meta["priority"] <= 2 else (rem_dist / 100.0) * 0.5
                    baseline_delay_at_target = max(0.0, current_delay - buffer_recovery)
                    
                    compounding_noise = random.gauss(0, stops_ahead * (1.5 if meta["priority"] <= 2 else 5.0))
                    actual_delay_at_target = max(0.0, baseline_delay_at_target + (delay_trend * 0.4) + (section_congestion * 6.0) + (10.0 if weather_flag == 1 else 0.0) + compounding_noise)
                    
                    ml_correction_delta = round(float(actual_delay_at_target - baseline_delay_at_target), 2)
                    
                    record = {
                        "train_no": train_no,
                        "priority": meta["priority"],
                        "current_delay_min": round(float(current_delay), 1),
                        "delay_trend": round(float(delay_trend), 1),
                        "hour_of_day": hour_of_day,
                        "day_of_week": day_of_week,
                        "section_hist_avg": section_hist_avg,
                        "section_congestion": section_congestion,
                        "weather_flag": weather_flag,
                        "rem_dist_km": rem_dist,
                        "stops_ahead": stops_ahead,
                        "passenger_reports": p_reports,
                        "target_stn_code": target_stn["code"],
                        "baseline_delay": round(float(baseline_delay_at_target), 1),
                        "actual_delay": round(float(actual_delay_at_target), 1),
                        "ml_correction_delta": ml_correction_delta,
                        "is_simulated": True
                    }
                    records.append(record)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"Generated {len(records)} historical delay training records at {output_path}")
    return records

if __name__ == "__main__":
    generate_historical_dataset()
