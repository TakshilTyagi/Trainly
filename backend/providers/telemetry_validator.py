"""
telemetry_validator.py - Live Telemetry Sanity & Plausibility Checker
Validates raw and parsed train telemetry before serving to the API layer.
Catches impossible backward station jumps, unrealistic speeds, and status inconsistencies.
"""

import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("trainly.telemetry_validator")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Maximum operational speeds for Indian Railways coaching stock (km/h)
MAX_PERMISSIBLE_SPEED = {
    "22490": 160,   # Vande Bharat Express (semi-high speed)
    "12951": 140,   # Tejas Rajdhani Express
    "12615": 130,   # Superfast Express
    "22536": 110,   # Weekly Superfast Express
    "12004": 150,   # Shatabdi Express
    "12625": 130,   # Kerala Superfast Express
    "12301": 140,   # Howrah Rajdhani Express
    "12002": 150,   # Bhopal Shatabdi Express (semi-high speed)
    # 20 New diverse trains
    "12723": 130,   # Telangana Express
    "12839": 110,   # Howrah–Chennai Mail
    "12903": 110,   # Golden Temple Mail
    "12137": 110,   # Punjab Mail
    "16031": 110,   # Andaman Express
    "12801": 130,   # Purushottam Express
    "12649": 130,   # Karnataka Sampark Kranti Express
    "12267": 130,   # Mumbai–Ahmedabad Duronto Express
    "22691": 130,   # Bengaluru Rajdhani Express
    "12273": 130,   # Howrah–New Delhi Duronto Express
    "12009": 130,   # Mumbai Central–Ahmedabad Shatabdi Express
    "12431": 130,   # Trivandrum Rajdhani Express
    "12423": 130,   # Dibrugarh Rajdhani Express
    "12621": 130,   # Tamil Nadu Express
    "12215": 130,   # Delhi Sarai Rohilla–Bandra Terminus Garib Rath Express
    "12259": 130,   # Sealdah Duronto Express
    "20607": 130,   # Chennai Central–Mysuru Vande Bharat Express
    "12019": 130,   # Howrah–Ranchi Shatabdi Express
    "12245": 130,   # Howrah–Yesvantpur Duronto Express
    "12393": 130    # Sampoorna Kranti Express
}

def validate_train_telemetry(
    train_no: str,
    new_state: Dict[str, Any],
    prev_state: Optional[Dict[str, Any]] = None
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates physical plausibility of new_state compared to prev_state.
    Returns (is_valid, reason, sanitized_state).
    """
    sanitized = dict(new_state)
    max_spd = MAX_PERMISSIBLE_SPEED.get(train_no, 130)

    # Check 1: Speed Plausibility
    spd = sanitized.get("speed_kmh", 0)
    if spd < 0:
        logger.warning(f"[SanityCheck] Train {train_no} reported negative speed {spd} km/h. Clamping to 0.")
        sanitized["speed_kmh"] = 0
    elif spd > max_spd + 15:
        logger.warning(f"[SanityCheck] Train {train_no} reported speed {spd} km/h exceeding maximum {max_spd} km/h. Clamping.")
        sanitized["speed_kmh"] = max_spd

    # Check 2: 'Not Started' Status Consistency
    status_label = sanitized.get("status_label", "").lower()
    is_not_started = "scheduled" in status_label or "not started" in status_label
    if is_not_started:
        if sanitized.get("speed_kmh", 0) > 0:
            logger.warning(f"[SanityCheck] Train {train_no} is '{status_label}' but had speed {sanitized['speed_kmh']} km/h. Resetting speed to 0.")
            sanitized["speed_kmh"] = 0

    # Check 3: Backward Station Jump Detection
    if prev_state and not is_not_started:
        prev_idx = prev_state.get("current_section_idx")
        curr_idx = sanitized.get("current_section_idx")
        prev_status = prev_state.get("status_label", "").lower()
        
        # Only check backward jump if the train was already running
        if prev_idx is not None and curr_idx is not None and "scheduled" not in prev_status:
            # If current station index dropped by more than 0 stations on same journey
            if curr_idx < prev_idx:
                logger.error(
                    f"[SanityCheck] ANOMALY: Train {train_no} jumped BACKWARDS from section index {prev_idx} "
                    f"to {curr_idx}! Anomaly rejected; maintaining last known forward position."
                )
                sanitized["current_section_idx"] = prev_idx
                sanitized["next_station_code"] = prev_state.get("next_station_code", sanitized.get("next_station_code"))
                sanitized["next_station_name"] = prev_state.get("next_station_name", sanitized.get("next_station_name"))
                sanitized["current_near_station"] = prev_state.get("current_near_station", sanitized.get("current_near_station"))
                sanitized["current_subtext"] = prev_state.get("current_subtext", sanitized.get("current_subtext"))
                return False, "Backward station jump detected", sanitized

    return True, "OK", sanitized
