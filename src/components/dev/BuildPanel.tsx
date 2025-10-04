/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * BuildPanel Component
 * Build controls and compiler output display
 */

import { useEffect, useRef } from 'react';
import type { BuildMessage, BuildStatus } from '../../types/compiler';
import './BuildPanel.css';

export interface BuildPanelProps {
  /** Build messages to display */
  messages: BuildMessage[];
  /** Current build status */
  status: BuildStatus;
  /** Callback when Build button is clicked */
  onBuild?: () => void;
  /** Callback when Run button is clicked */
  onRun?: () => void;
  /** Callback when Clear button is clicked */
  onClear?: () => void;
  /** Whether build button is disabled */
  buildDisabled?: boolean;
  /** Whether run button is disabled */
  runDisabled?: boolean;
  /** Custom CSS class */
  className?: string;
}

export const BuildPanel: React.FC<BuildPanelProps> = ({
  messages,
  status,
  onBuild,
  onRun,
  onClear,
  buildDisabled = false,
  runDisabled = false,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = () => {
    switch (status) {
      case 'building':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '▶️';
      default:
        return '⚙️';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'building':
        return 'Building...';
      case 'success':
        return 'Build Successful';
      case 'error':
        return 'Build Failed';
      case 'running':
        return 'Running...';
      default:
        return 'Ready';
    }
  };

  const getMessageIcon = (type: BuildMessage['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`build-panel ${className}`}>
      <div className="build-panel-header">
        <div className="build-panel-status">
          <span className="build-panel-status-icon">{getStatusIcon()}</span>
          <span className="build-panel-status-text">{getStatusText()}</span>
        </div>
        <div className="build-panel-actions">
          <button
            className="build-panel-button build-button"
            onClick={onBuild}
            disabled={buildDisabled || status === 'building'}
            title="Build project (F7)"
          >
            🔨 Build
          </button>
          <button
            className="build-panel-button run-button"
            onClick={onRun}
            disabled={runDisabled || status !== 'success'}
            title="Run program (F5)"
          >
            ▶️ Run
          </button>
          <button
            className="build-panel-button clear-button"
            onClick={onClear}
            disabled={messages.length === 0}
            title="Clear output"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="build-panel-output">
        {messages.length === 0 ? (
          <div className="build-panel-empty">
            <p>No build output yet.</p>
            <p className="build-panel-hint">Click "Build" to compile your program.</p>
          </div>
        ) : (
          <div className="build-panel-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`build-message build-message-${message.type}`}
              >
                <span className="build-message-icon">
                  {getMessageIcon(message.type)}
                </span>
                <span className="build-message-time">
                  {formatTime(message.timestamp)}
                </span>
                <span className="build-message-text">{message.message}</span>
                {message.file && (
                  <span className="build-message-location">
                    {message.file}
                    {message.line && `:${message.line}`}
                    {message.column && `:${message.column}`}
                  </span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="build-panel-footer">
        <div className="build-panel-stats">
          <span className="build-panel-stat">
            Messages: {messages.length}
          </span>
          <span className="build-panel-stat">
            Errors: {messages.filter(m => m.type === 'error').length}
          </span>
          <span className="build-panel-stat">
            Warnings: {messages.filter(m => m.type === 'warning').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuildPanel;

