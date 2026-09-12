"""
routes/control_room.py - Control Room Dashboard Endpoints
Aggregates live fleet metrics, dynamic bottleneck diagnostics, real-time alerts, and open API metadata.
All data is recalculated fresh from the live telemetry engine on every request.
"""

import logging
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Response, HTTPException
from backend.providers.live_ntes import get_data_provider
from backend.database import (
    get_control_room_data,
    get_feedback_for_train,
    get_sos_alerts,
    add_sos_alert,
    update_sos_alert_status
)

logger = logging.getLogger("trainly.control_room")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api/control-room", tags=["Control Room"])

def format_time_ago(iso_ts_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_ts_str.replace("Z", "+00:00"))
        now_dt = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.utcnow()
        diff = max(0, (now_dt - dt).total_seconds())
        if diff < 60:
            return "Just now" if diff < 15 else f"{int(diff)}s ago"
        elif diff < 3600:
            return f"{int(diff // 60)}m ago"
        elif diff < 86400:
            return f"{int(diff // 3600)}h ago"
        else:
            return f"{int(diff // 86400)}d ago"
    except Exception:
        return "Recently"

class SOSStatusUpdate(BaseModel):
    status: str
    official_name: Optional[str] = "Railway Official"

class SOSCreatePayload(BaseModel):
    train_no: Optional[str] = "Unknown"
    train_name: Optional[str] = "Unknown"
    coach: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    notified_destinations: Optional[str] = "RPF control room, TT, nearby users"
    user_id: Optional[str] = "usr_anonymous"
    user_name: Optional[str] = "Passenger"

@router.get("")
def get_control_room_metrics(response: Response):
    """
    Returns real-time control room metrics for all 4 tracked corridors.
    Recalculates all fleet summaries, active alerts, and bottleneck sections
    fresh from current live NTES telemetry and database feedback on every call.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    provider = get_data_provider()
    fleet = provider.get_fleet_summary()

    # 1. Recalculate summary metrics fresh from current fleet
    delays = [float(t.get("delay_min", 0.0)) for t in fleet]
    confidences = [int(t.get("confidence_pct", 80)) for t in fleet]
    on_time_count = sum(1 for d in delays if d <= 5.0)
    avg_delay = round(sum(delays) / len(delays), 1) if delays else 0.0
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0

    fleet_by_no = {t["train_no"]: t for t in fleet}

    # 2. Compute dynamic "Needs Attention" alerts from current live train state
    alerts = []
    alert_idx = 1
    for t in fleet:
        t_no = t["train_no"]
        delay = float(t.get("delay_min", 0.0))
        conf = int(t.get("confidence_pct", 85))
        status_label = t.get("status_label", "")
        why_eta = t.get("why_this_eta", "")
        near_stn = t.get("currently_near", "")
        next_stn = t.get("next_station", "")
        next_eta = t.get("next_eta", "")
        speed = t.get("speed_kmh", 0)
        updated_secs = t.get("updated_secs_ago", 15)

        # Dynamic time_ago calculation
        if updated_secs < 60:
            time_ago = f"{int(updated_secs)}s ago" if updated_secs > 5 else "Just now"
        else:
            time_ago = f"{int(updated_secs // 60)}m ago"

        # Check passenger reports for this train from live feedback table
        recent_reps = get_feedback_for_train(t_no)
        valid_rep = next((r for r in recent_reps if r.get("note") and r.get("note").strip()), None)
        if valid_rep:
            passenger_report_str = f"\"{valid_rep['note'].strip()}\" ({valid_rep['confirmations']} confirmed)"
        else:
            passenger_report_str = "No passenger reports yet"

        # Condition 1: Major/Severe Delay (delay >= 45m or low confidence <= 65%)
        if delay >= 45.0 or (delay >= 30.0 and conf <= 65):
            issue_str = f"{why_eta} Near {near_stn}, next stop {next_stn} ({next_eta})."
            alerts.append({
                "id": f"alt_{alert_idx}",
                "train_no": t_no,
                "train_name": t["name"],
                "severity": "CRITICAL",
                "alert_type": "severe_delay",
                "delay_val": int(delay),
                "title": f"Severe Delay (+{int(delay)}m)",
                "issue": issue_str,
                "why_this_eta": why_eta,
                "near_station": near_stn,
                "next_station": next_stn,
                "next_eta": next_eta,
                "speed_kmh": speed,
                "confidence_pct": conf,
                "passenger_report": passenger_report_str,
                "passenger_note": valid_rep['note'].strip() if valid_rep else "",
                "passenger_confirmations": valid_rep['confirmations'] if valid_rep else 0,
                "message": f"{issue_str} Confidence: {conf}%. Passenger report: {passenger_report_str}",
                "time_ago": time_ago,
                "time_ago_secs": updated_secs,
                "delay_min": delay
            })
            alert_idx += 1
        # Condition 2: Moderate Section Delay (delay >= 15m or low speed restriction under delay)
        elif delay >= 15.0 or (delay >= 10.0 and speed < 40 and t.get("status_class") == "delayed"):
            issue_str = f"{why_eta} Near {near_stn}, approaching {next_stn} at {speed} km/h."
            alerts.append({
                "id": f"alt_{alert_idx}",
                "train_no": t_no,
                "train_name": t["name"],
                "severity": "WARNING",
                "alert_type": "section_delay_hold",
                "delay_val": int(delay),
                "title": f"Section Delay Hold (+{int(delay)}m)",
                "issue": issue_str,
                "why_this_eta": why_eta,
                "near_station": near_stn,
                "next_station": next_stn,
                "next_eta": next_eta,
                "speed_kmh": speed,
                "confidence_pct": conf,
                "passenger_report": passenger_report_str,
                "passenger_note": valid_rep['note'].strip() if valid_rep else "",
                "passenger_confirmations": valid_rep['confirmations'] if valid_rep else 0,
                "message": f"{issue_str} Confidence: {conf}%. Passenger report: {passenger_report_str}",
                "time_ago": time_ago,
                "time_ago_secs": updated_secs,
                "delay_min": delay
            })
            alert_idx += 1
        # Condition 3: Low prediction confidence under active operation
        elif conf < 75 and delay > 5.0:
            issue_str = f"{why_eta} Near {near_stn}. Telemetry variance detected on approach to {next_stn}."
            alerts.append({
                "id": f"alt_{alert_idx}",
                "train_no": t_no,
                "train_name": t["name"],
                "severity": "WARNING",
                "alert_type": "low_confidence",
                "delay_val": int(delay),
                "title": f"Low Prediction Confidence ({conf}%)",
                "issue": issue_str,
                "why_this_eta": why_eta,
                "near_station": near_stn,
                "next_station": next_stn,
                "next_eta": next_eta,
                "speed_kmh": speed,
                "confidence_pct": conf,
                "passenger_report": passenger_report_str,
                "passenger_note": valid_rep['note'].strip() if valid_rep else "",
                "passenger_confirmations": valid_rep['confirmations'] if valid_rep else 0,
                "message": f"{issue_str} Confidence: {conf}%. Passenger report: {passenger_report_str}",
                "time_ago": time_ago,
                "time_ago_secs": updated_secs,
                "delay_min": delay
            })
            alert_idx += 1

    # Sort alerts: CRITICAL before WARNING, then highest delay first
    severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    alerts.sort(key=lambda a: (severity_order.get(a["severity"], 3), -a["delay_min"]))
    for a in alerts:
        a.pop("delay_min", None)

    # 3. Compute live bottlenecks dynamically from the current fleet delay and section data
    bottleneck_configs = [
        {
            "train_no": "22536",
            "section_name": "Vijayawada–Ongole",
            "route_trains": "22536 Manduadih Exp",
            "base_cause": "Single-line freight clearance & yard junction hold"
        },
        {
            "train_no": "12615",
            "section_name": "Wardha–Nagpur",
            "route_trains": "12615 GT Express",
            "base_cause": "Dense freight intersection & signal interlocking"
        },
        {
            "train_no": "12951",
            "section_name": "Ratlam–Kota",
            "route_trains": "12951 Rajdhani",
            "base_cause": "Speed restriction over curve section"
        },
        {
            "train_no": "22490",
            "section_name": "Moradabad–Bareilly",
            "route_trains": "22490 Vande Bharat",
            "base_cause": "Semi-high speed cleared corridor"
        },
        {
            "train_no": "12625",
            "section_name": "Palakkad–Coimbatore",
            "route_trains": "12625 Kerala Express",
            "base_cause": "Ghat gradient speed restriction & single-track crossing"
        },
        {
            "train_no": "12301",
            "section_name": "Dhanbad–Gaya",
            "route_trains": "12301 Howrah Rajdhani",
            "base_cause": "Grand Chord automated block signal priority"
        },
        {
            "train_no": "12002",
            "section_name": "Agra–Gwalior",
            "route_trains": "12002 Bhopal Shatabdi",
            "base_cause": "High-speed 130-150 km/h priority passenger block"
        },
        {
            "train_no": "12723",
            "section_name": "Kazipet–Balharshah",
            "route_trains": "12723 Telangana Express",
            "base_cause": "Coal corridor freight precedence & loop clearance"
        },
        {
            "train_no": "12839",
            "section_name": "Kharagpur–Bhadrak",
            "route_trains": "12839 Howrah Chennai Mail",
            "base_cause": "Dense South Eastern mineral & freight saturation"
        },
        {
            "train_no": "12903",
            "section_name": "Surat–Vadodara",
            "route_trains": "12903 Golden Temple Mail",
            "base_cause": "High-frequency mainline freight & suburban congestion"
        },
        {
            "train_no": "12137",
            "section_name": "Kalyan–Igatpuri",
            "route_trains": "12137 Punjab Mail",
            "base_cause": "Thal Ghat gradient regulation & banker engine operations"
        },
        {
            "train_no": "16031",
            "section_name": "Nagpur–Itarsi",
            "route_trains": "16031 Andaman Express",
            "base_cause": "Central railway quadruple tracking bottleneck"
        },
        {
            "train_no": "12801",
            "section_name": "Tatanagar–Bokaro",
            "route_trains": "12801 Purushottam Express",
            "base_cause": "Mineral belt freight crossing & automatic signal spacing"
        },
        {
            "train_no": "12649",
            "section_name": "Hubballi–Ballari",
            "route_trains": "12649 Karnataka Sampark Kranti",
            "base_cause": "Single-line clearance hold on South Western route"
        },
        {
            "train_no": "12267",
            "section_name": "Vadodara–Ahmedabad",
            "route_trains": "12267 Mumbai Ahmedabad Duronto",
            "base_cause": "130 km/h cleared high-speed express corridor"
        },
        {
            "train_no": "22691",
            "section_name": "Secunderabad–Kazipet",
            "route_trains": "22691 Bengaluru Rajdhani",
            "base_cause": "High priority Rajdhani green-wave clearance"
        },
        {
            "train_no": "12273",
            "section_name": "Asansol–Patna",
            "route_trains": "12273 Howrah NDLS Duronto",
            "base_cause": "Eastern trunk passenger line congestion"
        },
        {
            "train_no": "12009",
            "section_name": "Vapi–Surat",
            "route_trains": "12009 Mumbai ADI Shatabdi",
            "base_cause": "High-speed daytime semi-rapid Shatabdi slot"
        },
        {
            "train_no": "12431",
            "section_name": "Mangaluru–Madgaon",
            "route_trains": "12431 Trivandrum Rajdhani",
            "base_cause": "Konkan Railway single-line block & crossing halts"
        },
        {
            "train_no": "12423",
            "section_name": "New Bongaigaon–Guwahati",
            "route_trains": "12423 Dibrugarh Rajdhani",
            "base_cause": "Northeast corridor single line crossing & elephant corridor caution"
        },
        {
            "train_no": "12621",
            "section_name": "Vijayawada–Warangal",
            "route_trains": "12621 Tamil Nadu Express",
            "base_cause": "High-density Grand Trunk passenger priority"
        },
        {
            "train_no": "12215",
            "section_name": "Jaipur–Ajmer",
            "route_trains": "12215 DEE BDTS Garib Rath",
            "base_cause": "Western railway desert section crossing hold"
        },
        {
            "train_no": "12259",
            "section_name": "Dhanbad–DDU",
            "route_trains": "12259 Sealdah NDLS Duronto",
            "base_cause": "Grand Chord automated freight & passenger interlocking"
        },
        {
            "train_no": "20607",
            "section_name": "Katpadi–Bengaluru",
            "route_trains": "20607 Chennai Mysuru VB",
            "base_cause": "Semi-high speed Vande Bharat green wave corridor"
        },
        {
            "train_no": "12019",
            "section_name": "Durgapur–Asansol",
            "route_trains": "12019 Howrah Ranchi Shatabdi",
            "base_cause": "Industrial belt signal precedence"
        },
        {
            "train_no": "12245",
            "section_name": "Bhubaneswar–Vizianagaram",
            "route_trains": "12245 Howrah YPR Duronto",
            "base_cause": "East Coast high-speed cross-country run"
        },
        {
            "train_no": "12393",
            "section_name": "Patna–DDU",
            "route_trains": "12393 Sampoorna Kranti Exp",
            "base_cause": "Dense East Central trunk passenger priority"
        }
    ]

    dynamic_bottlenecks = []
    for idx, bc in enumerate(bottleneck_configs, 1):
        t = fleet_by_no.get(bc["train_no"])
        if t:
            live_delay = float(t.get("delay_min", 0.0))
            is_scheduled = t.get("status_class") == "scheduled"
            
            if is_scheduled:
                congestion = 15
                cause = "Pre-departure track clearance in progress; scheduled origin"
            elif live_delay > 60:
                congestion = min(98, max(75, int(70 + (live_delay - 60) * 0.2)))
                cause = t.get("why_this_eta") or bc["base_cause"]
            elif live_delay > 15:
                congestion = min(85, max(50, int(45 + live_delay * 0.9)))
                cause = t.get("why_this_eta") or bc["base_cause"]
            elif live_delay > 0:
                congestion = min(50, max(20, int(20 + live_delay * 2.0)))
                cause = t.get("why_this_eta") or bc["base_cause"]
            else:
                congestion = 18 if "22490" in bc["train_no"] else 15
                cause = "Clear corridor; green-wave automatic block signaling"

            dynamic_bottlenecks.append({
                "id": idx,
                "section_name": bc["section_name"],
                "route_trains": bc["route_trains"],
                "avg_delay_min": round(live_delay, 1),
                "congestion_pct": congestion,
                "cause_summary": cause
            })

    # Sort bottlenecks by avg_delay_min descending so highest delay corridors appear first
    dynamic_bottlenecks.sort(key=lambda b: b["avg_delay_min"], reverse=True)

    # 4. Fetch live recent passenger reports and SOS alerts from SQLite
    db_data = get_control_room_data()
    raw_sos = db_data.get("sos_alerts", [])
    formatted_sos = []
    for s in raw_sos:
        s_copy = dict(s)
        created_str = s_copy.get("created_at", "")
        s_copy["time_ago"] = format_time_ago(created_str) if created_str else "Recently"
        formatted_sos.append(s_copy)

    active_sos_count = sum(1 for s in formatted_sos if s.get("status") == "active")

    # 5. Live sample API response reflecting current 22490 telemetry
    t_22490 = fleet_by_no.get("22490", fleet[0] if fleet else {})
    api_sample = {
        "endpoint": "GET /api/train/22490/eta",
        "sample_response": {
            "train_no": "22490",
            "train_name": t_22490.get("name", "22490 Vande Bharat"),
            "current_status": t_22490.get("status_label", "On time"),
            "next_station": t_22490.get("next_station", "Ayodhya Dham Jn"),
            "predicted_eta": t_22490.get("next_eta", "15:40"),
            "confidence_pct": t_22490.get("confidence_pct", 92),
            "why_this_eta": t_22490.get("why_this_eta", "No congestion reported on the corridor."),
            "model_version": "trainly-hybrid-gbm-v1.4"
        }
    }

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    fleet_summary_str = ", ".join([f"{t.get('train_no')}:{t.get('status_label')}({t.get('delay_min')}m)" for t in fleet])
    logger.info(
        f"[ControlRoom:Sync] Snapshot at {now_str} | "
        f"Avg Fleet Delay: +{avg_delay}m | On-Time: {on_time_count}/{len(fleet)} | "
        f"Alerts: {len(alerts)} | SOS Active: {active_sos_count} | Live Fleet: {fleet_summary_str}"
    )

    latest_updated_iso = fleet[0].get("last_updated") if (fleet and fleet[0].get("last_updated")) else datetime.utcnow().isoformat()
    min_age_secs = min([t.get("updated_secs_ago", 1) for t in fleet]) if fleet else 1

    return {
        "last_updated": latest_updated_iso,
        "last_updated_secs_ago": min_age_secs,
        "summary": {
            "avg_fleet_delay_min": avg_delay,
            "on_time_count": on_time_count,
            "total_trains": len(fleet),
            "active_alerts_count": len(alerts),
            "active_sos_alerts_count": active_sos_count,
            "avg_confidence_pct": avg_confidence
        },
        "alerts": alerts,
        "fleet_table": fleet,
        "bottlenecks": dynamic_bottlenecks,
        "recent_feedback": db_data["recent_reports"],
        "sos_alerts": formatted_sos,
        "api_access": api_sample
    }

@router.post("/sos/{alert_id}/status")
@router.patch("/sos/{alert_id}/status")
def update_sos_status(alert_id: int, payload: SOSStatusUpdate):
    """
    Allows a railway official to update the status of an active SOS alert.
    Marks as 'acknowledged' or 'resolved' and records the official's name and timestamp.
    """
    valid_statuses = ["active", "acknowledged", "resolved"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}")

    updated = update_sos_alert_status(alert_id, payload.status, payload.official_name)
    if not updated:
        raise HTTPException(status_code=404, detail=f"SOS Alert #{alert_id} not found")

    updated_copy = dict(updated)
    updated_copy["time_ago"] = format_time_ago(updated_copy.get("created_at", ""))
    logger.info(f"[ControlRoom:SOS] Alert #{alert_id} marked as '{payload.status}' by '{payload.official_name}'")
    return {
        "success": True,
        "message": f"Alert #{alert_id} updated to '{payload.status}'",
        "alert": updated_copy
    }

@router.post("/sos")
def trigger_sos_alert(payload: SOSCreatePayload):
    """
    Trigger a new SOS alert (from Safety page or emergency client).
    Persists to SQLite sos_alerts table and routes to Control Room.
    """
    new_alert = add_sos_alert(
        train_no=payload.train_no,
        train_name=payload.train_name,
        coach=payload.coach,
        lat=payload.lat,
        lon=payload.lon,
        notified_destinations=payload.notified_destinations,
        user_id=payload.user_id,
        user_name=payload.user_name
    )
    alert_copy = dict(new_alert)
    alert_copy["time_ago"] = "Just now"
    logger.warning(f"[ControlRoom:SOS:TRIGGER] New SOS Alert on Train {payload.train_no} ({payload.coach or 'No coach'}) at ({payload.lat}, {payload.lon})")
    return {
        "success": True,
        "message": "SOS Alert successfully dispatched to RPF control room and local teams",
        "alert": alert_copy
    }

