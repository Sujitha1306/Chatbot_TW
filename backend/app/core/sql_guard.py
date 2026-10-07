"""
Deterministic guard rails for generated ClickHouse SQL.

Prompt rules alone are not reliable — the model drifts back to `count(id)` and
naive date literals. This module enforces the handful of rules that silently
corrupt results, in two tiers:

  autofix_sql()  - mechanical, unambiguous rewrites applied in place
  validate_sql() - structural problems that need the model to re-plan; the
                   returned messages are fed back through fix_sql()

Scope: only applies to queries that touch fact_porter_request.
"""
from __future__ import annotations

import re

PORTER_TABLE = "fact_porter_request"

TIME_COLUMNS = (
    "scheduled_time", "completed_time", "assigned_time", "accepted_time",
    "arrived_time", "cancelled_time", "onhold_time", "inprogress_time",
    "rejected_time", "start_time", "end_time",
)

# Codes verified against dim_app_terms. Anything else is a hallucination.
VALID_STATUS_CODES = {
    "RQ-CO", "RQ-WT", "RQ-CA", "RQ-CR", "RQ-AS", "RQ-AR", "RQ-IP", "RQ-HLD",
    "RQ-RJ", "RQ-NR", "RQ-NS", "RQ-PLN", "RQ-SH", "RQ-RAS", "RQ-PEN",
    "RQ-DISP", "RQ-PKG", "RQ-PRW", "RQ-REQ", "RQ-RCR", "RQ-RTN", "RQ-SCSSD",
    "RQ-STO",
}
# Frequently hallucinated codes -> the real one.
STATUS_ALIASES = {
    "RQ-OH": "RQ-HLD",   # On Hold
    "RQ-AC": "RQ-AS",    # Accepted
    "RQ-WL": "RQ-WT",    # Waitlisted
    "RQ-WAIT": "RQ-WT",
    "RQ-COMP": "RQ-CO",
    "RQ-CAN": "RQ-CA",
}

_TIME_COL_ALT = "|".join(TIME_COLUMNS)

# `scheduled_time >= '2026-06-01'` — a raw literal, no timezone applied.
_NAIVE_CMP = re.compile(
    rf"\b(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?({_TIME_COL_ALT})\s*(>=|<=|!=|<>|=|<|>)\s*"
    r"'(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?'",
    re.IGNORECASE,
)

# `BETWEEN '...' AND '...'`
_NAIVE_BETWEEN = re.compile(
    rf"\b(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?({_TIME_COL_ALT})\s+BETWEEN\s+"
    r"'(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?'\s+AND\s+"
    r"'(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?'",
    re.IGNORECASE,
)

# Row-counting forms that overcount because of the detail-line fan-out.
_BAD_COUNT = re.compile(
    r"\bcount\s*\(\s*(?:\*\s*|)\)"                      # count()  count(*)
    r"|\bcount\s*\(\s*(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?(?:id|request_id|request_detail_id)\s*\)",
    re.IGNORECASE,
)

# `toDateTime('2026-06-01 00:00:00')` with no timezone argument — reads as UTC,
# so the day boundary lands 5h30m off.
_TZLESS_TODATETIME = re.compile(
    r"\btoDateTime\s*\(\s*'(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?'\s*\)",
    re.IGNORECASE,
)

# Date-part functions applied straight to a UTC column (no toTimeZone).
_NAIVE_DATE_PART = re.compile(
    r"\b(toDate|toHour|toStartOfDay|toStartOfHour|toStartOfWeek|toStartOfMonth|"
    r"toMonth|toYear|toDayOfWeek|toDayOfMonth|toDate32|toStartOfQuarter)\s*\(\s*"
    rf"((?:[a-zA-Z_][a-zA-Z0-9_]*\.)?(?:{_TIME_COL_ALT}))\s*\)",
    re.IGNORECASE,
)

# Joining a PN-/PL- code column against the numeric dim_location.
_BAD_POOL_JOIN = re.compile(
    r"(pool_location_id|pool_name_id)\s*=\s*toString\s*\(|"
    r"toString\s*\([^)]*dim_location[^)]*\)\s*=\s*(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?(pool_location_id|pool_name_id)",
    re.IGNORECASE,
)

# A human name matched against a pool code column.
_POOL_NAME_MATCH = re.compile(
    r"(pool_name_id|pool_location_id)\s+(?:I?LIKE|=)\s*'([^']*)'",
    re.IGNORECASE,
)

_STATUS_MATCH = re.compile(
    r"status\s*(?:=|I?LIKE|IN\s*\()\s*'([^']*)'", re.IGNORECASE
)

# ClickHouse only supports equality in JOIN ON. A range/BETWEEN condition there
# fails with "Code: 403. Unsupported JOIN ON conditions".
_JOIN_ON_CLAUSE = re.compile(
    r"\bON\b(.*?)(?=\b(?:LEFT|RIGHT|INNER|FULL|CROSS|JOIN|WHERE|GROUP\s+BY|"
    r"ORDER\s+BY|HAVING|LIMIT|UNION)\b|$)",
    re.IGNORECASE | re.DOTALL,
)
_NON_EQUI = re.compile(r"(<=|>=|<>|!=|(?<![<>!])[<>](?!=)|\bBETWEEN\b)", re.IGNORECASE)


def _touches_porter_table(sql: str) -> bool:
    return PORTER_TABLE in (sql or "").lower()


def _strip_strings(sql: str) -> str:
    """Blank out string literals so structural regexes don't match inside them."""
    return re.sub(r"'[^']*'", "''", sql or "")


# ── Tier 1: mechanical rewrites ──────────────────────────────────────────
def autofix_sql(sql: str) -> tuple[str, list[str]]:
    """
    Applies safe, unambiguous corrections. Returns (sql, notes).
    Never changes the shape of the query — only literals and function calls
    whose correct form is fully determined.
    """
    if not sql or not sql.strip():
        return sql, []

    notes: list[str] = []
    out = sql

    # 1. Timezone: bare date literal compared to a UTC timestamp column.
    def _cmp(m: re.Match) -> str:
        col, op, day, tod = m.group(1), m.group(2), m.group(3), m.group(4)
        return f"{col} {op} toDateTime('{day} {tod or '00:00:00'}', 'Asia/Kolkata')"

    out, n = _NAIVE_CMP.subn(_cmp, out)
    if n:
        notes.append(f"wrapped {n} naive date literal(s) in toDateTime(..., 'Asia/Kolkata')")

    def _between(m: re.Match) -> str:
        col, d1, t1, d2, t2 = m.groups()
        return (f"{col} BETWEEN toDateTime('{d1} {t1 or '00:00:00'}', 'Asia/Kolkata') "
                f"AND toDateTime('{d2} {t2 or '23:59:59'}', 'Asia/Kolkata')")

    out, n = _NAIVE_BETWEEN.subn(_between, out)
    if n:
        notes.append(f"converted {n} BETWEEN range(s) to Asia/Kolkata")

    out, n = _TZLESS_TODATETIME.subn(
        lambda m: f"toDateTime('{m.group(1)} {m.group(2) or '00:00:00'}', 'Asia/Kolkata')", out
    )
    if n:
        notes.append(f"added the Asia/Kolkata timezone to {n} toDateTime() boundary/boundaries")

    # 2. Timezone: date-part functions on a UTC column.
    out, n = _NAIVE_DATE_PART.subn(
        lambda m: f"{m.group(1)}(toTimeZone({m.group(2)}, 'Asia/Kolkata'))", out
    )
    if n:
        notes.append(f"wrapped {n} date function(s) in toTimeZone(..., 'Asia/Kolkata')")

    # 3. Hallucinated status codes.
    for wrong, right in STATUS_ALIASES.items():
        pattern = re.compile(rf"'{re.escape(wrong)}'", re.IGNORECASE)
        out, n = pattern.subn(f"'{right}'", out)
        if n:
            notes.append(f"corrected status code {wrong} -> {right}")

    # 4. Request counting. Skipped when the query already de-duplicates via
    #    DISTINCT, because count() over a de-duplicated subquery is correct
    #    and rewriting it could reference a column that is out of scope.
    if _touches_porter_table(out) and not re.search(r"\bdistinct\b", out, re.IGNORECASE):
        out, n = _BAD_COUNT.subn("uniqExact(request_id)", out)
        if n:
            notes.append(f"replaced {n} row-count(s) with uniqExact(request_id) "
                         f"(table is at request-detail grain)")

    return out, notes


# ── Tier 2: structural problems needing a re-plan ────────────────────────
def validate_sql(sql: str) -> list[str]:
    """
    Returns human-readable violations. Empty list means the query passed.
    Messages are written to be fed straight back to the model as an error.
    """
    if not sql or not sql.strip():
        return []

    problems: list[str] = []
    bare = _strip_strings(sql)

    if _BAD_POOL_JOIN.search(bare):
        problems.append(
            "INVALID JOIN: pool_location_id/pool_name_id were joined to "
            "ovitag_live_dw.dim_location. Those columns hold CODES such as 'PL-BW' and "
            "'PN-IN', while dim_location.id holds integers, so this join never matches "
            "and returns wrong results. Remove the dim_location join entirely and select "
            "the raw pool code column (the UI decodes it), or decode it via "
            "ovitag_live_dw.dim_app_terms ON pool_name_id = dim_app_terms.code."
        )

    for col, literal in _POOL_NAME_MATCH.findall(sql):
        cleaned = literal.strip("%").strip()
        if cleaned and not re.match(r"^(PN|PL)-", cleaned, re.IGNORECASE):
            problems.append(
                f"WRONG COLUMN FOR A NAME: {col} was matched against '{literal}'. "
                f"{col} only ever contains pool codes like 'PN-IN'/'PL-BW', never a "
                f"person's name. If '{cleaned}' is a porter, resolve them through "
                f"ovitag_live_dw.dim_user instead, e.g. porter_user_id IN "
                f"(SELECT id FROM ovitag_live_dw.dim_user WHERE first_name ILIKE "
                f"'%{cleaned}%' OR last_name ILIKE '%{cleaned}%'). To find which pool "
                f"or pool location that porter belongs to, join "
                f"ovitag_live_dw.fact_user_pool on user_id."
            )

    # fact_user_pool is empty for several facilities (0459 among them), so a
    # pool lookup that reads only that table silently reports "no data" for a
    # porter who plainly exists. It must always be unioned with the pools the
    # porter actually worked in.
    lowered = (sql or "").lower()

    # fact_user_pool has overlapping validity ranges per user, so counting it
    # double-counts and forces an unsupported range join against a calendar.
    if "fact_user_pool" in lowered and re.search(
        r"\b(uniqExact|uniq|count)\s*\(\s*(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?user_id\s*\)",
        bare, re.IGNORECASE,
    ):
        problems.append(
            "WRONG SOURCE FOR A PORTER COUNT: user_id is being counted from "
            "ovitag_live_dw.fact_user_pool. That table records pool ASSIGNMENTS with "
            "overlapping start_date/end_date ranges, so counting it double-counts and "
            "needs an unsupported range JOIN. To count porters — including 'how many "
            "porters were active' per month — use uniqExact(porter_user_id) on "
            "fact_porter_request and GROUP BY the date expression directly (recipe R10). "
            "fact_user_pool is only for 'which pool does porter X belong to'."
        )

    if "fact_user_pool" in lowered and PORTER_TABLE not in lowered:
        problems.append(
            "INCOMPLETE POOL LOOKUP: this reads ovitag_live_dw.fact_user_pool on its own. "
            "That table has no rows at all for several facilities, so the query returns "
            "an empty result for porters who clearly exist. UNION ALL it with a second "
            "branch that reads the pools the porter actually worked in from "
            "fact_porter_request, e.g.\n"
            "  SELECT f.porter_user_id, f.pool_name_id, f.pool_location_id,\n"
            "         'Pool worked in' AS pool_source, uniqExact(f.request_id) AS request_count\n"
            "  FROM fact_porter_request f\n"
            "  INNER JOIN ovitag_live_dw.dim_user u ON f.porter_user_id = u.id\n"
            "  WHERE f.facility_id = <facility> AND (u.first_name ILIKE <name> OR u.last_name ILIKE <name>)\n"
            "    AND f.pool_name_id IS NOT NULL AND f.pool_name_id != ''\n"
            "  GROUP BY f.porter_user_id, f.pool_name_id, f.pool_location_id\n"
            "Both branches must return the SAME columns in the SAME order. See recipe R5."
        )

    # groupArray() of names crams hundreds of values into one cell, which is
    # unreadable in a table and unusable in a chart. One row per entity instead.
    # Any groupArray EXCEPT one collecting tuples — `groupArray((a, b))` is the
    # legitimate idle-time pattern (recipe R8), everything else (a bare column,
    # or concat(first_name, last_name)) produces an unreadable list cell.
    if re.search(r"\bgroup(?:Uniq)?Array\s*\(\s*(?!\()", bare, re.IGNORECASE):
        problems.append(
            "UNREADABLE OUTPUT: groupArray() is collecting names or user ids into a "
            "single array cell. In the UI that renders as one enormous unreadable cell "
            "and cannot be sorted, filtered or charted. Return ONE ROW PER ENTITY "
            "instead: add the name/id column to both SELECT and GROUP BY, and use "
            "uniqExact(request_id) AS request_count as the measure. For example, "
            "'shift-wise porter count with names' should produce one row per "
            "(shift, porter) pair, not one row per shift holding a list of porters."
        )

    # uniqExact(x) while grouping BY x always returns 1 — a meaningless column.
    group_by = re.search(
        r"\bGROUP\s+BY\b(.*?)(?=\b(?:ORDER\s+BY|HAVING|LIMIT|UNION)\b|$)",
        bare, re.IGNORECASE | re.DOTALL,
    )
    if group_by:
        grouped = {
            g.strip().split(".")[-1].lower()
            for g in group_by.group(1).split(",")
            if re.fullmatch(r"[\w.]+", g.strip())
        }
        for counted in re.findall(r"\buniqExact\s*\(\s*([\w.]+)\s*\)", bare, re.IGNORECASE):
            if counted.split(".")[-1].lower() in grouped:
                problems.append(
                    f"MEANINGLESS MEASURE: uniqExact({counted}) is computed while also "
                    f"grouping BY {counted}, so it returns 1 on every row. Either remove "
                    f"{counted} from the GROUP BY to get a real distinct count, or count "
                    f"something else — for a per-porter breakdown use "
                    f"uniqExact(request_id) AS request_count."
                )
                break

    for on_clause in _JOIN_ON_CLAUSE.findall(bare):
        if _NON_EQUI.search(on_clause):
            problems.append(
                "UNSUPPORTED JOIN CONDITION: the ON clause uses a range comparison "
                f"({on_clause.strip()[:120]}). ClickHouse allows equality only in ON and "
                "fails with 'Code: 403. Unsupported JOIN ON conditions'. Move the range "
                "condition into WHERE, or restructure the query to GROUP BY the date "
                "expression directly instead of range-joining a generated calendar table."
            )
            break

    for code in _STATUS_MATCH.findall(sql):
        code_u = code.strip().upper()
        if code_u.startswith("RQ-") and code_u not in VALID_STATUS_CODES:
            problems.append(
                f"UNKNOWN STATUS CODE '{code}'. Valid codes are: "
                f"RQ-CO (Completed), RQ-WT (Waitlisted), RQ-CA (Cancelled), "
                f"RQ-CR (Assigned), RQ-AS (Accepted), RQ-AR (Arrived), "
                f"RQ-IP (InProgress), RQ-HLD (On Hold), RQ-RJ (Rejected)."
            )

    if _touches_porter_table(sql):
        if _BAD_COUNT.search(bare) and not re.search(
            r"\buniqExact\s*\(\s*request_id\s*\)|\bcount\s*\(\s*distinct\s+request_id\s*\)",
            bare, re.IGNORECASE,
        ):
            problems.append(
                "WRONG GRAIN: fact_porter_request holds one row per request DETAIL line "
                "(~7 rows per request), so count()/count(id) overcounts by about 7x. "
                "Count requests with uniqExact(request_id) instead."
            )

        # A request-level listing without DISTINCT repeats every request ~7x.
        # Only meaningful for a flat SELECT straight off the fact table: a
        # derived table has already fixed its own grain, and a GROUP BY query
        # is aggregated by definition.
        head = bare.split("FROM", 1)[0]
        is_flat_select = not re.search(r"\bFROM\s*\(", bare, re.IGNORECASE) and not re.search(
            r"\bGROUP\s+BY\b", bare, re.IGNORECASE
        )
        selects_request_cols = re.search(
            r"\b(request_id|status|pool_name_id|pool_location_id|porter_user_id)\b",
            head, re.IGNORECASE,
        )
        is_aggregate = re.search(
            r"\b(count|uniqExact|uniq|uniqCombined|sum|avg|min|max|any|anyLast|median|"
            r"quantile|countIf|avgIf|sumIf|groupArray|groupUniqArray|arraySum|arrayFilter|"
            r"arrayMap|length|round|topK|argMax|argMin)\s*\(",
            head, re.IGNORECASE,
        )
        if is_flat_select and selects_request_cols and not is_aggregate and not re.search(
            r"\bdistinct\b", head, re.IGNORECASE
        ):
            problems.append(
                "DUPLICATE ROWS: this lists request-level columns from "
                "fact_porter_request without DISTINCT or an aggregate, so every request "
                "will appear roughly 7 times. Use SELECT DISTINCT, or aggregate with "
                "GROUP BY."
            )

    return problems
