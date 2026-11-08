/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Mounts the "Update Available" prompt outside the main React tree, so it can
 * be shown from service worker callbacks.
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UpdateNotification } from '../components/UpdateNotification';

const CONTAINER_ID = 'update-notification-container';

/** The prompt on screen */
interface Prompt {
  root: Root;
  container: HTMLElement;
  /**
   * Whether its Update Now has asked the waiting worker to take over: the controllerchange
   * that follows is then this tab's own, which UpdateNotification reloads for
   */
  updateRequested: boolean;
}

let prompt: Prompt | null = null;

// The navigator.serviceWorker whose controllerchange the prompt watches
let watched: ServiceWorkerContainer | null = null;

// The keys pressed in the prompt that have not come up yet
const keysDownInPrompt = new Set<string>();

// A running js-dos takes every key that reaches window and cancels it, so Tab, Enter and
// Space would do nothing in the prompt and be typed into DOS. Keys pressed in the prompt
// stop at its root, once React, which listens there, has handled them. (The prompt is
// outside #root, whose keys App keeps from js-dos itself.)
const keepKeyFromJsDos = (event: KeyboardEvent) => {
  event.stopPropagation();
  if (event.type === 'keydown') {
    keysDownInPrompt.add(event.code);
  }
};

// Escape, and Enter on a button, close the prompt as the key goes down, so the key comes
// up on the page, where js-dos would send DOS the release of a key it never had pressed.
// Window sees a key's release before anything on the page does, and keeps it from js-dos.
const keepReleaseFromJsDos = (event: KeyboardEvent) => {
  if (keysDownInPrompt.delete(event.code)) {
    event.stopPropagation();
  }
};

/**
 * Mount the prompt, or render the one on screen again
 * @param registration - The registration the update is for
 * @param updatedInAnotherTab - Whether another tab has already let the update take over
 */
function render(registration: ServiceWorkerRegistration, updatedInAnotherTab: boolean): void {
  if (!prompt) {
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);
    container.addEventListener('keydown', keepKeyFromJsDos);
    container.addEventListener('keyup', keepKeyFromJsDos);
    // Added once: the same listener again changes nothing
    window.addEventListener('keyup', keepReleaseFromJsDos, { capture: true });
    prompt = { root: createRoot(container), container, updateRequested: false };
  }

  const shown = prompt;
  shown.root.render(
    createElement(UpdateNotification, {
      registration,
      updatedInAnotherTab,
      onUpdateRequested: () => {
        shown.updateRequested = true;
      },
      onDismiss: () => {
        shown.root.unmount();
        shown.container.remove();
        prompt = null;
      },
    })
  );
}

/**
 * Watch for another tab's Update Now. It lets the new worker take over every tab, and this
 * one then runs the version it loaded under that worker until it reloads, so the prompt
 * says so, again if it was put off. Only a page a worker controls is told of an update, so
 * this never answers the first install, whose worker takes control of pages that had none.
 * @param registration - The registration the update is for
 */
function watchForUpdateInAnotherTab(registration: ServiceWorkerRegistration): void {
  if (watched === navigator.serviceWorker) {
    return;
  }
  watched = navigator.serviceWorker;
  watched.addEventListener('controllerchange', () => {
    if (!prompt?.updateRequested) {
      render(registration, true);
    }
  });
}

/**
 * Show the update prompt for a service worker registration with a waiting worker
 * @param registration - The registration whose waiting worker should be activated
 */
export function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  watchForUpdateInAnotherTab(registration);

  // One prompt at a time. A prompt already on screen stays valid: the
  // registration always exposes the newest waiting worker.
  if (!prompt) {
    render(registration, false);
  }
}
