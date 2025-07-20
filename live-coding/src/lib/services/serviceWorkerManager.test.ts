import { ServiceWorkerManager } from './serviceWorkerManager';

// Mock service worker registration
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

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getRegistration: jest.fn(),
    getRegistrations: jest.fn(),
  },
  writable: true,
});

describe('ServiceWorkerManager', () => {
  let serviceWorkerManager: ServiceWorkerManager;

  beforeEach(() => {
    serviceWorkerManager = new ServiceWorkerManager();
    jest.clearAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const mockRegister = navigator.serviceWorker.register as jest.Mock;
      mockRegister.mockResolvedValue(mockServiceWorkerRegistration);

      const result = await serviceWorkerManager.register('/sw.js');

      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
      expect(result).toBe(mockServiceWorkerRegistration);
    });

    it('should handle service worker registration failure', async () => {
      const mockRegister = navigator.serviceWorker.register as jest.Mock;
      const error = new Error('Registration failed');
      mockRegister.mockRejectedValue(error);

      await expect(serviceWorkerManager.register('/sw.js')).rejects.toThrow('Registration failed');
    });

    it('should not register if service worker is not supported', async () => {
      // Temporarily remove service worker support
      const originalServiceWorker = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      const result = await serviceWorkerManager.register('/sw.js');

      expect(result).toBeNull();

      // Restore service worker
      (navigator as any).serviceWorker = originalServiceWorker;
    });
  });

  describe('Service Worker Updates', () => {
    it('should check for updates', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      serviceWorkerManager['registration'] = {
        ...mockServiceWorkerRegistration,
        update: mockUpdate,
      };

      await serviceWorkerManager.checkForUpdates();

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle update check failure', async () => {
      const mockUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      serviceWorkerManager['registration'] = {
        ...mockServiceWorkerRegistration,
        update: mockUpdate,
      };

      await expect(serviceWorkerManager.checkForUpdates()).rejects.toThrow('Update failed');
    });

    it('should not check for updates if no registration', async () => {
      serviceWorkerManager['registration'] = null;

      await serviceWorkerManager.checkForUpdates();

      // Should not throw error
    });
  });

  describe('Service Worker Messaging', () => {
    it('should send message to service worker', async () => {
      const mockPostMessage = jest.fn();
      serviceWorkerManager['registration'] = {
        ...mockServiceWorkerRegistration,
        active: {
          postMessage: mockPostMessage,
        },
      };

      const message = { type: 'CACHE_COURSE', courseId: '123' };
      await serviceWorkerManager.sendMessage(message);

      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it('should handle messaging when no active service worker', async () => {
      serviceWorkerManager['registration'] = {
        ...mockServiceWorkerRegistration,
        active: null,
      };

      const message = { type: 'CACHE_COURSE', courseId: '123' };
      await expect(serviceWorkerManager.sendMessage(message)).rejects.toThrow(
        'No active service worker'
      );
    });
  });

  describe('Offline Detection', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      expect(serviceWorkerManager.isOnline()).toBe(true);
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      expect(serviceWorkerManager.isOffline()).toBe(true);
    });

    it('should add online/offline event listeners', () => {
      const mockAddEventListener = jest.spyOn(window, 'addEventListener');
      const onlineCallback = jest.fn();
      const offlineCallback = jest.fn();

      serviceWorkerManager.onOnline(onlineCallback);
      serviceWorkerManager.onOffline(offlineCallback);

      expect(mockAddEventListener).toHaveBeenCalledWith('online', onlineCallback);
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', offlineCallback);

      mockAddEventListener.mockRestore();
    });
  });

  describe('Cache Management', () => {
    it('should request course caching', async () => {
      const mockSendMessage = jest.spyOn(serviceWorkerManager, 'sendMessage');
      mockSendMessage.mockResolvedValue(undefined);

      await serviceWorkerManager.cacheContent('course', '123');

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'CACHE_CONTENT',
        contentType: 'course',
        contentId: '123',
      });

      mockSendMessage.mockRestore();
    });

    it('should request cache clearing', async () => {
      const mockSendMessage = jest.spyOn(serviceWorkerManager, 'sendMessage');
      mockSendMessage.mockResolvedValue(undefined);

      await serviceWorkerManager.clearCache();

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'CLEAR_CACHE',
      });

      mockSendMessage.mockRestore();
    });

    it('should get cache status', async () => {
      const mockSendMessage = jest.spyOn(serviceWorkerManager, 'sendMessage');
      const mockStatus = { size: 1024, items: 5 };
      mockSendMessage.mockResolvedValue(mockStatus);

      const status = await serviceWorkerManager.getCacheStatus();

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'GET_CACHE_STATUS',
      });
      expect(status).toEqual(mockStatus);

      mockSendMessage.mockRestore();
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      const mockSendMessage = jest.spyOn(serviceWorkerManager, 'sendMessage');
      mockSendMessage.mockResolvedValue(undefined);

      await serviceWorkerManager.registerBackgroundSync('progress-sync');

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'REGISTER_BACKGROUND_SYNC',
        tag: 'progress-sync',
      });

      mockSendMessage.mockRestore();
    });

    it('should queue data for background sync', async () => {
      const mockSendMessage = jest.spyOn(serviceWorkerManager, 'sendMessage');
      mockSendMessage.mockResolvedValue(undefined);

      const data = { courseId: '123', progress: 75 };
      await serviceWorkerManager.queueBackgroundSync('progress-sync', data);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'QUEUE_BACKGROUND_SYNC',
        tag: 'progress-sync',
        data,
      });

      mockSendMessage.mockRestore();
    });
  });

  describe('Installation Prompt', () => {
    it('should handle install prompt', () => {
      const mockPrompt = jest.fn();
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      serviceWorkerManager.handleInstallPrompt(mockEvent as any);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(serviceWorkerManager['deferredPrompt']).toBe(mockEvent);
    });

    it('should show install prompt', async () => {
      const mockPrompt = jest.fn();
      const mockEvent = {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      serviceWorkerManager['deferredPrompt'] = mockEvent as any;

      const result = await serviceWorkerManager.showInstallPrompt();

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe('accepted');
      expect(serviceWorkerManager['deferredPrompt']).toBeNull();
    });

    it('should return null if no deferred prompt', async () => {
      serviceWorkerManager['deferredPrompt'] = null;

      const result = await serviceWorkerManager.showInstallPrompt();

      expect(result).toBeNull();
    });
  });
});