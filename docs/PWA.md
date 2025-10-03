# Progressive Web App (PWA) Features

DosKit is a fully-featured Progressive Web App that provides offline functionality, installability, and a native app-like experience.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Offline Functionality](#offline-functionality)
- [Service Worker](#service-worker)
- [Icon Generation](#icon-generation)
- [Testing](#testing)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)

## Features

### ✅ Installable
- Install DosKit as a standalone app on desktop and mobile devices
- Add to home screen on iOS and Android
- Launch from app drawer or desktop
- Full-screen experience without browser UI

### ✅ Offline Support
- Works completely offline after first visit
- Caches all essential assets (HTML, CSS, JavaScript, WASM files)
- Automatic cache updates when new versions are available
- Offline indicator shows connection status

### ✅ Fast Loading
- Service worker caches assets for instant loading
- Stale-while-revalidate strategy for optimal performance
- Pre-caches critical resources during installation

### ✅ Native App Experience
- Standalone display mode (no browser UI)
- Custom splash screen
- Theme color integration
- App shortcuts (future enhancement)

## Installation

### Desktop (Chrome, Edge, Brave)

1. Visit the DosKit website
2. Look for the install icon in the address bar (⊕ or install icon)
3. Click "Install" in the prompt
4. The app will be installed and can be launched from:
   - Windows: Start Menu or Desktop
   - macOS: Applications folder or Launchpad
   - Linux: Application menu

### Mobile (Android)

1. Visit the DosKit website in Chrome or Edge
2. Tap the menu (⋮) and select "Add to Home screen" or "Install app"
3. Confirm the installation
4. Launch from your home screen or app drawer

### Mobile (iOS/iPadOS)

1. Visit the DosKit website in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. Launch from your home screen

**Note:** iOS doesn't support full PWA features like service workers in standalone mode, but the app will still work with limited offline capabilities.

## Offline Functionality

### What Works Offline

After the first visit, DosKit caches:

- ✅ Main application (HTML, CSS, JavaScript)
- ✅ js-dos library and emulator files
- ✅ WASM modules (DOSBox, DOSBox-X, libzip)
- ✅ Static assets (logos, icons, fonts)
- ✅ Previously loaded DOS applications

### What Requires Internet

- ❌ Loading new DOS applications from external URLs
- ❌ Downloading new .jsdos bundles
- ❌ Accessing remote sockdrive content
- ❌ Checking for app updates

### Offline Indicator

DosKit displays connection status:

- **Online**: Green dot in bottom-right corner
- **Offline**: Orange banner at top with offline message
- **Reconnected**: Brief "Back online" notification

## Service Worker

### Caching Strategy

DosKit uses a **Stale-While-Revalidate** strategy:

1. **First Request**: Fetch from network, cache response
2. **Subsequent Requests**: 
   - Return cached version immediately (fast!)
   - Update cache in background from network
   - Next visit gets updated content

### Cache Management

The service worker automatically:

- Caches essential assets during installation
- Updates cache when new versions are available
- Cleans up old caches on activation
- Handles offline fallbacks

### Manual Cache Control

You can programmatically control the cache:

```typescript
import { clearCaches, cacheUrls } from './utils/serviceWorkerRegistration';

// Clear all caches
await clearCaches();

// Cache specific URLs
await cacheUrls(['/my-dos-app.jsdos', '/custom-asset.png']);
```

### Service Worker Lifecycle

1. **Install**: Pre-cache essential assets
2. **Activate**: Clean up old caches
3. **Fetch**: Serve cached content, update in background
4. **Update**: Notify user when new version is available

## Icon Generation

### Automated Generation (Recommended)

Install sharp and generate icons:

```bash
npm install --save-dev sharp
npm run generate-icons
```

This creates all required icon sizes from `public/logo.svg`.

### Manual Generation

Use the icon generator HTML tool:

```bash
npm run create-icon-generator
```

Then open `public/icons/icon-generator.html` in your browser and download the icons.

### Required Icon Sizes

- 72x72, 96x96, 128x128, 144x144, 152x152 (small/medium)
- 192x192 (standard PWA icon)
- 384x384, 512x512 (large icons)
- 192x192-maskable, 512x512-maskable (Android adaptive icons)

See [public/icons/README.md](../public/icons/README.md) for detailed instructions.

## Testing

### Local Testing

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview
   ```

3. **Test in browser:**
   - Open DevTools (F12)
   - Go to Application tab
   - Check:
     - Manifest: Verify all fields are correct
     - Service Workers: Ensure it's registered and active
     - Cache Storage: Verify assets are cached
     - Offline: Toggle offline mode and test functionality

### Lighthouse Audit

Run a PWA audit with Lighthouse:

1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Generate report"
5. Review the results and fix any issues

**Target Score:** 90+ for PWA category

### Manual Testing Checklist

- [ ] App installs successfully on desktop
- [ ] App installs successfully on mobile (Android)
- [ ] App works offline after first visit
- [ ] Offline indicator appears when disconnected
- [ ] Install prompt appears (if not already installed)
- [ ] Service worker updates when new version is deployed
- [ ] Icons display correctly in all sizes
- [ ] Splash screen shows on launch (mobile)
- [ ] Theme color matches app design
- [ ] App shortcuts work (if implemented)

## Browser Support

### Full PWA Support

- ✅ Chrome 67+ (Desktop & Android)
- ✅ Edge 79+ (Desktop & Android)
- ✅ Brave (Desktop & Android)
- ✅ Samsung Internet 8.2+
- ✅ Firefox 90+ (limited support)
- ✅ Opera 54+

### Partial Support

- ⚠️ Safari 11.1+ (iOS/macOS)
  - No service worker in standalone mode on iOS
  - Limited offline functionality
  - Add to Home Screen works
  - No install prompt

### Not Supported

- ❌ Internet Explorer (any version)
- ❌ Legacy Edge (EdgeHTML)
- ❌ Chrome < 67
- ❌ Firefox < 90

## Troubleshooting

### Service Worker Not Registering

**Problem:** Service worker fails to register.

**Solutions:**
1. Ensure you're using HTTPS (or localhost)
2. Check browser console for errors
3. Verify `public/sw.js` exists and is accessible
4. Clear browser cache and reload
5. Check that service workers are enabled in browser settings

### App Not Installing

**Problem:** Install prompt doesn't appear.

**Solutions:**
1. Ensure all PWA requirements are met (manifest, service worker, HTTPS)
2. Check that icons are properly configured in manifest
3. Verify the app isn't already installed
4. Try in a different browser
5. Check browser console for manifest errors

### Offline Mode Not Working

**Problem:** App doesn't work offline.

**Solutions:**
1. Visit the app while online first (to cache assets)
2. Check that service worker is active (DevTools → Application → Service Workers)
3. Verify assets are cached (DevTools → Application → Cache Storage)
4. Clear cache and reload to re-cache assets
5. Check service worker console for errors

### Icons Not Displaying

**Problem:** Icons don't show in manifest or on home screen.

**Solutions:**
1. Generate icons using `npm run generate-icons`
2. Verify icons exist in `public/icons/` directory
3. Check icon paths in `public/manifest.json`
4. Clear browser cache
5. Rebuild the app: `npm run build`
6. Check that icon files are valid PNG images

### Cache Not Updating

**Problem:** Old version of app keeps loading.

**Solutions:**
1. Unregister service worker (DevTools → Application → Service Workers → Unregister)
2. Clear all caches (DevTools → Application → Clear storage)
3. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
4. Close all tabs and reopen
5. Update cache version in `public/sw.js` (increment `CACHE_VERSION`)

### Update Notification Not Showing

**Problem:** Users don't see update notifications.

**Solutions:**
1. Increment `CACHE_VERSION` in `public/sw.js`
2. Ensure `onUpdate` callback is configured in `src/main.tsx`
3. Close all tabs and reopen to trigger update
4. Check service worker update cycle in DevTools

## Advanced Configuration

### Customizing the Manifest

Edit `public/manifest.json` to customize:

- App name and description
- Theme and background colors
- Display mode (standalone, fullscreen, minimal-ui)
- Orientation (portrait, landscape, any)
- App shortcuts
- Screenshots

### Customizing the Service Worker

Edit `public/sw.js` to customize:

- Cache version (for forcing updates)
- Cached assets list
- Caching strategy
- Offline fallback behavior
- Background sync
- Push notifications

### Customizing Install Prompt

Edit `src/components/OfflineIndicator.tsx` to customize:

- Install prompt timing
- Install prompt design
- Install prompt behavior
- Dismissal logic

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (Advanced Service Worker Library)](https://developers.google.com/web/tools/workbox)
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

