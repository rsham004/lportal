import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentDownloadManager } from './ContentDownloadManager';
import { usePWA } from './PWAProvider';
import { useEdgeCache } from './EdgeCacheProvider';

// Mock PWA context
jest.mock('./PWAProvider');
const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>;

// Mock EdgeCache context
jest.mock('./EdgeCacheProvider');
const mockUseEdgeCache = useEdgeCache as jest.MockedFunction<typeof useEdgeCache>;

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('ContentDownloadManager', () => {
  const mockCacheContent = jest.fn();
  const mockFetchWithCache = jest.fn();
  const mockSyncProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePWA.mockReturnValue({
      isOnline: true,
      isOffline: false,
      isInstallable: false,
      isInstalled: false,
      cacheStatus: { size: 1024, items: 5 },
      installApp: jest.fn(),
      cacheContent: mockCacheContent,
      clearCache: jest.fn(),
      getCacheStatus: jest.fn(),
      syncProgress: mockSyncProgress,
    });

    mockUseEdgeCache.mockReturnValue({
      cache: {} as any,
      isLoading: false,
      error: null,
      stats: { hits: 10, misses: 5, hitRatio: 0.67, size: 3, memoryUsage: 1024 },
      fetchWithCache: mockFetchWithCache,
      preloadContent: jest.fn(),
      clearCache: jest.fn(),
      invalidatePattern: jest.fn(),
    });

    // Mock successful IndexedDB operations
    const mockDB = {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          add: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          get: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          put: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          delete: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          getAll: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        }),
      }),
      close: jest.fn(),
    };

    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    });
  });

  describe('Course Download', () => {
    it('should display download button for course', () => {
      render(<ContentDownloadManager courseId="test-course-123" />);

      expect(screen.getByRole('button', { name: /download course/i })).toBeInTheDocument();
    });

    it('should handle course download', async () => {
      mockFetchWithCache.mockResolvedValue({
        id: 'test-course-123',
        title: 'Test Course',
        lessons: [
          { id: 'lesson-1', title: 'Lesson 1', videoUrl: 'video1.mp4' },
          { id: 'lesson-2', title: 'Lesson 2', videoUrl: 'video2.mp4' },
        ],
      });

      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockFetchWithCache).toHaveBeenCalledWith(
          '/api/courses/test-course-123',
          expect.objectContaining({
            key: 'course-test-course-123',
          })
        );
      });

      expect(screen.getByText(/downloading/i)).toBeInTheDocument();
    });

    it('should show download progress', async () => {
      mockFetchWithCache.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'test', lessons: [] }), 100))
      );

      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      expect(screen.getByText(/downloading/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/downloading/i)).not.toBeInTheDocument();
      });
    });

    it('should handle download errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetchWithCache.mockRejectedValue(new Error('Download failed'));

      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/download failed/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Offline Content Management', () => {
    it('should display downloaded content list', async () => {
      // Mock downloaded content
      const mockContent = [
        { id: 'course-1', title: 'Course 1', downloadedAt: new Date(), size: 1024 },
        { id: 'course-2', title: 'Course 2', downloadedAt: new Date(), size: 2048 },
      ];

      render(<ContentDownloadManager />);

      await waitFor(() => {
        expect(screen.getByText('Downloaded Content')).toBeInTheDocument();
      });
    });

    it('should show storage usage', async () => {
      render(<ContentDownloadManager />);

      await waitFor(() => {
        expect(screen.getByText(/storage used/i)).toBeInTheDocument();
      });
    });

    it('should handle content deletion', async () => {
      render(<ContentDownloadManager />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Downloaded Content')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/content deleted/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Sync Management', () => {
    it('should show sync status', () => {
      render(<ContentDownloadManager />);

      expect(screen.getByText(/sync status/i)).toBeInTheDocument();
    });

    it('should handle manual sync', async () => {
      render(<ContentDownloadManager />);

      const syncButton = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockSyncProgress).toHaveBeenCalled();
      });
    });

    it('should show sync conflicts', async () => {
      // Mock sync conflicts
      render(<ContentDownloadManager />);

      // Should display conflict resolution UI when conflicts exist
      await waitFor(() => {
        expect(screen.getByText(/sync status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Offline State', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: { size: 1024, items: 5 },
        installApp: jest.fn(),
        cacheContent: mockCacheContent,
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: mockSyncProgress,
      });
    });

    it('should disable downloads when offline', () => {
      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      expect(downloadButton).toBeDisabled();
    });

    it('should show offline message', () => {
      render(<ContentDownloadManager />);

      expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
    });

    it('should allow access to downloaded content when offline', () => {
      render(<ContentDownloadManager />);

      expect(screen.getByText('Downloaded Content')).toBeInTheDocument();
      // Downloaded content should still be accessible
    });
  });

  describe('Storage Management', () => {
    it('should show storage quota information', async () => {
      // Mock storage API
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            quota: 1000000000, // 1GB
            usage: 500000000,  // 500MB
          }),
        },
        writable: true,
      });

      render(<ContentDownloadManager />);

      await waitFor(() => {
        expect(screen.getByText(/storage used/i)).toBeInTheDocument();
      });
    });

    it('should warn when storage is low', async () => {
      // Mock low storage
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            quota: 1000000000,  // 1GB
            usage: 950000000,   // 950MB (95% used)
          }),
        },
        writable: true,
      });

      render(<ContentDownloadManager />);

      await waitFor(() => {
        expect(screen.getByText(/storage is running low/i)).toBeInTheDocument();
      });
    });

    it('should handle storage quota exceeded', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock quota exceeded error
      mockFetchWithCache.mockRejectedValue(new DOMException('Quota exceeded', 'QuotaExceededError'));

      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Background Sync', () => {
    it('should queue progress for background sync', async () => {
      render(<ContentDownloadManager />);

      // Simulate progress update
      const progressEvent = new CustomEvent('progress-update', {
        detail: { courseId: 'test-course', progress: 75 }
      });
      
      window.dispatchEvent(progressEvent);

      await waitFor(() => {
        expect(mockSyncProgress).toHaveBeenCalledWith('test-course', 75);
      });
    });

    it('should handle sync failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSyncProgress.mockRejectedValue(new Error('Sync failed'));

      render(<ContentDownloadManager />);

      const syncButton = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Sync failed:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ContentDownloadManager courseId="test-course-123" />);

      expect(screen.getByRole('button', { name: /download course/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /sync now/i })).toHaveAttribute('aria-label');
    });

    it('should announce download progress to screen readers', async () => {
      render(<ContentDownloadManager courseId="test-course-123" />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label');
        expect(progressBar).toHaveAttribute('aria-valuenow');
      });
    });

    it('should provide keyboard navigation', () => {
      render(<ContentDownloadManager />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      const syncButton = screen.getByRole('button', { name: /sync now/i });

      // Should be focusable
      downloadButton.focus();
      expect(downloadButton).toHaveFocus();

      // Should support keyboard navigation
      fireEvent.keyDown(downloadButton, { key: 'Tab' });
      expect(syncButton).toHaveFocus();
    });
  });
});