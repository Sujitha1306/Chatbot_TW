import pandas as pd
import re
from backend.app.core.facility_lookup import get_facility_lookup
from backend.app.core.term_lookup import get_term_lookup
from backend.app.core.entity_lookups import get_user_lookup, get_location_lookup

def _clean_column_name(col: str) -> str:
    col = str(col)
    mapping = {
        "count()": "Total Count",
        "avg(tat_minutes)": "Average TAT (Minutes)",
        "sum(tat_minutes)": "Total TAT (Minutes)",
        "tat_minutes": "TAT (Minutes)",
        "avg_tat_minutes": "Average TAT (Minutes)",
        "facility_id": "Facility",
        "pool_name_id": "Pool Name",
        "pool_location_id": "Pool Location",
        "requester_user_id": "Requester",
        "porter_user_id": "Porter",
        "request_user_id": "Requester",
        "source_id": "Source",
        "destination_id": "Destination",
        "request_category": "Request Category",
        "asset_category": "Asset Category",
        "request_type_id": "Request Type",
        "service_group_id": "Service Group",
    }
    if col in mapping:
        return mapping[col]
        
    if col.startswith("countIf"): return "Count"
    if col.startswith("avgIf"): return "Average"
    if col.startswith("sumIf"): return "Total"

    clean = re.sub(r'_id$', '', col).replace("_", " ")
    return clean.title()

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
    user_lookup = get_user_lookup()
    location_lookup = get_location_lookup()

    if "facility_id" in df.columns:
        df["facility_id"] = df["facility_id"].apply(
            lambda fid: _resolve_facility_id(fid, facility_lookup)
        )
        
    if "customer_id" in df.columns:
        df["customer_id"] = df["customer_id"].apply(facility_lookup.resolve_customer)
        
    if "region_id" in df.columns:
        df["region_id"] = df["region_id"].apply(facility_lookup.resolve_region)
        
    for user_col in ["requester_user_id", "porter_user_id", "request_user_id"]:
        if user_col in df.columns:
            df[user_col] = df[user_col].apply(user_lookup.resolve)
            
    for loc_col in ["source_id", "destination_id", "pool_location_id"]:
        if loc_col in df.columns:
            df[loc_col] = df[loc_col].apply(location_lookup.resolve)

    # Resolve any remaining string column using dim_app_terms, excluding the major IDs
    EXCLUDED_COLS = {
        "facility_id", "id", "customer_id", "region_id", 
        "request_id", "asset_id", "request_detail_id", 
        "porter_user_id", "requester_user_id", "request_user_id", "user_id",
        "source_id", "destination_id", "pool_location_id"
    }
    for col in df.select_dtypes(include=["object", "string", "category"]).columns:
        if col not in EXCLUDED_COLS:
            df[col] = df[col].apply(lambda x: term_lookup.resolve(x) if isinstance(x, str) else x)

    # Filter out unresolved IDs/codes based on user feedback
    for col in df.columns:
        if col in ["requester_user_id", "porter_user_id", "request_user_id", "user_id"]:
            # If the resolved value is just a number, it wasn't resolved
            mask = df[col].astype(str).str.match(r'^\d+$')
            df = df[~mask]
        elif col in ["pool_name_id", "pool_location_id", "source_id", "destination_id", "request_type_id", "service_group_id"]:
            # If it still matches PN-, PL-, PR-, etc. after resolution
            mask = df[col].astype(str).str.match(r'^(PN|PL|PR|ATS|RQ)-[A-Z0-9]+$')
            df = df[~mask]

    df = df.rename(columns=lambda c: _clean_column_name(c))
    return df
