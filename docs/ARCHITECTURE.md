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
│   ├── licenses/                # Licenses of js-dos, DOSBox, DOSBox-X and libzip, GPL-2.0 text
│   ├── js-dos.js                # js-dos library (copied from node_modules)
│   ├── js-dos.css               # js-dos styles (copied from node_modules)
│   └── emulators/               # js-dos backends (copied from node_modules)
├── scripts/                     # Build and utility scripts
│   ├── copy-js-dos.js           # Copies js-dos into public/ before dev and build
│   ├── inject-sw-version.js     # Stamps versions and bundles into dist/sw.js
│   └── check-built-css.js       # CI check of the built CSS against the oldest browsers
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
│   │   ├── keysAroundDos.ts     # Keeps the keys of DosKit's controls from js-dos
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

Tests sit next to the code they cover (`*.test.ts`, `*.test.tsx`, and `scripts/*.test.js` for the build scripts and the plugin that writes `404.html`, the service worker, the ESLint config, and `index.html`'s metadata, the icons, `robots.txt` and the licenses page). `public/js-dos.js`, `public/js-dos.css` and `public/emulators/` are gitignored: see [js-dos Dependency Strategy](#js-dos-dependency-strategy).

## Component Hierarchy

```text
StrictMode (main.tsx)
└── ErrorBoundary
    └── App (Root)
        ├── OfflineIndicator
        ├── Header
        ├── ErrorBoundary
        │   └── DosPlayerWithApps
        │       ├── DemoSelector (modal dialog)
        │       │   └── Notice, the disks, and the chosen app's details and actions
        │       ├── Loading overlay (Cancel)
        │       ├── Error overlay (Try Again, Choose Another Application)
        │       └── DosPlayer (remounted for each session)
        │           ├── useDosEmulator
        │           └── DosPlayerUI
        │               └── js-dos emulator instance
        └── Footer (Loading/Ready/Error and Online/Offline badges, Licenses link)

UpdateNotification (a React root of its own, mounted by utils/updatePrompt.ts)
```

In development, `StrictMode` runs each effect twice when a component mounts, with its cleanup in between, so each DosPlayer starts js-dos twice in its element. `useDosEmulator` stops the first start's player and passes on none of its events, and on a fresh page the adapter holds the second start back until `emulators.js` has run (see [Adapter Pattern](#6-adapter-pattern)). Production builds run each effect once.

What covers what is fixed. From the bottom: the header and footer, with js-dos's sidebar; the player's own loading and error panels; js-dos's modals and on-screen controls, and the player in js-dos's soft fullscreen; the loading and error overlays over the whole player; the selector's backdrop and the selector; the install prompt and js-dos's toasts; and the offline notices and the update prompt. The comment at the top of `src/components/DosPlayerWithApps.css` gives each one's `z-index` and the file that sets it; a new overlay belongs in that list.

With `softFullscreen` set, js-dos's fullscreen button has the player fill the window, over the header and footer, and js-dos's own layers, its toasts included, then stay inside it. The rule for that is DosKit's, in `src/components/DosPlayer.css`: the button marks the player's element with `jsdos-fullscreen-workaround`, but `js-dos.css` styles that class only on an element inside it.

The selector keeps clear of the offline banner and the install prompt, which stay above it, by its layout. While either is shown, OfflineIndicator keeps its height, measured with a `ResizeObserver`, in `--offline-banner-height` or `--install-prompt-height` on the root element, and `src/components/DemoSelector.css` centers the selector in the space the two leave. The header uses `--offline-banner-height` too: while the banner shows, its content moves down below it. In windows under 500px tall the banner keeps to one line, and under 450px the install prompt to one row. The selector's height limit never drops below 40% of the window's, and it stays on screen, so in a very short window a notice can still cover part of it until the notice is closed.

js-dos listens for keys on `window`, sends each one to DOS and cancels the browser's own handling of it. So that Tab, Enter and Space work on DosKit's controls (the header's button, the selector, the overlays, the notices and the footer's links) and keys meant for them never reach the running program, App's root stops each key pressed on one of them once React has handled it (`keepKeyFromDos` in `src/utils/keysAroundDos.ts`), and so does the update prompt's root. A key's release follows its press: `watchKeysAroundDos` keeps from js-dos the release of a key that went down on DosKit's controls, wherever the focus is when it comes up, and lets every other release through, so that DOS neither gets the release of a key it did not have nor keeps one down for good, which DOSBox would repeat. Keys pressed in the player, or with nothing focused, reach DOS, Tab included, so once DOS has the keys, Tab does not lead back to DosKit's controls.

## Data Flow

### Application Loading Flow

Picking an app in the selector:

1. **User picks an application** in DemoSelector (double-click, Enter on a disk, or Load Application)
2. **DemoSelector** calls the app's `loader(onProgress, signal)` and, in parallel, its `loadDosboxConf()` (or the config it preloaded on hover); both import the app's config module lazily
3. **Loader** downloads the app's ZIP archive with `loadZipArchive` (`diskLoader`), which retries through `fetchWithRetry` and fails a download that receives no data for 20 seconds, or a response that is not a ZIP archive. The selector shows how much of the archive has arrived (its share, or the megabytes received when the response gives no Content-Length) and offers Cancel Loading. It also gives up a load that has reported no progress 20 seconds after it began, such as one whose config chunk never arrives.
4. **Files are passed** to DosPlayerWithApps via `onSelect`
5. **DosPlayerWithApps** makes them a new session, with an id of its own, closes the selector and reports the app to App, which pushes `/?app=<id>` and sets the page title
6. **DosPlayer** remounts, since it is keyed by the session's id: unmounting stops the previous player, and `useDosEmulator` starts js-dos with the archive as `initFs` and the app's DOSBox config. So picking the app that is running starts it again, such as a demo that has ended at the DOS prompt. If `emulators.js`, which the previous player began loading, has not run yet, as when an app is picked the moment the page opens, the start waits for it (see [Adapter Pattern](#6-adapter-pattern)).
7. **Emulator starts**: on js-dos's `ci-ready` the hook unmutes audio and calls `onReady`, DosPlayerWithApps reports the status `ready`, and the footer shows Ready until that player is gone

Apps the URL asks for (deep links, back/forward):

1. **App** reads the app from the URL and passes it to DosPlayerWithApps as `requestedApp`
2. **DosPlayerWithApps** stops whatever is running, the previous app (sound included) or the default DOS prompt, and loads the app's archive and DOSBox config itself, behind the loading overlay. It starts the app only once both are in. Nothing runs before that: a deep link never boots the default DOS prompt first, and the footer shows Loading. A request for the app already running changes nothing.
3. **A newer request**, a pick in the selector, the overlay's Cancel, or unmounting aborts the load and drops its result. A request also remounts the selector, which aborts any download the selector still runs. A request that returns to the app the load stopped loads that app again. Cancel does what Choose Another Application does after a failed load: a new default DOS prompt starts with the selector open over it, and App, told that no app runs, pushes the start page's URL, so Back returns to the app and loads it again.
4. **Once loaded**, the app runs as a new session, as in steps 6 and 7 above. DosPlayerWithApps reports it to App, which finds the URL already in place and adds no history entry.

If a requested app fails to load, the error overlay shows why, with nothing running behind it; a download that stalls ends there too, as a timeout. Its Try Again, which has the keyboard focus, loads the same app again; Choose Another Application boots the default DOS prompt and opens the selector. See [ERROR-HANDLING.md](ERROR-HANDLING.md) for the errors each step can show.

### URL Routing

`src/utils/urlRouting.ts` reads and writes the URL; App applies it on load and on `popstate`.

- **One URL form**: An app's URL is `/?app=<id>`, with the app's id written without hyphens (`/?app=secondreality`). App also accepts the hyphenated id, any letter case, and the path form `/secondreality`, and rewrites them to that form without a new history entry.
- **Path-style links on GitHub Pages**: GitHub Pages answers a path it has no file for with `404.html`. The build emits `404.html` as a copy of `index.html` (`githubPagesSpaFallback` in `vite.config.ts`), so the app boots there and rewrites the URL. The Vite dev and preview servers fall back to `index.html` themselves.
- **History**: Picking an app pushes a history entry, and so do Choose Another Application and the loading overlay's Cancel, with the start page's URL. Back and forward run whatever the URL then names, stopping the running app as soon as the new one starts loading; the start page stops the running app and opens the selector over the default DOS prompt.
- **Unknown ids**: An `?app=` parameter decides whenever it is present, even when the path names an app. One that names no app, an empty one included, opens the selector over the default DOS prompt, and App passes DosPlayerWithApps the message `Application "<value>" not found. Please select from available applications.`, with the value cut to its letters, digits, hyphens and underscores, as `selectorNotice`. The selector shows it above its disks as an alert until it closes or an app loads. A value with none of those characters, or with over 100 of them, gets the message without it. The parameter leaves the URL without a new history entry, and so does a path-style app beside it: `/stars?app=` becomes `/`. A path that names no app, such as `/index.html`, is just the start page.

### State Management

DosKit has no React contexts and no state library. Each component keeps the state it owns, App passes what the player needs down as props, and the player reports back through callbacks:

1. **App** - The current app, whether the selector is shown, the message for a link that named no app, and the player's status and the Online flag behind the footer badges
2. **DosPlayerWithApps** - The running session (an app with its files and DOSBox config, or the default DOS prompt, each with an id of its own; none while a requested app is still loading), whether that session's emulator is ready or failed to start, the requested app being loaded, and its load error, with the app Try Again loads again
3. **DemoSelector** - Its selection, keyboard focus, load progress and error, the AbortController of its load, and the DOSBox configs it preloaded on hover
4. **useDosEmulator** - Its loading and error state, and the command interface in a ref (`ciRef`) from `ci-ready` until the player is gone. Each mount's js-dos player lives in that mount's effect, which loses the player's WebGL context and stops it on unmount. The choices made in js-dos's settings panel live in js-dos's own localStorage keys (`jsdos.8.*`), but js-dos reads them only when `js-dos.js` loads, and its options override them, so `getStoredSettings()` in `src/config/jsdos.config.ts` passes each player the saved volume, mouse sensitivity, aspect ratio, image rendering, theme and controls' scale in place of DosKit's defaults. That also gets around js-dos reading any saved theme as dark. Mirror controls has no option to pass, so each new player starts with the value it had when the page loaded.
5. **OfflineIndicator** - The offline banner, the back-online toast and the install prompt. It records install-prompt dismissals in localStorage through `safeLocalStorage`, and while the banner or the prompt is shown, keeps its height on the root element for the header and the selector. Screen readers hear the banner as an alert and the toast as a status message.

#### Why No Global State?

- **No additional dependencies** - Uses built-in React features
- **Appropriate scale** - The only shared state is the current app, the selector's visibility, the player's status and the Online flag, and App owns all of them
- **Simpler testing** - Components take props and callbacks, so tests render them directly
- **Type safety** - Props and callbacks are typed like any other function

#### Passing State

```tsx
<DosPlayerWithApps
  requestedApp={currentApp}
  showSelector={showAppSelector}
  onAppChange={handleAppChange}
  onSelectorVisibilityChange={handleSelectorVisibilityChange}
  onStatusChange={setPlayerStatus}
  selectorNotice={urlError}
  className="dos-player"
/>
```

`onAppChange` reports each app that starts running, picked or requested, and `null` after Choose Another Application or the loading overlay's Cancel. `onStatusChange` reports the player's status when DosPlayerWithApps mounts and at each change, and the footer's DOS badge, in a live region that screen readers announce, shows it: `loading` while an app downloads or its emulator starts, and after DOS has exited until the next start; `ready` once js-dos reports the emulator ready; `error` while the load error or the emulator's start error shows. Each new session is loading until its own emulator is ready. A failure js-dos shows only in its own window, such as a backend file that does not download, sends no event, so the status stays `loading` (see [ERROR-HANDLING.md](ERROR-HANDLING.md#5-component-level-error-states)). App also shows Error once its error boundary has replaced the player, which then reports nothing, until Try Again remounts it. DosPlayerWithApps also takes `onReady` and `onExit`, which App does not pass; `onExit` is called once per `onReady`: when DOS exits, or as soon as unmounting stops a ready player.

## Key Features

### 1. Progressive Web App (PWA)

**Service Worker** (`public/sw.js`, registered in production builds only):

- **Caching Strategy**:
  - Network-first for pages, revalidated with the server (`cache: 'no-cache'`), with a 5-second timeout. The response is passed on as it came, including the 404 that GitHub Pages answers path-style links with, and is never stored: offline or on a timeout, every URL gets the one `index.html` install stored under `/`
  - Cache-first for js-dos's files, its player (`js-dos.js`, `js-dos.css`) and the emulator files it loads, from the cache of the js-dos version the worker installed and never refreshed, so a page gets all of them from one js-dos version
  - Cache-first for demo archives, from a cache of their own
  - Cache-first for the hashed bundles in `/assets/` and for other WASM files; a miss is fetched and kept as a runtime entry
  - Stale-while-revalidate for other files, such as the manifest and the icons
  - Cross-origin requests and the worker script itself are left to the browser
  - Lookups ignore `Vary`, so a host that answers with `Vary: Origin` (such as `vite preview`) cannot make cached files miss
- **Caches**:
  - `doskit-<build version>` - Install precaches the app shell (`/`, `/manifest.json`, `/logo.svg`, `/favicon.svg`), revalidated with the server so a stale HTTP-cache copy never gets in, and every JS and CSS bundle in `dist/assets`, the lazily imported chunks included. A bundle that an earlier deploy's cache holds under the same name is copied from there instead of downloaded. Assets fetched later, but not pages, are added as runtime entries. Each deploy that changes the site or the worker gets a new one, and activation deletes the previous deploy's.
  - `doskit-emulators-<js-dos version>` - The js-dos player (`js-dos.js`, `js-dos.css`) and the default backend's files, precached at install; any other emulator file (the DOSBox-X backend) is stored on first use. Deploys keep this cache until js-dos changes, and an install downloads only the files it lacks.
  - `doskit-demos-<archive hash>` - Demo archives, stored on first use and never trimmed. Deploys keep this cache until the archives change.
- **LRU Cache**: The deploy's cache holds at most 100 entries. Trimming removes the least recently used runtime entries, by the timestamps kept in `doskit-<build version>-metadata`, and never a precached file. Nothing expires by age.
- **Dynamic Timeouts**: File-type-based network timeouts (30 seconds for WASM and archives, 10 for JS/CSS, 5 for everything else)
- **Offline Support**: Once the worker is installed, the app shell, every bundle, and js-dos with its default emulator are available offline. An app's archive is cached the first time it loads, so an app opens offline once it has been loaded online. The licenses page is not cached: offline, the footer's Licenses link gets the app's page, as every navigation the network cannot answer does.

**Update Mechanism**:

- The build stamps `sw.js` with a cache version that is a hash of the site it made: every file in `dist/` but `sw.js`, and the worker with what the build injects into it. A deploy that changes the site or the worker installs as a new worker; one that changes neither, such as a merge of docs alone, writes the same `sw.js` and installs none. The first install takes control at once; a later one waits until the user picks Update Now, or until every tab of the app has closed. A reload alone does not let it take over.
- Update checks every hour while the page is visible (`PWA_CONFIG.UPDATE_CHECK_INTERVAL`), and whenever the page becomes visible again
- An installed update shows the Update Available prompt, which is offered again after a reload while the update still waits
- The prompt is a modal alert dialog that gives Later the focus, as it can appear while someone types into DOS. Escape answers Later, Tab and Shift+Tab stay on its two buttons, and keys pressed in it never reach DOS.
- Update Now posts `SKIP_WAITING` and reloads once the new worker takes control, or after waits of 1, 2 and 4 seconds if it never does
- The new worker then controls every open tab of the app. The others, once they have been offered the update, show "Update Installed: DosKit was updated in another tab. Reload to use the new version.", with Reload and Later, even where the prompt was put off. Update Now in a tab with nothing left waiting reloads it.

**Install Prompt** (`OfflineIndicator`): Offered 5 seconds after the browser's `beforeinstallprompt`, unless the app is installed, the prompt was dismissed in the last 7 days, or it has been dismissed 3 times.

### 2. Error Handling

**Multi-layer approach** (see [ERROR-HANDLING.md](ERROR-HANDLING.md)):

1. **Global error handler** catches uncaught errors and unhandled promise rejections, suppresses known harmless ones such as js-dos's keyboard lock calls, and tracks the rest; the console tracker's report is the one line it logs for each
2. **ErrorBoundary** components catch React errors: one around App, and one in App around DosPlayerWithApps, which tells App when it catches one, so the footer shows Error
3. **Component error states** show load and start failures where they happen: the selector, the error overlay and the player. A failed load is explained the same way in the selector and the overlay, with the technical message under a collapsed Details line.
4. **Retry logic** with exponential backoff for network requests

### 3. Performance Optimizations

- **Lazy loading**: DOS app configs (and the DOSBox config builder they use) are loaded on demand, and the selector preloads an app's DOSBox config when the pointer rests on it for 150 ms
- **Code splitting**: React has a chunk of its own (`react-vendor`), whose name stays the same across releases that leave its content alone, so the service worker's install copies it from the previous release's cache
- **Preloading**: `index.html` preloads the default backend's `wdosbox.wasm`, and loads `js-dos.js` deferred at high fetch priority
- **AbortController**: Cancellable fetch requests
- **Retry logic**: Automatic retry with exponential backoff
- **Efficient caching**: js-dos's player and emulator files, the demo archives and the bundles a deploy leaves unchanged stay cached across deploys, and runtime entries are trimmed least recently used first

### 4. Type Safety

- **Strict TypeScript**: All strict compiler options enabled, plus `noUncheckedIndexedAccess` and `noImplicitReturns`; `tsc -b` checks the tests with the same options
- **Type definitions**: Custom types for js-dos API, which `src/types/js-dos.test.ts` holds to the option and player-member names js-dos has, and to the command interface and events of js-dos's emulators package
- **Input validation**: Sanitization to prevent XSS
- **Global declarations**: `window.Dos`, optional because the page runs without it when `js-dos.js` fails to load, and `window.emulators`, which `emulators.js` defines

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

It retries network failures and HTTP 408, 429, 500, 502, 503 and 504, adds up to 30% jitter to each wait (at most `maxDelay`, 10 seconds by default), and stops as soon as its `signal` aborts. A network failure while `navigator.onLine` is false is thrown at once, since every retry would fail the same way; online it is retried.

### 3. Error Boundary Pattern

React error boundaries catch and display errors gracefully without crashing the app.

### 4. Observer Pattern

Components subscribe to browser and emulator events, and pass what they learn up through callbacks:

- App listens for `popstate` and runs what the URL names. While an app marked `warnBeforeLeaving` (the two trackers) has a ready player, it also listens for `beforeunload`, so that closing or reloading the page asks first: the app's work lives only in the emulator's memory, and browsers keep keys such as Ctrl+W for themselves.
- OfflineIndicator listens for `online`, `offline`, `beforeinstallprompt` and `appinstalled`, and reports the network status to App. A `ResizeObserver` on its offline banner and install prompt keeps their heights in `--offline-banner-height` and `--install-prompt-height` for the header and the selector.
- `useDosEmulator` receives js-dos events (`emu-ready`, `ci-ready`) through its `onEvent` option, and DOS exiting through the command interface's `events().onExit()`
- `keysAroundDos` listens on `window` for key presses and releases, and for the window losing the focus, while App is mounted (see [Component Hierarchy](#component-hierarchy))
- The service worker registration reports installs and updates through `onSuccess`, `onUpdate` and `onOfflineReady`; `main.tsx` passes only `onUpdate`, which shows the update prompt. The prompt then listens for `controllerchange`, which tells it that another tab's Update Now has let the update take over.

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

`useDosEmulator` starts the emulator through `getEmulatorAdapter()` (`src/adapters/EmulatorAdapter.ts`), whose `JsDosAdapter` calls js-dos's `Dos()`. The declarations make `window.Dos` optional: the page runs without it when `js-dos.js` failed to download or was blocked, which `isAvailable()` reports.

The adapter also holds back starts that js-dos would lose. js-dos's first `Dos()` call loads its emulators package, `emulators.js`, through a script tag with the id `emulators-js`, and a later call that finds that tag reads the `emulators` global at once (`initEmulatorsJs` in js-dos's `src/store/dos.ts`). Before the script has run, that read fails: the player never boots, and js-dos sends no event to say so. So a start made while the tag is there and the global is not, such as a pick in the selector right after the page opens, waits for the tag's `load` before it calls `Dos()`. If its player has unmounted by then, the start never calls `Dos()`: `useDosEmulator` aborts a signal when it unmounts, which the adapter checks first, since each `Dos()` call adds document listeners that js-dos never removes and takes the keyboard lock from the player before it. The start that added the tag hands its player back only once the script has run, so that a failure reaches it too. If `emulators.js` fails to download, or runs without defining the global, each of these starts fails with an error that says so (see [ERROR-HANDLING.md](ERROR-HANDLING.md#5-component-level-error-states)), a player already made is stopped, and the tag is removed, so that the next start downloads `emulators.js` again.

## Security Considerations

1. **Input Sanitization**: URL parameters validated and sanitized: the `?app=` value and the first path segment
2. **XSS Prevention**: Only alphanumeric characters, hyphens, underscores allowed, at most 100 of them
3. **Content Security Policy**: None, for now. GitHub Pages cannot send response headers, but a `<meta http-equiv="Content-Security-Policy">` tag in the built `index.html` could carry every directive except `frame-ancestors`, `report-uri` and `sandbox`. js-dos limits what such a policy could protect: `emulators.js` runs the backend's script through `eval`, so `script-src` would have to allow `'unsafe-eval'`, not only the `'wasm-unsafe-eval'` that compiling WebAssembly needs, and it starts the emulator's Web Worker from a `blob:` URL, which `worker-src` would have to allow. The policy could only go into the build, since Vite's React plugin adds an inline script to the dev server's page, and none has been checked in Firefox. There is also little for one to stop today: everything the page loads comes from its own origin, as `pathPrefix` and `noCloud` in `src/config/jsdos.config.ts` keep js-dos off its own servers, and what the page takes from the URL is cut to the characters in item 2.
4. **HTTPS**: Required for service worker and PWA features

## Browser Compatibility

- **Browsers**: The minimum versions in the README's [Browser Compatibility](../README.md#browser-compatibility), the first with `structuredClone()`: js-dos's player calls it once a second while it runs, so in Chrome before 98, Firefox before 94 or Safari before 15.4 each of those calls fails with an error. The build targets those versions (`build.target` in `vite.config.ts`). For newer browsers the CSS minifier would drop the `100vh` fallbacks written before `100dvh`, which Chrome and Edge before 108 and Firefox before 101 need, and rewrite the `max-width` media queries in range syntax, which Chrome before 104 and Safari before 16.4 ignore; for these it keeps both, and adds `-webkit-backdrop-filter` for Safari. In the JavaScript only class fields change, set in the constructor for Safari before 16. CI checks the built CSS with `scripts/check-built-css.js`. DosKit's own code also works without what came later, such as `AbortSignal.throwIfAborted()`, which came in Chrome 100 and Firefox 97, and an abort's `reason`, which Firefox has from 97.
- **WebAssembly**: Required for js-dos emulator
- **Web Workers**: js-dos runs DOSBox in one (`workerThread: true`)
- **Service Workers**: Required for PWA features
- **Cache API**: Required for offline support. js-dos also keeps a cache of its own in IndexedDB, and does without it where IndexedDB is unavailable.

## Build Process

`npm run build` runs:

1. **js-dos copy**: `prebuild` runs `scripts/copy-js-dos.js`, which copies js-dos from `node_modules` into `public/`
2. **TypeScript check**: `tsc -b` type-checks the app, the Vite and Vitest configs and the tests; it emits nothing
3. **Vite build**: Rolldown bundles the app into hashed files in `dist/assets`, for the browsers in [Browser Compatibility](#browser-compatibility), with hidden source maps, and `public/` is copied as it is. A plugin adds `404.html` for path-style deep links, and the licenses of the packages bundled into the app go to `dist/licenses/third-party-licenses.txt`, which the licenses page links.
4. **Service worker versioning**: `scripts/inject-sw-version.js` stamps `dist/sw.js` with its cache version, the installed js-dos version and a hash of the demo archives, and appends every JS and CSS bundle to its precache list. The cache version is a hash of every file in `dist/` but `sw.js`, by path and bytes, and of `sw.js` with what is injected into it, with no build time or commit, so two builds of the same tree write the same `dist/`. It fails the build if `sw.js` lacks a placeholder or would precache a file that is not in `dist/`, since one missing file stops the worker from installing.
5. **Asset optimization**: Minification and tree-shaking

Pushes to `main` deploy `dist/` to GitHub Pages once CI passes.

## js-dos Dependency Strategy

DosKit serves js-dos from its own origin. The npm package is copied into `public/` before every dev server start and build (`predev` and `prebuild` run `scripts/copy-js-dos.js`), rather than loaded from a CDN or committed to the repository.

### Why Local Copy?

1. **Stability** - CDN versions can change unexpectedly; `package.json` pins an exact version
2. **Offline Support** - Required for PWA functionality: the service worker only caches files from DosKit's own origin
3. **Version Control** - Explicit control over updates: an update is a `package.json` change
4. **Performance** - Optimized caching with service worker: js-dos's player and emulator files stay cached for as long as the js-dos version does

### Files

- `public/js-dos.js` - Main js-dos library
- `public/js-dos.css` - js-dos styles
- `public/emulators/` - The backends' JavaScript and WASM files
- `src/types/js-dos.d.ts` - TypeScript declarations, written by hand and checked by `src/types/js-dos.test.ts`, which `tsc -b` type-checks

The copy leaves source maps, debug symbols and type declarations behind, skips files that are already up to date, and removes emulator files the installed js-dos no longer ships. Only `src/types/js-dos.d.ts` is committed.

### Updating js-dos

1. Read the new version's notes in [js-dos releases](https://github.com/caiiiycuk/js-dos/releases)
2. Bump `js-dos` in `package.json` and run `npm install`
3. Run `npm run build` (or `npm run dev`), which copies the new files into `public/`
4. Check the API against the new `node_modules/js-dos/dist/js-dos.js`. Its source map, `js-dos.js.map` next to it, holds js-dos's own sources, among them `src/main.tsx`, which reads most of the options `Dos()` takes and builds the player it returns, and `src/window/soft-keyboard.tsx`, the on-screen keyboard. Lists in DosKit's tests are kept by hand from js-dos's sources: the option and player-member names in `src/types/js-dos.test.ts`, with which `tsc -b` fails for any other name `src/types/js-dos.d.ts` declares, and three in `src/config/jsdos.config.test.ts`. `JS_DOS_KEYS` gives the key codes each key name presses, from `buttonToCode` in `src/window/soft-keyboard.tsx` and the table of the browser's key codes in `src/window/dos/controls/keys.ts`; `JS_DOS_LAYOUTS` and `JS_DOS_LABELS` are js-dos's own layouts and its first set of labels, from `src/store/dos.ts`. `mobileJsDosConfig` follows its compact layout with copies of those two layouts and uses those labels, with `\`, `/` and `` ` `` renamed `Ü`, `¿` and `À` and the `{symbols}` key left out. Update the lists, then the declarations and the copies in `src/config/jsdos.config.ts` to match. From `CommandInterface` on, the declarations follow js-dos's emulators package instead, whose own declarations are in `node_modules/js-dos/dist/emulators/types` (`emulators.d.ts` and `protocol/protocol.d.ts`): `src/types/js-dos.test.ts` also lists the command interface's members and events from there, and `tsc -b` fails for any difference. Check also that `initEmulatorsJs`, in its `src/store/dos.ts`, still loads `emulators.js` through a script tag with the id `emulators-js`: `JsDosAdapter` finds that tag to hold starts back while the script loads (see [Adapter Pattern](#6-adapter-pattern)), which it needs to for as long as js-dos reads the `emulators` global as soon as it finds the tag.
5. Update the version where it is written by hand: `git grep` the old one. It is in `public/llms.txt`, `public/llms-full.txt` and comments in `src/adapters/EmulatorAdapter.ts`, `src/adapters/EmulatorAdapter.test.ts`, `src/config/jsdos.config.ts`, `src/config/jsdos.config.test.ts`, `src/types/js-dos.d.ts` and `src/types/js-dos.test.ts`. The tests that use it only as sample data and `CHANGELOG.md` keep it. `docs/js-dos-llm-reference.md` is a copy of a third-party reference for that version: check its DosKit notes again. `public/licenses/index.html` names the js-dos version and the emulators release it was built with (`devDependencies.emulators` in js-dos's `package.json`), and links their sources and the DOSBox and DOSBox-X commits that release builds: `scripts/licenses-page.test.js` fails until the two versions match the installed package, and the commits are checked by hand.
6. Test thoroughly before deploying

The app itself follows the installed package: the footer's version (`VITE_JSDOS_VERSION`, set in `vite.config.ts`) and the name of the service worker's emulator cache (`JS_DOS_VERSION`, stamped by `scripts/inject-sw-version.js`) both read it, so installing the deploy's worker downloads the new js-dos player and emulator files once, and activating it deletes the old version's cache. `EMULATOR_ASSETS` in `public/sw.js` lists those files: the player's and the default backend's. If the new version renames or drops one of them, update it (the build fails until it matches) and the `wdosbox.wasm` preload in `index.html` (which nothing checks).

## Future Improvements

1. **Testing**: Add visual regression tests
2. **Emulator Abstraction**: The adapter interface still takes js-dos's options and returns its player, and `useDosEmulator` handles js-dos's events itself, so another emulator would first need types of its own
