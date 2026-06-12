from typing import Dict, List, Any
from backend.config.settings import Config

class DatabaseSchema:
    """Enhanced database schema definitions for Porter and Asset management"""
    
    # Porter Management
    PORTER_TABLE = "fact_porter_request"
    LOOKUP_TABLE = "dim_app_terms"
    
    # Asset Management
    ASSET_TABLE = "mysql_asset"
    
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
        'id', 'name', 'asset_code', 'active_tag_id', 'asset_admin_contact_no',
        'asset_admin_email', 'invoice', 'manual', 'manufacturer', 'service_contact',
        'sla_document', 'warranty_status', 'location_description', 'asset_status',
        'next_amc_due', 'pms_due', 'warranty_period', 'comments', 'service_address',
        'amc_status', 'status', 'criticality', 'prev_main_freq', 'cali_freq',
        'commissioned_on', 'location_id', 'asset_remove_reason_id', 'service_person_email',
        'asset_serial_number', 'facility_id', 'asset_type_id', 'cost_type_id',
        'battery_percent', 'next_cali_date', 'end_date', 'software_version',
        'vendor_name', 'home_location_id', 'transfer_status_id', 'asset_category_id',
        'asset_category1_id', 'asset_category2_id', 'criteria', 'warranty_due',
        'asset_cost', 'current_book_value', 'depreciation_percent', 'depreciation_type_id',
        'asset_admin_department', 'owner_id', 'owner_department_id', 'assigned_department_id',
        'parent_id', 'asset_user_id', 'cost_center_id', 'useful_life', 'po_date',
        'is_temp', 'vendor_contact', 'vendor_email', 'service_provider_name',
        'size', 'color', 'material', 'cycle_count', 'cycle_date', 'condition',
        'collected_date_time', 'collected_by', 'laundry_type', 'storage_area',
        'storage_date', 'cycle_type', 'batch_no', 'batch_start_date_time',
        'batch_end_date_time', 'performed_by', 'created_by', 'created_on',
        'modified_by', 'modified_on', 'is_active'
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
        'pool_name_id': 'Pool name identifier (join with dim_app_terms)',
        'pool_location_id': 'Pool location ID',
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
        'asset_code': 'Asset code number',
        'facility_id': 'Facility where asset is located (STRING with leading zeros)',
        'asset_type_id': 'Asset type classification (e.g., AT-MD, AT-EQ)',
        'asset_category_id': 'Primary asset category (e.g., AC-MD, AC-IT)',
        'asset_category1_id': 'Secondary asset category',
        'asset_category2_id': 'Tertiary asset category',
        'location_id': 'Current location of the asset',
        'home_location_id': 'Home/default location of the asset',
        'status': 'Asset status (0=inactive, 1=active)',
        'asset_status': 'Descriptive asset status',
        'criticality': 'Asset criticality level (Critical, High, Medium, Low)',
        'warranty_due': 'Warranty expiration date',
        'next_amc_due': 'Next Annual Maintenance Contract due date',
        'pms_due': 'Preventive Maintenance Schedule due date',
        'commissioned_on': 'Date when asset was commissioned',
        'asset_cost': 'Original purchase cost of the asset',
        'current_book_value': 'Current book value of the asset',
        'owner_id': 'Owner user ID',
        'owner_department_id': 'Department that owns the asset',
        'assigned_department_id': 'Department currently assigned to use the asset',
        'vendor_name': 'Vendor or supplier name',
        'manufacturer': 'Asset manufacturer',
        'created_by': 'User who created the asset record',
        'created_on': 'Date when asset record was created',
        'modified_by': 'User who last modified the asset record',
        'modified_on': 'Date when asset record was last modified',
        'is_active': 'Active status flag (1=active, 0=inactive)'
    }
    
    # Combined column descriptions
    COLUMN_DESCRIPTIONS = {**PORTER_COLUMN_DESCRIPTIONS, **ASSET_COLUMN_DESCRIPTIONS}
    
    # Time-related columns for date formatting
    TIME_COLUMNS = [
        # Porter time columns
        'scheduled_time', 'start_time', 'end_time', 'assigned_time',
        'accepted_time', 'arrived_time', 'cancelled_time', 'onhold_time',
        'inprogress_time', 'rejected_time', 'completed_time',
        
        # Asset time columns
        'warranty_due', 'next_amc_due', 'pms_due', 'commissioned_on',
        'next_cali_date', 'end_date', 'po_date', 'cycle_date',
        'collected_date_time', 'storage_date', 'batch_start_date_time',
        'batch_end_date_time', 'created_on', 'modified_on'
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
    def get_llm_schema_prompt(cls) -> str:
        return """## DATABASE: ovitag_dw (ClickHouse)

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
- scheduled_time (DateTime UTC): request creation time
- completed_time (DateTime UTC, nullable): completion time
- TAT formula: round(dateDiff('second', scheduled_time, completed_time)/60.0, 2) AS tat_minutes
- Filter NULL TAT: WHERE isNotNull(completed_time)

### TABLE: mysql_asset
Purpose: Hospital equipment inventory
Columns:
- id (Int64): asset ID
- name (String): equipment name
- asset_status (String): AVAILABLE | IN_USE | UNDER_MAINTENANCE | DAMAGED
- criticality (String): Critical | High | Medium | Low
- facility_id (String): same string format as porter table
- assigned_department_id (Int64, nullable)
- owner_department_id (Int64, nullable)
- warranty_due (Date, nullable): warranty expiry date
- asset_cost (Float64, nullable): purchase cost in INR
- commissioned_on (Date, nullable)
- is_active (String): '1' = active, '0' = inactive

### CLICKHOUSE SQL — MANDATORY RULES:
1. Date functions: toDate(), toMonth(), toYear(), today(), now()
   INVALID: CURRENT_DATE, DATE_SUB, DATE_FORMAT, DATEDIFF (MySQL syntax)
2. Intervals: INTERVAL 1 DAY | INTERVAL 1 MONTH | INTERVAL 1 YEAR
3. Last month filter:
   toMonth(scheduled_time) = toMonth(today() - INTERVAL 1 MONTH)
   AND toYear(scheduled_time) = toYear(today() - INTERVAL 1 MONTH)
4. facility_id is STRING: WHERE facility_id = '0184'  (not = 0184)
5. NULL checks: isNull(col) / isNotNull(col) — not IS NULL in all contexts
6. String contains: LIKE '%value%'
7. Always include LIMIT (default 500) unless user explicitly asks for all data
8. Percentage: (count_filtered * 100.0 / count_total) — no PERCENT function. Do NOT use window functions like OVER () for percentages. Use subqueries or cross joins to get totals.
9. GROUP BY must list all non-aggregate SELECT columns exactly
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
