"""
Data freshness / coverage awareness.

The warehouse is loaded in batches and can lag "today" by weeks. Without this,
the pipeline happily generates a perfectly correct query for "yesterday",
gets 0 rows back, and reports that as a real zero — which reads to the user
as a broken bot.

This module answers two questions:
  1. What date range does this facility actually have data for? (cached)
  2. Does the question's requested period fall outside that range?

Timestamps in the warehouse are UTC; everything exposed here is Asia/Kolkata,
because that is what the user means by "a day".
"""
from __future__ import annotations

import logging
import re
import threading
import time
from datetime import date, datetime, timedelta, timezone

logger = logging.getLogger(__name__)

IST = "Asia/Kolkata"

# Coverage rarely changes mid-session; re-probe at most every 10 minutes.
_TTL_SECONDS = 600
_cache: dict[str, tuple[float, dict]] = {}
_lock = threading.Lock()

# Rows far in the future/past exist from a known ingestion bug (year 2084,
# year 1970). Bound the probe so they don't masquerade as real coverage.
_SANE_WINDOW = "scheduled_time >= '2015-01-01 00:00:00' AND scheduled_time <= now() + INTERVAL 1 DAY"


def get_coverage(facility_id: str, db=None) -> dict:
    """
    Returns {"earliest": date|None, "latest": date|None, "ok": bool} in IST.
    Never raises — on any failure returns ok=False so callers stay silent
    rather than making a claim they cannot support.
    """
    fid = str(facility_id or "").strip()
    now = time.time()

    with _lock:
        hit = _cache.get(fid)
        if hit and (now - hit[0]) < _TTL_SECONDS:
            return hit[1]

    result = {"earliest": None, "latest": None, "ok": False}
    try:
        if db is None:
            from backend.app.db.clickhouse import ClickHouseConnection
            db = ClickHouseConnection()

        df = db.client.query_df(
            f"""
            SELECT
              toString(min(toTimeZone(scheduled_time, '{IST}'))) AS earliest_ist,
              toString(max(toTimeZone(scheduled_time, '{IST}'))) AS latest_ist
            FROM fact_porter_request
            WHERE facility_id = %(fid)s AND {_SANE_WINDOW}
            """,
            parameters={"fid": fid},
        )
        if not df.empty and df.iloc[0]["latest_ist"]:
            result = {
                "earliest": _to_date(df.iloc[0]["earliest_ist"]),
                "latest": _to_date(df.iloc[0]["latest_ist"]),
                "ok": True,
            }
    except Exception as e:  # pragma: no cover - depends on live warehouse
        logger.warning("Data freshness probe failed for facility %s: %s", fid, e)

    with _lock:
        _cache[fid] = (now, result)
    return result


def _to_date(value) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def build_freshness_note(facility_id: str, db=None) -> str:
    """
    A short block injected into the planner and SQL prompts so the model knows
    what "recent" actually means here and stops inventing a current-month filter
    that can only ever return nothing.
    """
    cov = get_coverage(facility_id, db)
    if not cov["ok"] or not cov["latest"]:
        return ""

    latest, earliest = cov["latest"], cov["earliest"]
    today_ist = _today_ist()
    lag_days = (today_ist - latest).days

    note = (
        f"\n### DATA COVERAGE (Asia/Kolkata)\n"
        f"This facility has porter data from {earliest:%d-%b-%Y} to {latest:%d-%b-%Y}.\n"
        f"Today is {today_ist:%d-%b-%Y}."
    )
    if lag_days > 1:
        note += (
            f"\nThe warehouse is {lag_days} days behind — there is NO data for the last"
            f" {lag_days} days, so 'today', 'yesterday' and 'this month' will legitimately"
            f" return zero. Still write the query exactly as asked for the period the user"
            f" requested; do NOT silently substitute a different period. The application"
            f" explains the gap to the user separately."
        )
    return note + "\n"


def _today_ist() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).date()


# ── Requested-period extraction ───────────────────────────────────────────
# Reads the date window out of the generated SQL rather than the question,
# so it reflects what was actually queried.

_DATE_LITERAL = re.compile(r"'(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}:\d{2})?'")
_RELATIVE_TODAY = re.compile(r"\b(today\(\)|now\(\))", re.IGNORECASE)


def requested_period(sql: str) -> tuple[date | None, date | None]:
    """
    Best-effort (min, max) of the date literals appearing in the SQL.
    Returns (None, None) when the query has no explicit date filter.
    """
    found: list[date] = []
    for y, m, d in _DATE_LITERAL.findall(sql or ""):
        try:
            found.append(date(int(y), int(m), int(d)))
        except ValueError:
            continue
    # Ignore the sanity-bound sentinel years used in boilerplate filters.
    found = [d for d in found if 2015 <= d.year <= 2100]
    if not found:
        return (None, None)
    return (min(found), max(found))


_TIME_BASIS_LABELS = {
    "scheduled_time": "when the request was created",
    "completed_time": "when the request was completed",
    "assigned_time": "when the porter was assigned",
    "cancelled_time": "when the request was cancelled",
    "accepted_time": "when the request was accepted",
    "arrived_time": "when the porter arrived",
}


def _is_exclusive_upper(sql: str, end: date) -> bool:
    """True when `end` appears as a strict `<` bound (a half-open range)."""
    return bool(re.search(rf"<\s*(?:toDateTime\s*\(\s*)?'{end:%Y-%m-%d}", sql or ""))


def describe_time_scope(sql: str, facility_id: str = "", db=None) -> str:
    """
    A one-line statement of WHICH period the result covers and WHICH timestamp
    it was measured on, for the summary prompt.

    Without this the assistant writes "shifts account for 120,274 requests"
    with no period at all, and the reader assumes it means recently.
    """
    sql = sql or ""
    basis = next(
        (label for col, label in _TIME_BASIS_LABELS.items()
         if re.search(rf"\b{col}\s*(?:>=|<=|>|<|=|BETWEEN)", sql, re.IGNORECASE)),
        "",
    )
    start, end = requested_period(sql)

    if start is None:
        cov = get_coverage(facility_id, db) if facility_id else {"ok": False}
        if cov.get("ok") and cov.get("earliest") and cov.get("latest"):
            return (f"PERIOD COVERED: no date filter was applied — this result spans ALL "
                    f"recorded data, {cov['earliest']:%d %b %Y} to {cov['latest']:%d %b %Y}. "
                    f"You MUST state this full range; never imply it is recent or current.")
        return ("PERIOD COVERED: no date filter was applied — this result spans all "
                "recorded history. State that explicitly.")

    # A half-open range `>= 1 Jun AND < 2 Jun` covers ONE day. Reporting it as
    # "1 Jun to 2 Jun" makes a single-day figure look like a two-day total.
    if end and end != start and _is_exclusive_upper(sql, end):
        end = end - timedelta(days=1)

    if end and end != start:
        period = f"{start:%d %b %Y} to {end:%d %b %Y}"
    else:
        period = f"{start:%d %b %Y}"
    line = f"PERIOD COVERED: {period} (Asia/Kolkata)."
    if basis:
        line += f" Measured on {basis} — say so if it affects how the number should be read."
    return line


def explain_empty_result(sql: str, facility_id: str, db=None) -> str:
    """
    Called ONLY when a query returned no rows. Returns a plain-English
    explanation if the emptiness is explained by data coverage, else "".
    """
    cov = get_coverage(facility_id, db)
    if not cov["ok"] or not cov["latest"]:
        return ""

    latest, earliest = cov["latest"], cov["earliest"]
    start, end = requested_period(sql)

    # Relative "today"/"yesterday" queries carry no date literal — judge those
    # against the warehouse lag directly.
    if start is None:
        if _RELATIVE_TODAY.search(sql or "") and (_today_ist() - latest).days > 1:
            return (
                f"There is no data for that period yet. Porter records for this facility "
                f"currently run through {latest:%d %b %Y}, and the warehouse has not been "
                f"loaded since then."
            )
        return ""

    if start > latest:
        return (
            f"There is no data for that period. Porter records for this facility currently "
            f"run from {earliest:%d %b %Y} to {latest:%d %b %Y}, so nothing has been "
            f"recorded for the dates you asked about."
        )
    if end and end < earliest:
        return (
            f"That period is before this facility's records begin. Porter data starts on "
            f"{earliest:%d %b %Y} and runs to {latest:%d %b %Y}."
        )
    return ""


def reset_cache() -> None:
    """Test hook / used by the admin refresh endpoint."""
    with _lock:
        _cache.clear()
