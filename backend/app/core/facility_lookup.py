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
        self._all: list[dict] = []
        self.refresh()

    def refresh(self) -> None:
        db = ClickHouseConnection()
        df = db.client.query_df("SELECT * FROM ovitag_dw.dim_facility")
        self._all = df.to_dict("records")
        self._by_id = {row["facility_id"]: row for row in self._all}
        logger.info(f"Facility lookup loaded: {len(self._all)} facilities")

    def get(self, facility_id: str) -> dict | None:
        return self._by_id.get(facility_id)

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
