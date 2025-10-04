/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useState, useEffect, useMemo } from 'react';
import { DosPlayer } from './components/DosPlayer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DeveloperMode, type ProgramRunConfig } from './components/dev/DeveloperMode';
import type { CommandInterface } from './types/js-dos';
import './App.css';

type AppMode = 'terminal' | 'code';

function App() {
  const [mode, setMode] = useState<AppMode>('code'); // Start in code mode for MVP
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ci, setCi] = useState<CommandInterface | null>(null);
  const [customDosboxConf, setCustomDosboxConf] = useState<string | undefined>(undefined);
  const [programExecutable, setProgramExecutable] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [isProgramRunning, setIsProgramRunning] = useState(false);

  // Memoize initFs to prevent recreation on every render
  const initFs = useMemo(() => {
    if (!programExecutable) return undefined;
    return [{
      path: `/${programExecutable.name}`,
      contents: programExecutable.data,
    }];
  }, [programExecutable]);

  const handleDosReady = (commandInterface: CommandInterface) => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS is ready!');
    }
    setIsReady(true);
    setCi(commandInterface);
  };

  const handleDosExit = () => {
    if (import.meta.env.DEV) {
      console.log('[App] DOS exited');
    }
    setIsReady(false);
    setCi(null);
  };

  const handleNetworkStatusChange = (online: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[App] Network status changed:', online ? 'online' : 'offline');
    }
    setIsOnline(online);
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setCustomDosboxConf(undefined); // Reset custom config when switching modes
    setProgramExecutable(null); // Reset program executable
    setIsProgramRunning(false); // Reset program running state
  };

  const handleRunProgram = (config: ProgramRunConfig) => {
    if (import.meta.env.DEV) {
      console.log('[App] Running program with executable:', config.executableName, 'size:', config.executable?.length || 0);
    }

    // Set up program executable
    if (config.executable && config.executableName) {
      setProgramExecutable({
        name: config.executableName,
        data: config.executable,
      });
    }

    setCustomDosboxConf(config.dosboxConf);
    setMode('terminal'); // Switch to terminal mode to show the DOS window
    setIsProgramRunning(true); // Mark that a program is running
  };

  const handleReturnToEditor = () => {
    if (import.meta.env.DEV) {
      console.log('[App] Returning to editor');
    }
    setMode('code'); // Switch back to code mode
    setIsProgramRunning(false); // Clear program running state
    setCustomDosboxConf(undefined); // Reset custom config
    setProgramExecutable(null); // Reset program executable
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app">
      {/* PWA Offline Indicator and Install Prompt */}
      <OfflineIndicator onNetworkStatusChange={handleNetworkStatusChange} />

      <header className="app-header">
        <div className="header-content">
          <img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
          <h1>DosKit</h1>
        </div>
        <div className="header-actions">
          <div className="mode-switcher">
            <button
              className={`mode-button ${mode === 'terminal' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleModeSwitch('terminal');
              }}
              title="Terminal Mode - Run DOS applications"
              disabled={isProgramRunning}
            >
              <img src="/logo.svg" alt="" style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '4px' }} />
              Terminal
            </button>
            <button
              className={`mode-button ${mode === 'code' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleModeSwitch('code');
              }}
              title="Code Mode - Create DOS applications"
              disabled={isProgramRunning}
            >
              💻 Code
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {mode === 'code' && (
          <div className="code-container">
            <DeveloperMode
              ci={ci}
              onRunProgram={handleRunProgram}
            />
          </div>
        )}
        <div className={mode === 'terminal' ? 'dos-player-visible' : 'dos-player-hidden'}>
          {/* Return to Editor button - shown when a program is running */}
          {isProgramRunning && (
            <div className="program-running-overlay">
              <button
                className="return-to-editor-button"
                onClick={handleReturnToEditor}
                title="Return to code editor"
              >
                ← Back to Editor
              </button>
              <div className="program-running-info">
                <span className="program-running-indicator">
                  <span className="running-dot"></span>
                  Program Running
                </span>
              </div>
            </div>
          )}
          <DosPlayer
            onReady={handleDosReady}
            onExit={handleDosExit}
            dosboxConf={customDosboxConf}
            initFs={initFs}
            className="dos-player"
          />
        </div>
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
