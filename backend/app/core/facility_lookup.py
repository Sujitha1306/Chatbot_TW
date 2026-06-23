"""
In-memory facility lookup, refreshed from ClickHouse on startup.
Small dataset (~95 rows) — safe to hold entirely in memory.
"""
from backend.app.db.clickhouse import ClickHouseConnection
import logging

logger = logging.getLogger(__name__)


class FacilityLookup:
    def __init__(self):
        self._by_id: dict[str, dict] = {}
        self._customer_by_id: dict[str, str] = {}
        self._region_by_id: dict[str, str] = {}
        self._all: list[dict] = []
        self.refresh()

    def refresh(self) -> None:
        db = ClickHouseConnection()
        df = db.client.query_df("SELECT * FROM ovitag_dw.dim_facility")
        self._all = df.to_dict("records")
        self._by_id = {str(row["facility_id"]): row for row in self._all}
        
        # Build customer and region lookup mappings from dim_facility
        self._customer_by_id = {str(row["customer_id"]): str(row["customer_name"]) for row in self._all if row.get("customer_id") and row.get("customer_name")}
        self._region_by_id = {str(row["region_id"]): str(row["region_name"]) for row in self._all if row.get("region_id") and row.get("region_name")}
        
        logger.info(f"Facility lookup loaded: {len(self._all)} facilities, {len(self._customer_by_id)} customers, {len(self._region_by_id)} regions")

    def get(self, facility_id: str) -> dict | None:
        if facility_id is None:
            return None
        return self._by_id.get(str(facility_id))

    def resolve_customer(self, customer_id) -> str:
        import pandas as pd
        if customer_id is None or pd.isna(customer_id):
            return customer_id
        cid_str = str(int(customer_id)) if isinstance(customer_id, float) else str(customer_id)
        return self._customer_by_id.get(cid_str, customer_id)

    def resolve_region(self, region_id) -> str:
        import pandas as pd
        if region_id is None or pd.isna(region_id):
            return region_id
        rid_str = str(int(region_id)) if isinstance(region_id, float) else str(region_id)
        return self._region_by_id.get(rid_str, region_id)

    def list_all(self) -> list[dict]:
        """Returns all facilities for the frontend filter dropdown."""
        return sorted(self._all, key=lambda r: (r["customer_name"], r["region_name"], r["facility_name"]))

    def search(self, query: str) -> list[dict]:
        """Fuzzy search across name/region/customer for the filter UI."""
        q = query.lower()
        return [
            r for r in self._all
            if q in r["facility_name"].lower()
            or q in r["region_name"].lower()
            or q in r["customer_name"].lower()
            or q in r["facility_id"].lower()
        ]


_lookup: FacilityLookup | None = None

def get_facility_lookup() -> FacilityLookup:
    global _lookup
    if _lookup is None:
        _lookup = FacilityLookup()
    return _lookup
