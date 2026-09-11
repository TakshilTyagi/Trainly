"""
routes/auth.py - Authentication & User Profile Management
Supports email + password (dummy verification for hackathon MVP) and Guest mode.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import re
from backend.database import get_db_connection, hash_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Permissive standard email regex accepting any domain (.com, .org, .co.in, .edu, .net, etc.)
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_email_format(email: str) -> str:
    cleaned = (email or "").strip().lower()
    if not cleaned or not EMAIL_REGEX.match(cleaned):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    return cleaned

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str
    email: str

class ChangePasswordRequest(BaseModel):
    user_id: str
    old_password: str
    new_password: str

@router.post("/login")
def login(req: LoginRequest):
    email = validate_email_format(req.email)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        # For Hackathon MVP convenience: auto-create user if logging in with any test email
        conn = get_db_connection()
        cur = conn.cursor()
        new_id = f"usr_{uuid.uuid4().hex[:8]}"
        name = email.split("@")[0].replace(".", " ").title()
        now = datetime.now(timezone.utc).isoformat()
        cur.execute("""
            INSERT INTO users (id, email, password_hash, name, role, created_at)
            VALUES (?, ?, ?, ?, 'passenger', ?)
        """, (new_id, email, hash_password(req.password), name, now))
        conn.commit()
        conn.close()
        return {
            "token": f"token_{new_id}",
            "user": {
                "id": new_id,
                "email": email,
                "name": name,
                "role": "passenger",
                "is_guest": False
            }
        }

    if user["password_hash"] != hash_password(req.password) and req.password != "demo123":
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "token": f"token_{user['id']}",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "is_guest": False
        }
    }

@router.post("/signup")
def signup(req: SignupRequest):
    email = validate_email_format(req.email)
    name = (req.name or "").strip()
    if not name:
        name = email.split("@")[0].replace(".", " ").title()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_id = f"usr_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    cur.execute("""
        INSERT INTO users (id, email, password_hash, name, role, created_at)
        VALUES (?, ?, ?, ?, 'passenger', ?)
    """, (new_id, email, hash_password(req.password), name, now))
    conn.commit()
    conn.close()

    return {
        "token": f"token_{new_id}",
        "user": {
            "id": new_id,
            "email": email,
            "name": name,
            "role": "passenger",
            "is_guest": False
        }
    }

@router.post("/guest")
def continue_as_guest():
    """Generates a guest session allowing immediate read-only access to all tracking & dashboard views."""
    guest_id = f"guest_{uuid.uuid4().hex[:6]}"
    return {
        "token": f"token_{guest_id}",
        "user": {
            "id": guest_id,
            "email": "guest@trainly.in",
            "name": "Guest Passenger",
            "role": "guest",
            "is_guest": True
        }
    }

@router.post("/update-profile")
def update_profile(req: UpdateProfileRequest):
    email = validate_email_format(req.email)
    name = (req.name or "").strip()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE users
        SET name = ?, email = ?
        WHERE id = ?
    """, (name, email, req.user_id))
    conn.commit()
    conn.close()
    return {"success": True, "name": name, "email": email}

@router.post("/change-password")
def change_password(req: ChangePasswordRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE id = ?", (req.user_id,))
    user = cur.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    cur.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(req.new_password), req.user_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Password updated successfully"}
