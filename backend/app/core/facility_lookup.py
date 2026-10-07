"""
In-memory facility lookup, refreshed from ClickHouse ovitag_live_dw.dim_customer on startup.
"""
from backend.app.db.clickhouse import ClickHouseConnection
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class FacilityLookup:
    def __init__(self):
        self._by_id: dict[str, dict] = {}
        self._customer_by_id: dict[str, str] = {}
        self._region_by_id: dict[str, str] = {}
        self._all: list[dict] = []
        self.refresh()

    def refresh(self) -> None:
        try:
            db = ClickHouseConnection()
            df, success = db.execute_query("SELECT id, name, parent_id FROM ovitag_live_dw.dim_customer")
            if not success or df.empty:
                logger.error("Failed to load dim_customer from ClickHouse or table is empty")
                return
            
            records = df.to_dict("records")
            node_map = {str(r["id"]).zfill(4): r for r in records if pd.notna(r["id"])}
            
            self._by_id = {}
            self._all = []
            
            for node_id, node in node_map.items():
                facility_name = str(node["name"]) if pd.notna(node["name"]) else ""
                
                region_id = node.get("parent_id")
                region_name = ""
                customer_id = None
                customer_name = ""
                
                if pd.notna(region_id):
                    region_id_str = str(region_id).zfill(4)
                    region_node = node_map.get(region_id_str)
                    if region_node:
                        region_name = str(region_node["name"]) if pd.notna(region_node["name"]) else ""
                        customer_id = region_node.get("parent_id")
                        if pd.notna(customer_id):
                            customer_id_str = str(customer_id).zfill(4)
                            customer_node = node_map.get(customer_id_str)
                            if customer_node:
                                customer_name = str(customer_node["name"]) if pd.notna(customer_node["name"]) else ""
                                
                record = {
                    "facility_id": node_id,
                    "facility_name": facility_name,
                    "region_id": str(region_id).zfill(4) if pd.notna(region_id) else "",
                    "region_name": region_name,
                    "customer_id": str(customer_id).zfill(4) if pd.notna(customer_id) else "",
                    "customer_name": customer_name
                }
                self._by_id[node_id] = record
                self._all.append(record)
                
            self._customer_by_id = {str(r["customer_id"]).zfill(4): str(r["customer_name"]) for r in self._all if r.get("customer_id") and r.get("customer_name")}
            self._region_by_id = {str(r["region_id"]).zfill(4): str(r["region_name"]) for r in self._all if r.get("region_id") and r.get("region_name")}
            
            logger.info(f"Facility lookup loaded from dim_customer: {len(self._all)} nodes")
        except Exception as e:
            logger.error(f"Failed to refresh facility lookup: {e}")

    def get(self, facility_id: str) -> dict | None:
        if facility_id is None or pd.isna(facility_id):
            return None
        fid_str = str(int(facility_id)) if isinstance(facility_id, float) else str(facility_id).strip()
        return self._by_id.get(fid_str.zfill(4)) or self._by_id.get(fid_str)

    def resolve_customer(self, customer_id) -> str:
        if customer_id is None or pd.isna(customer_id):
            return customer_id
        cid_str = str(int(customer_id)) if isinstance(customer_id, float) else str(customer_id)
        return self._customer_by_id.get(cid_str.zfill(4), cid_str)

    def resolve_region(self, region_id) -> str:
        if region_id is None or pd.isna(region_id):
            return region_id
        rid_str = str(int(region_id)) if isinstance(region_id, float) else str(region_id)
        return self._region_by_id.get(rid_str.zfill(4), rid_str)

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
