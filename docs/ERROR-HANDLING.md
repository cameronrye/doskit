# Error Handling Strategy

**Document Version:** 1.0  
**Date:** 2025-11-18  
**Status:** Implemented

## Overview

DosKit implements a comprehensive, multi-layered error handling strategy to ensure a robust user experience and facilitate debugging. The system captures errors at multiple levels, provides user-friendly messages, and integrates with error tracking services.

## Architecture

### Error Handling Layers

1. **Global Error Handler** - Captures uncaught errors and unhandled promise rejections
2. **React Error Boundaries** - Catches React component errors
3. **Component-Level Error States** - Local error handling in components
4. **Error Tracking Service** - Centralized error reporting and monitoring
5. **User-Friendly Error Messages** - Maps technical errors to readable messages

## Components

### 1. Global Error Handler

**File:** `src/utils/globalErrorHandler.ts`

**Purpose:** Captures all uncaught errors and unhandled promise rejections at the window level.

**Features:**

- Captures `window.onerror` events
- Captures `window.onunhandledrejection` events
- Filters out known harmless errors (fullscreen API, keyboard lock, etc.)
- Provides error context (browser info, timestamp, user action)
- Integrates with error tracking service
- Configurable error suppression and filtering

**Usage:**

```typescript
import { initializeGlobalErrorHandler } from './utils/globalErrorHandler';

initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
  onError: (error, context) => {
    // Custom error handling logic
    console.error('Error captured:', error, context);
  },
});
```

**Configuration Options:**

- `showUserFriendlyErrors` - Show user-friendly error messages (default: true)
- `suppressHarmlessErrors` - Suppress known harmless errors (default: true)
- `errorFilter` - Custom filter function to exclude specific errors
- `onError` - Callback when an error is captured

---

### 2. Error Tracking Service

**File:** `src/utils/errorTracking.ts`

**Purpose:** Abstraction layer for error tracking services (Sentry, LogRocket, etc.)

**Features:**

- Service-agnostic interface
- Console tracker for development
- Sentry tracker placeholder for production
- Error severity levels (DEBUG, INFO, WARNING, ERROR, FATAL)
- Error context tracking
- Breadcrumb support for user action trails
- React error boundary integration

**Usage:**

```typescript
import { initializeErrorTracking, getErrorTracker, ErrorSeverity } from './utils/errorTracking';

// Initialize (in main.tsx)
initializeErrorTracking('console'); // or 'sentry' with config

// Use in code
const tracker = getErrorTracker();
tracker.captureError(error, { userAction: 'Loading app' }, ErrorSeverity.ERROR);
tracker.addBreadcrumb('User clicked load button', 'user-action');
```

**Supported Services:**

- **Console** - Development/fallback (logs to console)
- **Sentry** - Production error tracking (placeholder, ready for integration)

**To integrate Sentry:**

1. Install: `npm install @sentry/react`
2. Update `SentryErrorTracker` class in `errorTracking.ts`
3. Initialize with DSN: `initializeErrorTracking('sentry', { dsn: 'YOUR_DSN' })`

---

### 3. Error Boundary

**File:** `src/components/ErrorBoundary.tsx`

**Purpose:** Catches React component errors and prevents full app crashes

**Features:**

- Catches errors in React component tree
- Displays fallback UI with error details (dev mode)
- Integrates with error tracking service
- Provides reset functionality
- Customizable fallback UI

**Usage:**

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={(error, errorInfo, reset) => (
  <div>
    <h1>Custom Error UI</h1>
    <button onClick={reset}>Try Again</button>
  </div>
)}>
  <MyComponent />
</ErrorBoundary>
```

---

### 4. User-Friendly Error Messages

**File:** `src/utils/errorMessages.ts`

**Purpose:** Maps technical errors to user-friendly messages

**Features:**

- Pattern matching for common errors
- Provides suggestions for resolution
- Includes original error in dev mode
- Extensible error mappings

**Usage:**

```typescript
import { getUserFriendlyError, formatErrorForDisplay } from './utils/errorMessages';

try {
  await fetchData();
} catch (error) {
  const friendly = getUserFriendlyError(error);
  console.error(friendly.message);
  if (friendly.suggestion) {
    console.info(friendly.suggestion);
  }
}
```

**Error Categories:**

- Network errors (fetch failed, timeout, rate limit)
- File errors (not found, invalid format, too large)
- Emulator errors (initialization, WASM, configuration)
- Browser errors (unsupported features, permissions)

---

### 5. Component-Level Error States

**Files:** `src/components/DemoSelector.tsx`, `src/components/DosPlayerWithApps.tsx`, `src/hooks/useDosEmulator.ts`, `src/utils/diskLoader.ts`

**Purpose:** Shows load and start failures where they happen

Each part that loads or starts something handles its own failures: it logs them with `console.error` and shows them in place, without passing them to the error tracker. A load the user cancelled, or that a newer navigation superseded, is aborted on purpose, and shows and logs nothing.

**DemoSelector** (apps picked in the selector):

- A failed load shows an alert under the selected app: "Network error. Please check your internet connection and try again." when the message mentions `network` or `fetch`, "Loading timed out. The server may be slow. Please try again." when it mentions `timeout`, and otherwise the error's own message
- A load still running after 30 seconds is aborted with "Loading timed out. Please check your internet connection and try again."
- Cancel Loading, Escape, closing the selector or loading another app aborts the load quietly

**DosPlayerWithApps** (apps the URL asks for: deep links, back/forward):

- A failed load shows the "Error Loading Application" overlay with the error's message. Its Try Again boots the default DOS prompt and opens the selector.
- A newer request, a pick in the selector or unmounting aborts the load and drops its result or error

**useDosEmulator and DosPlayerUI** (starting js-dos):

- Without `window.Dos`: "DOS emulator library not loaded. Please refresh the page."
- If `window.Dos()` throws: its message, which the adapter prefixes with "Failed to initialize js-dos:"
- Either shows an Error panel with a Reload Page button. A start that fails after the player unmounted is ignored, and failing to unmute audio or to stop a player is only logged.

**diskLoader and fetchWithRetry** (archive downloads):

- `fetchWithRetry` retries network failures (a `TypeError`, whatever the browser's wording) and HTTP 408, 429, 500, 502, 503 and 504 up to 3 times, waiting about 1, 2 and 4 seconds. A status that persists comes back as the response; the last network failure, or any other error, is thrown.
- `loadZipArchive` turns an error response into `Failed to load ZIP: <status text>`, logs a failure unless the caller aborted, and rethrows
- An abort rejects with `Operation aborted` before a request or during a wait, or with the browser's `AbortError` during a request

## Error Flow

### 1. Uncaught Error Flow

```
Error occurs
  ↓
Global Error Handler captures
  ↓
Check if harmless → Suppress if yes
  ↓
Apply custom filter → Suppress if filtered
  ↓
Log to console (logger)
  ↓
Track with error tracking service
  ↓
Call custom onError callback
  ↓
Show user-friendly message (if enabled)
```

### 2. React Error Flow

```
Error in React component
  ↓
Error Boundary catches
  ↓
Update state (hasError = true)
  ↓
Track with error tracking service
  ↓
Add breadcrumb
  ↓
Render fallback UI
```

### 3. Component Error Flow

```text
Error in async operation (load or start)
  ↓
Catch in try/catch or a rejection handler
  ↓
Aborted on purpose? → Drop it
  ↓
Log to console
  ↓
Set local error state (DemoSelector maps network and timeout errors)
  ↓
Display error UI
```

## Known Console Errors

**`ExitStatus`** - Every time a player stops, as on each app switch or a return to the start page, the console shows an `ExitStatus` error (`Program terminated with exit(0)`). That is js-dos stopping the emulator normally: `stop()` asks DOSBox to exit, Emscripten's `exit(0)` throws `ExitStatus`, and the asyncify loop in js-dos's emulator Web Worker passes it to `console.error` before js-dos treats exit code 0 as a clean shutdown and terminates the worker.

DosKit cannot filter it: the worker logs to a console of its own, which nothing in the page can reach, and js-dos offers no way to stop a player without `exit(0)`. `stopPlayer()` in `src/hooks/useDosEmulator.ts` notes this where the player is stopped.

## Best Practices

### 1. Always Use Try/Catch for Async Operations

```typescript
const handleLoadApp = async () => {
  try {
    await loadApp();
  } catch (error) {
    const friendly = getUserFriendlyError(error);
    setError(friendly.message);
    getErrorTracker().captureError(error, { userAction: 'Loading app' });
  }
};
```

### 2. Add Context to Errors

```typescript
tracker.captureError(error, {
  userAction: 'Loading Second Reality demo',
  component: 'DemoSelector',
  metadata: {
    appId: 'second-reality',
    fileCount: 42,
  },
});
```

### 3. Use Breadcrumbs for User Actions

```typescript
tracker.addBreadcrumb('User selected app', 'user-action', { appId: 'doom' });
tracker.addBreadcrumb('Started loading files', 'process', { fileCount: 10 });
```

### 4. Wrap Critical Components with Error Boundaries

```typescript
<ErrorBoundary>
  <DosPlayer />
</ErrorBoundary>
```

### 5. Suppress Known Harmless Errors

The global error handler automatically suppresses:

- Fullscreen API errors (require user interaction)
- Keyboard lock errors (require user interaction)
- ResizeObserver loop errors (benign)
- Browser extension errors

## Testing

### Testing Error Handling

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

test('catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
});
```

## Configuration

### Development

```typescript
// main.tsx
initializeErrorTracking('console');
initializeGlobalErrorHandler({
  showUserFriendlyErrors: false, // Show technical errors
  suppressHarmlessErrors: true,
});
```

### Production

```typescript
// main.tsx
initializeErrorTracking('sentry', {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
});

initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
});
```

## Future Enhancements

1. **Error Recovery Strategies** - Automatic retry logic for transient errors
2. **Error Analytics** - Track error frequency and patterns
3. **User Feedback** - Allow users to report errors with context
4. **Offline Error Queue** - Queue errors when offline, send when online
5. **Source Maps** - Upload source maps to Sentry for better stack traces
6. **Performance Monitoring** - Track performance issues alongside errors

## Conclusion

DosKit's error handling strategy provides comprehensive coverage at multiple levels, ensuring errors are caught, logged, tracked, and presented to users in a friendly manner. The system is extensible and ready for production error tracking integration.
