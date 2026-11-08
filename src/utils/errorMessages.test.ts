/**
 * Tests for errorMessages utility
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { getUserFriendlyError } from './errorMessages';

describe('getUserFriendlyError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Messages from the browser and from the app's own loaders
  it.each([
    ['Failed to fetch', 'Unable to connect to the server'],
    ['NetworkError when attempting to fetch resource.', 'Unable to connect to the server'],
    ['Fetch failed after retries', 'Unable to connect to the server'],
    ['Request timed out', 'The request took too long to complete'],
    ['Rate limit exceeded', 'Too many requests'],
    ['Failed to load ZIP: Not Found', 'Unable to load the application archive'],
    ['HTTP 404 Not Found', 'The requested file was not found'],
    ['Service worker registration failed', 'Application update failed'],
    ['WebAssembly is not supported in this browser', 'Emulator initialization failed'],
    ["Failed to execute 'requestFullscreen' on 'Element'", 'Fullscreen mode is not available'],
    ['Keyboard lock is not supported', 'Keyboard lock is not available'],
    ['Permission denied', 'Permission denied'],
    ['Operation aborted', 'Operation was cancelled'],
    ['Out of memory', 'Not enough memory'],
    ['HTTP 500 Internal Server Error', 'Server error'],
    ['HTTP 502 Bad Gateway', 'Server is temporarily unavailable'],
    ['HTTP 503 Service Unavailable', 'Service is temporarily unavailable'],
  ])('explains "%s" as "%s"', (technical, friendly) => {
    expect(getUserFriendlyError(new Error(technical)).message).toBe(friendly);
  });

  it('suggests what to do next', () => {
    expect(getUserFriendlyError(new Error('Failed to fetch'))).toMatchObject({
      message: 'Unable to connect to the server',
      suggestion: 'Please check your internet connection and try again.',
    });
  });

  it('explains a failed download as a connection problem, whatever the file', () => {
    const error = new Error('Failed to fetch https://doskit.net/emulators/wdosbox.wasm');

    expect(getUserFriendlyError(error).message).toBe('Unable to connect to the server');
  });

  it('accepts a bare message', () => {
    expect(getUserFriendlyError('Failed to fetch').message).toBe('Unable to connect to the server');
  });

  it('falls back to a general explanation for an unknown error', () => {
    expect(getUserFriendlyError(new Error('Something odd happened'))).toMatchObject({
      message: 'An unexpected error occurred',
      suggestion: 'Please try again. If the problem persists, try refreshing the page.',
    });
  });

  it('falls back for a promise rejected without a reason', () => {
    expect(getUserFriendlyError(undefined).message).toBe('An unexpected error occurred');
  });

  it('keeps the technical message in development', () => {
    // Vitest runs in development mode
    expect(getUserFriendlyError(new Error('Failed to fetch')).originalError).toBe(
      'Failed to fetch'
    );
    expect(getUserFriendlyError(new Error('Something odd happened')).originalError).toBe(
      'Something odd happened'
    );
  });

  it.each(['Failed to fetch', 'Something odd happened'])(
    'leaves the technical message "%s" out in production',
    (technical) => {
      vi.stubEnv('DEV', false);

      expect(getUserFriendlyError(new Error(technical)).originalError).toBeUndefined();
    }
  );
});
