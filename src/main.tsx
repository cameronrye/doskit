/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import './index.css'
import App from './App.tsx'
import { UpdateNotification } from './components/UpdateNotification.tsx'
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration'

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
root.render(<App />);

// State for update notification
let updateRegistration: ServiceWorkerRegistration | null = null;

// Function to show update notification
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  updateRegistration = registration;

  // Create a container for the update notification
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'update-notification-container';
  document.body.appendChild(notificationContainer);

  // Render the update notification
  const notificationRoot = createRoot(notificationContainer);
  notificationRoot.render(
    createElement(UpdateNotification, {
      registration: updateRegistration,
      onDismiss: () => {
        notificationRoot.unmount();
        notificationContainer.remove();
      }
    })
  );
}

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
