/**
 * Test setup file for Vitest
 * Configures testing environment and global utilities
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Node 25+ ships native Web Storage globals that are undefined unless Node runs
// with --localstorage-file. They shadow jsdom's implementation, so restore it.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
for (const key of ['localStorage', 'sessionStorage'] as const) {
  if (globalThis[key] === undefined && jsdomWindow) {
    Object.defineProperty(globalThis, key, { configurable: true, value: jsdomWindow[key] });
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
