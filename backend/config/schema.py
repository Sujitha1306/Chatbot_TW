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
    def get_mini_schema_prompt(cls) -> str:
        return """## DATABASE: ClickHouse

### TABLE: fact_porter_request
Purpose: Hospital porter transport requests
Columns:
- id, request_detail_id, facility_id, porter_user_id, status, request_category, pool_name_id, pool_location_id, requester_user_id, source_id, destination_id, scheduled_time, start_time, end_time, assigned_time, accepted_time, arrived_time, cancelled_time, onhold_time, inprogress_time, rejected_time, completed_time, request_type_id, is_auto_assigned, comp_manually, asset_category, service_group_id, asset_count, priority, is_round_trip, patient_id

### TABLE: tw_demo.mysql_asset
Purpose: Hospital assets inventory
Columns:
- id, name, is_active, location_id, facility_id, asset_serial_number, home_location_id, transfer_status_id, asset_type_id, status, warranty_due, asset_cost, current_book_value, vendor_name, next_cali_date, commissioned_on, is_radiology, depreciation_percent, asset_admin_department, owner_id, vendor_contact, vendor_email, service_provider_name

### TABLE: tw_demo.mysql_location
Purpose: Location mapping (ICU, Wards, etc).
Columns:
- id, name, facility_id, status

NOTE: No complex SQL rules needed here. Just select the required tables and columns for your analytical plan.
"""

    @classmethod
    def get_llm_schema_prompt(cls) -> str:
        return """## DATABASE: ClickHouse

### TABLE: fact_porter_request
Purpose: Hospital porter transport requests
Columns:
- id (Int64): row identifier
- request_detail_id (Int64): unique request ID
- facility_id (String): e.g. '0184' — ALWAYS treat as STRING, never Int
- porter_user_id (Int64, nullable): assigned porter ID
- status (String):
    RQ-CO = Completed  |  RQ-CA = Cancelled  |  RQ-IP = In Progress
    RQ-AS = Assigned   |  RQ-AC = Accepted   |  RQ-AR = Arrived
    RQ-OH = On Hold    |  RQ-RJ = Rejected
- request_category (String): PR-PA = Patient transport, PR-SE = Service
- pool_name_id (Int64, nullable): Pool name identifier
- pool_location_id (Int64, nullable): Pool location identifier
- requester_user_id (Int64, nullable): Requesting user identifier
- source_id (Int64, nullable): Source location identifier
- destination_id (Int64, nullable): Destination location identifier
- scheduled_time (DateTime UTC): request creation time
- completed_time (DateTime UTC, nullable): completion time
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

### TABLE: tw_demo.mysql_location
Purpose: Location mapping (ICU, Wards, etc). You MUST use the full tw_demo.mysql_location table name.
Columns:
- id (Int64): location ID (matches location_id in asset table or source_id/destination_id in porter table)
- name (String): Human-readable location name (e.g. 'icu', 'ward 1')
- facility_id (String): facility identifier
- status (Int64): 1 = active, 0 = inactive
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
13. NO DIMENSION TABLE JOINS IN SELECT: Do NOT attempt to join dimension tables (like dim_app_terms, dim_user, dim_location) to get human-readable names in the SELECT clause. Simply SELECT the raw ID columns (e.g. facility_id, pool_name_id, requester_user_id, source_id, status, request_category). The UI presentation layer will automatically translate these raw IDs into human-readable names for the user. However, you MAY use subqueries against tw_demo.mysql_location in the WHERE clause to resolve location names (e.g., `WHERE location_id IN (SELECT id FROM tw_demo.mysql_location WHERE name ILIKE '%icu%')`).
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
