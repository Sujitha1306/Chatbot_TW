import os
import logging
import threading
import mysql.connector

logger = logging.getLogger(__name__)

# Module-level connection pool
_mysql_pool = None

class PooledConnWrapper:
    """Wrapper around mysql.connector connection that returns to pool on close()."""
    def __init__(self, pool, conn):
        self._pool = pool
        self._conn = conn
        self._closed = False

    def close(self):
        if not self._closed:
            self._closed = True
            self._pool.release_connection(self._conn)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __getattr__(self, name):
        if self._conn:
            return getattr(self._conn, name)
        raise AttributeError(f"Connection closed, cannot access '{name}'")


class LazyMySQLPool:
    """A lazy, non-blocking connection pool that warms up in a background thread."""
    def __init__(self, pool_name: str, pool_size: int, config: dict):
        self.pool_name = pool_name
        self.max_size = pool_size
        self.config = config
        self.idle = []
        self.total = 0
        self.lock = threading.Lock()
        # Launch background thread to warm up initial connections without blocking startup
        threading.Thread(target=self._warmup, daemon=True).start()
        logger.info(f"Lazy MySQL connection pool '{pool_name}' initialized with max size {pool_size}")

    def _warmup(self):
        warmup_count = min(self.max_size, 2)
        for _ in range(warmup_count):
            try:
                c = mysql.connector.connect(**self.config)
                with self.lock:
                    self.idle.append(c)
                    self.total += 1
            except Exception as e:
                logger.warning(f"LazyPool warmup connection failed: {e}")

    def get_connection(self):
        with self.lock:
            while self.idle:
                c = self.idle.pop()
                try:
                    c.ping(reconnect=False)
                    return PooledConnWrapper(self, c)
                except Exception:
                    self.total -= 1
                    try:
                        c.close()
                    except Exception:
                        pass
        c = mysql.connector.connect(**self.config)
        with self.lock:
            self.total += 1
        return PooledConnWrapper(self, c)

    def release_connection(self, c):
        with self.lock:
            if len(self.idle) < self.max_size:
                self.idle.append(c)
            else:
                try:
                    c.close()
                except Exception:
                    pass
                self.total -= 1


def get_mysql_pool():
    global _mysql_pool
    if _mysql_pool is None:
        try:
            pool_name = "chat_pool"
            pool_size = int(os.environ.get("MYSQL_POOL_SIZE", "10"))
            
            dbconfig = {
                "host": os.environ.get("MYSQL_HOST", "localhost"),
                "port": int(os.environ.get("MYSQL_PORT", "3306")),
                "user": os.environ["MYSQL_USER"],
                "password": os.environ["MYSQL_PASSWORD"],
                "database": os.environ.get("MYSQL_DB", "trackerwave_chat"),
                "charset": "utf8mb4",
                "collation": "utf8mb4_unicode_ci",
                "connect_timeout": 30,
                "read_timeout": int(os.environ.get("MYSQL_READ_TIMEOUT", "30")),
                "write_timeout": int(os.environ.get("MYSQL_WRITE_TIMEOUT", "30")),
                "use_pure": True,
            }
            
            _mysql_pool = LazyMySQLPool(pool_name=pool_name, pool_size=pool_size, config=dbconfig)
        except Exception as e:
            logger.error(f"Failed to create MySQL connection pool: {e}")
            raise
            
    return _mysql_pool


def get_mysql_connection():
    pool = get_mysql_pool()
    try:
        return pool.get_connection()
    except Exception as e:
        logger.error(f"Error obtaining connection from pool, falling back to direct connect: {e}")
        dbconfig = {
            "host": os.environ.get("MYSQL_HOST", "localhost"),
            "port": int(os.environ.get("MYSQL_PORT", "3306")),
            "user": os.environ["MYSQL_USER"],
            "password": os.environ["MYSQL_PASSWORD"],
            "database": os.environ.get("MYSQL_DB", "trackerwave_chat"),
            "charset": "utf8mb4",
            "collation": "utf8mb4_unicode_ci",
            "connect_timeout": 30,
            "read_timeout": 30,
            "write_timeout": 30,
            "use_pure": True,
        }
        return mysql.connector.connect(**dbconfig)

