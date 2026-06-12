# backend/config/settings.py
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_deployment: str = "gpt-4.1"
    azure_openai_api_version: str = "2025-01-01-preview"

    # ClickHouse
    clickhouse_host: str
    clickhouse_port: int = 8123
    clickhouse_username: str = "default"
    clickhouse_password: str
    clickhouse_database: str = "ovitag_dw"

    # Auth & Security
    jwt_secret: str = "trackerwave-auth-secret-key-32-bytes-secure"
    jwt_expire_hours: int = 24
    api_key: str = "trackerwave-demo-api-key-2026"
    admin_token: str = ""
    demo_user_name: str = "Analytics Admin"
    demo_user_email: str = "admin@trackerwave.com"
    demo_user_password_hash: str = ""

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:4200"]

    # App
    environment: str = "development"
    app_port: int = 8000
    max_query_timeout: int = 30

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Backward compatibility for Phase 1 migration
class Config:
    @property
    def AZURE_OPENAI_ENDPOINT(self): return settings.azure_openai_endpoint
    @property
    def AZURE_OPENAI_API_KEY(self): return settings.azure_openai_api_key
    @property
    def AZURE_OPENAI_DEPLOYMENT(self): return settings.azure_openai_deployment
    @property
    def AZURE_OPENAI_API_VERSION(self): return settings.azure_openai_api_version
    
    # Fallback to regular OpenAI if Azure not configured (added as None since it was removed from BaseSettings)
    OPENAI_API_KEY = None
    OPENAI_MODEL = None
    
    @property
    def CLICKHOUSE_HOST(self): return settings.clickhouse_host
    @property
    def CLICKHOUSE_PORT(self): return settings.clickhouse_port
    @property
    def CLICKHOUSE_USERNAME(self): return settings.clickhouse_username
    @property
    def CLICKHOUSE_PASSWORD(self): return settings.clickhouse_password
    @property
    def CLICKHOUSE_DATABASE(self): return settings.clickhouse_database
    @property
    def MAX_QUERY_TIMEOUT(self): return settings.max_query_timeout

    DATE_FORMATS = {
        'US': { 'display': 'MM/DD/YYYY', 'input_patterns': ['%m/%d/%Y', '%m-%d-%Y', '%m.%d.%Y'], 'strftime': '%m/%d/%Y' },
        'EU': { 'display': 'DD/MM/YYYY', 'input_patterns': ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y'], 'strftime': '%d/%m/%Y' },
        'ISO': { 'display': 'YYYY-MM-DD', 'input_patterns': ['%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d'], 'strftime': '%Y-%m-%d' }
    }
    
    STATUS_CODES = {
        'RQ-CO': 'Completed', 'RQ-CA': 'Cancelled', 'RQ-IP': 'In Progress',
        'RQ-AS': 'Assigned', 'RQ-AC': 'Accepted', 'RQ-AR': 'Arrived',
        'RQ-OH': 'On Hold', 'RQ-RJ': 'Rejected'
    }
    
    ASSET_STATUS_CODES = {
        0: 'Inactive', 1: 'Active', 'COMMISSIONED': 'Commissioned',
        'DECOMMISSIONED': 'Decommissioned', 'UNDER_MAINTENANCE': 'Under Maintenance',
        'AVAILABLE': 'Available', 'IN_USE': 'In Use', 'DAMAGED': 'Damaged'
    }

    DEMO_QUESTIONS = [
        "Show porter performance by facility",
        "Show all porter performance metrics",
        "Display porter request counts by facility",
        "Count assets by department",
        "Show asset distribution by assigned department",
        "Display all active assets by department",
        "Show requests from June 2025",
        "Display all requests from 2025",
        "Show porter performance as bar chart",
        "Count assets by department as pie chart",
        "Show me all columns for recent porter requests",
        "Display all asset information in detail"
    ]
    
    SAMPLE_QUESTIONS = DEMO_QUESTIONS + [
        "Show porter performance by facility with TAT analysis",
        "Which porter had the minimum TAT overall?",
        "Show cancelled requests for facility 184",
        "Which assets have warranty expiring next month?",
        "Show assets by owner department with details"
    ]
    
    @classmethod
    def validate_config(cls):
        pass

Config = Config()
