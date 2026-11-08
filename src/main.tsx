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

// Initialize global error handler. It logs and tracks errors itself, and keeps
// known harmless ones, such as js-dos's fullscreen and keyboard lock calls that
// fail without a user gesture, out of the console.
initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
});

// No StrictMode: in development it mounts every component twice at once, so each
// DosPlayer starts js-dos 8.3.20 twice in the same element. The second start finds the
// emulators.js script tag the first one added and, on a fresh page load, reads the
// emulators global before the script has run ("Unable to init emulators.js:
// ReferenceError: emulators is not defined"), so the visible player never boots. Every
// double start also leaves the first one's keyboard lock to reject, unhandled, as
// "superseded by a subsequent lock() method call".
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
