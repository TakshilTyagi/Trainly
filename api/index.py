"""
api/index.py - Vercel Serverless Function entrypoint for FastAPI
"""

import sys
import os

# Add root directory to sys.path so 'backend.*' imports resolve cleanly
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Import the FastAPI instance
from backend.main import app
