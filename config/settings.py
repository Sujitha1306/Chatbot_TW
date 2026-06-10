import os
import logging
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

class Config:
    """Main configuration class for TrackerWave with asset management support"""
    
    # Azure OpenAI Configuration - Updated to GPT-4.1
    AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
    AZURE_OPENAI_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')
    AZURE_OPENAI_DEPLOYMENT = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4.1')
    AZURE_OPENAI_API_VERSION = os.getenv('AZURE_OPENAI_API_VERSION', '2025-01-01-preview')
    
    # Fallback to regular OpenAI if Azure not configured
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4')
    OPENAI_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0.1'))
    OPENAI_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '2000'))
    
    # ClickHouse Configuration
    CLICKHOUSE_HOST = os.getenv('CLICKHOUSE_HOST', '172.188.240.120')
    CLICKHOUSE_PORT = int(os.getenv('CLICKHOUSE_PORT', '8123'))
    CLICKHOUSE_USERNAME = os.getenv('CLICKHOUSE_USERNAME', 'default')
    
    # Proper password handling
    CLICKHOUSE_PASSWORD = os.getenv('CLICKHOUSE_PASSWORD')
    if CLICKHOUSE_PASSWORD:
        logger.info("Loaded CLICKHOUSE_PASSWORD from environment")
    
    CLICKHOUSE_DATABASE = os.getenv('CLICKHOUSE_DATABASE', 'ovitag_dw')
    
    # Application Settings
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    MAX_QUERY_TIMEOUT = int(os.getenv('MAX_QUERY_TIMEOUT', '30'))
    DEFAULT_ROW_LIMIT = int(os.getenv('DEFAULT_ROW_LIMIT', '100'))
    
    # Flask API Configuration
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    FLASK_HOST = os.getenv('FLASK_HOST', '127.0.0.1')
    FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))
    
    # File paths
    LOG_FILE_PATH = os.getenv('LOG_FILE_PATH', 'chatbot.log')
    
    # Streamlit Configuration
    STREAMLIT_PAGE_TITLE = "TrackerWave Analytics"
    STREAMLIT_PAGE_ICON = "📊"
    STREAMLIT_LAYOUT = "wide"
    
    # Business Logic Constants
    TAT_CALCULATION = "round(dateDiff('second', scheduled_time, completed_time)/60.0, 2)"
    
    # Status Code Mappings for Porter Requests
    STATUS_CODES = {
        'RQ-CO': 'Completed',
        'RQ-CA': 'Cancelled',
        'RQ-IP': 'In Progress',
        'RQ-AS': 'Assigned',
        'RQ-AC': 'Accepted',
        'RQ-AR': 'Arrived',
        'RQ-OH': 'On Hold',
        'RQ-RJ': 'Rejected'
    }
    
    # Asset Status Mappings
    ASSET_STATUS_CODES = {
        0: 'Inactive',
        1: 'Active',
        'COMMISSIONED': 'Commissioned',
        'DECOMMISSIONED': 'Decommissioned',
        'UNDER_MAINTENANCE': 'Under Maintenance',
        'AVAILABLE': 'Available',
        'IN_USE': 'In Use',
        'DAMAGED': 'Damaged'
    }
    
    # Date Format Options - FIXED to ensure proper formatting
    DATE_FORMATS = {
        'US': {
            'display': 'MM/DD/YYYY',
            'input_patterns': ['%m/%d/%Y', '%m-%d-%Y', '%m.%d.%Y'],
            'strftime': '%m/%d/%Y'
        },
        'EU': {
            'display': 'DD/MM/YYYY',
            'input_patterns': ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y'],
            'strftime': '%d/%m/%Y'
        },
        'ISO': {
            'display': 'YYYY-MM-DD',
            'input_patterns': ['%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d'],
            'strftime': '%Y-%m-%d'
        }
    }
    
    # Client Meeting Demo Questions - Guaranteed to work
    DEMO_QUESTIONS = [
        # Basic Porter Performance (Always works)
        "Show porter performance by facility",
        "Show all porter performance metrics",
        "Display porter request counts by facility",
        
        # Asset Management (High success rate)
        "Count assets by department",
        "Show asset distribution by assigned department",
        "Display all active assets by department",
        
        # Time-based queries (Formatted for reliability)
        "Show requests from June 2025",
        "Display all requests from 2025",
        
        # Chart demonstrations
        "Show porter performance as bar chart",
        "Count assets by department as pie chart",
        
        # All columns displays
        "Show me all columns for recent porter requests",
        "Display all asset information in detail"
    ]
    
    # Enhanced Sample Questions for comprehensive testing
    SAMPLE_QUESTIONS = [
        # Porter Management - High Priority for Client Demo
        "Show porter performance by facility with TAT analysis",
        "Which porter had the minimum TAT overall?",
        "Display average turnaround time as a bar chart",
        "Show cancelled requests for facility 184", 
        "Create request volume trends over time",
        "Compare facility performance side by side",
        "Show all columns for recent requests",
        "Display request patterns by priority level",
        
        # Asset Management - Demo Ready
        "Count assets by department and show distribution", 
        "Show assets by asset type as bar chart",
        "Which assets have warranty expiring next month?",
        "Department based asset analysis with costs",
        "Display asset distribution by criticality level",
        "Show assets by owner department with details",
        "List assets with expired warranty status",
        "Display asset cost distribution by facility",
        "Show monthly asset commissioning trends",
        "Assets requiring maintenance next month",
        
        # Multi-domain - Advanced Demo
        "Compare facility utilization for assets and requests",
        "Show comprehensive facility analytics dashboard"
    ]
    
    # Performance Optimization Settings - Updated for GPT-4.1
    PERFORMANCE_CONFIG = {
        'current_model': 'GPT-4.1',
        'current_speed': '3-7 seconds',
        'previous_model': 'GPT-4o Mini', 
        'previous_speed': '10-20 seconds',
        'speed_improvement': '3-5x faster performance',
        'enhanced_features': 'Better reasoning, improved accuracy, faster responses'
    }
    
    # Chart Type Mappings for AI Understanding
    CHART_TYPES = {
        'line': ['line', 'trend', 'time series', 'over time', 'timeline'],
        'bar': ['bar', 'column', 'comparison', 'compare', 'by category'],
        'pie': ['pie', 'distribution', 'breakdown', 'proportion', 'percentage'],
        'scatter': ['scatter', 'correlation', 'relationship', 'vs', 'against'],
        'heatmap': ['heatmap', 'heat map', 'density', 'intensity'],
        'table': ['table', 'list', 'show all', 'detailed view']
    }
    
    # Timezone Configuration - Enhanced
    SUPPORTED_TIMEZONES = {
        'Asia/Kolkata': 'India Standard Time',
        'UTC': 'Coordinated Universal Time',
        'US/Eastern': 'Eastern Time',
        'US/Pacific': 'Pacific Time',
        'Europe/London': 'Greenwich Mean Time',
        'Asia/Tokyo': 'Japan Standard Time',
        'Asia/Shanghai': 'China Standard Time',
        'Australia/Sydney': 'Australian Eastern Time'
    }
    
    @classmethod
    def validate_config(cls):
        """Validate that all required configuration is present"""
        required_vars = [
            'CLICKHOUSE_HOST',
            'CLICKHOUSE_PASSWORD'
        ]
        
        # Check if we have Azure OpenAI or regular OpenAI configuration
        has_azure_openai = cls.AZURE_OPENAI_ENDPOINT and cls.AZURE_OPENAI_API_KEY
        has_regular_openai = cls.OPENAI_API_KEY
        
        if not has_azure_openai and not has_regular_openai:
            required_vars.extend(['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY'])
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required configuration variables: {', '.join(missing_vars)}")
        
        return True

    @classmethod
    def debug_config(cls):
        """Debug configuration values for troubleshooting"""
        logger.info("=== TRACKERWAVE CONFIGURATION DEBUG ===")
        logger.info(f"CLICKHOUSE_HOST: {cls.CLICKHOUSE_HOST}")
        logger.info(f"CLICKHOUSE_PORT: {cls.CLICKHOUSE_PORT}")
        logger.info(f"CLICKHOUSE_USERNAME: {cls.CLICKHOUSE_USERNAME}")
        logger.info(f"CLICKHOUSE_PASSWORD: {repr(cls.CLICKHOUSE_PASSWORD)}")
        logger.info(f"CLICKHOUSE_DATABASE: {cls.CLICKHOUSE_DATABASE}")
        logger.info(f"AZURE_OPENAI_ENDPOINT: {cls.AZURE_OPENAI_ENDPOINT[:50]}..." if cls.AZURE_OPENAI_ENDPOINT else "Not set")
        logger.info(f"AZURE_OPENAI_API_KEY: {'Set' if cls.AZURE_OPENAI_API_KEY else 'Not set'}")
        logger.info("=== END CONFIG DEBUG ===")

try:
    Config.validate_config()
    logger.info("TrackerWave configuration validated successfully")
except ValueError as e:
    logger.error(f"Configuration Error: {e}")
    Config.debug_config()
    print(f"Configuration Error: {e}")
    print("Please check your .env file or environment variables")

def validate_config():
    """Module-level wrapper for backward compatibility with tests"""
    return Config.validate_config()