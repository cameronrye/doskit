/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { showUpdateNotification } from './utils/updatePrompt';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import { initializeErrorTracking } from './utils/errorTracking';
import { initializeGlobalErrorHandler } from './utils/globalErrorHandler';
import { logger } from './utils/logger';

// Initialize error tracking (swap in a remote service here when one is set up)
initializeErrorTracking();

// Initialize global error handler. It logs and tracks errors itself, and keeps
// known harmless ones, such as js-dos's fullscreen and keyboard lock calls that
// fail without a user gesture, out of the console.
initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
});

// In development, StrictMode mounts every component twice at once, so each DosPlayer
// starts js-dos twice in the same element. useDosEmulator stops the first start's player,
// and the adapter holds the second start back until emulators.js, which the first one
// loads on a fresh page, has run. The first start's keyboard lock is then superseded,
// which the global error handler keeps out of the console as harmless.
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => {
    logger.info('PWA', 'The app and the default emulator are cached for offline use');
  },
  onUpdate: (registration) => {
    logger.info('PWA', 'An update is waiting: showing the update prompt');
    showUpdateNotification(registration);
  },
  onOfflineReady: () => {
    logger.info('PWA', 'Ready for offline use, with each app once it has been opened online');
  },
});
