/**
 * Test setup file for Vitest
 * Configures testing environment and global utilities
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// jsdom has no ResizeObserver, which OfflineIndicator needs while it shows a notice. This
// one never reports a size; a test that needs reports stubs its own over it. It is set
// directly rather than with vi.stubGlobal, which vi.unstubAllGlobals() would undo.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
