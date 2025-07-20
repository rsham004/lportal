// Learning Portal Service Worker
const CACHE_NAME = 'learning-portal-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const VIDEO_CACHE = 'video-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add other static assets as needed
];

// Cache strategies
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  video: 'cache-first',
  images: 'cache-first',
  default: 'network-first'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== VIDEO_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Determine cache strategy based on request
  let strategy = CACHE_STRATEGIES.default;
  let cacheName = DYNAMIC_CACHE;
  
  if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_STRATEGIES.api;
  } else if (url.pathname.includes('/video/') || url.hostname.includes('mux')) {
    strategy = CACHE_STRATEGIES.video;
    cacheName = VIDEO_CACHE;
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    strategy = CACHE_STRATEGIES.static;
    cacheName = STATIC_CACHE;
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    strategy = CACHE_STRATEGIES.images;
  }
  
  event.respondWith(handleRequest(request, strategy, cacheName));
});

// Handle different cache strategies
async function handleRequest(request, strategy, cacheName) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, cacheName);
    case 'network-first':
      return networkFirst(request, cacheName);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cacheName);
    default:
      return networkFirst(request, cacheName);
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Get offline fallback
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    return caches.match('/offline.html');
  }
  
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_CONTENT':
      handleCacheContent(event, data);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(event);
      break;
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;
    case 'REGISTER_BACKGROUND_SYNC':
      handleRegisterBackgroundSync(event, data);
      break;
    case 'QUEUE_BACKGROUND_SYNC':
      handleQueueBackgroundSync(event, data);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache specific content
async function handleCacheContent(event, data) {
  try {
    const { contentType, contentId } = data;
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Cache course content
    if (contentType === 'course') {
      const courseUrl = `/api/courses/${contentId}`;
      const lessonsUrl = `/api/courses/${contentId}/lessons`;
      
      await Promise.all([
        fetch(courseUrl).then(response => {
          if (response.ok) cache.put(courseUrl, response.clone());
          return response;
        }),
        fetch(lessonsUrl).then(response => {
          if (response.ok) cache.put(lessonsUrl, response.clone());
          return response;
        })
      ]);
    }
    
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    console.error('Failed to cache content:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

// Clear all caches
async function handleClearCache(event) {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

// Get cache status
async function handleGetCacheStatus(event) {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    let totalItems = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalItems += keys.length;
      
      // Estimate size (rough calculation)
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    event.ports[0].postMessage({
      size: totalSize,
      items: totalItems,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Failed to get cache status:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

// Register background sync
async function handleRegisterBackgroundSync(event, data) {
  try {
    const { tag } = data;
    
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await self.registration;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    }
    
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    console.error('Failed to register background sync:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

// Queue data for background sync
async function handleQueueBackgroundSync(event, data) {
  try {
    const { tag, data: syncData } = data;
    
    // Store data in IndexedDB for background sync
    const db = await openDB();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    await store.add({
      tag,
      data: syncData,
      timestamp: Date.now()
    });
    
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    console.error('Failed to queue background sync:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgress());
  }
});

// Sync progress data
async function syncProgress() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const store = transaction.objectStore('sync-queue');
    const items = await store.getAll();
    
    for (const item of items) {
      if (item.tag === 'progress-sync') {
        try {
          const response = await fetch('/api/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data)
          });
          
          if (response.ok) {
            // Remove synced item
            const deleteTransaction = db.transaction(['sync-queue'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('sync-queue');
            await deleteStore.delete(item.id);
          }
        } catch (error) {
          console.error('Failed to sync progress item:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync progress:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('learning-portal-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('tag', 'tag', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have new course updates!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'course-update',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Course'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.tag = data.tag || options.tag;
  }
  
  event.waitUntil(
    self.registration.showNotification('Learning Portal', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});