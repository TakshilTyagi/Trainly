# run_dev.ps1 - Startup script for Trainly (Windows PowerShell)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   TRAINLY — Dynamic Forecast of Train ETA (SIH 26028)   " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Check Python and dependencies
Write-Host "[1/3] Verifying backend dependencies..." -ForegroundColor Green
python -m pip install -r backend/requirements.txt --quiet

# 2. Retrain/verify ML quantile models
Write-Host "[2/3] Checking Quantile ML Models..." -ForegroundColor Green
if (!(Test-Path "backend/ml/model_q50.joblib")) {
    python backend/ml/retrain.py
} else {
    Write-Host "Trained quantile models found in backend/ml/." -ForegroundColor Gray
}

# 3. Launching Server
Write-Host "[3/3] Starting Trainly Server on http://localhost:8080..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
