/**
 * DosKit - Update Notification Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Displays a user-friendly notification when a PWA update is available
 * Works reliably across all platforms including iOS Safari
 */

import { useState } from "react";
import { PWA_CONFIG } from "../constants/app";
import "./UpdateNotification.css";

interface UpdateNotificationProps {
  registration: ServiceWorkerRegistration | null;
  onDismiss?: () => void;
}

export function UpdateNotification({
  registration,
  onDismiss,
}: UpdateNotificationProps) {
  // Track if user has dismissed the notification
  const [isDismissed, setIsDismissed] = useState(false);

  // Show notification when registration exists and hasn't been dismissed
  const show = !!registration && !isDismissed;

  const handleUpdate = () => {
    if (registration?.waiting) {
      console.log("[UpdateNotification] Initiating update...");

      // Set up a flag to prevent multiple reloads
      let reloadTriggered = false;

      const performReload = () => {
        if (!reloadTriggered) {
          reloadTriggered = true;
          console.log(
            "[UpdateNotification] Reloading to activate new version...",
          );
          window.location.reload();
        }
      };

      // IMPORTANT: Add the controllerchange listener BEFORE sending the SKIP_WAITING message
      // This prevents a race condition where the event fires before the listener is registered
      // (especially critical on iOS Safari where service worker activation can be very fast)
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        performReload,
        { once: true },
      );

      // Exponential backoff retry mechanism for fallback reload
      // Starts at 1s, then 2s, then 4s, with max timeout of 8s total
      const maxRetries = PWA_CONFIG.UPDATE_MAX_RETRIES;
      const baseDelay = PWA_CONFIG.UPDATE_BASE_DELAY;
      let retryCount = 0;
      const fallbackTimeouts: number[] = [];

      const scheduleFallbackReload = () => {
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          const timeoutId = setTimeout(() => {
            if (!reloadTriggered) {
              retryCount++;
              if (retryCount >= maxRetries) {
                console.log(
                  "[UpdateNotification] Final fallback reload triggered after exponential backoff",
                );
                performReload();
              } else {
                console.log(
                  `[UpdateNotification] Retry ${retryCount}/${maxRetries} - checking for controllerchange...`,
                );
                scheduleFallbackReload();
              }
            }
          }, delay);
          fallbackTimeouts.push(timeoutId);
        }
      };

      scheduleFallbackReload();

      // Clear all fallback timeouts if controllerchange fires normally
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          fallbackTimeouts.forEach(clearTimeout);
        },
        { once: true },
      );

      // Now send the SKIP_WAITING message to the service worker
      try {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        console.log(
          "[UpdateNotification] SKIP_WAITING message sent to service worker",
        );
      } catch (error) {
        console.error(
          "[UpdateNotification] Error sending SKIP_WAITING message:",
          error,
        );
        // If we can't send the message, clear all timeouts and try a simple reload
        fallbackTimeouts.forEach(clearTimeout);
        performReload();
      }
    } else {
      console.warn("[UpdateNotification] No waiting service worker found");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="update-notification-overlay">
      <div className="update-notification">
        <div className="update-notification-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </div>

        <div className="update-notification-content">
          <h3 className="update-notification-title">Update Available</h3>
          <p className="update-notification-message">
            A new version of DosKit is ready to install. Update now to get the
            latest features and improvements.
          </p>
        </div>

        <div className="update-notification-actions">
          <button
            className="update-notification-button update-notification-button-primary"
            onClick={handleUpdate}
          >
            Update Now
          </button>
          <button
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
