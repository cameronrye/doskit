# DosKit Architecture

## Overview

DosKit is a cross-platform DOS emulator built with React, TypeScript, and js-dos WebAssembly technology. This document describes the architecture, component hierarchy, data flow, and key design decisions.

## Technology Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite (experimental Rolldown variant for improved performance)
- **Emulator Core**: js-dos v8.3.20 (WebAssembly-based DOSBox)
- **PWA**: Service Worker with offline support and caching
- **Testing**: Vitest with React Testing Library

## Project Structure

```
doskit/
├── public/
│   ├── sw.js                    # Service Worker for PWA functionality
│   ├── js-dos.js                # js-dos library (local copy)
│   └── js-dos.css               # js-dos styles
├── src/
│   ├── components/              # React components
│   │   ├── DosPlayer.tsx        # Core emulator component
│   │   ├── DosPlayerWithApps.tsx # Wrapper with app selection
│   │   ├── DemoSelector.tsx     # Application selector UI
│   │   ├── ErrorBoundary.tsx    # Error handling boundary
│   │   ├── OfflineIndicator.tsx # Network status indicator
│   │   └── UpdateNotification.tsx # PWA update notifications
│   ├── dos-apps/                # DOS application configurations
│   │   ├── second-reality.config.ts
│   │   └── impulse-tracker.config.ts
│   ├── config/                  # Configuration files
│   │   ├── jsdos.config.ts      # js-dos options
│   │   └── dosbox.conf.ts       # DOSBox configuration
│   ├── constants/               # Application constants
│   │   └── app.ts               # Centralized constants
│   ├── types/                   # TypeScript type definitions
│   │   └── js-dos.d.ts          # js-dos type declarations
│   ├── utils/                   # Utility functions
│   │   ├── diskLoader.ts        # File loading utilities
│   │   ├── urlRouting.ts        # URL routing and deep linking
│   │   ├── logger.ts            # Centralized logging
│   │   ├── fetchWithRetry.ts    # Network retry logic
│   │   ├── errorMessages.ts     # User-friendly error mapping
│   │   └── serviceWorkerRegistration.ts
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
├── scripts/                     # Build and utility scripts
└── tests/                       # Test files
```

## Component Hierarchy

```
App (Root)
├── ErrorBoundary
│   └── DosPlayerWithApps
│       ├── DemoSelector (modal)
│       │   └── App selection UI
│       ├── DosPlayer
│       │   └── js-dos emulator instance
│       ├── Loading overlay
│       └── Error overlay
├── OfflineIndicator
└── UpdateNotification
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

Currently using React's built-in state management:

- **Local component state** (useState) for UI state
- **Props drilling** for passing data between components
- **Custom events** for URL-based app loading
- **Callbacks** for parent-child communication

Future consideration: Zustand or Context API for global state.

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
  const config = await import("../dos-apps/second-reality.config");
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

## Future Improvements

1. **State Management**: Implement Zustand or Context API
2. **Testing**: Add unit, integration, and visual regression tests
3. **Component Refactoring**: Split DosPlayer into smaller components
4. **DOSBox Builder**: Create builder pattern for DOSBox configs
5. **Emulator Abstraction**: Decouple from js-dos with adapter interface
