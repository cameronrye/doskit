# Browser Compatibility Guide

DosKit is designed to work across all modern browsers that support WebAssembly and modern web standards. This document provides detailed information about browser compatibility, requirements, and known limitations.

## Table of Contents

- [Supported Browsers](#supported-browsers)
- [Required Features](#required-features)
- [Desktop Browsers](#desktop-browsers)
- [Mobile Browsers](#mobile-browsers)
- [PWA Support](#pwa-support)
- [Performance Recommendations](#performance-recommendations)
- [Known Limitations](#known-limitations)
- [Testing Results](#testing-results)
- [Troubleshooting](#troubleshooting)

## Supported Browsers

### ✅ Fully Supported (Recommended)

These browsers provide the best experience with full feature support:

| Browser | Minimum Version | Recommended Version | Notes |
|---------|----------------|---------------------|-------|
| **Chrome** | 90+ | Latest | Best performance, full PWA support |
| **Edge** | 90+ | Latest | Chromium-based, full PWA support |
| **Brave** | 1.25+ | Latest | Privacy-focused, full support |
| **Opera** | 76+ | Latest | Full support |

### ⚠️ Supported with Limitations

These browsers work but may have some limitations:

| Browser | Minimum Version | Recommended Version | Limitations |
|---------|----------------|---------------------|-------------|
| **Firefox** | 88+ | Latest | Limited PWA support, no install prompt |
| **Safari** | 15+ | Latest | Limited service worker support on iOS |
| **Safari iOS** | 15+ | Latest | No service worker in standalone mode |

### ❌ Not Supported

| Browser | Reason |
|---------|--------|
| **Internet Explorer** | No WebAssembly support |
| **Legacy Edge (EdgeHTML)** | Outdated, use Chromium Edge instead |
| **Chrome < 90** | Missing required WebAssembly features |
| **Firefox < 88** | Missing required WebAssembly features |
| **Safari < 15** | Limited WebAssembly and service worker support |

## Required Features

DosKit requires the following browser features:

### Essential (Required)

- ✅ **WebAssembly (WASM)** - Core emulation engine
  - Required for DOSBox emulation
  - Minimum: WASM MVP (2017)
  - Recommended: WASM with threads and SIMD
  
- ✅ **JavaScript ES2022** - Modern JavaScript features
  - Required for application logic
  - Includes: async/await, modules, classes
  
- ✅ **Web Workers** - Background processing
  - Required for non-blocking emulation
  - Used by js-dos for WASM execution

### Recommended (Enhanced Experience)

- ⭐ **WebGL** - Hardware-accelerated rendering
  - Improves rendering performance
  - Fallback to Canvas2D available
  
- ⭐ **IndexedDB** - Local storage
  - Used for caching and file storage
  - Fallback to memory storage available
  
- ⭐ **Service Workers** - Offline functionality
  - Enables PWA features
  - Required for offline mode
  
- ⭐ **Web App Manifest** - PWA installation
  - Enables "Add to Home Screen"
  - Desktop and mobile installation

### Optional (Enhanced Features)

- 🔹 **Pointer Lock API** - Mouse capture
  - Required for DOS games with mouse input
  - Not required for keyboard-only apps
  
- 🔹 **Fullscreen API** - Fullscreen mode
  - Enhanced gaming experience
  - Not required for basic functionality
  
- 🔹 **Web Audio API** - Sound output
  - Required for DOS applications with sound
  - Mute option available

## Desktop Browsers

### Chrome / Chromium (Recommended)

**Minimum Version:** 90+  
**Recommended Version:** Latest stable

**Features:**
- ✅ Full WebAssembly support with threads and SIMD
- ✅ Complete PWA support with install prompt
- ✅ Service worker support
- ✅ WebGL 2.0 support
- ✅ Best performance

**Installation:**
1. Visit DosKit in Chrome
2. Click the install icon in the address bar
3. Click "Install" in the prompt
4. App appears in Applications folder

**Known Issues:**
- None

### Firefox

**Minimum Version:** 88+  
**Recommended Version:** Latest stable

**Features:**
- ✅ Full WebAssembly support
- ⚠️ Limited PWA support (no install prompt)
- ✅ Service worker support
- ✅ WebGL 2.0 support
- ✅ Good performance

**Installation:**
- Manual installation via browser settings
- No automatic install prompt

**Known Issues:**
- No install prompt (Firefox limitation)
- Service worker may require manual enable in about:config

### Safari (macOS)

**Minimum Version:** 15+  
**Recommended Version:** Latest stable

**Features:**
- ✅ WebAssembly support
- ⚠️ Limited PWA support
- ⚠️ Limited service worker support
- ✅ WebGL support
- ⚠️ Moderate performance

**Installation:**
- Add to Dock via File menu
- Limited standalone mode

**Known Issues:**
- Service worker limitations
- WebAssembly performance lower than Chrome
- Some WASM features may not be available

### Edge (Chromium)

**Minimum Version:** 90+  
**Recommended Version:** Latest stable

**Features:**
- ✅ Full WebAssembly support (same as Chrome)
- ✅ Complete PWA support
- ✅ Service worker support
- ✅ WebGL 2.0 support
- ✅ Excellent performance

**Installation:**
- Same as Chrome
- Integrates with Windows Start Menu

**Known Issues:**
- None

## Mobile Browsers

### Chrome Mobile (Android)

**Minimum Version:** 90+  
**Recommended Version:** Latest stable

**Features:**
- ✅ Full WebAssembly support
- ✅ Complete PWA support
- ✅ Add to Home Screen
- ✅ Service worker support
- ✅ Good performance on modern devices

**Installation:**
1. Visit DosKit in Chrome Mobile
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. App appears on home screen

**Performance:**
- Excellent on flagship devices (2020+)
- Good on mid-range devices (2018+)
- May struggle on low-end devices

**Known Issues:**
- Performance depends on device hardware
- May require 2GB+ RAM for smooth operation

### Safari Mobile (iOS)

**Minimum Version:** 15+  
**Recommended Version:** Latest stable

**Features:**
- ✅ WebAssembly support
- ⚠️ Limited PWA support
- ❌ No service worker in standalone mode
- ✅ WebGL support
- ⚠️ Moderate performance

**Installation:**
1. Visit DosKit in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. App appears on home screen

**Performance:**
- Good on iPhone 12 and newer
- Moderate on iPhone X to 11
- May struggle on older devices

**Known Issues:**
- No offline functionality in standalone mode
- Service worker disabled in standalone mode (iOS limitation)
- WebAssembly performance lower than Android
- 256MB WASM memory limit on some devices

### Firefox Mobile

**Minimum Version:** 88+  
**Recommended Version:** Latest stable

**Features:**
- ✅ WebAssembly support
- ⚠️ Limited PWA support
- ✅ Service worker support
- ✅ WebGL support
- ⚠️ Moderate performance

**Known Issues:**
- No install prompt
- Performance varies by device

### Samsung Internet

**Minimum Version:** 8.2+  
**Recommended Version:** Latest stable

**Features:**
- ✅ Full WebAssembly support
- ✅ PWA support
- ✅ Service worker support
- ✅ Good performance

**Known Issues:**
- None

## PWA Support

### Full PWA Support

Browsers with complete PWA functionality:

- ✅ Chrome (Desktop & Android)
- ✅ Edge (Desktop & Android)
- ✅ Brave (Desktop & Android)
- ✅ Samsung Internet
- ✅ Opera

**Features:**
- Install prompt
- Standalone mode
- Service worker
- Offline functionality
- App shortcuts
- Background sync

### Partial PWA Support

Browsers with limited PWA functionality:

- ⚠️ Firefox (Desktop & Mobile)
  - No install prompt
  - Service worker works
  - Manual installation only

- ⚠️ Safari (macOS & iOS)
  - Add to Home Screen works
  - Limited service worker support
  - No install prompt
  - No service worker in standalone mode (iOS)

## Performance Recommendations

### Minimum Requirements

- **CPU:** Dual-core 1.5 GHz or better
- **RAM:** 2GB available
- **GPU:** WebGL-capable (most modern devices)
- **Storage:** 50MB for cached files

### Recommended Specifications

- **CPU:** Quad-core 2.0 GHz or better
- **RAM:** 4GB+ available
- **GPU:** Dedicated GPU or modern integrated graphics
- **Storage:** 100MB+ for cached files
- **Network:** Broadband for initial load (10+ Mbps)

### Performance Tips

1. **Use Chrome or Edge** for best performance
2. **Enable hardware acceleration** in browser settings
3. **Close unnecessary tabs** to free up memory
4. **Use WebGL rendering** (default, don't disable)
5. **Keep browser updated** to latest version

## Known Limitations

### All Browsers

- **WASM Memory Limit:** Some browsers limit WASM memory to 2GB
- **Audio Latency:** Web Audio API has inherent latency
- **File System Access:** Limited to virtual file system

### Safari-Specific

- **iOS Service Worker:** Disabled in standalone mode
- **WASM Performance:** 2-3x slower than Chrome
- **Memory Limits:** 256MB WASM limit on some iOS devices
- **Audio Issues:** May require user interaction to start

### Firefox-Specific

- **No Install Prompt:** PWA installation requires manual steps
- **Service Worker:** May need manual enable in about:config

### Mobile-Specific

- **Battery Drain:** Emulation is CPU-intensive
- **Thermal Throttling:** Performance may decrease when device heats up
- **Background Execution:** Limited when app is backgrounded

## Testing Results

DosKit has been tested on the following configurations:

### Desktop

| OS | Browser | Version | Status | Notes |
|----|---------|---------|--------|-------|
| Windows 11 | Chrome | 120+ | ✅ Pass | Excellent performance |
| Windows 11 | Edge | 120+ | ✅ Pass | Excellent performance |
| Windows 11 | Firefox | 121+ | ✅ Pass | Good performance |
| macOS 14 | Chrome | 120+ | ✅ Pass | Excellent performance |
| macOS 14 | Safari | 17+ | ⚠️ Limited | Works, limited PWA |
| macOS 14 | Firefox | 121+ | ✅ Pass | Good performance |
| Ubuntu 22.04 | Chrome | 120+ | ✅ Pass | Excellent performance |
| Ubuntu 22.04 | Firefox | 121+ | ✅ Pass | Good performance |

### Mobile

| Device | OS | Browser | Status | Notes |
|--------|----|---------| -------|-------|
| Pixel 7 | Android 14 | Chrome | ✅ Pass | Excellent |
| Galaxy S23 | Android 14 | Chrome | ✅ Pass | Excellent |
| Galaxy S23 | Android 14 | Samsung Internet | ✅ Pass | Excellent |
| iPhone 15 | iOS 17 | Safari | ⚠️ Limited | Works, no offline in standalone |
| iPhone 13 | iOS 16 | Safari | ⚠️ Limited | Works, slower performance |
| OnePlus 9 | Android 13 | Chrome | ✅ Pass | Good |

## Troubleshooting

### "WebAssembly is not supported"

**Problem:** Browser doesn't support WebAssembly.

**Solutions:**
1. Update browser to latest version
2. Use a modern browser (Chrome, Edge, Firefox)
3. Check browser compatibility table above

### Poor Performance

**Problem:** Emulation is slow or choppy.

**Solutions:**
1. Close unnecessary tabs and applications
2. Enable hardware acceleration in browser settings
3. Use Chrome or Edge for best performance
4. Check CPU/RAM usage in Task Manager
5. Try a less demanding DOS application

### Service Worker Not Working

**Problem:** Offline mode doesn't work.

**Solutions:**
1. Ensure you're using HTTPS (or localhost)
2. Check browser supports service workers
3. Clear browser cache and reload
4. Check browser console for errors
5. Try a different browser

### Can't Install as PWA

**Problem:** No install prompt appears.

**Solutions:**
1. Use Chrome, Edge, or Brave (best PWA support)
2. Ensure you're on HTTPS
3. Check manifest.json is accessible
4. Try manual installation (browser menu)
5. Firefox requires manual installation

### Audio Not Working

**Problem:** No sound from DOS applications.

**Solutions:**
1. Click on the page to enable audio (browser requirement)
2. Check browser audio permissions
3. Unmute the emulator
4. Check system volume
5. Try a different browser

---

## Additional Resources

- [MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API/WebAssembly#browser_compatibility)
- [Can I Use WebAssembly](https://caniuse.com/wasm)
- [PWA Browser Support](https://caniuse.com/serviceworkers)
- [js-dos Documentation](https://js-dos.com/)

---

**Last Updated:** 2025-10-05  
**DosKit Version:** 1.0.0

