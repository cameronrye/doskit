# js-dos Dependency Management Strategy

**Document Version:** 1.0  
**Date:** 2025-11-18  
**Status:** Evaluated and Documented

## Executive Summary

This document evaluates different approaches for managing the js-dos dependency in DosKit and documents the chosen strategy. After careful analysis, **the current hybrid approach (npm package + local script loading)** is recommended as the optimal solution for this project.

## Current Implementation

### Overview

DosKit currently uses a **hybrid approach**:

- js-dos is installed as an npm dependency (`js-dos@8.3.20`)
- The library files are served locally from the `public/` directory
- js-dos is loaded via `<script>` tag in `index.html` before the React app
- The library is accessed via the global `window.Dos` object

### File Structure

```
public/
├── js-dos.js          (304KB - main library)
├── js-dos.css         (112KB - styles)
└── emulators/         (9.6MB - WASM files)
    ├── wdosbox.wasm
    ├── wdosbox-x.wasm
    ├── wlibzip.wasm
    └── supporting files
```

**Total Size:** ~10MB of js-dos assets

### Loading Sequence

1. Browser loads `index.html`
2. `js-dos.css` and `js-dos.js` load synchronously
3. `window.Dos` becomes available globally
4. React app loads and initializes
5. WASM files load on-demand when emulator starts

## Alternative Approaches Evaluated

### Option 1: CDN Approach

Load js-dos from the official CDN (`https://v8.js-dos.com/latest/`)

### Option 2: Full Bundling

Import js-dos as an ES module and bundle it with the React app

### Option 3: Current Hybrid (Recommended)

npm package + local script loading (current implementation)

## Evaluation Criteria

| Criterion                | Weight | Description                                     |
| ------------------------ | ------ | ----------------------------------------------- |
| **Performance**          | High   | Initial load time, caching, runtime performance |
| **Reliability**          | High   | Availability, offline support, version control  |
| **Maintenance**          | Medium | Update process, dependency management           |
| **Developer Experience** | Medium | Type safety, debugging, tooling support         |
| **Bundle Size**          | Medium | Impact on initial page load                     |
| **Offline Support**      | High   | PWA functionality, service worker caching       |

## Detailed Comparison

### Option 1: CDN Approach

#### Implementation

```html
<link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css" />
<script src="https://v8.js-dos.com/latest/js-dos.js"></script>
```

#### Pros

- No local storage of large files
- Automatic updates (if using `/latest/`)
- Shared browser cache across sites
- Reduced deployment size

#### Cons

- **External dependency** - site breaks if CDN is down
- **No offline support** - critical for PWA functionality
- **Version instability** - `/latest/` can introduce breaking changes
- **Privacy concerns** - third-party requests
- **No version pinning** - harder to ensure consistency
- **Network latency** - additional DNS lookup and connection

**Verdict:** **Not Recommended** - Conflicts with PWA offline-first approach

---

### Option 2: Full Bundling

#### Implementation

```typescript
import { Dos } from "js-dos";
// Bundle js-dos with Vite/Rollup
```

#### Pros

- Type-safe imports
- Tree-shaking potential
- Single bundle management
- Better IDE support

#### Cons

- **Large bundle size** - adds 300KB+ to main bundle
- **Slower initial load** - blocks React app loading
- **WASM complexity** - difficult to bundle WASM files properly
- **Build complexity** - requires special Vite/Rollup configuration
- **js-dos architecture** - designed for global script loading
- **Initialization timing** - harder to ensure js-dos loads before React

**Verdict:** **Not Recommended** - Increases complexity without clear benefits

---

### Option 3: Hybrid Approach (Current)

#### Implementation

```json
// package.json
"dependencies": {
  "js-dos": "8.3.20"
}
```

```html
<!-- index.html -->
<link rel="stylesheet" href="/js-dos.css" />
<script src="/js-dos.js"></script>
```

#### Pros

- **Full offline support** - all files served locally
- **Version control** - pinned to specific version
- **Fast loading** - parallel loading with HTML
- **Service worker caching** - excellent PWA support
- **No external dependencies** - works without internet
- **Type safety** - TypeScript definitions from npm package
- **Predictable behavior** - no surprise updates
- **Optimal architecture** - matches js-dos design
- **Easy debugging** - source maps available locally

#### Cons

Note: **Manual updates** - need to copy files when updating
Note: **Larger repository** - 10MB of static assets
Note: **Deployment size** - larger initial deployment

**Verdict:** **RECOMMENDED** - Best balance for PWA requirements

## Recommendation

### Chosen Strategy: Hybrid Approach (Current Implementation)

**Rationale:**

1. **PWA Requirements**: DosKit is a Progressive Web App that must work offline. The hybrid approach ensures all assets are available locally and can be cached by the service worker.

2. **Reliability**: No external dependencies means the app works regardless of CDN availability or network conditions.

3. **Performance**: Loading js-dos as a separate script allows parallel loading and doesn't block the React bundle. The browser can cache it independently.

4. **Version Stability**: Pinning to a specific version (8.3.20) ensures consistent behavior and prevents breaking changes from automatic updates.

5. **Developer Experience**: Having js-dos in package.json provides TypeScript definitions and makes the dependency explicit.

## Implementation Guidelines

### Updating js-dos

When updating to a new version of js-dos:

1. Update package.json:

   ```bash
   npm install js-dos@<new-version>
   ```

2. Copy files to public directory:

   ```bash
   cp node_modules/js-dos/dist/js-dos.js public/
   cp node_modules/js-dos/dist/js-dos.css public/
   cp -r node_modules/js-dos/dist/emulators public/
   ```

3. Test thoroughly:
   - Verify emulator initialization
   - Test offline functionality
   - Check service worker caching
   - Validate TypeScript types

4. Update version references in documentation

### Service Worker Configuration

Ensure `public/sw.js` caches js-dos assets:

```javascript
const STATIC_ASSETS = [
  "/js-dos.js",
  "/js-dos.css",
  "/emulators/wdosbox.wasm",
  "/emulators/wdosbox-x.wasm",
  "/emulators/wlibzip.wasm",
  // ... other emulator files
];
```

### Future Considerations

**Monitor for:**

- js-dos v9 release (may change architecture)
- ES module support in js-dos (could enable bundling)
- WASM bundling improvements in Vite/Rollup
- Changes in PWA best practices

**Reevaluate if:**

- js-dos adds official ES module support
- Bundle size becomes a critical issue
- CDN reliability significantly improves
- Offline support becomes less important

## Conclusion

The current hybrid approach optimally balances performance, reliability, and maintainability for DosKit's requirements as a Progressive Web App. While it requires manual file management during updates, this trade-off is acceptable given the benefits of offline support, version stability, and predictable behavior.

**Status:** Current implementation validated and documented
**Next Review:** When js-dos v9 is released or significant architecture changes occur
