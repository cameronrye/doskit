# Error Handling Strategy

**Document Version:** 2.0  
**Date:** 2026-11-07  
**Status:** Implemented

## Overview

DosKit implements a multi-layered error handling strategy to ensure a robust user experience and facilitate debugging. The system captures errors at multiple levels, shows load and start failures where they happen, keeps known harmless browser errors out of the console, and reports the rest through an error tracking interface that logs to the console.

## Architecture

### Error Handling Layers

1. **Global Error Handler** - Captures uncaught errors and unhandled promise rejections
2. **React Error Boundaries** - Catches React component errors
3. **Component-Level Error States** - Local error handling in components
4. **Error Tracking Service** - Centralized error reporting, to the console until a remote service is added
5. **User-Friendly Error Messages** - Maps technical errors to readable messages

## Components

### 1. Global Error Handler

**File:** `src/utils/globalErrorHandler.ts`

**Purpose:** Captures all uncaught errors and unhandled promise rejections at the window level.

**Features:**

- Listens for the window's `error` events
- Listens for the window's `unhandledrejection` events
- Filters out known harmless errors (fullscreen API, keyboard lock, etc.)
- Provides error context (browser info, timestamp, user action, and where an uncaught error was thrown)
- Integrates with error tracking service
- Configurable error suppression and filtering

It only sees what nothing else handled. Errors that code catches and logs with `console.error` reach the console as logged, since nothing filters `console.error`, and so do the messages of js-dos's emulator Web Worker (see [Known Console Errors](#known-console-errors)).

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

`main.tsx` calls it once, before rendering. Each call applies its options over the defaults; a second call only warns (`Already initialized`), and `cleanupGlobalErrorHandler()` removes the listeners again, as the tests do.

**Configuration Options:**

- `showUserFriendlyErrors` - In production builds, also log the user-friendly message and suggestion for each error (default: true). Nothing is shown on the page.
- `suppressHarmlessErrors` - Suppress known harmless errors (default: true)
- `errorFilter` - Custom filter function: return `false` to drop an error, which is then neither logged nor tracked. It receives the error or rejection reason, or the event's message when an uncaught error has no error object.
- `onError` - Callback when an error is captured. Uncaught errors without an error object, such as cross-origin "Script error." events, skip it.

**Harmless Errors:** An error whose message matches one of `HARMLESS_ERROR_PATTERNS` is dropped with `preventDefault()`, so the browser does not report it either. Development builds log it at debug level.

- `/exitFullscreen/i`, `/requestFullscreen/i`, `/fullscreen.*not supported/i` - Fullscreen calls without a user gesture. js-dos calls `document.exitFullscreen()` on every start and leaves the rejection unhandled.
- `/lock\(\) request could not be registered/i`, `/keyboard.*lock/i` - Keyboard lock, which js-dos requests when a player starts, without handling the promise
- `/ResizeObserver loop/i` - ResizeObserver loop errors (benign)
- `/extension context invalidated/i`, `/chrome-extension:/i` - Browser extensions

---

### 2. Error Tracking Service

**File:** `src/utils/errorTracking.ts`

**Purpose:** Abstraction layer for error tracking services (Sentry, LogRocket, etc.), so a hosted service can replace the console tracker without changes to the code that reports errors

**Features:**

- Service-agnostic interface (`ErrorTrackingService`)
- Console tracker, in development and production
- Error severity levels (DEBUG, INFO, WARNING, ERROR, FATAL)
- Error context tracking
- Breadcrumb support for user action trails
- React error boundary integration

**Usage:**

```typescript
import { initializeErrorTracking, getErrorTracker, ErrorSeverity } from './utils/errorTracking';

// Initialize (in main.tsx)
initializeErrorTracking();

// Use in code
const tracker = getErrorTracker();
tracker.captureError(error, { userAction: 'Loading app' }, ErrorSeverity.ERROR);
tracker.addBreadcrumb('User clicked load button', 'user-action');
```

`getErrorTracker()` sets up the console tracker itself if nothing has yet, and a second `initializeErrorTracking()` only warns.

**Supported Services:**

- **Console** - The only implementation: logs each error, React error and breadcrumb with an `[ErrorTracking]` prefix, and keeps nothing

**Who Reports to It:** The global error handler and ErrorBoundary. Errors that components catch themselves (see [Component-Level Error States](#5-component-level-error-states)) are logged to the console, not tracked.

**To add a remote service:**

1. Implement `ErrorTrackingService` in `errorTracking.ts`: `initialize`, `isInitialized`, `captureError`, `captureReactError` and `addBreadcrumb`
2. Create it in `initializeErrorTracking()` in place of `ConsoleErrorTracker`

Both reporters get the tracker from `getErrorTracker()`, so nothing else changes.

---

### 3. Error Boundary

**File:** `src/components/ErrorBoundary.tsx`

**Purpose:** Catches React component errors and prevents full app crashes

**Features:**

- Catches errors in React component tree: in rendering, lifecycle methods and effects. Errors in event handlers and asynchronous code go to the global error handler instead.
- Displays fallback UI with error details (dev mode)
- Integrates with error tracking service
- Provides reset functionality
- Customizable fallback UI

The default fallback says "Something went wrong" and offers Refresh Page and Try Again (which renders the children again); development builds add the error message, stack trace and component stack. `main.tsx` wraps App in one boundary and App wraps DosPlayerWithApps in another, so an error in the player area leaves the header and footer in place.

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

- Pattern matching for common errors (the first match wins)
- Provides suggestions for resolution
- Includes original error in dev mode
- Extensible error mappings: add a pattern to `ERROR_MAPPINGS`

The global error handler is its only caller: in production builds it logs the message and suggestion for each error it reports. The messages on the page come from the components themselves (see [Component-Level Error States](#5-component-level-error-states)).

**Usage:**

```typescript
import { getUserFriendlyError } from './utils/errorMessages';

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

- Network errors (failed fetch, timeout, rate limit)
- File errors (ZIP archive failed to load, file not found or 404)
- Service worker errors
- Emulator and browser feature errors (WebAssembly, fullscreen, keyboard lock)
- Permission errors (denied, not allowed)
- Cancelled operations
- Memory errors
- Server errors (500, 502, 503)

Anything else is "An unexpected error occurred".

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

```text
Error occurs (uncaught error or unhandled rejection)
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
Log user-friendly message (production builds, if enabled)
```

### 2. React Error Flow

```text
Error in React component
  ↓
Nearest Error Boundary catches
  ↓
Update state (hasError = true)
  ↓
Render fallback UI
  ↓
Log to console
  ↓
Track with error tracking service
  ↓
Add breadcrumb
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
const handleLoadApp = async (signal: AbortSignal) => {
  try {
    await loadApp(signal);
  } catch (error) {
    // Cancelled or superseded on purpose: not a failure
    if (signal.aborted) return;
    const friendly = getUserFriendlyError(error);
    setError(friendly.message);
    getErrorTracker().captureError(error instanceof Error ? error : new Error(String(error)), {
      userAction: 'Loading app',
    });
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
    zipUrl: '/demos/second-reality.zip',
  },
});
```

### 3. Use Breadcrumbs for User Actions

```typescript
tracker.addBreadcrumb('User selected app', 'user-action', { appId: 'second-reality' });
tracker.addBreadcrumb('Started loading archive', 'process', {
  zipUrl: '/demos/second-reality.zip',
});
```

### 4. Wrap Critical Components with Error Boundaries

```typescript
<ErrorBoundary>
  <DosPlayer />
</ErrorBoundary>
```

App does this for DosPlayerWithApps.

### 5. Suppress Known Harmless Errors

The global error handler automatically suppresses:

- Fullscreen API errors (require user interaction)
- Keyboard lock errors (require user interaction)
- ResizeObserver loop errors (benign)
- Browser extension errors

To suppress another, add a pattern to `HARMLESS_ERROR_PATTERNS` in `globalErrorHandler.ts`. Patterns match the messages of uncaught errors and unhandled rejections only, and a suppressed error is neither logged nor tracked, so keep them narrow.

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

The error handling modules have tests of their own next to them in `src/utils/`: `globalErrorHandler.test.ts`, `errorTracking.test.ts`, `errorMessages.test.ts`, `fetchWithRetry.test.ts` and `diskLoader.test.ts`.

## Configuration

`main.tsx` sets both up before rendering, the same way in every build:

```typescript
// main.tsx
initializeErrorTracking();
initializeGlobalErrorHandler({
  showUserFriendlyErrors: true,
  suppressHarmlessErrors: true,
});
```

What differs between builds follows `import.meta.env.DEV`:

### Development

- The logger prints every level, with timestamps, and the global handler logs each suppressed error at debug level
- ErrorBoundary's fallback shows the error message, stack trace and component stack
- `getUserFriendlyError()` returns the technical message as `originalError`
- The global handler logs no user-friendly messages

### Production

- The logger prints warnings and errors only
- The global handler logs the user-friendly message and suggestion for each error it reports
- ErrorBoundary's fallback shows only its message and buttons
- `getUserFriendlyError()` leaves `originalError` out

## Future Enhancements

1. **Remote Error Tracking** - Implement `ErrorTrackingService` for a hosted service, and report the load and start errors that components only log today
2. **User-Facing Messages** - Show the global handler's user-friendly messages on the page, such as in a toast; today it only logs them
3. **Error Recovery Strategies** - Automatic retry logic for transient errors beyond archive downloads, which `fetchWithRetry` already retries
4. **Error Analytics** - Track error frequency and patterns
5. **User Feedback** - Allow users to report errors with context
6. **Offline Error Queue** - Queue errors when offline, send when online
7. **Source Maps** - Upload the hidden source maps the build already writes (`sourcemap: 'hidden'`) to the tracking service for better stack traces
8. **Performance Monitoring** - Track performance issues alongside errors

## Conclusion

DosKit's error handling strategy provides coverage at multiple levels: errors are caught, logged and tracked, harmless ones are kept quiet, and load and start failures are shown to users where they happen. The tracking interface is ready for a production error tracking service; until one is added, its reports go to the console.
