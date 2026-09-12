"""
backend/services/transit_service.py - Multi-Modal Transit & Leave-By Service
Single source of truth for:
1. Calibrated drive time models (including Delhi-Meerut Expressway NE-3 corridor)
2. Live traffic integration (OSRM / Google Maps Directions if configured)
3. Leave-by time calculation (Departure - Drive Time - Safety Buffer)
4. Multi-modal transit routing (Metro, City Bus, Rapid Rail, Driving/Cab, Walking)
"""

import math
import os
import urllib.request
import json
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("trainly.transit")

# Safety buffer for station arrival (baggage check, platform navigation, boarding)
DEFAULT_BUFFER_MINUTES = 15

# Known city / station hub coordinates for entity grounding in natural language queries
KNOWN_LOCATIONS = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6427, 77.2195),
    "ndls": (28.6427, 77.2195),
    "old delhi": (28.6609, 77.2307),
    "dli": (28.6609, 77.2307),
    "nizamuddin": (28.5888, 77.2533),
    "nzm": (28.5888, 77.2533),
    "anand vihar": (28.6508, 77.3152),
    "anvt": (28.6508, 77.3152),
    "noida": (28.5355, 77.3910),
    "gurugram": (28.4595, 77.0266),
    "gurgaon": (28.4595, 77.0266),
    "meerut": (28.9800, 77.7064),
    "meerut city": (28.9800, 77.7064),
    "mtc": (28.9800, 77.7064),
    "hapur": (28.7306, 77.7759),
    "hpu": (28.7306, 77.7759),
    "ghaziabad": (28.6692, 77.4538),
    "gzb": (28.6692, 77.4538),
    "moradabad": (28.8386, 78.7733),
    "mb": (28.8386, 78.7733),
    "bareilly": (28.3670, 79.4304),
    "be": (28.3670, 79.4304),
    "lucknow": (26.8324, 80.9230),
    "charbagh": (26.8324, 80.9230),
    "lko": (26.8324, 80.9230),
    "kanpur": (26.4499, 80.3319),
    "cnb": (26.4499, 80.3319),
    "varanasi": (25.3283, 82.9863),
    "banaras": (25.2974, 82.9664),
    "bsb": (25.3283, 82.9863),
    "bsbs": (25.2974, 82.9664),
    "mumbai": (18.9696, 72.8194),
    "mumbai central": (18.9696, 72.8194),
    "mmct": (18.9696, 72.8194),
    "borivali": (19.2288, 72.8575),
    "bvi": (19.2288, 72.8575),
    "chennai": (13.0827, 80.2707),
    "chennai central": (13.0827, 80.2707),
    "mas": (13.0827, 80.2707),
    "chennai egmore": (13.0784, 80.2606),
    "ms": (13.0784, 80.2606),
    "kolkata": (22.5850, 88.3426),
    "howrah": (22.5850, 88.3426),
    "hwh": (22.5850, 88.3426),
    "sealdah": (22.5670, 88.3713),
    "sdah": (22.5670, 88.3713),
    "bhopal": (23.2599, 77.4126),
    "bpl": (23.2599, 77.4126),
    "nagpur": (21.1524, 79.0888),
    "ngp": (21.1524, 79.0888),
    "agra": (27.1591, 77.9902),
    "agc": (27.1591, 77.9902),
    "kota": (25.2235, 75.8648),
    "vadodara": (22.3107, 73.1812),
    "surat": (21.2049, 72.8407),
    "rameswaram": (9.2881, 79.3174),
    "rmm": (9.2881, 79.3174)
}

def resolve_location_from_query(query: str) -> Optional[Tuple[float, float, str]]:
    """Extracts known location/city from user query text if present."""
    q = query.lower()
    for name, coords in KNOWN_LOCATIONS.items():
        if f"from {name}" in q or f"at {name}" in q or f"in {name}" in q or f"near {name}" in q or f"to {name}" in q:
            return coords[0], coords[1], name.title()
        elif f" {name} " in f" {q} ":
            return coords[0], coords[1], name.title()
    return None

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_calibrated_drive_time(dist_km: float, condition: str = "Moderate") -> int:
    """
    Exact mirror of the calibrated drive-time model from LeaveHomeByBanner.
    Accounts for specific corridors (Delhi-Meerut Expressway NE-3), urban congestion,
    suburban arterials, and highways.
    """
    if dist_km <= 0:
        return 5

    # Specific high-precision calibration for Delhi-Meerut Expressway (NE-3) corridor:
    if 35 <= dist_km <= 75:
        if condition == "Light":
            return round(40 + ((dist_km - 35) / 40) * 12)  # ~46 min for 55 km
        elif condition == "Moderate":
            return round(46 + ((dist_km - 35) / 40) * 14)  # ~53 min for 55 km
        else:
            return round(56 + ((dist_km - 35) / 40) * 15)  # ~64 min for 55 km

    # Short intra-city trips (< 15 km): City traffic
    if dist_km < 15:
        speed = 18 if condition == "Heavy" else (28 if condition == "Light" else 24)
        return max(5, round((dist_km / speed) * 60))

    # Suburban/arterial trips (15 to 35 km)
    if dist_km < 35:
        speed = 30 if condition == "Heavy" else (45 if condition == "Light" else 38)
        return max(15, round((dist_km / speed) * 60))

    # Intercity highway (75 to 150 km)
    if dist_km <= 150:
        speed = 48 if condition == "Heavy" else (72 if condition == "Light" else 60)
        return round((dist_km / speed) * 60)

    # Long distance (> 150 km)
    speed = 55 if condition == "Heavy" else (80 if condition == "Light" else 68)
    return round((dist_km / speed) * 60)

def get_live_drive_time(lat1: float, lon1: float, lat2: float, lon2: float, dist_km: float) -> Dict[str, Any]:
    """
    Attempts live OSRM routing with tight timeout and physical sanity bounds.
    Falls back reliably to calibrated drive-time if offline, rate-limited, or anomalous.
    """
    is_dme_corridor = 35 <= dist_km <= 75

    # Fast external fetch attempt with 1.5s timeout
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        req = urllib.request.Request(url, headers={"User-Agent": "Trainly/1.0 (transit-agent)"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                duration_sec = float(route.get("duration", 0))
                road_dist_m = float(route.get("distance", 0))
                road_dist_km = (road_dist_m / 1000.0) if road_dist_m > 0 else dist_km

                raw_min = round(duration_sec / 60)
                dur_hr = duration_sec / 3600.0
                implied_speed = (road_dist_km / dur_hr) if dur_hr > 0 else 0

                # Corridor sanity guards
                is_anomaly = (
                    duration_sec <= 0 or
                    implied_speed < (42 if is_dme_corridor else 18) or
                    implied_speed > 140 or
                    (is_dme_corridor and (raw_min > 72 or raw_min < 35)) or
                    (road_dist_km < 100 and raw_min > 85)
                )

                if not is_anomaly:
                    traffic = "Heavy" if implied_speed < (55 if is_dme_corridor else 32) else (
                        "Moderate" if implied_speed < (75 if is_dme_corridor else 48) else "Light"
                    )
                    return {
                        "drive_time_min": raw_min,
                        "road_distance_km": round(road_dist_km, 1),
                        "traffic_condition": traffic,
                        "source": "OSRM Live"
                    }
    except Exception as e:
        logger.debug(f"[TransitService] OSRM live routing skipped ({e}), using calibrated corridor model")

    # High-precision calibrated model
    traffic = "Moderate"
    calibrated_min = calculate_calibrated_drive_time(dist_km, traffic)
    return {
        "drive_time_min": calibrated_min,
        "road_distance_km": round(dist_km * 1.15, 1),
        "traffic_condition": traffic,
        "source": "Calibrated Model"
    }

def calculate_leave_by_time(departure_time_str: str, drive_time_min: int, buffer_min: int = DEFAULT_BUFFER_MINUTES) -> Dict[str, Any]:
    """
    Computes exact leave-by time (Departure - Drive Time - Safety Buffer).
    Handles HH:MM formatting, negative minute wrap-around, and 12h AM/PM output.
    """
    try:
        parts = departure_time_str.strip().split(":")
        hours = int(parts[0])
        mins = int(parts[1])
    except Exception:
        hours, mins = 8, 0

    total_subtract = drive_time_min + buffer_min
    mins -= total_subtract

    while mins < 0:
        mins += 60
        hours -= 1
    while hours < 0:
        hours += 24

    ampm = "PM" if hours >= 12 else "AM"
    disp_hours = hours % 12
    if disp_hours == 0:
        disp_hours = 12
    disp_mins = f"{mins:02d}"

    formatted_12h = f"{disp_hours}:{disp_mins} {ampm}"
    formatted_24h = f"{hours:02d}:{disp_mins}"

    return {
        "leave_by_12h": formatted_12h,
        "leave_by_24h": formatted_24h,
        "departure_time": departure_time_str,
        "drive_time_min": drive_time_min,
        "buffer_min": buffer_min,
        "total_lead_time_min": total_subtract
    }

# Grounded Metropolitan Public Transit Directory for Indian Rail Terminals
METROPOLITAN_TRANSIT_NETWORKS = {
    # Delhi NCR Rail Hubs
    "NDLS": {
        "city": "Delhi NCR",
        "has_metro": True,
        "metro_line": "Delhi Metro Yellow Line & Airport Express (Orange Line)",
        "metro_station": "New Delhi Metro Station (direct underground concourse connects to Ajmeri Gate side of NDLS)",
        "metro_headway_min": "4-6 mins",
        "metro_speed_kmh": 34,
        "has_bus": True,
        "bus_service": "DTC City Buses (Routes 73, 181, 729, 901) & DTC Railway Station Special Feeder",
        "rapid_rail": None,
        "summary": "Take DMRC Yellow Line or Airport Express directly to New Delhi Metro Station (Exit Gate 1/2 for NDLS Ajmeri Gate)."
    },
    "DLI": {
        "city": "Delhi NCR",
        "has_metro": True,
        "metro_line": "Delhi Metro Yellow Line",
        "metro_station": "Chandni Chowk Metro Station (dedicated pedestrian subway to DLI main concourse)",
        "metro_headway_min": "4-6 mins",
        "metro_speed_kmh": 32,
        "has_bus": True,
        "bus_service": "DTC Routes 100, 115, 212, and Mori Gate Terminal Feeder",
        "rapid_rail": None,
        "summary": "Board Yellow Line to Chandni Chowk; take the connected pedestrian subway directly to Old Delhi Station."
    },
    "NZM": {
        "city": "Delhi NCR",
        "has_metro": True,
        "metro_line": "Delhi Metro Pink Line",
        "metro_station": "Hazrat Nizamuddin Metro Station (connected by dedicated 200m covered travelator walkway to PF 1/8)",
        "metro_headway_min": "5-7 mins",
        "metro_speed_kmh": 34,
        "has_bus": True,
        "bus_service": "DTC Ring Road Buses & Sarai Kale Khan ISBT Feeder routes",
        "rapid_rail": "Sarai Kale Khan - Delhi-Meerut RRTS Terminal (adjacent)",
        "summary": "Take Pink Line to Hazrat Nizamuddin Metro; follow the covered travelator walkway directly to platform 1."
    },
    "ANVT": {
        "city": "Delhi NCR",
        "has_metro": True,
        "metro_line": "Delhi Metro Blue Line (Branch) & Pink Line",
        "metro_station": "Anand Vihar ISBT Metro Station (interchange directly inside railway concourse)",
        "metro_headway_min": "4-5 mins",
        "metro_speed_kmh": 35,
        "has_bus": True,
        "bus_service": "Anand Vihar ISBT Bus Hub — DTC & UPSRTC Express city routes",
        "rapid_rail": "Delhi-Meerut RRTS (Namo Bharat) Anand Vihar Station",
        "summary": "Use Blue Line or Pink Line to Anand Vihar ISBT Metro Station, with direct escalator access to railway platforms."
    },
    "MTC": {
        "city": "Meerut / NCR",
        "has_metro": True,
        "metro_line": "Delhi-Meerut RRTS / Namo Bharat Rapid Rail & Meerut City Metro",
        "metro_station": "Meerut Central / Begumpul RRTS Station (~2.5 km via city e-bus or auto to Meerut City Jn)",
        "metro_headway_min": "10-15 mins",
        "metro_speed_kmh": 70,
        "has_bus": True,
        "bus_service": "UPSRTC Meerut City E-Bus service (Delhi Road corridor) & feeder shuttles",
        "rapid_rail": "Namo Bharat Rapid Rail (Meerut South / Begumpul to Anand Vihar/Delhi in ~55 mins)",
        "summary": "Take Namo Bharat Rapid Rail (RRTS) or UPSRTC City E-Bus along Delhi Road; transfer via 5-min auto to MTC station."
    },
    "GZB": {
        "city": "Ghaziabad / NCR",
        "has_metro": True,
        "metro_line": "Delhi Metro Red Line",
        "metro_station": "Shaheed Sthal (New Bus Adda) Metro (~3.2 km via e-rickshaw or DTC/UPSRTC feeder)",
        "metro_headway_min": "5-8 mins",
        "metro_speed_kmh": 33,
        "has_bus": True,
        "bus_service": "UPSRTC City Feeder & Ghaziabad City E-Buses",
        "rapid_rail": "Ghaziabad RRTS Junction station",
        "summary": "Take Red Line to Shaheed Sthal (New Bus Adda), then a quick 8-min shared auto/e-rickshaw to Ghaziabad Jn."
    },
    # Mumbai Rail Hubs
    "MMCT": {
        "city": "Mumbai MMR",
        "has_metro": True,
        "metro_line": "Mumbai Metro Line 3 (Aqua Line) & Western Railway Suburban Local",
        "metro_station": "Mumbai Central Metro Station & Mumbai Central Suburban Station",
        "metro_headway_min": "3-5 mins",
        "metro_speed_kmh": 35,
        "has_bus": True,
        "bus_service": "BEST Bus Routes 33, 37, 63, 66, 124 to Mumbai Central Station Depot",
        "rapid_rail": "Western Suburban Local Trains (Churchgate ⇄ Dahanu Road)",
        "summary": "Take Western Railway Suburban train or Metro Line 3 (Aqua Line) directly to Mumbai Central."
    },
    "BVI": {
        "city": "Mumbai MMR",
        "has_metro": True,
        "metro_line": "Mumbai Metro Line 2A (Yellow Line) & Line 7 (Red Line) + Suburban Western Line",
        "metro_station": "Borivali West Metro Station / Borivali Suburban Local Station",
        "metro_headway_min": "4-6 mins",
        "metro_speed_kmh": 34,
        "has_bus": True,
        "bus_service": "BEST Bus Services (203, 204, 205, 297)",
        "rapid_rail": "Western Railway Local Suburban Network",
        "summary": "Use Western Line local trains or Metro Line 2A to Borivali, with direct skywalk connection."
    },
    # Chennai Rail Hubs
    "MAS": {
        "city": "Chennai",
        "has_metro": True,
        "metro_line": "Chennai Metro Blue Line & Green Line (Interchange)",
        "metro_station": "Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro Station",
        "metro_headway_min": "5-7 mins",
        "metro_speed_kmh": 33,
        "has_bus": True,
        "bus_service": "MTC Chennai Central Bus Terminus (Routes 11G, 17D, 27B, 54, 70V)",
        "rapid_rail": "Chennai Suburban Railway & MRTS from Moore Market Complex",
        "summary": "Board Chennai Metro Blue or Green Line to Central Metro Station; direct pedestrian tunnel leads into MAS concourse."
    },
    "MS": {
        "city": "Chennai",
        "has_metro": True,
        "metro_line": "Chennai Metro Green Line & Chennai Suburban South Line",
        "metro_station": "Chennai Egmore Metro Station",
        "metro_headway_min": "5-8 mins",
        "metro_speed_kmh": 32,
        "has_bus": True,
        "bus_service": "MTC City Bus routes (23C, 27D, 29A)",
        "rapid_rail": "Chennai Suburban South Line (Beach ⇄ Tambaram ⇄ Chengalpattu)",
        "summary": "Take Green Line to Egmore Metro Station, located directly adjacent to railway station platform 1 entrance."
    },
    # Kolkata Rail Hubs
    "HWH": {
        "city": "Kolkata",
        "has_metro": True,
        "metro_line": "Kolkata Metro Green Line (Underwater East-West Corridor)",
        "metro_station": "Howrah Metro Station (India's deepest metro station, directly beneath Howrah Station concourse)",
        "metro_headway_min": "6-10 mins",
        "metro_speed_kmh": 38,
        "has_bus": True,
        "bus_service": "Howrah Bus Terminus — West Bengal Transport Corporation (WBTC) extensive bus network",
        "rapid_rail": "Howrah Ferry Service across Hooghly & Suburban Eastern Railway network",
        "summary": "Board Kolkata Metro Green Line directly to Howrah Metro Station with escalator access to platforms 1-23."
    },
    "SDAH": {
        "city": "Kolkata",
        "has_metro": True,
        "metro_line": "Kolkata Metro Green Line",
        "metro_station": "Sealdah Metro Station (integrated with Sealdah main railway concourse)",
        "metro_headway_min": "6-10 mins",
        "metro_speed_kmh": 35,
        "has_bus": True,
        "bus_service": "WBTC City Buses connecting Sealdah Station across Kolkata",
        "rapid_rail": "Sealdah Main & South Suburban Rail Network",
        "summary": "Take Green Line to Sealdah Metro Station; direct internal passage connects to suburban and express platforms."
    },
    # Lucknow Rail Hub
    "LKO": {
        "city": "Lucknow",
        "has_metro": True,
        "metro_line": "Lucknow Metro Red Line (North-South Corridor: CCS Airport ⇄ Munshipulia)",
        "metro_station": "Charbagh Metro Station (elevated station directly facing Lucknow Charbagh Railway Terminal)",
        "metro_headway_min": "5-8 mins",
        "metro_speed_kmh": 34,
        "has_bus": True,
        "bus_service": "Lucknow City Transport E-Bus Network from Charbagh Bus Terminal",
        "rapid_rail": None,
        "summary": "Board Lucknow Metro Red Line to Charbagh Metro Station; 2-minute foot walk across the portico into the terminal."
    },
    # Kanpur Rail Hub
    "CNB": {
        "city": "Kanpur",
        "has_metro": True,
        "metro_line": "Kanpur Metro Orange Line",
        "metro_station": "Kanpur Central Metro Station",
        "metro_headway_min": "7-10 mins",
        "metro_speed_kmh": 32,
        "has_bus": True,
        "bus_service": "UPSRTC City E-Bus services connecting Ghantaghar and Central Station",
        "rapid_rail": None,
        "summary": "Take Kanpur Metro Orange Line directly to Kanpur Central Metro Station."
    }
}

def get_multimodal_transit_options(
    user_lat: float,
    user_lon: float,
    station_lat: float,
    station_lon: float,
    station_name: str,
    station_code: str
) -> Dict[str, Any]:
    """
    Retrieves complete multi-modal travel options (Metro, Bus, Rapid Rail, Driving/Cab, Walking)
    between user location and target railway station.
    Provides route summaries, estimated travel times, and graceful fallbacks for rural/non-metro areas.
    """
    stn_code_upper = (station_code or "").upper().strip()
    direct_dist_km = calculate_haversine(user_lat, user_lon, station_lat, station_lon)

    # 1. Driving / Cab option (always computed via calibrated + live model)
    drive_info = get_live_drive_time(user_lat, user_lon, station_lat, station_lon, direct_dist_km)
    drive_min = drive_info["drive_time_min"]
    traffic = drive_info["traffic_condition"]
    road_km = drive_info["road_distance_km"]

    options = {
        "station_name": station_name,
        "station_code": stn_code_upper,
        "straight_line_dist_km": direct_dist_km,
        "road_dist_km": road_km,
        "transit_available": False,
        "modes": []
    }

    # Driving / Cab mode
    driving_mode = {
        "mode": "driving",
        "label": "Drive / Cab / Auto",
        "travel_time_min": drive_min,
        "traffic_condition": traffic,
        "route_summary": f"Drive or Taxi (Ola/Uber/Auto-rickshaw) via primary road network (~{road_km} km, {traffic} traffic).",
        "available": True
    }
    options["modes"].append(driving_mode)

    # Walking mode (if distance <= 2.5 km)
    if direct_dist_km <= 2.5:
        walk_min = max(3, round((direct_dist_km / 4.5) * 60))
        walking_mode = {
            "mode": "walking",
            "label": "Walking",
            "travel_time_min": walk_min,
            "route_summary": f"Direct walking distance: {round(direct_dist_km, 1)} km (~{walk_min} mins at normal pedestrian pace).",
            "available": True
        }
        options["modes"].append(walking_mode)

    # 2. Check if Google Maps Directions API is available via environment key
    gmaps_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if gmaps_key:
        try:
            gmaps_url = (
                f"https://maps.googleapis.com/maps/api/directions/json?"
                f"origin={user_lat},{user_lon}&destination={station_lat},{station_lon}"
                f"&mode=transit&key={gmaps_key}"
            )
            req = urllib.request.Request(gmaps_url)
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                gdata = json.loads(resp.read().decode("utf-8"))
                if gdata.get("status") == "OK" and gdata.get("routes"):
                    g_route = gdata["routes"][0]["legs"][0]
                    g_duration_min = round(g_route["duration"]["value"] / 60)
                    g_steps = g_route.get("steps", [])
                    transit_step_summaries = []
                    for step in g_steps:
                        if step.get("travel_mode") == "TRANSIT":
                            details = step.get("transit_details", {})
                            line = details.get("line", {}).get("short_name") or details.get("line", {}).get("name", "Transit")
                            vehicle = details.get("line", {}).get("vehicle", {}).get("type", "Transit").title()
                            dep_stop = details.get("departure_stop", {}).get("name", "Origin Stop")
                            arr_stop = details.get("arrival_stop", {}).get("name", "Station Stop")
                            transit_step_summaries.append(f"Take {vehicle} ({line}) from {dep_stop} to {arr_stop}")

                    summary_text = "; ".join(transit_step_summaries) if transit_step_summaries else g_route.get("summary", "Transit route")
                    options["transit_available"] = True
                    options["modes"].append({
                        "mode": "transit",
                        "label": "Public Transit (Google Maps)",
                        "travel_time_min": g_duration_min,
                        "route_summary": summary_text,
                        "available": True
                    })
                    return options
        except Exception as e:
            logger.debug(f"[TransitService] Google Maps transit query skipped ({e})")

    # 3. Grounded Metropolitan Transit Directory
    transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get(stn_code_upper)

    if not transit_profile:
        delhi_dist = calculate_haversine(station_lat, station_lon, 28.6139, 77.2090)
        if delhi_dist < 40 and "delhi" in station_name.lower():
            transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get("NDLS")
        elif "mumbai" in station_name.lower():
            transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get("MMCT")
        elif "chennai" in station_name.lower():
            transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get("MAS")
        elif "howrah" in station_name.lower() or "kolkata" in station_name.lower():
            transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get("HWH")
        elif "lucknow" in station_name.lower():
            transit_profile = METROPOLITAN_TRANSIT_NETWORKS.get("LKO")

    if transit_profile and direct_dist_km <= 75:
        options["transit_available"] = True

        # Metro option
        if transit_profile.get("has_metro"):
            metro_spd = transit_profile.get("metro_speed_kmh", 34)
            metro_travel_min = max(10, round(6 + (direct_dist_km / metro_spd) * 60))
            options["modes"].append({
                "mode": "metro",
                "label": "Metro Transit",
                "travel_time_min": metro_travel_min,
                "line_name": transit_profile["metro_line"],
                "metro_station": transit_profile["metro_station"],
                "frequency": transit_profile["metro_headway_min"],
                "route_summary": f"Take {transit_profile['metro_line']} to {transit_profile['metro_station']}. Frequent service ({transit_profile['metro_headway_min']}).",
                "available": True
            })

        # Rapid Rail (RRTS) option if applicable
        if transit_profile.get("rapid_rail"):
            rrts_spd = 70
            rrts_min = max(15, round(8 + (direct_dist_km / rrts_spd) * 60))
            options["modes"].append({
                "mode": "rapid_rail",
                "label": "Rapid Rail (RRTS / Suburban)",
                "travel_time_min": rrts_min,
                "route_summary": f"{transit_profile['rapid_rail']} corridor link to station (~{rrts_min} mins).",
                "available": True
            })

        # City Bus option
        if transit_profile.get("has_bus"):
            bus_spd = 18
            bus_travel_min = max(18, round(10 + (direct_dist_km / bus_spd) * 60))
            options["modes"].append({
                "mode": "bus",
                "label": "City Bus",
                "travel_time_min": bus_travel_min,
                "route_summary": f"{transit_profile['bus_service']}. Runs frequently connecting major city corridors.",
                "available": True
            })

        options["recommended_transit_summary"] = transit_profile["summary"]
    else:
        # Non-metro / Rural / Semi-Urban Station Graceful Handling
        options["transit_available"] = False
        options["non_transit_note"] = (
            f"Direct rapid metro or organized city transit is not available for {station_name}. "
            f"Road transport (Auto-rickshaw, Cab, or local feeder bus) is the primary available mode "
            f"(approx. {drive_min} mins drive, {road_km} km)."
        )

    return options
