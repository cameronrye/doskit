/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { showUpdateNotification } from './utils/updatePrompt';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import { initializeErrorTracking } from './utils/errorTracking';
import { initializeGlobalErrorHandler } from './utils/globalErrorHandler';

// Initialize error tracking (swap in a remote service here when one is set up)
initializeErrorTracking();

// Initialize global error handler (it logs and tracks errors itself)
initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
});

// Suppress harmless browser API errors that occur during js-dos initialization
// These APIs require user interaction and will fail on initial page load
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = String(args[0]);

  // Suppress known harmless errors from js-dos initialization
  if (
    message.includes('exitFullscreen') ||
    message.includes('lock() request could not be registered')
  ) {
    // These are expected - fullscreen and keyboard lock require user interaction
    return;
  }

  // Log all other errors normally
  originalError.apply(console, args);
};

// Note: StrictMode is disabled because it causes double-mounting in development,
// which conflicts with js-dos initialization (WASM modules can't be initialized twice)
const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[PWA] Content is cached for offline use.');
  },
  onUpdate: (registration) => {
    console.log('[PWA] New content is available; please refresh.');
    showUpdateNotification(registration);
  },
  onOfflineReady: () => {
    console.log('[PWA] App is ready for offline use.');
  },
});
