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
                send_receive_timeout=Config.MAX_QUERY_TIMEOUT,
                settings={
                    # A derived table used in a JOIN must otherwise carry an
                    # explicit alias, or the server rejects the whole query with
                    # "Code: 206 ... ALIAS_REQUIRED". Generated SQL omits that
                    # alias regularly, and the restriction buys us nothing — the
                    # error message itself recommends turning it off. Disabling
                    # it removes an entire class of failure deterministically,
                    # rather than relying on the model to remember the alias.
                    "joined_subquery_requires_alias": 0,
                },
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
        
        # NOTE: a rewrite that replaced `GROUP BY <alias>` with a positional
        # `GROUP BY <n>` used to live here. It was actively harmful:
        #   * this server (22.2.2.1) does NOT enable positional arguments, so
        #     `GROUP BY 1` fails with "Column X is not under aggregate function
        #     and not in GROUP BY", while `GROUP BY <alias>` works fine;
        #   * it numbered aliases from the FIRST line containing "SELECT", so on
        #     a multi-line query the position it substituted was arbitrary;
        #   * it fired only when "GROUP BY <alias>" happened to sit on one line,
        #     so identical queries broke or worked purely on formatting.
        # Verified against the live server before removing — do not reinstate.

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

