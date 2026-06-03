"""
Redis cache layer – Task 5
- SHA-256 key (built by GroqClient.make_cache_key)
- 15-minute TTL (configurable via REDIS_CACHE_TTL)
- Hit / miss tracking returned in response headers
"""
import json
import logging
from typing import Optional, Any

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)


class CacheStats:
    hits: int = 0
    misses: int = 0

    @classmethod
    def record_hit(cls):
        cls.hits += 1

    @classmethod
    def record_miss(cls):
        cls.misses += 1

    @classmethod
    def summary(cls) -> dict:
        total = cls.hits + cls.misses
        rate = round(cls.hits / total * 100, 1) if total else 0.0
        return {"hits": cls.hits, "misses": cls.misses, "hit_rate_pct": rate}


class RedisCache:
    """Simple JSON-serialising Redis cache with TTL."""

    def __init__(self):
        settings = get_settings()
        self._ttl = settings.redis_cache_ttl
        try:
            self._redis = redis.from_url(settings.redis_url, decode_responses=True)
            self._redis.ping()
            self._available = True
            logger.info("Redis connected: %s", settings.redis_url)
        except Exception as exc:
            logger.warning("Redis unavailable (%s) – caching disabled.", exc)
            self._available = False

    @property
    def available(self) -> bool:
        return self._available

    def get(self, key: str) -> Optional[Any]:
        """Return cached value or None."""
        if not self._available:
            CacheStats.record_miss()
            return None
        try:
            raw = self._redis.get(f"groq:{key}")
            if raw:
                CacheStats.record_hit()
                logger.debug("Cache HIT  key=%s", key[:16])
                return json.loads(raw)
            CacheStats.record_miss()
            logger.debug("Cache MISS key=%s", key[:16])
            return None
        except Exception as exc:
            logger.warning("Redis GET error: %s", exc)
            CacheStats.record_miss()
            return None

    def set(self, key: str, value: Any) -> bool:
        """Store value with TTL. Returns True on success."""
        if not self._available:
            return False
        try:
            self._redis.setex(
                f"groq:{key}",
                self._ttl,
                json.dumps(value, ensure_ascii=False),
            )
            return True
        except Exception as exc:
            logger.warning("Redis SET error: %s", exc)
            return False

    def store_session(self, session_id: str, messages: list, ttl: int = 3600):
        """Store chat session messages (patient simulator)."""
        if not self._available:
            return
        try:
            self._redis.setex(
                f"session:{session_id}",
                ttl,
                json.dumps(messages, ensure_ascii=False),
            )
        except Exception as exc:
            logger.warning("Redis session store error: %s", exc)

    def get_session(self, session_id: str) -> list:
        """Retrieve chat session messages."""
        if not self._available:
            return []
        try:
            raw = self._redis.get(f"session:{session_id}")
            return json.loads(raw) if raw else []
        except Exception as exc:
            logger.warning("Redis session get error: %s", exc)
            return []


# Module-level singleton
_cache: Optional[RedisCache] = None


def get_cache() -> RedisCache:
    global _cache
    if _cache is None:
        _cache = RedisCache()
    return _cache
