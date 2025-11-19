/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Error Message Mapping Utility
 * Maps technical errors to user-friendly messages
 */

export interface ErrorMapping {
  pattern: RegExp | string;
  message: string;
  suggestion?: string;
}

/**
 * Common error patterns and their user-friendly messages
 */
const ERROR_MAPPINGS: ErrorMapping[] = [
  // Network errors
  {
    pattern: /fetch.*failed|network.*error|failed to fetch/i,
    message: "Unable to connect to the server",
    suggestion: "Please check your internet connection and try again.",
  },
  {
    pattern: /timeout|timed out/i,
    message: "The request took too long to complete",
    suggestion:
      "The server might be slow or unavailable. Please try again later.",
  },
  {
    pattern: /rate limit/i,
    message: "Too many requests",
    suggestion: "Please wait a few minutes before trying again.",
  },

  // File loading errors
  {
    pattern: /failed to load.*zip/i,
    message: "Unable to load the application archive",
    suggestion:
      "The file might be corrupted or unavailable. Please try a different application.",
  },
  {
    pattern: /failed to load.*disk image/i,
    message: "Unable to load the disk image",
    suggestion:
      "The disk image file might be corrupted or in an unsupported format.",
  },
  {
    pattern: /file.*not found|404/i,
    message: "The requested file was not found",
    suggestion:
      "The file might have been moved or deleted. Please try a different application.",
  },

  // GitHub API errors
  {
    pattern: /github api/i,
    message: "Unable to access GitHub",
    suggestion:
      "GitHub might be temporarily unavailable. Please try again later.",
  },

  // Service Worker errors
  {
    pattern: /service worker/i,
    message: "Application update failed",
    suggestion: "Please refresh the page to try again.",
  },

  // js-dos / Emulator errors
  {
    pattern: /wasm|webassembly/i,
    message: "Emulator initialization failed",
    suggestion:
      "Your browser might not support WebAssembly. Please try a modern browser like Chrome, Firefox, or Edge.",
  },
  {
    pattern: /fullscreen/i,
    message: "Fullscreen mode is not available",
    suggestion:
      "Fullscreen requires user interaction. Please click the fullscreen button.",
  },
  {
    pattern: /keyboard.*lock/i,
    message: "Keyboard lock is not available",
    suggestion:
      "This feature requires user interaction and might not be supported in your browser.",
  },

  // Permission errors
  {
    pattern: /permission.*denied|not allowed/i,
    message: "Permission denied",
    suggestion: "Please grant the necessary permissions and try again.",
  },

  // Abort errors
  {
    pattern: /abort|cancelled/i,
    message: "Operation was cancelled",
    suggestion: "The operation was stopped before it could complete.",
  },

  // Memory errors
  {
    pattern: /out of memory|memory.*exceeded/i,
    message: "Not enough memory",
    suggestion: "Please close other tabs or applications and try again.",
  },

  // Generic HTTP errors
  {
    pattern: /500|internal server error/i,
    message: "Server error",
    suggestion: "The server encountered an error. Please try again later.",
  },
  {
    pattern: /502|bad gateway/i,
    message: "Server is temporarily unavailable",
    suggestion: "Please try again in a few minutes.",
  },
  {
    pattern: /503|service unavailable/i,
    message: "Service is temporarily unavailable",
    suggestion:
      "The service is undergoing maintenance. Please try again later.",
  },
];

/**
 * Get user-friendly error message from technical error
 * @param error - The error object or message
 * @returns User-friendly error message with optional suggestion
 */
export function getUserFriendlyError(error: unknown): {
  message: string;
  suggestion?: string;
  originalError?: string;
} {
  // Extract error message
  let errorMessage = "";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = String(error);
  }

  // Try to match against known patterns
  for (const mapping of ERROR_MAPPINGS) {
    const pattern =
      mapping.pattern instanceof RegExp
        ? mapping.pattern
        : new RegExp(mapping.pattern, "i");

    if (pattern.test(errorMessage)) {
      return {
        message: mapping.message,
        suggestion: mapping.suggestion,
        originalError: import.meta.env.DEV ? errorMessage : undefined,
      };
    }
  }

  // Default fallback message
  return {
    message: "An unexpected error occurred",
    suggestion:
      "Please try again. If the problem persists, try refreshing the page.",
    originalError: import.meta.env.DEV ? errorMessage : undefined,
  };
}

/**
 * Format error for display
 * @param error - The error object or message
 * @returns Formatted error string
 */
export function formatErrorForDisplay(error: unknown): string {
  const { message, suggestion, originalError } = getUserFriendlyError(error);

  let formatted = message;
  if (suggestion) {
    formatted += `\n\n${suggestion}`;
  }
  if (originalError && import.meta.env.DEV) {
    formatted += `\n\nTechnical details: ${originalError}`;
  }

  return formatted;
}
