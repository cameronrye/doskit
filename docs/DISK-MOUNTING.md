# Disk Mounting & DOS Applications

DosKit's disk mounting feature allows you to load and run DOS applications, games, and demos directly in your browser. This guide covers everything from quick start to advanced usage.

## Table of Contents

- [Quick Start](#quick-start)
- [Available Applications](#available-applications)
- [Loading Methods](#loading-methods)
- [API Reference](#api-reference)
- [Integration Guide](#integration-guide)
- [Adding New Applications](#adding-new-applications)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Quick Start

### Using the Enhanced Player

Replace your existing `DosPlayer` with `DosPlayerWithApps`:

```typescript
// src/App.tsx
import { DosPlayerWithApps } from './components/DosPlayerWithApps';

function App() {
  return (
    <DosPlayerWithApps 
      showSelector={true}  // Show app selector on load
      onReady={(ci) => console.log('DOS ready!')}
    />
  );
}
```

### Running Second Reality

The Second Reality demo is pre-configured and ready to run:

```typescript
import { loadZipArchive } from './utils/diskLoader';
import { 
  secondRealityZipUrl,
  secondRealityDosboxConf 
} from './dos-apps/second-reality.config';

// Load and run
const zipData = await loadZipArchive(secondRealityZipUrl);

<DosPlayer
  dosboxConf={secondRealityDosboxConf}
  options={{ initFs: zipData }}
/>
```

### File Structure

```
src/
├── utils/
│   └── diskLoader.ts              # File loading utilities
├── dos-apps/
│   ├── second-reality.config.ts   # Second Reality configuration
│   └── impulse-tracker.config.ts  # Impulse Tracker configuration
└── components/
    ├── DemoSelector.tsx           # Application selector UI
    ├── DosPlayerWithApps.tsx      # Enhanced player
    └── DosPlayer.tsx              # Base player
```

## Available Applications

### Second Reality (1993)

**Second Reality** is one of the most influential demos in PC demo scene history by Future Crew.

- **Author**: Future Crew
- **Year**: 1993
- **License**: Public Domain (Unlicense)
- **Size**: ~2.1 MB
- **Repository**: https://github.com/mtuomi/SecondReality

**System Requirements**:
- CPU: 486 or better
- Memory: 4MB RAM (EMS/XMS enabled)
- Graphics: VGA
- Sound: Sound Blaster (optional)

**File Structure**:
```
SecondReality/
├── SECOND.EXE      # Main executable
├── REALITY.FC      # Demo data file
└── README.1ST      # Instructions
```

### Impulse Tracker 2.14 (1998)

**Impulse Tracker** is a legendary music tracker application for creating and editing digital music.

- **Author**: Jeffrey Lim
- **Year**: 1998
- **License**: Freeware
- **Size**: ~1.0 MB
- **Website**: https://www.pouet.net/prod.php?which=53

**System Requirements**:
- CPU: 386 or better
- Memory: 4MB RAM
- Graphics: VGA
- Sound: Sound Blaster 16 or Gravis UltraSound (recommended)

**Features**:
- Advanced sample editing
- 64 channels of audio
- Support for various module formats (.IT, .XM, .S3M, .MOD)
- Built-in synthesizer and effects

## Loading Methods

DosKit supports four methods for loading DOS applications:

### Method 1: Individual Files

**Best for**: Small to medium applications where you have individual files

**Advantages**:
- Simple implementation
- No preprocessing required
- Easy to update individual files
- Fast loading

**Example**:

```typescript
import { loadFilesFromUrls } from './utils/diskLoader';

const files = await loadFilesFromUrls([
  { path: '/GAME.EXE', url: 'https://example.com/GAME.EXE' },
  { path: '/DATA.DAT', url: 'https://example.com/DATA.DAT' },
]);

<DosPlayer
  dosboxConf={dosboxConf}
  options={{ initFs: files }}
/>
```

### Method 2: ZIP Archive (Recommended)

**Best for**: Any size application, fastest loading

**Advantages**:
- Single file download
- Faster loading than individual files
- Includes all files automatically
- js-dos auto-extracts

**Example**:

```typescript
import { loadZipArchive } from './utils/diskLoader';

const zipData = await loadZipArchive('https://example.com/game.zip');

const dosboxConf = `
[autoexec]
@echo off
mount c .
c:
GAME.EXE
`;

<DosPlayer
  dosboxConf={dosboxConf}
  options={{ initFs: zipData }}
/>
```

### Method 3: Disk Image

**Best for**: Large applications, exact DOS environment replication

**Advantages**:
- Authentic DOS disk structure
- Can use existing disk images (.img, .ima, .iso)
- Preserves exact file system layout
- Good for games requiring specific disk geometry

**Example**:

```typescript
import { loadDiskImage } from './utils/diskLoader';

const diskImage = await loadDiskImage('https://example.com/disk.img');

const dosboxConf = `
[autoexec]
@echo off
imgmount c /disk.img -t hdd
c:
GAME.EXE
`;

<DosPlayer
  dosboxConf={dosboxConf}
  options={{ initFs: [diskImage] }}
/>
```

### Method 4: Sockdrive (Remote Disk Images)

**Best for**: Very large applications (>50MB), shared disk images

**Advantages**:
- No need to bundle large files
- On-demand loading
- Can share disk images across users
- Supports write operations (with subscription)

**Disadvantages**:
- Requires DOSBox-X backend
- Needs external sockdrive server
- Network dependency

**Example**:

```typescript
const dosboxConf = `
[autoexec]
@echo off
imgmount 2 sockdrive wss://sockdrive.js-dos.com:8001 dos.zone game_name
boot c:
`;

<DosPlayer
  dosboxConf={dosboxConf}
  options={{
    backend: 'dosboxX',
    backendLocked: true,
    sockdrivePreload: 'default'
  }}
/>
```

## API Reference

### diskLoader.ts Functions

#### loadFilesFromUrls()

Load multiple files from URLs with progress tracking.

```typescript
loadFilesFromUrls(
  files: DosFile[],
  onProgress?: (progress: LoadProgress) => void
): Promise<InitFileEntry[]>
```

**Parameters**:
- `files`: Array of `{ path: string, url: string }` objects
- `onProgress`: Optional callback for progress updates

**Returns**: Array of file entries for js-dos `initFs` option

**Example**:
```typescript
const files = await loadFilesFromUrls(
  [{ path: '/GAME.EXE', url: 'https://example.com/GAME.EXE' }],
  (progress) => console.log(`${progress.loaded}/${progress.total}`)
);
```

#### loadZipArchive()

Load a ZIP archive (js-dos auto-extracts).

```typescript
loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<Uint8Array>
```

**Parameters**:
- `zipUrl`: URL to the ZIP file
- `onProgress`: Optional callback for progress updates

**Returns**: Uint8Array for js-dos `initFs` option

#### loadDiskImage()

Load a disk image file (.img, .ima, .iso).

```typescript
loadDiskImage(
  imageUrl: string,
  mountPath?: string
): Promise<InitFileEntry>
```

**Parameters**:
- `imageUrl`: URL to the disk image
- `mountPath`: Path in virtual FS (default: '/disk.img')

**Returns**: Single file entry for the disk image

#### loadDirectory()

Load an entire directory structure from a base URL.

```typescript
loadDirectory(
  baseUrl: string,
  fileList: string[],
  basePath?: string
): Promise<InitFileEntry[]>
```

#### createTextFile()

Create a text file in memory.

```typescript
createTextFile(
  path: string,
  content: string
): InitFileEntry
```

#### cacheFiles()

Cache files in browser storage for offline use.

```typescript
cacheFiles(
  files: DosFile[],
  cacheName?: string
): Promise<void>
```

#### loadFilesWithCache()

Load files with cache support (cache-first strategy).

```typescript
loadFilesWithCache(
  files: DosFile[],
  cacheName?: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<InitFileEntry[]>
```

### Components

#### DosPlayerWithApps

Enhanced player with application loading support.

```typescript
<DosPlayerWithApps
  showSelector={true}           // Show selector on load
  onReady={(ci) => {}}          // Called when DOS is ready
  onExit={() => {}}             // Called when DOS exits
  className="custom-class"      // Custom CSS class
/>
```

**Props**:
- `showSelector`: Show app selector modal on mount
- `onReady`: Callback when DOS emulator is ready
- `onExit`: Callback when DOS exits
- `className`: Additional CSS class

#### DemoSelector

Application selector modal.

```typescript
<DemoSelector
  onSelect={(app) => {}}        // Called when app is selected
  onCancel={() => {}}           // Called when cancelled
/>
```

**Props**:
- `onSelect`: Callback with selected `DosApp`
- `onCancel`: Callback when user cancels selection

## Integration Guide

### Option 1: Replace Existing DosPlayer (Recommended)

Replace the current `DosPlayer` with `DosPlayerWithApps` in `src/App.tsx`:

```typescript
import { useState } from 'react';
import { DosPlayerWithApps } from './components/DosPlayerWithApps';
import { OfflineIndicator } from './components/OfflineIndicator';
import './App.css';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleDosReady = () => {
    console.log('[App] DOS is ready!');
    setIsReady(true);
  };

  const handleDosExit = () => {
    console.log('[App] DOS exited');
    setIsReady(false);
  };

  return (
    <div className="app">
      <OfflineIndicator onNetworkStatusChange={setIsOnline} />

      <header className="app-header">
        <div className="header-content">
          <img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
          <h1>DosKit</h1>
        </div>
      </header>

      <main className="app-main">
        <DosPlayerWithApps
          onReady={handleDosReady}
          onExit={handleDosExit}
          showSelector={true}
          className="dos-player"
        />
      </main>

      <footer className="app-footer">
        {/* Footer content */}
      </footer>
    </div>
  );
}

export default App;
```

### Option 2: Add as Separate Mode

Keep the existing DOS prompt and add applications as a separate feature:

```typescript
import { useState } from 'react';
import { DosPlayer } from './components/DosPlayer';
import { DosPlayerWithApps } from './components/DosPlayerWithApps';

function App() {
  const [mode, setMode] = useState<'prompt' | 'apps'>('prompt');

  return (
    <div className="app">
      <header className="app-header">
        <h1>DosKit</h1>

        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button
            className={mode === 'prompt' ? 'active' : ''}
            onClick={() => setMode('prompt')}
          >
            DOS Prompt
          </button>
          <button
            className={mode === 'apps' ? 'active' : ''}
            onClick={() => setMode('apps')}
          >
            Applications
          </button>
        </div>
      </header>

      <main className="app-main">
        {mode === 'prompt' ? (
          <DosPlayer className="dos-player" />
        ) : (
          <DosPlayerWithApps showSelector={true} className="dos-player" />
        )}
      </main>
    </div>
  );
}
```

### Option 3: Standalone Application Page

Create a dedicated page for a specific application:

```typescript
// src/pages/SecondRealityDemo.tsx
import { useState, useEffect } from 'react';
import { DosPlayer } from '../components/DosPlayer';
import { loadZipArchive } from '../utils/diskLoader';
import {
  secondRealityZipUrl,
  secondRealityDosboxConf,
  secondRealityMetadata,
} from '../dos-apps/second-reality.config';

export function SecondRealityDemo() {
  const [initFs, setInitFs] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    async function loadDemo() {
      try {
        setIsLoading(true);
        const zipData = await loadZipArchive(secondRealityZipUrl, (prog) => {
          setProgress(prog);
        });
        setInitFs(zipData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demo');
      } finally {
        setIsLoading(false);
      }
    }

    loadDemo();
  }, []);

  if (error) {
    return (
      <div className="error-page">
        <h1>Error Loading Second Reality</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-page">
        <h1>Loading Second Reality</h1>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(progress.loaded / progress.total) * 100}%` }}
          />
        </div>
        <p>Loading... ({progress.loaded}/{progress.total} bytes)</p>
      </div>
    );
  }

  return (
    <div className="second-reality-page">
      <header>
        <h1>{secondRealityMetadata.name}</h1>
        <p>{secondRealityMetadata.author} ({secondRealityMetadata.year})</p>
      </header>

      <main>
        <DosPlayer
          dosboxConf={secondRealityDosboxConf}
          options={{ initFs }}
        />
      </main>

      <footer>
        <p>{secondRealityMetadata.description}</p>
      </footer>
    </div>
  );
}
```

## Adding New Applications

### Step 1: Create Configuration File

Create a new configuration file in `src/dos-apps/`:

```typescript
// src/dos-apps/my-app.config.ts
import type { DosFile } from '../utils/diskLoader';

export const myAppFiles: DosFile[] = [
  { path: '/APP.EXE', url: 'https://example.com/APP.EXE' },
  { path: '/DATA.DAT', url: 'https://example.com/DATA.DAT' },
];

export const myAppDosboxConf = `
[cpu]
core=auto
cycles=max

[autoexec]
@echo off
mount c .
c:
APP.EXE
`;

export const myAppMetadata = {
  name: 'My Application',
  author: 'Author Name',
  year: 1993,
  description: 'Description of the application',
  license: 'Freeware',
};
```

### Step 2: Add to DemoSelector

Edit `src/components/DemoSelector.tsx` and add your app to the `availableApps` array:

```typescript
import { loadFilesFromUrls } from '../utils/diskLoader';
import { myAppFiles, myAppDosboxConf, myAppMetadata } from '../dos-apps/my-app.config';

const availableApps: DosApp[] = [
  // ... existing apps
  {
    id: 'my-app',
    name: myAppMetadata.name,
    description: myAppMetadata.description,
    author: myAppMetadata.author,
    year: myAppMetadata.year,
    loadMethod: 'files',
    dosboxConf: myAppDosboxConf,
    loader: async () => loadFilesFromUrls(myAppFiles),
  },
];
```

### Step 3: Test Your Application

```bash
npm run dev
```

Open the app, click "Select DOS Application", and choose your new application.

### Using ZIP Archives

For applications distributed as ZIP files:

```typescript
// src/dos-apps/my-app.config.ts
export const myAppZipUrl = 'https://example.com/my-app.zip';

export const myAppDosboxConf = `
[autoexec]
@echo off
mount c .
c:
cd my-app
APP.EXE
`;

// In DemoSelector.tsx
import { loadZipArchive } from '../utils/diskLoader';

{
  id: 'my-app',
  name: 'My Application',
  description: 'My DOS application',
  loadMethod: 'zip',
  dosboxConf: myAppDosboxConf,
  loader: async () => loadZipArchive(myAppZipUrl),
}
```

### Using Disk Images

For applications distributed as disk images:

```typescript
// src/dos-apps/my-app.config.ts
export const myAppImageUrl = 'https://example.com/my-app.img';

export const myAppDosboxConf = `
[autoexec]
@echo off
imgmount c /app.img -t hdd
c:
APP.EXE
`;

// In DemoSelector.tsx
import { loadDiskImage } from '../utils/diskLoader';

{
  id: 'my-app',
  name: 'My Application',
  description: 'My DOS application',
  loadMethod: 'disk-image',
  dosboxConf: myAppDosboxConf,
  loader: async () => loadDiskImage(myAppImageUrl, '/app.img'),
}
```

## Troubleshooting

### Files Not Loading

**Problem**: CORS errors in console

**Solutions**:
1. Ensure files are served with CORS headers
2. Use GitHub raw URLs (they support CORS)
3. Host files on the same domain
4. Use a CORS proxy for development

**Example CORS headers**:
```
Access-Control-Allow-Origin: *
```

### Demo Doesn't Start

**Problem**: Black screen or error after loading

**Solutions**:
1. Check browser console for errors
2. Verify all files loaded successfully
3. Check DOSBox configuration syntax
4. Ensure executable path is correct
5. Try increasing DOSBox cycles

### Performance Issues

**Problem**: Slow or choppy execution

**Solutions**:

1. **Adjust DOSBox cycles**:
```typescript
[cpu]
cycles=10000  // Lower for slower systems
cycles=max    // Maximum speed
```

2. **Change rendering backend**:
```typescript
options={{
  renderBackend: 'canvas', // instead of 'webgl'
}}
```

3. **Reduce video memory**:
```typescript
[video]
vmemsize=2  // Lower video memory
```

### No Sound

**Problem**: Application runs but no audio

**Solutions**:
1. Ensure Sound Blaster is configured in DOSBox config
2. Check browser audio permissions
3. Unmute the emulator
4. Try different sound card settings

**Sound Blaster configuration**:
```typescript
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
oplmode=auto
```

### Cache Not Updating

**Problem**: Old version of files keeps loading

**Solutions**:
1. Clear browser cache
2. Use different cache name
3. Increment cache version
4. Use hard reload (Ctrl+Shift+R)

## Advanced Topics

### Caching for Offline Use

Cache files in browser storage for offline access:

```typescript
import { cacheFiles, loadFilesWithCache } from './utils/diskLoader';

// Cache files on first load
await cacheFiles(myAppFiles, 'my-app-cache');

// Load with cache support (cache-first strategy)
const files = await loadFilesWithCache(myAppFiles, 'my-app-cache');
```

**Benefits**:
- Faster loading on subsequent visits
- Works offline after first load
- Reduces bandwidth usage

**Cache Management**:

```typescript
// Clear specific cache
const cache = await caches.open('my-app-cache');
await cache.delete('/APP.EXE');

// Clear all caches
const cacheNames = await caches.keys();
await Promise.all(cacheNames.map(name => caches.delete(name)));
```

### Progress Tracking

Show loading progress to users:

```typescript
import { loadFilesFromUrls } from './utils/diskLoader';

const [progress, setProgress] = useState({ loaded: 0, total: 0, currentFile: '' });

const files = await loadFilesFromUrls(
  myAppFiles,
  (prog) => {
    setProgress(prog);
    console.log(`Loading: ${prog.currentFile} (${prog.loaded}/${prog.total})`);
  }
);

// Display progress bar
<div className="progress-bar">
  <div
    className="progress-fill"
    style={{ width: `${(progress.loaded / progress.total) * 100}%` }}
  />
  <span>{progress.currentFile}</span>
</div>
```

### Custom DOSBox Configuration

Optimize DOSBox settings for specific applications:

```typescript
export const customDosboxConf = `
[cpu]
core=auto          # Automatic core selection
cputype=486        # CPU type (286, 386, 486, pentium)
cycles=max         # Maximum speed

[video]
vmemsize=8         # Video memory in MB

[dos]
ver=7.1            # DOS version
umb=true           # Upper memory blocks
ems=true           # Expanded memory
xms=true           # Extended memory

[sblaster]
sbtype=sb16        # Sound Blaster 16
sbbase=220         # Base address
irq=7              # IRQ
dma=1              # DMA channel
hdma=5             # High DMA channel
oplmode=auto       # OPL mode

[gus]
gus=true           # Enable Gravis UltraSound
gusbase=240        # Base address
gusirq=5           # IRQ
gusdma=3           # DMA channel
gusrate=44100      # Sample rate
ultradir=C:\\ULTRASND

[autoexec]
@echo off
mount c .
c:
APP.EXE
`;
```

### Creating Disk Images

Create disk images for authentic DOS experience:

**Linux/macOS**:
```bash
# Create a 1.44MB floppy image
dd if=/dev/zero of=disk.img bs=1024 count=1440

# Format as FAT12
mkfs.fat -F 12 disk.img

# Mount and copy files
sudo mount -o loop disk.img /mnt
sudo cp -r /path/to/files/* /mnt/
sudo umount /mnt

# Create a 10MB hard disk image
dd if=/dev/zero of=hdd.img bs=1M count=10
mkfs.fat -F 16 hdd.img
```

**Windows**:
- Use WinImage
- Use ImDisk Toolkit
- Use VirtualBox disk tools

### Performance Optimization

**Strategies**:

1. **Lazy Loading**: Load files only when needed
2. **Compression**: Use ZIP archives for multiple files
3. **Caching**: Cache files in browser storage
4. **CDN**: Host files on CDN for faster downloads
5. **Parallel Loading**: Load multiple files simultaneously

**File Size Recommendations**:
- Keep individual apps under 10MB for fast loading
- Use ZIP archives for larger applications
- Consider Sockdrive for apps >50MB

### Security Considerations

**Best Practices**:

1. **Validate file sizes** before loading
2. **Sanitize user-uploaded files**
3. **Implement content security policy**
4. **Verify file integrity** (checksums)
5. **Only load from trusted sources**

**Example file size validation**:

```typescript
import { validateFileSize } from './utils/diskLoader';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

try {
  await validateFileSize(fileUrl, MAX_FILE_SIZE);
  const file = await loadFile(fileUrl);
} catch (error) {
  console.error('File too large:', error);
}
```

### Runtime File Operations

Load files after emulator starts:

```typescript
function DosPlayerWithFileUpload() {
  const [ci, setCi] = useState<CommandInterface | null>(null);

  const handleReady = (commandInterface: CommandInterface) => {
    setCi(commandInterface);
  };

  const handleFileUpload = async (file: File) => {
    if (!ci) return;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write file to DOS file system
    await ci.fsWriteFile(`/C/${file.name}`, uint8Array);

    console.log(`Uploaded ${file.name} to C: drive`);
  };

  return (
    <>
      <DosPlayer onReady={handleReady} />
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
    </>
  );
}
```

### Supported Disk Image Formats

| Format | Type | Size | Use Case |
|--------|------|------|----------|
| .img | Raw disk image | Variable | Floppy/HDD images |
| .ima | Floppy image | 1.44MB | Floppy disks |
| .iso | CD-ROM image | Variable | CD-based games |
| .cue/.bin | CD image | Variable | CD audio tracks |

## Resources

- [js-dos Documentation](https://js-dos.com)
- [DOSBox Configuration](https://www.dosbox.com/wiki/Dosbox.conf)
- [Second Reality Repository](https://github.com/mtuomi/SecondReality)
- [Emscripten File System](https://emscripten.org/docs/api_reference/Filesystem-API.html)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Second Reality on Wikipedia](https://en.wikipedia.org/wiki/Second_Reality)
- [Future Crew on Wikipedia](https://en.wikipedia.org/wiki/Future_Crew)

## License & Legal

### Second Reality

Second Reality has been released into the public domain under the Unlicense license. You are free to:

- Copy, modify, publish, use, compile, sell, or distribute this software
- Use it for any purpose, commercial or non-commercial
- Use it by any means

See the [UNLICENSE](https://github.com/mtuomi/SecondReality/blob/master/UNLICENSE) file for full details.

### DosKit

DosKit is licensed under the MIT License. See the LICENSE file in the repository for details.

---

**Made with ❤️ by [Cameron Rye](https://rye.dev)**
