import hashlib
import logging
import pickle
from cachetools import TTLCache
from threading import Lock

logger = logging.getLogger(__name__)

# Separate TTL per domain — asset data changes less frequently than porter data
_porter_cache: TTLCache = TTLCache(maxsize=200, ttl=300)   # 5 minutes
_asset_cache:  TTLCache = TTLCache(maxsize=200, ttl=900)   # 15 minutes
_both_cache:   TTLCache = TTLCache(maxsize=100, ttl=300)   # 5 minutes

_lock = Lock()


def _normalize_question(question: str) -> str:
    """Lowercase and strip whitespace for consistent cache keys."""
    return " ".join(question.lower().strip().split())


def _make_cache_key(question: str, row_limit: int, chart_type: str | None) -> str:
    normalized = _normalize_question(question)
    raw = f"{normalized}|{row_limit}|{chart_type or 'auto'}"
    return hashlib.md5(raw.encode()).hexdigest()


def _get_cache_for_domain(domain: str) -> TTLCache:
    if domain == "asset":
        return _asset_cache
    if domain == "both":
        return _both_cache
    return _porter_cache


def get_cached_result(question: str, domain: str, row_limit: int = 100, chart_type: str | None = None):
    """Return cached result dict or None if not cached."""
    key = _make_cache_key(question, row_limit, chart_type)
    cache = _get_cache_for_domain(domain)
    with _lock:
        result = cache.get(key)
    if result is not None:
        logger.info(f"Cache HIT for domain={domain} key={key[:8]}...")
        return pickle.loads(result)
    return None


def set_cached_result(
    question: str,
    domain: str,
    result: dict,
    row_limit: int = 100,
    chart_type: str | None = None,
) -> None:
    """Store a result in the cache. Skips caching demo backup results."""
    if result.get("is_demo_backup"):
        return  # Never cache demo data — it should only appear when DB is down
    if not result.get("success"):
        return  # Never cache error responses

    key = _make_cache_key(question, row_limit, chart_type)
    cache = _get_cache_for_domain(domain)

    # Plotly Figure objects are not picklable — store chart as JSON string
    cacheable = {**result}
    if cacheable.get("chart") is not None:
        try:
            cacheable["chart_json"] = cacheable["chart"].to_json()
            cacheable["chart"] = None
        except Exception:
            cacheable["chart"] = None

    with _lock:
        cache[key] = pickle.dumps(cacheable)
    logger.info(f"Cache SET for domain={domain} key={key[:8]}...")


def restore_chart_from_cache(result: dict):
    """Re-inflate Plotly chart from JSON after cache retrieval."""
    import plotly.io as pio
    if result.get("chart_json"):
        try:
            result["chart"] = pio.from_json(result["chart_json"])
        except Exception:
            result["chart"] = None
        del result["chart_json"]
    return result


def get_cache_stats() -> dict:
    """Return current cache sizes for the /health endpoint."""
    return {
        "porter_cache": {"size": len(_porter_cache), "maxsize": _porter_cache.maxsize, "ttl": 300},
        "asset_cache":  {"size": len(_asset_cache),  "maxsize": _asset_cache.maxsize,  "ttl": 900},
        "both_cache":   {"size": len(_both_cache),   "maxsize": _both_cache.maxsize,   "ttl": 300},
    }


def clear_all_caches() -> None:
    """Clear all caches — useful after data refreshes or in tests."""
    with _lock:
        _porter_cache.clear()
        _asset_cache.clear()
        _both_cache.clear()
    logger.info("All query caches cleared.")
