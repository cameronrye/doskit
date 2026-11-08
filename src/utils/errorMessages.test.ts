/**
 * Tests for errorMessages utility
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { getUserFriendlyError } from './errorMessages';

const CONNECTION = {
  message: 'Unable to connect to the server',
  suggestion: 'Please check your internet connection and try again.',
};

describe('getUserFriendlyError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // fetch() and lazily loaded modules reject with a TypeError, worded by each browser
  it.each([
    'Failed to fetch', // Chrome and Edge, with the service worker in control or not
    'NetworkError when attempting to fetch resource.', // Firefox
    'Load failed', // Safari, and every browser on iOS
    // Safari, when the service worker could not download the file either
    'FetchEvent.respondWith received an error: TypeError: Load failed',
    'Failed to fetch dynamically imported module: https://doskit.net/assets/stars.config.js',
    'error loading dynamically imported module: https://doskit.net/assets/stars.config.js',
    'Importing a module script failed.',
  ])('explains the network failure "%s" as a connection problem', (technical) => {
    expect(getUserFriendlyError(new TypeError(technical))).toMatchObject(CONNECTION);
  });

  it('explains a failed download as a connection problem, whatever the file', () => {
    const error = new Error('Failed to fetch https://doskit.net/emulators/wdosbox.wasm');

    expect(getUserFriendlyError(error)).toMatchObject(CONNECTION);
  });

  // loadZipArchive names the status: "HTTP 404" over HTTP/2, which GitHub Pages
  // serves, and "HTTP 404 Not Found" over HTTP/1.1
  describe('a download that failed with an HTTP status', () => {
    it.each(['HTTP 404', 'HTTP 404 Not Found', 'HTTP 410'])(
      'explains "Failed to load ZIP: %s" as a missing file',
      (status) => {
        expect(getUserFriendlyError(new Error(`Failed to load ZIP: ${status}`))).toMatchObject({
          message: 'The requested file was not found',
          suggestion: 'It might have moved in an update of DosKit. Reload the page and try again.',
        });
      }
    );

    it.each(['HTTP 500', 'HTTP 502 Bad Gateway', 'HTTP 503', 'HTTP 504'])(
      'explains "Failed to load ZIP: %s" as a server problem',
      (status) => {
        expect(getUserFriendlyError(new Error(`Failed to load ZIP: ${status}`))).toMatchObject({
          message: 'The server is temporarily unavailable',
          suggestion: 'Please try again in a few minutes.',
        });
      }
    );

    it.each([
      ['HTTP 408', 'The request took too long to complete'],
      ['HTTP 429', 'Too many requests'],
      ['HTTP 403', 'Unable to load the application archive'],
    ])('explains "Failed to load ZIP: %s" as "%s"', (status, friendly) => {
      expect(getUserFriendlyError(new Error(`Failed to load ZIP: ${status}`)).message).toBe(
        friendly
      );
    });

    it('reads the status in fetchWithRetry\'s "HTTP <status> <text>" form', () => {
      expect(getUserFriendlyError(new Error('HTTP 503 Service Unavailable')).message).toBe(
        'The server is temporarily unavailable'
      );
    });

    it('reads no status out of other numbers in a message', () => {
      const error = new Error('Archive of 404 bytes ends early at offset 500');

      expect(getUserFriendlyError(error).message).toBe('An unexpected error occurred');
    });
  });

  describe('timeouts and aborts', () => {
    it.each([
      // AbortSignal.timeout() in browsers
      new DOMException('signal timed out', 'TimeoutError'),
      // Node's mentions an abort; the name still says what happened
      new DOMException('The operation was aborted due to timeout', 'TimeoutError'),
      new Error('Loading timed out after 30 seconds'),
      new Error('Request timed out'),
    ])('explains %s as a timeout', (error) => {
      expect(getUserFriendlyError(error)).toMatchObject({
        message: 'The request took too long to complete',
        suggestion: 'The connection or the server might be slow. Please try again.',
      });
    });

    it.each([
      new DOMException('The operation was aborted.', 'AbortError'),
      new DOMException('signal is aborted without reason', 'AbortError'),
      // The name tells, where the message does not
      new DOMException(
        'This request has been superseded by a subsequent lock() method call.',
        'AbortError'
      ),
      // fetchWithRetry's, aborted before a request or during a wait
      new Error('Operation aborted'),
    ])('explains %s as cancelled', (error) => {
      expect(getUserFriendlyError(error)).toMatchObject({
        message: 'Operation was cancelled',
        suggestion: 'The operation was stopped before it could complete. Please try again.',
      });
    });
  });

  // What else reaches the global error handler
  it.each([
    ['Rate limit exceeded', 'Too many requests'],
    ['Failed to load ZIP: unexpected end of data', 'Unable to load the application archive'],
    ['File not found: DEMO.EXE', 'The requested file was not found'],
    ['Service worker registration failed', 'Application update failed'],
    ['WebAssembly is not supported in this browser', 'Emulator initialization failed'],
    ["Failed to execute 'requestFullscreen' on 'Element'", 'Fullscreen mode is not available'],
    ['Keyboard lock is not supported', 'Keyboard lock is not available'],
    ['Permission denied', 'Permission denied'],
    ['Out of memory', 'Not enough memory'],
  ])('explains "%s" as "%s"', (technical, friendly) => {
    expect(getUserFriendlyError(new Error(technical)).message).toBe(friendly);
  });

  // js-dos asks for a keyboard lock at every start, and browsers grant one without a click
  // or a key press: a lock that fails, as one from a frame inside another page, has another
  // cause
  it('does not blame a failed keyboard lock on a missing user interaction', () => {
    const explained = getUserFriendlyError(
      new Error(
        "Failed to execute 'lock' on 'Keyboard': lock() must be called from a primary top-level browsing context."
      )
    );

    expect(explained.message).toBe('Keyboard lock is not available');
    expect(explained.suggestion).not.toMatch(/user interaction/i);
  });

  it('accepts a bare message', () => {
    expect(getUserFriendlyError('Failed to fetch')).toMatchObject(CONNECTION);
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

  it('falls back for a value with no string form instead of throwing', () => {
    // String() throws for an object without a prototype
    expect(getUserFriendlyError(Object.create(null)).message).toBe('An unexpected error occurred');
  });

  // The service worker stores an application's archive the first time it is opened
  // online; until then, the application cannot load offline
  describe('for an application loading while the browser is offline', () => {
    const OFFLINE = {
      message: "This application isn't available offline yet",
      suggestion:
        'Each application works offline once it has been opened while online. Connect to the internet and try again.',
    };

    it.each([
      'Failed to fetch',
      'NetworkError when attempting to fetch resource.',
      'Load failed',
      'FetchEvent.respondWith received an error: TypeError: Load failed',
    ])('explains the network failure "%s" as not stored for offline use yet', (technical) => {
      expect(getUserFriendlyError(new TypeError(technical), { online: false })).toMatchObject(
        OFFLINE
      );
    });

    it('explains other failures as it would online', () => {
      const error = new Error('Failed to load ZIP: HTTP 404');

      expect(getUserFriendlyError(error, { online: false }).message).toBe(
        'The requested file was not found'
      );
    });

    // navigator.onLine is true whenever a network interface is up, server or not
    it('takes only an offline report as offline', () => {
      expect(
        getUserFriendlyError(new TypeError('Failed to fetch'), { online: true })
      ).toMatchObject(CONNECTION);
      expect(getUserFriendlyError(new TypeError('Failed to fetch'))).toMatchObject(CONNECTION);
    });
  });

  // For a details line next to the explanation, and for bug reports
  describe('the technical message', () => {
    it('is the error message', () => {
      expect(getUserFriendlyError(new TypeError('Failed to fetch')).originalError).toBe(
        'Failed to fetch'
      );
      expect(getUserFriendlyError('Something odd happened').originalError).toBe(
        'Something odd happened'
      );
    });

    it('is kept in production builds too', () => {
      vi.stubEnv('DEV', false);

      expect(getUserFriendlyError(new Error('Failed to load ZIP: HTTP 404')).originalError).toBe(
        'Failed to load ZIP: HTTP 404'
      );
    });

    it('is left out for a value without text', () => {
      expect(getUserFriendlyError(undefined).originalError).toBeUndefined();
      expect(getUserFriendlyError(Object.create(null)).originalError).toBeUndefined();
    });
  });
});
