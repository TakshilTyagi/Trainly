"""
retrain.py - Standalone Model Retraining Script
Trains Quantile Gradient Boosting regressors on historical delay data + passenger feedback.
"""

import os
import sys

# Ensure parent directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.ml.ml_engine import TrainlyMLEngine
from backend.database import get_all_passenger_feedback_for_ml

def main():
    print("=== Trainly ML Model Retraining Pipeline ===")
    
    # 1. Fetch any real feedback reports from the database
    feedback_records = []
    try:
        feedback_records = get_all_passenger_feedback_for_ml()
        print(f"Loaded {len(feedback_records)} verified passenger feedback records from SQLite.")
    except Exception as e:
        print(f"Database feedback query notice: {e} (continuing with baseline dataset)")

    # 2. Trigger retraining
    engine = TrainlyMLEngine()
    engine.retrain_from_dataset(feedback_data=feedback_records)
    print("Retraining completed successfully! Quantile models serialized to backend/ml/*.joblib")

if __name__ == "__main__":
    main()
