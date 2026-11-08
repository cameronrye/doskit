/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Error Message Mapping Utility
 * Maps technical errors to user-friendly messages
 */

/** A technical error, explained for users */
export interface FriendlyError {
  /** What went wrong */
  message: string;
  /** What to do about it */
  suggestion?: string;
  /** The technical message, for a details line and bug reports; absent if it has none */
  originalError?: string;
}

export interface FriendlyErrorOptions {
  /**
   * navigator.onLine when an application failed to load. Only false changes the
   * explanation: online only means that a network interface is up.
   */
  online?: boolean;
}

type Explanation = Omit<FriendlyError, 'originalError'>;

interface ErrorMapping extends Explanation {
  pattern: RegExp;
}

const CONNECTION_FAILED: Explanation = {
  message: 'Unable to connect to the server',
  suggestion: 'Please check your internet connection and try again.',
};

// The service worker stores an application's archive the first time it is opened
// online, and the application works offline from then on
const NOT_AVAILABLE_OFFLINE: Explanation = {
  message: "This application isn't available offline yet",
  suggestion:
    'Each application works offline once it has been opened while online. Connect to the internet and try again.',
};

const TIMED_OUT: Explanation = {
  message: 'The request took too long to complete',
  suggestion: 'The connection or the server might be slow. Please try again.',
};

const CANCELLED: Explanation = {
  message: 'Operation was cancelled',
  suggestion: 'The operation was stopped before it could complete. Please try again.',
};

const NOT_FOUND: Explanation = {
  message: 'The requested file was not found',
  suggestion: 'It might have moved in an update of DosKit. Reload the page and try again.',
};

const SERVER_UNAVAILABLE: Explanation = {
  message: 'The server is temporarily unavailable',
  suggestion: 'Please try again in a few minutes.',
};

const TOO_MANY_REQUESTS: Explanation = {
  message: 'Too many requests',
  suggestion: 'Please wait a few minutes before trying again.',
};

const UNEXPECTED: Explanation = {
  message: 'An unexpected error occurred',
  suggestion: 'Please try again. If the problem persists, try refreshing the page.',
};

/**
 * How browsers word a network failure. fetch() and lazily loaded modules reject with a
 * TypeError, but so do bugs, so the message decides.
 */
const NETWORK_FAILURES = [
  // Chrome and Edge, also as "Failed to fetch dynamically imported module: <url>"
  /failed to fetch/i,
  // Firefox: "NetworkError when attempting to fetch resource."
  /network ?error/i,
  // Safari, and every browser on iOS. When the service worker cannot download a file
  // either, Safari passes its failure on: "FetchEvent.respondWith received an error:
  // TypeError: Load failed".
  /\bload failed\b/i,
  // Firefox and Safari, for a lazily loaded module
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  // fetchWithRetry's own, should every attempt fail without an error
  /fetch failed/i,
];

/**
 * The status in the message of a download that failed with one: loadZipArchive's
 * "Failed to load ZIP: HTTP 404" (with the status text over HTTP/1.1) and the
 * "HTTP 503 Service Unavailable" errors fetchWithRetry hands to onRetry
 */
const HTTP_STATUS = /\bHTTP ([1-5]\d\d)\b/;

/**
 * Explain an HTTP status, if it says more than that the download failed
 * @param status - HTTP status code
 * @returns The explanation, or undefined
 */
function explainStatus(status: number): Explanation | undefined {
  if (status === 404 || status === 410) return NOT_FOUND;
  if (status === 408) return TIMED_OUT;
  if (status === 429) return TOO_MANY_REQUESTS;
  if (status >= 500) return SERVER_UNAVAILABLE;
  return undefined;
}

/**
 * Errors explained by their message alone; the first match wins
 */
const ERROR_MAPPINGS: ErrorMapping[] = [
  { pattern: /rate limit/i, ...TOO_MANY_REQUESTS },

  // File loading errors
  {
    pattern: /failed to load.*zip/i,
    message: 'Unable to load the application archive',
    suggestion: 'The file might be corrupted or unavailable. Please try a different application.',
  },
  { pattern: /file.*not found/i, ...NOT_FOUND },

  // Service Worker errors
  {
    pattern: /service worker/i,
    message: 'Application update failed',
    suggestion: 'Please refresh the page to try again.',
  },

  // js-dos / Emulator errors
  {
    pattern: /wasm|webassembly/i,
    message: 'Emulator initialization failed',
    suggestion:
      'Your browser might not support WebAssembly. Please try a modern browser like Chrome, Firefox, or Edge.',
  },
  {
    pattern: /fullscreen/i,
    message: 'Fullscreen mode is not available',
    suggestion: 'Fullscreen requires user interaction. Please click the fullscreen button.',
  },
  {
    pattern: /keyboard.*lock/i,
    message: 'Keyboard lock is not available',
    suggestion:
      'DOS programs still get every key but the shortcuts your browser keeps for itself, such as the one that closes the tab.',
  },

  // Permission errors
  {
    pattern: /permission.*denied|not allowed/i,
    message: 'Permission denied',
    suggestion: 'Please grant the necessary permissions and try again.',
  },

  // Memory errors
  {
    pattern: /out of memory|memory.*exceeded/i,
    message: 'Not enough memory',
    suggestion: 'Please close other tabs or applications and try again.',
  },
];

/**
 * Get the message of an error, or the text of any other value
 * @returns The text, or '' for no value or one with no string form, such as an object
 *   without a prototype, for which String() throws
 */
function errorText(error: unknown): string {
  if (error == null) return '';
  try {
    return typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
  } catch {
    return '';
  }
}

/**
 * Get the name of an error, such as a DOMException's "AbortError"
 * @returns The name, or '' for a value without one
 */
function errorName(error: unknown): string {
  try {
    return typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';
  } catch {
    return '';
  }
}

/**
 * Explain an error by its name and message
 */
function explain(name: string, text: string, online: boolean | undefined): Explanation {
  // A cancelled request is an AbortError, whose message need not say so: Chromium's
  // "This request has been superseded by a subsequent lock() method call."
  if (name === 'AbortError') return CANCELLED;

  if (NETWORK_FAILURES.some((pattern) => pattern.test(text))) {
    return online === false ? NOT_AVAILABLE_OFFLINE : CONNECTION_FAILED;
  }
  // Timeouts before aborts: the TimeoutError of AbortSignal.timeout() reads "signal
  // timed out" in browsers, but "The operation was aborted due to timeout" in Node
  if (/time ?out|timed out/i.test(text)) return TIMED_OUT;
  if (/abort|cancell?ed/i.test(text)) return CANCELLED;

  const status = HTTP_STATUS.exec(text);
  const byStatus = status ? explainStatus(Number(status[1])) : undefined;
  if (byStatus) return byStatus;

  return ERROR_MAPPINGS.find((mapping) => mapping.pattern.test(text)) ?? UNEXPECTED;
}

/**
 * Get user-friendly error message from technical error
 * @param error - The error object or message; can be anything, including undefined
 * @param options - For an application that failed to load: whether the browser was online
 * @returns User-friendly error message with optional suggestion, and the technical message
 */
export function getUserFriendlyError(
  error: unknown,
  { online }: FriendlyErrorOptions = {}
): FriendlyError {
  const text = errorText(error);
  const { message, suggestion } = explain(errorName(error), text, online);
  return { message, suggestion, originalError: text || undefined };
}
