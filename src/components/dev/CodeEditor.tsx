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

    // Register Open Watcom-specific code snippets
    monaco.languages.registerCompletionItemProvider('c', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          // Open Watcom pragmas
          {
            label: '#pragma pack',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#pragma pack(${1:1})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Set structure packing alignment (Open Watcom)',
            range,
          },
          {
            label: '#pragma aux',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#pragma aux ${1:function_name} ${2:calling_convention}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define auxiliary pragma for function calling convention (Open Watcom)',
            range,
          },
          {
            label: '#pragma intrinsic',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#pragma intrinsic(${1:function_name})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Use intrinsic function implementation (Open Watcom)',
            range,
          },
          // DOS-specific functions
          {
            label: 'int86',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'int86(${1:interrupt_number}, &${2:inregs}, &${3:outregs})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Execute DOS interrupt (requires dos.h)',
            range,
          },
          {
            label: 'int86x',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'int86x(${1:interrupt_number}, &${2:inregs}, &${3:outregs}, &${4:segregs})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Execute DOS interrupt with segment registers (requires dos.h)',
            range,
          },
          {
            label: 'bdos',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'bdos(${1:function_number}, ${2:dx_value}, ${3:al_value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Call DOS function (requires dos.h)',
            range,
          },
          // Memory models
          {
            label: '__small',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__small',
            documentation: 'Small memory model keyword (Open Watcom)',
            range,
          },
          {
            label: '__compact',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__compact',
            documentation: 'Compact memory model keyword (Open Watcom)',
            range,
          },
          {
            label: '__medium',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__medium',
            documentation: 'Medium memory model keyword (Open Watcom)',
            range,
          },
          {
            label: '__large',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__large',
            documentation: 'Large memory model keyword (Open Watcom)',
            range,
          },
          {
            label: '__huge',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__huge',
            documentation: 'Huge memory model keyword (Open Watcom)',
            range,
          },
          // Far/near pointers
          {
            label: '__far',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__far',
            documentation: 'Far pointer keyword (Open Watcom)',
            range,
          },
          {
            label: '__near',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '__near',
            documentation: 'Near pointer keyword (Open Watcom)',
            range,
          },
        ];

        return { suggestions };
      },
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

