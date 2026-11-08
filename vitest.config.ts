import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { versionDefines } from './vite.config.ts';

export default defineConfig({
  plugins: [react()],
  // Vitest ignores vite.config.ts when this file exists, so share the build-time versions.
  define: versionDefines,
  test: {
    globals: true,
    environment: 'jsdom',
    // Node 25+ defines its own localStorage and sessionStorage, which the jsdom environment
    // does not replace, and warns whenever localStorage is read without --localstorage-file.
    // Without them, tests get jsdom's, as on Node 24, which accepts the flag and ignores it.
    execArgv: ['--no-experimental-webstorage'],
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        'src/utils/serviceWorkerRegistration.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'public/**',
        'scripts/**',
      ],
      // About 3 points under the coverage measured in November 2026 (statements 89.19%,
      // branches 78.21%, functions 91.19%, lines 89.44%): room for small shifts as tests
      // change, while a real drop fails CI. Raise them as coverage grows.
      thresholds: {
        statements: 86,
        branches: 75,
        functions: 88,
        lines: 86,
      },
    },
  },
});
