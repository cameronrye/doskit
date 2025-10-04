/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * CodeEditor Component
 * Monaco-based code editor for C programming
 */

import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './CodeEditor.css';

export interface CodeEditorProps {
  /** Current file name */
  fileName: string;
  /** Code content */
  value: string;
  /** Language (c, cpp, asm) */
  language?: 'c' | 'cpp' | 'asm';
  /** Callback when code changes */
  onChange?: (value: string) => void;
  /** Callback when save is triggered (Ctrl+S) */
  onSave?: () => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Custom CSS class */
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  value,
  language = 'c',
  onChange,
  onSave,
  readOnly = false,
  className = '',
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add save command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave();
      }
    });

    // Focus editor
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div className={`code-editor ${className}`}>
      <div className="code-editor-header">
        <div className="code-editor-file-info">
          <span className="code-editor-file-icon">📄</span>
          <span className="code-editor-file-name">{fileName}</span>
          <span className="code-editor-language-badge">{language.toUpperCase()}</span>
        </div>
        <div className="code-editor-actions">
          <span className="code-editor-hint">Press Ctrl+S to save</span>
        </div>
      </div>
      <div className="code-editor-container">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace",
            lineNumbers: 'on',
            rulers: [80],
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            readOnly,
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;

