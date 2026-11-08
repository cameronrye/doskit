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
