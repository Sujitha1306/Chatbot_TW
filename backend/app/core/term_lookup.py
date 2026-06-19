"""
In-memory lookup for app_terms (status codes, categories, etc.),
mirroring the FacilityLookup pattern from Phase 8.2. Refreshed from
ClickHouse on startup. If dim_app_terms is unavailable or missing
specific codes, this falls back to the static dict.
"""
import logging
from backend.app.db.clickhouse import ClickHouseConnection

logger = logging.getLogger(__name__)

STATIC_FALLBACK_TERMS = {
    "RQ-CO": "Completed", "RQ-CA": "Cancelled", "RQ-IP": "In Progress",
    "RQ-AS": "Accepted", "RQ-AC": "Accepted", "RQ-AR": "Arrived",
    "RQ-OH": "On Hold", "RQ-RJ": "Rejected",
    "PR-PA": "Patient Transport", "PR-SE": "Service Request",
    "ATS-MAIN": "Under Maintenance", "ATS-INU": "In Use",
    "ATS-ONB": "Onboarded", "CRT-CT": "Critical", "CRT-NCT": "Non-Critical",
}

class TermLookup:
    def __init__(self):
        self._by_code: dict[str, str] = {}
        self.refresh()

    def refresh(self) -> None:
        try:
            db = ClickHouseConnection()
            df = db.client.query_df("SELECT code, value FROM ovitag_dw.dim_app_terms")
            if df.empty:
                raise ValueError("dim_app_terms returned no rows")

            # Guard against rows with a real code but a NULL/empty value —
            # these should NOT override the static fallback or produce a
            # blank display. Only keep rows where value is genuinely usable.
            df = df[df["value"].notna() & (df["value"].astype(str).str.strip() != "")]

            live_terms = dict(zip(df["code"], df["value"]))
            # Merge: live data takes priority, but static fallback fills
            # any gaps the live query didn't cover (e.g. ATS-MAIN/ATS-INU)
            self._by_code = {**STATIC_FALLBACK_TERMS, **live_terms}
            logger.info(f"Term lookup loaded: {len(live_terms)} from dim_app_terms, "
                        f"{len(self._by_code) - len(live_terms)} from static fallback only")
        except Exception as e:
            logger.warning(f"dim_app_terms unavailable ({e}), using static fallback only")
            self._by_code = dict(STATIC_FALLBACK_TERMS)

    def resolve(self, code: str) -> str:
        """Returns the human-readable value, or the original code if unknown."""
        return self._by_code.get(code, code)

    def resolve_many(self, codes: list[str]) -> dict[str, str]:
        return {c: self.resolve(c) for c in codes}

_term_lookup: TermLookup | None = None

def get_term_lookup() -> TermLookup:
    global _term_lookup
    if _term_lookup is None:
        _term_lookup = TermLookup()
    return _term_lookup
