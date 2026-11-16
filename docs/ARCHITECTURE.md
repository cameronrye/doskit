# DosKit Architecture

## Overview

DosKit runs DOS demoscene classics and the trackers behind them in the browser: a React and TypeScript web app around js-dos, which runs DOSBox compiled to WebAssembly. This document describes the architecture, component hierarchy, data flow, and key design decisions.

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8, which bundles with Rolldown
- **Emulator Core**: js-dos 8 (WebAssembly-based DOSBox), installed from npm
- **PWA**: Service Worker with offline support and caching
- **Look**: VGA design tokens in `src/index.css` (the 16 text-mode colours and what is built on them), with Silkscreen and VT323 from fontsource, bundled and never loaded from Google Fonts
- **Testing**: Vitest with React Testing Library (jsdom), and Playwright in Chromium for the browser tests in `e2e/`

The exact versions are in `package.json` and `package-lock.json`.

## Project Structure

```text
doskit/
├── index.html                   # Preloads wdosbox.wasm, loads js-dos and the app
├── cards-src/                   # A frame of each production running, for its share card
├── e2e/                         # Browser tests (Playwright) and their tools
│   ├── *.spec.ts                # Each production from its link, the app pages, the trackers' files
│   ├── hook.js                  # Watches the emulator through js-dos's API
│   ├── server.mjs               # Serves dist/ as GitHub Pages does
│   └── tools/                   # fingerprints.mjs (setup screens), frames.mjs (frames for cards)
├── public/
│   ├── sw.js                    # Service Worker for PWA functionality
│   ├── manifest.json            # PWA manifest
│   ├── cards/                   # Each production's share card, 1200x630 (committed)
│   ├── demos/                   # App archives (<id>.zip) and where they come from
│   ├── licenses/                # Licenses of js-dos, DOSBox, DOSBox-X and libzip, GPL-2.0 text
│   ├── js-dos.js                # js-dos library (copied from node_modules)
│   ├── js-dos.css               # js-dos styles (copied from node_modules)
│   └── emulators/               # js-dos backends (copied from node_modules)
├── scripts/                     # Build and utility scripts
│   ├── copy-js-dos.js           # Copies js-dos into public/ before dev and build
│   ├── inject-sw-version.js     # Stamps versions and bundles into dist/sw.js
│   ├── check-built-css.js       # CI check of the built CSS against the oldest browsers
│   ├── app-pages.ts             # A page per app and the sitemap, for the appPages plugin
│   ├── generate-app-cards.js    # Share cards from cards-src/ (npm run generate-app-cards)
│   └── generate-app-lists.js    # The app lists in README.md and llms-full.txt
├── src/
│   ├── adapters/
│   │   └── EmulatorAdapter.ts   # Emulator interface and its js-dos adapter
│   ├── apps/                    # One data file per app (<id>.json) and its page text (<id>.page.json)
│   ├── assets/
│   │   └── thumbs/              # A screenshot of each production, <id>.png, for the start page and the production's page
│   ├── components/              # React components
│   │   ├── StartPage.tsx        # The page at /: kinds, search, the grid, the DOS prompt item
│   │   ├── ProductionGrid.tsx   # Productions as links, with one tab stop and arrow-key movement
│   │   ├── ProductionPage.tsx   # A production's page, until Play: facts, download, Play, Share
│   │   ├── RunBar.tsx           # The bar over a running production or the DOS prompt
│   │   ├── DosWindow.tsx        # A blue DOS window, with its title set into the border
│   │   ├── CrtScreen.tsx        # A screenshot in a CRT bezel
│   │   ├── KeyHint.tsx          # A key cap and what it does
│   │   ├── SiteFooter.tsx       # Credits and the Licenses link
│   │   ├── AppInfo.tsx          # The About panel
│   │   ├── DosPlayer.tsx        # Core emulator component
│   │   ├── DosPlayerUI.tsx      # Player loading, error and container markup
│   │   ├── DosPlayerWithApps.tsx # Runs the requested production or the DOS prompt: its page, run bar, start keys, end card
│   │   ├── playerSession.ts     # What DosPlayerWithApps runs, as one reducer
│   │   ├── TrackerFiles.tsx     # A tracker's Files panel
│   │   ├── ErrorBoundary.tsx    # Error handling boundary
│   │   ├── OfflineIndicator.tsx # Network status and install prompt
│   │   └── UpdateNotification.tsx # PWA update notifications
│   ├── config/                  # Configuration files
│   │   ├── apps.config.ts       # App registry (availableApps), built from src/apps
│   │   ├── thumbnails.ts        # An app's screenshot, from src/assets/thumbs
│   │   ├── appPages.ts          # Loads an app's page text when its About panel opens
│   │   ├── jsdos.config.ts      # js-dos options
│   │   └── dosbox.conf.ts       # DOSBox configuration of the default DOS prompt
│   ├── constants/               # Application constants
│   │   └── app.ts               # PWA and UI constants
│   ├── dos-apps/                # DOS application configurations, each exported as dosboxConf
│   │   ├── README.md            # How to add an app
│   │   ├── second-reality.config.ts
│   │   └── impulse-tracker.config.ts ...
│   ├── styles/
│   │   └── tokens.test.ts       # Holds the design tokens to their contrast ratios
│   ├── hooks/
│   │   └── useDosEmulator.ts    # js-dos player lifecycle
│   ├── integration/             # Integration tests
│   ├── test/
│   │   └── setup.ts             # Vitest setup
│   ├── types/                   # TypeScript type definitions
│   │   ├── dos-app.ts           # DosApp
│   │   └── js-dos.d.ts          # js-dos type declarations
│   ├── utils/                   # Utility functions
│   │   ├── describeProgress.ts  # A download's progress as a percentage and a line of text
│   │   ├── diskLoader.ts        # ZIP archive download
│   │   ├── dosboxConfigBuilder.ts # DOSBox config builder and presets
│   │   ├── dosKeys.ts           # js-dos's key codes, by the names the data files use
│   │   ├── dosNames.ts          # DOS names for the files brought into a tracker
│   │   ├── endMarker.ts         # The line an app's autoexec prints when its program ends
│   │   ├── errorMessages.ts     # User-friendly error mapping
│   │   ├── errorTracking.ts     # Error tracking service
│   │   ├── fetchWithRetry.ts    # Network retry logic
│   │   ├── formatSize.ts        # An archive's size, in decimal units
│   │   ├── frameHash.ts         # A frame's fingerprint (FNV-1a)
│   │   ├── globalErrorHandler.ts # Uncaught errors and unhandled rejections
│   │   ├── gridColumns.ts       # How many columns the production grid has, for its arrow keys
│   │   ├── keyQueue.ts          # Keys sent to DOS one at a time
│   │   ├── keysAroundDos.ts     # Keeps the keys of DosKit's controls from js-dos
│   │   ├── lineFeed.ts          # Console output and DOSBox's log, for every listener
│   │   ├── logger.ts            # Centralized logging
│   │   ├── persistQueue.ts      # ci.persist() calls, one at a time
│   │   ├── playLabel.ts         # The Play button's label: Play, Start or Read
│   │   ├── productionFilter.ts  # The kind tabs, the search and the random pick
│   │   ├── savedFiles.ts        # A tracker's saved files in IndexedDB
│   │   ├── serviceWorkerRegistration.ts
│   │   ├── share.ts             # Shares a production's link, or copies it
│   │   ├── startPageState.ts    # The start page's tab, search, scroll and focus, in sessionStorage
│   │   ├── startRecipe.ts       # A production's start keys, once its setup screen is up
│   │   ├── storage.ts           # localStorage that never throws
│   │   ├── updatePrompt.ts      # Mounts UpdateNotification
│   │   ├── urlRouting.ts        # URL routing: reads app links, writes each app's URL
│   │   └── zipFiles.ts          # A ZIP of the files brought into a tracker
│   ├── index.css                # Design tokens (the VGA colours), reset and base styles
│   ├── App.tsx                  # Root component: the start page, or a production or the DOS prompt
│   └── main.tsx                 # Application entry point
├── playwright.config.ts         # Browser test configuration
├── vite.config.ts               # Build configuration: the app pages, the sitemap, 404.html
└── vitest.config.ts             # Test configuration
```

Tests sit next to the code they cover (`*.test.ts`, `*.test.tsx`, and `scripts/*.test.{js,ts}` for the build scripts, the app pages and the plugin that writes `404.html`, the generated app lists, the service worker, the ESLint config, and `index.html`'s metadata, the icons, `robots.txt` and the licenses page). The browser tests in `e2e/` run with Playwright against the production build (see [CONTRIBUTING.md](../CONTRIBUTING.md#browser-tests)). `public/js-dos.js`, `public/js-dos.css` and `public/emulators/` are gitignored: see [js-dos Dependency Strategy](#js-dos-dependency-strategy).

## Component Hierarchy

```text
StrictMode (main.tsx)
└── ErrorBoundary
    └── App (Root)
        ├── OfflineIndicator
        ├── StartPage (at /)
        │   ├── Kinds, the DOS prompt item and the search, as a menu bar
        │   ├── ProductionGrid (a link and a CrtScreen for each production)
        │   ├── The highlighted production (DosWindow)
        │   └── SiteFooter
        └── A production or the DOS prompt (at /<id> or /dos)
            ├── AppInfo (the About panel, a DosWindow and a modal dialog)
            └── ErrorBoundary
                └── DosPlayerWithApps
                    ├── ProductionPage (until Play: CrtScreen, facts, download progress with Cancel, error with Try Again, Play, Share, more by the author)
                    ├── RunBar (Browse, the name, the status and Online or Offline, About, Files, or Licenses at the DOS prompt)
                    └── The player's area under the bar
                        ├── Start hint (the keys to press, once DosKit's start gives up)
                        ├── TrackerFiles (a running tracker's files, a modal dialog)
                        ├── Leave dialog (Browse while a tracker runs)
                        ├── End card (Play again, Browse, Back to DOS)
                        └── DosPlayer (remounted for each session)
                            ├── useDosEmulator
                            └── DosPlayerUI
                                └── js-dos emulator instance

UpdateNotification (a React root of its own, mounted by utils/updatePrompt.ts)
```

App shows the start page or the player, and DosPlayerWithApps is not mounted over the start page, so nothing runs there. Going to the start page unmounts the player, which stops the production and aborts a download under way.

In development, `StrictMode` runs each effect twice when a component mounts, with its cleanup in between, so each DosPlayer starts js-dos twice in its element. `useDosEmulator` stops the first start's player and passes on none of its events, and on a fresh page the adapter holds the second start back until `emulators.js` has run (see [Adapter Pattern](#6-adapter-pattern)). Production builds run each effect once.

What covers what is fixed. From the bottom: the production's page and the run bar, which take no `z-index`, as the page replaces the player until Play and the bar sits above the player's area by layout; js-dos's sidebar; the player's own loading and error panels; js-dos's modals and on-screen controls, and the player in js-dos's soft fullscreen, which covers the run bar; the start hint, the end card and the Leave dialog, over the player's area under the run bar; the About and Files panels with their backdrop; the install prompt; and the offline notices and the update prompt. js-dos's toasts have no `z-index` and stay inside the player. The comment at the top of `src/components/DosPlayerWithApps.css` gives the `z-index` of each layer and the file that sets it, though not of the panels, which `src/components/AppInfo.css` puts at 1100 and 1101; a new overlay belongs in that list.

With `softFullscreen` set, js-dos's fullscreen button has the player fill the window, over the run bar, and js-dos's own layers, its toasts included, then stay inside it. The rule for that is DosKit's, in `src/components/DosPlayer.css`: the button marks the player's element with `jsdos-fullscreen-workaround`, but `js-dos.css` styles that class only on an element inside it.

The pages and the run bar keep clear of the offline banner and the install prompt, which stay above them, by their layout. While either is shown, OfflineIndicator keeps its height, measured with a `ResizeObserver`, in `--offline-banner-height` or `--install-prompt-height` on the root element. The start page and the production's page pad their tops by the banner's and their bottoms by the prompt's, the run bar pads its top by the banner's, and the player's area below it pads its bottom by the prompt's. Every one of them also keeps clear of the notch and the home indicator with `env(safe-area-inset-*)`. In windows under 500px tall the banner keeps to one line, the install prompt (under 450px) to one row, and the start page's header, the production's page and the run bar to one row each.

js-dos listens for keys on `window`, sends each one to DOS and cancels the browser's own handling of it. So that Tab, Enter and Space work on DosKit's controls (the run bar's buttons, the overlays and panels, the notices and the footer's links) and keys meant for them never reach the running program, App's root stops each key pressed on one of them once React has handled it (`keepKeyFromDos` in `src/utils/keysAroundDos.ts`), and so does the update prompt's root. The run bar's controls take no focus from a click, so that keys go on reaching DOS, and there are no single-key shortcuts while DOS runs. A key's release follows its press: `watchKeysAroundDos` keeps from js-dos the release of a key that went down on DosKit's controls, wherever the focus is when it comes up, and lets every other release through, so that DOS neither gets the release of a key it did not have nor keeps one down for good, which DOSBox would repeat. It also stops at `document` the repeats of a key held down on DosKit's controls, which go on wherever the focus goes, such as to the page once a dialog closes under a held Enter: js-dos would send each to DOS as a press, while the release stays with the controls. Keys pressed in the player, or with nothing focused, reach DOS, Tab included, so once DOS has the keys, Tab does not lead back to DosKit's controls.

## Data Flow

### Production Loading Flow

Opening a production, from a link in the grid, a "More by" link, a shared URL, Back or Forward:

1. **App** reads the production from the URL, or takes it from the link that was clicked (which pushes `/<id>`), and passes it to DosPlayerWithApps as `requestedApp`
2. **DosPlayerWithApps** stops whatever is running, the previous production (sound included) or the DOS prompt, and loads the production's archive and DOSBox config itself: `loader(onProgress, signal)` and `loadDosboxConf()`, which import the app's config module lazily. It starts nothing before both are in: a production's page never boots the DOS prompt first, and the status is Loading.
3. **Loader** downloads the app's ZIP archive with `loadZipArchive` (`diskLoader`), which retries through `fetchWithRetry` and fails a download that receives no data for 20 seconds, or a response that is not a ZIP archive. ProductionPage shows how much of the archive has arrived (its share, or the megabytes received when the response gives no Content-Length, from `describeProgress`) and offers Cancel. DosPlayerWithApps also gives up a load whose download has not started 20 seconds after it began, such as one whose config chunk never arrives: the download reports its start as it makes its request, and times itself out from there.
4. **A newer request**, Cancel, Try Again or unmounting aborts the load and drops its result. A request for the production already running, or waiting on its page for Play, changes nothing. Cancel goes to the start page, which unmounts the player, so Back returns to the production and loads it again.
5. **Once loaded**, DosPlayerWithApps makes the files a session with an id of its own. A tracker's session first reads the files it saved before (`preparing`). The session then waits on the production's page (`poster`) until the visitor's click or key press on Play: browsers start sound only within a few seconds of one, and a download can outlast that. Only Try Again, which is such a click, starts a production at once, unless it flashes or has a content note, which its page warns of before it starts.
6. **DosPlayer** mounts when the session runs, keyed by the session's id: unmounting stops the previous player, and `useDosEmulator` starts js-dos with the archive as `initFs` (followed by a tracker's saved files and the files brought into it) and the app's DOSBox config, its autoexec ending with the app's end marker. So Play again starts the same files in a new player. If `emulators.js` has not run yet, as when a link is opened the moment the page loads, the start waits for it (see [Adapter Pattern](#6-adapter-pattern)).
7. **Emulator starts**: on js-dos's `ci-ready` the hook unmutes audio and calls `onReady`, DosPlayerWithApps reports the status `ready`, and the run bar shows Ready until that player is gone. Once js-dos has handed back the player too, the hook hands DosPlayerWithApps a handle with the command interface, the player and the console output, with which it presses the app's start keys and watches for its end (see [Start Keys and the End Card](#start-keys-and-the-end-card)).

If a production fails to load, its page shows why, in an alert, with nothing running behind it; a download that stalls ends there too, as a timeout. Its Try Again, which has the keyboard focus, loads the production again. See [ERROR-HANDLING.md](ERROR-HANDLING.md) for the errors each step can show.

The DOS prompt is the one session with no production: `/dos` asks for none, so DosPlayerWithApps boots it at once, under a run bar titled "DOS prompt" with a Licenses link in place of About. The start page's `C:\> DOS prompt` item opens it. The start page itself runs nothing: App shows StartPage in place of the player, and the status is `idle`.

### Start Keys and the End Card

Twenty-six productions wait at a setup screen for a key, and their data files give the keys (`start`), by the names in `src/utils/dosKeys.ts`, digits included. Keys sent as js-dos reports ready are lost by Second Reality, Crystal Dream 2 and Impulse Tracker, and js-dos has no event for the moment a program reads the keyboard, so `runStartRecipe` (`src/utils/startRecipe.ts`) waits up to 45 seconds for the recipe's signal that the screen is up: the screen's fingerprint (`fnv1a` in `src/utils/frameHash.ts`, over every byte of the RGB frame js-dos hands out, which is the same for the same screen in every browser and at every window size), a line DOS prints, or a line in DOSBox's log followed by a screen at rest. It then sends the keys through `ci.sendKeyEvent()`, one at a time from the queue in `src/utils/keyQueue.ts`, each held and released before the next goes down. `ci.simulateKeyPress()` stamps each release 16 ms ahead, and two presses within those 16 ms wrap the emulator's event clock, which stops its keyboard for good. For 6 seconds after the keys, the recipe checks that the screen went on: a screen not seen while it waited, a change of mode, or sound. A recipe of one key is sent up to 3 times; one of several keys only once, since a second Right would move a menu's choice again. When the signal never comes, or the screen stays, the app's `hint` shows in a bar over the player until it is dismissed. `e2e/tools/fingerprints.mjs` measures the fingerprints in a real browser.

js-dos's exit event fires only when the emulator stops, never when a program returns to DOS. So `withEndMarker` (`src/utils/endMarker.ts`) adds `echo <Name> has ended.` after the last line of each app's autoexec, which must be the config's last section, and DosPlayerWithApps watches the console output for it. js-dos hands its console output only to its first listener, and offers no way to stop listening, so `useDosEmulator` subscribes once and hands the lines out through a line feed (`src/utils/lineFeed.ts`), which gives a later listener the lines it missed. When the marker arrives, DosPlayerWithApps takes the player out of js-dos's fullscreen, if it is in it, and shows the end card: Play again starts the same files in a new session, Browse goes to the start page, and Back to DOS closes the card over the DOS prompt the program returned to.

### Tracker Files

An app with `saveFiles` (the six trackers) keeps what it saves. While its player runs, DosPlayerWithApps asks js-dos for `ci.persist(true)`, a ZIP of every file that differs from what the emulator started with, 3 seconds after the last key or tap, every 30 seconds, and when the tab is hidden or the page goes (`pagehide`). `createPersistQueue` (`src/utils/persistQueue.ts`) makes those calls one at a time, folds the saves asked for during one into a single follow-up, and gives each 10 seconds: two calls in the same tick leave the first one hanging, and a call after the worker has stopped never answers. A bundle that differs from the last one written goes to IndexedDB, in the `saved-files` store of the `doskit` database, under the app's id (`src/utils/savedFiles.ts`). The app's next session reads it before it starts and passes it after the archive in `initFs`, so the saved files replace the archive's. Where IndexedDB is unavailable or full, as in some private windows, the tracker starts without them, and its Files panel says that the browser can't keep files.

The run bar's Files button opens TrackerFiles. Download keeps the files at once and hands the bundle out as `<id>-files.zip`. Bring in modules takes the file types the app's `modules` names, or else the module formats of Impulse Tracker and Scream Tracker 3, and gives each chosen file a DOS path (`dosPathFor` in `src/utils/dosNames.ts`: in the folder `modules` names, such as EdLib's `SONGS`, or else at the root, an 8.3 name in capitals, with `~1`, `~2` and so on in its stem where it needs one to differ from the names in that folder of the archive's entries, the saved files and the files brought in before), and restarts the tracker with them packed into a ZIP of their own after the archive and the saved files (`zipFiles` in `src/utils/zipFiles.ts`): `ci.persist(true)` packs a later bundle's files with the tracker's own saves, but never loose start files, which it counts as the file system it started with. A save a second after the restart keeps them for the next visit. Start over, after asking, deletes the kept files and restarts the tracker with its archive alone. Browse, in the run bar or on the end card, while a tracker runs waits for "Leave _name_?", whose Leave keeps the files first, giving up after 3 seconds; Back and Forward cannot ask.

### URL Routing

`src/utils/urlRouting.ts` reads and writes the URL; App applies it on load and on `popstate`.

- **Three routes**: `/` is the start page, `/<id>` a production's page, and `/dos` the plain DOS prompt (also `/DOS/`, in any letter case, and no production's page may take that name: `PROMPT_SEGMENT`).
- **One URL form**: A production's URL is its page, `/<id>` with the app's id written without hyphens (`/secondreality`), which the build writes as `<id>.html` and GitHub Pages serves at `/<id>` with a 200 (see [Build Process](#build-process)). App also accepts an old `/?app=<id>` link, the hyphenated id, any letter case and `/<id>.html`, and rewrites them to that form without a new history entry, keeping the rest of the query. It also points the page's canonical link at the URL it shows, since opening another production changes the URL without loading that production's page.
- **Other paths on GitHub Pages**: GitHub Pages answers a path it has no file for, such as `/secondreality/` or `/SecondReality`, with `404.html` and a 404 status. The build emits `404.html` as a copy of `index.html` (`githubPagesSpaFallback` in `vite.config.ts`), so the app boots there and rewrites the URL. The Vite dev and preview servers fall back to `index.html` themselves.
- **History**: Opening a production or the DOS prompt from the start page, a link in the grid or a "More by" link, and going to the start page from a production's page or the run bar, push a history entry. The grid's links are real links, so a modified click (Ctrl, Cmd, Shift or the middle button) opens them in a new tab as the browser does and DosKit does not navigate. Back and forward run whatever the URL then names, stopping the running production as soon as the new route shows; the start page stops it and shows itself, with its tab, search, scroll position and focus as they were (`src/utils/startPageState.ts`, in `sessionStorage`).
- **Unknown ids**: An `?app=` parameter decides whenever it is present, even when the path names a production. One that names none, an empty one included, shows the start page with an alert above the grid: `No production called "<value>". Here's everything on DosKit.`, with the value cut to its letters, digits, hyphens and underscores. A value with none of those characters, or with over 100 of them, gets `No production by that name. Here's everything on DosKit.`. The parameter leaves the URL without a new history entry, and so does a path-style production beside it: `/stars?app=` becomes `/`. A path that names no production, such as `/index.html`, is just the start page.

### State Management

DosKit has no React contexts and no state library. Each component keeps the state it owns, App passes what the player needs down as props, and the player reports back through callbacks:

1. **App** - The route (the start page with its notice for a link that named no production, a production, or the DOS prompt), the production whose About panel is open, and the player's status and the Online flag behind the run bar's status
2. **StartPage** - The kind tab, the search, the production with the roving tab stop, and the scroll position, which it keeps in `sessionStorage` as the page goes (`startPageState`). Saved state that is unreadable, of the wrong types or for a production that no longer exists is dropped for the defaults.
3. **DosPlayerWithApps** - What the player runs, in one reducer (`playerReducer` in `src/components/playerSession.ts`): its phase, which is a requested production loading, its load error with the production Try Again loads again, a tracker's saved files being read, the production's page waiting for Play (`poster`), or a running session (a production with its files, DOSBox config, saved files and the files brought into it, or the DOS prompt, each with an id of its own); whether the session's emulator is ready or failed to start; and whether its program has returned to DOS. Beside the reducer it keeps how much of the archive has arrived, the handle js-dos handed out for the running session, the start recipe's state and whether its hint was dismissed, and for a tracker its Files panel, when its files were last kept, and a Browse waiting for Leave
4. **useDosEmulator** - Its loading and error state, and the command interface in a ref (`ciRef`) from `ci-ready` until the player is gone, with the player and the two line feeds of what DOS prints and DOSBox logs, which it hands out together once both halves have arrived (`onHandle`). Each mount's js-dos player lives in that mount's effect, which loses the player's WebGL context and stops it on unmount. The choices made in js-dos's settings panel live in js-dos's own localStorage keys (`jsdos.8.*`), but js-dos reads them only when `js-dos.js` loads, and its options override them, so `getStoredSettings()` in `src/config/jsdos.config.ts` passes each player the saved volume, mouse sensitivity, aspect ratio, image rendering, theme and controls' scale in place of DosKit's defaults. That also gets around js-dos reading any saved theme as dark. Mirror controls has no option to pass, so each new player starts with the value it had when the page loaded.
5. **OfflineIndicator** - The offline banner, the back-online toast and the install prompt. It records install-prompt dismissals in localStorage through `safeLocalStorage`, and while the banner or the prompt is shown, keeps its height on the root element for the pages and the run bar. Screen readers hear the banner as an alert and the toast as a status message.

#### Why No Global State?

- **No additional dependencies** - Uses built-in React features
- **Appropriate scale** - The only shared state is the route, the player's status and the Online flag, and App owns all of them
- **Simpler testing** - Components take props and callbacks, so tests render them directly
- **Type safety** - Props and callbacks are typed like any other function

#### Passing State

```tsx
<DosPlayerWithApps
  requestedApp={currentApp}
  apps={availableApps}
  onBrowse={handleBrowse}
  onOpenApp={(app) => navigate({ view: 'app', app })}
  onAbout={() => setInfoFor(currentApp)}
  isOnline={isOnline}
  onStatusChange={setPlayerStatus}
  className="dos-player"
/>
```

`requestedApp` is the production the route names, or `null` for the DOS prompt. `onBrowse` goes to the start page, with a kind's tab selected when the production's page gives one. `onStatusChange` reports the player's status when DosPlayerWithApps mounts and at each change, and the run bar's status, in a live region that screen readers announce, shows it once a session runs, with Online or Offline beside it. The bar shows the text only when something is not fine (not Ready, or Offline), and says it aloud always. `idle` is the status while nothing runs: on the start page (the status App gives it, as the player is not mounted) and as a production's page waits for Play; `loading` while a production downloads, while a tracker's saved files are read, while an emulator starts, and after DOS has exited until the next start; `ready` once js-dos reports the emulator ready; `error` while the load error or the emulator's start error shows. Each new session is loading until its own emulator is ready. A failure js-dos shows only in its own window, such as a backend file that does not download, sends no event, so the status stays `loading` (see [ERROR-HANDLING.md](ERROR-HANDLING.md#5-component-level-error-states)). App also shows Error once its error boundary has replaced the player, which then reports nothing, until Try Again remounts it. DosPlayerWithApps also takes `onReady` and `onExit`, which App does not pass; `onExit` is called once per `onReady`: when DOS exits, or as soon as unmounting stops a ready player.

## Key Features

### 1. Progressive Web App (PWA)

**Service Worker** (`public/sw.js`, registered in production builds only):

- **Caching Strategy**:
  - Network-first for pages, revalidated with the server (`cache: 'no-cache'`), with a 5-second timeout. The response is passed on as it came, including the 404 that GitHub Pages answers a path it has no file for with, and is never stored: offline or on a timeout, every URL gets the one `index.html` install stored under `/`, an app's page included
  - Cache-first for js-dos's files, its player (`js-dos.js`, `js-dos.css`) and the emulator files it loads, from the cache of the js-dos version the worker installed and never refreshed, so a page gets all of them from one js-dos version until a worker with another version takes over: its next player can then get that version's emulator files until the page reloads
  - Cache-first for demo archives, from a cache of their own, each under a version of its own
  - Cache-first for the hashed bundles in `/assets/`, which include the fonts (Silkscreen and VT323, as woff2) and the productions' thumbnails, and for other WASM files; a miss is fetched and kept as a runtime entry
  - Stale-while-revalidate for other files, such as the manifest and the icons
  - Cross-origin requests and the worker script itself are left to the browser
  - Lookups ignore `Vary`, so a host that answers with `Vary: Origin` (such as `vite preview`) cannot make cached files miss
- **Caches**:
  - `doskit-<build version>` - Install precaches the app shell (`/`, `/manifest.json`, `/logo.svg`, `/favicon.svg`), revalidated with the server so a stale HTTP-cache copy never gets in, and every JS and CSS bundle in `dist/assets`, the lazily imported chunks included, with the fonts (woff2) and the thumbnails (png) there: the start page shows all of them at once, so they are precached as bundles, and it works offline with its screenshots. A bundle that an earlier deploy's cache holds under the same name is copied from there instead of downloaded. Assets fetched later, but not pages, are added as runtime entries. Each deploy that changes the site or the worker gets a new one, and activation deletes the previous deploy's.
  - `doskit-emulators-<js-dos version>` - The js-dos player (`js-dos.js`, `js-dos.css`) and the default backend's files, precached at install; any other emulator file (the DOSBox-X backend) is stored on first use. Deploys keep this cache until js-dos changes, and an install downloads only the files it lacks.
  - `doskit-demos` - Demo archives, stored on first use and never trimmed, each under its address with its version, the first 12 hex digits of the SHA-256 of its bytes (`/demos/<id>.zip?v=<version>`), which the build writes into `DEMO_VERSIONS`. Deploys keep this cache: activation drops the archives a deploy changed or removed, and copies in, from the `doskit-demos-<hash>` caches of older workers, the archives whose bytes are unchanged, before it deletes those caches.
- **LRU Cache**: The deploy's cache holds at most 100 entries. Trimming removes the least recently used runtime entries, by the timestamps kept in `doskit-<build version>-metadata`, and never a precached file. Nothing expires by age.
- **Dynamic Timeouts**: File-type-based network timeouts (30 seconds for WASM and archives, 10 for JS/CSS, 5 for everything else)
- **Offline Support**: Once the worker is installed, the app shell, every bundle, and js-dos with its default emulator are available offline. An app's archive is cached the first time it loads, so an app opens offline once it has been loaded online. The licenses page is not cached: offline, the Licenses link, in the footer or the DOS prompt's run bar, gets the app's page, as every navigation the network cannot answer does.

**Update Mechanism**:

- The build stamps `sw.js` with a cache version that is a hash of the site it made: every file in `dist/` but `sw.js` and the files the worker never stores, which are the pages at the site's root other than `index.html` (the app pages and `404.html`) and `sitemap.xml` (`NEVER_STORED` in `scripts/inject-sw-version.js`); and the worker with what the build injects into it. A deploy that changes the site or the worker installs as a new worker; one that changes neither, such as a merge that only changes Markdown files outside `public/`, writes the same `sw.js` and installs none, and so does one that only changes the app pages or the sitemap. The docs in `public/`, such as `llms-full.txt`, are part of the site, and so are the source maps, which hold the TypeScript the bundles are built from, comments included. The first install takes control at once; a later one waits until the user picks Update Now, or until every tab of the app has closed. A reload alone does not let it take over.
- Update checks every hour while the page is visible (`PWA_CONFIG.UPDATE_CHECK_INTERVAL`), and whenever the page becomes visible again
- An installed update shows the Update Available prompt, which is offered again after a reload while the update still waits
- The prompt is a modal alert dialog that gives Later the focus, as it can appear while someone types into DOS. Escape answers Later, Tab and Shift+Tab stay on its two buttons, and keys pressed in it never reach DOS.
- Update Now posts `SKIP_WAITING` and reloads once the new worker takes control, or after waits of 1, 2 and 4 seconds if it never does
- The new worker then controls every open tab of the app. The others, once they have been offered the update, show "Update Installed: DosKit was updated in another tab. Reload to use the new version.", with Reload and Later, even where the prompt was put off. Update Now in a tab with nothing left waiting reloads it.

**Install Prompt** (`OfflineIndicator`): Offered 5 seconds after the browser's `beforeinstallprompt`, unless the app is installed, the prompt was dismissed in the last 7 days, or it has been dismissed 3 times.

### 2. Error Handling

**Multi-layer approach** (see [ERROR-HANDLING.md](ERROR-HANDLING.md)):

1. **Global error handler** catches uncaught errors and unhandled promise rejections, suppresses known harmless ones such as js-dos's keyboard lock calls, and tracks the rest; the console tracker's report is the one line it logs for each
2. **ErrorBoundary** components catch React errors: one around App, and one in App around DosPlayerWithApps, which tells App when it catches one, so the run bar shows Error
3. **Component error states** show load and start failures where they happen: the production's page and the player. A failed load is explained on the production's page, with the technical message under a collapsed Details line.
4. **Retry logic** with exponential backoff for network requests

### 3. Performance Optimizations

- **Lazy loading**: DOS app configs (and the DOSBox config builder they use) are loaded on demand. Each app's page text is a chunk of its own too, which the About panel imports when it opens
- **Nothing runs unseen**: no emulator runs on the start page or behind a production's page: DosPlayerWithApps starts one only on Play (or Try Again), and going to the start page stops it
- **Code splitting**: React has a chunk of its own (`react-vendor`), whose name stays the same across releases that leave its content alone, so the service worker's install copies it from the previous release's cache
- **Preloading**: `index.html` preloads the default backend's `wdosbox.wasm`, and loads `js-dos.js` deferred at high fetch priority
- **AbortController**: Cancellable fetch requests
- **Retry logic**: Automatic retry with exponential backoff
- **Efficient caching**: js-dos's player and emulator files, each demo archive and the bundles a deploy leaves unchanged stay cached across deploys, and runtime entries are trimmed least recently used first

### 4. Type Safety

- **Strict TypeScript**: All strict compiler options enabled, plus `noUncheckedIndexedAccess` and `noImplicitReturns`; `tsc -b` checks the tests with the same options
- **Type definitions**: Custom types for js-dos API, which `src/types/js-dos.test.ts` holds to the option and player-member names js-dos has, and to the command interface and events of js-dos's emulators package
- **Input validation**: Sanitization to prevent XSS
- **Global declarations**: `window.Dos`, optional because the page runs without it when `js-dos.js` fails to load, and `window.emulators`, which `emulators.js` defines

## Design Patterns

### 1. Lazy Loading Pattern

DOS application configs use dynamic imports to reduce initial bundle size. `src/config/apps.config.ts` builds `availableApps` from the data files in `src/apps/`, which `import.meta.glob` reads into the main bundle, and finds each app's config module through a lazy glob, which Vite turns into an `import()` of each module, a chunk of its own. Each app downloads `/demos/<id>.zip` with `loadZipArchive`, which `apps.config.ts` imports statically from `src/utils/diskLoader.ts`:

```typescript
// The data files, without the page files beside them
const appData = import.meta.glob<AppData>(['../apps/*.json', '!../apps/*.page.json'], {
  eager: true,
  import: 'default',
});
const configModules = import.meta.glob<AppConfigModule>('../dos-apps/*.config.ts');

function appFromData(data: AppData): DosApp {
  const loadConfig = configModules[`../dos-apps/${data.id}.config.ts`];
  // ...
  return {
    id: data.id,
    // ...
    loader: (onProgress, signal) => loadZipArchive(`/demos/${data.id}.zip`, onProgress, signal),
    loadDosboxConf: async () => (await loadConfig()).dosboxConf,
  };
}
```

The page files are left out of that glob, so their text stays out of the main bundle: `src/config/appPages.ts` imports an app's `<id>.page.json` when its About panel opens.

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

- App listens for `popstate` and runs what the URL names. While an app marked `warnBeforeLeaving` (the six trackers) has a ready player, it also listens for `beforeunload`, so that closing or reloading the page asks first: work not yet saved with the tracker's own save lives only in the emulator's memory, and on Windows, Linux and ChromeOS browsers keep keys such as Ctrl+W, Scream Tracker 3's save, for themselves.
- OfflineIndicator listens for `online`, `offline`, `beforeinstallprompt` and `appinstalled`, and reports the network status to App. A `ResizeObserver` on its offline banner and install prompt keeps their heights in `--offline-banner-height` and `--install-prompt-height` for the pages and the run bar.
- `useDosEmulator` receives js-dos events (`emu-ready`, `ci-ready`) through its `onEvent` option, DOS exiting through the command interface's `events().onExit()`, and the console output and DOSBox's log through `events().onStdout()` and `onMessage()`, which it hands out through line feeds
- DosPlayerWithApps subscribes to the running session's console output for its end marker. Its start recipe watches the frames and the sound through `events().onFrame()` and `onSoundPush()`, and the console output or DOSBox's log for its signal. While a tracker runs, it listens on `window` for `keydown` and `pagehide`, and on `document` for `visibilitychange`, to keep the tracker's files (see [Tracker Files](#tracker-files)).
- `keysAroundDos` listens on `window` for key presses and releases, and for the window losing the focus, while App is mounted (see [Component Hierarchy](#component-hierarchy))
- The service worker registration reports installs and updates through `onSuccess`, `onUpdate` and `onOfflineReady`; `main.tsx` passes only `onUpdate`, which shows the update prompt. The prompt then listens for `controllerchange`, which tells it that another tab's Update Now has let the update take over.

### 5. Builder Pattern

DOSBox configurations are built with the fluent builder in `src/utils/dosboxConfigBuilder.ts`. Each app starts from a preset (`demo()` or `musicTracker()`) and overrides what it needs; the builder only offers settings that the default `dosbox` backend applies. `setMachine({ machine, memsize })` writes the `[dosbox]` section, which Panic and the Squid intro use to run on `machine=vgaonly`, and `build()` writes the autoexec last, where the end marker follows it. From `stars.config.ts`, with the autoexec shortened:

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

The adapter also holds back starts that js-dos would lose. js-dos's first `Dos()` call loads its emulators package, `emulators.js`, through a script tag with the id `emulators-js`, and a later call that finds that tag reads the `emulators` global at once (`initEmulatorsJs` in js-dos's `src/store/dos.ts`). Before the script has run, that read fails: the player never boots, and js-dos sends no event to say so. So a start made while the tag is there and the global is not, such as a production opened the moment the page loads, waits for the tag's `load` before it calls `Dos()`. If its player has unmounted by then, the start never calls `Dos()`: `useDosEmulator` aborts a signal when it unmounts, which the adapter checks first, since each `Dos()` call adds document listeners that js-dos never removes and takes the keyboard lock from the player before it. The start that added the tag hands its player back only once the script has run, so that a failure reaches it too. If `emulators.js` fails to download, or runs without defining the global, each of these starts fails with an error that says so (see [ERROR-HANDLING.md](ERROR-HANDLING.md#5-component-level-error-states)), a player already made is stopped, and the tag is removed, so that the next start downloads `emulators.js` again.

## Security Considerations

1. **Input Sanitization**: URL parameters validated and sanitized: the `?app=` value and the first path segment
2. **XSS Prevention**: Only alphanumeric characters, hyphens, underscores allowed, at most 100 of them
3. **Content Security Policy**: None, for now. GitHub Pages cannot send response headers, but a `<meta http-equiv="Content-Security-Policy">` tag in the built `index.html` could carry every directive except `frame-ancestors`, `report-uri` and `sandbox`. js-dos limits what such a policy could protect: `emulators.js` runs the backend's script through `eval`, so `script-src` would have to allow `'unsafe-eval'`, not only the `'wasm-unsafe-eval'` that compiling WebAssembly needs, and it starts the emulator's Web Worker from a `blob:` URL, which `worker-src` would have to allow. The policy could only go into the build, since Vite's React plugin adds an inline script to the dev server's page, and none has been checked in Firefox. [SECURITY.md](../SECURITY.md#browser-security) gives what a policy must allow. There is also little for one to stop today: everything the page loads comes from its own origin, as `pathPrefix` and `noCloud` in `src/config/jsdos.config.ts` keep js-dos off its own servers, and what the page takes from the URL is cut to the characters in item 2.
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
3. **Vite build**: Rolldown bundles the app into hashed files in `dist/assets`, for the browsers in [Browser Compatibility](#browser-compatibility), with hidden source maps, and `public/` is copied as it is. The `appPages` plugin in `vite.config.ts` writes a page per app at the root of `dist/`, `<id>.html` with the id's hyphens removed (`scripts/app-pages.ts`): the built `index.html` with the app's title, description, canonical URL, Open Graph and Twitter tags, share card (`/cards/<id>.png`) and JSON-LD, and the app's text in `#root` for crawlers that run no scripts, which React replaces when it boots. Each tag it rewrites must be in `index.html` exactly once, or the build fails. The plugin also writes `sitemap.xml`, the start page and every app page, and fails the build when an app's id would take a name the site already uses, such as a file or directory at its root or a name kept for its own pages (`findPageCollisions`). `githubPagesSpaFallback` adds `404.html`, a copy of `index.html`, for the paths no page answers, and the licenses of the packages bundled into the app go to `dist/licenses/third-party-licenses.txt`, which the licenses page links.
4. **Service worker versioning**: `scripts/inject-sw-version.js` stamps `dist/sw.js` with its cache version, the installed js-dos version and each demo archive's version (`DEMO_VERSIONS`), and appends every JS and CSS bundle, font and thumbnail in `dist/assets` to its precache list. The cache version is a hash of every file in `dist/` but `sw.js`, the app pages, `404.html` and `sitemap.xml`, by path and bytes, and of `sw.js` with what is injected into it, with no build time or commit, so two builds of the same tree write the same `dist/`. It fails the build if `sw.js` lacks a placeholder or would precache a file that is not in `dist/`, since one missing file stops the worker from installing.
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
5. Update the version where it is written by hand: `git grep` the old one. It is in `README.md`'s and `ROADMAP.md`'s notes on js-dos's behaviour, `public/llms.txt`, `public/llms-full.txt` and comments in `src/adapters/EmulatorAdapter.ts`, `src/adapters/EmulatorAdapter.test.ts`, `src/config/jsdos.config.ts`, `src/config/jsdos.config.test.ts`, `src/types/js-dos.d.ts` and `src/types/js-dos.test.ts`. The tests that use it only as sample data keep it. `docs/js-dos-llm-reference.md` is a copy of a third-party reference for that version: check its DosKit notes again. `public/licenses/index.html` names the js-dos version and the emulators release it was built with (`devDependencies.emulators` in js-dos's `package.json`), and links their sources and the DOSBox and DOSBox-X commits that release builds: `scripts/licenses-page.test.js` fails until the two versions match the installed package, and the commits are checked by hand.
6. Test thoroughly before deploying

The app itself follows the installed package: the footer's version (`VITE_JSDOS_VERSION`, set in `vite.config.ts`) and the name of the service worker's emulator cache (`JS_DOS_VERSION`, stamped by `scripts/inject-sw-version.js`) both read it, so installing the deploy's worker downloads the new js-dos player and emulator files once, and activating it deletes the old version's cache. `EMULATOR_ASSETS` in `public/sw.js` lists those files: the player's and the default backend's. If the new version renames or drops one of them, update it (the build fails until it matches) and the `wdosbox.wasm` preload in `index.html` (which nothing checks).

## Future Improvements

1. **Testing**: Add visual regression tests
2. **Emulator Abstraction**: The adapter interface still takes js-dos's options and returns its player, and `useDosEmulator` handles js-dos's events itself, so another emulator would first need types of its own
