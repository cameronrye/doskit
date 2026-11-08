import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      // Static files and the js-dos copy from copy-js-dos.js; the service worker is ours.
      // public/** would ignore the directory itself, and nothing inside it could be unignored.
      'public/**/*',
      '!public/sw.js',
      'node_modules/**',
      'docs/api/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // With verbatimModuleSyntax, import { type X } still emits import 'module'
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    // Registered as a classic script, not a module, so its top-level names are worker globals
    files: ['public/sw.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.serviceworker,
    },
  },
  {
    // ES modules, which have no require, module, exports, __dirname or __filename
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    // vitest.config.ts sets globals: true
    files: ['scripts/**/*.test.js'],
    languageOptions: {
      globals: globals.vitest,
    },
  },
  {
    // ESLint 10 added preserve-caught-error to its recommended rules, after this rethrow
    // was written: a warning until the error it throws carries the caught one as its cause
    files: ['src/adapters/EmulatorAdapter.ts'],
    rules: {
      'preserve-caught-error': 'warn',
    },
  },
  {
    // react-hooks 7.1 finds setState calls in effects that 7.0 missed, here: warnings until
    // these effects change, while the rule stays an error everywhere else
    files: [
      'src/components/DosPlayerWithApps.tsx',
      'src/components/OfflineIndicator.tsx',
      'src/hooks/useDosEmulator.ts',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
);
