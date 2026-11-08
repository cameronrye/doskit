<div align="center">
  <img src="public/logo.svg" alt="DosKit Logo" width="200"/>
</div>

# DosKit

A robust, cross-platform foundation for running DOS applications using js-dos WebAssembly technology. This project works seamlessly across different platforms (Windows, macOS, Linux) and devices (desktop, mobile, tablet).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![js-dos](https://img.shields.io/github/package-json/dependency-version/cameronrye/doskit/js-dos?color=green)
![React](https://img.shields.io/github/package-json/dependency-version/cameronrye/doskit/react?color=blue)
![TypeScript](https://img.shields.io/github/package-json/dependency-version/cameronrye/doskit/dev/typescript?color=blue)

## Features

- **Interactive DOS Prompt**: Boots directly to a fully functional DOS command prompt
- **Cross-Platform**: Works on Windows, macOS, Linux, iOS, and Android
- **Progressive Web App (PWA)**: Install as a native app with offline support
- **Deep Linking**: Load specific applications directly via URL (e.g., `?app=secondreality`)
- **Offline Functionality**: Works completely offline after first visit
- **Modern Tech Stack**: Built with React 19, TypeScript, and Vite
- **WebAssembly Performance**: Leverages js-dos for near-native DOS emulation
- **Full Keyboard Support**: All standard DOS keyboard inputs including function keys and special characters
- **Audio Support**: Sound Blaster and AdLib emulation with proper audio output
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Touch Controls**: Mobile-friendly on-screen keyboard for touch devices
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Service Worker Caching**: Fast loading with intelligent cache management

## Table of Contents

- [Quick Start](#quick-start)
- [Live Demo](#live-demo)
- [PWA Features](#pwa-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Usage](#usage)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js 24+ (see `.nvmrc`)
- npm, which comes with Node.js (dependencies are locked in `package-lock.json`)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/cameronrye/doskit.git
cd doskit
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

The DOS emulator will automatically load and present an interactive DOS prompt!

## Live Demo

**Try it now**: [https://doskit.net/](https://doskit.net/)

The live demo is automatically deployed from the `main` branch using GitHub Actions. Every push to `main` runs the CI checks and deploys once they pass.

## PWA Features

DosKit is a fully-featured **Progressive Web App** that can be installed on your device and works offline!

### Key PWA Features

- **Installable**: Install DosKit as a native app on desktop and mobile
- **Offline Support**: Works completely offline after first visit
- **Fast Loading**: Service worker caches assets for instant loading
- **Native Experience**: Standalone mode without browser UI
- **Auto-Updates**: Automatic updates when new versions are available
- **Connection Status**: Real-time online/offline indicator

### Quick Install

**Desktop (Chrome/Edge/Brave):**

1. Visit the live demo
2. Click the install icon (⊕) in the address bar
3. Click "Install" to add to your desktop

**Mobile (Android):**

1. Visit the live demo in Chrome
2. Tap "Add to Home screen" from the menu
3. Launch from your home screen

**Mobile (iOS):**

1. Visit the live demo in Safari
2. Tap Share → "Add to Home Screen"
3. Launch from your home screen

### PWA Documentation

DosKit includes Progressive Web App (PWA) capabilities for offline functionality and app-like experience. See the main documentation sections above for PWA-related features.

## Technology Stack

### Core Technologies

- **[React 19](https://react.dev/)** - Modern UI framework with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite 8](https://vite.dev/)** - Next-generation frontend tooling, bundling with Rolldown
- **[js-dos 8](https://js-dos.com/)** - WebAssembly DOS emulator
- **[Vitest](https://vitest.dev/)** - Test runner, with jsdom and Testing Library

`package.json` pins their exact versions.

### Why These Technologies?

#### React + Vite

- **Fast Development**: Hot Module Replacement (HMR) for instant feedback
- **Modern Build**: Optimized production builds with code splitting: React gets a chunk of its own, and each app's configuration is a separate chunk that the page imports only when it needs it
- **Developer Experience**: Excellent TypeScript integration and tooling
- **Rolldown**: Vite 8 bundles with Rolldown, a Rust-based bundler that took over from Rollup in Vite. `vite.config.ts` configures it through `build.rolldownOptions`.

#### js-dos

- **Self-Hosted**: `package.json` pins an exact js-dos version, and `scripts/copy-js-dos.js` copies it from `node_modules` into `public/` before every dev server start and build, so DosKit never loads js-dos from a CDN
- **WebAssembly**: High-performance emulation, with DOSBox running in a Web Worker
- **Cross-Platform**: Works in all modern browsers and Node.js
- **Multiple Backends**: Supports both DOSBox and DOSBox-X; DosKit runs every app on DOSBox
- **Active Development**: Regular updates and community support

#### TypeScript

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and inline documentation
- **Maintainability**: Easier to refactor and scale

## Project Structure

```
doskit/
├── .github/workflows/             # CI, GitHub Pages deployment, release-please
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # How DosKit is put together
│   ├── *.md                       # Error handling, performance, SEO, style guide, sceners
│   └── js-dos-llm-reference.md    # Comprehensive js-dos API reference
├── public/                        # Static files, copied into the build as they are
│   ├── demos/                     # The apps' ZIP archives (sources and licenses in its README)
│   ├── icons/                     # PWA icons
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── emulators/                 # js-dos emulator files (generated)
│   ├── js-dos.js                  # js-dos player (generated)
│   └── js-dos.css                 # js-dos styles (generated)
├── scripts/
│   ├── copy-js-dos.js             # Copies js-dos into public/ before dev and build
│   ├── inject-sw-version.js       # Writes cache names and the precache list into dist/sw.js
│   ├── help.js                    # npm run help
│   ├── generate-icons.js          # PWA icons from logo.svg
│   ├── generate-social-images.js  # Social preview PNGs from their SVGs
│   └── *.test.js                  # Tests of these scripts, the service worker and 404.html
├── src/
│   ├── adapters/                  # Emulator adapter around js-dos's window.Dos()
│   ├── components/                # React components
│   │   ├── DemoSelector.tsx       # App selector
│   │   ├── DosPlayer.tsx          # Runs one js-dos player
│   │   ├── DosPlayerUI.tsx        # The player's loading and error states
│   │   ├── DosPlayerWithApps.tsx  # Loads apps and switches between them
│   │   ├── ErrorBoundary.tsx
│   │   ├── OfflineIndicator.tsx   # Offline notice and install prompt
│   │   ├── UpdateNotification.tsx # "Update Available" prompt
│   │   └── *.css                  # Component styles
│   ├── config/                    # Configuration files
│   │   ├── apps.config.ts         # The apps in the selector
│   │   ├── apps.config.test.ts    # Checks every app's archive and DOSBox configuration
│   │   ├── dosbox.conf.ts         # DOSBox configuration of the DOS prompt
│   │   └── jsdos.config.ts        # js-dos settings (desktop and mobile)
│   ├── constants/                 # PWA and UI constants
│   ├── dos-apps/                  # Each app's archive URL and DOSBox configuration
│   ├── hooks/
│   │   └── useDosEmulator.ts      # Starts and stops js-dos
│   ├── integration/               # Integration tests
│   ├── test/setup.ts              # Test setup
│   ├── types/                     # TypeScript type definitions
│   │   ├── dos-app.ts             # DosApp
│   │   └── js-dos.d.ts            # js-dos type definitions
│   ├── utils/                     # Utility functions
│   │   ├── diskLoader.ts          # Downloads app archives
│   │   ├── dosboxConfigBuilder.ts # Builds DOSBox configurations
│   │   ├── errorMessages.ts       # User-friendly error messages
│   │   ├── errorTracking.ts       # Error tracking (logs to the console)
│   │   ├── fetchWithRetry.ts      # Retries failed requests with backoff
│   │   ├── globalErrorHandler.ts  # Uncaught errors and unhandled rejections
│   │   ├── logger.ts              # Logger
│   │   ├── serviceWorkerRegistration.ts
│   │   ├── storage.ts             # localStorage that never throws
│   │   ├── updatePrompt.ts        # Shows the "Update Available" prompt
│   │   └── urlRouting.ts          # Deep links
│   ├── App.tsx                    # Main application component
│   ├── App.css                    # Application styles
│   ├── main.tsx                   # Application entry point
│   ├── index.css                  # Global styles
│   └── vite-env.d.ts              # Types of the build-time constants
├── .gitignore
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration (app, Node and test projects)
├── tsconfig.test.json             # Type-checks the tests
├── typedoc.json                   # API documentation (npm run docs)
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Vitest configuration
└── README.md                      # This file
```

Tests sit next to the code they test, as `*.test.ts` and `*.test.tsx` files. The generated files in `public/` are copied from `node_modules` by `scripts/copy-js-dos.js` and are not committed.

## Development

### Available Scripts

```bash
# List all scripts by category, with the command each one runs
npm run help

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build (http://localhost:4173)
npm run preview

# Run linter
npm run lint

# Format all files with Prettier
npm run format

# Check formatting, as CI does
npm run format:check

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Generate API documentation into docs/api/
npm run docs

# Regenerate the PWA icons and the social preview images
npm run generate-icons
npm run generate-social-images
```

> **Tip**: Run `npm run help` anytime to see a formatted list of all available commands!

`npm run dev` and `npm run build` first run `scripts/copy-js-dos.js`, which copies the js-dos runtime from `node_modules` into `public/` (`js-dos.js`, `js-dos.css` and `emulators/`). If you start Vite another way, such as `npx vite`, run `node scripts/copy-js-dos.js` first, and again after updating js-dos.

`npm run build` type-checks the app, the tests and the Vite and Vitest configs (`tsc -b`), builds into `dist/`, and runs `scripts/inject-sw-version.js`, which writes the cache names and the list of files to precache into `dist/sw.js`. The build fails if a file it would precache is missing from `dist/`.

### Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **See changes instantly**: Vite HMR updates the browser automatically
4. **Test**: Run `npm test`, and interact with the DOS prompt to verify functionality
5. **Build**: Run `npm run build` to create production bundle

Commits go through a pre-commit hook that runs ESLint, Prettier and the related tests on the staged files; see [CONTRIBUTING.md](CONTRIBUTING.md) for the details.

## Deployment

DosKit is configured for automatic deployment to GitHub Pages.

### Quick Deployment

1. **Enable GitHub Pages** in repository settings (Settings → Pages → Source: GitHub Actions)
2. **Push to main branch**: `git push origin main`
3. **Monitor deployment**: Check the Actions tab
4. **Visit your site**: `https://doskit.net/` for this repository

Every push to `main` starts the Deploy to GitHub Pages workflow (`.github/workflows/deploy.yml`), which can also be run by hand from the Actions tab. It runs the CI jobs from `ci.yml` (ESLint and the format check, the tests with coverage, the build, the type check, and an `npm audit` that only reports) and a production build of its own, and deploys that build only if both succeed. Pull requests to `main` run the same CI jobs.

The build also writes `dist/404.html`, a copy of `index.html`. GitHub Pages serves it for any path it has no file for, so path-style links such as `https://doskit.net/secondreality` start the app, which rewrites them to `/?app=secondreality`.

DosKit has to be served from the root of its domain: `vite.config.ts` sets `base: '/'`, and the bundles, the service worker, js-dos and the app archives are all requested by absolute paths. A fork needs a custom domain or a `<user>.github.io` repository; it does not work under a project path such as `https://<user>.github.io/doskit/`.

### Creating Releases

DosKit uses **fully automated releases** with [release-please](https://github.com/googleapis/release-please):

1. **Use conventional commits**: `feat:`, `fix:`, etc.
2. **Merge PR to main**: That's it!
3. **release-please bot**: Automatically creates a Release PR
4. **Merge Release PR**: Automatic GitHub release, with a ZIP of the built site attached

See [CONTRIBUTING.md](CONTRIBUTING.md#commit-messages) for details on conventional commits.

## Configuration

### DOSBox Configuration

DosKit uses DOSBox configuration files to customize the DOS environment. The default configuration is located in `src/config/dosbox.conf.ts`.

**Key Configuration Options:**

```typescript
import { defaultDosboxConfig } from './config/dosbox.conf';

// Use the default configuration
<DosPlayer dosboxConf={defaultDosboxConfig} />
```

**Custom Configuration Example:**

```typescript
const customConfig = `
[cpu]
core=auto
cycles=max

[autoexec]
@echo off
echo Welcome to My DOS App!
mount c .
c:
myapp.exe
`;

<DosPlayer dosboxConf={customConfig} />
```

### js-dos Options

Customize the emulator behavior with js-dos options in `src/config/jsdos.config.ts`:

```typescript
import { DosPlayer } from './components/DosPlayer';

<DosPlayer
  options={{
    theme: 'dark',
    volume: 0.7,
    fullScreen: false,
    autoStart: true,
  }}
/>
```

**Available Options:**

- `theme`: 'dark' or 'light'
- `volume`: 0.0 to 1.0
- `fullScreen`: Enable fullscreen mode
- `autoStart`: Auto-start emulator on load
- `backend`: 'dosbox' or 'dosboxX'
- `mouseCapture`: Auto-capture mouse input
- See `src/types/js-dos.d.ts` for complete options

### Mobile Configuration

DosKit automatically detects mobile devices and applies optimized settings:

- Larger touch controls
- On-screen keyboard with common DOS keys
- Optimized aspect ratio for mobile screens

## Usage

### Basic Usage

The simplest way to use DosKit is to run the development server:

```bash
npm run dev
```

This will start a DOS prompt that you can interact with directly in your browser.

### Deep Linking

DosKit supports loading specific applications directly via URL parameters, making it easy to share links to specific DOS applications:

**Load Second Reality:**

```
https://doskit.net/?app=secondreality
```

**Load Impulse Tracker:**

```
https://doskit.net/?app=impulsetracker
```

**Features:**

- **Shareable Links**: URLs automatically update when you select an app
- **Bookmarkable**: Save direct links to your favorite DOS applications
- **Browser Navigation**: Back/forward buttons work correctly
- **Refresh-Safe**: Page refreshes maintain the loaded application
- **Error Handling**: Invalid app IDs show helpful error messages

### Adding DOS Applications

To run DOS applications or games:

1. **Create a custom DOSBox configuration:**

```typescript
const gameConfig = `
[autoexec]
@echo off
mount c .
c:
cd MYGAME
game.exe
`;
```

2. **Place your DOS files in the public directory** or use the `initFs` option to load files programmatically.

3. **Update the DosPlayer component:**

```typescript
<DosPlayer dosboxConf={gameConfig} />
```

### Programmatic Control

Access the Command Interface for programmatic control:

```typescript
import { useState } from 'react';
import { DosPlayer } from './components/DosPlayer';
import type { CommandInterface } from './types/js-dos';

function MyApp() {
  const [ci, setCi] = useState<CommandInterface | null>(null);

  const handleReady = (commandInterface: CommandInterface) => {
    setCi(commandInterface);

    // Now you can control DOS programmatically
    commandInterface.simulateKeyPress(13); // Press Enter
  };

  return <DosPlayer onReady={handleReady} />;
}
```

**Available Commands:**

- `ci.pause()` / `ci.resume()` - Control emulation
- `ci.mute()` / `ci.unmute()` - Audio control
- `ci.screenshot()` - Capture screen
- `ci.fsReadFile()` / `ci.fsWriteFile()` - File system access
- See `src/types/js-dos.d.ts` for complete API

## Browser Compatibility

DosKit works on all modern browsers that support WebAssembly:

### Desktop Browsers

- **Chrome/Edge** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 15+
- **Opera** 76+

### Mobile Browsers

- **Chrome Mobile** (Android)
- **Safari Mobile** (iOS 15+)
- **Firefox Mobile**
- **Samsung Internet**

### Requirements

- **WebAssembly** support (required)
- **JavaScript** enabled
- **Minimum 2GB RAM** recommended
- **Modern GPU** for WebGL rendering (optional but recommended)

### Detailed Compatibility Matrix

| Feature         | Chrome 90+ | Firefox 88+ | Safari 15+ | Edge 90+ | Mobile  |
| --------------- | ---------- | ----------- | ---------- | -------- | ------- |
| WebAssembly     | Yes        | Yes         | Yes        | Yes      | Yes     |
| Service Workers | Yes        | Yes         | Yes        | Yes      | Yes     |
| PWA Install     | Yes        | Yes         | Yes        | Yes      | Yes     |
| Fullscreen API  | Yes        | Yes         | Yes        | Yes      | Partial |
| Keyboard Lock   | Yes        | No          | No         | Yes      | No      |
| Audio           | Yes        | Yes         | Yes        | Yes      | Yes     |
| Touch Controls  | N/A        | N/A         | N/A        | N/A      | Yes     |
| Offline Mode    | Yes        | Yes         | Yes        | Yes      | Yes     |

### Performance Benchmarks

Tested on various devices with Second Reality demo:

| Device              | Browser     | Load Time | FPS   | Notes      |
| ------------------- | ----------- | --------- | ----- | ---------- |
| Desktop (i7, 16GB)  | Chrome 120  | ~2s       | 60    | Optimal    |
| MacBook Pro M1      | Safari 17   | ~2s       | 60    | Excellent  |
| Desktop (i5, 8GB)   | Firefox 121 | ~3s       | 55-60 | Very Good  |
| iPad Pro 2021       | Safari 17   | ~3s       | 50-60 | Good       |
| iPhone 13           | Safari 17   | ~4s       | 45-55 | Good       |
| Android (mid-range) | Chrome 120  | ~5s       | 40-50 | Acceptable |
| Android (low-end)   | Chrome 120  | ~8s       | 25-35 | Playable   |

_Load times include network fetch and initialization. FPS varies by DOS application complexity._

### Known Limitations

- **iOS Safari < 15**: Limited WebAssembly support
- **Internet Explorer**: Not supported (no WebAssembly)
- **Older Android browsers**: May have performance issues
- **Keyboard Lock API**: Only supported in Chrome/Edge (not critical for functionality)

## Troubleshooting

### Common Issues

#### "DOS emulator library not loaded"

**Problem**: js-dos (`/js-dos.js`, which DosKit serves itself) did not load.

**Solutions:**

1. Check the browser console and Network tab: `/js-dos.js` should load without errors
2. In development, check that `public/js-dos.js` exists: `npm run dev` copies it from `node_modules`, and if you start Vite another way, run `node scripts/copy-js-dos.js` first
3. Check your internet connection (after the first visit, the service worker serves it offline)
4. Try refreshing the page
5. Clear browser cache

#### Black Screen / Emulator Not Starting

**Problem**: Emulator loads but shows black screen.

**Solutions:**

1. Check browser console for errors
2. Verify WebAssembly is supported: `typeof WebAssembly !== 'undefined'`
3. Try a different browser
4. Disable browser extensions that might interfere
5. Check if hardware acceleration is enabled

#### Poor Performance / Lag

**Problem**: Emulator runs slowly.

**Solutions:**

1. Reduce CPU cycles in DOSBox config: `cycles=10000`
2. Enable hardware acceleration in browser settings
3. Close other browser tabs
4. Try a different rendering backend: `renderBackend: 'canvas'`
5. Reduce screen resolution if possible

#### Keyboard Not Working

**Problem**: Keyboard input not registering.

**Solutions:**

1. Click inside the emulator window to focus it
2. Check if browser has focus (not in another tab)
3. Try clicking the "Play" button if visible
4. On mobile, use the on-screen keyboard
5. Check browser console for errors

#### Audio Not Playing

**Problem**: No sound from DOS applications.

**Solutions:**

1. **Audio is automatically unmuted** when the emulator is ready (as of latest version)
2. Check browser audio is not muted (system volume and browser tab)
3. Verify volume setting: `volume: 0.7` in options
4. Click inside emulator to ensure user interaction (required by browsers)
5. Check if DOS application has sound enabled in its settings
6. Verify DOSBox sound card configuration (Sound Blaster, GUS, etc.)
7. Check browser console for audio-related errors

**Note**: Modern browsers require user interaction before audio can play. The emulator automatically unmutes audio when you interact with it (click play or click inside the emulator window).

#### Mobile Touch Controls Not Appearing

**Problem**: On-screen keyboard missing on mobile.

**Solutions:**

1. Verify you're on a mobile device (check user agent)
2. Check mobile configuration is applied
3. Try portrait and landscape orientations
4. Refresh the page
5. Check `softKeyboardLayout` in config

#### Service Worker Not Updating

**Problem**: App not updating to latest version.

**Solutions:**

1. Click "Update Available" notification when it appears
2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. Clear browser cache and reload
4. Unregister service worker in DevTools > Application > Service Workers
5. Close all tabs and reopen

#### Files Not Loading / Network Errors

**Problem**: DOS application files fail to download.

**Solutions:**

1. Check internet connection
2. Verify GitHub/CDN is accessible
3. Check browser console for CORS errors
4. Try again later (may be rate limited)
5. Check if using VPN or proxy that might block requests

#### High Memory Usage

**Problem**: Browser using too much memory.

**Solutions:**

1. Close other browser tabs
2. Reduce DOSBox memory: `memsize=16` in config
3. Clear browser cache
4. Restart browser
5. Use a 64-bit browser if available

### Debug Mode

Enable detailed logging in development:

```typescript
// Logs are automatically enabled in development mode
// Check browser console for detailed information
// Use logger utility for custom logging:
import { logger } from './utils/logger';
logger.debug('Debug message');
```

### Performance Tips

- **Reduce CPU cycles** for better battery life on mobile
- **Enable hardware acceleration** in browser settings
- **Use cache-first mode** for offline performance
- **Close unused tabs** to free up memory
- **Disable browser extensions** that might interfere

### Getting Help

If you encounter issues not covered here:

1. **Check the browser console** for error messages
2. **Review js-dos documentation**: https://js-dos.com
3. **Check existing issues**: https://github.com/cameronrye/doskit/issues
4. **Open a new issue**: Include browser version, OS, and console errors
5. **Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)**: For technical details
6. **Include**:
   - Browser and version
   - Operating system
   - Error messages from console
   - Steps to reproduce

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **js-dos**: GPL-2.0 License - https://github.com/caiiiycuk/js-dos
- **React**: MIT License
- **retro-floppy**: MIT License
- **DOSBox**: GPL-2.0 License
- **Demos and trackers**: each archive in `public/demos/` keeps its own license, listed in [public/demos/README.md](public/demos/README.md)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Acknowledgments

- **js-dos** by caiiiycuk - For the amazing WebAssembly DOS emulator
- **DOSBox** team - For the original DOS emulation
- **React** team - For the excellent UI framework

---

<div align="center">
  Made with ❤️ by <a href="https://rye.dev/">Cameron Rye</a>
</div>
