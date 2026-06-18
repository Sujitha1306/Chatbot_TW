import logging
import pandas as pd
import clickhouse_connect
import re
from typing import Tuple, Dict, Any
from backend.config.settings import Config

logger = logging.getLogger(__name__)

class ClickHouseConnection:
    """Enhanced ClickHouse database connections with asset management support."""
    
    def __init__(self):
        self.host = Config.CLICKHOUSE_HOST
        self.port = Config.CLICKHOUSE_PORT
        self.username = Config.CLICKHOUSE_USERNAME
        # Use password exactly as provided by Config - no processing
        self.password = Config.CLICKHOUSE_PASSWORD
        self.database = Config.CLICKHOUSE_DATABASE
        self.client = None
        self.connect()
    
    def connect(self):
        """Establish connection to ClickHouse database."""
        try:
            logger.info(f"Connecting to ClickHouse: {self.username}@{self.host}:{self.port}/{self.database}")
            
            self.client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                database=self.database,
                connect_timeout=Config.MAX_QUERY_TIMEOUT,
                send_receive_timeout=Config.MAX_QUERY_TIMEOUT
            )
            logger.info("Successfully connected to ClickHouse database")
        except Exception as e:
            logger.error(f"Failed to connect to ClickHouse: {str(e)}")
            raise
    
    def execute_query(self, query: str, limit: int = None) -> Tuple[pd.DataFrame, bool]:
        """Execute SQL query with enhanced error handling and ClickHouse fixes."""
        try:
            # Fix ClickHouse-specific issues
            query = self._fix_clickhouse_sql(query)
            
            if limit and limit > 0 and query.strip().upper().startswith('SELECT') and 'LIMIT' not in query.upper():
                query += f" LIMIT {limit}"
            
            logger.info(f"Executing query: {query[:200]}...")
            result = self.client.query_df(query)
            logger.info(f"Query executed successfully, returned {len(result)} rows")
            return result, True
            
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            logger.error(f"Failed query: {query}")
            return pd.DataFrame(), False
    
    def execute_query_with_error(self, query: str) -> tuple:
        """
        Returns (DataFrame, success_bool, error_string).
        Never raises — caller decides how to handle failure.
        """
        try:
            query = self._fix_clickhouse_sql(query)
            result = self.client.query_df(query)
            return result, True, None
        except Exception as e:
            logger.error("Query failed: %s\nSQL: %s", e, query)
            return pd.DataFrame(), False, str(e)
    
    def _fix_clickhouse_sql(self, query: str) -> str:
        """Fix common ClickHouse SQL syntax issues."""
        # Fix MySQL-style DATE functions for ClickHouse
        query = query.replace('CURRENT_DATE', 'today()')
        query = query.replace('DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)', 'today() - INTERVAL 30 DAY')
        query = query.replace('CURRENT_DATE + INTERVAL', 'today() + INTERVAL')
        query = query.replace('DATE(scheduled_time)', 'toDate(scheduled_time)')
        
        # Fix NOW() function
        query = query.replace('now() +', 'now() +')
        query = query.replace('NOW()', 'now()')
        
        # Fix INTERVAL syntax
        query = re.sub(r'INTERVAL (\d+) DAY', r'INTERVAL \1 day', query)
        query = re.sub(r'INTERVAL (\d+) MONTH', r'INTERVAL \1 month', query)
        
        if 'GROUP BY' in query.upper():
            # ClickHouse prefers column numbers in GROUP BY
            lines = query.split('\n')
            select_line = None
            for line in lines:
                if 'SELECT' in line.upper():
                    select_line = line
                    break
            
            if select_line and 'AS ' in select_line:
                # Extract aliases and replace in GROUP BY
                aliases = re.findall(r'AS (\w+)', select_line, re.IGNORECASE)
                for i, alias in enumerate(aliases, 1):
                    query = re.sub(f'GROUP BY {alias}', f'GROUP BY {i}', query, flags=re.IGNORECASE)
                    
        # Remove trailing semicolons as clickhouse_connect appends ' FORMAT Native'
        query = query.strip()
        if query.endswith(';'):
            query = query[:-1]
        
        return query
    
    def get_schema_info(self) -> Dict[str, Any]:
        """Get enhanced schema information for both porter and asset tables."""
        try:
            # Get porter table schema
            porter_schema_query = "DESCRIBE TABLE fact_porter_request"
            porter_result, porter_success = self.execute_query(porter_schema_query)
            
            # Get asset table schema  
            asset_schema_query = "DESCRIBE TABLE mysql_asset"
            asset_result, asset_success = self.execute_query(asset_schema_query)
            
            schema_info = {}
            if porter_success:
                schema_info['porter'] = porter_result.to_dict('records')
            if asset_success:
                schema_info['asset'] = asset_result.to_dict('records')
                
            return schema_info
        except Exception as e:
            logger.error(f"Failed to get schema info: {str(e)}")
            return {}
    
    def get_data_preview(self, table: str = "fact_porter_request", limit: int = 5) -> pd.DataFrame:
        """Get data preview for AI context."""
        try:
            query = f"SELECT * FROM {table} ORDER BY scheduled_time DESC LIMIT {limit}" if table == "fact_porter_request" else f"SELECT * FROM {table} ORDER BY created_on DESC LIMIT {limit}"
            result, success = self.execute_query(query)
            return result if success else pd.DataFrame()
        except Exception as e:
            logger.warning(f"Could not get data preview: {str(e)}")
            return pd.DataFrame()

