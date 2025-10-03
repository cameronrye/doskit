/**
 * DosKit Service Worker
 * Provides offline functionality and caching for the PWA
 */

// Cache version - increment this to force cache update
const CACHE_VERSION = 'v1';
const CACHE_NAME = `doskit-${CACHE_VERSION}`;

// Base path handling for GitHub Pages vs local
const getBasePath = () => {
  // Check if we're on GitHub Pages
  if (self.location.pathname.startsWith('/doskit/')) {
    return '/doskit';
  }
  return '';
};

const BASE_PATH = getBasePath();

// Assets to cache on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/logo.svg`,
  `${BASE_PATH}/favicon.svg`,
  `${BASE_PATH}/js-dos.js`,
  `${BASE_PATH}/js-dos.css`,
];

// WASM and emulator files to cache
const EMULATOR_ASSETS = [
  `${BASE_PATH}/emulators/wdosbox.wasm`,
  `${BASE_PATH}/emulators/wdosbox.js`,
  `${BASE_PATH}/emulators/wdosbox-x.wasm`,
  `${BASE_PATH}/emulators/wdosbox-x.js`,
  `${BASE_PATH}/emulators/wlibzip.wasm`,
  `${BASE_PATH}/emulators/wlibzip.js`,
  `${BASE_PATH}/emulators/emulators.js`,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Cache static assets first
        return cache.addAll(STATIC_ASSETS)
          .then(() => {
            console.log('[Service Worker] Static assets cached');
            // Then cache emulator assets (these are larger)
            return cache.addAll(EMULATOR_ASSETS);
          })
          .then(() => {
            console.log('[Service Worker] Emulator assets cached');
          });
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker...', CACHE_NAME);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('doskit-') && cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          console.log('[Service Worker] Serving from cache:', request.url);
          
          // Stale-while-revalidate: return cache immediately, update in background
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                  });
                }
                return networkResponse;
              })
              .catch(() => {
                // Network failed, but we already returned cache
              })
          );
          
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              // Clone the response before caching
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Cache the new resource
                  cache.put(request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}/index.html`);
            }
            
            // For other requests, throw the error
            throw error;
          });
      })
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('doskit-')) {
                return caches.delete(cacheName);
              }
            })
          );
        })
    );
  }
});

// Background sync for future enhancements
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-dos-state') {
    event.waitUntil(
      // Future: sync DOS state when online
      Promise.resolve()
    );
  }
});

// Push notifications for future enhancements
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-72x72.png`,
    vibrate: [200, 100, 200],
    tag: 'doskit-notification',
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification('DosKit', options)
  );
});

console.log('[Service Worker] Service worker script loaded');

