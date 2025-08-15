import json
from typing import Any, Optional, Union, Dict, List
import redis.asyncio as redis
from .config import settings
import logging

logger = logging.getLogger(__name__)

class Cache:
    _instance = None
    _client: Optional[redis.Redis] = None
    _is_initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Cache, cls).__new__(cls)
        return cls._instance

    async def init(self):
        """Initialize the Redis client."""
        if not self._is_initialized:
            try:
                self._client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=20,
                )
                # Test the connection
                await self._client.ping()
                self._is_initialized = True
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Redis cache: {e}")
                self._is_initialized = False
                raise

    async def close(self):
        """Close the Redis connection."""
        if self._client:
            await self._client.close()
            self._is_initialized = False
            logger.info("Redis cache connection closed")

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        if not self._is_initialized or not self._client:
            return None
        
        try:
            value = await self._client.get(key)
            if value is not None:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
        except Exception as e:
            logger.error(f"Error getting key {key} from cache: {e}")
        return None

    async def set(
        self, 
        key: str, 
        value: Any, 
        expire: Optional[int] = None
    ) -> bool:
        """Set a value in the cache with optional expiration."""
        if not self._is_initialized or not self._client:
            return False
        
        try:
            if not isinstance(value, (str, int, float, bool, type(None))):
                value = json.dumps(value)
            
            expire = expire or settings.REDIS_CACHE_TTL
            return await self._client.set(
                key, 
                value, 
                ex=expire
            )
        except Exception as e:
            logger.error(f"Error setting key {key} in cache: {e}")
            return False

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys from the cache."""
        if not self._is_initialized or not self._client or not keys:
            return 0
        
        try:
            return await self._client.delete(*keys)
        except Exception as e:
            logger.error(f"Error deleting keys {keys} from cache: {e}")
            return 0

    async def clear_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern."""
        if not self._is_initialized or not self._client:
            return 0
        
        try:
            keys = await self._client.keys(pattern)
            if keys:
                return await self._client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Error clearing cache with pattern {pattern}: {e}")
            return 0

    async def get_or_set(
        self, 
        key: str, 
        default_value: Any, 
        expire: Optional[int] = None
    ) -> Any:
        """Get a value from the cache or set it if it doesn't exist."""
        value = await self.get(key)
        if value is None:
            await self.set(key, default_value, expire)
            return default_value
        return value

# Global cache instance
cache = Cache()
