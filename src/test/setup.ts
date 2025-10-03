/**
 * Test setup file for Vitest
 * Configures testing environment and global utilities
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.Dos for tests
global.window.Dos = undefined;

