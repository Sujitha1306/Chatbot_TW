# client_demo_backup.py
# Fallback demo data for when ClickHouse is unreachable during client demos

import pandas as pd

class DemoBackup:
    """Provides hardcoded sample data when live DB is unavailable."""

    PORTER_DEMO = pd.DataFrame({
        "facility_id": ["0184", "0184", "0185", "0185", "0186"],
        "porter_user_id": [101, 102, 103, 101, 104],
        "status": ["RQ-CO", "RQ-CO", "RQ-CA", "RQ-IP", "RQ-CO"],
        "request_category": ["PR-PA", "PR-SE", "PR-PA", "PR-SE", "PR-PA"],
        "tat_minutes": [12.5, 8.3, None, 5.1, 22.7],
        "scheduled_time": pd.to_datetime([
            "2025-06-01 08:00", "2025-06-01 09:30",
            "2025-06-01 10:00", "2025-06-01 11:15", "2025-06-01 13:00"
        ]),
    })

    ASSET_DEMO = pd.DataFrame({
        "id": [1, 2, 3, 4, 5],
        "name": ["MRI Scanner", "Wheelchair", "IV Pole", "Defibrillator", "Ventilator"],
        "asset_status": ["AVAILABLE", "IN_USE", "AVAILABLE", "UNDER_MAINTENANCE", "AVAILABLE"],
        "criticality": ["Critical", "Low", "Low", "Critical", "Critical"],
        "facility_id": ["0184", "0184", "0185", "0184", "0186"],
        "asset_cost": [1500000.0, 8000.0, 1200.0, 45000.0, 280000.0],
        "warranty_due": pd.to_datetime([
            "2026-12-01", "2025-08-01", "2027-03-15", "2026-06-30", "2028-01-01"
        ]),
    })

    def get_porter_data(self) -> pd.DataFrame:
        return self.PORTER_DEMO.copy()

    def get_asset_data(self) -> pd.DataFrame:
        return self.ASSET_DEMO.copy()

    def get_data_for_domain(self, domain: str) -> pd.DataFrame:
        if domain == "asset":
            return self.get_asset_data()
        return self.get_porter_data()
