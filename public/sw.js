/**
 * DosKit Service Worker
 * Provides offline functionality and caching for the PWA
 */

// Cache version - increment this to force cache update
const CACHE_VERSION = 'v1';
const CACHE_NAME = `doskit-${CACHE_VERSION}`;

// Configuration
const CONFIG = {
  NETWORK_TIMEOUT: 5000, // 5 seconds timeout for network requests
  MAX_CACHE_SIZE: 100, // Maximum number of items in cache
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

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
        console.log(`[Service Worker] Total assets to cache: ${STATIC_ASSETS.length + EMULATOR_ASSETS.length}`);

        // Cache static assets first (critical for app to work)
        return cache.addAll(STATIC_ASSETS)
          .then(() => {
            console.log(`[Service Worker] ✅ Static assets cached (${STATIC_ASSETS.length} files)`);
            // Then cache emulator assets (these are larger)
            return cache.addAll(EMULATOR_ASSETS);
          })
          .then(() => {
            console.log(`[Service Worker] ✅ Emulator assets cached (${EMULATOR_ASSETS.length} files)`);
          })
          .catch((error) => {
            console.error('[Service Worker] ❌ Failed to cache assets:', error);
            // Log which asset failed
            if (error.message) {
              console.error('[Service Worker] Error details:', error.message);
            }
            throw error; // Re-throw to fail the installation
          });
      })
      .then(() => {
        console.log('[Service Worker] ✅ Installation complete - all assets cached');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Installation failed:', error);
        // Don't call skipWaiting if installation failed
        throw error;
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
      .then(() => {
        // Clean up old cache entries
        return trimCache(CACHE_NAME);
      })
  );
});

/**
 * Utility: Fetch with timeout
 * Prevents hanging on slow network connections
 */
function fetchWithTimeout(request, timeout = CONFIG.NETWORK_TIMEOUT) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

/**
 * Utility: Trim cache to maximum size
 * Removes oldest entries when cache exceeds MAX_CACHE_SIZE
 */
async function trimCache(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      console.log(`[Service Worker] Cache size (${keys.length}) exceeds limit (${CONFIG.MAX_CACHE_SIZE}), trimming...`);

      // Delete oldest entries (first in the array)
      const keysToDelete = keys.slice(0, keys.length - CONFIG.MAX_CACHE_SIZE);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));

      console.log(`[Service Worker] Deleted ${keysToDelete.length} old cache entries`);
    }
  } catch (error) {
    console.error('[Service Worker] Error trimming cache:', error);
  }
}

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

  // Network-first strategy for HTML documents to ensure fresh content
  if (request.mode === 'navigate' || request.destination === 'document' ||
      url.pathname.endsWith('.html') || url.pathname === BASE_PATH + '/') {
    event.respondWith(
      fetchWithTimeout(request)
        .then((networkResponse) => {
          // Cache the fresh HTML
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              // Trim cache after adding new entry
              trimCache(CACHE_NAME);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // Network failed or timed out, fallback to cache
          console.log('[Service Worker] Network failed/timeout, serving cached HTML:', request.url, error.message);
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(`${BASE_PATH}/index.html`);
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for all other assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          console.log('[Service Worker] Serving from cache:', request.url);

          // Stale-while-revalidate: return cache immediately, update in background
          event.waitUntil(
            fetchWithTimeout(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                    // Trim cache after adding new entry
                    trimCache(CACHE_NAME);
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
        return fetchWithTimeout(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              // Clone the response before caching
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Cache the new resource
                  cache.put(request, responseToCache);
                  // Trim cache after adding new entry
                  trimCache(CACHE_NAME);
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

