/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Fetch with Retry Utility
 * Implements exponential backoff retry logic for network requests
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;

  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;

  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;

  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatusCodes?: number[];

  /** Callback function called before each retry */
  onRetry?: (attempt: number, error: Error, delay: number) => void;

  /** AbortSignal to cancel the operation */
  signal?: AbortSignal;
}

const DEFAULT_RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Delay execution for a specified number of milliseconds
 * Supports cancellation via AbortSignal
 * @param ms - Number of milliseconds to delay
 * @param signal - Optional AbortSignal to cancel the delay
 * @returns Promise that resolves after the delay
 * @throws Error if the operation is aborted
 * @private
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Operation aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          reject(new Error('Operation aborted'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Calculate delay for next retry using exponential backoff with jitter
 * Adds random jitter to prevent thundering herd problem
 * @param attempt - Current retry attempt number (0-based)
 * @param initialDelay - Initial delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param backoffMultiplier - Multiplier for exponential backoff
 * @returns Calculated delay in milliseconds, capped at maxDelay
 * @private
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
  // Add jitter (random variation) to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Whether the browser reports having no connection. Only an offline report can be
 * trusted: online only means that a network interface is up, not that the server can
 * be reached.
 * @returns true if navigator.onLine is false
 * @private
 */
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Determine if an error is retryable based on error type and status code
 * @param error - The error to check
 * @param retryableStatusCodes - Array of HTTP status codes that should trigger a retry
 * @returns true if the error is retryable, false otherwise
 * @private
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
  // fetch() rejects with a TypeError on network failure. The message varies by
  // browser ("Failed to fetch", "NetworkError ...", WebKit's "Load failed").
  // Offline, such as for an archive the service worker has not stored, every retry
  // would fail the same way.
  if (error instanceof TypeError) {
    return !isOffline();
  }

  // Check if it's a Response with a retryable status code
  if (error instanceof Response) {
    return retryableStatusCodes.includes(error.status);
  }

  return false;
}

/**
 * Fetch with automatic retry and exponential backoff
 *
 * Retries network errors and the retryable status codes. A network error while the
 * browser reports being offline is thrown at once.
 *
 * @param input - URL or Request object
 * @param init - Fetch options
 * @param options - Retry options
 * @returns Promise that resolves to Response
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'GET',
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 *   onRetry: (attempt, error, delay) => {
 *     console.log(`Retry attempt ${attempt} after ${delay}ms due to:`, error);
 *   }
 * });
 * ```
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
    onRetry,
    signal,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if operation was aborted
      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      // Merge signal from options with init
      const fetchInit: RequestInit = {
        ...init,
        signal: signal || init?.signal,
      };

      const response = await fetch(input, fetchInit);

      // Retry retryable statuses; on the last attempt hand the response back so
      // callers can report it via response.ok / statusText like any other HTTP error.
      if (!response.ok && retryableStatusCodes.includes(response.status) && attempt < maxRetries) {
        throw response;
      }

      return response;
    } catch (error) {
      if (error instanceof Response) {
        lastError = new Error(`HTTP ${error.status} ${error.statusText}`.trim());
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, retryableStatusCodes)) {
        throw lastError;
      }

      // Calculate delay for next retry
      const retryDelay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError, retryDelay);
      }

      // Wait before retrying
      await delay(retryDelay, signal);
    }
  }

  // All retries exhausted
  throw lastError || new Error('Fetch failed after retries');
}
