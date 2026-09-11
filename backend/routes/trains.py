"""
routes/trains.py - Train Telemetry, Journey & ETA Endpoints
"""

import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.providers.live_ntes import get_data_provider

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
