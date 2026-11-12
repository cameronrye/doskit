# Performance Optimizations

This document details the performance optimizations implemented in DosKit: how it sets up DOSBox, js-dos and the browser for DOS emulation, and what each setting does.

## Overview

The optimizations cover three layers:

- The DOSBox configuration each app runs with (sections 1 to 3)
- The options DosKit gives js-dos (sections 4 and 5)
- How the browser loads and caches the site (sections 6 to 8)

Nothing in the repository measures what they gain: there are no benchmarks, and no test times a page load, a player's start or a frame. So the sections below say what each optimization changes, not how much faster it makes DosKit.

## Key Optimizations Implemented

### 1. Simple CPU Core with Fixed Cycles

**Status:** ✅ Enabled by default

**Performance Gain:** No speed-up: the default backend has no dynamic core (below). What fixed cycles give is a steady emulated speed (Benefits).

**Configuration:**

```ini
[cpu]
core=simple
cputype=auto
cycles=25000
```

**What it does:** Emulates a fixed number of instructions per millisecond (`cycles`) on DOSBox's simple core. This is the default DOS prompt's configuration (`src/config/dosbox.conf.ts`); the `musicTracker()` and `demo()` presets in `src/utils/dosboxConfigBuilder.ts` use the same core with 18000 and 30000 cycles. Each app's config in `src/dos-apps/` can override them: the two trackers keep fixed cycles on the simple core, Impulse Tracker the preset's 18000 and Scream Tracker 3 12000. Second Reality runs a fixed 24000 on the simple core, about a 486DX2-66, and Crystal Dream 2 `cycles=max` on `core=auto`. StarPort BBS Intro II, Unreal, Panic and the 3D rotation demo run a fixed 30000 on `core=auto`, and only the Squid intro and the starfield keep `cycles=auto`, which holds a program in real mode at 3,000 cycles a millisecond.

**No dynamic core:** js-dos's default backend (`dosbox`, `wdosbox.wasm`), which every app runs on, only has the `auto`, `normal` and `simple` cores. DOSBox resets a value it does not accept to the setting's default without a warning, and this backend's default core is `simple`, so the `core=dynamic` these configs used to ask for always ran the simple core: nothing was ever recompiled. `core=auto` cannot switch to a dynamic core either.

**Benefits:**

- A program runs at the speed its config gives it, whatever the device, as long as the device keeps up

**Fixed, `max` or `auto`?**

A fixed number runs the program at that speed throughout. `max` gives it as many cycles as the device can run, and `auto` gives a program 3,000 cycles a millisecond until it switches the CPU to protected mode, and `max` from then on. Which one an app needs depends on the program, not on a general rule: Crystal Dream 2 runs at `max`, while Panic plays no sound there and Second Reality showed the wrong palette for about 12 seconds near 1:30 in most runs, so it runs at a fixed 24000; and at `auto` Unreal's and Panic's effects fall seconds behind their music. [`src/dos-apps/README.md`](../src/dos-apps/README.md) says how to choose for a new app.

---

### 2. Optimized Audio Configuration

**Status:** ✅ Enabled by default

**Performance Gain:** Not measured. A larger prebuffer keeps more audio in hand inside DOSBox, at the cost of latency (see Trade-offs).

**Configuration:**

```ini
[mixer]
rate=44100
prebuffer=64
```

**What it does:**

- Mixes at 44.1 kHz, the backend's default rate
- Keeps 64 ms of audio on top of the mixer's block, where DOSBox's default is 40 (it accepts up to 100)
- Sets no `blocksize`, which this backend's mixer ignores: it always works in blocks of 2048 samples

**Benefits:**

- Every app mixes its sound as the DOS prompt does: both presets use these settings, and no app's config changes them

**Key Findings**, from booting the backend with these settings:

- `blocksize` changes nothing on this backend: booted with `blocksize` 256, 2048 or 8192, it sends the page the same pushes of sound, 512 samples or more each, at 44,100 samples a second
- `prebuffer` goes from 0 to 100: DOSBox lowers anything higher to 100 and raises a negative value to 0, without a warning; left out, it is 40
- `rate=44100` is CD quality, and the backend's default. The backend has eight rates (8000, 11025, 16000, 22050, 32000, 44100, 48000 and 49716 Hz) and resets any other to 44100 without a warning, for `oplrate`, `pcrate` and `tandyrate` too

**Trade-offs:** Higher audio latency, from buffers in two places. Inside DOSBox, the mixer keeps the prebuffer, 64 ms or 2,822 samples at 44.1 kHz, on top of its 2048-sample block. On the page, js-dos queues the samples it receives, starts playing once 2048 have arrived, and plays them through a `ScriptProcessorNode` in 2048-sample buffers; it drops pushes that arrive while 6144 samples or more (about 139 ms) are waiting. How much latency that adds up to has not been measured, nor whether the larger prebuffer spares any dropout on this backend. js-dos plays a single channel, so the sound is mono.

---

### 2a. MOD Music Playback Optimization

**Status:** ✅ Available via `musicTracker` preset

**Performance Gain:** Not measured

**Configuration:**

```typescript
import { presets } from './utils/dosboxConfigBuilder';

const config = presets.musicTracker().build();
```

**DOSBox Settings:**

```ini
[cpu]
core=simple
cputype=auto
cycles=18000

[dos]
umb=true
ems=true
xms=true

[mixer]
nosound=false
rate=44100
prebuffer=64
```

The preset also configures a Sound Blaster 16 and the PC speaker, and turns off the Gravis UltraSound and the joystick.

**What it does:**

- Runs at a **fixed 18000 cycles**, which Impulse Tracker keeps; Scream Tracker 3's config lowers it to 12000
- Runs on the **simple CPU core** with the **auto CPU type**: the default backend has no Pentium type and resets `cputype=pentium` to `auto`
- Keeps the same **64 ms prebuffer** as the DOS prompt (DOSBox accepts up to 100)
- **EMS and XMS**, where trackers keep their samples, out of DOSBox's default 16 MB of memory (the backend has no `[memory]` section; its memory setting is `memsize` in `[dosbox]`)

**Benefits:**

- A tracker gets the memory it keeps its samples in: Impulse Tracker's `IT.TXT` asks for an EMM driver for EMS, and Scream Tracker 3's `ST3.DOC` for some EMS, even with a Gravis UltraSound
- One starting point for every tracker, which an app's config adjusts: Scream Tracker 3 adds a Gravis UltraSound, the card it plays through

**Use Cases:**

- The two trackers DosKit runs, Impulse Tracker and Scream Tracker 3
- Other trackers and music programs added later: [`src/dos-apps/README.md`](../src/dos-apps/README.md) describes how to add an app

---

### 3. Scaler Settings (Backend Default)

**Status:** ✅ Always on: these are the default backend's own defaults

**Performance Gain:** None from the setting itself: the backend has no software scalers to turn off

**Configuration:**

```ini
[render]
scaler=none
aspect=false
```

**What it does:** States what the backend does anyway. `none` is the only scaler it accepts, and the one it has when the line is left out; aspect correction is off by default too, so DOSBox hands js-dos each frame at the program's own resolution. js-dos's DOSBox lists no other scaler: `normal2x` and `normal3x` sit behind `#ifndef JSDOS` in its `src/dosbox.cpp`, and the backend's WebAssembly holds none of the advanced scalers' names. DOSBox resets a value it refuses, `normal2x` included, to the defaults of the setting's parts, so `config -get render scaler` then reports `normal2x`, a name this backend only keeps as that default; the frames keep the program's resolution either way. Only the default DOS prompt's configuration states these lines; the presets leave `[render]` at the same defaults. js-dos draws each frame into a canvas of that same size (section 4), and the browser scales the canvas to the player: js-dos sets its CSS width and height to fit the player at the aspect ratio of its `renderAspect` option, `'4/3'` in `src/config/jsdos.config.ts`, and its CSS `image-rendering` to the `imageRendering` option, `'pixelated'`, so the pixels are not smoothed. A user who picks another aspect ratio or image rendering in js-dos's settings panel keeps that choice instead.

**Benefits:**

- DOSBox spends no time on software scalers: the browser scales the canvas

---

### 4. WebGL Rendering Backend

**Status:** ✅ Enabled by default

**Configuration:**

```typescript
renderBackend: 'webgl';
```

**What it does:** js-dos uploads each frame to a WebGL texture and draws it into the canvas, at most once per display frame: a frame that arrives before the last one was drawn takes its place. With Canvas 2D (`renderBackend: 'canvas'`), it converts every frame it receives to RGBA in a JavaScript loop and puts it on the canvas with `putImageData()`. Either way the canvas has the frame's own size, and the browser scales it to the player (section 3).

**Benefits:**

- No JavaScript loop over each frame's pixels: the frame goes to the GPU as DOSBox sent it, RGB or RGBA
- At most one draw per display frame, however many frames arrive

**Fallback:** js-dos falls back to Canvas 2D when its WebGL renderer cannot start, for example when the browser gives it no WebGL context

**Releasing contexts:** js-dos's `stop()` leaves the canvas's WebGL context alive, and the document listeners it never removes keep the canvas reachable, so every app switch used to leave a live context behind, and from the 17th Chrome lost the oldest with "WARNING: Too many active WebGL contexts. Oldest context will be lost." `useDosEmulator` now loses each canvas's context through `WEBGL_lose_context` before it stops a player, and Chrome no longer warns, checked over 20 switches. Safari still counts a lost context until it is garbage-collected, and a stopped player stays reachable, so from the 17th player in a page it logs "There are too many active WebGL contexts" and "loseContext: context already lost" at each switch.

---

### 5. Worker Thread Mode

**Status:** ✅ Enabled by default

**Configuration:**

```typescript
workerThread: true;
```

**What it does:** Runs the emulator in a Web Worker separate from the main UI thread: js-dos starts it with its emulators package's `dosboxWorker` rather than `dosboxDirect`.

**Benefits:**

- DOSBox's emulation runs off the page's main thread, which keeps the page's own work, such as React's rendering and input handling, from waiting on it
- js-dos still draws every frame on the page's main thread (section 4)

---

### 6. WASM Module Preloading

**Status:** ✅ Enabled

**Performance Gain:** The default backend's WebAssembly module starts downloading with the page, rather than when the first player asks for it. How much sooner a player starts has not been measured.

**Implementation** (`index.html`):

```html
<!-- Preload the WASM module for the default "dosbox" backend -->
<link rel="preload" href="/emulators/wdosbox.wasm" as="fetch" crossorigin />

<!-- js-dos JavaScript (local copy, loaded before React app) -->
<script src="/js-dos.js" defer fetchpriority="high"></script>
```

**What it does:** Starts downloading the default backend's WebAssembly module while the page is still loading. When a player starts, js-dos's `emulators.js` requests the same file from the page with an `XMLHttpRequest`, which matches the preload's `as="fetch"` and `crossorigin`, so Chromium answers it with the preloaded response; it compiles the module and hands it to the emulator's Web Worker. DOSBox-X (`wdosbox-x.wasm`, several times larger) is not preloaded: every app runs on the default backend.

`js-dos.js` is a classic script, loaded with `defer` so that it does not block the HTML parser. Deferred scripts run in document order, so it still runs before the app's module script, which comes later in the document (at the end of `<head>` in the build, of `<body>` on the dev server), and `window.Dos` exists when the first player mounts. Chrome fetches deferred scripts at low priority, and the app has to wait for this one, so `fetchpriority="high"` keeps the priority it had as a blocking script.

The built `index.html` also gets `<link rel="modulepreload">` tags from Vite, for the app's own chunks: the React vendor chunk and the Rolldown runtime (see section 8).

Chrome warns in the console that the module "was preloaded using link preload but not used within a few seconds" when no player starts that soon after the page loads: on the start page, where nothing runs until an app is picked or the selector closes, on a Play screen waiting for its click, or while a deep link's archive is still downloading or after a load that failed. A player that starts later still uses the preloaded response; the file is not downloaded twice.

Safari (WebKit) does not answer `emulators.js`'s request from the preload, and logs that the file was preloaded but not used on every page load, even when a player starts at once. A first visit in WebKit downloads the 1.46 MB file twice, both under `vite preview`, which sends `Cache-Control: no-cache`, and from a server that sends GitHub Pages' caching headers (`max-age=600` and an ETag), where Chromium downloads it once. Once the service worker is installed, it answers both requests from its emulator cache (section 7). The preload stays for Chromium's sake, where the first player gets the module sooner.

**Benefits:**

- In Chromium, by the time the first player asks for the module, it is downloading or already in

---

### 7. Service Worker Caching

**Status:** ✅ Enabled in production builds

**Performance Gain:** Repeat visits load the bundles, js-dos and every demo already played from Cache Storage, and the app works offline

**Implementation:** `public/sw.js`, which `scripts/inject-sw-version.js` completes at build time

**What it does:** Keeps the app, js-dos and the demo archives in caches of their own, each named, or for the demo archives each entry keyed, so that it lasts as long as its contents:

| Cache                               | Holds                                                                                                                                                | Filled                                                                           | Replaced when                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `doskit-<build>`                    | `/` (the app's `index.html`), `manifest.json`, `logo.svg`, `favicon.svg` and every JS and CSS bundle; other files the app fetches, but no pages      | On install, copying the bundles an earlier deploy's cache holds, then at runtime | A deploy changes the site or the worker              |
| `doskit-emulators-<js-dos version>` | The js-dos player (`js-dos.js`, `js-dos.css`) and the default backend: `wdosbox.wasm`, `wdosbox.js`, `wlibzip.wasm`, `wlibzip.js` and `emulators.js` | On install, downloading only what it lacks                                       | js-dos changes                                       |
| `doskit-demos`                      | Demo archives (`/demos/<id>.zip`), each under a version of its own, a hash of its bytes (`?v=` and its first 12 hex digits)                          | The first time each app loads                                                    | Never; an archive goes when it changes or is removed |

Each request is answered by one strategy:

- **Pages** (navigations): network first, revalidated with the server (`cache: 'no-cache'`), with a 5-second timeout. A page is passed on as it came, including the 404 GitHub Pages answers a path it has no file for with, such as `/SecondReality` (its `404.html` is a copy of `index.html`), and never stored; an app's page, `/<id>`, comes with a 200. When the network fails or times out, the `index.html` install stored answers whatever the URL, so the app opens at any URL.
- **js-dos's files** (`/js-dos.js`, `/js-dos.css` and `/emulators/`) and **demo archives** (`/demos/*.zip`): cache first, each from its own cache. A miss fetches the file revalidated with the server, so an HTTP cache copy from an earlier deploy cannot slip in, and stores it once the whole file has arrived, so a cancelled download never leaves part of one behind. Chromium does not pass the page's cancel on to the worker, so there the download finishes and is stored anyway. js-dos's files are never refreshed: every load gets the player and the emulator files of the js-dos version its worker installed, until an update takes over with its own.
- **Bundles** (`/assets/`) and **other WebAssembly**: cache first, from any of the worker's caches. A bundle's name changes with its content, so a cached copy never goes stale. A miss is fetched from the network and stored in the build's cache.
- **Everything else** from the site, such as the manifest, icons and images: stale-while-revalidate, answered from the cache and refreshed in the background.
- The worker script itself, and requests to other sites, are never intercepted.

Details that keep the caches right:

- Install revalidates the files whose names never change (`cache: 'no-cache'`), so a worker installed within the 10 minutes GitHub Pages lets browsers reuse a file cannot store the previous deploy's `index.html`. A hashed name always means the same content, so install first copies each bundle an earlier deploy's cache holds under the same name, and downloads only the rest, from the HTTP cache where it has them. That seldom helps across deploys: GitHub Pages gives every file a new ETag on each deploy, so once the 10 minutes are up, a bundle is downloaded again in full.
- The build lists every JS and CSS file in `dist/assets` for install, the lazily imported chunks too (section 8), so an app opened offline finds its config; source maps are left out. The build fails when the worker would precache a file that is not in `dist/`, because a single 404 stops `cache.addAll()` and the worker would never install.
- The build's cache is trimmed to 100 entries by removing the runtime entries used least recently (their last use is recorded in `doskit-<build>-metadata`); what install stored is never removed. The emulator and demo caches are not trimmed.
- The build names the deploy's cache after a hash of the site it made: every file in `dist/` but `sw.js` and the files the worker never stores, the app pages and `404.html` at the site's root and `sitemap.xml`; and the worker with what is injected into it. A deploy that changes neither the site nor the worker, such as one that only changes Markdown files outside `public/`, or only the app pages or the sitemap, so writes the same `sw.js`, and browsers install no new worker and offer no update. The docs in `public/`, such as `llms-full.txt`, are part of the site, and so are the source maps, which hold the TypeScript the bundles are built from, comments included.
- Activating a new worker deletes every other `doskit-*` cache: earlier deploys and other js-dos versions. In the demo cache it deletes the archives the deploy changed or removed, and first copies into it, from the `doskit-demos-<hash>` caches of workers from before each archive had a version of its own, the archives whose bytes are unchanged. An updated worker waits until the user picks Update Now in the update prompt, or until every tab of the app has closed; a reload alone does not let it take over.
- Lookups ignore `Vary`. Chrome sends `Origin` with `index.html`'s crossorigin requests (its module scripts, its stylesheet and the wasm preload) while install's requests carry none, so on a host that answers `Vary: Origin`, such as `vite preview`, every precached bundle would miss. GitHub Pages only sends `Vary: Accept-Encoding`.
- DOSBox-X is not precached: js-dos offers its backend picker only before a run, which `autoStart` skips, so users cannot switch to it. If anything requests it, it is cached on first use like any emulator file.

**Benefits:**

- Repeat visits only wait on the network for the page itself
- A deploy downloads only the bundles whose names it changed: one that keeps js-dos does not download its player or emulator files again, and one that changes a demo archive downloads only that archive again, the next time its app opens. One that changes nothing the site serves installs no worker at all.
- The app opens offline at any URL, and an app plays offline once its archive is cached

---

### 8. Code Splitting

**Status:** ✅ Enabled

**Performance Gain:** A smaller first download, and a React chunk that stays cached across releases

**Configuration** (`vite.config.ts`):

```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'react-vendor', test: /node_modules[\\/]react(-dom)?[\\/]/ }],
        },
      },
    },
  },
});
```

**What it does:**

- React and React DOM, with the scheduler they import, get a chunk of their own, `react-vendor-<hash>.js`. Its name follows its content: React itself, the file name of the Rolldown runtime chunk it imports, and the short names Rolldown gives its exports. A release that leaves these alone need not download it again: the service worker's install copies it from the previous release's cache (section 7).
- `src/config/apps.config.ts` loads each app's config module (`src/dos-apps/<id>.config.ts`) through `import.meta.glob`, which Vite turns into an `import()` of each, so each is a small chunk of its own, downloaded when the app loads or when the selector preloads it after a 150 ms hover. The DOSBox config builder is a chunk they share. Each app's page text, `src/apps/<id>.page.json`, is a chunk of its own too, which the About panel imports when it opens.
- The archive loader (`src/utils/diskLoader.ts`) is imported statically by `apps.config.ts`, so it is part of the entry chunk, like the default DOS prompt's config. Before its archive starts downloading, an app needs two chunks, its own config and the DOSBox config builder's, which Vite fetches in parallel; the builder's comes once per page.
- The service worker precaches every chunk (section 7), so an app can still load its config offline.

**Benefits:**

- Less JavaScript to download before the first render
- React stays cached across releases that leave its chunk unchanged
- Each app's code is fetched only when it is needed

---

## Performance Metrics

No optimization here has been measured, so this section gives no figures for rendering, startup time, audio quality or responsiveness; [Testing and Validation](#testing-and-validation) describes how to measure them. What needs no measurement is where repeat loads come from: Cache Storage instead of the network, offline too (section 7).

There is no CPU speed gain to list: the default backend has no dynamic core, so DOSBox's interpreting cores emulate the CPU (see section 1).

---

## Browser Compatibility

Every browser DosKit supports, from the minimum versions in the README's [Browser Compatibility](../README.md#browser-compatibility) on, has all four:

| Feature        | Chrome | Firefox | Safari | Edge |
| -------------- | ------ | ------- | ------ | ---- |
| WebGL          | ✅     | ✅      | ✅     | ✅   |
| Worker Threads | ✅     | ✅      | ✅     | ✅   |
| WASM Preload   | ✅     | ✅      | ✅     | ✅   |
| Service Worker | ✅     | ✅      | ✅     | ✅   |

Safari has the preload, but js-dos's request for the module does not use it (section 6).

**Fallback Strategy:** Where WebGL cannot start, js-dos draws with Canvas 2D (section 4). Older browsers are not supported: they lack `structuredClone()`, which js-dos's player calls once a second while it runs, so each of those calls fails with an error.

---

## Configuration Reference

### js-dos Options

Four of the options in `defaultJsDosConfig` (`src/config/jsdos.config.ts`), with what each does:

```typescript
{
  backend: 'dosbox',           // DosKit's DOSBox configs are written for it; sw.js precaches no other
  workerThread: true,          // The emulator runs in a Web Worker; frames are drawn on the page
  renderBackend: 'webgl',      // Canvas 2D if WebGL cannot start
  imageRendering: 'pixelated', // The canvas has the DOS resolution: scaled up without smoothing
}
```

### DOSBox Configuration

The default DOS prompt's settings, from `src/config/dosbox.conf.ts`:

```ini
[cpu]
# The default backend has no dynamic core
core=simple
cputype=auto
# A fixed speed, in cycles per millisecond
cycles=25000

[render]
# The only scaler the backend has; the browser scales the canvas
scaler=none
aspect=false

[mixer]
# The backend's default rate
rate=44100
# Milliseconds of audio on top of each block: 40 by default, up to 100
prebuffer=64
```

DOSBox only treats a line that starts with `#` as a comment. A comment after a value becomes part of it, which makes a word value such as `core=normal` invalid, and DOSBox resets it to the default without a warning.

---

## Future Optimization Opportunities

These have been considered but not implemented. The first two are options for compiling js-dos's emulators, which DosKit does not build: it copies the builds in js-dos's npm package. Which options those builds use, and what either would gain, has not been checked.

### 1. SIMD Support (Not Implemented)

- **Potential Gain:** Not measured
- **Complexity:** Requires recompilation with `-msimd128`
- **Risk:** Increases binary size, requires browser support

### 2. Emscripten -O3 Optimization (Not Implemented)

- **Potential Gain:** Not measured
- **Complexity:** Requires recompilation of js-dos
- **Risk:** May increase binary size

### 3. SharedArrayBuffer Threading (Not Recommended)

- **Potential Gain:** Limited by DOSBox's single-threaded architecture
- **Complexity:** Very difficult, requires COOP/COEP headers
- **Risk:** High deployment complexity, iOS incompatibility

### 4. OffscreenCanvas Rendering (Needs js-dos Support)

- **Potential Gain:** Frees the main thread from drawing frames
- **Complexity:** js-dos draws every frame with WebGL on the page's own canvas, on the main thread, and runs only the emulator in its Web Worker. It would have to hand that canvas to the worker, and it has no option for that, so DosKit sets none
- **Risk:** Depends on js-dos adding it

---

## Testing and Validation

To validate these optimizations:

1. **Use Chrome DevTools Performance Profiler**
   - Record a session
   - Look for frame drops and long tasks
   - Verify worker thread is handling emulation

2. **Monitor Frame Times**
   - Target: Consistent 60 FPS
   - Check for frame drops during intensive operations

3. **Test Audio Quality**
   - Listen for crackling, popping, or stuttering
   - Verify smooth playback during CPU-intensive tasks

4. **Measure Startup Time**
   - Time from page load to emulator ready
   - Compare with and without preloading

5. **Cross-Browser Testing**
   - Test on Chrome, Firefox, Safari, Edge
   - Test the oldest versions the README supports, and the Canvas 2D renderer js-dos falls back to (`renderBackend: 'canvas'` selects it)
   - Test on mobile devices

6. **Check Caching and Offline Use**
   - Run a production build (`npm run build`, then `npm run preview`); the service worker is not registered on the dev server
   - In DevTools > Application > Cache Storage, look for the `doskit-`, `doskit-emulators-` and `doskit-demos` caches
   - Go offline, reload, and open an app you have played before

---

## References

Background on the techniques above:

- [Emscripten Optimization Documentation](https://emscripten.org/docs/optimizing/Optimizing-Code.html)
- [DOSBox Performance Wiki](https://www.dosbox.com/wiki/Performance)
- [WebAssembly Performance Patterns](https://web.dev/articles/webassembly-performance-patterns-for-web-apps)
- [js-dos Documentation](https://js-dos.com)

DOSBox's own builds have settings that js-dos's default backend lacks, such as the dynamic core (section 1), so advice written for them does not always apply to DosKit.

---

Made with ❤️ by [Cameron Rye](https://rye.dev/)
