# DosKit Roadmap

> **Mission**: Preserve and celebrate vintage DOS demoscene productions, audio applications, and legacy software through modern web technology.

**Current Status**: Foundation Complete • Phase 1 (Content Expansion) in progress  
**Focus Areas**: Demoscene Productions • Music Trackers • Legacy Productivity Software  
**Explicitly Excluded**: Gaming applications (this is not a DOS game emulator)

The plan no longer carries target dates: the quarters it first set, Q2 2025 to Q2 2026, have passed, and no new ones have been set. The phases keep their original order.

---

## Current State (November 2026)

### ✅ Completed

- Solid technical foundation (React 19, TypeScript, js-dos WebAssembly)
- Cross-platform PWA with offline support: after the first visit the app and its DOS prompt work offline, and each application does once it has been opened online
- Performance optimizations (WebGL rendering, DOSBox in a worker thread)
- Comprehensive documentation and test coverage (about 98% of lines)
- Deep linking support (`/?app=<id>`)
- Mobile-responsive design
- CI on every pull request to `main` (lint, formatting, type check, tests, the build and a check of its CSS against the oldest supported browsers, and an audit of the production dependencies); `main` deploys only once it passes
- 10 DOS applications configured:
  - **Second Reality** (1993 demo by Future Crew)
  - **Unreal** (1992 demo by Future Crew)
  - **Panic** (1993 demo by Future Crew)
  - **Crystal Dream 2** (1993 demo by Triton)
  - **Starport BBS Intro II** (1993 BBS intro by Future Crew)
  - **Squid BBS Intro** (1994 BBS intro by cld & The Doctor)
  - **3D Rotation Demo** (1993 tutorial example by Draeden of VLA)
  - **Starfield Effect** (1993 tutorial example by Draeden of VLA)
  - **Impulse Tracker** (music tracker by Jeffrey Lim, in its 1997 release)
  - **Scream Tracker 3** (1994 music tracker by Future Crew)

### 🎯 Key Opportunities

- Expand application library from 10 to 50+ applications
- Add demoscene-specific features (party metadata, rankings)
- Implement save state management
- Build community features (the contribution path for new applications is in place, see Phase 5)
- Create curated collections and playlists

---

## Phase 1: Content Expansion (In Progress)

**Goal**: Establish DosKit as a comprehensive demoscene and audio application platform

DosKit runs DOS programs only, so an entry below that was released for another platform, such as Windows or the Amiga, needs a DOS version before it can be added.

### Priority 1: Expand Demo Library

**Target**: Add 15 classic demoscene productions

**Progress**: Unreal, Panic and Crystal Dream 2 from the list below are in, along with Starport BBS Intro II, Squid BBS Intro, 3D Rotation Demo and Starfield Effect.

#### Legendary Demos to Add

- **Future Crew**: Unreal (1992), Panic (1993) ✅
- **Triton**: Crystal Dream 2 (1993) ✅
- **Orange**: X14 (1995)
- **Farbrausch**: fr-08: .the .product (2000, Windows), fr-041: debris. (2007, Windows)
- **Fairlight & Alcatraz**: Uncovering Static (2011, Windows)
- **Andromeda Software Development**: Lifeforce (2007, Windows)
- **Rgba & TBC**: Elevated (2009, Windows) - 4KB intro
- **Sanity**: World of Commodore (1992, Amiga)

**Implementation**:

- Create config files in `src/dos-apps/` (`src/dos-apps/README.md` walks through adding an app)
- Host ZIP archives in `public/demos/`
- Add comprehensive metadata (party, year, ranking, credits); the app registry has author and year so far
- Include links to Pouet.net, YouTube, Scene.org
- Add screenshots/thumbnails for each demo

### Priority 2: Expand Music Tracker Library

**Target**: Add 5 essential music trackers

#### Trackers to Add

- **FastTracker II** (1994) - Most popular tracker, XM format
- **Scream Tracker 3** (1994) - S3M format creator ✅
- **ModPlug Tracker** (1997) - Advanced features
- **Protracker** (DOS version) - Classic Amiga-style
- **Adlib Tracker II** (1995) - FM synthesis specialist

**Implementation**:

- Optimize `musicTracker()` DOSBox preset for each (Impulse Tracker and Scream Tracker 3 start from it)
- Include sample module files for testing (the Impulse Tracker and Scream Tracker 3 archives ship with example modules)
- Add keyboard shortcut documentation
- Create tracker comparison guide

### Priority 3: Add Legacy Productivity Software

**Target**: Add 5 important DOS productivity tools

#### Software to Add

- **Norton Commander** - File manager
- **Turbo Pascal 7.0** - Development environment
- **QBasic** - Programming environment
- **WordPerfect 5.1** - Word processor
- **Lotus 1-2-3** - Spreadsheet

**Legal Compliance**: Only include freeware, open-source, or legally distributable versions

**Deliverables**:

- 25 total DOS applications
- Rich metadata for all applications
- Screenshots and thumbnails
- Comprehensive documentation

---

## Phase 2: Core Features (Not Started)

**Goal**: Essential user experience improvements

### Feature 1: Advanced Search & Filtering

**Impact**: HIGH | **Effort**: MEDIUM

**Capabilities**:

- Full-text search across names, descriptions, authors
- Filter by: year, party, category, platform, tags
- Sort by: name, year, popularity, date added
- Fuzzy search for typos
- Real-time search results

**Implementation**:

```typescript
interface SearchFilters {
  query: string;
  yearRange?: [number, number];
  parties?: string[];
  categories?: ('demo' | 'tracker' | 'utility')[];
  tags?: string[];
  sortBy: 'name' | 'year' | 'popularity' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
}
```

### Feature 2: Save State Management

**Impact**: HIGH | **Effort**: HIGH

**Capabilities**:

- Save/load an application's DOS file system to IndexedDB (js-dos saves files, such as saved modules and settings, not the running machine)
- Multiple save slots per application
- Auto-save on exit (optional)
- Quick save/load keyboard shortcuts
- State metadata (timestamp, screenshot thumbnail)

**js-dos Integration**:

```typescript
// Save state: js-dos packs the changes to the DOS file system into a bundle
const changes = await ci.persist(true);
if (changes) await saveToIndexedDB(appId, slotId, changes);

// Load state: there is no ci.load(); restart the app with the saved bundle after its archive
// (js-dos unpacks initFs's bundles in order, so the saved changes land on top of the archive)
const saved = await loadFromIndexedDB(appId, slotId);
Dos(container, { ...options, initFs: [archive, saved] });
```

### Feature 3: User Preferences & Settings

**Impact**: MEDIUM | **Effort**: LOW

**Status**: js-dos's settings panel already keeps the volume, the mouse sensitivity, the aspect ratio, the image rendering, the theme and the on-screen controls' scale in `localStorage`, and DosKit passes them to each new player (`getStoredSettings()` in `src/config/jsdos.config.ts`), so they last through app switches and reloads; the rest below is open.

**Settings to Persist**:

- Volume level ✅
- Render backend preference (WebGL/Canvas)
- CPU cycles preference
- Aspect ratio preference ✅
- Recently used applications (last 10)
- Favorites/bookmarks
- Auto-save preference

**Storage**: Use localStorage for preferences, IndexedDB for save states (`src/utils/storage.ts` already wraps localStorage so that blocked or full storage never throws)

### Feature 4: Screenshot Capture

**Impact**: MEDIUM | **Effort**: LOW

**Capabilities**:

- Hotkey: `F12` or `Print Screen`
- Save as PNG with timestamp
- Copy to clipboard
- Gallery view of captured screenshots
- Share screenshots via URL

**Implementation**:

```typescript
const imageData = await ci.screenshot();
const blob = imageDataToBlob(imageData);
downloadBlob(blob, `${appName}-${timestamp}.png`);
```

### Feature 5: Keyboard Shortcuts

**Impact**: MEDIUM | **Effort**: LOW

The application selector already works from the keyboard (the arrow keys, Home, End, Space, Enter and Escape); DosKit has none of the global shortcuts below yet. While the page has the focus, js-dos sends every key to the DOS program, so a shortcut DosKit takes is a key the program loses: `Ctrl+S` below, for one, is Scream Tracker 3's quicksave.

**Global Shortcuts**:

- `Ctrl+O` - Open application selector
- `Ctrl+R` - Restart current application
- `Ctrl+S` - Quick save state
- `Ctrl+L` - Quick load state
- `F11` - Toggle fullscreen
- `Ctrl+M` - Mute/unmute
- `F12` - Screenshot
- `Ctrl+H` - Show keyboard shortcuts help

**Deliverables**:

- Feature-complete emulator platform
- Persistent user preferences
- Save state functionality
- Screenshot capabilities
- Comprehensive keyboard shortcuts

---

## Phase 3: Demoscene Features (Not Started)

**Goal**: Demoscene-specific enhancements and community features

### Feature 1: Demo Metadata System

**Impact**: HIGH | **Effort**: MEDIUM

**Enhanced Metadata**:

```typescript
interface DemoMetadata {
  party?: {
    name: string; // "Assembly 1993"
    year: number;
    location?: string; // "Helsinki, Finland"
  };
  ranking?: {
    position: number; // 1st place
    category: string; // "PC Demo"
  };
  platform: {
    cpu: string; // "486 DX2/66"
    memory: string; // "4 MB RAM"
    graphics: string; // "VGA"
    sound: string; // "Gravis UltraSound"
  };
  credits: {
    code?: string[]; // ["Purple Motion", "Skaven"]
    graphics?: string[];
    music?: string[];
  };
  links: {
    pouet?: string; // Pouet.net URL
    youtube?: string; // YouTube video
    scene_org?: string; // Scene.org download
    github?: string; // Source code (if available)
  };
  tags: string[]; // ["demo", "assembly", "future-crew", "1993"]
}
```

**UI Enhancements**:

- Rich information display in app selector
- Detailed view with party info, rankings, credits
- Links to external resources
- Platform requirements display

### Feature 2: Demo Collections

**Impact**: MEDIUM | **Effort**: MEDIUM

**Curated Collections**:

- "Best of Assembly" (Finnish demoparty)
- "Best of The Party" (Danish demoparty)
- "Best of Breakpoint" (German demoparty)
- "4KB Intros" - Size-limited demos
- "64KB Intros" - Size-limited demos
- "Music Disks" - Audio-focused demos
- "Disk Magazines" - Scene publications

**Implementation**:

```typescript
interface DemoCollection {
  id: string;
  name: string;
  description: string;
  apps: string[]; // Array of app IDs
  thumbnail?: string;
  curator?: string;
  tags: string[];
}
```

### Feature 3: Pouet.net Integration

**Impact**: MEDIUM | **Effort**: LOW

**Integration Features**:

- Display production info from Pouet.net
- Show ratings and comments count
- Link to related productions
- Embed screenshots from Pouet.net
- "View on Pouet.net" button

**API**: Use Pouet.net API (if available) or web scraping

### Feature 4: Educational Content

**Impact**: MEDIUM | **Effort**: LOW

**Content to Add**:

- "What is the Demoscene?" page
- History of major demoparties
- Glossary of demoscene terms
- Links to demoscene resources:
  - Pouet.net (production database)
  - Scene.org (file archive)
  - Demozoo (production database)
  - Demoscene.info (news and articles)

**Deliverables**:

- Rich demoscene metadata system
- Curated demo collections
- Pouet.net integration
- Educational content for newcomers

---

## Phase 4: Audio Features (Not Started)

**Goal**: Enhanced music tracker and audio application support

### Feature 1: Module File Player

**Impact**: HIGH | **Effort**: HIGH

**Capabilities**:

- Native module file playback (without loading full tracker)
- Support formats: MOD, S3M, XM, IT
- Use Web Audio API or libopenmpt.js
- Playlist functionality
- Display pattern/sample information
- Waveform visualization

**Use Case**: Listen to tracked music without running the full tracker application

**Implementation**:

```typescript
interface ModulePlayer {
  load(file: Uint8Array): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  seek(position: number): void;
  getInfo(): ModuleInfo;
  getWaveform(): Float32Array;
}
```

### Feature 2: Audio Recording

**Impact**: MEDIUM | **Effort**: MEDIUM

**Capabilities**:

- Capture audio output from DOS applications
- Record to WAV/MP3
- Real-time or offline rendering
- Export functionality
- Waveform visualization
- Recording indicator

**Implementation**:

```typescript
interface AudioRecorder {
  start(): void;
  stop(): Blob;
  isRecording(): boolean;
  getWaveform(): Float32Array;
  export(format: 'wav' | 'mp3'): Blob;
}
```

### Feature 3: Sample Library

**Impact**: MEDIUM | **Effort**: MEDIUM

**Content**:

- Classic drum samples (808, 909, etc.)
- Synthesizer samples
- Sound effects
- Pre-made instruments
- Legal, royalty-free samples

**Organization**:

- Browse by category
- Search functionality
- Preview samples
- Download individual or bulk
- Import into trackers

### Feature 4: Tracker Tutorials

**Impact**: MEDIUM | **Effort**: MEDIUM

**Tutorial Content**:

- "Getting Started with Impulse Tracker"
- "Creating Your First Module"
- "Understanding Patterns and Samples"
- "Effects and Commands Reference"
- "Mixing and Mastering Tips"

**Format**:

- Interactive tutorials within the app
- Video tutorials (embedded YouTube)
- Step-by-step guides
- Example module files

### Feature 5: MIDI Support (Optional)

**Impact**: MEDIUM | **Effort**: HIGH

**Capabilities**:

- Connect external MIDI controllers
- Route MIDI to DOS applications
- Support General MIDI playback
- Virtual MIDI keyboard
- MIDI file import/export

**Deliverables**:

- Module file player
- Audio recording capabilities
- Sample library
- Comprehensive tracker tutorials
- Optional MIDI support

---

## Phase 5: Community & Polish (Partly Done)

**Goal**: Community engagement and platform refinement

### Feature 1: Contribution System

**Impact**: HIGH | **Effort**: MEDIUM

**Status**: Largely in place. `src/dos-apps/README.md` gives the steps and templates for a new application, CI runs `src/config/apps.config.test.ts` on every pull request to check each registered application, CONTRIBUTING.md sets out the guidelines, and `main` deploys once CI passes. A community review process is still open.

**Capabilities**:

- Submit new applications via GitHub PR
- Template for app config files
- Automated validation (CI/CD)
- Contribution guidelines
- Community review process

**Workflow**:

1. User creates app config using template
2. Submits PR to GitHub
3. Automated tests validate config
4. Community reviews and approves
5. Merged and deployed automatically

### Feature 2: Share Links with Timestamps

**Impact**: MEDIUM | **Effort**: LOW

**Status**: Links to an application (`?app=secondreality`) work; timestamps, share buttons, embed codes and QR codes do not exist yet.

**Capabilities**:

- URL format: `?app=secondreality&time=120`
- Auto-start at specific timestamp
- Share on social media (Twitter, Reddit, Discord)
- Embed codes for websites
- QR code generation

### Feature 3: Video Recording

**Impact**: MEDIUM | **Effort**: HIGH

**Capabilities**:

- Record video of DOS applications
- Use MediaRecorder API
- Record at 60fps
- Include audio
- Export as WebM/MP4
- Progress indicator
- Max recording length (configurable)

**Use Case**: Create demo videos, tutorials, or preserve demo runs

### Feature 4: Performance Optimizations

**Impact**: MEDIUM | **Effort**: MEDIUM

**Optimizations**:

- Lazy loading optimization: preload popular apps (started: the selector preloads an app's config on hover)
- Memory usage monitoring and cleanup (started: DosKit releases each stopped player's WebGL context, while js-dos 8.3.20 still keeps every stopped player in memory)
- Startup time reduction: WASM preloading ✅ (`index.html` preloads the DOSBox backend's `wdosbox.wasm`, which Chromium uses; Safari does not, and downloads the file twice on a first visit)
- Service worker prefetching (started: install precaches the app shell, every JS and CSS bundle, and the js-dos player with its DOSBox backend; application archives are cached on first use)
- Progressive image loading
- Code splitting optimization ✅ (each app's config is a chunk of its own, and so is React)

### Feature 5: Mobile Experience Improvements

**Impact**: MEDIUM | **Effort**: MEDIUM

**Status**: Mobile devices get DosKit's compact on-screen keyboard layout first, with js-dos's full keyboard and function-key layout behind its ⎘ key (`mobileJsDosConfig` in `src/config/jsdos.config.ts`). In windows under 500px tall, such as a phone held sideways, the header and footer keep to one row, and on iPhones the page keeps clear of the notch, the status bar and the home indicator. The enhancements below are open.

**Enhancements**:

- Optimized touch controls for trackers
- Virtual keyboard layouts per app type
- Landscape mode optimization
- Gesture support (pinch to zoom, swipe)
- Mobile-specific UI adjustments
- Performance tuning for mobile devices

**Deliverables**:

- Community contribution system
- Share links with timestamps
- Video recording capabilities
- Performance optimizations
- Enhanced mobile experience

---

## Technical Debt & Architecture

### State Management Migration

**Priority**: HIGH | **Timeline**: Not scheduled (was Q3 2025)

**Current**: Props drilling and local state
**Target**: Zustand or Context API
**Benefit**: Cleaner code, better performance, easier testing

**Implementation**:

```typescript
// Example with Zustand
interface AppStore {
  currentApp: DosApp | null;
  favorites: string[];
  recentApps: string[];
  preferences: UserPreferences;
  saveStates: Map<string, SaveState[]>;
  setCurrentApp: (app: DosApp) => void;
  addFavorite: (appId: string) => void;
  removeFavorite: (appId: string) => void;
  addRecentApp: (appId: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}
```

### Component Refactoring

**Priority**: MEDIUM | **Timeline**: Not scheduled (was Q4 2025)

**Current**: Some large components (DemoSelector, DosPlayerWithApps); DosPlayer is already split into the `useDosEmulator` hook and `DosPlayerUI`
**Target**: Smaller, focused components
**Benefit**: Better testability, reusability, maintainability

**Refactoring Plan**:

- Split `DosPlayerWithApps` into smaller components
- Extract loading/error states into separate components
- Create reusable UI components library
- Improve component composition

### Test Coverage Increase

**Priority**: MEDIUM | **Timeline**: Ongoing

**Current**: About 98% of lines, 97% of statements, 96% of functions and 91% of branches, over every source file in `src/` (`npm run test:coverage`, November 2026)
**Floor**: `npm run test:coverage`, which CI runs, fails below the thresholds in `vitest.config.ts`, 8 to 16 points under these figures
**Target**: 85%+ coverage (met)
**Benefit**: Fewer bugs, easier refactoring, better documentation

**Focus Areas**:

- Integration tests for user flows (started: `src/integration/` renders the whole app with js-dos faked)
- E2E tests for critical paths
- Visual regression tests
- Performance tests

### Performance Monitoring

**Priority**: LOW | **Timeline**: Not scheduled (was Q1 2026)

**Current**: No performance tracking
**Target**: Comprehensive performance monitoring
**Benefit**: Identify bottlenecks, track improvements, user experience insights

**Tools**:

- Web Vitals (LCP, INP, CLS)
- Performance Observer API
- Custom performance metrics
- Error tracking (Sentry integration); errors go to a console tracker (`src/utils/errorTracking.ts`) for now

### Documentation Improvements

**Priority**: LOW | **Timeline**: Ongoing

**Enhancements**:

- Generate API docs with TypeDoc (already configured)
- Create user-facing documentation
- Expand contribution guide with examples (started: `src/dos-apps/README.md` walks through adding an app)
- Add video tutorials
- Create FAQ section

---

## Success Metrics

### Application Library

- **Current**: 10 applications (November 2026)
- **Next**: 25 applications
- **Then**: 50 applications
- **Long term**: 100+ applications

### User Engagement

- Track application usage and popularity
- Monitor favorites and bookmarks
- Measure share link usage
- Track community contributions

### Performance

- Maintain <3s load time on desktop
- Maintain <5s load time on mobile
- 60fps rendering for demos
- <100ms input latency for trackers

### Compatibility

- Support 95%+ of modern browsers
- Test on major platforms (Windows, macOS, Linux, iOS, Android)
- Ensure offline functionality works reliably

### Community

- Enable and measure community contributions
- Track GitHub stars, forks, and PRs
- Monitor social media mentions
- Gather user feedback and feature requests

---

## Priority Matrix

### High Impact, Low Effort (Do First)

✅ **Phase 1 Priority**

- Expand demo library (15 demos)
- Expand tracker library (5 trackers)
- Add screenshots/thumbnails
- User preferences persistence
- Keyboard shortcuts
- Educational content

### High Impact, High Effort (Plan Carefully)

📋 **Phase 2-4 Priority**

- Save state management
- Module file player
- Advanced search & filtering
- Audio recording
- Video recording
- State management migration

### Low Impact, Low Effort (Quick Wins)

⚡ **Ongoing**

- Demo collections
- Pouet.net links
- Share links with timestamps
- Keyboard shortcut help
- Error message improvements
- Documentation updates

### Low Impact, High Effort (Deprioritize)

⏸️ **Future Consideration**

- Cloud save sync
- Comments & ratings system
- MIDI support
- Plugin system
- Multi-language support

---

## Contributing to the Roadmap

This roadmap is a living document and community input is welcome!

### How to Contribute

1. **Suggest Features**: Open a GitHub issue with the `enhancement` label
2. **Prioritize Features**: Comment on existing issues with your use case
3. **Implement Features**: Submit PRs following the contribution guidelines
4. **Report Bugs**: Help us identify and fix issues

### Roadmap Updates

- Reviewed and updated quarterly
- Community feedback incorporated
- Progress tracked in GitHub Projects
- Major changes announced in CHANGELOG.md

---

## Conclusion

DosKit aims to become the premier platform for preserving and experiencing vintage DOS demoscene productions, music trackers, and legacy software. By focusing on these specific use cases and building community-driven features, we can create a unique and valuable tool for the demoscene and vintage computing communities.

**Next Steps**:

1. Continue Phase 1: Content Expansion
2. Gather community feedback on priorities
3. Establish contribution guidelines and templates ✅ (CONTRIBUTING.md, `src/dos-apps/README.md`)
4. Build momentum with quick wins

**Join us in preserving DOS-era creative software!**

---

Made with ❤️ by [Cameron Rye](https://rye.dev/)
