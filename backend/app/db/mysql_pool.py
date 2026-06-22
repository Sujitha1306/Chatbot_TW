import os
import logging
import mysql.connector
from mysql.connector import pooling

logger = logging.getLogger(__name__)

# Module-level connection pool
_mysql_pool = None

def get_mysql_pool():
    global _mysql_pool
    if _mysql_pool is None:
        try:
            # Default pool size = 10 per requirements
            pool_name = "chat_pool"
            pool_size = int(os.environ.get("MYSQL_POOL_SIZE", "10"))
            
            dbconfig = {
                "host": os.environ.get("MYSQL_HOST", "localhost"),
                "port": int(os.environ.get("MYSQL_PORT", "3306")),
                "user": os.environ["MYSQL_USER"],
                "password": os.environ["MYSQL_PASSWORD"],
                "database": os.environ.get("MYSQL_DB", "trackerwave_chat"),
                "charset": "utf8mb4",
                "collation": "utf8mb4_unicode_ci"
            }
            
            _mysql_pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name=pool_name,
                pool_size=pool_size,
                pool_reset_session=True,
                **dbconfig
            )
            logger.info(f"MySQL connection pool '{pool_name}' created with size {pool_size}")
        except Exception as e:
            logger.error(f"Failed to create MySQL connection pool: {e}")
            raise
            
    return _mysql_pool

def get_mysql_connection():
    pool = get_mysql_pool()
    return pool.get_connection()
