"""
timing_utils.py - Precise Timing & Delay Calculation Engine for Indian Railways
Part of Trainly ETA Prediction System.

Handles:
1. Accurate delay calculation: actual_time - scheduled_time in minutes
2. Day-boundary rollovers across midnight (e.g. 23:55 -> 00:15)
3. 24-hour clock wrapping in IST
4. Status labels and formatting
5. Side-by-side audit logging for timetable vs live telemetry verification
"""

import logging
from typing import Optional, Tuple

logger = logging.getLogger("trainly.timing_utils")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def parse_time_str(time_str: str) -> Tuple[int, int]:
    """Parses 'HH:MM' string into (hours, minutes)."""
    parts = time_str.strip().split(":")
    return int(parts[0]), int(parts[1])


def compute_delay_minutes(
    sched_time_str: str,
    actual_time_str: str,
    sched_day: int = 1,
    actual_day: Optional[int] = None
) -> float:
    """
    Computes delay in minutes: (actual_time - scheduled_time).
    
    Correctly accounts for:
    - Normal daytime delays: 09:10 vs 09:45 -> +35.0 min
    - Running early: 07:08 vs 07:07 -> -1.0 min
    - Multi-day scheduled itineraries (day 1, day 2, day 3)
    - Midnight rollovers when actual_day is omitted:
      e.g. scheduled 23:50 (day 1) vs actual 00:15 (day 2) -> +25.0 min (not -1415 min!)
      e.g. scheduled 00:05 (day 2) vs actual 23:55 (day 1 early) -> -10.0 min (not +1430 min!)
    """
    sh, sm = parse_time_str(sched_time_str)
    ah, am = parse_time_str(actual_time_str)

    sched_total = (sched_day - 1) * 1440 + sh * 60 + sm

    if actual_day is not None:
        actual_total = (actual_day - 1) * 1440 + ah * 60 + am
    else:
        # Automatic rollover detection based on nearest circular clock difference
        raw_diff = (ah * 60 + am) - (sh * 60 + sm)
        if raw_diff < -720:
            # Traversed midnight into next calendar day
            actual_total = (sched_day - 1) * 1440 + 1440 + ah * 60 + am
        elif raw_diff > 720:
            # Arrived early before midnight
            actual_total = (sched_day - 1) * 1440 - 1440 + ah * 60 + am
        else:
            actual_total = (sched_day - 1) * 1440 + ah * 60 + am

    delay = float(actual_total - sched_total)
    return round(delay, 1)


def add_delay_to_time(sched_time_str: str, delay_min: float) -> str:
    """
    Adds delay_min to scheduled_time_str ('HH:MM') and returns predicted clock time
    formatted as 'HH:MM' (24-hour IST format).
    Handles 24-hour day wrapping smoothly.
    """
    sh, sm = parse_time_str(sched_time_str)
    total_mins = sh * 60 + sm + int(round(delay_min))
    # Wrap within 24 hours
    h = (total_mins // 60) % 24
    m = total_mins % 60
    return f"{h:02d}:{m:02d}"


def format_status_label(delay_min: float, is_not_started: bool = False, is_completed: bool = False) -> str:
    """Returns concise human-readable badge text (e.g. 'Arrived', 'Scheduled', 'On time', '+35 min', '+2h 40m')."""
    if is_completed:
        return "Arrived"
    if is_not_started:
        return "Scheduled"
    delay_int = int(round(delay_min))
    if delay_int <= 5:
        return "On time"
    if delay_int >= 60:
        hrs = delay_int // 60
        mins = delay_int % 60
        return f"+{hrs}h {mins:02d}m" if mins else f"+{hrs}h"
    return f"+{delay_int} min"


def format_status_class(delay_min: float, is_not_started: bool = False, is_completed: bool = False) -> str:
    """Returns CSS/status classification string."""
    if is_completed:
        return "completed"
    if is_not_started:
        return "scheduled"
    delay_int = int(round(delay_min))
    if delay_int <= 5:
        return "ontime"
    if delay_int <= 45:
        return "delayed-mid"
    return "delayed-severe"


def format_delay_note(delay_min: float) -> str:
    """Returns formatted note for station cards (e.g. 'on time', '+35 min', '+2h 40m')."""
    delay_int = int(round(delay_min))
    if delay_int <= 5:
        return "on time"
    if delay_int >= 60:
        hrs = delay_int // 60
        mins = delay_int % 60
        return f"+{hrs}h {mins:02d}m" if mins else f"+{hrs}h"
    return f"+{delay_int} min"


def log_timing_audit(
    train_no: str,
    station_code: str,
    station_name: str,
    sched_time: str,
    actual_time: str,
    computed_delay: float,
    context: str = "Audit"
) -> None:
    """Logs a side-by-side comparison of official timetable time vs live actual time."""
    delay_sign = f"+{computed_delay:.0f}" if computed_delay > 0 else f"{computed_delay:.0f}"
    logger.info(
        f"[TimingAudit:{context}] Train {train_no} @ {station_code} ({station_name}) | "
        f"Official Sched: {sched_time} | Live Actual: {actual_time} | "
        f"Computed Delay: {delay_sign} min"
    )
