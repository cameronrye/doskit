/**
 * DosKit Service Worker
 * Provides offline functionality and caching for the PWA
 */

// Replaced by scripts/inject-sw-version.js: every build gets a new CACHE_VERSION, so each
// deploy installs a new worker with a fresh copy of the app shell
const CACHE_VERSION = 'v1';
const CACHE_NAME = `doskit-${CACHE_VERSION}`;
const METADATA_CACHE_NAME = `${CACHE_NAME}-metadata`;

// Emulator files only change with js-dos, so they have a cache of their own that deploys
// keep. The build replaces this with the js-dos version it copied into /emulators/.
const JS_DOS_VERSION = 'dev';
const EMULATOR_CACHE_NAME = `doskit-emulators-${JS_DOS_VERSION}`;

// Demo archives only change when one is replaced, so deploys keep their cache too. The
// build replaces this with a hash of the archives in dist/demos, so a deploy that changes
// any of them starts a new cache.
const DEMOS_HASH = 'dev';
const DEMO_CACHE_NAME = `doskit-demos-${DEMOS_HASH}`;
// The archives that hash covers
const DEMO_ARCHIVE = /^\/demos\/[^/]+\.zip$/;

// Configuration
const CONFIG = {
  NETWORK_TIMEOUT_BASE: 5000, // Base timeout: 5 seconds for small files
  NETWORK_TIMEOUT_MAX: 60000, // Maximum timeout: 60 seconds
  MAX_CACHE_SIZE: 100, // Entry limit of CACHE_NAME; trimming removes runtime entries only
};

// Assets to cache on install. The build appends every JS and CSS file in dist/assets,
// the chunks imported lazily too: offline, an app needs its config chunk to start.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/js-dos.js',
  '/js-dos.css',
];

// Emulator files for the default "dosbox" backend, which every app runs on. DOSBox-X
// (wdosbox-x.*, 6.6 MB) is left out: js-dos offers its backend picker only before a run,
// which autoStart with countDownStart 0 skips, so users cannot switch to it. Should
// anything request it, cache-first stores it on first use like any emulator file.
const EMULATOR_ASSETS = [
  '/emulators/wdosbox.wasm',
  '/emulators/wdosbox.js',
  '/emulators/wlibzip.wasm',
  '/emulators/wlibzip.js',
  '/emulators/emulators.js',
];

const absoluteUrl = (path) => new URL(path, self.location.origin).href;

// Lookups ignore Vary: every file the worker caches is the same for every request, and
// Vary would make a request miss whose headers differ from the stored request's. Chrome
// sends Origin with the crossorigin requests of index.html (its module scripts, its
// stylesheet and the wasm preload), install's requests carry none, and some hosts (vite
// preview, not GitHub Pages) answer with Vary: Origin.
const MATCH_OPTIONS = { ignoreVary: true };

// What install puts in CACHE_NAME: trimming leaves these alone, since /index.html is the
// offline fallback for every navigation and the app cannot start without the rest
const PRECACHED_URLS = new Set(STATIC_ASSETS.map(absoluteUrl));

// A request the browser sends to the server even when its HTTP cache holds a fresh copy;
// the server answers 304 when the file has not changed
const fromServer = (input) => new Request(input, { cache: 'no-cache' });

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  // GitHub Pages lets browsers reuse a file for 10 minutes, so a worker installed that
  // soon after a visit could store the previous deploy's index.html, which loads bundles
  // this deploy no longer has. A bundle's name changes with its content, so whatever the
  // HTTP cache holds under that name is current, and saves downloading it again.
  await cache.addAll(
    STATIC_ASSETS.map((path) => (path.startsWith('/assets/') ? path : fromServer(path)))
  );
  console.log(`[Service Worker] ✅ Static assets cached (${STATIC_ASSETS.length} files)`);
}

/**
 * Precache the default backend into the cache of this js-dos version. Only files that
 * are not there yet are downloaded, so a deploy that keeps js-dos fetches none.
 */
async function precacheEmulator() {
  const cache = await caches.open(EMULATOR_CACHE_NAME);
  const cachedUrls = new Set((await cache.keys()).map((request) => request.url));
  const missing = EMULATOR_ASSETS.filter((path) => !cachedUrls.has(absoluteUrl(path)));
  // A cached emulator file is kept until js-dos changes, so it must come from the server:
  // an HTTP cache entry that is still fresh may hold the previous js-dos version's file
  await cache.addAll(missing.map(fromServer));
  console.log(
    `[Service Worker] ✅ Emulator assets cached in ${EMULATOR_CACHE_NAME} ` +
      `(${missing.length} downloaded, ${EMULATOR_ASSETS.length - missing.length} kept)`
  );
}

// Install event - cache the app shell and the default emulator
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker...', CACHE_NAME);

  event.waitUntil(
    precacheAppShell()
      .then(precacheEmulator)
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

// Activate event - delete the caches of earlier deploys, other js-dos versions and other
// demo archives
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker...', CACHE_NAME);
  const currentCaches = [CACHE_NAME, METADATA_CACHE_NAME, EMULATOR_CACHE_NAME, DEMO_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('doskit-') && !currentCaches.includes(cacheName)) {
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
 * Calculate dynamic timeout based on file type
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
 * Read the LRU timestamps (last use of each cached URL), which Cache Storage keeps
 * as one JSON entry in a cache of their own
 */
async function getCacheMetadata() {
  try {
    const cache = await caches.open(METADATA_CACHE_NAME);
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

    const cache = await caches.open(METADATA_CACHE_NAME);
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
 * Trim the cache to MAX_CACHE_SIZE entries, removing the least recently used
 * runtime entries first (LRU by the metadata timestamps)
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

      // Runtime entries with their timestamps; what install precached is never trimmed.
      // A runtime entry without one was just cached: its timestamp write is still pending
      // (or lost to a concurrent one), so it must not count as the oldest.
      const now = Date.now();
      const entries = keys
        .filter((request) => !PRECACHED_URLS.has(request.url))
        .map((request) => ({
          request,
          url: request.url,
          timestamp: metadata[request.url] ?? now,
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

      const metadataCache = await caches.open(METADATA_CACHE_NAME);
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

/**
 * Store a response in CACHE_NAME, then record its use and trim the cache. Cache.put()
 * reads the whole body before it writes the entry, so a trim that ran alongside it would
 * count the cache without that entry and leave it over its limit.
 */
async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  } catch (error) {
    // Such as a body that broke off because the page stopped loading it
    console.error('[Service Worker] Error caching response:', request.url, error);
    return;
  }
  await updateCacheMetadata(request.url);
  await trimCache(CACHE_NAME);
}

/**
 * Serve a file cache-first from a cache that deploys keep (the emulator files of this
 * js-dos version, or these demo archives), storing it there on first use. Such a cache is
 * kept until its name changes, so a file must come from the server: a still-fresh HTTP
 * cache entry may hold a previous deploy's copy. The copy of the page's request keeps its
 * signal, so a download the page aborts stops, and Cache.put() then stores nothing of it.
 */
async function serveCacheFirst(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, MATCH_OPTIONS);
  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache (cache-first):', request.url);
    return cachedResponse;
  }

  console.log('[Service Worker] Fetching from network (cache-first):', request.url);
  const networkResponse = await fetchWithTimeout(fromServer(request));
  if (networkResponse.status === 200) {
    event.waitUntil(
      cache
        .put(request, networkResponse.clone())
        .catch((error) => console.error('[Service Worker] Error caching', request.url, error))
    );
  }
  return networkResponse;
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

  // The worker script always comes from the server. Browsers fetch it for updates
  // without asking the worker; the page fetches it to check that the worker still
  // exists (serviceWorkerRegistration.ts), which a cached copy would keep confirming.
  if (url.pathname === self.location.pathname) {
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
            event.waitUntil(cacheResponse(request, networkResponse.clone()));
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
          return caches.match(request, MATCH_OPTIONS).then((cachedResponse) => {
            if (cachedResponse) {
              // Update timestamp when serving from cache
              updateCacheMetadata(request.url);
            }
            // A URL never visited online (such as a new deep link) gets the app shell
            return cachedResponse || caches.match('/index.html', MATCH_OPTIONS);
          });
        })
    );
    return;
  }

  // Cache-first for emulator files, from the cache of this js-dos version
  if (url.pathname.startsWith('/emulators/')) {
    event.respondWith(serveCacheFirst(event, EMULATOR_CACHE_NAME));
    return;
  }

  // Cache-first for demo archives, from the cache of these archives
  if (DEMO_ARCHIVE.test(url.pathname)) {
    event.respondWith(serveCacheFirst(event, DEMO_CACHE_NAME));
    return;
  }

  // Cache-first for other WASM: large, and unchanged within a deploy (each build gets a
  // new CACHE_VERSION, so activation drops stale copies). Stale-while-revalidate would
  // re-download it in full on every use.
  if (url.pathname.endsWith('.wasm') || url.pathname.endsWith('.wasm.gz')) {
    event.respondWith(
      caches.match(request, MATCH_OPTIONS).then((cachedResponse) => {
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
            event.waitUntil(cacheResponse(request, networkResponse.clone()));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS and other assets
  event.respondWith(
    caches.match(request, MATCH_OPTIONS).then((cachedResponse) => {
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
                return cacheResponse(request, networkResponse);
              }
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
            event.waitUntil(cacheResponse(request, networkResponse.clone()));
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
