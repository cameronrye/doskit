/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState } from 'react';
import { DosPlayer } from './components/DosPlayer';
import './App.css';

function App() {
  const [isReady, setIsReady] = useState(false);

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
          <div className="header-text">
            <h1>DosKit</h1>
            <p className="subtitle">Cross-Platform DOS Emulator</p>
          </div>
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
          {isReady ? (
            <>
              <span className="status-badge ready">● Ready</span>
              <span className="info-text">
                DOS prompt is active. Type commands to interact.
              </span>
            </>
          ) : (
            <>
              <span className="status-badge loading">○ Loading</span>
              <span className="info-text">Initializing DOS environment...</span>
            </>
          )}
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
