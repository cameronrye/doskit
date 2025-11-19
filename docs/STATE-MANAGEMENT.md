# State Management Guide

**Document Version:** 1.0  
**Date:** 2025-11-18  
**Status:** Implemented

## Overview

DosKit uses React Context API for global state management. The state is organized into three separate contexts, each managing a specific domain of the application:

1. **AppStateContext** - Application selection and emulator status
2. **NetworkContext** - Network connectivity status
3. **PWAContext** - Progressive Web App features (install, updates)

## Architecture

### Why Context API?

We chose React Context API over external state management libraries (like Zustand or Redux) for the following reasons:

- **No additional dependencies** - Uses built-in React features
- **Appropriate scale** - Sufficient for DosKit's state management needs
- **Better React integration** - Works seamlessly with React DevTools
- **Simpler testing** - Easier to mock and test
- **Type safety** - Full TypeScript support out of the box

### Context Separation

Each context manages a distinct domain to:

- Prevent unnecessary re-renders
- Improve code organization
- Make testing easier
- Allow independent updates

## Contexts

### 1. AppStateContext

**Purpose:** Manages application selection and emulator status

**State:**

```typescript
interface AppState {
  currentApp: DosApp | null; // Currently selected DOS application
  showAppSelector: boolean; // Whether app selector is visible
  isEmulatorReady: boolean; // Whether DOS emulator is ready
  isLoadingApp: boolean; // Whether an app is loading
  error: string | null; // Current error message
}
```

**Usage:**

```typescript
import { useAppState, useAppStateValue, useAppStateActions } from "@/contexts";

// Get full context (state + actions)
const { currentApp, setCurrentApp } = useAppState();

// Get only state (read-only)
const { currentApp, isEmulatorReady } = useAppStateValue();

// Get only actions
const { setCurrentApp, setEmulatorReady } = useAppStateActions();
```

**When to use:**

- Components that need to know which app is selected
- Components that control app selection
- Components that display emulator status
- Components that handle loading states

---

### 2. NetworkContext

**Purpose:** Manages network connectivity status

**State:**

```typescript
interface NetworkState {
  isOnline: boolean; // Whether browser is online
  showOfflineMessage: boolean; // Whether to show offline message
}
```

**Usage:**

```typescript
import { useNetwork, useNetworkState, useNetworkActions } from "@/contexts";

// Get full context
const { isOnline, setShowOfflineMessage } = useNetwork();

// Get only state
const { isOnline } = useNetworkState();

// Get only actions
const { setShowOfflineMessage } = useNetworkActions();
```

**Features:**

- Automatically listens to browser `online`/`offline` events
- Updates state when network status changes
- Provides manual control over offline message visibility

**When to use:**

- Components that need to display network status
- Components that behave differently when offline
- Components that show offline indicators

---

### 3. PWAContext

**Purpose:** Manages Progressive Web App features

**State:**

```typescript
interface PWAState {
  deferredPrompt: BeforeInstallPromptEvent | null; // Install prompt event
  showInstallPrompt: boolean; // Show install UI
  isInstalled: boolean; // App is installed
  updateRegistration: ServiceWorkerRegistration | null; // Update available
  hasUpdate: boolean; // Computed: update available
}
```

**Usage:**

```typescript
import { usePWA, usePWAState, usePWAActions } from "@/contexts";

// Get full context
const { isInstalled, setShowInstallPrompt } = usePWA();

// Get only state
const { isInstalled, hasUpdate } = usePWAState();

// Get only actions
const { setShowInstallPrompt, dismissUpdate } = usePWAActions();
```

**Features:**

- Automatically captures `beforeinstallprompt` event
- Detects if app is installed (standalone mode)
- Handles `appinstalled` event
- Manages service worker update notifications

**When to use:**

- Components that show install prompts
- Components that handle PWA updates
- Components that need to know installation status

## Setup

### Provider Hierarchy

Wrap your app with all providers in `main.tsx`:

```typescript
import { AppStateProvider, NetworkProvider, PWAProvider } from './contexts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkProvider>
      <PWAProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </PWAProvider>
    </NetworkProvider>
  </React.StrictMode>
);
```

**Order matters:**

- NetworkProvider first (no dependencies)
- PWAProvider second (no dependencies)
- AppStateProvider last (may depend on others in future)

### Initial State

AppStateProvider accepts initial values:

```typescript
<AppStateProvider
  initialApp={appFromUrl}
  initialShowSelector={!appFromUrl}
>
  <App />
</AppStateProvider>
```

## Best Practices

### 1. Use Specific Hooks

Prefer specific hooks over full context:

```typescript
// Good - only subscribes to state changes
const { isOnline } = useNetworkState();

// Avoid - subscribes to all changes including actions
const { isOnline } = useNetwork();
```

### 2. Separate Read and Write

Components that only read state should use value hooks:

```typescript
// Component that only displays status
function StatusDisplay() {
  const { isEmulatorReady } = useAppStateValue();
  return <div>Status: {isEmulatorReady ? 'Ready' : 'Loading'}</div>;
}

// Component that only updates state
function ControlPanel() {
  const { setEmulatorReady } = useAppStateActions();
  return <button onClick={() => setEmulatorReady(true)}>Start</button>;
}
```

### 3. Avoid Prop Drilling

Use contexts instead of passing props through multiple levels:

```typescript
// Before - prop drilling
<App>
  <Header currentApp={currentApp} />
  <Main>
    <Player currentApp={currentApp} />
  </Main>
</App>

// After - use context
<App>
  <Header /> {/* Uses useAppStateValue() */}
  <Main>
    <Player /> {/* Uses useAppStateValue() */}
  </Main>
</App>
```

### 4. Keep Contexts Focused

Each context should manage a single domain. Don't mix concerns:

```typescript
// Good - focused contexts
const { isOnline } = useNetwork();
const { currentApp } = useAppState();

// Bad - mixing concerns
const { isOnline, currentApp } = useGlobalState();
```

## Testing

### Testing Components with Context

```typescript
import { render } from '@testing-library/react';
import { AppStateProvider } from '@/contexts';

test('component uses app state', () => {
  render(
    <AppStateProvider initialApp={mockApp}>
      <MyComponent />
    </AppStateProvider>
  );
  // assertions...
});
```

### Testing Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { AppStateProvider, useAppState } from "@/contexts";

test("updates app state", () => {
  const { result } = renderHook(() => useAppState(), {
    wrapper: AppStateProvider,
  });

  act(() => {
    result.current.setCurrentApp(mockApp);
  });

  expect(result.current.currentApp).toBe(mockApp);
});
```

## Migration from Props

When migrating from prop-based state to context:

1. **Identify shared state** - Find state passed through multiple components
2. **Choose appropriate context** - Select the right domain context
3. **Update provider** - Add initial values if needed
4. **Replace props with hooks** - Use context hooks instead of props
5. **Remove prop drilling** - Clean up intermediate components
6. **Update tests** - Wrap components with providers

## Performance Considerations

### Context Re-renders

Components re-render when context values change. To optimize:

1. **Use specific hooks** - Subscribe only to needed values
2. **Memoize callbacks** - Use `useCallback` for action functions
3. **Split contexts** - Keep contexts focused to minimize re-renders

### When NOT to Use Context

Don't use context for:

- **Local component state** - Use `useState` instead
- **Derived state** - Calculate from existing state
- **Temporary UI state** - Modal open/close, form inputs
- **High-frequency updates** - Use local state or refs

## Future Enhancements

Potential improvements:

1. **Persistence** - Save state to localStorage
2. **Undo/Redo** - Add history management
3. **DevTools** - Custom debugging tools
4. **Middleware** - Add logging, analytics
5. **Selectors** - Memoized derived state

## Conclusion

The Context API provides a clean, type-safe, and maintainable solution for DosKit's state management needs. By separating concerns into focused contexts and providing specific hooks, we achieve good performance while keeping the codebase simple and testable.
