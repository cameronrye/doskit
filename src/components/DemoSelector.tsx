/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Demo Selector Component
 * Allows users to select and load different DOS applications and demos
 */

import { useState } from "react";
import type { DosApp } from "../types/dos-app";
import type { InitFileEntry } from "../types/js-dos";
import { type LoadProgress } from "../utils/diskLoader";
import "./DemoSelector.css";

// Re-export DosApp for backward compatibility
export type { DosApp };

export interface LoadedApp {
  app: DosApp;
  files: InitFileEntry[] | Uint8Array;
  dosboxConf: string;
}

interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel?: () => void;
}

/**
 * Available DOS applications and demos
 * Exported for use in URL routing and deep linking
 * Uses lazy loading to reduce initial bundle size
 */
// eslint-disable-next-line react-refresh/only-export-components
export const availableApps: DosApp[] = [
  {
    id: "second-reality",
    name: "Second Reality",
    description: "Legendary 1993 demo by Future Crew",
    author: "Future Crew",
    year: 1993,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/second-reality.config");
      const { loadZipArchive } = await import("../utils/diskLoader");
      // Use local ZIP file for fast loading
      return loadZipArchive(config.secondRealityZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/second-reality.config");
      return config.secondRealityDosboxConf;
    },
  },
  {
    id: "impulse-tracker",
    name: "Impulse Tracker",
    description: "Classic music tracker software",
    author: "Jeffrey Lim",
    year: 1995,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/impulse-tracker.config");
      return config.loadZipArchive(config.impulseTrackerZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/impulse-tracker.config");
      return config.impulseTrackerDosboxConf;
    },
  },
  {
    id: "starport-bbstro",
    name: "Starport BBS Intro II",
    description: "Tiny BBS intro (1993 bytes) by Future Crew",
    author: "Future Crew",
    year: 1993,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/starport-bbstro.config");
      return config.loadZipArchive(config.starportBbstroZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/starport-bbstro.config");
      return config.starportBbstroDosboxConf;
    },
  },
  {
    id: "scream-tracker",
    name: "Scream Tracker 3",
    description: "Legendary S3M tracker by Future Crew",
    author: "Future Crew",
    year: 1994,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/scream-tracker.config");
      return config.loadZipArchive(config.screamTrackerZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/scream-tracker.config");
      return config.screamTrackerDosboxConf;
    },
  },
  {
    id: "unreal",
    name: "Unreal",
    description: "Groundbreaking 1992 demo by Future Crew",
    author: "Future Crew",
    year: 1992,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/unreal.config");
      return config.loadZipArchive(config.unrealZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/unreal.config");
      return config.unrealDosboxConf;
    },
  },
  {
    id: "panic",
    name: "Panic",
    description: "Classic 1992 demo by Future Crew",
    author: "Future Crew",
    year: 1992,
    loadMethod: "zip",
    dosboxConf: "", // Loaded dynamically
    loader: async (onProgress) => {
      const config = await import("../dos-apps/panic.config");
      return config.loadZipArchive(config.panicZipUrl, onProgress);
    },
    loadDosboxConf: async () => {
      const config = await import("../dos-apps/panic.config");
      return config.panicDosboxConf;
    },
  },
  // Add more applications here
];

/**
 * Find an application by its ID
 * @param id - The app ID to search for
 * @returns The DosApp if found, undefined otherwise
 */
// eslint-disable-next-line react-refresh/only-export-components
export function findAppById(id: string): DosApp | undefined {
  return availableApps.find((app) => app.id === id);
}

export function DemoSelector({ onSelect, onCancel }: DemoSelectorProps) {
  const [selectedApp, setSelectedApp] = useState<DosApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectApp = (app: DosApp) => {
    setSelectedApp(app);
    setError(null);
  };

  const handleLoadApp = async () => {
    if (!selectedApp) return;

    setIsLoading(true);
    setError(null);
    setLoadProgress({ loaded: 0, total: 1, currentFile: "Starting..." });

    try {
      // Load the application files and dosbox config in parallel with progress tracking
      const [files, conf] = await Promise.all([
        selectedApp.loader(setLoadProgress),
        selectedApp.loadDosboxConf
          ? selectedApp.loadDosboxConf()
          : Promise.resolve(selectedApp.dosboxConf),
      ]);

      // Notify parent component with loaded data
      onSelect({
        app: selectedApp,
        files,
        dosboxConf: conf,
      });
    } catch (err) {
      console.error("[DemoSelector] Error loading application:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load application",
      );
      setIsLoading(false);
      setLoadProgress(null);
    }
  };

  const handleCancel = () => {
    setSelectedApp(null);
    setError(null);
    setLoadProgress(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="demo-selector">
      <div className="demo-selector-header">
        <h2>Select DOS Application</h2>
        {onCancel && (
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="demo-selector-content">
        {/* Application List */}
        <div className="app-list">
          {availableApps.map((app) => (
            <div
              key={app.id}
              className={`app-card ${selectedApp?.id === app.id ? "selected" : ""}`}
              onClick={() => handleSelectApp(app)}
            >
              {app.thumbnail && (
                <div className="app-thumbnail">
                  <img src={app.thumbnail} alt={app.name} />
                </div>
              )}
              <div className="app-info">
                <h3>{app.name}</h3>
                {app.author && app.year && (
                  <p className="app-meta">
                    {app.author} ({app.year})
                  </p>
                )}
                <p className="app-description">{app.description}</p>
                <div className="app-badges">
                  <span className="badge">{app.loadMethod}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected App Details */}
        {selectedApp && (
          <div className="app-details">
            <h3>Selected: {selectedApp.name}</h3>
            <p>{selectedApp.description}</p>

            {error && <div className="error-message">{error}</div>}

            {loadProgress && (
              <div className="load-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(loadProgress.loaded / loadProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="progress-text">
                  Loading {loadProgress.currentFile}... ({loadProgress.loaded}/
                  {loadProgress.total})
                </p>
              </div>
            )}

            <div className="app-actions">
              <button
                className="load-button"
                onClick={handleLoadApp}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load Application"}
              </button>
              <button
                className="cancel-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
