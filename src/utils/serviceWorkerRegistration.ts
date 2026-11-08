/**
 * DosKit - Service Worker Registration
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Handles service worker registration and lifecycle management for PWA functionality
 */

import { PWA_CONFIG } from '../constants/app';
import { logger } from './logger';

// What the registration reports, through the logger: warnings and errors in every build,
// the rest in development only
const LOG_CONTEXT = 'SW';

// Configuration
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

/**
 * Register the service worker for PWA functionality
 * Only registers in production mode and if service workers are supported
 * @param config - Optional configuration with callbacks for success, update, and offline ready events
 * @example
 * ```typescript
 * register({
 *   onSuccess: (registration) => console.log('SW registered'),
 *   onUpdate: (registration) => console.log('SW updated'),
 *   onOfflineReady: () => console.log('App ready for offline use')
 * });
 * ```
 */
export function register(config?: ServiceWorkerConfig): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      // Service worker won't work if PUBLIC_URL is on a different origin
      console.warn('[SW] Service worker not registered: PUBLIC_URL is on a different origin');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        // This is running on localhost. Check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // On localhost, say how the worker serves the app (public/sw.js)
        navigator.serviceWorker.ready.then(() => {
          logger.info(
            LOG_CONTEXT,
            'Service worker ready: pages come from the network first, falling back to the ' +
              'cached index.html offline; bundles, emulator files and app archives come from ' +
              'its caches'
          );
          config?.onOfflineReady?.();
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Register a valid service worker
 * Sets up update checks and lifecycle event handlers
 * @param swUrl - The URL of the service worker script
 * @param config - Optional configuration with callbacks
 * @private
 */
function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      logger.info(LOG_CONTEXT, 'Service worker registered for', registration.scope);

      // Set up periodic update checks (every hour when page is visible)
      setupPeriodicUpdateChecks(registration);

      // An update installed earlier may still be waiting (e.g. the user chose
      // "Later" and reloaded); updatefound won't fire again for it
      if (registration.waiting && navigator.serviceWorker.controller) {
        config?.onUpdate?.(registration);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // The update has precached its files, but the current worker keeps serving
              // the app until the user picks Update Now in the prompt onUpdate shows
              // (UpdateNotification), or until every tab of the app has closed
              logger.info(
                LOG_CONTEXT,
                'An update is installed and waiting: it takes over after Update Now, ' +
                  'or once every tab of the app has closed'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // The first worker has precached the app shell, the bundles and the
              // default emulator
              logger.info(LOG_CONTEXT, 'Content is cached for offline use');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }

              if (config && config.onOfflineReady) {
                config.onOfflineReady();
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

/**
 * Set up periodic update checks for the service worker
 * Checks for updates every PWA_CONFIG.UPDATE_CHECK_INTERVAL when the page is visible
 * Also checks when the page becomes visible after being hidden
 * @param registration - The service worker registration object
 * @private
 */
function setupPeriodicUpdateChecks(registration: ServiceWorkerRegistration): void {
  // Check for updates periodically
  const checkForUpdates = () => {
    // Only check if page is visible to save resources
    if (document.visibilityState === 'visible') {
      logger.debug(LOG_CONTEXT, 'Checking for service worker updates');
      registration.update().catch((error) => {
        console.error('[SW] Error checking for updates:', error);
      });
    }
  };

  // Set up interval for periodic checks
  setInterval(checkForUpdates, PWA_CONFIG.UPDATE_CHECK_INTERVAL);

  // Also check when page becomes visible (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  logger.info(
    LOG_CONTEXT,
    `Checking for updates every ${PWA_CONFIG.UPDATE_CHECK_INTERVAL / 60_000} minutes ` +
      'while the page is visible, and whenever it becomes visible again'
  );
}

/**
 * Check if service worker is valid
 * Verifies the service worker file exists and is a JavaScript file
 * If not found or invalid, unregisters any existing service worker and reloads
 * @param swUrl - The URL of the service worker script
 * @param config - Optional configuration with callbacks
 * @private
 */
function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig): void {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.info(LOG_CONTEXT, "No internet connection: the app runs from the worker's caches");
    });
}
