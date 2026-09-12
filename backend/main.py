"""
main.py - Trainly FastAPI Server
Dynamic ETA Forecast & Fleet Monitoring for Indian Railways (SIH PS 26028)
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routes.trains import router as trains_router
from backend.routes.feedback import router as feedback_router
from backend.routes.auth import router as auth_router
from backend.routes.assistant import router as assistant_router
from backend.routes.control_room import router as control_room_router
from backend.providers.live_ntes import run_live_data_background_poller

logger = logging.getLogger("trainly.main")

# Initialize SQLite tables and seed data
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan manager:
    Automatically launches the continuous real-time background poller on server startup
    (skipped on serverless platforms like Vercel where instances freeze between requests).
    """
    if not os.getenv("VERCEL"):
        logger.info("[ServerLifespan] Starting Trainly backend server with automated real-time poller...")
        poller_task = asyncio.create_task(run_live_data_background_poller(interval_seconds=10.0))
        yield
        logger.info("[ServerLifespan] Shutting down Trainly backend server and stopping poller...")
        poller_task.cancel()
        try:
            await poller_task
        except asyncio.CancelledError:
            pass
    else:
        logger.info("[ServerLifespan] Vercel Serverless environment detected: on-demand real-time ingestion active.")
        yield

app = FastAPI(
    title="Trainly API",
    description="Real-time ETA Prediction and Dynamic Fleet Forecasting for Indian Railways",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def vercel_path_rewrite_middleware(request, call_next):
    """
    Normalizes paths when invoked inside Vercel Serverless Functions.
    Resolves cases where Vercel routes /api/index.py or strips /api prefix.
    """
    current_path = request.scope.get("path", "")
    if current_path in ["/api/index.py", "/api/index", "/api/index/"]:
        orig = (
            request.headers.get("x-matched-path")
            or request.headers.get("x-forwarded-uri")
            or request.headers.get("x-original-url")
            or request.headers.get("x-invoke-path")
        )
        if orig and not orig.startswith("/api/index"):
            request.scope["path"] = orig
    elif not current_path.startswith("/api") and not current_path.startswith("/docs") and not current_path.startswith("/openapi.json"):
        request.scope["path"] = f"/api{current_path}"
    return await call_next(request)

# API Health Check Endpoint
@app.get("/api")
@app.get("/api/health")
def api_health():
    return {
        "status": "ok",
        "service": "Trainly API",
        "version": "1.0.0"
    }

# Include API Routers
app.include_router(trains_router)
app.include_router(feedback_router)
app.include_router(auth_router)
app.include_router(assistant_router)
app.include_router(control_room_router)

# SOS Alert Direct Endpoint (Safety page & mobile clients)
from backend.routes.control_room import trigger_sos_alert, SOSCreatePayload

@app.post("/api/sos/alert")
def create_sos_alert_alias(payload: SOSCreatePayload):
    return trigger_sos_alert(payload)

# Mount frontend static files if built
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "service": "Trainly API",
            "status": "online",
            "description": "Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains (SIH 26028)",
            "endpoints": {
                "fleet": "/api/fleet",
                "journey": "/api/train/{train_no}/journey",
                "eta": "/api/train/{train_no}/eta",
                "position": "/api/train/{train_no}/position",
                "feedback": "/api/feedback/{train_no}",
                "assistant": "/api/assistant/query",
                "control_room": "/api/control-room",
                "live_stream": "/api/events/live-updates"
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
