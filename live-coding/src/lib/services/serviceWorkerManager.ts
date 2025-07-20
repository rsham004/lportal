export interface ServiceWorkerMessage {
  type: string;
  [key: string]: any;
}

export interface CacheStatus {
  size: number;
  items: number;
  lastUpdated?: Date;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    this.setupInstallPromptListener();
  }

  /**
   * Register service worker
   */
  async register(scriptURL: string): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptURL);
      console.log('Service Worker registered successfully');
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update check failed:', error);
      throw error;
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Check if browser is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Check if browser is offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Add online event listener
   */
  onOnline(callback: () => void): void {
    window.addEventListener('online', callback);
  }

  /**
   * Add offline event listener
   */
  onOffline(callback: () => void): void {
    window.addEventListener('offline', callback);
  }

  /**
   * Cache content for offline access
   */
  async cacheContent(contentType: string, contentId: string): Promise<void> {
    await this.sendMessage({
      type: 'CACHE_CONTENT',
      contentType,
      contentId,
    });
  }

  /**
   * Clear all cached content
   */
  async clearCache(): Promise<void> {
    await this.sendMessage({
      type: 'CLEAR_CACHE',
    });
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    return await this.sendMessage({
      type: 'GET_CACHE_STATUS',
    });
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(tag: string): Promise<void> {
    await this.sendMessage({
      type: 'REGISTER_BACKGROUND_SYNC',
      tag,
    });
  }

  /**
   * Queue data for background sync
   */
  async queueBackgroundSync(tag: string, data: any): Promise<void> {
    await this.sendMessage({
      type: 'QUEUE_BACKGROUND_SYNC',
      tag,
      data,
    });
  }

  /**
   * Setup install prompt listener
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      this.handleInstallPrompt(e as BeforeInstallPromptEvent);
    });
  }

  /**
   * Handle install prompt event
   */
  handleInstallPrompt(event: BeforeInstallPromptEvent): void {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    // Stash the event so it can be triggered later
    this.deferredPrompt = event;
    console.log('Install prompt available');
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<string | null> {
    if (!this.deferredPrompt) {
      return null;
    }

    // Show the install prompt
    await this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
    
    return outcome;
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }
}