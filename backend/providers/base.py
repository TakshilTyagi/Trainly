"""
base.py - Train Data Provider Abstract Base Class
Defines interface for Indian Railways NTES live and simulated data ingestion.
Allows swapping unofficial NTES scrapers with official CRIS Project Pravah feeds.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class TrainDataProvider(ABC):
    @abstractmethod
    def get_train_position(self, train_no: str) -> Dict[str, Any]:
        """Returns live lat, lon, speed, current section, and timestamp."""
        pass

    @abstractmethod
    def get_train_journey(self, train_no: str) -> Dict[str, Any]:
        """Returns full station-by-station journey log: completed, current, and upcoming stops."""
        pass

    @abstractmethod
    def get_train_eta(self, train_no: str) -> Dict[str, Any]:
        """Returns predicted arrival and departure for all upcoming stops with confidence."""
        pass

    @abstractmethod
    def get_fleet_summary(self) -> List[Dict[str, Any]]:
        """Returns overview status, delay, and confidence for all tracked trains."""
        pass
