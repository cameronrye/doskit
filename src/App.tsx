/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState } from 'react';
import { DosPlayer } from './components/DosPlayer';
import { OfflineIndicator } from './components/OfflineIndicator';
import './App.css';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleDosReady = () => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS is ready!');
    }
    setIsReady(true);
  };

  const handleDosExit = () => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS exited');
    }
    setIsReady(false);
  };

  const handleNetworkStatusChange = (online: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[App] Network status changed:', online ? 'online' : 'offline');
    }
    setIsOnline(online);
  };

  return (
    <div className="app">
      {/* PWA Offline Indicator and Install Prompt */}
      <OfflineIndicator onNetworkStatusChange={handleNetworkStatusChange} />

      <header className="app-header">
        <div className="header-content">
          <img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
          <h1>DosKit</h1>
        </div>
      </header>

      <main className="app-main">
        <DosPlayer
          onReady={handleDosReady}
          onExit={handleDosExit}
          className="dos-player"
        />
      </main>

      <footer className="app-footer">
        <div className="info">
          <div className="status-indicators">
            {/* DOS Status */}
            {isReady ? (
              <span className="status-badge ready" title="DOS emulator is ready">
                <span className="status-dot"></span>
                <span>Ready</span>
              </span>
            ) : (
              <span className="status-badge loading" title="Loading DOS emulator">
                <span className="status-dot"></span>
                <span>Loading</span>
              </span>
            )}

            {/* Network Status */}
            <span
              className={`status-badge ${isOnline ? 'online' : 'offline'}`}
              title={isOnline ? 'Connected to internet' : 'No internet connection'}
            >
              <span className="status-dot"></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>
        <div className="made-with">
          Made with <span className="heart">❤️</span> by{' '}
          <a
            href="https://rye.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cameron Rye
          </a>
        </div>
        <div className="credits">
          Powered by{' '}
          <a
            href="https://js-dos.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            js-dos v8.3.20
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
