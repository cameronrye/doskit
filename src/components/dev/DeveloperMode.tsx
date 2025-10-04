/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * CodeMode Component
 * Main component for DOS application development
 */

import { useState, useEffect, useCallback } from 'react';
import type { CommandInterface } from '../../types/js-dos';
import { CodeEditor } from './CodeEditor';
import { BuildPanel } from './BuildPanel';
import { useDosFileSystem } from '../../hooks/useDosFileSystem';
import { useDosCompiler } from '../../hooks/useDosCompiler';
import { projectTemplates } from '../../config/compiler.config';
import './DeveloperMode.css';

export interface ProgramRunConfig {
  dosboxConf: string;
  executable?: Uint8Array;
  executableName?: string;
}

export interface CodeModeProps {
  /** Command Interface from js-dos */
  ci: CommandInterface | null;
  /** Callback when user wants to run the compiled program */
  onRunProgram?: (config: ProgramRunConfig) => void;
  /** Custom CSS class */
  className?: string;
}

export const CodeMode: React.FC<CodeModeProps> = ({
  ci,
  onRunProgram,
  className = '',
}) => {
  const [currentFile, setCurrentFile] = useState('hello.c');
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { writeTextFile } = useDosFileSystem(ci);
  const { compile, buildMessages, clearBuildMessages, buildStatus, lastResult } = useDosCompiler(ci);

  // Load Hello World template on mount
  useEffect(() => {
    const template = projectTemplates['hello-world'];
    if (template && template.files.length > 0) {
      setCode(template.files[0].content);
      setCurrentFile(template.files[0].name);
    }
  }, []);

  // Initialize project directory when CI is ready
  useEffect(() => {
    if (ci) {
      initializeProject();
    }
  }, [ci]);

  const initializeProject = async () => {
    if (!ci) return;

    try {
      // Write initial template file to filesystem
      const template = projectTemplates['hello-world'];
      if (template && template.files.length > 0) {
        await writeTextFile(`/C/PROJECT/${template.files[0].name}`, template.files[0].content);
        console.log('[CodeMode] Project initialized with Hello World template');
      }
    } catch (error) {
      console.error('[CodeMode] Failed to initialize project:', error);
    }
  };

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleSave = useCallback(async () => {
    if (!ci) {
      console.error('[CodeMode] Cannot save: CommandInterface not ready');
      return;
    }

    setIsSaving(true);
    try {
      await writeTextFile(`/C/PROJECT/${currentFile}`, code);
      setLastSaved(new Date());
      console.log('[CodeMode] File saved:', currentFile);
    } catch (error) {
      console.error('[CodeMode] Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [ci, currentFile, code, writeTextFile]);

  const handleBuild = useCallback(async () => {
    if (!ci) {
      console.error('[CodeMode] Cannot build: CommandInterface not ready');
      return;
    }

    // Save file before building
    await handleSave();

    // Clear previous build messages
    clearBuildMessages();

    // Compile
    const outputFile = currentFile.replace(/\.(c|cpp)$/, '.exe');
    console.log('[CodeMode] Building:', currentFile, '->', outputFile);

    try {
      const result = await compile(currentFile, outputFile);
      console.log('[CodeMode] Build result:', result);
    } catch (error) {
      console.error('[CodeMode] Build failed:', error);
    }
  }, [ci, currentFile, handleSave, compile, clearBuildMessages]);

  const handleRun = useCallback(() => {
    if (!lastResult || !lastResult.success || !lastResult.executable) {
      console.error('[CodeMode] Cannot run: No successful build or no executable');
      return;
    }

    // Use .COM extension instead of .EXE for simpler format
    const outputFile = lastResult.outputFile.replace(/\.exe$/i, '.com');

    // Create DOSBox configuration to run the program
    // Note: We must restart DOSBox with the executable in initFs
    // because js-dos doesn't support dynamic command execution
    const dosboxConf = `
[cpu]
core=auto
cputype=auto
cycles=max

[autoexec]
@echo off
mount c .
c:
${outputFile}
echo.
echo Program finished. Press any key to return to editor...
pause > nul
`;

    if (onRunProgram) {
      onRunProgram({
        dosboxConf,
        executable: lastResult.executable,
        executableName: outputFile,
      });
    }
  }, [lastResult, onRunProgram]);

  const handleClear = useCallback(() => {
    clearBuildMessages();
  }, [clearBuildMessages]);

  const getLanguage = (fileName: string): 'c' | 'cpp' | 'asm' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'cpp' || ext === 'cxx') return 'cpp';
    if (ext === 'asm' || ext === 's') return 'asm';
    return 'c';
  };

  return (
    <div className={`code-mode ${className}`}>
      <div className="code-mode-header">
        <div className="code-mode-title">
          <span className="code-mode-icon">💻</span>
          <h2>DOS Code Environment</h2>
        </div>
        <div className="code-mode-info">
          {isSaving && <span className="code-mode-status">Saving...</span>}
          {lastSaved && !isSaving && (
            <span className="code-mode-status">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!ci && (
            <span className="code-mode-warning">
              ⚠️ Waiting for DOS emulator...
            </span>
          )}
        </div>
      </div>

      <div className="code-mode-content">
        <div className="code-mode-editor">
          <CodeEditor
            fileName={currentFile}
            value={code}
            language={getLanguage(currentFile)}
            onChange={handleCodeChange}
            onSave={handleSave}
            readOnly={!ci}
          />
        </div>

        <div className="code-mode-build">
          <BuildPanel
            messages={buildMessages}
            status={buildStatus}
            onBuild={handleBuild}
            onRun={handleRun}
            onClear={handleClear}
            buildDisabled={!ci}
            runDisabled={!ci || buildStatus !== 'success'}
          />
        </div>
      </div>

      <div className="code-mode-footer">
        <div className="code-mode-tips">
          <span className="code-mode-tip">
            💡 <strong>Tip:</strong> Press Ctrl+S to save, F7 to build, F5 to run
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeMode;

// Keep DeveloperMode as an alias for backwards compatibility
export { CodeMode as DeveloperMode };

