import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAProvider, usePWA } from './PWAProvider';
import { ServiceWorkerManager } from '../../lib/services/serviceWorkerManager';

// Mock ServiceWorkerManager
jest.mock('../../lib/services/serviceWorkerManager');

const MockedServiceWorkerManager = ServiceWorkerManager as jest.MockedClass<typeof ServiceWorkerManager>;

// Test component to access PWA context
const TestComponent: React.FC = () => {
  const {
    isOnline,
    isOffline,
    isInstallable,
    isInstalled,
    cacheStatus,
    installApp,
    cacheContent,
    clearCache,
    getCacheStatus,
    syncProgress,
  } = usePWA();

  return (
    <div>
      <div data-testid="online-status">{isOnline ? 'online' : 'offline'}</div>
      <div data-testid="installable">{isInstallable ? 'installable' : 'not-installable'}</div>
      <div data-testid="installed">{isInstalled ? 'installed' : 'not-installed'}</div>
      <div data-testid="cache-size">{cacheStatus?.size || 0}</div>
      <button onClick={() => installApp()} data-testid="install-button">
        Install
      </button>
      <button onClick={() => cacheContent('course', '123')} data-testid="cache-button">
        Cache Content
      </button>
      <button onClick={() => clearCache()} data-testid="clear-cache-button">
        Clear Cache
      </button>
      <button onClick={() => getCacheStatus()} data-testid="get-cache-button">
        Get Cache Status
      </button>
      <button onClick={() => syncProgress('123', 75)} data-testid="sync-button">
        Sync Progress
      </button>
    </div>
  );
};

describe('PWAProvider', () => {
  let mockServiceWorkerManager: jest.Mocked<ServiceWorkerManager>;

  beforeEach(() => {
    mockServiceWorkerManager = {
      register: jest.fn(),
      isOnline: jest.fn(),
      isOffline: jest.fn(),
      canInstall: jest.fn(),
      showInstallPrompt: jest.fn(),
      cacheContent: jest.fn(),
      clearCache: jest.fn(),
      getCacheStatus: jest.fn(),
      queueBackgroundSync: jest.fn(),
      onOnline: jest.fn(),
      onOffline: jest.fn(),
    } as any;

    MockedServiceWorkerManager.mockImplementation(() => mockServiceWorkerManager);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // Mock window.matchMedia for installed app detection
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize PWA provider with default values', () => {
      mockServiceWorkerManager.isOnline.mockReturnValue(true);
      mockServiceWorkerManager.canInstall.mockReturnValue(false);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
      expect(screen.getByTestId('installable')).toHaveTextContent('not-installable');
      expect(screen.getByTestId('cache-size')).toHaveTextContent('0');
    });

    it('should register service worker on mount', async () => {
      mockServiceWorkerManager.register.mockResolvedValue({} as ServiceWorkerRegistration);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      await waitFor(() => {
        expect(mockServiceWorkerManager.register).toHaveBeenCalledWith('/sw.js');
      });
    });

    it('should handle service worker registration failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockServiceWorkerManager.register.mockRejectedValue(new Error('Registration failed'));

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to register service worker:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Online/Offline Status', () => {
    it('should detect online status', () => {
      mockServiceWorkerManager.isOnline.mockReturnValue(true);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
    });

    it('should detect offline status', () => {
      mockServiceWorkerManager.isOnline.mockReturnValue(false);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
    });

    it('should update status when going offline', async () => {
      let offlineCallback: () => void = () => {};
      mockServiceWorkerManager.onOffline.mockImplementation((callback) => {
        offlineCallback = callback;
      });
      mockServiceWorkerManager.isOnline.mockReturnValue(true);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');

      // Simulate going offline
      mockServiceWorkerManager.isOnline.mockReturnValue(false);
      offlineCallback();

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
      });
    });
  });

  describe('App Installation', () => {
    it('should detect installable app', () => {
      mockServiceWorkerManager.canInstall.mockReturnValue(true);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('installable')).toHaveTextContent('installable');
    });

    it('should detect installed app', () => {
      // Mock standalone display mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
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

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      expect(screen.getByTestId('installed')).toHaveTextContent('installed');
    });

    it('should install app when button clicked', async () => {
      mockServiceWorkerManager.canInstall.mockReturnValue(true);
      mockServiceWorkerManager.showInstallPrompt.mockResolvedValue('accepted');

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('install-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.showInstallPrompt).toHaveBeenCalled();
      });
    });

    it('should handle install prompt dismissal', async () => {
      mockServiceWorkerManager.canInstall.mockReturnValue(true);
      mockServiceWorkerManager.showInstallPrompt.mockResolvedValue('dismissed');

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('install-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.showInstallPrompt).toHaveBeenCalled();
      });
    });
  });

  describe('Cache Management', () => {
    it('should cache content', async () => {
      mockServiceWorkerManager.cacheContent.mockResolvedValue();

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('cache-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.cacheContent).toHaveBeenCalledWith('course', '123');
      });
    });

    it('should clear cache', async () => {
      mockServiceWorkerManager.clearCache.mockResolvedValue();

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('clear-cache-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.clearCache).toHaveBeenCalled();
      });
    });

    it('should get cache status', async () => {
      const mockStatus = { size: 1024, items: 5 };
      mockServiceWorkerManager.getCacheStatus.mockResolvedValue(mockStatus);

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('get-cache-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.getCacheStatus).toHaveBeenCalled();
        expect(screen.getByTestId('cache-size')).toHaveTextContent('1024');
      });
    });

    it('should handle cache errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockServiceWorkerManager.cacheContent.mockRejectedValue(new Error('Cache failed'));

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('cache-button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to cache content:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Background Sync', () => {
    it('should sync progress data', async () => {
      mockServiceWorkerManager.queueBackgroundSync.mockResolvedValue();

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('sync-button'));

      await waitFor(() => {
        expect(mockServiceWorkerManager.queueBackgroundSync).toHaveBeenCalledWith(
          'progress-sync',
          { courseId: '123', progress: 75, timestamp: expect.any(Date) }
        );
      });
    });

    it('should handle sync errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockServiceWorkerManager.queueBackgroundSync.mockRejectedValue(new Error('Sync failed'));

      render(
        <PWAProvider>
          <TestComponent />
        </PWAProvider>
      );

      fireEvent.click(screen.getByTestId('sync-button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to sync progress:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when usePWA is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('usePWA must be used within a PWAProvider');

      consoleSpy.mockRestore();
    });
  });
});