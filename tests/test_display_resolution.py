import pandas as pd
from backend.app.core.term_lookup import TermLookup, STATIC_FALLBACK_TERMS
from backend.app.core.display_resolution import _resolve_facility_id

def test_unknown_status_code_falls_back_to_raw_code():
    lookup = TermLookup()
    lookup._by_code = {"RQ-CO": "Completed"}  # simulate a minimal loaded state
    assert lookup.resolve("RQ-ZZ") == "RQ-ZZ"  # never-seen code → raw code, unchanged

def test_known_status_code_resolves_correctly():
    lookup = TermLookup()
    lookup._by_code = {"RQ-CO": "Completed"}
    assert lookup.resolve("RQ-CO") == "Completed"

def test_unknown_facility_id_falls_back_to_raw_id():
    class FakeFacilityLookup:
        def get(self, fid): return None  # simulates an unknown facility
    assert _resolve_facility_id("9999", FakeFacilityLookup()) == "9999"

def test_known_facility_id_resolves_to_name():
    class FakeFacilityLookup:
        def get(self, fid): return {"facility_name": "Aster CMI Hospital"}
    assert _resolve_facility_id("0003", FakeFacilityLookup()) == "Aster CMI Hospital"

def test_malformed_facility_record_falls_back_to_raw_id():
    class FakeFacilityLookup:
        def get(self, fid): return {}  # record exists but has no facility_name key
    assert _resolve_facility_id("0003", FakeFacilityLookup()) == "0003"

def test_live_table_null_value_does_not_override_static_fallback():
    # Simulates dim_app_terms having a row for ATS-MAIN with a NULL/empty value —
    # should NOT produce a blank, should keep the static fallback's "Under Maintenance"
    lookup = TermLookup()
    fake_live_df = pd.DataFrame({"code": ["ATS-MAIN"], "value": [None]})
    filtered = fake_live_df[fake_live_df["value"].notna()]
    live_terms = dict(zip(filtered["code"], filtered["value"]))
    merged = {**STATIC_FALLBACK_TERMS, **live_terms}
    assert merged["ATS-MAIN"] == "Under Maintenance"  # static fallback preserved,
                                                          # NOT overwritten with blank
