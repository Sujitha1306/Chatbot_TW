import pandas as pd
from backend.app.core.facility_lookup import get_facility_lookup
from backend.app.core.term_lookup import get_term_lookup

def _resolve_facility_id(fid, facility_lookup) -> str:
    """
    Returns the facility's display name if known, otherwise the raw
    facility_id unchanged. NEVER returns blank/None/a wrong guess.
    """
    if fid is None or (isinstance(fid, float) and pd.isna(fid)):
        return fid  # preserve actual missing values as-is, don't stringify NaN
    record = facility_lookup.get(fid)
    if record is None:
        return fid  # unknown facility — show the raw ID, exactly as requested
    return record.get("facility_name", fid)  # malformed record — still falls back to raw ID

def _resolve_display_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns a COPY of df with facility_id and known status/category
    columns replaced by their human-readable names, for use in the
    summary prompt and chart labels. The ORIGINAL df (with raw codes)
    is still used for SQL/data-table display, since the AI-generated
    SQL panel should show real column values as ClickHouse returned
    them — only the SUMMARY and CHART layers get the friendly names.
    """
    df = df.copy()
    facility_lookup = get_facility_lookup()
    term_lookup = get_term_lookup()

    if "facility_id" in df.columns:
        df["facility_id"] = df["facility_id"].apply(
            lambda fid: _resolve_facility_id(fid, facility_lookup)
        )

    # Resolve any column that looks like it holds app-term codes —
    # status, request_category, asset_status, criticality
    CODE_LIKE_COLUMNS = ["status", "request_category", "asset_status", "criticality"]
    for col in CODE_LIKE_COLUMNS:
        if col in df.columns:
            df[col] = df[col].apply(term_lookup.resolve)

    return df
