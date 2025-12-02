# DosKit Roadmap

> **Mission**: Preserve and celebrate vintage DOS demoscene productions, audio applications, and legacy software through modern web technology.

**Current Status**: Foundation Complete (v1.0.1)
**Focus Areas**: Demoscene Productions • Music Trackers • Legacy Productivity Software  
**Explicitly Excluded**: Gaming applications (this is not a DOS game emulator)

---

## Current State (Q1 2025)

### ✅ Completed

- Solid technical foundation (React 19, TypeScript, js-dos WebAssembly)
- Cross-platform PWA with offline support
- Performance optimizations (WebGL, OffscreenCanvas, worker threads)
- Comprehensive documentation and test coverage (70%+)
- Deep linking support
- Mobile-responsive design
- 2 DOS applications configured:
  - **Second Reality** (1993 demo by Future Crew)
  - **Impulse Tracker** (1995 music tracker by Jeffrey Lim)

### 🎯 Key Opportunities

- Expand application library from 2 to 50+ applications
- Add demoscene-specific features (party metadata, rankings)
- Implement save state management
- Build community features and contribution system
- Create curated collections and playlists

---

## Phase 1: Content Expansion (Q2 2025)

**Goal**: Establish DosKit as a comprehensive demoscene and audio application platform

### Priority 1: Expand Demo Library

**Target**: Add 15 classic demoscene productions

#### Legendary Demos to Add

- **Future Crew**: Unreal (1992), Panic (1992)
- **Triton**: Crystal Dream 2 (1993)
- **Orange**: X14 (1995)
- **Farbrausch**: fr-08: .the .product (2000)
- **Conspiracy**: Debris (2007)
- **Fairlight**: Uncovering Static (2008)
- **Andromeda Software Development**: Lifeforce (2007)
- **Rgba**: Elevated (2009) - 4KB intro
- **Mercury**: Blue Flame (1996)
- **Sanity**: World of Commodore (1992)

**Implementation**:

- Create config files in `src/dos-apps/demos/`
- Host ZIP archives in `public/demos/`
- Add comprehensive metadata (party, year, ranking, credits)
- Include links to Pouet.net, YouTube, Scene.org
- Add screenshots/thumbnails for each demo

### Priority 2: Expand Music Tracker Library

**Target**: Add 5 essential music trackers

#### Trackers to Add

- **FastTracker II** (1994) - Most popular tracker, XM format
- **Scream Tracker 3** (1994) - S3M format creator
- **ModPlug Tracker** (1997) - Advanced features
- **Protracker** (DOS version) - Classic Amiga-style
- **Adlib Tracker II** (1995) - FM synthesis specialist

**Implementation**:

- Optimize `musicTracker()` DOSBox preset for each
- Include sample module files for testing
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

- 25 total DOS applications (from 2)
- Rich metadata for all applications
- Screenshots and thumbnails
- Comprehensive documentation

---

## Phase 2: Core Features (Q3 2025)

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

- Save/load emulator state to IndexedDB
- Multiple save slots per application
- Auto-save on exit (optional)
- Quick save/load keyboard shortcuts
- State metadata (timestamp, screenshot thumbnail)

**js-dos Integration**:

```typescript
// Save state
const state = await ci.save();
await saveToIndexedDB(appId, slotId, state);

// Load state
const state = await loadFromIndexedDB(appId, slotId);
await ci.load(state);
```

### Feature 3: User Preferences & Settings

**Impact**: MEDIUM | **Effort**: LOW

**Settings to Persist**:

- Volume level
- Render backend preference (WebGL/Canvas)
- CPU cycles preference
- Aspect ratio preference
- Recently used applications (last 10)
- Favorites/bookmarks
- Auto-save preference

**Storage**: Use localStorage for preferences, IndexedDB for save states

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

## Phase 3: Demoscene Features (Q4 2025)

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

## Phase 4: Audio Features (Q1 2026)

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

## Phase 5: Community & Polish (Q2 2026)

**Goal**: Community engagement and platform refinement

### Feature 1: Contribution System

**Impact**: HIGH | **Effort**: MEDIUM

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

- Lazy loading optimization (preload popular apps)
- Memory usage monitoring and cleanup
- Startup time reduction (WASM preloading)
- Service worker prefetching
- Progressive image loading
- Code splitting optimization

### Feature 5: Mobile Experience Improvements

**Impact**: MEDIUM | **Effort**: MEDIUM

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

**Priority**: HIGH | **Timeline**: Q3 2025

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

**Priority**: MEDIUM | **Timeline**: Q4 2025

**Current**: Some large components (DosPlayerWithApps)
**Target**: Smaller, focused components
**Benefit**: Better testability, reusability, maintainability

**Refactoring Plan**:

- Split `DosPlayerWithApps` into smaller components
- Extract loading/error states into separate components
- Create reusable UI components library
- Improve component composition

### Test Coverage Increase

**Priority**: MEDIUM | **Timeline**: Ongoing

**Current**: 70%+ coverage
**Target**: 85%+ coverage
**Benefit**: Fewer bugs, easier refactoring, better documentation

**Focus Areas**:

- Integration tests for user flows
- E2E tests for critical paths
- Visual regression tests
- Performance tests

### Performance Monitoring

**Priority**: LOW | **Timeline**: Q1 2026

**Current**: No performance tracking
**Target**: Comprehensive performance monitoring
**Benefit**: Identify bottlenecks, track improvements, user experience insights

**Tools**:

- Web Vitals (LCP, FID, CLS)
- Performance Observer API
- Custom performance metrics
- Error tracking (Sentry integration)

### Documentation Improvements

**Priority**: LOW | **Timeline**: Ongoing

**Enhancements**:

- Generate API docs with TypeDoc (already configured)
- Create user-facing documentation
- Expand contribution guide with examples
- Add video tutorials
- Create FAQ section

---

## Success Metrics

### Application Library

- **Current**: 2 applications
- **Q2 2025**: 25 applications
- **Q4 2025**: 50 applications
- **Q2 2026**: 100+ applications

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

1. Begin Phase 1: Content Expansion (Q2 2025)
2. Gather community feedback on priorities
3. Establish contribution guidelines and templates
4. Build momentum with quick wins

**Join us in preserving DOS-era creative software!**

---

Made with ❤️ by [Cameron Rye](https://rye.dev/)
