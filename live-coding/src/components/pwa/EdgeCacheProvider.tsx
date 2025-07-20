'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { EdgeCache, CacheOptions, CacheStats } from '../../lib/services/edgeCache';

interface EdgeCacheContextType {
  cache: EdgeCache;
  isLoading: boolean;
  error: string | null;
  stats: CacheStats | null;
  fetchWithCache: <T = any>(url: string, options: CacheOptions) => Promise<T | null>;
  preloadContent: (urls: Array<{ url: string; key: string; ttl?: number }>) => Promise<void>;
  clearCache: () => Promise<void>;
  invalidatePattern: (pattern: string | RegExp) => Promise<number>;
}

const EdgeCacheContext = createContext<EdgeCacheContextType | undefined>(undefined);

interface EdgeCacheProviderProps {
  children: ReactNode;
  cache?: EdgeCache;
  statsUpdateInterval?: number;
}

export const EdgeCacheProvider: React.FC<EdgeCacheProviderProps> = ({
  children,
  cache: customCache,
  statsUpdateInterval = 5000, // 5 seconds
}) => {
  const [cache] = useState(() => customCache || new EdgeCache());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);

  useEffect(() => {
    // Update cache statistics periodically
    if (statsUpdateInterval > 0) {
      const updateStats = async () => {
        try {
          const newStats = await cache.getStats();
          setStats(newStats);
        } catch (error) {
          console.warn('Failed to update cache stats:', error);
        }
      };

      // Initial stats update
      updateStats();

      // Periodic updates
      const interval = setInterval(updateStats, statsUpdateInterval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [cache, statsUpdateInterval]);

  const fetchWithCache = async <T = any>(
    url: string,
    options: CacheOptions
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cache.fetch<T>(url, options);
      
      // Update stats after fetch
      const newStats = await cache.getStats();
      setStats(newStats);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Cache fetch failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const preloadContent = async (
    urls: Array<{ url: string; key: string; ttl?: number }>
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cache.preload(urls);
      
      // Update stats after preload
      const newStats = await cache.getStats();
      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Cache preload failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cache.clear();
      
      // Update stats after clear
      const newStats = await cache.getStats();
      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Cache clear failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const invalidatePattern = async (pattern: string | RegExp): Promise<number> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const invalidated = await cache.invalidatePattern(pattern);
      
      // Update stats after invalidation
      const newStats = await cache.getStats();
      setStats(newStats);
      
      return invalidated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Cache invalidation failed:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  const value: EdgeCacheContextType = {
    cache,
    isLoading,
    error,
    stats,
    fetchWithCache,
    preloadContent,
    clearCache,
    invalidatePattern,
  };

  return (
    <EdgeCacheContext.Provider value={value}>
      {children}
    </EdgeCacheContext.Provider>
  );
};

export const useEdgeCache = (): EdgeCacheContextType => {
  const context = useContext(EdgeCacheContext);
  if (context === undefined) {
    throw new Error('useEdgeCache must be used within an EdgeCacheProvider');
  }
  return context;
};