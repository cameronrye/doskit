# JS-DOS Technical Reference for LLMs

**Version**: 8.3.20 (Latest Stable as of May 2025)  
**Purpose**: Comprehensive technical reference for Large Language Models to assist developers with JS-DOS integration  
**Official Website**: https://js-dos.com  
**GitHub Repository**: https://github.com/caiiiycuk/js-dos  
**License**: GPL-2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [WebAssembly Implementation](#webassembly-implementation)
4. [Quick Start Guide](#quick-start-guide)
5. [API Reference](#api-reference)
6. [Integration Patterns](#integration-patterns)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [Version Compatibility](#version-compatibility)

---

## Overview

### What is JS-DOS?

JS-DOS is a JavaScript library that enables running DOS and Windows 9x programs directly in web browsers or Node.js environments. It provides a full-featured DOS player with a modern UI and infrastructure for easy integration.

### Key Features

- **Multiple Execution Modes**: Worker thread or render thread execution
- **Cross-Platform**: Runs in browsers and Node.js
- **Multiple Backends**: DOSBox and DOSBox-X emulators
- **Large Game Support**: Can run huge games (Diablo, Dune 2000, etc.)
- **Multiplayer**: IPX networking support for multiplayer games
- **Cloud Storage**: Built-in cloud save functionality
- **Remote Storage**: Sockdrive for remote HDD drives
- **WebAssembly**: High-performance WASM implementation with pure JS fallback
- **Mobile Support**: Touch controls and mobile optimization (v8 WIP, v7 production-ready)

### Architecture Layers

```
┌─────────────────────────────────────┐
│     js-dos Player (Frontend)        │
│  - UI Components                    │
│  - Player API                       │
│  - Event System                     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│    emulators Package (Backend)      │
│  - DOSBox / DOSBox-X                │
│  - Command Interface (CI)           │
│  - WASM Modules                     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Browser / Node.js Runtime      │
│  - WebAssembly Engine               │
│  - File System API                  │
│  - Audio/Video APIs                 │
└─────────────────────────────────────┘
```

---

## Architecture

### Component Overview

#### 1. **js-dos Player** (Frontend Layer)
- **Purpose**: Provides user interface and high-level API
- **Package**: `js-dos` (npm)
- **Main Entry Point**: `Dos()` function
- **Responsibilities**:
  - UI rendering (Preact-based)
  - Configuration management
  - Event handling
  - State management (Redux)
  - User interactions

#### 2. **emulators Package** (Backend Layer)
- **Purpose**: Core emulation engine
- **Package**: `emulators` (npm)
- **Backends Available**:
  - **DOSBox**: Classic DOSBox emulator
  - **DOSBox-X**: Extended DOSBox with Windows 9x support
- **Responsibilities**:
  - DOS/Windows emulation
  - File system management
  - Input/output processing
  - Network emulation

#### 3. **Command Interface (CI)**
- **Purpose**: Low-level control of emulator
- **Access**: Available via `ci-ready` event
- **Capabilities**:
  - Direct emulator control
  - File system operations
  - Screenshot capture
  - Network management
  - State persistence

### Data Flow

```
User Interaction → js-dos Player → Command Interface → Emulator (WASM) → Output
                                                              ↓
                                                        File System
                                                        Audio/Video
                                                        Network
```

---

## WebAssembly Implementation

### WASM Architecture

JS-DOS leverages WebAssembly for high-performance DOS emulation. The emulators are compiled from C/C++ source code using Emscripten.

#### Compilation Details

- **Compiler**: Emscripten 4.0.2 (as of version 8.3.15+)
- **Source**: DOSBox and DOSBox-X C/C++ codebases
- **Output**: `.wasm` modules + JavaScript glue code
- **Backends**:
  - `dosbox.wasm` - Classic DOSBox
  - `dosbox-x.wasm` - DOSBox-X with Windows 95/98 support

#### WASM Module Loading

```javascript
// Emulators are loaded from CDN or local path
const pathPrefix = "https://v8.js-dos.com/latest/emulators/";
// or for local deployment
const pathPrefix = "/public/emulators/";

Dos(element, {
    pathPrefix: pathPrefix,
    backend: "dosbox" // or "dosboxX"
});
```

### Memory Management

#### JavaScript ↔ WASM Communication

1. **Heap Allocation**: WASM module has its own linear memory
2. **Data Transfer**: 
   - Files transferred as `Uint8Array`
   - Strings encoded as UTF-8
   - Pointers managed by Emscripten runtime
3. **Memory Limits**: Browser-dependent (typically 2-4GB)

#### File System Abstraction

JS-DOS uses Emscripten's virtual file system (FS):

```javascript
// File system operations via Command Interface
await ci.fsWriteFile("/path/to/file.txt", new Uint8Array([...]));
const contents = await ci.fsReadFile("/path/to/file.txt");
await ci.fsDeleteFile("/path/to/file.txt");
const tree = await ci.fsTree(); // Get entire FS structure
```

### Performance Characteristics

- **Execution Speed**: Near-native performance (80-90% of native C++)
- **Startup Time**: 1-3 seconds for WASM compilation and initialization
- **Memory Usage**: 64-512MB typical, up to 2GB for large games
- **Frame Rate**: 60 FPS target, depends on game and hardware

### Worker Thread vs Render Thread

#### Worker Thread Mode (Default, Recommended)
```javascript
Dos(element, {
    workerThread: true // default
});
```
- **Pros**: Non-blocking UI, better performance
- **Cons**: Slightly more complex setup
- **Use Case**: Production applications

#### Render Thread Mode
```javascript
Dos(element, {
    workerThread: false
});
```
- **Pros**: Simpler debugging
- **Cons**: Can block UI thread
- **Use Case**: Development, debugging

---

## Quick Start Guide

### Installation

#### Option 1: CDN (Recommended for Quick Start)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css">
    <script src="https://v8.js-dos.com/latest/js-dos.js"></script>
</head>
<body>
    <div id="dos" style="width: 100%; height: 100vh;"></div>
    
    <script>
        Dos(document.getElementById("dos"), {
            url: "https://cdn.dos.zone/original/2X/2/24b00c1f37d4c2a5f0c8f3f3f3f3f3f3f3f3f3f3.jsdos"
        });
    </script>
</body>
</html>
```

#### Option 2: NPM Installation

```bash
npm install js-dos
# or
yarn add js-dos
```

```javascript
import { Dos } from 'js-dos';

const element = document.getElementById('dos');
Dos(element, {
    url: 'path/to/bundle.jsdos'
});
```

### Basic Usage Patterns

#### Pattern 1: Load from Bundle URL

```javascript
Dos(document.getElementById("dos"), {
    url: "https://example.com/game.jsdos"
});
```

#### Pattern 2: Load from DOSBox Configuration

```javascript
const dosboxConf = `
[autoexec]
mount c .
c:
dir
`;

Dos(document.getElementById("dos"), {
    dosboxConf: dosboxConf
});
```

#### Pattern 3: Initialize with Files

```javascript
const files = [
    {
        path: "/game.exe",
        contents: new Uint8Array([...])
    },
    {
        path: "/config.cfg",
        contents: new TextEncoder().encode("setting=value")
    }
];

Dos(document.getElementById("dos"), {
    dosboxConf: `
        [autoexec]
        game.exe
    `,
    initFs: files
});
```

---

## API Reference

### Main Entry Point: `Dos()`

```typescript
function Dos(
    element: HTMLDivElement,
    options: Partial<DosOptions>
): DosProps;
```

### DosOptions Interface

Complete configuration options for the player:

```typescript
interface DosOptions {
    // Bundle/Configuration
    url: string;                    // URL to .jsdos bundle
    dosboxConf: string;             // DOSBox configuration
    jsdosConf: any;                 // js-dos metadata
    initFs: InitFs;                 // Initial file system
    
    // Emulator Settings
    backend: "dosbox" | "dosboxX";  // Emulator backend
    backendLocked: boolean;         // Lock backend selection
    workerThread: boolean;          // Use worker thread (default: true)
    offscreenCanvas: boolean;       // Use OffscreenCanvas
    
    // Display Settings
    theme: string;                  // UI theme (light, dark, etc.)
    background: string;             // Background image URL
    imageRendering: "pixelated" | "smooth";
    renderBackend: "webgl" | "canvas";
    renderAspect: "AsIs" | "1/1" | "5/4" | "4/3" | "16/10" | "16/9" | "Fit";
    fullScreen: boolean;            // Auto fullscreen
    softFullscreen: boolean;        // CSS fullscreen instead of browser API
    
    // Input Settings
    mouseCapture: boolean;          // Lock mouse pointer
    mouseSensitivity: number;       // Mouse sensitivity (default: 1.0)
    noCursor: boolean;              // Hide system cursor
    softKeyboardLayout: string[] | string[][][];
    softKeyboardSymbols: {[key: string]: string}[];
    
    // Audio Settings
    volume: number;                 // Volume 0.0 to 1.0
    
    // Behavior Settings
    autoStart: boolean;             // Auto-start emulation
    countDownStart: number;         // Countdown before auto-start (seconds)
    autoSave: boolean;              // Auto-save on certain events
    kiosk: boolean;                 // Hide UI (kiosk mode)
    
    // UI Settings
    lang: "ru" | "en";              // Language
    thinSidebar: boolean;           // Use thin sidebar
    scaleControls: number;          // Scale of on-screen controls
    
    // Cloud/Network Settings
    noCloud: boolean;               // Disable cloud features
    key: string;                    // Cloud service key
    sockdrivePreload: "none" | "all" | "default";
    startIpxServer: boolean;        // Start IPX server
    connectIpxAddress: string;      // Connect to IPX address
    
    // Advanced
    pathPrefix: string;             // Path to emulators
    pathSuffix: string;             // Path suffix
    backendHardware: (backend) => Promise<string | null>;
    onEvent: (event: DosEvent, arg?: any) => void;
}
```

### DosProps Interface

Methods returned by `Dos()` for controlling the player:

```typescript
interface DosProps {
    // Version Information
    getVersion(): [string, string];  // [js-dos version, emulator version]
    getToken(): string | null;       // User authentication token

    // Configuration Methods
    setTheme(theme: DosOptions["theme"]): void;
    setLang(lang: "ru" | "en"): void;
    setBackend(backend: "dosbox" | "dosboxX"): void;
    setBackendLocked(locked: boolean): void;
    setWorkerThread(workerThread: boolean): void;
    setOffscreenCanvas(offscreenCanvas: boolean): void;

    // Display Methods
    setBackground(background: string | null): void;
    setFullScreen(fullScreen: boolean): void;
    setImageRendering(rendering: "pixelated" | "smooth"): void;
    setRenderBackend(backend: "webgl" | "canvas"): void;
    setRenderAspect(aspect: RenderAspect): void;
    setSoftFullscreen(softFullscreen: boolean): void;
    setThinSidebar(thinSidebar: boolean): void;

    // Input Methods
    setMouseCapture(capture: boolean): void;
    setMouseSensitivity(sensitivity: number): void;
    setNoCursor(noCursor: boolean): void;
    setSoftKeyboardLayout(layout: string[] | string[][][]): void;
    setSoftKeyboardSymbols(symbols: {[key: string]: string}[]): void;

    // Audio Methods
    setVolume(volume: number): void;  // 0.0 to 1.0

    // Behavior Methods
    setAutoStart(autoStart: boolean): void;
    setCountDownStart(countDownStart: number): void;
    setAutoSave(autoSave: boolean): void;
    setKiosk(kiosk: boolean): void;
    setPaused(paused: boolean): void;

    // UI Methods
    setScaleControls(scale: number): void;

    // Cloud/Network Methods
    setNoCloud(noCloud: boolean): void;
    setKey(key: string | null): void;

    // Lifecycle Methods
    save(): Promise<boolean>;        // Trigger manual save
    stop(): Promise<void>;           // Stop and dispose player
}
```

### Events System

Listen to player lifecycle events:

```typescript
type DosEvent =
    | "emu-ready"           // Emulators loaded and ready
    | "ci-ready"            // CommandInterface available
    | "bnd-play"            // Play button clicked
    | "open-key"            // Key dialog opened
    | "fullscreen-change";  // Fullscreen state changed

Dos(element, {
    onEvent: (event: DosEvent, arg?: any) => {
        switch(event) {
            case "emu-ready":
                console.log("Emulators ready");
                break;
            case "ci-ready":
                const ci = arg; // CommandInterface instance
                console.log("Command Interface ready", ci);
                break;
            case "bnd-play":
                console.log("Play button clicked");
                break;
            case "fullscreen-change":
                const isFullscreen = arg; // boolean
                console.log("Fullscreen:", isFullscreen);
                break;
        }
    }
});
```

### Command Interface (CI)

Low-level emulator control interface:

```typescript
interface CommandInterface {
    // Configuration
    config(): Promise<DosConfig>;

    // Display Information
    height(): number;
    width(): number;
    soundFrequency(): number;

    // Screen Capture
    screenshot(): Promise<ImageData>;

    // Emulation Control
    pause(): void;
    resume(): void;
    mute(): void;
    unmute(): void;
    exit(): Promise<void>;

    // Input Simulation
    simulateKeyPress(...keyCodes: number[]): void;
    sendKeyEvent(keyCode: number, pressed: boolean): void;
    sendMouseMotion(x: number, y: number): void;
    sendMouseRelativeMotion(x: number, y: number): void;
    sendMouseButton(button: number, pressed: boolean): void;
    sendMouseSync(): void;
    sendBackendEvent(event: any): void;

    // File System Operations
    fsTree(): Promise<FsNode>;
    fsReadFile(file: string): Promise<Uint8Array>;
    fsWriteFile(file: string, contents: ReadableStream<Uint8Array> | Uint8Array): Promise<void>;
    fsDeleteFile(file: string): Promise<void>;

    // State Management
    persist(onlyChanges?: boolean): Promise<Uint8Array | null>;

    // Network
    networkConnect(networkType: NetworkType, address: string): Promise<void>;
    networkDisconnect(networkType: NetworkType): Promise<void>;

    // Events
    events(): CommandInterfaceEvents;

    // Performance
    asyncifyStats(): Promise<AsyncifyStats>;
}
```

### CommandInterfaceEvents

Subscribe to low-level emulator events:

```typescript
interface CommandInterfaceEvents {
    onStdout(consumer: (message: string) => void): void;
    onFrameSize(consumer: (width: number, height: number) => void): void;
    onFrame(consumer: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void): void;
    onSoundPush(consumer: (samples: Float32Array) => void): void;
    onExit(consumer: () => void): void;
    onMessage(consumer: (msgType: MessageType, ...args: any[]) => void): void;
    onNetworkConnected(consumer: (networkType: NetworkType, address: string) => void): void;
    onNetworkDisconnected(consumer: (networkType: NetworkType) => void): void;
}
```

**Example Usage:**

```javascript
Dos(element, {
    url: "game.jsdos",
    onEvent: (event, ci) => {
        if (event === "ci-ready") {
            // Subscribe to frame updates
            ci.events().onFrame((rgb, rgba) => {
                // Process frame data
                console.log("Frame received");
            });

            // Subscribe to stdout
            ci.events().onStdout((message) => {
                console.log("DOS output:", message);
            });

            // Take screenshot after 5 seconds
            setTimeout(async () => {
                const screenshot = await ci.screenshot();
                // screenshot is ImageData, can be drawn to canvas
            }, 5000);
        }
    }
});
```

---

## Integration Patterns

### Pattern 1: Simple Game Loader

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css">
    <script src="https://v8.js-dos.com/latest/js-dos.js"></script>
</head>
<body>
    <div id="dos" style="width: 640px; height: 480px;"></div>
    <script>
        Dos(document.getElementById("dos"), {
            url: "https://cdn.dos.zone/original/2X/2/game.jsdos",
            autoStart: true
        });
    </script>
</body>
</html>
```

### Pattern 2: Custom Configuration with Files

```javascript
// Prepare game files
const gameFiles = [
    {
        path: "/GAME.EXE",
        contents: await fetch("game.exe").then(r => r.arrayBuffer()).then(b => new Uint8Array(b))
    },
    {
        path: "/CONFIG.SYS",
        contents: new TextEncoder().encode("FILES=30\nBUFFERS=20")
    }
];

// DOSBox configuration
const dosboxConf = `
[cpu]
core=auto
cputype=auto
cycles=max

[autoexec]
@echo off
mount c .
c:
GAME.EXE
`;

// Initialize player
Dos(document.getElementById("dos"), {
    dosboxConf: dosboxConf,
    initFs: gameFiles,
    autoStart: true,
    theme: "dark"
});
```

### Pattern 3: React Integration

```jsx
import React, { useEffect, useRef } from 'react';

function DosPlayer({ bundleUrl }) {
    const dosRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        if (dosRef.current && !playerRef.current) {
            playerRef.current = Dos(dosRef.current, {
                url: bundleUrl,
                onEvent: (event, arg) => {
                    console.log('DOS Event:', event);
                }
            });
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.stop();
                playerRef.current = null;
            }
        };
    }, [bundleUrl]);

    return (
        <div
            ref={dosRef}
            style={{ width: '100%', height: '600px' }}
        />
    );
}

export default DosPlayer;
```

### Pattern 4: Vue Integration

```vue
<template>
    <div ref="dosContainer" class="dos-player"></div>
</template>

<script>
export default {
    name: 'DosPlayer',
    props: {
        bundleUrl: String
    },
    data() {
        return {
            player: null
        };
    },
    mounted() {
        this.player = Dos(this.$refs.dosContainer, {
            url: this.bundleUrl,
            autoStart: true
        });
    },
    beforeUnmount() {
        if (this.player) {
            this.player.stop();
        }
    }
};
</script>

<style scoped>
.dos-player {
    width: 100%;
    height: 600px;
}
</style>
```

### Pattern 5: Node.js Usage

```javascript
// Node.js example for headless DOS execution
import { emulators } from 'emulators';

async function runDosProgram() {
    const bundle = await fetch('game.jsdos').then(r => r.arrayBuffer());

    const ci = await emulators.dosDirect(new Uint8Array(bundle));

    // Subscribe to stdout
    ci.events().onStdout((message) => {
        console.log('DOS:', message);
    });

    // Subscribe to frames for screenshot
    ci.events().onFrame(async (rgb, rgba) => {
        if (rgba) {
            const screenshot = await ci.screenshot();
            // Save screenshot to file
            const fs = require('fs');
            const canvas = require('canvas');
            const canvasEl = canvas.createCanvas(screenshot.width, screenshot.height);
            const ctx = canvasEl.getContext('2d');
            ctx.putImageData(screenshot, 0, 0);
            const buffer = canvasEl.toBuffer('image/png');
            fs.writeFileSync('screenshot.png', buffer);
        }
    });

    // Wait for exit
    await new Promise(resolve => {
        ci.events().onExit(resolve);
    });
}

runDosProgram();
```

### Pattern 6: Advanced File System Operations

```javascript
Dos(element, {
    dosboxConf: `[autoexec]\nmount c .\nc:`,
    onEvent: async (event, ci) => {
        if (event === "ci-ready") {
            // Read file from DOS file system
            const fileContents = await ci.fsReadFile("/C/SAVE.DAT");
            console.log("Save file:", fileContents);

            // Write file to DOS file system
            const newData = new TextEncoder().encode("New save data");
            await ci.fsWriteFile("/C/NEWSAVE.DAT", newData);

            // Get entire file system tree
            const tree = await ci.fsTree();
            console.log("File system:", tree);

            // Delete a file
            await ci.fsDeleteFile("/C/TEMP.TMP");

            // Persist changes (save state)
            const saveState = await ci.persist(true); // true = only changes
            if (saveState) {
                // Save to localStorage or server
                localStorage.setItem("dosState", btoa(String.fromCharCode(...saveState)));
            }
        }
    }
});
```

### Pattern 7: Multiplayer/Networking

```javascript
// Host a multiplayer game
Dos(element, {
    url: "doom.jsdos",
    startIpxServer: true,  // Start as server
    onEvent: (event, ci) => {
        if (event === "ci-ready") {
            ci.events().onNetworkConnected((type, address) => {
                console.log("Player connected:", address);
            });
        }
    }
});

// Join a multiplayer game
Dos(element, {
    url: "doom.jsdos",
    connectIpxAddress: "wss://server.example.com:8001",
    onEvent: (event, ci) => {
        if (event === "ci-ready") {
            ci.events().onNetworkConnected((type, address) => {
                console.log("Connected to server:", address);
            });
        }
    }
});
```

---

## Advanced Features

### Sockdrive (Remote HDD Drives)

Sockdrive allows mounting remote hard drives for large games without bundling all files.

**Use Case**: Games too large to bundle (Diablo, Dune 2000, etc.)

**Configuration Example:**

```javascript
const diabloConf = `
[autoexec]
echo off
imgmount 2 sockdrive wss://sockdrive.js-dos.com:8001 dos.zone diablo_109_c
imgmount 3 sockdrive wss://sockdrive.js-dos.com:8001 dos.zone diablo_109_d
boot c:
`;

Dos(document.getElementById("dos"), {
    dosboxConf: diabloConf,
    backend: "dosboxX",  // Sockdrive requires DOSBox-X
    sockdrivePreload: "default"  // Preload strategy
});
```

**Sockdrive Command Format:**
```
imgmount <drive_number> sockdrive <server_url> <owner> <drive_name>
```

- `drive_number`: 2 = C:, 3 = D:, etc.
- `server_url`: WebSocket server address
- `owner`: Drive owner token (email for subscription users)
- `drive_name`: Name of the remote drive

**Access Levels:**
- **Read Access**: Available to all users (even anonymous)
- **Write Access**: Requires active subscription
- **Drive Forking**: Non-owners get forked copy for writes

**Preload Modes:**
```typescript
type SockdrivePreload =
    | "none"      // No preloading, load on demand
    | "all"       // Preload entire drive
    | "default";  // Smart preloading
```

### Cloud Storage

JS-DOS provides built-in cloud storage for save games and progress.

**Setup:**

```javascript
Dos(element, {
    url: "game.jsdos",
    key: "xxxxx",  // 5-character subscription key
    autoSave: true  // Auto-save on fullscreen exit, etc.
});
```

**Manual Save:**

```javascript
const props = Dos(element, { url: "game.jsdos" });

// Trigger manual save
const saved = await props.save();
if (saved) {
    console.log("Game saved successfully");
} else {
    console.log("No changes to save");
}
```

**Cloud Features:**
- Automatic synchronization
- Cross-device save sharing
- Version history
- Requires subscription key

### Kiosk Mode

Hide all UI elements for embedded/kiosk deployments:

```javascript
Dos(element, {
    url: "game.jsdos",
    kiosk: true,        // Hide all UI
    autoStart: true,    // Auto-start
    mouseCapture: true  // Auto-capture mouse
});
```

### Custom Themes

JS-DOS supports multiple DaisyUI themes:

```javascript
const themes = [
    "light", "dark", "cupcake", "bumblebee", "emerald",
    "corporate", "synthwave", "retro", "cyberpunk", "valentine",
    "halloween", "garden", "forest", "aqua", "lofi", "pastel",
    "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk",
    "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"
];

Dos(element, {
    url: "game.jsdos",
    theme: "cyberpunk"
});
```

### Mobile Support

**Touch Controls:**

```javascript
Dos(element, {
    url: "game.jsdos",
    scaleControls: 0.3,  // Scale of on-screen controls (0.0 - 1.0)
    softKeyboardLayout: [
        ["Esc", "F1", "F2", "F3"],
        ["1", "2", "3", "4"],
        ["Q", "W", "E", "R"]
    ]
});
```

**Custom Keyboard Symbols:**

```javascript
Dos(element, {
    softKeyboardSymbols: [
        { "↑": "ArrowUp", "↓": "ArrowDown", "←": "ArrowLeft", "→": "ArrowRight" }
    ]
});
```

### Performance Optimization

#### OffscreenCanvas (Experimental)

```javascript
Dos(element, {
    url: "game.jsdos",
    offscreenCanvas: true,  // Use OffscreenCanvas for better performance
    workerThread: true      // Required for OffscreenCanvas
});
```

#### Render Backend Selection

```javascript
Dos(element, {
    renderBackend: "webgl",  // "webgl" (faster) or "canvas" (compatible)
    imageRendering: "pixelated"  // "pixelated" or "smooth"
});
```

#### Memory Management

```javascript
// Properly dispose player when done
const props = Dos(element, { url: "game.jsdos" });

// Later...
await props.stop();  // Frees all resources
```

### Aspect Ratio Control

```javascript
Dos(element, {
    renderAspect: "4/3"  // "AsIs", "1/1", "5/4", "4/3", "16/10", "16/9", "Fit"
});
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: WASM Module Not Loading

**Symptoms:** Error "Failed to load WASM module" or blank screen

**Solutions:**
1. Check `pathPrefix` is correct:
   ```javascript
   Dos(element, {
       pathPrefix: "https://v8.js-dos.com/latest/emulators/"
   });
   ```

2. Ensure WASM files are served with correct MIME type:
   ```
   Content-Type: application/wasm
   ```

3. Check CORS headers if loading from different domain

4. Verify files exist at the path:
   - `dosbox.wasm`
   - `dosbox.js`
   - `dosbox-x.wasm`
   - `dosbox-x.js`

#### Issue 2: Bundle Not Loading

**Symptoms:** "Failed to load bundle" error

**Solutions:**
1. Verify bundle URL is accessible
2. Check bundle format (should be `.jsdos` file)
3. Ensure bundle is not corrupted
4. Check browser console for CORS errors

#### Issue 3: Performance Issues

**Symptoms:** Low FPS, stuttering, lag

**Solutions:**
1. Enable worker thread mode:
   ```javascript
   Dos(element, { workerThread: true });
   ```

2. Use WebGL renderer:
   ```javascript
   Dos(element, { renderBackend: "webgl" });
   ```

3. Reduce CPU cycles in DOSBox config:
   ```
   [cpu]
   cycles=10000
   ```

4. Check browser hardware acceleration is enabled

#### Issue 4: Audio Not Working

**Symptoms:** No sound output

**Solutions:**
1. Check volume setting:
   ```javascript
   props.setVolume(1.0);
   ```

2. Unmute if muted:
   ```javascript
   ci.unmute();
   ```

3. User interaction required (browser autoplay policy):
   ```javascript
   Dos(element, {
       autoStart: false  // Wait for user click
   });
   ```

#### Issue 5: Mouse Not Captured

**Symptoms:** Mouse doesn't lock in game

**Solutions:**
1. Enable mouse capture:
   ```javascript
   Dos(element, { mouseCapture: true });
   ```

2. Ensure user has clicked in the player area

3. Check browser permissions for pointer lock

#### Issue 6: Fullscreen Not Working

**Symptoms:** Fullscreen button doesn't work

**Solutions:**
1. User interaction required:
   ```javascript
   // Must be triggered by user action
   button.onclick = () => {
       props.setFullScreen(true);
   };
   ```

2. Use soft fullscreen as fallback:
   ```javascript
   Dos(element, { softFullscreen: true });
   ```

3. Add CSS for soft fullscreen:
   ```css
   .jsdos-rso.jsdos-fullscreen-workaround {
       position: fixed !important;
       top: 0 !important;
       left: 0 !important;
       width: 100vw !important;
       height: 100vh !important;
       z-index: 9999 !important;
   }
   ```

#### Issue 7: File System Operations Failing

**Symptoms:** `fsReadFile` or `fsWriteFile` throws errors

**Solutions:**
1. Ensure path starts with `/`:
   ```javascript
   await ci.fsReadFile("/C/FILE.TXT");  // Correct
   await ci.fsReadFile("C/FILE.TXT");   // Wrong
   ```

2. Wait for `ci-ready` event:
   ```javascript
   Dos(element, {
       onEvent: async (event, ci) => {
           if (event === "ci-ready") {
               // Now safe to use file system
               await ci.fsReadFile("/C/FILE.TXT");
           }
       }
   });
   ```

3. Check file exists in file system tree:
   ```javascript
   const tree = await ci.fsTree();
   console.log(tree);
   ```

#### Issue 8: Sockdrive Connection Fails

**Symptoms:** "Failed to connect to sockdrive" error

**Solutions:**

1. Ensure using DOSBox-X backend:
   ```javascript
   Dos(element, {
       backend: "dosboxX",  // Sockdrive requires DOSBox-X
       backendLocked: true
   });
   ```

2. Check WebSocket server is accessible

3. Verify owner and drive name are correct

4. Check network/firewall settings

---

## Version Compatibility

### Current Version: 8.3.20

**Release Date:** May 31, 2025

**Key Changes:**
- Fixed incorrect toast message when no changes to save
- Fixed persist() function ignoring some updates

### Version History

#### 8.3.x Series (Current)

- **8.3.20** (May 2025): Bug fixes for save system
- **8.3.19** (May 2025): Updated emulators to 8.3.7, Romanian language, delete confirmation
- **8.3.18** (May 2025): DOSBox-X updated to 2025.05.14, UI fixes
- **8.3.17** (May 2025): Keyboard lock for Esc/Ctrl+W, save game UI improvements
- **8.3.16** (Apr 2025): F6/F7 quick save/load for DOSBox-X
- **8.3.15** (Apr 2025): **Sockdrive V2** (breaking change), Emscripten 4.0.2, dark mode auto-detection

**Breaking Changes in 8.3.15:**
- Sockdrive V2 is not compatible with Sockdrive V1
- Last V1-compatible version: 8.3.14

#### 7.xx Series (Stable, Production)

- Full mobile support
- Stable API
- Recommended for production if mobile support is critical

#### 6.22 Series (Legacy)

- Classic js-dos API
- No longer actively maintained
- Documentation: https://js-dos.com/index_6.22.html

### Migration Guide

#### From 7.xx to 8.xx

**API Changes:**

1. **Initialization:**
   ```javascript
   // v7
   Dos(element).run(bundleUrl);

   // v8
   Dos(element, { url: bundleUrl });
   ```

2. **Events:**
   ```javascript
   // v7
   const ci = await Dos(element).run(bundleUrl);

   // v8
   Dos(element, {
       url: bundleUrl,
       onEvent: (event, ci) => {
           if (event === "ci-ready") {
               // Use ci here
           }
       }
   });
   ```

3. **Configuration:**
   ```javascript
   // v7
   Dos(element, {
       wdosboxUrl: "path/to/wdosbox.js"
   });

   // v8
   Dos(element, {
       pathPrefix: "path/to/emulators/"
   });
   ```

#### From 6.22 to 8.xx

**Major API Overhaul:**

1. **Initialization:**
   ```javascript
   // v6.22
   Dos(element, {
       wdosboxUrl: "...",
   }).ready((fs, main) => {
       fs.extract("game.zip").then(() => {
           main(["-c", "game.exe"]);
       });
   });

   // v8
   Dos(element, {
       url: "game.jsdos"
   });
   ```

2. **Bundle Format:**
   - v6.22: ZIP files
   - v8: .jsdos bundles (use js-dos studio to create)

### Browser Compatibility

#### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support, some limitations on iOS |
| Edge | 90+ | Full support |
| Opera | 76+ | Full support |

#### Required Features

- **WebAssembly**: Required for emulation
- **Web Workers**: Required for worker thread mode
- **OffscreenCanvas**: Optional, for better performance
- **Pointer Lock API**: Required for mouse capture
- **Fullscreen API**: Required for fullscreen mode
- **IndexedDB**: Required for caching and storage
- **WebSocket**: Required for networking features

#### Mobile Browsers

- **iOS Safari**: Supported (v8 WIP, v7 production)
- **Chrome Mobile**: Supported
- **Firefox Mobile**: Supported
- **Samsung Internet**: Supported

**Mobile Limitations:**
- Pointer lock may not work on all devices
- Fullscreen API limited on iOS
- Performance varies by device

---

## Best Practices

### 1. Bundle Optimization

**Compress Your Bundles:**
```bash
# Use Brotli compression for smaller bundles
brotli -q 11 game.jsdos
```

**Keep Bundles Small:**
- Remove unnecessary files
- Use sockdrive for large games
- Compress assets before bundling

### 2. Performance

**Use Worker Thread:**
```javascript
Dos(element, {
    workerThread: true  // Non-blocking UI
});
```

**Choose Appropriate Backend:**
- **DOSBox**: Faster, for DOS-only games
- **DOSBox-X**: Slower, for Windows 95/98 games

**Optimize DOSBox Configuration:**
```
[cpu]
core=auto
cputype=auto
cycles=max

[render]
scaler=none
aspect=false
```

### 3. User Experience

**Auto-Start with Countdown:**
```javascript
Dos(element, {
    url: "game.jsdos",
    autoStart: true,
    countDownStart: 3  // 3-second countdown
});
```

**Provide Loading Feedback:**
```javascript
Dos(element, {
    url: "game.jsdos",
    onEvent: (event) => {
        if (event === "emu-ready") {
            console.log("Loading complete!");
        }
    }
});
```

**Handle Errors Gracefully:**
```javascript
Dos(element, {
    url: "game.jsdos",
    onEvent: (event, arg) => {
        if (event === "error") {
            console.error("Failed to load:", arg);
            // Show user-friendly error message
        }
    }
});
```

### 4. Mobile Optimization

**Responsive Design:**
```css
#dos {
    width: 100%;
    height: 100vh;
    max-height: -webkit-fill-available;
}
```

**Touch-Friendly Controls:**
```javascript
Dos(element, {
    scaleControls: 0.4,  // Larger controls for touch
    softKeyboardLayout: [
        ["↑"],
        ["←", "Space", "→"],
        ["↓"]
    ]
});
```

### 5. Security

**Validate User Input:**
```javascript
// Don't trust user-provided URLs
const allowedDomains = ["cdn.dos.zone", "example.com"];
const url = new URL(bundleUrl);
if (!allowedDomains.includes(url.hostname)) {
    throw new Error("Invalid bundle URL");
}
```

**Use HTTPS:**
- Always serve js-dos over HTTPS
- Sockdrive requires WSS (WebSocket Secure)

### 6. Accessibility

**Keyboard Navigation:**
```javascript
Dos(element, {
    mouseCapture: false  // Allow keyboard-only users
});
```

**Screen Reader Support:**
```html
<div id="dos" role="application" aria-label="DOS Game Player">
    <!-- js-dos will render here -->
</div>
```

---

## Code Examples

### Example 1: Complete Game Loader with Save/Load

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOS Game Player</title>
    <link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css">
    <script src="https://v8.js-dos.com/latest/js-dos.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #dos { width: 100vw; height: 100vh; }
        #controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
        }
        button {
            margin: 5px;
            padding: 10px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="dos"></div>
    <div id="controls">
        <button id="saveBtn">Save Game</button>
        <button id="loadBtn">Load Game</button>
        <button id="screenshotBtn">Screenshot</button>
    </div>

    <script>
        let ci = null;

        const props = Dos(document.getElementById("dos"), {
            url: "https://cdn.dos.zone/original/2X/2/game.jsdos",
            autoStart: true,
            theme: "dark",
            onEvent: (event, arg) => {
                if (event === "ci-ready") {
                    ci = arg;
                    console.log("Game ready!");
                }
            }
        });

        // Save game
        document.getElementById("saveBtn").onclick = async () => {
            if (ci) {
                const saveData = await ci.persist(true);
                if (saveData) {
                    localStorage.setItem("gameSave",
                        btoa(String.fromCharCode(...saveData)));
                    alert("Game saved!");
                }
            }
        };

        // Load game
        document.getElementById("loadBtn").onclick = async () => {
            const saveData = localStorage.getItem("gameSave");
            if (saveData && ci) {
                const bytes = Uint8Array.from(atob(saveData), c => c.charCodeAt(0));
                // Reload with saved state
                await props.stop();
                Dos(document.getElementById("dos"), {
                    url: "https://cdn.dos.zone/original/2X/2/game.jsdos",
                    initFs: bytes,
                    autoStart: true
                });
                alert("Game loaded!");
            }
        };

        // Take screenshot
        document.getElementById("screenshotBtn").onclick = async () => {
            if (ci) {
                const screenshot = await ci.screenshot();
                const canvas = document.createElement("canvas");
                canvas.width = screenshot.width;
                canvas.height = screenshot.height;
                const ctx = canvas.getContext("2d");
                ctx.putImageData(screenshot, 0, 0);

                // Download screenshot
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "screenshot.png";
                    a.click();
                });
            }
        };
    </script>
</body>
</html>
```

### Example 2: Custom DOS Program Runner

```javascript
// Run custom DOS program with files
async function runDosProgram(programFiles) {
    const dosboxConf = `
[cpu]
core=auto
cycles=max

[autoexec]
@echo off
mount c .
c:
${programFiles.executable}
`;

    const initFs = programFiles.files.map(file => ({
        path: `/${file.name}`,
        contents: file.data
    }));

    const props = Dos(document.getElementById("dos"), {
        dosboxConf: dosboxConf,
        initFs: initFs,
        autoStart: true,
        kiosk: true,
        onEvent: (event, ci) => {
            if (event === "ci-ready") {
                // Monitor program output
                ci.events().onStdout((message) => {
                    console.log("Program output:", message);
                });

                // Auto-exit after program finishes
                ci.events().onExit(() => {
                    console.log("Program exited");
                    props.stop();
                });
            }
        }
    });

    return props;
}

// Usage
runDosProgram({
    executable: "PROGRAM.EXE",
    files: [
        { name: "PROGRAM.EXE", data: new Uint8Array([...]) },
        { name: "CONFIG.CFG", data: new TextEncoder().encode("setting=value") }
    ]
});
```

### Example 3: Multiplayer Game Lobby

```javascript
class MultiplayerLobby {
    constructor(gameUrl) {
        this.gameUrl = gameUrl;
        this.isHost = false;
        this.serverAddress = null;
    }

    async hostGame() {
        this.isHost = true;

        const props = Dos(document.getElementById("dos"), {
            url: this.gameUrl,
            startIpxServer: true,
            onEvent: (event, ci) => {
                if (event === "ci-ready") {
                    ci.events().onNetworkConnected((type, address) => {
                        console.log("Player joined:", address);
                        this.onPlayerJoined(address);
                    });

                    ci.events().onNetworkDisconnected((type) => {
                        console.log("Player left");
                        this.onPlayerLeft();
                    });
                }
            }
        });

        return props;
    }

    async joinGame(serverAddress) {
        this.isHost = false;
        this.serverAddress = serverAddress;

        const props = Dos(document.getElementById("dos"), {
            url: this.gameUrl,
            connectIpxAddress: serverAddress,
            onEvent: (event, ci) => {
                if (event === "ci-ready") {
                    ci.events().onNetworkConnected((type, address) => {
                        console.log("Connected to host:", address);
                        this.onConnected();
                    });

                    ci.events().onNetworkDisconnected((type) => {
                        console.log("Disconnected from host");
                        this.onDisconnected();
                    });
                }
            }
        });

        return props;
    }

    onPlayerJoined(address) {
        // Update UI
    }

    onPlayerLeft() {
        // Update UI
    }

    onConnected() {
        // Update UI
    }

    onDisconnected() {
        // Update UI
    }
}

// Usage
const lobby = new MultiplayerLobby("doom.jsdos");

// Host
document.getElementById("hostBtn").onclick = () => {
    lobby.hostGame();
};

// Join
document.getElementById("joinBtn").onclick = () => {
    const address = prompt("Enter server address:");
    lobby.joinGame(address);
};
```

---

## Resources

### Official Links

- **Website**: https://js-dos.com
- **Documentation**: https://js-dos.com/overview.html
- **GitHub**: https://github.com/caiiiycuk/js-dos
- **Emulators Package**: https://github.com/caiiiycuk/emulators
- **NPM**: https://www.npmjs.com/package/js-dos
- **CDN**: https://v8.js-dos.com/latest/

### Community

- **DOS.Zone**: https://dos.zone (1900+ DOS games)
- **Discord**: https://discord.com/invite/hMVYEbG
- **Twitter**: https://twitter.com/doszone_db
- **Telegram**: https://t.me/doszonechat

### Tools

- **Game Studio**: https://v8.js-dos.com (Create .jsdos bundles)
- **Subscription**: https://v8.js-dos.com/key/ (Cloud features)

### Related Projects

- **DOSBox**: https://www.dosbox.com
- **DOSBox-X**: https://dosbox-x.com
- **Emscripten**: https://emscripten.org

---

## Appendix

### A. DOSBox Configuration Reference

Common DOSBox configuration options:

```ini
[cpu]
core=auto              # CPU core (auto, dynamic, normal, simple)
cputype=auto           # CPU type (auto, 386, 486, pentium, pentium_mmx)
cycles=max             # CPU speed (max, auto, or fixed number)

[video]
vmemsize=8             # Video memory in MB

[dos]
ver=7.1                # DOS version to report

[sblaster]
sbtype=sb16vibra       # Sound Blaster type

[autoexec]
# Commands to run on startup
mount c .
c:
game.exe
```

### B. Keyboard Codes Reference

Common keyboard codes for `simulateKeyPress()`:

| Key | Code | Key | Code |
|-----|------|-----|------|
| Enter | 13 | Esc | 27 |
| Space | 32 | Arrow Up | 38 |
| Arrow Down | 40 | Arrow Left | 37 |
| Arrow Right | 39 | F1 | 112 |
| F2 | 113 | F3 | 114 |
| Ctrl | 17 | Alt | 18 |
| Shift | 16 | Tab | 9 |

### C. File System Structure

Typical js-dos file system structure:

```
/
├── C/              # Mounted C: drive
│   ├── DOS/        # DOS system files
│   ├── GAME/       # Game files
│   └── SAVE/       # Save files
├── D/              # Mounted D: drive (if any)
└── tmp/            # Temporary files
```

### D. Bundle Format (.jsdos)

A .jsdos bundle is a ZIP archive containing:

```
bundle.jsdos
├── .jsdos/
│   └── jsdos.json      # Metadata
├── dosbox.conf         # DOSBox configuration
└── [game files]        # All game files
```

**jsdos.json structure:**

```json
{
    "version": "8",
    "title": "Game Title",
    "description": "Game description",
    "author": "Author name",
    "url": "https://example.com"
}
```

---

## Conclusion

This reference provides comprehensive technical information about JS-DOS for LLMs to assist developers in building web applications with DOS emulation capabilities. The library offers a powerful, flexible API with modern features like WebAssembly performance, cloud storage, and multiplayer support.

For the latest updates and detailed documentation, always refer to the official website at https://js-dos.com.

**Last Updated**: October 2025
**Document Version**: 1.0
**JS-DOS Version Covered**: 8.3.20

