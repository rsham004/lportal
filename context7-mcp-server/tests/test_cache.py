"""Tests for cache manager."""

import pytest
from unittest.mock import AsyncMock, patch

from context7_mcp.core.cache import CacheManager


@pytest.fixture
async def cache_manager():
    """Create a cache manager instance."""
    manager = CacheManager()
    await manager.initialize()
    yield manager
    await manager.close()


@pytest.mark.asyncio
async def test_memory_cache_set_get(cache_manager):
    """Test memory cache set and get operations."""
    key = "test:key"
    value = {"data": "test_value", "number": 42}
    
    await cache_manager.set(key, value, ttl=60)
    retrieved_value = await cache_manager.get(key)
    
    assert retrieved_value == value


@pytest.mark.asyncio
async def test_memory_cache_get_nonexistent(cache_manager):
    """Test getting non-existent key from memory cache."""
    value = await cache_manager.get("nonexistent:key")
    assert value is None


@pytest.mark.asyncio
async def test_memory_cache_delete(cache_manager):
    """Test deleting from memory cache."""
    key = "test:delete"
    value = "test_value"
    
    await cache_manager.set(key, value)
    await cache_manager.delete(key)
    
    retrieved_value = await cache_manager.get(key)
    assert retrieved_value is None


@pytest.mark.asyncio
async def test_memory_cache_clear(cache_manager):
    """Test clearing memory cache."""
    await cache_manager.set("key1", "value1")
    await cache_manager.set("key2", "value2")
    
    await cache_manager.clear()
    
    assert await cache_manager.get("key1") is None
    assert await cache_manager.get("key2") is None


@pytest.mark.asyncio
async def test_cache_key_generation(cache_manager):
    """Test cache key generation."""
    key = cache_manager.get_cache_key("prefix", "arg1", "arg2")
    assert key == "prefix:arg1:arg2"


@pytest.mark.asyncio
async def test_cache_stats(cache_manager):
    """Test cache statistics."""
    stats = await cache_manager.get_stats()
    
    assert "enabled" in stats
    assert "type" in stats
    assert stats["type"] in ["redis", "memory"]


@pytest.mark.asyncio
async def test_cache_expiration():
    """Test cache expiration."""
    manager = CacheManager()
    await manager.initialize()
    
    try:
        key = "test:expiry"
        value = "test_value"
        
        # Set with very short TTL
        await manager.set(key, value, ttl=1)
        
        # Should be available immediately
        retrieved = await manager.get(key)
        assert retrieved == value
        
        # Wait for expiration (in real test, you might mock datetime)
        import asyncio
        await asyncio.sleep(2)
        
        # Should be expired
        retrieved = await manager.get(key)
        assert retrieved is None
        
    finally:
        await manager.close()