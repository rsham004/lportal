import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAProvider } from './PWAProvider';
import { OfflineIndicator } from './OfflineIndicator';
import { InstallPrompt } from './InstallPrompt';
import { CacheManager } from './CacheManager';

// Mock service worker
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
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
    matches: false,
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

// Test component that uses all PWA features
const PWATestComponent: React.FC = () => {
  return (
    <PWAProvider>
      <div data-testid="pwa-app">
        <h1>PWA Test App</h1>
        <OfflineIndicator />
        <InstallPrompt />
        <CacheManager courseId="test-course-123" />
      </div>
    </PWAProvider>
  );
};

describe('PWA Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('Service Worker Integration', () => {
    it('should register service worker on app load', async () => {
      render(<PWATestComponent />);

      await waitFor(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      });
    });

    it('should handle service worker registration failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(
        new Error('Registration failed')
      );

      render(<PWATestComponent />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to register service worker:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Offline/Online State Management', () => {
    it('should show offline indicator when offline', async () => {
      // Start online
      render(<PWATestComponent />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      // Trigger offline event
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('You are currently offline')).toBeInTheDocument();
      });
    });

    it('should hide offline indicator when back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<PWATestComponent />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Go online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('App Installation', () => {
    it('should show install prompt when app is installable', async () => {
      // Mock installable state
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      render(<PWATestComponent />);

      // Trigger beforeinstallprompt event
      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        expect(screen.getByText('Install Learning Portal')).toBeInTheDocument();
      });
    });

    it('should handle app installation flow', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      render(<PWATestComponent />);

      // Trigger beforeinstallprompt event
      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        expect(screen.getByText('Install Learning Portal')).toBeInTheDocument();
      });

      // Click install button
      const installButton = screen.getByRole('button', { name: /install app/i });
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockEvent.prompt).toHaveBeenCalled();
      });
    });

    it('should hide install prompt after installation', async () => {
      render(<PWATestComponent />);

      // Trigger appinstalled event
      fireEvent(window, new Event('appinstalled'));

      // Install prompt should not be visible
      expect(screen.queryByText('Install Learning Portal')).not.toBeInTheDocument();
    });
  });

  describe('Cache Management Integration', () => {
    it('should display cache manager with course caching option', async () => {
      render(<PWATestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Cache Status')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cache course/i })).toBeInTheDocument();
      });
    });

    it('should disable cache operations when offline', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<PWATestComponent />);

      await waitFor(() => {
        const cacheButton = screen.getByRole('button', { name: /cache course/i });
        const clearButton = screen.getByRole('button', { name: /clear cache/i });
        
        expect(cacheButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
      });
    });

    it('should show offline message in cache manager when offline', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<PWATestComponent />);

      await waitFor(() => {
        expect(screen.getByText(/You are currently offline/)).toBeInTheDocument();
        expect(screen.getByText(/Cached content is available/)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('should share PWA state across all components', async () => {
      render(<PWATestComponent />);

      // All components should have access to PWA context
      expect(screen.getByTestId('pwa-app')).toBeInTheDocument();
      
      // Cache manager should be present
      expect(screen.getByText('Cache Status')).toBeInTheDocument();
      
      // Offline indicator should not be present when online
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should update all components when network state changes', async () => {
      render(<PWATestComponent />);

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
        
        // Cache manager should show offline state
        expect(screen.getByText(/You are currently offline/)).toBeInTheDocument();
        
        // Cache buttons should be disabled
        expect(screen.getByRole('button', { name: /cache course/i })).toBeDisabled();
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle PWA context errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to use PWA components without provider
      expect(() => {
        render(
          <div>
            <OfflineIndicator />
            <InstallPrompt />
            <CacheManager />
          </div>
        );
      }).toThrow('usePWA must be used within a PWAProvider');

      consoleSpy.mockRestore();
    });

    it('should continue working when service worker fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(
        new Error('Service worker failed')
      );

      render(<PWATestComponent />);

      // App should still render despite service worker failure
      expect(screen.getByTestId('pwa-app')).toBeInTheDocument();
      expect(screen.getByText('PWA Test App')).toBeInTheDocument();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with event listeners', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<PWATestComponent />);

      // Should add event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));

      // Unmount component
      unmount();

      // Should clean up event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle rapid online/offline state changes', async () => {
      render(<PWATestComponent />);

      // Rapidly toggle online/offline
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true,
        });
        fireEvent(window, new Event('offline'));

        Object.defineProperty(navigator, 'onLine', {
          value: true,
          writable: true,
        });
        fireEvent(window, new Event('online'));
      }

      // Should handle rapid changes without errors
      expect(screen.getByTestId('pwa-app')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA attributes for offline indicator', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<PWATestComponent />);

      await waitFor(() => {
        const offlineIndicator = screen.getByRole('alert');
        expect(offlineIndicator).toHaveAttribute('aria-live', 'polite');
        expect(offlineIndicator).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should have proper ARIA attributes for install prompt', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      render(<PWATestComponent />);

      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));

      await waitFor(() => {
        const installPrompt = screen.getByRole('dialog');
        expect(installPrompt).toHaveAttribute('aria-labelledby');
        expect(installPrompt).toHaveAttribute('aria-describedby');
      });
    });

    it('should provide clear feedback for user actions', async () => {
      render(<PWATestComponent />);

      // Cache status should be loading initially
      expect(screen.getByText('Loading cache status...')).toBeInTheDocument();

      // Should provide feedback for cache operations
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });
});