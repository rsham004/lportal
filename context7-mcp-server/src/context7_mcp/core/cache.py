"""Caching implementation for Context7 MCP Server."""

import asyncio
import json
import logging
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from .config import get_settings


class CacheManager:
    """Manages caching for documentation and library data."""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        self._redis: Optional[redis.Redis] = None
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_enabled = self.settings.REDIS_ENABLED and REDIS_AVAILABLE
        
        if self.settings.REDIS_ENABLED and not REDIS_AVAILABLE:
            self.logger.warning("Redis caching requested but redis package not available")
    
    async def initialize(self) -> None:
        """Initialize the cache manager."""
        if self._cache_enabled:
            try:
                self._redis = redis.from_url(
                    self.settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                
                # Test connection
                await self._redis.ping()
                self.logger.info("Redis cache initialized successfully")
                
            except Exception as e:
                self.logger.warning(f"Failed to initialize Redis cache: {e}")
                self._cache_enabled = False
                self._redis = None
        
        if not self._cache_enabled:
            self.logger.info("Using in-memory cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            if self._cache_enabled and self._redis:
                value = await self._redis.get(key)
                if value:
                    data = json.loads(value)
                    # Check expiration
                    if self._is_expired(data):
                        await self._redis.delete(key)
                        return None
                    return data.get("value")
            else:
                # Memory cache
                if key in self._memory_cache:
                    data = self._memory_cache[key]
                    if self._is_expired(data):
                        del self._memory_cache[key]
                        return None
                    return data.get("value")
                    
        except Exception as e:
            self.logger.error(f"Cache get error for key {key}: {e}")
        
        return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> None:
        """Set value in cache."""
        if ttl is None:
            ttl = self.settings.CACHE_TTL_SECONDS
        
        expiry = datetime.utcnow() + timedelta(seconds=ttl)
        cache_data = {
            "value": value,
            "expires_at": expiry.isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            if self._cache_enabled and self._redis:
                await self._redis.setex(
                    key, 
                    ttl, 
                    json.dumps(cache_data, default=str)
                )
            else:
                # Memory cache with size limit
                if len(self._memory_cache) > 1000:  # Simple size limit
                    # Remove oldest entries
                    oldest_keys = sorted(
                        self._memory_cache.keys(),
                        key=lambda k: self._memory_cache[k].get("created_at", "")
                    )[:100]
                    for old_key in oldest_keys:
                        del self._memory_cache[old_key]
                
                self._memory_cache[key] = cache_data
                
        except Exception as e:
            self.logger.error(f"Cache set error for key {key}: {e}")
    
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        try:
            if self._cache_enabled and self._redis:
                await self._redis.delete(key)
            else:
                self._memory_cache.pop(key, None)
                
        except Exception as e:
            self.logger.error(f"Cache delete error for key {key}: {e}")
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        try:
            if self._cache_enabled and self._redis:
                await self._redis.flushdb()
            else:
                self._memory_cache.clear()
                
        except Exception as e:
            self.logger.error(f"Cache clear error: {e}")
    
    def _is_expired(self, cache_data: Dict[str, Any]) -> bool:
        """Check if cache entry is expired."""
        try:
            expires_at = datetime.fromisoformat(cache_data.get("expires_at", ""))
            return datetime.utcnow() > expires_at
        except (ValueError, TypeError):
            return True
    
    def get_cache_key(self, prefix: str, *args: str) -> str:
        """Generate cache key."""
        key_parts = [prefix] + list(args)
        return ":".join(key_parts)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        stats = {
            "enabled": self._cache_enabled,
            "type": "redis" if self._cache_enabled else "memory"
        }
        
        try:
            if self._cache_enabled and self._redis:
                info = await self._redis.info()
                stats.update({
                    "redis_version": info.get("redis_version"),
                    "used_memory": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients"),
                    "total_commands_processed": info.get("total_commands_processed")
                })
            else:
                stats.update({
                    "memory_entries": len(self._memory_cache),
                    "estimated_size_mb": len(str(self._memory_cache)) / (1024 * 1024)
                })
                
        except Exception as e:
            self.logger.error(f"Error getting cache stats: {e}")
            stats["error"] = str(e)
        
        return stats
    
    async def close(self) -> None:
        """Close cache connections."""
        if self._redis:
            await self._redis.close()


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


async def get_cache_manager() -> CacheManager:
    """Get or create cache manager instance."""
    global _cache_manager
    
    if _cache_manager is None:
        _cache_manager = CacheManager()
        await _cache_manager.initialize()
    
    return _cache_manager