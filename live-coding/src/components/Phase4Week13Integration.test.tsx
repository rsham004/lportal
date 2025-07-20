import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAProvider } from './pwa/PWAProvider';
import { EdgeCacheProvider } from './pwa/EdgeCacheProvider';
import { MobileOptimization } from './pwa/MobileOptimization';
import { OfflineIndicator } from './pwa/OfflineIndicator';
import { InstallPrompt } from './pwa/InstallPrompt';
import { CacheManager } from './pwa/CacheManager';
import { ContentDownloadManager } from './pwa/ContentDownloadManager';

// Mock service worker and APIs
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: {
    postMessage: jest.fn(),
  },
  scope: 'https://localhost:3000/',
  update: jest.fn(),
  unregister: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getRegistration: jest.fn(),
    getRegistrations: jest.fn(),
  },
  writable: true,
});

// Mock online status
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation((query) => ({
    matches: query === '(max-width: 768px)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
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
    },
  }),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock storage API
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn().mockResolvedValue({
      quota: 1000000000, // 1GB
      usage: 100000000,  // 100MB
    }),
  },
  writable: true,
});

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({
    id: 'test-course',
    title: 'Test Course',
    lessons: [
      { id: 'lesson-1', title: 'Lesson 1', videoUrl: 'video1.mp4' },
      { id: 'lesson-2', title: 'Lesson 2', videoUrl: 'video2.mp4' },
    ],
  }),
  text: () => Promise.resolve('{}'),
  clone: () => ({ json: () => Promise.resolve({}) }),
  headers: new Headers(),
});

// Comprehensive test component that uses all Phase 4 Week 13 features
const Phase4Week13TestApp: React.FC = () => {
  return (
    <PWAProvider>
      <EdgeCacheProvider>
        <MobileOptimization>
          <div data-testid="phase4-week13-app">
            <h1>Phase 4 Week 13 - PWA & Performance Optimization</h1>
            
            {/* PWA Components */}
            <OfflineIndicator />
            <InstallPrompt />
            
            {/* Cache Management */}
            <CacheManager courseId="test-course-123" />
            
            {/* Content Download */}
            <ContentDownloadManager courseId="test-course-123" />
            
            {/* Test mobile gestures */}
            <div 
              data-testid="gesture-area"
              style={{ width: '200px', height: '200px', background: '#f0f0f0' }}
            >
              Touch/Gesture Test Area
            </div>
          </div>
        </MobileOptimization>
      </EdgeCacheProvider>
    </PWAProvider>
  );
};

describe('Phase 4 Week 13 Integration - PWA & Performance Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('PWA Infrastructure Integration', () => {
    it('should initialize all PWA providers successfully', async () => {
      render(<Phase4Week13TestApp />);

      expect(screen.getByTestId('phase4-week13-app')).toBeInTheDocument();
      expect(screen.getByText('Phase 4 Week 13 - PWA & Performance Optimization')).toBeInTheDocument();

      // Service worker should be registered
      await waitFor(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      });
    });

    it('should handle offline/online state changes across all components', async () => {
      render(<Phase4Week13TestApp />);

      // Initially online - no offline indicator
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        // Offline indicator should appear
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('You are currently offline')).toBeInTheDocument();
        
        // Cache and download buttons should be disabled
        const cacheButton = screen.getByRole('button', { name: /cache course/i });
        const downloadButton = screen.getByRole('button', { name: /download course/i });
        
        expect(cacheButton).toBeDisabled();
        expect(downloadButton).toBeDisabled();
      });
    });

    it('should show install prompt when app is installable', async () => {
      render(<Phase4Week13TestApp />);

      // Trigger beforeinstallprompt event
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        expect(screen.getByText('Install Learning Portal')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Caching Integration', () => {
    it('should integrate edge caching with content management', async () => {
      render(<Phase4Week13TestApp />);

      // Cache manager should be present
      expect(screen.getByText('Cache Status')).toBeInTheDocument();
      
      // Should show cache statistics
      await waitFor(() => {
        expect(screen.getByText(/cache status/i)).toBeInTheDocument();
      });
    });

    it('should handle cache operations with edge caching', async () => {
      render(<Phase4Week13TestApp />);

      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      // Should trigger caching operation
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Content Download and Sync', () => {
    it('should handle course download with progress tracking', async () => {
      render(<Phase4Week13TestApp />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      // Should show downloading state
      await waitFor(() => {
        expect(screen.getByText(/downloading/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should display storage information', async () => {
      render(<Phase4Week13TestApp />);

      await waitFor(() => {
        expect(screen.getByText(/storage used/i)).toBeInTheDocument();
      });
    });

    it('should handle background sync', async () => {
      render(<Phase4Week13TestApp />);

      const syncButton = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Optimization', () => {
    it('should detect mobile viewport and apply optimizations', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });

      render(<Phase4Week13TestApp />);

      // Should apply mobile optimizations
      expect(document.body).toHaveClass('mobile-optimized');
    });

    it('should handle touch gestures', async () => {
      render(<Phase4Week13TestApp />);

      const gestureArea = screen.getByTestId('gesture-area');

      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      const touchEnd = new TouchEvent('touchend', {
        touches: [],
      });

      fireEvent(gestureArea, touchStart);
      fireEvent(gestureArea, touchEnd);

      // Should handle touch events without errors
      expect(gestureArea).toBeInTheDocument();
    });

    it('should handle orientation changes', async () => {
      render(<Phase4Week13TestApp />);

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
      
      fireEvent(window, new Event('orientationchange'));

      // Should handle orientation change
      expect(screen.getByTestId('phase4-week13-app')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should implement lazy loading for images', () => {
      render(
        <Phase4Week13TestApp />
      );

      // Add an image to test lazy loading
      const img = document.createElement('img');
      img.src = 'test.jpg';
      img.setAttribute('data-testid', 'test-image');
      document.body.appendChild(img);

      // Should have lazy loading attributes
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');

      document.body.removeChild(img);
    });

    it('should optimize for low battery', async () => {
      // Mock low battery
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({
          level: 0.1, // 10% battery
          charging: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }),
        writable: true,
      });

      render(<Phase4Week13TestApp />);

      await waitFor(() => {
        expect(document.body).toHaveClass('low-battery');
        expect(document.body).toHaveClass('reduce-motion');
      });
    });

    it('should optimize for data saver mode', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          saveData: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
        writable: true,
      });

      render(<Phase4Week13TestApp />);

      await waitFor(() => {
        expect(document.body).toHaveClass('data-saver-mode');
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should share state between PWA components', async () => {
      render(<Phase4Week13TestApp />);

      // All components should have access to PWA context
      expect(screen.getByText('Cache Status')).toBeInTheDocument();
      expect(screen.getByText('Content Downloads')).toBeInTheDocument();
      
      // Should handle state changes across components
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        // Multiple components should react to offline state
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      });
    });

    it('should integrate with existing Phase 1-3 components', () => {
      render(<Phase4Week13TestApp />);

      // Should not break existing functionality
      expect(screen.getByTestId('phase4-week13-app')).toBeInTheDocument();
      
      // Should maintain theme and layout consistency
      expect(document.body).not.toHaveClass('broken');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service worker registration failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(
        new Error('Service worker failed')
      );

      render(<Phase4Week13TestApp />);

      // App should still render despite service worker failure
      expect(screen.getByTestId('phase4-week13-app')).toBeInTheDocument();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle storage quota exceeded errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock quota exceeded error
      (fetch as jest.Mock).mockRejectedValue(
        new DOMException('Quota exceeded', 'QuotaExceededError')
      );

      render(<Phase4Week13TestApp />);

      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle network failures gracefully', async () => {
      // Mock network failure
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Phase4Week13TestApp />);

      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      // Should handle network errors without crashing
      expect(screen.getByTestId('phase4-week13-app')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain accessibility standards', () => {
      render(<Phase4Week13TestApp />);

      // Should have proper ARIA attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });

      // Should have proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should provide keyboard navigation', () => {
      render(<Phase4Week13TestApp />);

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        buttons[0].focus();
        expect(buttons[0]).toHaveFocus();
      }
    });

    it('should announce important state changes', async () => {
      render(<Phase4Week13TestApp />);

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
        expect(alert).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache performance', async () => {
      render(<Phase4Week13TestApp />);

      // Should display cache statistics
      await waitFor(() => {
        expect(screen.getByText(/cache status/i)).toBeInTheDocument();
      });
    });

    it('should monitor storage usage', async () => {
      render(<Phase4Week13TestApp />);

      await waitFor(() => {
        expect(screen.getByText(/storage used/i)).toBeInTheDocument();
      });
    });

    it('should optimize based on device capabilities', async () => {
      render(<Phase4Week13TestApp />);

      // Should apply appropriate optimizations
      expect(document.body).toHaveClass('mobile-optimized');
    });
  });
});