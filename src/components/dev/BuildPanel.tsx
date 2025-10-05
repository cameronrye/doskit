/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * BuildPanel Component
 * Build controls and compiler output display
 */

import { useEffect, useRef, useState } from 'react';
import type { BuildMessage, BuildStatus, CompileResult } from '../../types/compiler';
import { enhanceErrorMessage } from '../../utils/errorMessages';
import { OpenWatcomErrorParser, type ParsedMessage } from '../../services/OpenWatcomErrorParser';
import './BuildPanel.css';

export interface BuildPanelProps {
  /** Build messages to display */
  messages: BuildMessage[];
  /** Current build status */
  status: BuildStatus;
  /** Last compilation result (for statistics) */
  lastResult?: CompileResult | null;
  /** Compiler type being used */
  compilerType?: 'wasm' | 'mock' | 'openwatcom' | 'none';
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
  lastResult,
  compilerType = 'none',
  onBuild,
  onRun,
  onClear,
  buildDisabled = false,
  runDisabled = false,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMessageExpansion = (index: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCompilerLabel = () => {
    switch (compilerType) {
      case 'wasm':
        return '🔧 WebAssembly GCC';
      case 'mock':
        return '🔧 Mock Compiler';
      case 'openwatcom':
        return '🔧 Open Watcom C/C++';
      default:
        return '🔧 No Compiler';
    }
  };

  /**
   * Parse Open Watcom error message and create clickable file link
   */
  const parseOpenWatcomMessage = (message: string): {
    parsedMessage?: ParsedMessage;
    displayText: string;
    hasFileLink: boolean;
  } => {
    if (compilerType !== 'openwatcom') {
      return { displayText: message, hasFileLink: false };
    }

    // Try to parse as Open Watcom error/warning
    const parseResult = OpenWatcomErrorParser.parse(message);
    const parsed = parseResult.errors[0] || parseResult.warnings[0];
    if (parsed) {
      const displayText = `Line ${parsed.line}: ${parsed.message} (${parsed.code})`;
      return {
        parsedMessage: parsed,
        displayText,
        hasFileLink: true,
      };
    }

    return { displayText: message, hasFileLink: false };
  };

  /**
   * Handle clicking on a file link in error message
   */
  const handleFileClick = (file: string, line: number) => {
    // TODO: Implement file navigation when CodeEditor supports it
    console.log(`Navigate to ${file}:${line}`);
  };

  return (
    <div className={`build-panel ${className}`}>
      <div className="build-panel-header">
        <div className="build-panel-status">
          <span className="build-panel-status-icon">{getStatusIcon()}</span>
          <span className="build-panel-status-text">{getStatusText()}</span>
          {status === 'building' && (
            <span className="build-panel-spinner"></span>
          )}
        </div>
        <div className="build-panel-compiler">
          <span className="build-panel-compiler-label">{getCompilerLabel()}</span>
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
            {messages.map((message, index) => {
              const enhanced = (message.type === 'error' || message.type === 'warning')
                ? enhanceErrorMessage(message.message)
                : null;
              const isExpanded = expandedMessages.has(index);
              const hasEnhancement = enhanced && (enhanced.explanation || enhanced.suggestion);

              // Parse Open Watcom message format
              const openWatcomParsed = parseOpenWatcomMessage(message.message);

              return (
                <div
                  key={index}
                  className={`build-message build-message-${message.type} ${hasEnhancement ? 'build-message-expandable' : ''}`}
                >
                  <span className="build-message-icon">
                    {getMessageIcon(message.type)}
                  </span>
                  <span className="build-message-time">
                    {formatTime(message.timestamp)}
                  </span>
                  <div className="build-message-content">
                    <div className="build-message-text">
                      {openWatcomParsed.hasFileLink && openWatcomParsed.parsedMessage ? (
                        <>
                          <button
                            className="build-message-file-link"
                            onClick={() => handleFileClick(
                              openWatcomParsed.parsedMessage!.file,
                              openWatcomParsed.parsedMessage!.line
                            )}
                            title={`Go to ${openWatcomParsed.parsedMessage.file}:${openWatcomParsed.parsedMessage.line}`}
                          >
                            📄 {openWatcomParsed.parsedMessage.file}:{openWatcomParsed.parsedMessage.line}
                          </button>
                          <span className="build-message-error-code">
                            {openWatcomParsed.parsedMessage.code}
                          </span>
                          <span className="build-message-description">
                            {openWatcomParsed.parsedMessage.message}
                          </span>
                        </>
                      ) : (
                        <>
                          {openWatcomParsed.displayText}
                          {message.file && (
                            <span className="build-message-location">
                              {' '}({message.file}
                              {message.line && `:${message.line}`}
                              {message.column && `:${message.column}`})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {hasEnhancement && (
                      <button
                        className="build-message-expand-btn"
                        onClick={() => toggleMessageExpansion(index)}
                        title={isExpanded ? 'Hide help' : 'Show help'}
                      >
                        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'} help
                      </button>
                    )}
                    {hasEnhancement && isExpanded && (
                      <div className="build-message-enhancement">
                        {enhanced.explanation && (
                          <div className="build-message-explanation">
                            💡 {enhanced.explanation}
                          </div>
                        )}
                        {enhanced.suggestion && (
                          <div className="build-message-suggestion">
                            ✨ Suggestion: {enhanced.suggestion}
                          </div>
                        )}
                        {enhanced.docLink && (
                          <div className="build-message-doclink">
                            📚 <a href={enhanced.docLink} target="_blank" rel="noopener noreferrer">
                              Learn more
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
          {lastResult && lastResult.compilationTime !== undefined && (
            <span className="build-panel-stat">
              ⏱️ {lastResult.compilationTime}ms
            </span>
          )}
          {lastResult && lastResult.executable && (
            <span className="build-panel-stat">
              📦 {formatBytes(lastResult.executable.length)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildPanel;

