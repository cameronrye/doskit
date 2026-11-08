# DosKit Architecture

## Overview

DosKit is a cross-platform DOS emulator built with React, TypeScript, and js-dos WebAssembly technology. This document describes the architecture, component hierarchy, data flow, and key design decisions.

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8, which bundles with Rolldown
- **Emulator Core**: js-dos 8 (WebAssembly-based DOSBox), installed from npm
- **PWA**: Service Worker with offline support and caching
- **App Selector**: retro-floppy's floppy disk components
- **Testing**: Vitest with React Testing Library (jsdom)

The exact versions are in `package.json` and `package-lock.json`.

## Project Structure

```text
doskit/
├── index.html                   # Preloads wdosbox.wasm, loads js-dos and the app
├── public/
│   ├── sw.js                    # Service Worker for PWA functionality
│   ├── manifest.json            # PWA manifest
│   ├── demos/                   # App archives (<id>.zip) and where they come from
│   ├── js-dos.js                # js-dos library (copied from node_modules)
│   ├── js-dos.css               # js-dos styles (copied from node_modules)
│   └── emulators/               # js-dos backends (copied from node_modules)
├── scripts/                     # Build and utility scripts
│   ├── copy-js-dos.js           # Copies js-dos into public/ before dev and build
│   └── inject-sw-version.js     # Stamps versions and bundles into dist/sw.js
├── src/
│   ├── adapters/
│   │   └── EmulatorAdapter.ts   # Emulator interface and its js-dos adapter
│   ├── components/              # React components
│   │   ├── DosPlayer.tsx        # Core emulator component
│   │   ├── DosPlayerUI.tsx      # Player loading, error and container markup
│   │   ├── DosPlayerWithApps.tsx # Runs the picked or requested app
│   │   ├── DemoSelector.tsx     # Application selector UI
│   │   ├── ErrorBoundary.tsx    # Error handling boundary
│   │   ├── OfflineIndicator.tsx # Network status and install prompt
│   │   └── UpdateNotification.tsx # PWA update notifications
│   ├── config/                  # Configuration files
│   │   ├── apps.config.ts       # App registry (availableApps)
│   │   ├── jsdos.config.ts      # js-dos options
│   │   └── dosbox.conf.ts       # DOSBox configuration of the default DOS prompt
│   ├── constants/               # Application constants
│   │   └── app.ts               # PWA and UI constants
│   ├── dos-apps/                # DOS application configurations
│   │   ├── README.md            # How to add an app
│   │   ├── second-reality.config.ts
│   │   └── impulse-tracker.config.ts ...
│   ├── hooks/
│   │   └── useDosEmulator.ts    # js-dos player lifecycle
│   ├── integration/             # Integration tests
│   ├── test/
│   │   └── setup.ts             # Vitest setup
│   ├── types/                   # TypeScript type definitions
│   │   ├── dos-app.ts           # DosApp
│   │   └── js-dos.d.ts          # js-dos type declarations
│   ├── utils/                   # Utility functions
│   │   ├── diskLoader.ts        # ZIP archive download
│   │   ├── dosboxConfigBuilder.ts # DOSBox config builder and presets
│   │   ├── errorMessages.ts     # User-friendly error mapping
│   │   ├── errorTracking.ts     # Error tracking service
│   │   ├── fetchWithRetry.ts    # Network retry logic
│   │   ├── globalErrorHandler.ts # Uncaught errors and unhandled rejections
│   │   ├── logger.ts            # Centralized logging
│   │   ├── serviceWorkerRegistration.ts
│   │   ├── storage.ts           # localStorage that never throws
│   │   ├── updatePrompt.ts      # Mounts UpdateNotification
│   │   └── urlRouting.ts        # URL routing and deep linking
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
├── vite.config.ts               # Build configuration, 404.html for GitHub Pages
└── vitest.config.ts             # Test configuration
```

Tests sit next to the code they cover (`*.test.ts`, `*.test.tsx`, and `scripts/*.test.js` for the build scripts and the service worker). `public/js-dos.js`, `public/js-dos.css` and `public/emulators/` are gitignored: see [js-dos Dependency Strategy](#js-dos-dependency-strategy).

## Component Hierarchy

```text
ErrorBoundary (main.tsx)
└── App (Root)
    ├── OfflineIndicator
    ├── Header and URL error banner
    ├── ErrorBoundary
    │   └── DosPlayerWithApps
    │       ├── DemoSelector (modal)
    │       │   └── App selection UI
    │       ├── Loading overlay
    │       ├── Error overlay
    │       └── DosPlayer (remounted for each app)
    │           ├── useDosEmulator
    │           └── DosPlayerUI
    │               └── js-dos emulator instance
    └── Footer (Ready/Loading and Online/Offline badges)

UpdateNotification (a React root of its own, mounted by utils/updatePrompt.ts)
```

## Data Flow

### Application Loading Flow

1. **User selects an application** in DemoSelector
2. **DemoSelector** calls the app's `loader()` function (lazy loaded)
3. **Loader** fetches files using `diskLoader` utilities with retry logic
4. **Files are passed** to DosPlayerWithApps via callback
5. **DosPlayerWithApps** updates state and passes files to DosPlayer
6. **DosPlayer** initializes js-dos with the files and DOSBox config
7. **Emulator starts** and user can interact with the DOS application

### State Management

DosKit uses React Context API for global state management, organized into three separate contexts:

1. **AppStateContext** - Application selection and emulator status
2. **NetworkContext** - Network connectivity status
3. **PWAContext** - Progressive Web App features (install, updates)

#### Why Context API?

- **No additional dependencies** - Uses built-in React features
- **Appropriate scale** - Sufficient for DosKit's state management needs
- **Better React integration** - Works seamlessly with React DevTools
- **Simpler testing** - Easier to mock and test
- **Type safety** - Full TypeScript support out of the box

#### Context Usage

```typescript
import { useAppState, useAppStateValue, useAppStateActions } from '@/contexts';

// Get full context (state + actions)
const { currentApp, setCurrentApp } = useAppState();

// Get only state (read-only) - prevents unnecessary re-renders
const { currentApp, isEmulatorReady } = useAppStateValue();

// Get only actions
const { setCurrentApp, setEmulatorReady } = useAppStateActions();
```

#### Best Practices

- **Use specific hooks** - Prefer `useAppStateValue()` over `useAppState()` for read-only access
- **Separate read and write** - Components that only read should use value hooks
- **Keep contexts focused** - Each context manages a single domain

## Key Features

### 1. Progressive Web App (PWA)

**Service Worker** (`public/sw.js`):

- **Caching Strategy**:
  - Network-first for HTML
  - Cache-first for WASM files
  - Stale-while-revalidate for JS/CSS
- **LRU Cache**: Timestamp-based eviction (max 100 items, 7-day expiration)
- **Dynamic Timeouts**: File-type-based network timeouts
- **Offline Support**: Cached resources available offline

**Update Mechanism**:

- Automatic update checks every 60 seconds
- Exponential backoff retry (1s, 2s, 4s)
- User notification with reload prompt

### 2. Error Handling

**Multi-layer approach**:

1. **ErrorBoundary** components catch React errors
2. **Try-catch blocks** in async operations
3. **User-friendly error messages** via `errorMessages.ts`
4. **Retry logic** with exponential backoff for network requests

### 3. Performance Optimizations

- **Lazy loading**: DOS app configs loaded on-demand
- **Resource hints**: DNS prefetch and preconnect for external resources
- **AbortController**: Cancellable fetch requests
- **Retry logic**: Automatic retry with exponential backoff
- **Efficient caching**: LRU cache with timestamps

### 4. Type Safety

- **Strict TypeScript**: All strict compiler options enabled
- **Type definitions**: Custom types for js-dos API
- **Input validation**: Sanitization to prevent XSS
- **Global declarations**: Proper Window interface for js-dos

## Design Patterns

### 1. Lazy Loading Pattern

DOS application configs use dynamic imports to reduce initial bundle size:

```typescript
loader: async () => {
  const config = await import('../dos-apps/second-reality.config');
  return config.loadZipArchive(config.secondRealityZipUrl);
};
```

### 2. Retry Pattern

Network requests use exponential backoff:

```typescript
fetchWithRetry(url, options, {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
});
```

### 3. Error Boundary Pattern

React error boundaries catch and display errors gracefully without crashing the app.

### 4. Observer Pattern

Custom events for URL-based app loading and cross-component communication.

## Security Considerations

1. **Input Sanitization**: URL parameters validated and sanitized
2. **XSS Prevention**: Only alphanumeric characters, hyphens, underscores allowed
3. **Content Security Policy**: Configured in service worker
4. **HTTPS**: Required for service worker and PWA features

## Browser Compatibility

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebAssembly**: Required for js-dos emulator
- **Service Workers**: Required for PWA features
- **IndexedDB/Cache API**: Required for offline support

## Build Process

1. **TypeScript compilation**: `tsc -b`
2. **Vite build**: Bundle optimization with Rolldown
3. **Service worker versioning**: Inject build timestamp
4. **Asset optimization**: Minification and tree-shaking

## js-dos Dependency Strategy

DosKit uses a **local copy strategy** for the js-dos library:

### Why Local Copy?

1. **Stability** - CDN versions can change unexpectedly
2. **Offline Support** - Required for PWA functionality
3. **Version Control** - Explicit control over updates
4. **Performance** - Optimized caching with service worker

### Files

- `public/js-dos.js` - Main js-dos library
- `public/js-dos.css` - js-dos styles
- `src/types/js-dos.d.ts` - TypeScript declarations

### Updating js-dos

1. Download new version from [js-dos releases](https://github.com/nicholasday/js-dos/releases)
2. Replace files in `public/`
3. Update types in `src/types/js-dos.d.ts` if API changed
4. Test thoroughly before deploying

## Future Improvements

1. **Testing**: Add visual regression tests
2. **Component Refactoring**: Split DosPlayer into smaller components
3. **DOSBox Builder**: Create builder pattern for DOSBox configs
4. **Emulator Abstraction**: Decouple from js-dos with adapter interface
