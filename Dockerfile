# ==========================================
# Stage 1: Build Frontend (Vite + React + Tailwind)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend (FastAPI + ML + SQLite)
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, models, and databases
COPY backend/ ./backend/

# Copy built frontend static distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Launch FastAPI via Uvicorn (binds to dynamic cloud $PORT or 8080)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
