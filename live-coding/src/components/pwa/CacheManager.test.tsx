import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CacheManager } from './CacheManager';
import { usePWA } from './PWAProvider';

// Mock PWA context
jest.mock('./PWAProvider');
const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>;

describe('CacheManager', () => {
  const mockCacheContent = jest.fn();
  const mockClearCache = jest.fn();
  const mockGetCacheStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheContent.mockClear();
    mockClearCache.mockClear();
    mockGetCacheStatus.mockClear();
  });

  describe('Cache Status Display', () => {
    it('should display cache status when available', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5, lastUpdated: new Date('2023-01-01') },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });

      render(<CacheManager />);

      expect(screen.getByText('Cache Status')).toBeInTheDocument();
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
      expect(screen.getByText('5 items')).toBeInTheDocument();
    });

    it('should display no cache message when cache is empty', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 0, items: 0 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });

      render(<CacheManager />);

      expect(screen.getByText('No cached content')).toBeInTheDocument();
    });

    it('should display loading state when cache status is null', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });

      render(<CacheManager />);

      expect(screen.getByText('Loading cache status...')).toBeInTheDocument();
    });
  });

  describe('Cache Actions', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });
    });

    it('should refresh cache status when refresh button is clicked', async () => {
      mockGetCacheStatus.mockResolvedValue();

      render(<CacheManager />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockGetCacheStatus).toHaveBeenCalled();
      });
    });

    it('should clear cache when clear button is clicked', async () => {
      mockClearCache.mockResolvedValue();

      render(<CacheManager />);

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
      });
    });

    it('should show loading state during cache operations', async () => {
      mockClearCache.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CacheManager />);

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      expect(clearButton).toBeDisabled();
      expect(screen.getByText('Clearing...')).toBeInTheDocument();

      await waitFor(() => {
        expect(clearButton).not.toBeDisabled();
      });
    });

    it('should handle cache operation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockClearCache.mockRejectedValue(new Error('Clear failed'));

      render(<CacheManager />);

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to clear cache:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Content Caching', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });
    });

    it('should cache course content when cache course button is clicked', async () => {
      mockCacheContent.mockResolvedValue();

      render(<CacheManager courseId="123" />);

      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      await waitFor(() => {
        expect(mockCacheContent).toHaveBeenCalledWith('course', '123');
      });
    });

    it('should not show cache course button when no courseId provided', () => {
      render(<CacheManager />);

      expect(screen.queryByRole('button', { name: /cache course/i })).not.toBeInTheDocument();
    });

    it('should show loading state during content caching', async () => {
      mockCacheContent.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CacheManager courseId="123" />);

      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      expect(cacheButton).toBeDisabled();
      expect(screen.getByText('Caching...')).toBeInTheDocument();

      await waitFor(() => {
        expect(cacheButton).not.toBeDisabled();
      });
    });
  });

  describe('Offline State', () => {
    it('should show offline message when offline', () => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });

      render(<CacheManager />);

      expect(screen.getByText(/You are currently offline/)).toBeInTheDocument();
      expect(screen.getByText(/Cached content is available/)).toBeInTheDocument();
    });

    it('should disable cache operations when offline', () => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });

      render(<CacheManager courseId="123" />);

      expect(screen.getByRole('button', { name: /cache course/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /clear cache/i })).toBeDisabled();
    });
  });

  describe('Custom Props', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });
    });

    it('should accept custom className', () => {
      render(<CacheManager className="custom-class" />);

      const manager = screen.getByText('Cache Status').closest('div');
      expect(manager).toHaveClass('custom-class');
    });

    it('should accept custom title', () => {
      const customTitle = 'Custom Cache Title';
      render(<CacheManager title={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.queryByText('Cache Status')).not.toBeInTheDocument();
    });

    it('should hide actions when showActions is false', () => {
      render(<CacheManager showActions={false} />);

      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /clear cache/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: mockClearCache,
        getCacheStatus: mockGetCacheStatus,
        syncProgress: jest.fn(),
      });
    });

    it('should have proper heading structure', () => {
      render(<CacheManager />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Cache Status');
    });

    it('should have proper button labels', () => {
      render(<CacheManager courseId="123" />);

      expect(screen.getByRole('button', { name: /refresh cache status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all cached content/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cache course for offline access/i })).toBeInTheDocument();
    });
  });
});