import { EdgeCache, CacheStrategy } from './edgeCache';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Response
const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  clone: () => createMockResponse(data, status),
  headers: new Headers({
    'content-type': 'application/json',
    'cache-control': 'max-age=3600',
  }),
});

describe('EdgeCache', () => {
  let edgeCache: EdgeCache;

  beforeEach(() => {
    edgeCache = new EdgeCache();
    jest.clearAllMocks();
    
    // Clear any existing cache
    edgeCache['cache'].clear();
  });

  describe('Cache Operations', () => {
    it('should cache and retrieve data', async () => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };

      await edgeCache.set(key, data);
      const retrieved = await edgeCache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
      const result = await edgeCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL expiration', async () => {
      const key = 'ttl-test';
      const data = { test: true };
      const ttl = 100; // 100ms

      await edgeCache.set(key, data, ttl);
      
      // Should be available immediately
      expect(await edgeCache.get(key)).toEqual(data);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(await edgeCache.get(key)).toBeNull();
    });

    it('should delete cached items', async () => {
      const key = 'delete-test';
      const data = { test: true };

      await edgeCache.set(key, data);
      expect(await edgeCache.get(key)).toEqual(data);

      await edgeCache.delete(key);
      expect(await edgeCache.get(key)).toBeNull();
    });

    it('should clear all cached items', async () => {
      await edgeCache.set('key1', { data: 1 });
      await edgeCache.set('key2', { data: 2 });

      expect(await edgeCache.get('key1')).toBeTruthy();
      expect(await edgeCache.get('key2')).toBeTruthy();

      await edgeCache.clear();

      expect(await edgeCache.get('key1')).toBeNull();
      expect(await edgeCache.get('key2')).toBeNull();
    });
  });

  describe('Cache Strategies', () => {
    const url = 'https://api.example.com/data';
    const mockData = { id: 1, name: 'Test Data' };

    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse(mockData) as any);
    });

    it('should implement cache-first strategy', async () => {
      const key = 'cache-first-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.CACHE_FIRST,
        key,
      });

      expect(result).toEqual({ cached: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fallback to network in cache-first when cache miss', async () => {
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.CACHE_FIRST,
        key: 'cache-miss',
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
    });

    it('should implement network-first strategy', async () => {
      const key = 'network-first-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
    });

    it('should fallback to cache in network-first when network fails', async () => {
      const key = 'network-fail-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      // Mock network failure
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key,
      });

      expect(result).toEqual({ cached: true });
    });

    it('should implement stale-while-revalidate strategy', async () => {
      const key = 'swr-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
        key,
      });

      // Should return cached data immediately
      expect(result).toEqual({ cached: true });
      
      // Network request should still be made in background
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
      
      // Wait for background update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Cache should be updated with fresh data
      const updatedResult = await edgeCache.get(key);
      expect(updatedResult).toEqual(mockData);
    });

    it('should implement cache-only strategy', async () => {
      const key = 'cache-only-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.CACHE_ONLY,
        key,
      });

      expect(result).toEqual({ cached: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for cache-only with cache miss', async () => {
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.CACHE_ONLY,
        key: 'cache-miss',
      });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should implement network-only strategy', async () => {
      const key = 'network-only-test';
      
      // Pre-populate cache
      await edgeCache.set(key, { cached: true });
      
      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_ONLY,
        key,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
      
      // Cache should not be used
      const cachedResult = await edgeCache.get(key);
      expect(cachedResult).toEqual({ cached: true }); // Original cache unchanged
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      const key = 'stats-test';
      const data = { test: true };

      // Initial stats
      const initialStats = await edgeCache.getStats();
      expect(initialStats.hits).toBe(0);
      expect(initialStats.misses).toBe(0);

      // Cache miss
      await edgeCache.get(key);
      let stats = await edgeCache.getStats();
      expect(stats.misses).toBe(1);

      // Cache set and hit
      await edgeCache.set(key, data);
      await edgeCache.get(key);
      stats = await edgeCache.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should calculate hit ratio correctly', async () => {
      const key = 'ratio-test';
      const data = { test: true };

      // 1 miss, 0 hits
      await edgeCache.get(key);
      let stats = await edgeCache.getStats();
      expect(stats.hitRatio).toBe(0);

      // 1 miss, 1 hit
      await edgeCache.set(key, data);
      await edgeCache.get(key);
      stats = await edgeCache.getStats();
      expect(stats.hitRatio).toBe(0.5);

      // 1 miss, 2 hits
      await edgeCache.get(key);
      stats = await edgeCache.getStats();
      expect(stats.hitRatio).toBeCloseTo(0.67, 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      const url = 'https://api.example.com/invalid';
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('Invalid JSON'),
        clone: () => ({ json: () => Promise.reject(new Error('Invalid JSON')) }),
        headers: new Headers(),
      } as any);

      const result = await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key: 'invalid-json',
      });

      expect(result).toBeNull();
    });

    it('should handle network errors in network-first strategy', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await edgeCache.fetch('https://api.example.com/error', {
        strategy: CacheStrategy.NETWORK_FIRST,
        key: 'network-error',
      });

      expect(result).toBeNull();
    });

    it('should handle cache errors gracefully', async () => {
      // Mock cache error by making get throw
      const originalGet = edgeCache.get;
      edgeCache.get = jest.fn().mockRejectedValue(new Error('Cache error'));

      const result = await edgeCache.fetch('https://api.example.com/data', {
        strategy: CacheStrategy.CACHE_FIRST,
        key: 'cache-error',
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalled();

      // Restore original method
      edgeCache.get = originalGet;
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL in fetch options', async () => {
      const url = 'https://api.example.com/data';
      const key = 'ttl-fetch-test';
      const ttl = 100; // 100ms

      await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key,
        ttl,
      });

      // Should be cached
      expect(await edgeCache.get(key)).toEqual(mockData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(await edgeCache.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const url = 'https://api.example.com/data';
      const key = 'default-ttl-test';

      await edgeCache.fetch(url, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key,
      });

      // Should be cached with default TTL
      expect(await edgeCache.get(key)).toEqual(mockData);
    });
  });
});