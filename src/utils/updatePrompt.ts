/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Mounts the "Update Available" prompt outside the main React tree, so it can
 * be shown from service worker callbacks.
 */

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { UpdateNotification } from '../components/UpdateNotification';

const CONTAINER_ID = 'update-notification-container';

/**
 * Show the update prompt for a service worker registration with a waiting worker
 * @param registration - The registration whose waiting worker should be activated
 */
export function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  // One prompt at a time. A prompt already on screen stays valid: the
  // registration always exposes the newest waiting worker.
  if (document.getElementById(CONTAINER_ID)) {
    return;
  }

  // Create a container for the update notification
  const notificationContainer = document.createElement('div');
  notificationContainer.id = CONTAINER_ID;
  document.body.appendChild(notificationContainer);

  // Render the update notification
  const notificationRoot = createRoot(notificationContainer);
  notificationRoot.render(
    createElement(UpdateNotification, {
      registration,
      onDismiss: () => {
        notificationRoot.unmount();
        notificationContainer.remove();
      },
    })
  );
}
