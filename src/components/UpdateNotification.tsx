/**
 * DosKit - Update Notification Component
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 * 
 * Displays a user-friendly notification when a PWA update is available
 * Works reliably across all platforms including iOS Safari
 */

import { useState, useEffect } from 'react';
import './UpdateNotification.css';

interface UpdateNotificationProps {
  registration: ServiceWorkerRegistration | null;
  onDismiss?: () => void;
}

export function UpdateNotification({ registration, onDismiss }: UpdateNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (registration) {
      setShow(true);
    }
  }, [registration]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to get the new version
        window.location.reload();
      });
    }
  };

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="update-notification-overlay">
      <div className="update-notification">
        <div className="update-notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </div>
        
        <div className="update-notification-content">
          <h3 className="update-notification-title">Update Available</h3>
          <p className="update-notification-message">
            A new version of DosKit is ready to install. Update now to get the latest features and improvements.
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

