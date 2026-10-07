from typing import Dict, List, Any
from backend.config.settings import Config

class DatabaseSchema:
    """Enhanced database schema definitions for Porter and Asset management"""
    
    # Porter Management
    PORTER_TABLE = "fact_porter_request"
    LOOKUP_TABLE = "dim_app_terms"
    
    # Asset Management
    ASSET_TABLE = "tw_demo.mysql_asset"
    
    # Porter Request Columns
    PORTER_COLUMNS = [
        'id', 'request_detail_id', 'facility_id', 'requester_user_id', 'porter_user_id',
        'porter_count', 'request_type_id', 'is_auto_assigned', 'comp_manually',
        'asset_category', 'service_group_id', 'asset_count', 'source_id', 'destination_id',
        'request_category', 'priority', 'comments', 'remarks', 'pool_name_id',
        'pool_location_id', 'is_round_trip', 'status', 'scheduled_time', 'start_time',
        'end_time', 'assigned_time', 'accepted_time', 'arrived_time', 'cancelled_time',
        'onhold_time', 'inprogress_time', 'rejected_time', 'completed_time',
        'request_performer_status', 'patient_id'
    ]
    
    # Asset Management Columns
    ASSET_COLUMNS = [
        'id', 'name', 'is_active', 'location_id', 'facility_id',
        'asset_serial_number', 'home_location_id', 'transfer_status_id',
        'asset_type_id', 'status', 'warranty_due', 'asset_cost', 
        'current_book_value', 'vendor_name', 'next_cali_date', 
        'commissioned_on', 'is_radiology', 'depreciation_percent',
        'asset_admin_department', 'owner_id', 'vendor_contact', 
        'vendor_email', 'service_provider_name'
    ]
    
    # Combined for "all columns" queries
    ALL_COLUMNS = PORTER_COLUMNS  # For backward compatibility
    
    # Enhanced column descriptions for Porter Management
    PORTER_COLUMN_DESCRIPTIONS = {
        'id': 'Unique identifier for the person requesting (can appear multiple times)',
        'request_detail_id': 'Unique identifier for specific porter request detail',
        'facility_id': 'ID of the facility where request was made (STRING with leading zeros, e.g., 0184, 0039)',
        'requester_user_id': 'User who initiated the request',
        'porter_user_id': 'Porter assigned to handle the request (can be NULL)',
        'porter_count': 'Number of porters assigned/required',
        'request_type_id': 'Type of request (e.g., RQT-PO for Porter Request)',
        'is_auto_assigned': 'Y if auto-assigned, N if manual',
        'comp_manually': 'Y if completed manually, blank/NULL if not',
        'asset_category': 'Category of asset (e.g., RN-DSC, RN-PH, AT-TO)',
        'service_group_id': 'Service group ID (e.g., SG-HK)',
        'asset_count': 'Number of assets',
        'source_id': 'Source location ID',
        'destination_id': 'Destination location ID',
        'request_category': 'Category like PR-SE (Service), PR-PA (Patient)',
        'priority': 'Priority level (0, 1, etc.)',
        'comments': 'Optional comments field',
        'remarks': 'Additional remarks',
        'pool_name_id': 'Pool name identifier (do NOT join; just select this column and UI will translate)',
        'pool_location_id': 'Pool location ID (do NOT join; just select this column)',
        'is_round_trip': 'Y for round trip, N for one-way',
        'status': 'Request status',
        'scheduled_time': 'When request was scheduled (UTC timestamp)',
        'start_time': 'When request started (UTC timestamp)',
        'end_time': 'When request ended (UTC timestamp)',
        'assigned_time': 'When porter was assigned (UTC timestamp)',
        'accepted_time': 'When porter accepted (UTC timestamp)',
        'arrived_time': 'When porter arrived (UTC timestamp)',
        'cancelled_time': 'When request was cancelled (UTC timestamp)',
        'onhold_time': 'When put on hold (UTC timestamp)',
        'inprogress_time': 'When marked in progress (UTC timestamp)',
        'rejected_time': 'When rejected (UTC timestamp)',
        'completed_time': 'When completed (UTC timestamp)',
        'request_performer_status': 'Status codes like RQ-CO (Completed), RQ-CA (Cancelled)',
        'patient_id': 'Patient ID if applicable'
    }
    
    # Asset Management column descriptions
    ASSET_COLUMN_DESCRIPTIONS = {
        'id': 'Unique asset identifier',
        'name': 'Asset name or description',
        'is_active': 'Active status flag (often empty, T=true, F=false)',
        'location_id': 'Current location ID of the asset',
        'facility_id': 'Facility where asset is located (STRING with leading zeros)',
        'asset_serial_number': 'Asset serial number',
        'home_location_id': 'Home/default location ID of the asset',
        'transfer_status_id': 'Transfer status identifier',
        'asset_type_id': 'Asset type classification ID',
        'status': 'Asset status (numeric)',
        'warranty_due': 'Date when the warranty expires',
        'asset_cost': 'Initial cost of the asset',
        'current_book_value': 'Current depreciated value of the asset',
        'vendor_name': 'Name of the vendor who supplied the asset',
        'next_cali_date': 'Date of the next scheduled calibration',
        'commissioned_on': 'Date when the asset was commissioned',
        'is_radiology': 'Whether the asset is a radiology device',
        'depreciation_percent': 'Depreciation percentage',
        'asset_admin_department': 'Department administering the asset',
        'owner_id': 'ID of the asset owner',
        'vendor_contact': 'Contact person at the vendor',
        'vendor_email': 'Email of the vendor',
        'service_provider_name': 'Name of the service provider'
    }
    
    # Combined column descriptions
    COLUMN_DESCRIPTIONS = {**PORTER_COLUMN_DESCRIPTIONS, **ASSET_COLUMN_DESCRIPTIONS}
    
    # Time-related columns for date formatting
    TIME_COLUMNS = [
        # Porter time columns
        'scheduled_time', 'start_time', 'end_time', 'assigned_time',
        'accepted_time', 'arrived_time', 'cancelled_time', 'onhold_time',
        'inprogress_time', 'rejected_time', 'completed_time'
    ]
    
    @classmethod
    def get_schema_context(cls):
        """Get formatted schema context for LLM with both Porter and Asset schemas"""
        context = f"""
TRACKERWAVE ANALYTICS PLATFORM SCHEMA

PORTER MANAGEMENT:
PRIMARY TABLE: {cls.PORTER_TABLE}
COLUMNS: {', '.join(cls.PORTER_COLUMNS)}

ASSET MANAGEMENT:
PRIMARY TABLE: {cls.ASSET_TABLE}
COLUMNS: {', '.join(cls.ASSET_COLUMNS)}

LOOKUP TABLE: {cls.LOOKUP_TABLE}
- code: The code value
- value: Human-readable description
- group_name: Category (e.g., 'CountryCode', 'AssetType')

CRITICAL CLICKHOUSE SQL RULES:
- Use toDate(), toMonth(), toYear() for date functions
- Use today() instead of CURRENT_DATE
- Use now() instead of NOW()  
- For TAT calculations: {Config.TAT_CALCULATION} AS tat_minutes
- Facility IDs are STRINGS: facility_id = '0184'
- For June 2025: toMonth(scheduled_time) = 6 AND toYear(scheduled_time) = 2025
- For date ranges: scheduled_time >= '2025-06-01' AND scheduled_time < '2025-07-01'
- All timestamps stored in UTC - will be converted to user timezone in display
- For "all columns" queries, include ALL columns from the appropriate table
- Use proper WHERE clauses for active records: is_active = '1' for assets
- Handle broken English by inferring semantic meaning
- Return NUMERIC values for time calculations, not timestamp strings

BUSINESS LOGIC:
- TAT = Turnaround Time in minutes (numeric)
- facility_id stored as STRING with leading zeros
- Asset status: '0'=inactive, '1'=active
- All times in UTC, converted to user timezone for display
"""
        
        return context

    @classmethod
    def get_mini_schema_prompt(cls, freshness_note: str = "") -> str:
        return f"""## DATABASE: ClickHouse
{freshness_note}

### TABLE: fact_porter_request  (hospital porter transport requests)
!! GRAIN WARNING: this table is NOT one row per request. It is one row per
request DETAIL line, so a single request appears on many rows (average ~7,
sometimes 50+). The identifier of a real request is `request_id`.
- To COUNT requests you MUST use `uniqExact(request_id)`.
  NEVER `count()`, `count(*)`, `count(id)` or `count(request_detail_id)` —
  they overcount by roughly 7x.
- To LIST requests, `SELECT DISTINCT` is USUALLY NOT ENOUGH: the detail rows of
  one request carry DIFFERENT assigned_time/completed_time/porter_user_id values,
  so DISTINCT still returns the same request several times. Collapse properly
  with `GROUP BY request_id`, aggregating every other column (see recipe R3).
- `id` is NOT the request id (it differs from request_id on ~half the rows).
Columns:
- request_id (THE request identifier), id, request_detail_id, facility_id,
  porter_user_id, requester_user_id, status, request_category, pool_name_id,
  pool_location_id, source_id, destination_id, scheduled_time, start_time,
  end_time, assigned_time, accepted_time, arrived_time, cancelled_time,
  onhold_time, inprogress_time, rejected_time, completed_time, request_type_id,
  is_auto_assigned, comp_manually, asset_category, service_group_id,
  asset_count, priority, is_round_trip, patient_id

### TABLE: ovitag_live_dw.fact_user_pool  (which pool/pool-location a USER is assigned to)
Columns: id, user_id, pool_name_id, pool_location_id, facility_id, start_date, end_date
This is the ONLY table that answers "which pool / pool location does porter X belong to".

### TABLE: ovitag_live_dw.dim_user  (porter & requester names)
Columns: id, first_name, last_name, customer_id

### TABLE: ovitag_live_dw.dim_app_terms  (code -> human label)
Columns: code, value, group_name
Decodes status (RequestStatus), pool_name_id (PoolName), pool_location_id
(PoolLocation), request_category (PorterRequestType).

### TABLE: ovitag_live_dw.dim_location  (physical locations: ICU, wards)
Columns: id (Int64), name, facility_id, parent_id
Joins ONLY to source_id / destination_id. It does NOT join to pool_location_id.

### TABLE: tw_demo.mysql_asset  (hospital assets inventory)
Columns: id, name, is_active, location_id, facility_id, asset_serial_number,
home_location_id, transfer_status_id, asset_type_id, status, warranty_due,
asset_cost, current_book_value, vendor_name, next_cali_date, commissioned_on,
is_radiology, depreciation_percent, asset_admin_department, owner_id,
vendor_contact, vendor_email, service_provider_name

### TIMEZONE
All timestamps are stored in UTC. The users are in Asia/Kolkata (UTC+5:30).
Every date filter and every date grouping must be expressed in Asia/Kolkata,
otherwise a "day" is wrong by 5.5 hours. Say so explicitly in your plan
whenever the question mentions a date, day, month, shift or "yesterday".

### PORTER NAMES
A person's name (e.g. "Reena") is NEVER stored in pool_name_id. Names live in
dim_user only. pool_name_id holds pool CODES like 'PN-IN'.
"""

    @classmethod
    def get_llm_schema_prompt(cls, freshness_note: str = "") -> str:
        return f"""## DATABASE: ClickHouse
{freshness_note}

#############################################################
## RULE 0 — TABLE GRAIN. READ THIS BEFORE WRITING ANY COUNT.
#############################################################
`fact_porter_request` is NOT one row per porter request. It is one row per
request DETAIL line. One real request typically spans ~7 rows and sometimes
50+ rows. Only ONE of those rows carries the assigned porter_user_id; the
rest have porter_user_id = NULL.

Therefore:
- COUNTING requests            -> `uniqExact(request_id) AS request_count`
- LISTING requests             -> `SELECT DISTINCT ...` (never a bare SELECT)
- COUNTING per porter/pool/day -> still `uniqExact(request_id)`

FORBIDDEN when querying fact_porter_request — these inflate results ~7x and
are the single most common bug in this system:
    count()            count(*)            count(id)
    count(request_id)  count(request_detail_id)   sum(porter_count)
`id` is NOT the request identifier — it differs from request_id on about half
the rows. `request_detail_id` is the fan-out key. ALWAYS use `request_id`.

#############################################################
## RULE 0B — TIMEZONE. ALL DATES ARE ASIA/KOLKATA.
#############################################################
Every timestamp column is stored in UTC. Users are in Asia/Kolkata (UTC+5:30).
A naive filter like `scheduled_time >= '2026-06-01'` is WRONG — it returns a
day that is shifted by 5 hours 30 minutes.

FILTER a calendar day/range (preferred — stays index-friendly):
    AND scheduled_time >= toDateTime('2026-06-01 00:00:00', 'Asia/Kolkata')
    AND scheduled_time <  toDateTime('2026-06-02 00:00:00', 'Asia/Kolkata')

GROUP or DISPLAY by day/hour/month — wrap the column:
    toDate(toTimeZone(scheduled_time, 'Asia/Kolkata'))          AS request_date
    toHour(toTimeZone(scheduled_time, 'Asia/Kolkata'))          AS request_hour
    toStartOfMonth(toTimeZone(scheduled_time, 'Asia/Kolkata'))  AS request_month

RELATIVE dates — "today" / "yesterday" must also be IST:
    today  : toDate(now(), 'Asia/Kolkata')
    yesterday:
      AND scheduled_time >= toDateTime(concat(toString(toDate(now(),'Asia/Kolkata') - 1), ' 00:00:00'), 'Asia/Kolkata')
      AND scheduled_time <  toDateTime(concat(toString(toDate(now(),'Asia/Kolkata')),     ' 00:00:00'), 'Asia/Kolkata')

YEAR-LESS DATES — "on june 1", "on 2 Aug", "last Tuesday":
When the user names a day WITHOUT a year, resolve it to the MOST RECENT
occurrence on or before today (Asia/Kolkata). Today's date is given in the DATA
COVERAGE block above — use it. Never fall back to an earlier year, and never
pick a year at random: "june 1" asked in August 2026 means 2026-06-01, NOT
2024-06-01 or 2025-06-01. If that date falls outside the loaded data range,
still query the date the user meant — the application explains the gap.

Use the timestamp that matches the QUESTION:
- "requests created/raised/received on X"  -> scheduled_time
- "requests completed on X"                -> completed_time (AND status='RQ-CO')
- "requests cancelled on X"                -> cancelled_time
- "porter working/assigned during X"       -> assigned_time

### TABLE: fact_porter_request
Purpose: Hospital porter transport requests
Columns:
- request_id (Int32): **THE request identifier — use this for all counting/distinct**
- id (Int64): internal row id — NOT the request id, do not count it
- request_detail_id (Int64, nullable): detail-line id — this is the fan-out key
- facility_id (String): e.g. '0184' — ALWAYS treat as STRING, never Int
- porter_user_id (Int64, nullable): assigned porter ID. NULL on most detail rows —
  always add `porter_user_id IS NOT NULL` when analysing porters.
  IF filtering by a porter's human name (e.g. "Reena", "John"), you MUST use a subquery:
  `porter_user_id IN (SELECT id FROM ovitag_live_dw.dim_user WHERE first_name ILIKE '%name%' OR last_name ILIKE '%name%')`.
- status (String) — VERIFIED against dim_app_terms, use these exact codes:
    RQ-CO = Completed    RQ-WT  = Waitlisted   RQ-CA = Cancelled
    RQ-CR = Assigned     RQ-AS  = Accepted     RQ-AR = Arrived
    RQ-IP = InProgress   RQ-HLD = On Hold      RQ-RJ = Rejected
    RQ-NR = No Response  RQ-PLN = Planned      RQ-SH = Scheduled
    RQ-RAS = Reassigned  RQ-PEN = Pending      RQ-DISP = Dispatched
  Status is CONSTANT across all detail rows of a request, so filtering on it is safe.
  There is no 'RQ-OH' and no 'RQ-AC' — do not invent codes.
  "Waitlisted" is RQ-WT. "Assigned" is RQ-CR (NOT RQ-AS, which means Accepted).
  For a status HISTORY / breakdown / "overall summary", GROUP BY status and
  count uniqExact(request_id) — that yields the completed/waitlisted/cancelled mix.
- request_category (String): PR-PA = Patient transport, PR-SE = Services, PR-AT = Asset
- pool_name_id (String, nullable): pool CODE such as 'PN-IN', 'PN-SCL', 'PN-HK'.
  This is a WORK POOL, never a person. NEVER match a human name against it.
  Decoded via dim_app_terms (group_name='PoolName'). It is NOT a location.
- pool_location_id (String, nullable): pool location CODE such as 'PL-BW', 'PL-FL4'.
  Decoded via dim_app_terms (group_name='PoolLocation').
  *** NEVER join pool_location_id to dim_location — dim_location.id is a NUMBER
  and pool_location_id is a code like 'PL-BW'. `toString(dim_location.id)` can
  never equal 'PL-BW', so such a join silently returns garbage/empty. ***
- requester_user_id (Int64, nullable): Requesting user identifier
- source_id (Int64, nullable): Source location identifier
- destination_id (Int64, nullable): Destination location identifier
- scheduled_time (DateTime UTC): request creation time
- start_time, end_time, assigned_time, accepted_time, arrived_time, cancelled_time, onhold_time, inprogress_time, rejected_time, completed_time (DateTime UTC, nullable): timestamps for each lifecycle stage. If a timestamp is NULL, it means that stage has not occurred yet.
- porter_count (Int64, nullable): number of porters requested
- request_type_id (String, nullable): Type of request (e.g. 'RQT-PO')
- is_auto_assigned (String, nullable): 'Y' (auto) or 'N' (manual)
- comp_manually (String, nullable): 'Y' if completed manually
- asset_category (String, nullable): Asset/Equipment codes (e.g. 'AT-TO', 'AT-MB', 'AT-WH', 'RN-PH', 'RN-SA')
- service_group_id (String, nullable): Service group (e.g. 'SG-HK', 'SG-O/G')
- asset_count (Int64, nullable): number of assets
- priority (String, nullable): Priority level (e.g. '0', '1', '2')
- comments, remarks (String, nullable): Optional text fields. Often contains notes or names of patients/staff (e.g., 'URGENT MUKESH', '5927 neeraj', 'discharge summary').
- is_round_trip (String, nullable): 'Y' (round trip) or 'N' (one-way)
- request_performer_status (String, nullable): Status of the performer
- patient_id (Int64, nullable): ID of patient if applicable
- TAT formula: round(dateDiff('second', scheduled_time, completed_time)/60.0, 2) AS tat_minutes
- Average TAT formula: round(avg(dateDiff('second', scheduled_time, completed_time)/60.0), 2) AS avg_tat_minutes (DO NOT use avgIf with NULL checks, standard avg() already ignores NULLs natively)
- Filter NULL TAT: WHERE completed_time IS NOT NULL

### TABLE: tw_demo.mysql_asset
Purpose: Hospital equipment inventory (NOTE: You MUST use the full tw_demo.mysql_asset table name since it lives in a different database)
Columns:
- id (Int64): asset ID
- name (String): equipment name
- is_active (String): 'T' = active, 'F' = inactive (Note: often empty, prefer using status)
- location_id (Int64, nullable): current location ID
- facility_id (String): same string format as porter table
- asset_serial_number (String, nullable)
- home_location_id (Int64, nullable)
- transfer_status_id (String, nullable)
- asset_type_id (String, nullable)
- status (Int64): asset status (1 = active, 0 = inactive). ALWAYS use this to check if an asset is active (WHERE status = 1).
- warranty_due (DateTime, nullable): Warranty expiration date
- asset_cost (Float32, nullable): Purchase cost
- current_book_value (Float32, nullable): Depreciated value
- vendor_name (String, nullable)
- next_cali_date (DateTime, nullable): Next calibration date
- commissioned_on (DateTime, nullable)
- is_radiology (String, nullable)
- depreciation_percent (String, nullable)
- asset_admin_department (String, nullable)
- owner_id (Int64, nullable)
- vendor_contact (String, nullable)
- vendor_email (String, nullable)
- service_provider_name (String, nullable)

### TABLE: ovitag_live_dw.dim_location
Purpose: Location mapping (ICU, Wards, etc). You MUST use the full ovitag_live_dw.dim_location table name.
Columns:
- id (Int64): location ID (matches source_id/destination_id in porter table, and location_id in asset table)
- name (String): Human-readable location name (e.g. 'icu', 'ward 1')
- facility_id (String): facility identifier
- parent_id (Int64, nullable): parent location ID

### TABLE: ovitag_live_dw.dim_user
Purpose: Porter user names. You MUST use the full ovitag_live_dw.dim_user table name.
Columns:
- id (Int64): user ID (matches porter_user_id in porter table)
- first_name (String): user's first name
- last_name (String): user's last name
NOTE: names are messy — a "last_name" is sometimes a phone number or '.'.
Build a display name with concat(ifNull(first_name,''), ' ', ifNull(last_name,'')).

### TABLE: ovitag_live_dw.fact_user_pool
Purpose: WHICH POOL AND POOL LOCATION A USER (PORTER) IS ASSIGNED TO.
This is the ONLY correct source for "which pool / pool location is porter X in".
Columns:
- id (Int64), user_id (Int64, nullable) -> joins dim_user.id
- pool_name_id (String, nullable): pool code, e.g. 'PN-IN'
- pool_location_id (String, nullable): pool location code, e.g. 'PL-BW'
- facility_id (String, nullable), start_date / end_date (DateTime, nullable)
A user has MANY rows here over time, so always aggregate or take the latest by
start_date — never return the raw rows or you get dozens of duplicates.
*** USE THIS TABLE FOR EXACTLY ONE KIND OF QUESTION: "which pool / pool
location does porter X belong to". NEVER use it to count porters, to build a
trend, or to answer "how many porters are there / were active". Its overlapping
start_date/end_date ranges force an unsupported range JOIN and double-count.
For "how many porters were active", use uniqExact(porter_user_id) on
fact_porter_request — see recipe R10. ***

### TABLE: ovitag_live_dw.dim_app_terms
Purpose: decodes every short code into a human label.
Columns: code (String), value (String), group_name (String)
group_name values you will need:
  'RequestStatus' (RQ-*), 'PoolName' (PN-*), 'PoolLocation' (PL-*),
  'PorterRequestType' (PR-*)
Join example: LEFT JOIN ovitag_live_dw.dim_app_terms t ON f.pool_name_id = t.code

## COLUMN-TO-TABLE OWNERSHIP — COMMON MISTAKES TO AVOID
Each column belongs to EXACTLY ONE of the two tables. Do NOT use a column in a query against the wrong table:

- status, request_category, scheduled_time, completed_time, porter_user_id → fact_porter_request ONLY
- facility_id → exists in BOTH tables (this is the only shared column, used for filtering both, never for joining row-for-row — see JOIN RULES below)

If a question asks about "department" in the context of PORTER requests, and no direct department column exists on fact_porter_request, state in your SQL comments that this isn't directly available.

### CLICKHOUSE SQL — MANDATORY RULES:
1. Date functions: toDate(), toMonth(), toYear(), today(), now()
   INVALID: CURRENT_DATE, DATE_SUB, DATE_FORMAT, DATEDIFF (MySQL syntax)
2. Intervals: INTERVAL 1 DAY | INTERVAL 1 MONTH | INTERVAL 1 YEAR
3. Last month filter:
   toMonth(scheduled_time) = toMonth(today() - INTERVAL 1 MONTH)
   AND toYear(scheduled_time) = toYear(today() - INTERVAL 1 MONTH)
4. facility_id is STRING: WHERE facility_id = '0184'  (not = 0184)
5. NULL checks: Use IS NULL and IS NOT NULL (e.g. col IS NOT NULL). Do NOT use isNotNull() or isNull() functions inside If suffixes (like avgIf) because it causes "Illegal type Nothing" errors in this ClickHouse version.
6. String contains: ALWAYS use case-insensitive matching `ILIKE '%value%'` instead of `LIKE` or `=` when filtering by name, category, or any string to avoid capitalization mismatch bugs.
7. Always include LIMIT (default 500) unless user explicitly asks for all data
8. Percentage: (count_filtered * 100.0 / count_total) — no PERCENT function. Do NOT use window functions like OVER () for percentages. Use CROSS JOIN (never just JOIN) to get totals, e.g. `CROSS JOIN (SELECT count() as total_count FROM ...) AS total`. Using JOIN without an ON clause causes syntax errors.
9. GROUP BY must list all non-aggregate SELECT columns exactly
10. NO CORRELATED SUBQUERIES: ClickHouse does not support correlated subqueries referencing the outer query. To compare periods (e.g., YoY comparison per facility), use conditional aggregation: `countIf(toYear(scheduled_time) = toYear(today()))` vs `countIf(toYear(scheduled_time) = toYear(today()) - 1)`, OR use a standard `GROUP BY facility_id, toYear(scheduled_time)`.
11. AGGREGATIONS OVER TIME: When asked for "requests per day/month/year", always use appropriate GROUP BY along with the date function.
12. CONDITIONAL AGGREGATES: Use `countIf(condition)` for conditional counts, `avgIf(expr, condition)` for conditional averages, and `sumIf(expr, condition)` for conditional sums. Make sure conditions use `IS NOT NULL` instead of `isNotNull()` to avoid type Nothing errors. These compute the aggregate ONLY over rows matching `condition`.
12A. EVERY SUBQUERY IN A JOIN NEEDS AN ALIAS. Omitting it fails with
    "Code: 206. No alias for subquery or table function in JOIN (ALIAS_REQUIRED)".
    WRONG:   FROM ( SELECT ... ) INNER JOIN dim_user u ON porter_user_id = u.id
    RIGHT:   FROM ( SELECT ... ) AS f INNER JOIN dim_user u ON f.porter_user_id = u.id
    Also qualify the join columns with that alias.

12D. NEVER RETURN A LIST INSIDE A CELL. Do not use groupArray() or
    groupUniqArray() to collect names, ids or any values into one cell — the UI
    renders that as a single unreadable blob that cannot be sorted or charted.
    Emit ONE ROW PER ENTITY instead: put the entity column in both SELECT and
    GROUP BY. "Shift-wise porter count with names" = one row per (shift, porter)
    with uniqExact(request_id) AS request_count — NOT one row per shift holding a
    list of porters. (The only permitted use is groupArray((a, b)) over TUPLES in
    the idle-time recipe R8.)

12B. JOIN ON SUPPORTS EQUALITY ONLY. ClickHouse rejects any other comparison in
    an ON clause with "Code: 403. Unsupported JOIN ON conditions".
    FORBIDDEN: ON a.start_date <= b.month_end
               ON a.d BETWEEN b.x AND b.y
               ON a.x = b.x OR a.y = b.y
    Put range/OR conditions in the WHERE clause, or restructure so the join key
    is a plain equality. Do NOT build a calendar table with numbers() and
    range-join it to a fact table — just GROUP BY the date expression directly.

12C. HOW MANY PORTERS WERE ACTIVE IN A PERIOD:
    use `uniqExact(porter_user_id)` on fact_porter_request for that period.
    Do NOT use fact_user_pool for this — it is a slowly-changing assignment
    table with overlapping validity ranges, so counting it over time requires
    an unsupported range join and double-counts. fact_user_pool answers exactly
    one kind of question: "which pool / pool location does porter X belong to".

13. DIMENSION TABLE LOOKUPS — WHICH TABLE DECODES WHICH COLUMN:
    | column                        | decoded by                          |
    |-------------------------------|-------------------------------------|
    | porter_user_id, requester_user_id | ovitag_live_dw.dim_user (id)    |
    | source_id, destination_id     | ovitag_live_dw.dim_location (id)    |
    | pool_name_id                  | dim_app_terms (code) — NOT dim_location |
    | pool_location_id              | dim_app_terms (code) — NOT dim_location |
    | status, request_category      | dim_app_terms (code)                |

    - PORTER NAMES: If asked about a porter by name (e.g., "reena"), do NOT search
      in pool_name_id. Resolve through dim_user:
      `porter_user_id IN (SELECT id FROM ovitag_live_dw.dim_user WHERE first_name ILIKE '%reena%' OR last_name ILIKE '%reena%')`
    - PHYSICAL LOCATIONS: source_id / destination_id are Int64 and join
      dim_location.id directly:
      `WHERE source_id IN (SELECT id FROM ovitag_live_dw.dim_location WHERE name ILIKE '%icu%')`
    - *** NEVER join pool_location_id or pool_name_id to dim_location. ***
      They hold codes ('PL-BW', 'PN-IN'); dim_location.id holds numbers (1098).
      `ON pool_location_id = toString(dim_location.id)` NEVER matches and silently
      returns wrong or empty results. This was a real production bug — do not repeat it.
    - The UI auto-translates raw codes to labels, so you usually do NOT need to join
      dim_app_terms at all — just select the raw code column.
    - SAME FOR NAMES: the UI already converts porter_user_id and requester_user_id
      into the person's name. To SHOW a porter's name, just select porter_user_id —
      do NOT also add concat(first_name, last_name), or the table ends up with two
      identical columns ("Porter" and "Porter Name") side by side. Join dim_user
      ONLY when you need to FILTER by a name, and even then prefer the subquery
      form: porter_user_id IN (SELECT id FROM ovitag_live_dw.dim_user WHERE ...).
23. SANITY BOUND ON DATES: This database may contain a small number of corrupted rows with scheduled_time/completed_time values far in the future (e.g. year 2084) due to a known data ingestion issue. For ANY query involving date ranges, MAX(), MIN(), or "most recent data" questions, ALWAYS add: AND scheduled_time <= now() + INTERVAL 1 DAY (and the same for completed_time where relevant). This excludes corrupted future-dated rows from results without needing to identify them individually.
14. STABLE ORDERING WITH LIMIT: Whenever a query includes both ORDER BY and LIMIT, the ORDER BY must be fully deterministic — add a tie-breaking secondary sort column. If it is an aggregate query (GROUP BY), use one of the GROUP BY columns as the tie-breaker. Do NOT use 'id' as a tie-breaker in aggregate queries unless 'id' is in the GROUP BY clause. IF the query uses LIMIT but does NOT have an ORDER BY, you MUST add an ORDER BY (unless it is a global aggregate with no GROUP BY, in which case omit ORDER BY).
24. CONSTRUCTING A DATE FROM YEAR/MONTH/DAY PARTS: Do NOT use makeDate (it does not exist in this version). Instead, construct dates using string literals like toDate('2025-02-01'). If it must be dynamic relative to the current year, use concat: toDate(concat(toString(toYear(today())), '-02-01')). For end-of-month calculations, prefer: (toStartOfMonth(date_expr) + INTERVAL 1 MONTH - INTERVAL 1 DAY). Do NOT use toLastDayOfMonth or toEndOfMonth as they do not exist in this version.
25. DATE MATH: Do NOT use dateAdd('unit', number, date). In this ClickHouse version it throws a NUMBER_OF_ARGUMENTS_DOESNT_MATCH error. Use the native INTERVAL operator instead: date_expr + INTERVAL number HOUR (or DAY, MONTH, etc). Example: `toStartOfDay(today()) + INTERVAL number HOUR`.
26. TYPE MATCHING: NEVER compare an integer column (like porter_user_id, id, request_detail_id) to an empty string ''. To check for valid integers, use IS NOT NULL. If you must check for "empty", use != 0 (but not !=''). Doing != '' on an Int64 causes 'Attempt to read after eof: while converting '' to Int64' errors!
27. NESTED AGGREGATES: NEVER nest aggregate functions directly (e.g. `min(avg(...))`). This causes ILLEGAL_AGGREGATION errors. You must calculate the inner aggregate in a subquery first, and then apply the outer aggregate to the subquery result.
28. SLA AND DELAYED ANALYSIS: When calculating SLA compliance percentage or counting delayed/met requests, NEVER put the time threshold condition in the WHERE clause (e.g. do NOT use `WHERE dateDiff(...) <= 15`). Doing so artificially excludes delayed requests, resulting in fake 100% compliance! Instead, query ALL completed requests (`WHERE status = 'RQ-CO'`) and use conditional aggregation: `countIf(dateDiff('minute', assigned_time, completed_time) <= 15)` for met, and `countIf(dateDiff('minute', assigned_time, completed_time) > 15)` for delayed.
29. NO ALIASING RAW DIMENSIONS: When selecting dimension columns (like location_id, name, id), DO NOT alias them with AS (e.g. do NOT write `name AS asset_names` or `location_id AS loc`). Keep the original column names EXACTLY as they are in the table schema. You may only alias aggregate functions (like `count() AS active_asset_count`). Aliasing raw columns breaks the frontend display logic!
## DATE CONSTRUCTION EXAMPLES
- "by end of February this year": (toStartOfMonth(toDate(concat(toString(toYear(today())), '-02-01'))) + INTERVAL 1 MONTH - INTERVAL 1 DAY)
- "first day of last month": toStartOfMonth(today() - INTERVAL 1 MONTH)
- "a specific date like March 15, 2025": toDate('2025-03-15')  -- string literal, NOT toDate(2025,3,15)

#############################################################
## VERIFIED QUERY RECIPES — these have been executed against
## this exact warehouse and return correct results. Adapt the
## facility, dates and LIMIT; keep the STRUCTURE identical.
#############################################################

-- R1. HOW MANY REQUESTS WERE CREATED ON A GIVEN DAY (IST)
SELECT uniqExact(request_id) AS request_count
FROM fact_porter_request
WHERE facility_id = '0459'
  AND scheduled_time >= toDateTime('2026-06-01 00:00:00', 'Asia/Kolkata')
  AND scheduled_time <  toDateTime('2026-06-02 00:00:00', 'Asia/Kolkata')

-- R2. STATUS HISTORY / OVERALL STATUS SUMMARY
--     (how many completed, waitlisted, cancelled ... — one row per status)
SELECT status, uniqExact(request_id) AS request_count
FROM fact_porter_request
WHERE facility_id = '0459'
  AND scheduled_time >= toDateTime('2026-06-01 00:00:00', 'Asia/Kolkata')
  AND scheduled_time <  toDateTime('2026-07-01 00:00:00', 'Asia/Kolkata')
GROUP BY status
ORDER BY request_count DESC, status

-- R3. WAITLISTED (or any single status) REQUESTS — ONE ROW PER REQUEST
--     SELECT DISTINCT is NOT enough here: assigned_time/completed_time differ
--     between the detail rows of one request, so DISTINCT still emits duplicates.
--     Collapse with GROUP BY request_id and aggregate every other column.
--     The WHERE lives in an inner subquery so aliases like `AS status` cannot
--     collide with the filter (that raises ILLEGAL_AGGREGATION).
SELECT
  request_id,
  max(status)           AS status,
  max(request_category) AS request_category,
  max(pool_name_id)     AS pool_name_id,
  max(pool_location_id) AS pool_location_id,
  max(porter_user_id)   AS porter_user_id,
  min(scheduled_time)   AS scheduled_time,
  max(assigned_time)    AS assigned_time,
  max(completed_time)   AS completed_time
FROM (
  SELECT request_id, status, request_category, pool_name_id, pool_location_id,
         porter_user_id, scheduled_time, assigned_time, completed_time
  FROM fact_porter_request
  WHERE facility_id = '0459' AND status = 'RQ-WT'
)
GROUP BY request_id
ORDER BY scheduled_time DESC, request_id
LIMIT 500

-- R4. WHICH POOL HAS THE MOST REQUESTS, AND THE TOP PORTER WITHIN EACH POOL
--     (group by BOTH pool and porter — a bare pool grouping cannot answer
--      "which porter has the max requests in each pool")
SELECT pool_name_id, porter_user_id, uniqExact(request_id) AS request_count
FROM fact_porter_request
WHERE facility_id = '0459'
  AND pool_name_id IS NOT NULL AND pool_name_id != ''
  AND porter_user_id IS NOT NULL
GROUP BY pool_name_id, porter_user_id
ORDER BY pool_name_id, request_count DESC
LIMIT 500

-- R5. WHICH POOL / POOL LOCATION IS PORTER "REENA" IN
--     Resolve the NAME in dim_user, then read the pool.
--     *** YOU MUST KEEP BOTH UNION ALL BRANCHES. *** fact_user_pool is EMPTY for
--     several facilities (including 0459), so a query using only that table
--     returns zero rows and the user sees "no data" for a porter who plainly
--     exists. The second branch reads the pools the porter actually worked in
--     and guarantees a real answer. Dropping either branch is a bug.
--     Replace 'reena' with the name asked about.
--     *** DO NOT add `pool_location_id IS NOT NULL` / `!= ''` here. *** Many
--     porters belong to a pool that has no location recorded, and filtering
--     those out turns a good answer ("pool PN-IN, no location on record") into
--     an empty result. When a question is scoped to ONE NAMED PERSON, never
--     filter out the very attribute being asked about — return the row and let
--     the blank value speak for itself.
SELECT porter_user_id, porter_name, pool_name_id, pool_location_id, pool_source, request_count
FROM (
    SELECT u.id AS porter_user_id,
           concat(ifNull(u.first_name, ''), ' ', ifNull(u.last_name, '')) AS porter_name,
           p.pool_name_id, p.pool_location_id,
           'Assigned pool' AS pool_source, toUInt64(0) AS request_count
    FROM ovitag_live_dw.fact_user_pool p
    INNER JOIN ovitag_live_dw.dim_user u ON p.user_id = u.id
    WHERE p.facility_id = '0459'
      AND (u.first_name ILIKE '%reena%' OR u.last_name ILIKE '%reena%')
    GROUP BY porter_user_id, porter_name, p.pool_name_id, p.pool_location_id
  UNION ALL
    SELECT f.porter_user_id,
           concat(ifNull(u.first_name, ''), ' ', ifNull(u.last_name, '')) AS porter_name,
           f.pool_name_id, f.pool_location_id,
           'Pool worked in' AS pool_source, uniqExact(f.request_id) AS request_count
    FROM fact_porter_request f
    INNER JOIN ovitag_live_dw.dim_user u ON f.porter_user_id = u.id
    WHERE f.facility_id = '0459'
      AND (u.first_name ILIKE '%reena%' OR u.last_name ILIKE '%reena%')
      AND f.pool_name_id IS NOT NULL AND f.pool_name_id != ''
    GROUP BY f.porter_user_id, porter_name, f.pool_name_id, f.pool_location_id
)
ORDER BY request_count DESC, porter_user_id
LIMIT 500

-- R6. PORTER WHO COMPLETED THE MOST REQUESTS IN A DATE RANGE
--     filter on completed_time (not scheduled_time) for "completed in <period>"
SELECT porter_user_id, uniqExact(request_id) AS completed_requests
FROM fact_porter_request
WHERE facility_id = '0459'
  AND status = 'RQ-CO'
  AND porter_user_id IS NOT NULL
  AND completed_time >= toDateTime('2026-08-01 00:00:00', 'Asia/Kolkata')
  AND completed_time <  toDateTime('2026-09-01 00:00:00', 'Asia/Kolkata')
GROUP BY porter_user_id
ORDER BY completed_requests DESC, porter_user_id
LIMIT 10

-- R7. SHIFT-WISE PORTER COUNT (Morning / Afternoon / Night, IST)
--     Shift windows: Morning 06:00-13:59, Afternoon 14:00-21:59, Night 22:00-05:59.
--     Shift is derived from actual porter activity (assigned_time) because the
--     warehouse holds no login/attendance table.
--
--     *** IF THE USER ALSO WANTS PORTER NAMES, add porter_user_id to SELECT and
--     GROUP BY, and change the measure to uniqExact(request_id) AS request_count.
--     Do NOT keep uniqExact(porter_user_id) once you group by porter_user_id —
--     it then returns 1 on every row, which is meaningless. ***
--     Correct shape for "shift-wise porter count WITH names":
--         SELECT <shift expr> AS shift, porter_user_id,
--                uniqExact(request_id) AS request_count
--         ... GROUP BY shift, porter_user_id
--         ORDER BY shift, request_count DESC
--     The written summary then reports how many distinct porters fall in each
--     shift, and the table lists the individual porters.
SELECT
  multiIf(toHour(toTimeZone(assigned_time, 'Asia/Kolkata')) >= 6
            AND toHour(toTimeZone(assigned_time, 'Asia/Kolkata')) < 14, 'Morning',
          toHour(toTimeZone(assigned_time, 'Asia/Kolkata')) >= 14
            AND toHour(toTimeZone(assigned_time, 'Asia/Kolkata')) < 22, 'Afternoon',
          'Night') AS shift,
  uniqExact(porter_user_id) AS porter_count,
  uniqExact(request_id)     AS request_count
FROM fact_porter_request
WHERE facility_id = '0459'
  AND porter_user_id IS NOT NULL
  AND assigned_time IS NOT NULL
GROUP BY shift
ORDER BY request_count DESC, shift

-- R8. PORTER WITH THE HIGHEST IDLE TIME
--     Idle = sum of gaps between finishing one request and being assigned the
--     next, counting only gaps of 0-240 minutes so off-shift time is excluded.
--     assumeNotNull() is REQUIRED — without it arrayFilter throws
--     "Expression for function arrayFilter must return UInt8, found Nullable(UInt8)".
SELECT
  porter_user_id,
  round(arraySum(arrayFilter(g -> g > 0 AND g <= 240,
      arrayMap(i -> dateDiff('minute', ev[i].2, ev[i + 1].1), range(1, length(ev))))), 1) AS idle_minutes,
  length(ev) AS completed_requests
FROM (
  SELECT porter_user_id,
         arraySort(x -> toUInt32(x.1), groupArray((assigned_time, completed_time))) AS ev
  FROM (
      SELECT DISTINCT porter_user_id, request_id,
             assumeNotNull(assigned_time)  AS assigned_time,
             assumeNotNull(completed_time) AS completed_time
      FROM fact_porter_request
      WHERE facility_id = '0459'
        AND porter_user_id IS NOT NULL
        AND assigned_time IS NOT NULL AND completed_time IS NOT NULL
  )
  GROUP BY porter_user_id
)
WHERE length(ev) > 1
ORDER BY idle_minutes DESC, porter_user_id
LIMIT 10

-- R10. TREND OVER TIME: PORTER HEADCOUNT + PERFORMANCE PER MONTH
--      One single-pass GROUP BY. Do NOT build a calendar table with numbers()
--      and do NOT join fact_user_pool — both produce an unsupported range JOIN.
--      Months with no activity simply do not appear, which is correct.
SELECT
  toStartOfMonth(toTimeZone(scheduled_time, 'Asia/Kolkata')) AS request_month,
  uniqExact(porter_user_id) AS active_porters,
  uniqExact(request_id)     AS total_requests,
  uniqExactIf(request_id, status = 'RQ-CO') AS completed_requests,
  round(uniqExactIf(request_id, status = 'RQ-CO') * 100.0 / nullIf(uniqExact(request_id), 0), 2) AS completion_rate,
  round(avgIf(dateDiff('minute', assigned_time, completed_time),
              status = 'RQ-CO' AND assigned_time IS NOT NULL AND completed_time IS NOT NULL), 2) AS avg_tat_minutes
FROM fact_porter_request
WHERE facility_id = '0459'
  AND scheduled_time >= toDateTime('2025-08-01 00:00:00', 'Asia/Kolkata')
  AND scheduled_time <  toDateTime('2026-08-01 00:00:00', 'Asia/Kolkata')
GROUP BY request_month
ORDER BY request_month

-- R9. "ALL DETAILS" / "SHOW ME EVERYTHING" ABOUT REQUESTS
--     One row per request — same collapse pattern as R3.
SELECT
  request_id,
  max(status)            AS status,
  max(request_category)  AS request_category,
  max(pool_name_id)      AS pool_name_id,
  max(pool_location_id)  AS pool_location_id,
  max(porter_user_id)    AS porter_user_id,
  max(requester_user_id) AS requester_user_id,
  max(source_id)         AS source_id,
  max(destination_id)    AS destination_id,
  min(scheduled_time)    AS scheduled_time,
  max(assigned_time)     AS assigned_time,
  max(completed_time)    AS completed_time
FROM (
  SELECT request_id, status, request_category, pool_name_id, pool_location_id,
         porter_user_id, requester_user_id, source_id, destination_id,
         scheduled_time, assigned_time, completed_time
  FROM fact_porter_request
  WHERE facility_id = '0459'
)
GROUP BY request_id
ORDER BY scheduled_time DESC, request_id
LIMIT 500
"""

# Enhanced conversation state management
class ConversationState:
    """Manages multi-turn conversation context for both domains"""
    
    def __init__(self):
        self.conversation_history = []
        self.user_preferences = {
            'date_format': 'ISO'
        }
        self.context_memory = {}
        self.last_query_result = None
        self.suggested_queries = []
        self.current_domain = 'porter'  # Track current data domain
    
    def add_interaction(self, query: str, response: Dict[str, Any]):
        """Add interaction to conversation history"""
        import time
        
        # Update current domain based on response
        if 'data_domain' in response:
            self.current_domain = response['data_domain']
            
        self.conversation_history.append({
            'timestamp': time.time(),
            'query': query,
            'response': response,
            'context': self.context_memory.copy(),
            'domain': response.get('data_domain', 'porter')
        })
        
        # Keep only last 10 interactions for context
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
    
    def get_conversation_context(self) -> str:
        """Get conversation context for AI"""
        if not self.conversation_history:
            return ""
        
        context = "CONVERSATION CONTEXT:\n"
        for interaction in self.conversation_history[-3:]:  # Last 3 interactions
            domain = interaction.get('domain', 'porter')
            context += f"[{domain.upper()}] Previous Query: {interaction['query']}\n"
            if interaction['response'].get('success'):
                context += f"Result: {interaction['response'].get('summary', '')}\n"
        
        context += f"Current Domain Focus: {self.current_domain.upper()}\n"
        
        return context

# Validate configuration on import and debug if needed
