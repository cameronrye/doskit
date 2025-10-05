/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * CompilerStatusIndicator Component
 * Shows which compiler is currently active
 */

import { useState } from 'react';
import { compilerFeatureFlags, getPreferredCompilerType } from '../../config/compiler.config';
import './CompilerStatusIndicator.css';

export interface CompilerStatusIndicatorProps {
  /** Custom CSS class */
  className?: string;
}

export const CompilerStatusIndicator: React.FC<CompilerStatusIndicatorProps> = ({
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCompiler = getPreferredCompilerType();

  const getCompilerInfo = () => {
    switch (activeCompiler) {
      case 'openwatcom':
        return {
          name: 'Open Watcom C/C++',
          version: 'v2.0',
          icon: '🔧',
          description: 'Real DOS compiler running in js-dos emulator',
          capabilities: [
            'Real C/C++ compilation',
            'DOS MZ executable generation',
            'Multiple memory models',
            'Full optimization support',
          ],
          color: '#4fc3f7',
        };
      case 'wasm':
        return {
          name: 'WebAssembly GCC',
          version: 'WASM',
          icon: '⚡',
          description: 'WebAssembly-based GCC compiler',
          capabilities: [
            'Fast compilation',
            'DOS executable generation',
            'Standard C library support',
          ],
          color: '#66bb6a',
        };
      case 'mock':
        return {
          name: 'Mock Compiler',
          version: 'Dev',
          icon: '🔨',
          description: 'Development mock compiler for testing',
          capabilities: [
            'Simulated compilation',
            'Basic executable generation',
            'Fast development iteration',
          ],
          color: '#ffa726',
        };
      default:
        return {
          name: 'No Compiler',
          version: 'N/A',
          icon: '❌',
          description: 'No compiler available',
          capabilities: [],
          color: '#ef5350',
        };
    }
  };

  const compilerInfo = getCompilerInfo();

  return (
    <div className={`compiler-status-indicator ${className}`}>
      <button
        className="compiler-status-button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderColor: compilerInfo.color }}
        title={`Active compiler: ${compilerInfo.name}`}
      >
        <span className="compiler-status-icon">{compilerInfo.icon}</span>
        <span className="compiler-status-name">{compilerInfo.name}</span>
        <span className="compiler-status-version">{compilerInfo.version}</span>
        <span className="compiler-status-toggle">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="compiler-status-details">
          <div className="compiler-status-description">
            {compilerInfo.description}
          </div>

          {compilerInfo.capabilities.length > 0 && (
            <div className="compiler-status-capabilities">
              <strong>Capabilities:</strong>
              <ul>
                {compilerInfo.capabilities.map((capability, index) => (
                  <li key={index}>{capability}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="compiler-status-flags">
            <strong>Available Compilers:</strong>
            <div className="compiler-status-flag-list">
              {compilerFeatureFlags.enableOpenWatcomCompiler && (
                <span className="compiler-status-flag compiler-status-flag-enabled">
                  ✓ Open Watcom
                </span>
              )}
              {compilerFeatureFlags.enableWasmCompiler && (
                <span className="compiler-status-flag compiler-status-flag-enabled">
                  ✓ WASM GCC
                </span>
              )}
              {compilerFeatureFlags.enableMockCompiler && (
                <span className="compiler-status-flag compiler-status-flag-enabled">
                  ✓ Mock
                </span>
              )}
            </div>
          </div>

          <div className="compiler-status-priority">
            <strong>Priority:</strong> Open Watcom &gt; WASM &gt; Mock
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilerStatusIndicator;
