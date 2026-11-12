import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
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
    // The browser tests in e2e/ are Playwright's, run with npm run test:e2e
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // The tests of the service worker read public/sw.js as a file rather than import it, so
    // `vitest related`, which the pre-commit hook runs, would find none for it: a change to
    // it runs every test instead, as a change to package.json or this file does. The path
    // is absolute, as a ** pattern matches no checkout inside a directory named with a dot.
    forceRerunTriggers: [
      ...configDefaults.forceRerunTriggers,
      fileURLToPath(new URL('public/sw.js', import.meta.url)),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // All of the app's source, so that a file no test imports counts as uncovered: without
      // an include, Vitest reports only the files the tests load.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/*.d.ts'],
      // About 3 points under the coverage measured in November 2026 (statements 97.47%,
      // branches 91.01%, functions 96.14%, lines 97.51%): room for small shifts as tests
      // change, while a real drop fails CI. Raise them as coverage grows.
      thresholds: {
        statements: 94,
        branches: 88,
        functions: 93,
        lines: 94,
      },
    },
  },
});
