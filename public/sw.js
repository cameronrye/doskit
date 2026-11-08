/**
 * DosKit Service Worker
 * Provides offline functionality and caching for the PWA
 */

// Cache version - increment this to force cache update
const CACHE_VERSION = 'v1';
const CACHE_NAME = `doskit-${CACHE_VERSION}`;

// Configuration
const CONFIG = {
  NETWORK_TIMEOUT_BASE: 5000, // Base timeout: 5 seconds for small files
  NETWORK_TIMEOUT_PER_MB: 2000, // Additional 2 seconds per MB
  NETWORK_TIMEOUT_MAX: 60000, // Maximum timeout: 60 seconds
  MAX_CACHE_SIZE: 100, // Maximum number of items in cache
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Assets to cache on install (the build appends the bundles from dist/index.html)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/js-dos.js',
  '/js-dos.css',
];

// Emulator files for the default "dosbox" backend. DOSBox-X (wdosbox-x.*, 6.6 MB)
// only loads when a user switches backend, so it is cached on first use instead.
const EMULATOR_ASSETS = [
  '/emulators/wdosbox.wasm',
  '/emulators/wdosbox.js',
  '/emulators/wlibzip.wasm',
  '/emulators/wlibzip.js',
  '/emulators/emulators.js',
];

// What install caches: trimming leaves these alone, since /index.html is the offline
// fallback for every navigation and the app cannot start without the rest
const PRECACHED_URLS = new Set(
  [...STATIC_ASSETS, ...EMULATOR_ASSETS].map((path) => new URL(path, self.location.origin).href)
);

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker...', CACHE_NAME);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        console.log(
          `[Service Worker] Total assets to cache: ${STATIC_ASSETS.length + EMULATOR_ASSETS.length}`
        );

        // Cache static assets first (critical for app to work)
        return cache
          .addAll(STATIC_ASSETS)
          .then(() => {
            console.log(`[Service Worker] ✅ Static assets cached (${STATIC_ASSETS.length} files)`);
            // Then cache emulator assets (these are larger)
            return cache.addAll(EMULATOR_ASSETS);
          })
          .then(() => {
            console.log(
              `[Service Worker] ✅ Emulator assets cached (${EMULATOR_ASSETS.length} files)`
            );
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
        console.log('[Service Worker] Waiting for user to activate update...');
        // Don't call skipWaiting() here - let the user decide when to update
        // The service worker will skip waiting when it receives a SKIP_WAITING message
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Installation failed:', error);
        throw error;
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker...', CACHE_NAME);

  event.waitUntil(
    caches
      .keys()
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
 * Calculate dynamic timeout based on file type and estimated size
 * @param {Request} request - The fetch request
 * @returns {number} Timeout in milliseconds
 */
function calculateTimeout(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  // Large file types get longer timeouts
  if (
    pathname.endsWith('.wasm') ||
    pathname.endsWith('.zip') ||
    pathname.endsWith('.iso') ||
    pathname.endsWith('.img')
  ) {
    // WASM and archive files: 30 seconds
    return Math.min(30000, CONFIG.NETWORK_TIMEOUT_MAX);
  }

  if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
    // JavaScript and CSS: 10 seconds
    return 10000;
  }

  if (pathname.endsWith('.html') || pathname === '/') {
    // HTML documents: 5 seconds (should be fast)
    return CONFIG.NETWORK_TIMEOUT_BASE;
  }

  // Default timeout for other files
  return CONFIG.NETWORK_TIMEOUT_BASE;
}

/**
 * Utility: Fetch with dynamic timeout
 * Prevents hanging on slow network connections
 * Timeout is calculated based on file type
 */
function fetchWithTimeout(request, timeout = null) {
  const actualTimeout = timeout || calculateTimeout(request);

  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Network timeout after ${actualTimeout}ms`)), actualTimeout)
    ),
  ]);
}

/**
 * Utility: Trim cache to maximum size
 * Removes oldest entries when cache exceeds MAX_CACHE_SIZE
 */
/**
 * Get cache metadata from IndexedDB
 * Stores timestamps for LRU cache management
 */
async function getCacheMetadata() {
  try {
    const cache = await caches.open(`${CACHE_NAME}-metadata`);
    const response = await cache.match('metadata');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('[Service Worker] Error reading cache metadata:', error);
  }
  return {};
}

/**
 * Update cache metadata with timestamp
 */
async function updateCacheMetadata(url, timestamp = Date.now()) {
  try {
    const metadata = await getCacheMetadata();
    metadata[url] = timestamp;

    const cache = await caches.open(`${CACHE_NAME}-metadata`);
    await cache.put(
      'metadata',
      new Response(JSON.stringify(metadata), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error updating cache metadata:', error);
  }
}

/**
 * Trim cache using LRU (Least Recently Used) strategy with timestamps
 */
async function trimCache(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      console.log(
        `[Service Worker] Cache size (${keys.length}) exceeds limit (${CONFIG.MAX_CACHE_SIZE}), trimming...`
      );

      // Get metadata with timestamps
      const metadata = await getCacheMetadata();

      // Runtime entries with their timestamps; what install precached is never trimmed
      const entries = keys
        .filter((request) => !PRECACHED_URLS.has(request.url))
        .map((request) => ({
          request,
          url: request.url,
          timestamp: metadata[request.url] || 0,
        }));

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate how many entries to delete
      const deleteCount = keys.length - CONFIG.MAX_CACHE_SIZE;
      const keysToDelete = entries.slice(0, deleteCount);

      // Delete oldest entries
      await Promise.all(keysToDelete.map((entry) => cache.delete(entry.request)));

      // Update metadata to remove deleted entries
      const updatedMetadata = await getCacheMetadata();
      keysToDelete.forEach((entry) => {
        delete updatedMetadata[entry.url];
      });

      const metadataCache = await caches.open(`${CACHE_NAME}-metadata`);
      await metadataCache.put(
        'metadata',
        new Response(JSON.stringify(updatedMetadata), {
          headers: { 'Content-Type': 'application/json' },
        })
      );

      console.log(
        `[Service Worker] Deleted ${keysToDelete.length} old cache entries using LRU strategy`
      );
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
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetchWithTimeout(request)
        .then((networkResponse) => {
          // Cache the fresh HTML
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              // Update timestamp for LRU cache
              updateCacheMetadata(request.url);
              // Trim cache after adding new entry
              trimCache(CACHE_NAME);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // Network failed or timed out, fallback to cache
          console.log(
            '[Service Worker] Network failed/timeout, serving cached HTML:',
            request.url,
            error.message
          );
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              // Update timestamp when serving from cache
              updateCacheMetadata(request.url);
            }
            // A URL never visited online (such as a new deep link) gets the app shell
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-first for emulator files, WASM and demo archives: large, and unchanged
  // within a deploy (each build gets a new CACHE_VERSION, so activation drops
  // stale copies). Stale-while-revalidate would re-download them in full on
  // every use. Caching on first use is also what keeps DOSBox-X working offline.
  if (
    url.pathname.startsWith('/emulators/') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.wasm.gz') ||
    url.pathname.startsWith('/demos/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache (cache-first):', request.url);
          // Update timestamp when serving from cache
          updateCacheMetadata(request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network (cache-first):', request.url);
        return fetchWithTimeout(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              updateCacheMetadata(request.url);
              trimCache(CACHE_NAME);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS and other assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        console.log('[Service Worker] Serving from cache:', request.url);

        // Update timestamp when serving from cache
        updateCacheMetadata(request.url);

        // Stale-while-revalidate: return cache immediately, update in background
        event.waitUntil(
          fetchWithTimeout(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse.clone());
                  // Update timestamp for LRU cache
                  updateCacheMetadata(request.url);
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

            caches.open(CACHE_NAME).then((cache) => {
              // Cache the new resource
              cache.put(request, responseToCache);
              // Update timestamp for LRU cache
              updateCacheMetadata(request.url);
              // Trim cache after adding new entry
              trimCache(CACHE_NAME);
            });
          }

          return networkResponse;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          throw error;
        });
    })
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  // Sent by the update prompt (UpdateNotification) when the user accepts an update
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] SKIP_WAITING message received - activating new version');
    self.skipWaiting();
  }
});

console.log('[Service Worker] Service worker script loaded');
