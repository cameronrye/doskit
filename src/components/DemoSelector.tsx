/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Demo Selector Component
 * Allows users to select and load different DOS applications and demos
 */

import { useState } from 'react';
import type { InitFileEntry } from '../types/js-dos';
import { loadZipArchive, type LoadProgress } from '../utils/diskLoader';
import {
  secondRealityZipUrl,
  secondRealityDosboxConf,
  secondRealityMetadata,
} from '../dos-apps/second-reality.config';
import {
  testAppFiles,
  testAppDosboxConf,
  testAppMetadata,
} from '../dos-apps/test-app.config';
import './DemoSelector.css';

export interface DosApp {
  id: string;
  name: string;
  description: string;
  author?: string;
  year?: number;
  thumbnail?: string;
  loadMethod: 'files' | 'zip' | 'disk-image';
  dosboxConf: string;
  loader: () => Promise<InitFileEntry[] | Uint8Array>;
}

interface DemoSelectorProps {
  onSelect: (app: DosApp) => void;
  onCancel?: () => void;
}

/**
 * Available DOS applications and demos
 */
const availableApps: DosApp[] = [
  {
    id: 'test-app',
    name: testAppMetadata.name,
    description: testAppMetadata.description,
    author: testAppMetadata.author,
    year: testAppMetadata.year,
    loadMethod: 'files',
    dosboxConf: testAppDosboxConf,
    loader: async () => {
      // Test app files are already in memory (no network loading needed)
      return Promise.resolve(testAppFiles);
    },
  },
  {
    id: 'second-reality',
    name: secondRealityMetadata.name,
    description: secondRealityMetadata.description,
    author: secondRealityMetadata.author,
    year: secondRealityMetadata.year,
    loadMethod: 'zip',
    dosboxConf: secondRealityDosboxConf,
    loader: async () => {
      // Load the compiled demo from Archive.org
      return loadZipArchive(secondRealityZipUrl);
    },
  },
  // Add more applications here
];

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
    setLoadProgress({ loaded: 0, total: 1, currentFile: 'Starting...' });

    try {
      // Load the application files
      await selectedApp.loader();

      // Notify parent component
      onSelect(selectedApp);
    } catch (err) {
      console.error('[DemoSelector] Error loading application:', err);
      setError(err instanceof Error ? err.message : 'Failed to load application');
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
          <button className="close-button" onClick={handleCancel} aria-label="Close">
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
              className={`app-card ${selectedApp?.id === app.id ? 'selected' : ''}`}
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
                {isLoading ? 'Loading...' : 'Load Application'}
              </button>
              <button className="cancel-button" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

