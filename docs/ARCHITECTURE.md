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

Picking an app in the selector:

1. **User picks an application** in DemoSelector (double-click, Enter on the selected app, or Load Application)
2. **DemoSelector** calls the app's `loader(onProgress, signal)` and, in parallel, its `loadDosboxConf()` (or the config it preloaded on hover); both import the app's config module lazily
3. **Loader** downloads the app's ZIP archive with `loadZipArchive` (`diskLoader`), which retries through `fetchWithRetry`; the selector shows progress, offers Cancel Loading, and gives up after 30 seconds
4. **Files are passed** to DosPlayerWithApps via `onSelect`
5. **DosPlayerWithApps** makes them the running session, closes the selector and reports the app to App, which pushes `/?app=<id>` and sets the page title
6. **DosPlayer** remounts, since it is keyed by app id: unmounting stops the previous player, and `useDosEmulator` starts js-dos with the archive as `initFs` and the app's DOSBox config
7. **Emulator starts**: on js-dos's `ci-ready` the hook unmutes audio and calls `onReady`, and the footer shows Ready until that player is gone

Apps the URL asks for (deep links, back/forward):

1. **App** reads the app from the URL and passes it to DosPlayerWithApps as `requestedApp`
2. **DosPlayerWithApps** loads its archive and DOSBox config itself, behind the loading overlay, and switches to the app only once both are in. On a deep link nothing runs before that, so the default DOS prompt never boots first.
3. **A newer request**, a pick in the selector, or unmounting aborts the load and drops its result. A request also remounts the selector, which aborts any download the selector still runs.
4. **Once loaded**, the app runs as in steps 6 and 7 above. DosPlayerWithApps reports it to App, which finds the URL already in place and adds no history entry.

If a requested app fails to load, the error overlay shows why, and its Try Again boots the default DOS prompt and opens the selector. See [ERROR-HANDLING.md](ERROR-HANDLING.md) for the errors each step can show.

### URL Routing

`src/utils/urlRouting.ts` reads and writes the URL; App applies it on load and on `popstate`.

- **One URL form**: An app's URL is `/?app=<id>`, with the app's id written without hyphens (`/?app=secondreality`). App also accepts the hyphenated id, any letter case, and the path form `/secondreality`, and rewrites them to that form without a new history entry.
- **Path-style links on GitHub Pages**: GitHub Pages answers a path it has no file for with `404.html`. The build emits `404.html` as a copy of `index.html` (`githubPagesSpaFallback` in `vite.config.ts`), so the app boots there and rewrites the URL. The Vite dev and preview servers fall back to `index.html` themselves.
- **History**: Picking an app pushes a history entry. Back and forward run whatever the URL then names; the start page stops the running app and opens the selector over the default DOS prompt.
- **Unknown ids**: An `?app=` value that names no app shows a dismissible banner, drops the parameter from the URL without a new history entry, and opens the selector over the default DOS prompt. A path that names no app, such as `/index.html`, is just the start page.

### State Management

DosKit has no React contexts and no state library. Each component keeps the state it owns, App passes what the player needs down as props, and the player reports back through callbacks:

1. **App** - The current app, whether the selector is shown, the URL error banner's text, and the Ready and Online flags behind the footer badges
2. **DosPlayerWithApps** - The running session (an app with its files and DOSBox config, or the default DOS prompt; none while a requested app is still loading), the requested app being loaded, and its load error
3. **DemoSelector** - Its selection, keyboard focus, load progress and error, the AbortController of its load, and the DOSBox configs it preloaded on hover
4. **useDosEmulator** - Its loading and error state, and the command interface in a ref (`ciRef`) from `ci-ready` until the player is gone. Each mount's js-dos player lives in that mount's effect, which stops it on unmount.
5. **OfflineIndicator** - The offline and back-online toasts and the install prompt; it records install-prompt dismissals in localStorage through `safeLocalStorage`

#### Why No Global State?

- **No additional dependencies** - Uses built-in React features
- **Appropriate scale** - The only shared state is the current app, the selector's visibility and the two status flags, and App owns all of them
- **Simpler testing** - Components take props and callbacks, so tests render them directly
- **Type safety** - Props and callbacks are typed like any other function

#### Passing State

```tsx
<DosPlayerWithApps
  onReady={handleDosReady}
  onExit={handleDosExit}
  requestedApp={currentApp}
  showSelector={showAppSelector}
  onAppChange={handleAppChange}
  onSelectorVisibilityChange={handleSelectorVisibilityChange}
  className="dos-player"
/>
```

`onAppChange` reports each app that starts running, picked or requested, and `null` after Try Again. `onExit` is called once per `onReady`: when DOS exits, or as soon as unmounting stops a ready player, so the footer shows Loading while the next app boots.

## Key Features

### 1. Progressive Web App (PWA)

**Service Worker** (`public/sw.js`, registered in production builds only):

- **Caching Strategy**:
  - Network-first for pages, revalidated with the server (`cache: 'no-cache'`), with a 5-second timeout. The response is passed on as it came, including the 404 that GitHub Pages answers path-style links with, and is never stored: offline or on a timeout, every URL gets the one `index.html` install stored under `/`
  - Cache-first for emulator files and demo archives, each from a cache of its own
  - Cache-first for the hashed bundles in `/assets/` and for other WASM files; a miss is fetched and kept as a runtime entry
  - Stale-while-revalidate for other files, such as `js-dos.js`, `js-dos.css`, the manifest and the icons
  - Cross-origin requests and the worker script itself are left to the browser
  - Lookups ignore `Vary`, so a host that answers with `Vary: Origin` (such as `vite preview`) cannot make cached files miss
- **Caches**:
  - `doskit-<build version>` - Install precaches the app shell (`/`, `/manifest.json`, `/logo.svg`, `/favicon.svg`, `/js-dos.js`, `/js-dos.css`), revalidated with the server so a stale HTTP-cache copy never gets in, and every JS and CSS bundle in `dist/assets`, the lazily imported chunks included. A bundle that an earlier deploy's cache holds under the same name is copied from there instead of downloaded. Assets fetched later, but not pages, are added as runtime entries. Each deploy gets a new one, and activation deletes the previous deploy's.
  - `doskit-emulators-<js-dos version>` - The default backend's files, precached at install; any other emulator file (the DOSBox-X backend) is stored on first use. Deploys keep this cache until js-dos changes, and an install downloads only the files it lacks.
  - `doskit-demos-<archive hash>` - Demo archives, stored on first use and never trimmed. Deploys keep this cache until the archives change.
- **LRU Cache**: The deploy's cache holds at most 100 entries. Trimming removes the least recently used runtime entries, by the timestamps kept in `doskit-<build version>-metadata`, and never a precached file. Nothing expires by age.
- **Dynamic Timeouts**: File-type-based network timeouts (30 seconds for WASM and archives, 10 for JS/CSS, 5 for everything else)
- **Offline Support**: Once the worker is installed, the app shell, every bundle and the default emulator are available offline. An app's archive is cached the first time it loads, so an app opens offline once it has been loaded online.

**Update Mechanism**:

- Every build stamps a new cache version into `sw.js`, so each deploy installs as a new worker. The first install takes control at once; later ones wait for the user.
- Update checks every hour while the page is visible (`PWA_CONFIG.UPDATE_CHECK_INTERVAL`), and whenever the page becomes visible again
- An installed update shows the Update Available prompt, which is offered again after a reload while the update still waits
- Update Now posts `SKIP_WAITING` and reloads once the new worker takes control, or after waits of 1, 2 and 4 seconds if it never does

**Install Prompt** (`OfflineIndicator`): Offered 5 seconds after the browser's `beforeinstallprompt`, unless the app is installed, the prompt was dismissed in the last 7 days, or it has been dismissed 3 times.

### 2. Error Handling

**Multi-layer approach** (see [ERROR-HANDLING.md](ERROR-HANDLING.md)):

1. **Global error handler** catches uncaught errors and unhandled promise rejections, suppresses known harmless ones such as js-dos's fullscreen and keyboard lock calls, and logs and tracks the rest
2. **ErrorBoundary** components catch React errors: one around App, one around DosPlayerWithApps
3. **Component error states** show load and start failures where they happen: the selector, the loading overlay and the player
4. **Retry logic** with exponential backoff for network requests

### 3. Performance Optimizations

- **Lazy loading**: DOS app configs (and the DOSBox config builder they use) are loaded on demand, and the selector preloads an app's DOSBox config when the pointer rests on it for 150 ms
- **Code splitting**: React has a chunk of its own (`react-vendor`), whose name stays the same across releases that leave its content alone, so the service worker's install copies it from the previous release's cache
- **Preloading**: `index.html` preloads the default backend's `wdosbox.wasm`, and loads `js-dos.js` deferred at high fetch priority
- **AbortController**: Cancellable fetch requests
- **Retry logic**: Automatic retry with exponential backoff
- **Efficient caching**: Emulator files, demo archives and the bundles a deploy leaves unchanged stay cached across deploys, and runtime entries are trimmed least recently used first

### 4. Type Safety

- **Strict TypeScript**: All strict compiler options enabled, plus `noUncheckedIndexedAccess` and `noImplicitReturns`; `tsc -b` checks the tests with the same options
- **Type definitions**: Custom types for js-dos API
- **Input validation**: Sanitization to prevent XSS
- **Global declarations**: Proper Window interface for js-dos

## Design Patterns

### 1. Lazy Loading Pattern

DOS application configs use dynamic imports to reduce initial bundle size. Each entry in `src/config/apps.config.ts` imports its config module lazily, for the archive URL and the DOSBox config, and downloads the archive with `loadZipArchive`, which `apps.config.ts` imports statically from `src/utils/diskLoader.ts`:

```typescript
export const availableApps: DosApp[] = [
  {
    id: 'second-reality',
    // ...
    loader: async (onProgress, signal) => {
      const config = await import('../dos-apps/second-reality.config');
      return loadZipArchive(config.secondRealityZipUrl, onProgress, signal);
    },
    loadDosboxConf: async () => {
      const config = await import('../dos-apps/second-reality.config');
      return config.secondRealityDosboxConf;
    },
  },
  // ...
];
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

It retries network failures and HTTP 408, 429, 500, 502, 503 and 504, adds up to 30% jitter to each wait (at most `maxDelay`, 10 seconds by default), and stops as soon as its `signal` aborts.

### 3. Error Boundary Pattern

React error boundaries catch and display errors gracefully without crashing the app.

### 4. Observer Pattern

Components subscribe to browser and emulator events, and pass what they learn up through callbacks:

- App listens for `popstate` and runs what the URL names
- OfflineIndicator listens for `online`, `offline`, `beforeinstallprompt` and `appinstalled`, and reports the network status to App
- `useDosEmulator` receives js-dos events (`emu-ready`, `ci-ready`) through its `onEvent` option, and DOS exiting through the command interface's `events().onExit()`
- The service worker registration reports installs and updates through `onSuccess`, `onUpdate` and `onOfflineReady`

### 5. Builder Pattern

DOSBox configurations are built with the fluent builder in `src/utils/dosboxConfigBuilder.ts`. Each app starts from a preset (`demo()` or `musicTracker()`) and overrides what it needs; the builder only offers settings that the default `dosbox` backend applies. From `stars.config.ts`, with the autoexec shortened:

```typescript
export const starsDosboxConf = presets
  .demo()
  .setCPU({ core: 'auto', cputype: 'auto', cycles: 'auto' })
  .setJoystick({ joysticktype: 'none' })
  .addAutoexec('@echo off', 'mount c .', 'c:', 'STARS.EXE')
  .build();
```

[src/dos-apps/README.md](../src/dos-apps/README.md) describes how to add an app.

### 6. Adapter Pattern

`useDosEmulator` starts the emulator through `getEmulatorAdapter()` (`src/adapters/EmulatorAdapter.ts`), whose `JsDosAdapter` checks for `window.Dos` and calls it.

## Security Considerations

1. **Input Sanitization**: URL parameters validated and sanitized: the `?app=` value and the first path segment
2. **XSS Prevention**: Only alphanumeric characters, hyphens, underscores allowed, at most 100 of them
3. **Content Security Policy**: None is set. `index.html` has no CSP meta tag, and GitHub Pages cannot send response headers.
4. **HTTPS**: Required for service worker and PWA features

## Browser Compatibility

- **Modern browsers**: Current Chrome, Edge, Firefox and Safari. The build targets `esnext`, so nothing is transpiled for older engines, and js-dos itself relies on recent APIs: it calls `structuredClone` (Chrome 98, Firefox 94, Safari 15.4) once a second while a player runs.
- **WebAssembly**: Required for js-dos emulator
- **Web Workers**: js-dos runs DOSBox in one (`workerThread: true`)
- **Service Workers**: Required for PWA features
- **Cache API**: Required for offline support. js-dos also keeps a cache of its own in IndexedDB, and does without it where IndexedDB is unavailable.

## Build Process

`npm run build` runs:

1. **js-dos copy**: `prebuild` runs `scripts/copy-js-dos.js`, which copies js-dos from `node_modules` into `public/`
2. **TypeScript check**: `tsc -b` type-checks the app, the Vite and Vitest configs and the tests; it emits nothing
3. **Vite build**: Rolldown bundles the app into hashed files in `dist/assets`, with hidden source maps, and `public/` is copied as it is. A plugin adds `404.html` for path-style deep links.
4. **Service worker versioning**: `scripts/inject-sw-version.js` stamps `dist/sw.js` with a new cache version (a hash of the build time and git commit), the installed js-dos version and a hash of the demo archives, and appends every JS and CSS bundle to its precache list. It fails the build if `sw.js` lacks a placeholder or would precache a file that is not in `dist/`, since one missing file stops the worker from installing.
5. **Asset optimization**: Minification and tree-shaking

Pushes to `main` deploy `dist/` to GitHub Pages once CI passes.

## js-dos Dependency Strategy

DosKit serves js-dos from its own origin. The npm package is copied into `public/` before every dev server start and build (`predev` and `prebuild` run `scripts/copy-js-dos.js`), rather than loaded from a CDN or committed to the repository.

### Why Local Copy?

1. **Stability** - CDN versions can change unexpectedly; `package.json` pins an exact version
2. **Offline Support** - Required for PWA functionality: the service worker only caches files from DosKit's own origin
3. **Version Control** - Explicit control over updates: an update is a `package.json` change
4. **Performance** - Optimized caching with service worker: emulator files stay cached for as long as the js-dos version does

### Files

- `public/js-dos.js` - Main js-dos library
- `public/js-dos.css` - js-dos styles
- `public/emulators/` - The backends' JavaScript and WASM files
- `src/types/js-dos.d.ts` - TypeScript declarations, written by hand

The copy leaves source maps, debug symbols and type declarations behind, skips files that are already up to date, and removes emulator files the installed js-dos no longer ships. Only `src/types/js-dos.d.ts` is committed.

### Updating js-dos

1. Read the new version's notes in [js-dos releases](https://github.com/caiiiycuk/js-dos/releases)
2. Bump `js-dos` in `package.json` and run `npm install`
3. Run `npm run build` (or `npm run dev`), which copies the new files into `public/`
4. Update types in `src/types/js-dos.d.ts` if API changed
5. Update the version where it is written by hand: `git grep` the old one (the README, `public/humans.txt`, `public/llm.txt`, `public/llm-full.txt`, the header of `src/types/js-dos.d.ts`)
6. Test thoroughly before deploying

The app itself follows the installed package: the footer's version (`VITE_JSDOS_VERSION`, set in `vite.config.ts`) and the name of the service worker's emulator cache (`JS_DOS_VERSION`, stamped by `scripts/inject-sw-version.js`) both read it, so installing the deploy's worker downloads the new emulator files once, and activating it deletes the old version's cache. If the new version renames or drops one of the default backend's files, update `EMULATOR_ASSETS` in `public/sw.js` (the build fails until it matches) and the `wdosbox.wasm` preload in `index.html` (which nothing checks).

## Future Improvements

1. **Testing**: Add visual regression tests
2. **Emulator Abstraction**: The adapter interface still takes js-dos's options and returns its player, and `useDosEmulator` handles js-dos's events itself, so another emulator would first need types of its own
