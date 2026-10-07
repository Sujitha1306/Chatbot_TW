import pandas as pd
import re
from backend.app.core.facility_lookup import get_facility_lookup
from backend.app.core.term_lookup import get_term_lookup
from backend.app.core.entity_lookups import get_user_lookup, get_location_lookup

def _clean_column_name(col: str) -> str:
    col = str(col)
    mapping = {
        # Identifier columns KEEP the "ID" suffix on purpose. Stripping it left
        # "Request", which downstream logic then read as a numeric measure and
        # ran outlier detection over — producing nonsense like "the highest
        # request IDs are statistical outliers". "ID" in the name marks it as a
        # dimension, so it is excluded from statistics.
        "request_id": "Request ID",
        "request_detail_id": "Request Detail ID",
        "patient_id": "Patient ID",
        "asset_id": "Asset ID",
        "id": "ID",
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
        "location_id": "Location",
        "home_location_id": "Home Location",
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
            
    # NUMERIC location ids resolve against dim_location. pool_location_id is
    # deliberately NOT in this list: it holds codes like 'PL-BW', which live in
    # dim_app_terms, not dim_location. Routing it here left every pool value
    # unresolved (and, with the old drop-filter below, deleted the whole row).
    for loc_col in ["source_id", "destination_id", "location_id", "home_location_id"]:
        if loc_col in df.columns:
            df[loc_col] = df[loc_col].apply(location_lookup.resolve)

    # Pool columns are dim_app_terms codes: PN-* (PoolName), PL-* (PoolLocation).
    for pool_col in ["pool_name_id", "pool_location_id"]:
        if pool_col in df.columns:
            df[pool_col] = df[pool_col].apply(
                lambda x: term_lookup.resolve(x) if isinstance(x, str) else x
            )

    # Resolve any remaining string column using dim_app_terms, excluding the major IDs
    EXCLUDED_COLS = {
        "facility_id", "id", "customer_id", "region_id",
        "request_id", "asset_id", "request_detail_id",
        "porter_user_id", "requester_user_id", "request_user_id", "user_id",
        "source_id", "destination_id", "pool_location_id", "pool_name_id",
        "location_id", "home_location_id"
    }
    for col in df.select_dtypes(include=["object", "string", "category"]).columns:
        if col not in EXCLUDED_COLS:
            df[col] = df[col].apply(lambda x: term_lookup.resolve(x) if isinstance(x, str) else x)

    # NOTE: this used to DROP every row whose id/code failed to resolve, which
    # silently deleted real results — a waitlisted request with an unmapped pool
    # simply vanished from the table while still being counted in the summary.
    # Unresolved values are now left as the raw code so the row survives and the
    # table always agrees with the stated totals.

    df = df.rename(columns=lambda c: _clean_column_name(c))

    # porter_user_id is resolved to a person's name above, so a query that ALSO
    # selected concat(first_name, last_name) yields two columns holding the same
    # text ("Porter" and "Porter Name"). Drop the redundant one — it clutters the
    # table and made summaries read "Porter = reetu, Porter Name = reetu".
    # Compared with whitespace stripped: concat(first_name,' ',last_name) leaves
    # a trailing space when last_name is NULL, so "reetu " and "reetu" are the
    # same person but not equal strings.
    def _normalised(series):
        return series.astype(str).str.strip()

    for col in list(df.columns):
        for twin in list(df.columns):
            if (col != twin and col in df.columns and twin in df.columns
                    and twin.startswith(col)
                    and _normalised(df[col]).equals(_normalised(df[twin]))):
                df = df.drop(columns=[twin])

    return df
