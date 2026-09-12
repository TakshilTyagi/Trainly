"""
routes/trains.py - Train Telemetry, Journey & ETA Endpoints
"""

import json
import math
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.providers.live_ntes import get_data_provider

logger = logging.getLogger("trainly.trains")

router = APIRouter(prefix="/api", tags=["Trains"])

@router.get("/fleet")
def get_fleet(status: str | None = None):
    """Returns summary status, next stop, delay and confidence for all tracked trains, with optional status filter."""
    provider = get_data_provider()
    fleet = provider.get_fleet_summary()
    if not status or status.lower() in ["all", "any"]:
        return fleet

    s = status.lower().strip()
    if s in ["arrived", "completed"]:
        return [
            t for t in fleet
            if t.get("status_label", "").lower() == "arrived"
            or t.get("status_class") == "completed"
            or t.get("next_station", "").lower() == "terminated"
        ]
    elif s in ["not_departed", "not_started", "scheduled"]:
        return [
            t for t in fleet
            if t.get("status_label", "").lower() == "scheduled"
            or t.get("status_class") == "scheduled"
        ]
    elif s in ["on_time", "ontime"]:
        return [
            t for t in fleet
            if t.get("status_label", "").lower() not in ["arrived", "scheduled"]
            and t.get("status_class") not in ["completed", "scheduled"]
            and (
                "on time" in t.get("status_label", "").lower()
                or t.get("status_class") == "ontime"
                or t.get("delay_min", 0.0) <= 5.0
            )
        ]
    elif s in ["delayed", "delay"]:
        return [
            t for t in fleet
            if t.get("status_label", "").lower() not in ["arrived", "scheduled"]
            and t.get("status_class") not in ["completed", "scheduled"]
            and (
                t.get("delay_min", 0.0) > 5.0
                or "+" in t.get("status_label", "")
                or "delayed" in t.get("status_class", "")
            )
        ]
    return fleet

@router.get("/train/{train_no}/position")
def get_position(train_no: str):
    """Returns current live coordinates, speed, and section."""
    provider = get_data_provider()
    return provider.get_train_position(train_no)

@router.get("/train/{train_no}/journey")
def get_journey(train_no: str):
    """Returns full station-by-station journey log with completed, current, and upcoming stops."""
    provider = get_data_provider()
    return provider.get_train_journey(train_no)

@router.get("/train/{train_no}/eta")
def get_eta(train_no: str):
    """Current predicted ETA at all upcoming stations, with ML confidence and explainability."""
    provider = get_data_provider()
    return provider.get_train_eta(train_no)

@router.get("/events/live-updates")
async def live_updates():
    """Server-Sent Events (SSE) stream pushing real-time fleet coordinates and ETA updates."""
    async def event_generator():
        provider = get_data_provider()
        while True:
            try:
                fleet = provider.get_fleet_summary()
                data = json.dumps({"timestamp": asyncio.get_event_loop().time(), "fleet": fleet})
                yield f"data: {data}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            await asyncio.sleep(6)  # push update every 6 seconds

    return StreamingResponse(event_generator(), media_type="text/event-stream")

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS points in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@router.get("/train/{train_no}/nearest-station")
def get_nearest_station(train_no: str, lat: float, lon: float):
    """
    Calculates distance individually for each station along the train's route
    relative to user coordinates (lat, lon), logs each station's distance,
    and returns the sorted stations with the genuinely nearest station.
    """
    provider = get_data_provider()
    journey = provider.get_train_journey(train_no)
    if not journey:
        raise HTTPException(status_code=404, detail=f"Train {train_no} not found")

    stops = journey.get("journey_log", [])
    logger.info(f"[NearestStationCalc] Evaluating {len(stops)} stations for Train {train_no} from user coords ({lat}, {lon}):")

    calculated_stations = []
    for s in stops:
        s_lat = s.get("lat")
        s_lon = s.get("lon")
        if s_lat is not None and s_lon is not None:
            dist = calculate_haversine_distance(lat, lon, float(s_lat), float(s_lon))
            logger.info(f"   Station: {s['station_name']} ({s_lat}, {s_lon}) => Distance: {dist} km")
            calculated_stations.append({
                **s,
                "distance_km": dist
            })

    if not calculated_stations:
        raise HTTPException(status_code=400, detail="No stations with coordinates found on this route")

    # Sort stations strictly by calculated distance
    calculated_stations.sort(key=lambda x: x["distance_km"])
    nearest = calculated_stations[0]
    logger.info(f"[NearestStationCalc] Selected nearest station: {nearest['station_name']} at {nearest['distance_km']} km")

    return {
        "train_no": train_no,
        "user_coordinates": {"lat": lat, "lon": lon},
        "nearest_station": nearest,
        "all_stations": calculated_stations
    }

