import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EdgeCacheProvider, useEdgeCache } from './EdgeCacheProvider';
import { CacheStrategy } from '../../lib/services/edgeCache';

// Mock EdgeCache
jest.mock('../../lib/services/edgeCache');

// Test component to access edge cache context
const TestComponent: React.FC = () => {
  const {
    cache,
    isLoading,
    error,
    stats,
    fetchWithCache,
    preloadContent,
    clearCache,
    invalidatePattern,
  } = useEdgeCache();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="hit-ratio">{stats?.hitRatio || 0}</div>
      <button
        onClick={() => fetchWithCache('/api/test', { strategy: CacheStrategy.CACHE_FIRST, key: 'test' })}
        data-testid="fetch-button"
      >
        Fetch
      </button>
      <button
        onClick={() => preloadContent([{ url: '/api/preload', key: 'preload' }])}
        data-testid="preload-button"
      >
        Preload
      </button>
      <button onClick={() => clearCache()} data-testid="clear-button">
        Clear
      </button>
      <button
        onClick={() => invalidatePattern('test-*')}
        data-testid="invalidate-button"
      >
        Invalidate
      </button>
    </div>
  );
};

describe('EdgeCacheProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize edge cache provider with default values', () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('hit-ratio')).toHaveTextContent('0');
    });

    it('should provide cache instance to children', () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      // Should render without errors
      expect(screen.getByTestId('fetch-button')).toBeInTheDocument();
      expect(screen.getByTestId('preload-button')).toBeInTheDocument();
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });
  });

  describe('Cache Operations', () => {
    it('should handle fetch with cache', async () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const fetchButton = screen.getByTestId('fetch-button');
      fireEvent.click(fetchButton);

      // Should show loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      });
    });

    it('should handle preload content', async () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const preloadButton = screen.getByTestId('preload-button');
      fireEvent.click(preloadButton);

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      });
    });

    it('should handle cache clearing', async () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const clearButton = screen.getByTestId('clear-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        // Should complete without errors
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('should handle pattern invalidation', async () => {
      render(
        <EdgeCacheProvider>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const invalidateButton = screen.getByTestId('invalidate-button');
      fireEvent.click(invalidateButton);

      await waitFor(() => {
        // Should complete without errors
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockCache = {
        fetch: jest.fn().mockRejectedValue(new Error('Fetch failed')),
        getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0, hitRatio: 0 }),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const fetchButton = screen.getByTestId('fetch-button');
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Fetch failed');
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      });
    });

    it('should handle preload errors gracefully', async () => {
      const mockCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0, hitRatio: 0 }),
        preload: jest.fn().mockRejectedValue(new Error('Preload failed')),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const preloadButton = screen.getByTestId('preload-button');
      fireEvent.click(preloadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Preload failed');
      });
    });

    it('should throw error when useEdgeCache is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useEdgeCache must be used within an EdgeCacheProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Statistics Updates', () => {
    it('should update cache statistics periodically', async () => {
      const mockStats = { hits: 10, misses: 5, hitRatio: 0.67, size: 3, memoryUsage: 1024 };
      const mockCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockResolvedValue(mockStats),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any} statsUpdateInterval={100}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hit-ratio')).toHaveTextContent('0.67');
      }, { timeout: 200 });
    });

    it('should handle stats update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockRejectedValue(new Error('Stats failed')),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any} statsUpdateInterval={100}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update cache stats:', expect.any(Error));
      }, { timeout: 200 });

      consoleSpy.mockRestore();
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom cache instance', () => {
      const customCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0, hitRatio: 0 }),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={customCache as any}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      expect(screen.getByTestId('fetch-button')).toBeInTheDocument();
    });

    it('should accept custom stats update interval', async () => {
      const mockCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockResolvedValue({ hits: 1, misses: 0, hitRatio: 1 }),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any} statsUpdateInterval={50}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      // Should update stats more frequently
      await waitFor(() => {
        expect(mockCache.getStats).toHaveBeenCalled();
      }, { timeout: 100 });
    });

    it('should disable stats updates when interval is 0', () => {
      const mockCache = {
        fetch: jest.fn(),
        getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0, hitRatio: 0 }),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any} statsUpdateInterval={0}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      // Stats should not be called automatically
      expect(mockCache.getStats).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup intervals on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = render(
        <EdgeCacheProvider statsUpdateInterval={100}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Integration with PWA', () => {
    it('should work with offline state', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const mockCache = {
        fetch: jest.fn().mockResolvedValue({ data: 'cached' }),
        getStats: jest.fn().mockResolvedValue({ hits: 1, misses: 0, hitRatio: 1 }),
        preload: jest.fn(),
        clear: jest.fn(),
        invalidatePattern: jest.fn(),
      };

      render(
        <EdgeCacheProvider cache={mockCache as any}>
          <TestComponent />
        </EdgeCacheProvider>
      );

      const fetchButton = screen.getByTestId('fetch-button');
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(mockCache.fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            strategy: CacheStrategy.CACHE_FIRST,
            key: 'test',
          })
        );
      });
    });
  });
});