/**
 * DosKit - Update Notification Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Displays a user-friendly notification when a PWA update is available
 * Works reliably across all platforms including iOS Safari
 */

import { useEffect, useId, useRef, useState } from 'react';
import { PWA_CONFIG } from '../constants/app';
import { logger } from '../utils/logger';
import './UpdateNotification.css';

// What Update Now goes through, logged in development only
const LOG_CONTEXT = 'UpdateNotification';

interface UpdateNotificationProps {
  registration: ServiceWorkerRegistration | null;
  onDismiss?: () => void;
}

export function UpdateNotification({ registration, onDismiss }: UpdateNotificationProps) {
  // Track if user has dismissed the notification
  const [isDismissed, setIsDismissed] = useState(false);

  // Show notification when registration exists and hasn't been dismissed
  const show = !!registration && !isDismissed;

  // The waits of Update Now's fallback reload, called off when the prompt goes away
  const fallbackTimeouts = useRef<number[]>([]);
  useEffect(() => {
    const timeouts = fallbackTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const titleId = useId();
  const messageId = useId();
  const updateButton = useRef<HTMLButtonElement>(null);
  const laterButton = useRef<HTMLButtonElement>(null);

  // It covers the page, so like any modal dialog it takes the focus when it appears, and
  // gives it back when it goes to whatever had it, which may be the page itself
  useEffect(() => {
    if (!show) return;
    const previous = document.activeElement;
    updateButton.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [show]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      logger.info(LOG_CONTEXT, 'Initiating update');

      // Set up a flag to prevent multiple reloads
      let reloadTriggered = false;

      const performReload = () => {
        if (!reloadTriggered) {
          reloadTriggered = true;
          logger.info(LOG_CONTEXT, 'Reloading to activate the new version');
          window.location.reload();
        }
      };

      // IMPORTANT: Add the controllerchange listener BEFORE sending the SKIP_WAITING message
      // This prevents a race condition where the event fires before the listener is registered
      // (especially critical on iOS Safari where service worker activation can be very fast)
      navigator.serviceWorker.addEventListener('controllerchange', performReload, { once: true });

      // Fallback reload, should controllerchange never fire: UPDATE_MAX_RETRIES waits that
      // start at UPDATE_BASE_DELAY and double, 1s, 2s and 4s, so it comes 7s after the click
      const maxRetries = PWA_CONFIG.UPDATE_MAX_RETRIES;
      const baseDelay = PWA_CONFIG.UPDATE_BASE_DELAY;
      let retryCount = 0;

      const scheduleFallbackReload = () => {
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          const timeoutId = setTimeout(() => {
            if (!reloadTriggered) {
              retryCount++;
              if (retryCount >= maxRetries) {
                logger.info(LOG_CONTEXT, 'The new worker never took control: reloading anyway');
                performReload();
              } else {
                logger.info(
                  LOG_CONTEXT,
                  `Still waiting for the new worker to take control (${retryCount}/${maxRetries})`
                );
                scheduleFallbackReload();
              }
            }
          }, delay);
          fallbackTimeouts.current.push(timeoutId);
        }
      };

      scheduleFallbackReload();

      // Clear all fallback timeouts if controllerchange fires normally
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          fallbackTimeouts.current.forEach(clearTimeout);
        },
        { once: true }
      );

      // Now send the SKIP_WAITING message to the service worker
      try {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        logger.info(LOG_CONTEXT, 'SKIP_WAITING message sent to the waiting worker');
      } catch (error) {
        console.error('[UpdateNotification] Error sending SKIP_WAITING message:', error);
        // If we can't send the message, clear all timeouts and try a simple reload
        fallbackTimeouts.current.forEach(clearTimeout);
        performReload();
      }
    } else {
      // Nothing waits once Update Now in another tab has let the worker take over. This tab
      // is then under the new worker already, and a reload gets the new version.
      logger.info(LOG_CONTEXT, 'The update has taken over from another tab: reloading');
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Escape answers Later, and Tab and Shift+Tab go round the two buttons
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleDismiss();
    } else if (event.key === 'Tab') {
      const buttons = [updateButton.current, laterButton.current];
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
      // Back from the first button, on from the last, or either way from the dialog itself
      if (event.shiftKey ? at <= 0 : at === -1 || at === buttons.length - 1) {
        event.preventDefault();
        buttons.at(event.shiftKey ? -1 : 0)?.focus();
      }
    }
  };

  // A click on the backdrop leaves the focus where it is, in the prompt
  const handleBackdropMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div
      className="update-notification-overlay"
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropMouseDown}
    >
      {/* Focusable, so that a click on its text keeps the focus in it */}
      <div
        className="update-notification"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
      >
        <div className="update-notification-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </div>

        <div className="update-notification-content">
          <h2 id={titleId} className="update-notification-title">
            Update Available
          </h2>
          <p id={messageId} className="update-notification-message">
            A new version of DosKit is ready to install. Update now to get the latest features and
            improvements.
          </p>
        </div>

        <div className="update-notification-actions">
          <button
            ref={updateButton}
            className="update-notification-button update-notification-button-primary"
            onClick={handleUpdate}
          >
            Update Now
          </button>
          <button
            ref={laterButton}
            className="update-notification-button update-notification-button-secondary"
            onClick={handleDismiss}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
