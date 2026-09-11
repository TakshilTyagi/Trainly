@echo off
title Trainly - Indian Railways Dynamic ETA System
echo ========================================================
echo    TRAINLY - Dynamic Forecast of Train ETA (SIH 26028)
echo ========================================================
echo.
echo Starting FastAPI Backend on http://localhost:8080...
start cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload"

echo Starting Vite Frontend on http://localhost:5173...
cd frontend
start cmd /k "npm.cmd run dev"

echo.
echo Trainly is starting up!
echo You can open either:
echo   - http://localhost:5173  (Vite Dev Server)
echo   - http://localhost:8080  (FastAPI Production Mount)
echo.
pause
