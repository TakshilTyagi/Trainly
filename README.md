# Trainly — Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains

> **Smart India Hackathon Problem Statement 26028**  
> *Ministry of Railways — Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains*

Trainly is a real-time, dynamic ETA prediction and fleet monitoring web platform for Indian Railways. Instead of relying on static, timetable-based schedules, Trainly combines live telemetry, section-level congestion patterns, historical delay distributions, and human-in-the-loop passenger feedback within a **hybrid machine learning architecture**.

---

## Key Features

1. **Split-Screen Authentication & Guest Access**:
   - Animated looping route with a glowing beacon on an India contour.
   - Dummy email + password login (`demo123` or any test account).
   - "Continue as guest" for immediate read-only access to all tracking views.
   - Profile management with identity modal, password update, and danger-styled logout.
2. **Interactive Tracker with Scrollytelling**:
   - Real geographic India route polyline with station nodes.
   - **Scroll-driven animation**: as the user scrolls down the station-by-station journey log, the train marker on the map translates along the route in sync with the scroll position.
   - "Why this ETA" explainability box showing natural-language rationales derived from feature contributions.
   - Dynamic confidence percentages decaying with downstream station distance.
3. **Fleet Overview with Inline Expansion**:
   - List cards for all 4 tracked trains with current station, next stop & predicted ETA, status badge, and confidence.
   - **Inline accordion expansion**: click any train to reveal its delay reason, telemetry speed, and quick-track button without full page navigation.
   - "Sort by delay" and relative heartbeat timer (`Updated 12s ago`).
4. **Grounded AI Assistant**:
   - Chat interface with quick-ask chips (`Why is my train late?`, `Nearest station now`, `Best time to leave for station`).
   - Function-calling tool execution against internal telemetry and ML endpoints — zero hallucination of train times.
5. **Passenger Feedback Loop (Human-in-the-Loop)**:
   - Quick-tap delay cause grid: Fog 🌫️, Signal 🚦, Congestion 🚧, Late start ⏱️, Technical ⚙️, Other ❓.
   - Optional note input with community confirmation counter ("✓ Confirmed by 18 others").
   - Feedbacks feed directly into model retraining pipeline.
6. **Operator Control Room Dashboard**:
   - 4-metric strip: Avg Fleet Delay, On-Time Count, Active Alerts, Avg Confidence.
   - "Needs Attention" alert panel highlighting sudden delay spikes and signal holds.
   - Dense fleet status table with quick actions.
   - Top Delay Sections bottleneck analyzer.
   - Open API access panel with copyable cURL endpoint and JSON preview.
7. **5-Language Internationalization & Dark Mode**:
   - Fully translated in **English (EN)**, **Hindi (HI)**, **Tamil (TA)**, **Telugu (TE)**, and **Malayalam (ML)**.
   - Polished Dark and Light mode toggled via a single header button and persisted locally.

---

## 4 Tracked Real Trains

| Train No | Name | Route | Characteristics & Baseline |
| :--- | :--- | :--- | :--- |
| **22490 / 22489** | **Meerut City–Varanasi Vande Bharat Express** | Meerut City → Hapur → Moradabad → Bareilly → Lucknow Charbagh → Ayodhya Dham → Varanasi | Semi-high-speed, dedicated high-priority path; punctual baseline. |
| **12951 / 12952** | **Mumbai Rajdhani Express** | Mumbai Central → Borivali → Surat → Vadodara → Ratlam → Kota → New Delhi | Long-distance overnight premium; recovers time past Kota. |
| **12615 / 12616** | **Grand Trunk (GT) Express** | Chennai Central → Vijayawada → Warangal → Balharshah → Wardha → Nagpur → Itarsi → Bhopal → Jhansi → Gwalior → Agra → New Delhi | North-south national artery; high freight congestion around Nagpur. |
| **22536 / 22535** | **Manduadih–Rameswaram Express** | Manduadih (Banaras) → Prayagraj → Jabalpur → Itarsi → Nagpur → Balharshah → Warangal → Vijayawada → Ongole → Chennai Egmore → Villupuram → Trichy → Madurai → Rameswaram | Long-haul cross-country express; historically delay-prone single-line sections. |

---

## Machine Learning Architecture

Trainly uses a **hybrid ML model** rather than a pure black box:

```
[ Scheduled Arrival Time ]
           +
[ Current Observed Delay ]
           -
[ Section Buffer Recovery (1.8m/100km for Priority 1-2) ]
           = 
   [ Baseline ETA ]
           +
[ ML Quantile Correction Δ_q50 (HistGradientBoostingRegressor) ]
           =
[ Final Dynamic Predicted ETA ]
```

### Quantile Regression & Confidence Intervals
- The model trains three gradient boosting regressors on quantile loss:
  - $\alpha = 0.50$ (Median prediction correction)
  - $\alpha = 0.10$ (10th percentile lower bound)
  - $\alpha = 0.90$ (90th percentile upper bound)
- The prediction interval spread $\text{spread} = q_{90} - q_{10}$ captures non-linear operational uncertainty.
- **Dynamic Confidence Score**:
  $$\text{Confidence} = \max\left(45, \min\left(96, \text{round}\left(100 - (\text{spread} \times 1.8 + \text{stops\_ahead} \times 4.2)\right)\right)\right)$$
  - Stations 1 stop ahead achieve **80%–94%** confidence.
  - Compounding uncertainty over distant destination stops naturally scales confidence down to **55%–74%**.

### "Why this ETA" Explainability
Each prediction evaluates the top feature drivers:
- High section congestion (>60%)
- Weather flags (dense fog alert requiring 60 km/h speed limits)
- Human passenger feedback reports (outer signal hold)
- Historical section clearance rates

A natural-language explanation is generated for passengers and operators (e.g. *"No congestion reported on the Moradabad–Bareilly stretch. Historical average delay at this section is under 3 minutes for this train."*).

### Retraining Pipeline
Run `python backend/ml/retrain.py` to ingest historical logs along with verified passenger reports from the SQLite database to retrain and serialize updated `.joblib` model artifacts.

---

## Data Sourcing & NTES Abstraction

### Unofficial NTES Source vs. Production CRIS Access
- In this MVP, live position, station delays, and section telemetry are accessed via an internal **Provider Pattern** (`backend/providers/base.py`).
- **`NTESLiveProvider`**: Uses public NTES/RailRadar REST endpoints with server-side in-memory caching (15-second TTL) to protect against rate limits and upstream timeouts.
- **`NTESMockFallbackProvider`**: High-fidelity live telemetry simulator that advances real train coordinates, computes realistic speed profiles (45–110 km/h), and maintains exact states matching the approved mockups.
- **Production Migration Blueprint**:
  In a production rollout with the Ministry of Railways, official CRIS access (**Project Pravah / NTES Enterprise Feed**) provides direct Kafka/REST streams of locomotive RTIS (Real-Time Train Information System) GPS transponders and station datalogger relays. Because of the `TrainDataProvider` abstraction layer, replacing the provider requires updating a single class (`CRISPravahProvider`) without touching the ML model, API endpoints, or UI.

---

## Quickstart & Demo Flow

### 1. Requirements
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js v24)

### 2. Running Trainly

#### Option A: One-Command PowerShell Script
```powershell
.\run_dev.ps1
```
Open **`http://localhost:8000`** in your browser!

#### Option B: Manual Startup
```powershell
# 1. Install Python dependencies
python -m pip install -r backend/requirements.txt

# 2. Start FastAPI Server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

If making changes to the frontend in development mode:
```powershell
cd frontend
npm.cmd run dev
```
(Frontend dev server will be available at `http://localhost:5173` with proxy to backend).

---

## Verified Demo Walkthrough

1. **Login Screen**:
   - Observe the split screen, animated glowing traveling train dot, and tagline.
   - Click **"Continue as guest"** (or log in with `rahul.sharma@example.com` / `demo123`).
2. **Home / Tracker**:
   - View `22490 Vande Bharat` on time between Moradabad and Bareilly.
   - Note the India map with the train route drawn and live beacon.
   - Read the **"Why this ETA"** explanation.
   - **Scroll down the Journey Log**: watch the train marker on the map smoothly retrace the journey along the route to each station!
   - Switch trains in the top dropdown to inspect `Manduadih Exp` (+2h 40m, 58% confidence).
3. **Fleet Overview**:
   - Click the hamburger menu `[ ☰ ]` and select **Fleet**.
   - Review all 4 trains with their delay badges and confidence scores.
   - Click the **"Sort by delay"** button.
   - Click any train card to expand the inline delay diagnosis, telemetry speed, and "Track on Map" button.
4. **AI Assistant**:
   - Open **Assistant** from the sidebar.
   - Tap a quick chip like *"Will the Vande Bharat reach Lucknow on time?"* or *"Is the Manduadih Express usually this delayed?"*.
   - Receive grounded, non-hallucinated responses based on live models.
5. **Passenger Feedback**:
   - Navigate to **Feedback**.
   - Select a train, tap a delay cause (e.g. `Signal`), type a note, and submit.
   - Click the **"Confirm"** button on an existing report to see the community trust counter increment.
6. **Control Room Dashboard**:
   - Open **Control Room**.
   - Check the 4-metric strip, alerts, dense fleet table, top bottlenecks, and test the **"Copy Endpoint"** button.
7. **i18n & Theme Switching**:
   - Toggle languages (`EN`, `HI`, `TA`, `TE`, `ML`) in the header; see all labels and navigation translate instantly.
   - Click the moon/sun icon to toggle dark and light modes.
