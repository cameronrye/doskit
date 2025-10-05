/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * CompilerOptionsPanel Component
 * UI for configuring Open Watcom compiler options
 */

import { useState, useEffect } from 'react';
import type { MemoryModel } from '../../types/compiler';
import { memoryModelConfigs, optimizationPresets } from '../../config/openwatcom.config';
import './CompilerOptionsPanel.css';

export interface CompilerOptions {
  memoryModel: MemoryModel;
  optimization: string;
  warningLevel: number;
  warningsAsErrors: boolean;
  debug: boolean;
  customFlags: string[];
}

export interface CompilerOptionsPanelProps {
  /** Current compiler options */
  options: CompilerOptions;
  /** Callback when options change */
  onChange: (options: CompilerOptions) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Custom CSS class */
  className?: string;
}

const DEFAULT_OPTIONS: CompilerOptions = {
  memoryModel: 'small',
  optimization: 'balanced',
  warningLevel: 4,
  warningsAsErrors: false,
  debug: false,
  customFlags: [],
};

const STORAGE_KEY = 'doskit-compiler-options';

export const CompilerOptionsPanel: React.FC<CompilerOptionsPanelProps> = ({
  options,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Load options from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedOptions = JSON.parse(saved);
        onChange({ ...DEFAULT_OPTIONS, ...parsedOptions });
      } catch (error) {
        console.warn('Failed to load compiler options from localStorage:', error);
      }
    }
  }, [onChange]);

  // Save options to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  const handleMemoryModelChange = (model: MemoryModel) => {
    onChange({ ...options, memoryModel: model });
  };

  const handleOptimizationChange = (optimization: string) => {
    onChange({ ...options, optimization });
  };

  const handleWarningLevelChange = (level: number) => {
    onChange({ ...options, warningLevel: level });
  };

  const handleWarningsAsErrorsChange = (enabled: boolean) => {
    onChange({ ...options, warningsAsErrors: enabled });
  };

  const handleDebugChange = (enabled: boolean) => {
    onChange({ ...options, debug: enabled });
  };

  const handleCustomFlagsChange = (flags: string) => {
    const flagArray = flags.split(/\s+/).filter(f => f.trim().length > 0);
    onChange({ ...options, customFlags: flagArray });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_OPTIONS);
  };

  return (
    <div className={`compiler-options-panel ${className}`}>
      <div className="compiler-options-header">
        <button
          className="compiler-options-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          title={isExpanded ? 'Hide compiler options' : 'Show compiler options'}
        >
          <span className="compiler-options-icon">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="compiler-options-title">Compiler Options</span>
        </button>
        <button
          className="compiler-options-reset"
          onClick={resetToDefaults}
          disabled={disabled}
          title="Reset to defaults"
        >
          🔄
        </button>
      </div>

      {isExpanded && (
        <div className="compiler-options-content">
          {/* Memory Model Selector */}
          <div className="compiler-option-group">
            <label className="compiler-option-label">
              Memory Model
              <select
                className="compiler-option-select"
                value={options.memoryModel}
                onChange={(e) => handleMemoryModelChange(e.target.value as MemoryModel)}
                disabled={disabled}
              >
                {Object.entries(memoryModelConfigs).map(([model, config]) => (
                  <option key={model} value={model}>
                    {model.charAt(0).toUpperCase() + model.slice(1)} - {config.description}
                  </option>
                ))}
              </select>
            </label>
            <div className="compiler-option-info">
              Code: {memoryModelConfigs[options.memoryModel].maxCode}, 
              Data: {memoryModelConfigs[options.memoryModel].maxData}
            </div>
          </div>

          {/* Optimization Selector */}
          <div className="compiler-option-group">
            <label className="compiler-option-label">
              Optimization
              <select
                className="compiler-option-select"
                value={options.optimization}
                onChange={(e) => handleOptimizationChange(e.target.value)}
                disabled={disabled}
              >
                {Object.entries(optimizationPresets).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="compiler-option-info">
              {optimizationPresets[options.optimization]?.description}
            </div>
          </div>

          {/* Warning Level */}
          <div className="compiler-option-group">
            <label className="compiler-option-label">
              Warning Level
              <select
                className="compiler-option-select"
                value={options.warningLevel}
                onChange={(e) => handleWarningLevelChange(parseInt(e.target.value))}
                disabled={disabled}
              >
                <option value={0}>0 - No warnings</option>
                <option value={1}>1 - Severe warnings only</option>
                <option value={2}>2 - Significant warnings</option>
                <option value={3}>3 - Production warnings</option>
                <option value={4}>4 - All warnings</option>
              </select>
            </label>
          </div>

          {/* Checkboxes */}
          <div className="compiler-option-group">
            <label className="compiler-option-checkbox">
              <input
                type="checkbox"
                checked={options.warningsAsErrors}
                onChange={(e) => handleWarningsAsErrorsChange(e.target.checked)}
                disabled={disabled}
              />
              Treat warnings as errors
            </label>
          </div>

          <div className="compiler-option-group">
            <label className="compiler-option-checkbox">
              <input
                type="checkbox"
                checked={options.debug}
                onChange={(e) => handleDebugChange(e.target.checked)}
                disabled={disabled}
              />
              Include debug information
            </label>
          </div>

          {/* Custom Flags */}
          <div className="compiler-option-group">
            <label className="compiler-option-label">
              Custom Flags
              <input
                type="text"
                className="compiler-option-input"
                value={options.customFlags.join(' ')}
                onChange={(e) => handleCustomFlagsChange(e.target.value)}
                disabled={disabled}
                placeholder="e.g., -zp1 -fpc"
              />
            </label>
            <div className="compiler-option-info">
              Space-separated list of additional compiler flags
            </div>
          </div>

          {/* Current Flags Preview */}
          <div className="compiler-option-group">
            <div className="compiler-option-preview">
              <strong>Generated Flags:</strong>
              <code className="compiler-option-flags">
                {memoryModelConfigs[options.memoryModel].flag} {' '}
                {optimizationPresets[options.optimization]?.flags.join(' ')} {' '}
                -w{options.warningLevel} {' '}
                {options.warningsAsErrors ? '-we ' : ''}
                {options.debug ? '-d2 ' : ''}
                {options.customFlags.join(' ')}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilerOptionsPanel;
