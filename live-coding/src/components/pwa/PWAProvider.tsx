'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ServiceWorkerManager, CacheStatus } from '../../lib/services/serviceWorkerManager';

interface PWAContextType {
  isOnline: boolean;
  isOffline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  cacheStatus: CacheStatus | null;
  installApp: () => Promise<void>;
  cacheContent: (contentType: string, contentId: string) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStatus: () => Promise<void>;
  syncProgress: (courseId: string, progress: number) => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [serviceWorkerManager] = useState(() => new ServiceWorkerManager());
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);

  useEffect(() => {
    // Initialize service worker
    const initializeServiceWorker = async () => {
      try {
        await serviceWorkerManager.register('/sw.js');
        console.log('Service worker registered successfully');
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    };

    initializeServiceWorker();

    // Set initial online status
    setIsOnline(serviceWorkerManager.isOnline());

    // Set initial installable status
    setIsInstallable(serviceWorkerManager.canInstall());

    // Check if app is already installed (running in standalone mode)
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is now online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is now offline');
    };

    serviceWorkerManager.onOnline(handleOnline);
    serviceWorkerManager.onOffline(handleOffline);

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      console.log('App has been installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [serviceWorkerManager]);

  const installApp = async (): Promise<void> => {
    try {
      const outcome = await serviceWorkerManager.showInstallPrompt();
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else if (outcome === 'dismissed') {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Failed to show install prompt:', error);
    }
  };

  const cacheContent = async (contentType: string, contentId: string): Promise<void> => {
    try {
      await serviceWorkerManager.cacheContent(contentType, contentId);
      console.log(`Cached ${contentType} ${contentId}`);
      // Refresh cache status
      await getCacheStatus();
    } catch (error) {
      console.error('Failed to cache content:', error);
    }
  };

  const clearCache = async (): Promise<void> => {
    try {
      await serviceWorkerManager.clearCache();
      console.log('Cache cleared');
      setCacheStatus({ size: 0, items: 0 });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getCacheStatus = async (): Promise<void> => {
    try {
      const status = await serviceWorkerManager.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to get cache status:', error);
    }
  };

  const syncProgress = async (courseId: string, progress: number): Promise<void> => {
    try {
      await serviceWorkerManager.queueBackgroundSync('progress-sync', {
        courseId,
        progress,
        timestamp: new Date(),
      });
      console.log(`Queued progress sync for course ${courseId}`);
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  };

  const value: PWAContextType = {
    isOnline,
    isOffline: !isOnline,
    isInstallable,
    isInstalled,
    cacheStatus,
    installApp,
    cacheContent,
    clearCache,
    getCacheStatus,
    syncProgress,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};