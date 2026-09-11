"""
routes/feedback.py - Passenger Delay Reporting & Human-in-the-Loop Feedback
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import (
    add_feedback_report,
    get_feedback_for_train,
    confirm_feedback_report,
    vote_feedback_report
)

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

class FeedbackSubmitRequest(BaseModel):
    train_no: str
    cause_tag: str  # "Fog", "Signal", "Congestion", "Late start", "Technical", "Other"
    note: Optional[str] = ""
    user_id: Optional[str] = "usr_demo1"
    user_name: Optional[str] = "Passenger"

class ConfirmRequest(BaseModel):
    user_id: Optional[str] = "usr_demo1"

class VoteRequest(BaseModel):
    user_id: Optional[str] = "usr_demo1"
    action: str  # "agree", "unagree", "disagree", "undisagree", "switch_to_agree", "switch_to_disagree"

@router.get("/{train_no}")
def get_train_feedback(train_no: str):
    """Fetches recent passenger delay reports for a given train."""
    reports = get_feedback_for_train(train_no)
    now_iso = datetime.utcnow().isoformat()
    return {
        "train_no": train_no,
        "reports": reports,
        "last_updated": now_iso
    }

@router.post("")
def submit_feedback(payload: FeedbackSubmitRequest):
    """Submits a passenger delay cause report (structured human-in-the-loop signal)."""
    valid_tags = ["Fog", "Signal", "Congestion", "Late start", "Technical", "Other"]
    if payload.cause_tag not in valid_tags:
        raise HTTPException(status_code=400, detail=f"Invalid cause tag. Must be one of {valid_tags}")

    report_id = add_feedback_report(
        train_no=payload.train_no,
        cause_tag=payload.cause_tag,
        note=payload.note,
        user_id=payload.user_id,
        user_name=payload.user_name
    )
    return {
        "success": True,
        "message": "Report submitted successfully! Thank you for improving ETA accuracy.",
        "report_id": report_id
    }

@router.post("/{feedback_id}/confirm")
def confirm_report(feedback_id: int, payload: ConfirmRequest):
    """Increments the community trust confirmation count for a delay report."""
    success = confirm_feedback_report(feedback_id, payload.user_id)
    return {
        "success": success,
        "message": "Confirmation recorded." if success else "Already confirmed by you."
    }

@router.post("/{feedback_id}/vote")
def vote_report(feedback_id: int, payload: VoteRequest):
    """Handles toggle votes: agree, unagree, disagree, undisagree, switch_to_agree, switch_to_disagree."""
    result = vote_feedback_report(feedback_id, payload.user_id, payload.action)
    return result
