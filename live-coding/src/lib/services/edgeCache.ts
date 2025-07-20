export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

export interface CacheOptions {
  strategy: CacheStrategy;
  key: string;
  ttl?: number;
  headers?: Record<string, string>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  size: number;
  memoryUsage: number;
}

export class EdgeCache {
  private cache = new Map<string, CacheItem>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get item from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Set item in cache
   */
  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, item);
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Fetch with caching strategy
   */
  async fetch<T = any>(url: string, options: CacheOptions): Promise<T | null> {
    const { strategy, key, ttl, headers } = options;

    switch (strategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst<T>(url, key, ttl, headers);
      
      case CacheStrategy.NETWORK_FIRST:
        return this.networkFirst<T>(url, key, ttl, headers);
      
      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate<T>(url, key, ttl, headers);
      
      case CacheStrategy.CACHE_ONLY:
        return this.cacheOnly<T>(key);
      
      case CacheStrategy.NETWORK_ONLY:
        return this.networkOnly<T>(url, headers);
      
      default:
        return this.networkFirst<T>(url, key, ttl, headers);
    }
  }

  /**
   * Cache-first strategy
   */
  private async cacheFirst<T>(
    url: string, 
    key: string, 
    ttl?: number, 
    headers?: Record<string, string>
  ): Promise<T | null> {
    try {
      // Try cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Fallback to network
      const data = await this.fetchFromNetwork<T>(url, headers);
      if (data !== null) {
        await this.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      console.error('Cache-first strategy failed:', error);
      return null;
    }
  }

  /**
   * Network-first strategy
   */
  private async networkFirst<T>(
    url: string, 
    key: string, 
    ttl?: number, 
    headers?: Record<string, string>
  ): Promise<T | null> {
    try {
      // Try network first
      const data = await this.fetchFromNetwork<T>(url, headers);
      if (data !== null) {
        await this.set(key, data, ttl);
        return data;
      }
    } catch (error) {
      console.warn('Network request failed, trying cache:', error);
    }

    // Fallback to cache
    return this.get<T>(key);
  }

  /**
   * Stale-while-revalidate strategy
   */
  private async staleWhileRevalidate<T>(
    url: string, 
    key: string, 
    ttl?: number, 
    headers?: Record<string, string>
  ): Promise<T | null> {
    try {
      // Get cached data immediately
      const cached = await this.get<T>(key);
      
      // Start background revalidation
      this.fetchFromNetwork<T>(url, headers)
        .then(data => {
          if (data !== null) {
            this.set(key, data, ttl);
          }
        })
        .catch(error => {
          console.warn('Background revalidation failed:', error);
        });

      // Return cached data if available, otherwise wait for network
      if (cached !== null) {
        return cached;
      }

      return this.fetchFromNetwork<T>(url, headers);
    } catch (error) {
      console.error('Stale-while-revalidate strategy failed:', error);
      return null;
    }
  }

  /**
   * Cache-only strategy
   */
  private async cacheOnly<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  /**
   * Network-only strategy
   */
  private async networkOnly<T>(
    url: string, 
    headers?: Record<string, string>
  ): Promise<T | null> {
    return this.fetchFromNetwork<T>(url, headers);
  }

  /**
   * Fetch data from network
   */
  private async fetchFromNetwork<T>(
    url: string, 
    headers?: Record<string, string>
  ): Promise<T | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Network fetch failed:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRatio = total > 0 ? this.stats.hits / total : 0;
    
    // Calculate memory usage (rough estimation)
    let memoryUsage = 0;
    for (const [key, item] of this.cache.entries()) {
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(item).length * 2;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio,
      size: this.cache.size,
      memoryUsage,
    };
  }

  /**
   * Cleanup expired items
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    urls: Array<{ url: string; key: string; ttl?: number }>,
    headers?: Record<string, string>
  ): Promise<void> {
    const promises = urls.map(async ({ url, key, ttl }) => {
      try {
        const data = await this.fetchFromNetwork<T>(url, headers);
        if (data !== null) {
          await this.set(key, data, ttl);
        }
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string | RegExp): Promise<number> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Set default TTL
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Get default TTL
   */
  getDefaultTTL(): number {
    return this.defaultTTL;
  }
}