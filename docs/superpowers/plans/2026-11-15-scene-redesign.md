# Scene Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give DosKit a real start page and a demoscene look (VGA palette, copper bars, pixel type, CRT-framed screenshots, DOS windows) across every screen, without regressing keyboard, focus, screen-reader, offline or short-window behaviour.

**Architecture:** App owns the route (`start`, `app` or `prompt`). It renders a new `StartPage` at `/`, and `DosPlayerWithApps` for a production (`/<id>`) or the plain DOS prompt (`/dos`). The selector dialog and its pick path go away. Every production loads through the requested-app path, now with download progress, and always waits on its `ProductionPage` for Play. While a production runs, a `RunBar` replaces the header and footer. Shared design tokens live in `src/index.css`. Small shared pieces (`CrtScreen`, `DosWindow`, `KeyHint`, `SiteFooter`) carry the look.

**Tech Stack:** React 19, TypeScript 5.9, plain CSS, Vite 8, Vitest 4 with Testing Library (jsdom), Playwright (Chromium), sharp for the thumbnails, `@fontsource/silkscreen` and `@fontsource/vt323` 5.3.0.

**Spec:** `docs/superpowers/specs/2026-11-15-scene-redesign-design.md`. Read it first. The mockups are in `docs/superpowers/specs/2026-11-15-scene-redesign/`.

## Global Constraints

- Branch `feat/scene-redesign`. It goes to `main` once, when every task is done. Commits follow the repo's conventional style (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), and carry no AI attribution.
- Stack: React 19, TypeScript and plain CSS, one `Component.css` per component (`docs/STYLE_GUIDE.md`). No CSS framework or component library.
- Browser floor: Chrome/Edge 98, Firefox 94, Safari/iOS 15.4. No `:has()`, container queries, CSS nesting or subgrid. Keep `100vh` before `100dvh`, and no media queries in range syntax. `node scripts/check-built-css.js` must pass after `npm run build`.
- Contrast: WCAG 2.1 AA, 4.5:1 for text and 3:1 for focus rings and borders that carry meaning. Note each new pair's ratio in a CSS comment, as the existing CSS does. Red (`--vga-red`) on light grey fails, so don't use it for accelerator letters.
- Type: Silkscreen (display) is uppercase and 16px or larger. VT323 (interface) is 18px or larger. Anything longer than a line uses the reading stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- Scanlines only over screenshots, never over text. No motion beyond hover and focus transitions, and `prefers-reduced-motion` is respected. Forced-colours mode uses system colours (`Highlight`, `CanvasText`).
- Fonts are bundled from the fontsource packages, never loaded from Google Fonts at runtime. The OFL 1.1 text is in `public/licenses/`.
- Keys around DOS: DosKit's controls keep their keys from DOS (`keepKeyFromDos` and `watchKeysAroundDos` in `src/utils/keysAroundDos.ts`, wired at App's root). Controls in the running view take no focus from a click (`onMouseDown={(e) => e.preventDefault()}`). There are no single-key shortcuts while DOS runs.
- Layout hooks: respect `--offline-banner-height`, `--install-prompt-height` and `env(safe-area-inset-*)`. Under `(max-height: 500px)`, bars stay one row.
- Wording: "production", never "application", in anything a user sees or hears. Play, Start (tracker) and Read (diskmag) stay.
- `e2e/hook.js` finds the Play button by the class `doskit-play-button` and its accessible name. Keep both. Keep the class `doskit-start-hint` too.
- Every task ends green: `npm run lint`, `npm test`, and for tasks that touch the build or the UI, also `npm run build && node scripts/check-built-css.js && npm run test:e2e`.
- Shell: `cp` and `rm` are interactive aliases here, so use `/bin/cp` and `/bin/rm`. Vitest also runs tests under `.claude/worktrees/`, so don't put a worktree there, or remove it before running the suite.
- Deviations from the spec, decided here:
  - Thumbnails live in `src/assets/thumbs/` rather than `public/thumbs/`, so Vite gives them hashed names and the service worker precaches them like bundles.
  - They keep each frame's width up to 640px, stretched to 4:3 (0.69 MB measured for all 53).
  - The DemoSelector and `retro-floppy` are deleted in Task 7, when the selector is retired, rather than in Phase 5.

## Review Focus

1. **Search input:** surrounding spaces, mixed case, a four-digit year, words in any order, or nothing matching. Expected: case-insensitive, trimmed, matches name, author, year and description, and nothing matching shows an empty state with Clear search. (Tests: Task 4, Task 6.)
2. **Modified or middle clicks on a grid link** (Ctrl, Cmd, Shift, middle button). Expected: the browser's default, such as a new tab or window, and DosKit doesn't navigate in place. (Test: Task 5.)
3. **Saved start-page state that is stale or corrupt:** bad JSON, an unknown kind, wrong types, or a focus id for a production that no longer exists. Expected: defaults, no crash, and focus on the first production. (Tests: Task 4, Task 6.)
4. **Shortcut keys typed into the search, held with Ctrl, Alt or Meta, or pressed while About is open.** Expected: typing types, combinations belong to the browser, and Escape closes About without leaving the page. (Tests: Task 6, Task 10.)
5. **A production page whose download stalls, or fails offline.** Expected: an error in the page with Try again after 20 s with no data, and never an endless spinner. (Tests: Task 7, Task 10.)

---

## Phase 1: Foundation

### Task 1: Tokens, fonts and base styles

**Files:**

- Modify: `package.json` (dependencies), `src/main.tsx`, `src/index.css`, `index.html:26`, `public/manifest.json:9-10`, `public/licenses/index.html`, `e2e/server.mjs` (TYPES)
- Create: `public/licenses/ofl-1.1.txt`, `src/styles/tokens.test.ts`
- Test: `src/styles/tokens.test.ts`, `scripts/licenses-page.test.js`

**Interfaces:**

- Produces these CSS custom properties on `:root` in `src/index.css`, which every later task uses and no component redefines:
  - VGA palette: `--vga-black #000000`, `--vga-blue #0000aa`, `--vga-green #00aa00`, `--vga-cyan #00aaaa`, `--vga-red #aa0000`, `--vga-magenta #aa00aa`, `--vga-brown #aa5500`, `--vga-lightgrey #aaaaaa`, `--vga-darkgrey #555555`, `--vga-lightblue #5555ff`, `--vga-lightgreen #55ff55`, `--vga-lightcyan #55ffff`, `--vga-lightred #ff5555`, `--vga-lightmagenta #ff55ff`, `--vga-yellow #ffff55`, `--vga-white #ffffff`.
  - Semantic: `--surface` (black), `--surface-raised` (`#0d0d12`), `--text` (lightgrey), `--text-strong` (white), `--author` (cyan), `--year` (lightmagenta), `--accent` (lightcyan), `--title` (yellow), `--focus` (yellow), `--warning` (yellow), `--danger` (lightred), `--window` (blue), `--window-text` (lightgrey), `--window-title` (yellow), `--menu` (lightgrey), `--menu-text` (black), `--menu-accel` (blue), `--menu-selected` (blue), `--menu-selected-text` (white), `--key` (cyan), `--key-text` (black).
  - Fonts: `--font-display: 'Silkscreen', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`, `--font-ui: 'VT323', <same fallbacks>`, `--font-read: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- Produces global utility classes in `src/index.css`:
  - `.copper` (10px stripe, purple, pink and gold), `.copper--thin` (4px), `.copper--blue` (4px blue stripe)
  - `.visually-hidden`
  - `.dos-menu` (a grey bar), `.dos-menu-item`, and `.dos-menu-item[aria-pressed='true']` (blue with white text)

- [ ] **Step 1: Write the failing token test** in `src/styles/tokens.test.ts`. It reads `src/index.css` with `node:fs`, collects `--name: value` declarations from the first `:root` block, resolves `var(--x)` one level, and computes WCAG contrast.

```ts
const PAIRS: [fg: string, bg: string, min: number][] = [
  ['--text', '--surface', 4.5],
  ['--text-strong', '--surface', 4.5],
  ['--author', '--surface', 4.5],
  ['--year', '--surface', 4.5],
  ['--accent', '--surface', 4.5],
  ['--title', '--surface', 4.5],
  ['--window-text', '--window', 4.5],
  ['--window-title', '--window', 4.5],
  ['--accent', '--window', 4.5],
  ['--text-strong', '--window', 4.5],
  ['--menu-text', '--menu', 4.5],
  ['--menu-accel', '--menu', 4.5],
  ['--menu-selected-text', '--menu-selected', 4.5],
  ['--key-text', '--key', 4.5],
  ['--danger', '--surface', 4.5],
  ['--warning', '--window', 4.5],
  ['--focus', '--surface', 3],
];
it.each(PAIRS)('%s on %s meets %s:1', (fg, bg, min) => {
  expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(min);
});
it('defines the 16 VGA colours', () => {
  expect(color('--vga-blue')).toBe('#0000aa');
  expect(color('--vga-yellow')).toBe('#ffff55');
  expect(Object.keys(tokens).filter((name) => name.startsWith('--vga-'))).toHaveLength(16);
});
```

- [ ] **Step 2: Run** `npx vitest run src/styles/tokens.test.ts`. Expected: FAIL (no `--vga-blue`).
- [ ] **Step 3: Install the fonts.** Run `npm install --save-exact @fontsource/silkscreen@5.3.0 @fontsource/vt323@5.3.0`, then check that `node_modules/@fontsource/vt323/latin-400.css` and `node_modules/@fontsource/silkscreen/latin-400.css` exist. Import both at the top of `src/main.tsx`, before `./index.css`.
- [ ] **Step 4: Rewrite `src/index.css`.**
  - The `:root` tokens above.
  - Body background `var(--surface)`, text `var(--text)` and font `var(--font-read)`, replacing Vite's `#1a1a1a`, `#646cff` and Segoe UI defaults.
  - Links in `var(--accent)`. Focus as a `2px solid var(--focus)` outline.
  - Buttons inherit the font and have no rounded corners.
  - The utility classes above.
  - Keep the reset, the overflow and viewport rules, the reduced-motion block, and the scrollbar rules recoloured to tokens.
- [ ] **Step 5: Run** `npx vitest run src/styles/tokens.test.ts`. Expected: PASS.
- [ ] **Step 6: Licences.**
  - Add a test to `scripts/licenses-page.test.js`, `it('links the OFL-1.1 text of the Silkscreen and VT323 fonts, which is next to it')`. It expects `urls` to contain `/licenses/ofl-1.1.txt`, and the file to match `/SIL OPEN FONT LICENSE Version 1.1/`.
  - Run it. Expected: FAIL.
  - Copy `node_modules/@fontsource/vt323/LICENSE` to `public/licenses/ofl-1.1.txt` with `/bin/cp`, and add a section for the two fonts to `public/licenses/index.html`.
  - Run it again. Expected: PASS.
- [ ] **Step 7: Colours and serving.**
  - `index.html` `theme-color` and `public/manifest.json` `theme_color` become `#000000`, and `background_color` becomes `#000000`.
  - Add `'.woff2': 'font/woff2'` and `'.woff': 'font/woff'` to `TYPES` in `e2e/server.mjs`.
- [ ] **Step 8: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js`. Expected: all pass, and `dist/assets` holds `*.woff2` files.
- [ ] **Step 9: Commit:** `feat: add the VGA design tokens and bundle the Silkscreen and VT323 fonts`

### Task 2: Thumbnails, precached

**Files:**

- Create: `scripts/generate-thumbnails.js`, `scripts/generate-thumbnails.test.js`, `src/assets/thumbs/<urlId>.png` (53, generated), `src/config/thumbnails.ts`, `src/config/thumbnails.test.ts`
- Modify: `package.json` (script `generate-thumbnails`), `scripts/inject-sw-version.js:44` (`BUNDLE_FILE`), `scripts/inject-sw-version.test.js`, `src/dos-apps/README.md` (new step), `src/vite-env.d.ts` only if the glob needs typing

**Interfaces:**

- Produces `renderThumbnail(frame: Buffer): Promise<{ png: Buffer; width: number; height: number }>` in `scripts/generate-thumbnails.js`.
- Produces `thumbnailOf(app: Pick<DosApp, 'id'>): string | undefined` in `src/config/thumbnails.ts`, the URL Vite gives `src/assets/thumbs/<urlId>.png`, where `urlId` is `app.id` without hyphens, as for the cards.

- [ ] **Step 1: Write failing tests** in `scripts/generate-thumbnails.test.js`:

```js
it('stretches a 320x200 frame to 320x240 with hard pixels', async () => {
  const frame = await sharp({
    create: { width: 320, height: 200, channels: 3, background: '#0000aa' },
  })
    .png()
    .toBuffer();
  const { width, height, png } = await renderThumbnail(frame);
  expect([width, height]).toEqual([320, 240]);
  expect((await sharp(png).metadata()).width).toBe(320);
});
it('keeps a 640x400 frame at 640 wide, 4:3', async () => {
  /* 640x400 -> 640x480 */
});
it('narrows a frame wider than 640 to 640x480', async () => {
  /* 792x558 -> 640x480 */
});
it('has a 4:3 thumbnail for every production, under 2 MB in all', () => {
  // For every src/apps/<id>.json (not .page.json): src/assets/thumbs/<id without hyphens>.png
  // exists, width <= 640, width * 3 === height * 4 (PNG header bytes 16 and 20), total < 2_000_000
});
```

- [ ] **Step 2: Run** `npx vitest run scripts/generate-thumbnails.test.js`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement `renderThumbnail`.**
  - `width = Math.min(source.width, 640)`, and `height = Math.round(width * 3 / 4)`.
  - Use kernel `'lanczos3'` when the source is wider than 640, and `'nearest'` otherwise, with `fit: 'fill'`.
  - Output a palette PNG: `{ palette: true, colours: 256, compressionLevel: 9 }`.
  - The script's main block mirrors `scripts/generate-app-cards.js`: it reads `cards-src/<urlId>.png` for each `src/apps/*.json` and writes `src/assets/thumbs/<urlId>.png`.
  - Add `"generate-thumbnails": "node scripts/generate-thumbnails.js"` to `package.json`.
- [ ] **Step 4: Run** `npm run generate-thumbnails`, then `npx vitest run scripts/generate-thumbnails.test.js`. Expected: 53 files written, all tests PASS.
- [ ] **Step 5: Write the failing test** in `src/config/thumbnails.test.ts`: `it('gives every production a thumbnail URL')` loops over `availableApps` and expects `thumbnailOf(app)` to match `/thumbs\/[a-z0-9]+.*\.png/`. Then run it. Expected: FAIL.
- [ ] **Step 6: Implement `thumbnailOf`** with `import.meta.glob('../assets/thumbs/*.png', { eager: true, query: '?url', import: 'default' })`, keyed by file name without extension. Run the test. Expected: PASS.
- [ ] **Step 7: Precache.**
  - Add a test to `scripts/inject-sw-version.test.js`: `collectBundledAssets` of a temp `dist` holding `assets/a.js`, `assets/b.css`, `assets/c.woff2`, `assets/d.png`, `assets/e.woff` and `assets/a.js.map` returns the first four, sorted. Run it. Expected: FAIL.
  - Change `BUNDLE_FILE` to `/\.(?:js|css|woff2|png)$/`, and update the comment above `collectBundledAssets` to name fonts and thumbnails. Run it again. Expected: PASS.
- [ ] **Step 8: Document.** In `src/dos-apps/README.md`, add a step after the card step: run `npm run generate-thumbnails` and commit `src/assets/thumbs/<urlId>.png` with the card, before any commit, because the hook tests the whole tree.
- [ ] **Step 9: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js && grep -o "/assets/[^'\"]*\.png" dist/sw.js | wc -l`. Expected: all pass, and a count of about 42. The 11 thumbnails under 4 KB are inlined into the JS bundle as data URIs, which works offline too.
- [ ] **Step 10: Commit:** `feat: give each production a thumbnail from its frame, precached for offline use`

### Task 3: Shared pieces of the look

**Files:**

- Create: `src/components/CrtScreen.tsx`, `CrtScreen.css`, `CrtScreen.test.tsx`; `src/components/DosWindow.tsx`, `DosWindow.css`, `DosWindow.test.tsx`; `src/components/KeyHint.tsx`, `KeyHint.css`; `src/components/SiteFooter.tsx`, `SiteFooter.css`, `SiteFooter.test.tsx`; `e2e/tools/screens.mjs`

**Interfaces:**

- `CrtScreen({ src, alt, size = 'medium', loading = 'lazy' }: { src: string | undefined; alt: string; size?: 'small' | 'medium' | 'large'; loading?: 'lazy' | 'eager' })`. It renders `div.crt.crt--<size>` around `img.crt-image` with `width={320} height={240}`. With no `src` it renders the frame with no image. The scanlines and highlight are a `::after` over the image only.
- `DosWindow({ title, titleId, as = 'div', className, children }: { title?: ReactNode; titleId?: string; as?: 'div' | 'section' | 'aside'; className?: string; children: ReactNode })`. It renders `<as class="dos-window">` with an inner `div.dos-window-frame`, the 4px double `--window-title` border, and `span.dos-window-title` with `id={titleId}` set into the border.
- `KeyHint({ keyName, children }: { keyName: string; children: ReactNode })` renders `span.key-hint` with `<kbd>{keyName}</kbd>` followed by `children`.
- `SiteFooter({ className }: { className?: string })` renders `<footer class="site-footer">` with these links, each `target="_blank" rel="noopener noreferrer"` as today:
  - "Made by **Cameron Rye**" to `https://rye.dev/`
  - "Powered by **js-dos v{import.meta.env.VITE_JSDOS_VERSION}**" to `https://js-dos.com`
  - "**Licenses**" to `/licenses/`
- `node e2e/tools/screens.mjs <baseUrl> <outDir> [path ...]` captures each path (default `/` and `/secondreality`) at 1440×900, 390×844 and 844×390, and with `forcedColors: 'active'` at 1440×900. Files are named `<path-slug>-<w>x<h>[-forced].png`. Later tasks use it for visual checks.

- [ ] **Step 1: Write failing tests.**
  - `CrtScreen.test.tsx`: it renders an `img` with the given `alt`, `width` 320, `height` 240 and `loading="lazy"`, and no `img` without `src`.
  - `DosWindow.test.tsx`: the title is rendered with the given `id`, so a parent can use `aria-labelledby`, and the `as` element is used.
  - `SiteFooter.test.tsx`: these assertions move from App's `Footer` suite, adapted to the new text: the three links, their `href`s, `target`, `rel`, and that the js-dos version equals the installed `js-dos/package.json` version.
- [ ] **Step 2: Run** `npx vitest run src/components/CrtScreen.test.tsx src/components/DosWindow.test.tsx src/components/SiteFooter.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the four components and their CSS** from the Interfaces above, using only Task 1's tokens. KeyHint gets no test of its own: StartPage and ProductionPage cover it.
- [ ] **Step 4: Run the same tests.** Expected: PASS.
- [ ] **Step 5: Write `e2e/tools/screens.mjs`.** Import `chromium` from `@playwright/test`. Then run `npx vite --port 5199 --strictPort` in the background and `node e2e/tools/screens.mjs http://localhost:5199 /tmp/doskit-screens`. Expected: 8 PNGs written. Stop the server.
- [ ] **Step 6: Commit:** `feat: add the CRT screen, DOS window, key hint and footer pieces`

## Phase 2: Start page

### Task 4: Filtering, grid geometry and saved start-page state

**Files:**

- Create: `src/utils/productionFilter.ts`, `src/utils/productionFilter.test.ts`, `src/utils/gridColumns.ts`, `src/utils/gridColumns.test.ts`, `src/utils/startPageState.ts`, `src/utils/startPageState.test.ts`

**Interfaces:**

- `productionFilter.ts`:
  - `type KindFilter = 'all' | AppKind`
  - `const KIND_TABS: readonly { kind: KindFilter; label: string }[]`, in the order All, Demos, Intros, Trackers, Musicdisks, Effects, Diskmag
  - `kindLabel(kind: AppKind): string`, the tab label, such as `'Demos'`
  - `countByKind(apps: readonly DosApp[]): Record<KindFilter, number>`
  - `filterProductions(apps: readonly DosApp[], kind: KindFilter, query: string): DosApp[]`
  - `moreByAuthor(app: DosApp, apps: readonly DosApp[], limit = 6): DosApp[]`
  - `shortYear(year?: number): string | null`, which turns `1993` into `"'93"`
  - `pickRandom<T>(items: readonly T[], random: () => number = Math.random): T | undefined`
- `gridColumns.ts`: `countGridColumns(grid: HTMLElement | null): number`, moved verbatim from `DemoSelector.tsx:42-52`.
- `startPageState.ts`:
  - `interface StartPageState { kind: KindFilter; query: string; scrollTop: number; focusId: string | null }`
  - `const START_PAGE_STATE_KEY = 'doskit:start-page'`
  - `loadStartPageState(): StartPageState | null`
  - `saveStartPageState(state: StartPageState): void`
  - Both use `sessionStorage`, wrapped in try/catch, and never throw.

- [ ] **Step 1: Write failing tests.** Use `availableApps` where real data matters.

```ts
// productionFilter.test.ts
it('filters by words in any order, ignoring case and outer spaces', () => {
  const found = filterProductions(availableApps, 'all', '  CREW future ');
  expect(found.length).toBeGreaterThan(5);
  expect(found.every((app) => app.author?.includes('Future Crew'))).toBe(true);
});
it('matches a year and the description', () => {
  expect(filterProductions(availableApps, 'all', '1997').map((a) => a.id)).toContain('boost');
  expect(filterProductions(availableApps, 'demo', "assembly '93").map((a) => a.id)).toContain(
    'second-reality'
  );
});
it('returns nothing for no match, and keeps data order', () => {
  expect(filterProductions(availableApps, 'all', 'zzzz')).toEqual([]);
  const demos = filterProductions(availableApps, 'demo', '');
  expect(demos.map((a) => a.order)).toEqual([...demos.map((a) => a.order)].sort((x, y) => x - y));
});
it('counts each kind and all', () => {
  const counts = countByKind(availableApps);
  expect(counts.all).toBe(availableApps.length);
  expect(
    counts.demo + counts.intro + counts.tracker + counts.musicdisk + counts.effect + counts.diskmag
  ).toBe(counts.all);
});
it('lists other productions by the same author only', () => {
  const unreal = availableApps.find((a) => a.id === 'unreal')!;
  const more = moreByAuthor(unreal, availableApps);
  expect(more).toHaveLength(6);
  expect(more.every((a) => a.author === 'Future Crew' && a.id !== 'unreal')).toBe(true);
});
it('shortens years and picks within range', () => {
  expect(shortYear(1993)).toBe("'93");
  expect(shortYear(undefined)).toBeNull();
  expect(pickRandom(['a', 'b', 'c'], () => 0.99)).toBe('c');
  expect(pickRandom([], () => 0)).toBeUndefined();
});
// startPageState.test.ts
it('round-trips a state', () => {
  /* save then load returns an equal object */
});
it.each([
  'not json',
  '{"kind":"games","query":"","scrollTop":0,"focusId":null}',
  '{"kind":"demo","query":5,"scrollTop":0,"focusId":null}',
])('ignores %s', (raw) => {
  sessionStorage.setItem(START_PAGE_STATE_KEY, raw);
  expect(loadStartPageState()).toBeNull();
});
it('never throws when storage does', () => {
  /* vi.spyOn(Storage.prototype, 'getItem'/'setItem') throwing */
});
// gridColumns.test.ts: move the column-counting cases from DemoSelector.test.tsx (search "countGridColumns")
```

- [ ] **Step 2: Run** `npx vitest run src/utils/productionFilter.test.ts src/utils/gridColumns.test.ts src/utils/startPageState.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the three modules.** `filterProductions` lower-cases `[name, author, year, description].join(' ')`, splits the trimmed query on whitespace, and keeps the apps whose text includes every word, in the order of the input array. `availableApps` is already sorted by `order`.
- [ ] **Step 4: Run the same tests.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add production filtering and the start page's saved state`

### Task 5: The production grid of links

**Files:**

- Create: `src/components/ProductionGrid.tsx`, `ProductionGrid.css`, `ProductionGrid.test.tsx`

**Interfaces:**

- Consumes: `CrtScreen` (Task 3), `thumbnailOf` (Task 2), `shortYear` (Task 4), `countGridColumns` (Task 4), `getUrlFriendlyId` from `src/utils/urlRouting.ts`.
- Produces:

```ts
interface ProductionGridProps {
  apps: readonly DosApp[];
  /** The list's accessible name */
  label: string;
  onOpen: (app: DosApp) => void;
  /** The roving tab stop; the first app when null or not in `apps` */
  activeId: string | null;
  /** The pointer entered, or the focus reached, an app */
  onActiveChange: (app: DosApp) => void;
  /** Focus the active link once mounted, such as on return to the start page */
  autoFocusActive?: boolean;
  variant?: 'grid' | 'strip';
}
export function ProductionGrid(props: ProductionGridProps): JSX.Element;
```

- Markup: a `ul` with the given `aria-label`, and for each app an `li` holding an `a.production-link` with `href="/<urlId>"` and `tabIndex` 0 for the active one and -1 for the rest. Inside the link: `CrtScreen size="small"` with `alt=""`, `span.production-name`, and `span.production-meta` holding the author in `--author` and the short year in `--year`. The link's accessible name is its text.

- [ ] **Step 1: Write failing tests.** Port the DemoSelector keyboard cases (arrows wrap left and right; Up and Down move by `countGridColumns`; Home and End; one tab stop) to links, plus:

```tsx
it('opens on a plain click and on Enter, without a page load', async () => {
  const onOpen = vi.fn();
  render(
    <ProductionGrid
      apps={apps}
      label="Productions"
      onOpen={onOpen}
      activeId={null}
      onActiveChange={vi.fn()}
    />
  );
  const link = screen.getByRole('link', { name: /Unreal/ });
  expect(link).toHaveAttribute('href', '/unreal');
  const click = createEvent.click(link, { button: 0 });
  fireEvent(link, click);
  expect(click.defaultPrevented).toBe(true);
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'unreal' }));
});
it.each([
  { ctrlKey: true },
  { metaKey: true },
  { shiftKey: true },
  { altKey: true },
  { button: 1 },
])('leaves %o clicks to the browser', (init) => {
  /* fireEvent(link, createEvent.click(link, init)): defaultPrevented false, onOpen not called */
});
it('reports the active app on pointer enter and focus', () => {
  /* onActiveChange called with each */
});
it('falls back to the first app when activeId names none of them', () => {
  /* first link tabIndex 0 */
});
```

- [ ] **Step 2: Run** `npx vitest run src/components/ProductionGrid.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `onClick`: return when `event.button !== 0` or a modifier is held. Otherwise `preventDefault()` and call `onOpen(app)`. Enter on a link fires `click` natively.
  - `onKeyDown` on the `ul` handles the arrows, Home and End as DemoSelector's `handleDiskKeyDown` did. The strip variant moves only left and right.
  - The CSS lays out the grid at 4 columns in a wide container, 2 at `(max-width: 480px)`, and the strip as 6 equal columns.
  - The focus ring is `--focus` around the CRT, and forced colours use `Highlight`.
- [ ] **Step 4: Run the same test.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add the production grid, a list of links with a roving focus`

### Task 6: The start page

**Files:**

- Create: `src/components/StartPage.tsx`, `StartPage.css`, `StartPage.test.tsx`

**Interfaces:**

- Consumes: `ProductionGrid` (Task 5), `DosWindow`, `KeyHint`, `SiteFooter` (Task 3), and `KIND_TABS`, `countByKind`, `filterProductions`, `pickRandom`, `shortYear`, `kindLabel` and the state functions (Task 4).
- Produces:

```ts
interface StartPageProps {
  apps: readonly DosApp[];
  /** An alert above the grid, such as for a link to no production */
  notice: string | null;
  onOpen: (app: DosApp) => void;
  onOpenPrompt: () => void;
}
export function StartPage(props: StartPageProps): JSX.Element;
```

- Layout (spec, "Start page"):
  - The root is a `main.start-page` that scrolls by itself.
  - Then: `.copper`, a header with the logo (`h1` "DosKit" in `--font-display`, shown as DOSKIT) and the tagline "The PC demoscene, 1990–1997, running in your browser. {apps.length} productions.", then `.copper.copper--blue`.
  - The menu: a `div.dos-menu` holding a `role="group" aria-label="Kinds"` of buttons with `aria-pressed`, labelled `{label} {count}`, with kinds whose count is 0 left out. After them comes a separate button "C:\> DOS prompt", then a search `input type="search" aria-label="Search productions"`.
  - A visually hidden `role="status"` saying "{n} productions" (or "1 production").
  - The notice as `p role="alert"`.
  - The grid, or an empty state: "Nothing matches “{query}”." with a "Clear search" button.
  - On `(min-width: 1100px)`, an `aside` info window (`DosWindow`, `aria-label="Highlighted production"`). Its title is `{kindLabel} · {year}`. It shows the author, description and size (`formatSize(archiveBytes)` from `src/utils/formatSize.ts`), the flashing warning and `contentNote` as DemoSelector showed them, and `KeyHint` Enter "Open".
  - On `(hover: hover) and (pointer: fine)`, a shortcut bar: `↑↓←→` Choose, `Enter` Open, `/` Search, `R` Random.
  - Then `SiteFooter`.
- Keys on the root's `onKeyDown`: `/` focuses the search (`preventDefault`), and `r` or `R` calls `onOpen(pickRandom(shown) ?? pickRandom(apps))`. Both are ignored when the target is an `input`, `textarea` or `[contenteditable]`, or with Ctrl, Alt or Meta held. Escape in the search clears a non-empty query, or else blurs the search.
- State: on mount, `loadStartPageState()` seeds the kind, query and active id, restores the root's `scrollTop`, and sets `autoFocusActive` when it had a `focusId`. Every change saves. `onOpen` and `onOpenPrompt` save the current `scrollTop` first.

- [ ] **Step 1: Write failing tests** (with `availableApps`):

```tsx
it('shows every production and the count in the tagline', () => {
  render(<StartPage apps={availableApps} notice={null} onOpen={vi.fn()} onOpenPrompt={vi.fn()} />);
  expect(screen.getByText(new RegExp(`${availableApps.length} productions`))).toBeInTheDocument();
  expect(
    within(screen.getByRole('list', { name: 'Productions' })).getAllByRole('link')
  ).toHaveLength(availableApps.length);
});
it('filters by kind, and says how many are shown', async () => {
  await userEvent.click(screen.getByRole('button', { name: /^Trackers \d+$/ }));
  expect(screen.getByRole('button', { name: /^Trackers/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('status')).toHaveTextContent(
    `${countByKind(availableApps).tracker} productions`
  );
});
it('shows an empty state that clears the search', async () => {
  /* type 'zzzz', click Clear search, all links back */
});
it('focuses the search on /, and types / and r inside it', async () => {
  await userEvent.keyboard('/');
  expect(screen.getByRole('searchbox')).toHaveFocus();
  await userEvent.keyboard('r/');
  expect(screen.getByRole('searchbox')).toHaveValue('r/');
});
it('opens a random shown production on R, but not with Ctrl', async () => {
  /* onOpen once; ctrl+r none */
});
it('opens the DOS prompt from its menu item', async () => {
  /* onOpenPrompt called */
});
it('restores kind, query and focus from the saved state, ignoring a missing focus id', () => {
  saveStartPageState({ kind: 'intro', query: 'crew', scrollTop: 0, focusId: 'fishtro' });
  /* render: Intros pressed, search 'crew', Fishtro link focused */
  saveStartPageState({ kind: 'all', query: '', scrollTop: 0, focusId: 'gone' });
  /* rerender fresh: first link has tabIndex 0, nothing throws */
});
it('shows the notice as an alert', () => {
  /* role alert with the text */
});
```

- [ ] **Step 2: Run** `npx vitest run src/components/StartPage.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement `StartPage` and `StartPage.css`** to the layout above and the mockups (`start-page.png`, `phones-and-about.png`).
  - The menu wraps onto as many rows as it needs on phones, and never hides an item.
  - Pad the header by `max(env(safe-area-inset-top, 0px), var(--offline-banner-height, 0px))`, and the bottom by `--install-prompt-height`.
- [ ] **Step 4: Run the same test.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add the start page: kinds, search, the grid and its shortcuts`

### Task 7: Route to the start page and retire the selector

**Files:**

- Modify: `src/utils/urlRouting.ts`, `src/utils/urlRouting.test.ts`, `scripts/app-pages.ts:236` (`RESERVED`), `scripts/app-pages.test.ts`, `src/components/playerSession.ts`, `src/components/DosPlayerWithApps.tsx`, `src/components/DosPlayerWithApps.css`, `src/components/DosPlayerWithApps.test.tsx`, `src/App.tsx`, `src/App.test.tsx`, `package.json`
- Create: `src/components/playerSession.test.ts`, `src/utils/describeProgress.ts`, `src/utils/describeProgress.test.ts`
- Delete (with `/bin/rm`): `src/components/DemoSelector.tsx`, `DemoSelector.css`, `DemoSelector.test.tsx`. Uninstall `retro-floppy`.

**Interfaces:**

- Consumes: `StartPage` (Task 6), `KindFilter` and `saveStartPageState` (Task 4).
- Produces in `urlRouting.ts`:
  - `const PROMPT_SEGMENT = 'dos'`
  - `isPromptUrl(): boolean`, true for a first path segment of `dos` in any case with no `?app=` parameter
  - `updateUrlForPrompt(replace = false): void`, which sets the path to `/dos` and the canonical link, and pushes or replaces as `updateUrlWithApp` does
- Produces in `describeProgress.ts`: `describeProgress(progress: LoadProgress | null): { percent: number | null; text: string }`, moved verbatim from `DemoSelector.tsx:113-125`, with its tests.
- Produces in `playerSession.ts` (replacing the selector parts):

```ts
export type Phase =
  /** retry: Try Again started this load, so it may start at once (see 'loaded') */
  | { kind: 'loading'; app: DosApp; retry?: true }
  | { kind: 'error'; error: LoadError }
  | { kind: 'preparing'; session: Session; play: boolean }
  | { kind: 'poster'; session: Session }
  | { kind: 'running'; session: Session };
export interface PlayerState {
  phase: Phase;
  requestedId: string | null;
  started: { sessionId: number; status: 'ready' | 'error' } | null;
  endedSessionId: number | null;
}
// Actions removed: selectorProp, picked, selectorOpened, selectorCancelled, choseAnother.
// 'retried' gives { kind: 'loading', app, retry: true }. 'loaded' keeps `play: boolean`. The
// component passes play = phase.retry === true && hasFreshActivation() && !app.flashing &&
// !app.contentNote. A first load never plays, so every production waits on its page, and Try
// Again starts directly while its click is still fresh (spec: "Try again ... still start
// directly"). Everything else keeps its shape.
export function initialPlayerState({ requestedApp }: { requestedApp: DosApp | null }): PlayerState;
```

- Produces in `DosPlayerWithApps.tsx`:

```ts
interface DosPlayerWithAppsProps {
  /** The production to run, or null for the plain DOS prompt */
  requestedApp: DosApp | null;
  /** To the start page, with a kind to select; a running tracker asks first (the Leave dialog) */
  onBrowse: (kind?: KindFilter) => void;
  onStatusChange?: (status: PlayerStatus) => void;
  onReady?: (ci: CommandInterface) => void;
  onExit?: () => void;
  className?: string;
}
```

- Produces in `App.tsx`: `type Route = { view: 'start'; notice: string | null } | { view: 'app'; app: DosApp } | { view: 'prompt' }`, and `readUrlRoute(): Route`. The unknown-app notice:
  - `No production called "${unknownAppId}". Here's everything on DosKit.` when the value is safe to show
  - `No production by that name. Here's everything on DosKit.` otherwise

- [ ] **Step 1: Write failing reducer tests** in `src/components/playerSession.test.ts`:

```ts
it('starts the DOS prompt for no requested app, and loads a requested one', () => {
  expect(initialPlayerState({ requestedApp: null }).phase).toMatchObject({
    kind: 'running',
    session: { app: null },
  });
  expect(initialPlayerState({ requestedApp: demo }).phase).toEqual({ kind: 'loading', app: demo });
});
it('waits on the page for Play once a production has loaded', () => {
  const loaded = playerReducer(initialPlayerState({ requestedApp: demo }), {
    type: 'loaded',
    app: demo,
    files: new Uint8Array([1]),
    dosboxConf: '',
    play: false,
  });
  expect(loaded.phase.kind).toBe('poster');
  expect(playerReducer(loaded, { type: 'played' }).phase.kind).toBe('running');
});
it('marks a Try Again load as a retry, which may start at once', () => {
  const failed = {
    ...initialPlayerState({ requestedApp: demo }),
    phase: { kind: 'error', error: { message: 'x', app: demo } },
  } as PlayerState;
  const retried = playerReducer(failed, { type: 'retried', app: demo });
  expect(retried.phase).toEqual({ kind: 'loading', app: demo, retry: true });
  const loaded = playerReducer(retried, {
    type: 'loaded',
    app: demo,
    files: new Uint8Array([1]),
    dosboxConf: '',
    play: true,
  });
  expect(loaded.phase.kind).toBe('running');
});
it('takes a tracker from its saved files to its page, not straight to running', () => {
  /* loaded -> preparing -> prepared -> poster */
});
it('keeps a running DOS prompt when no app is requested again', () => {
  /* same session id */
});
```

- [ ] **Step 2: Run** `npx vitest run src/components/playerSession.test.ts`. Expected: FAIL (the `play` flag, the selector fields).
- [ ] **Step 3: Simplify `playerSession.ts`** to the Interfaces.
  - `starting(session)` gives `poster` for an app and `running` for the prompt.
  - `opening(session)` gives `preparing` for `saveFiles`, and otherwise `starting`.
  - `statusOf` drops the `idle` phase, and `poster` stays `'idle'`.
  - Run the test. Expected: PASS.
- [ ] **Step 4: Write failing routing tests.**
  - `urlRouting.test.ts`: `isPromptUrl()` is true at `/dos`, `/DOS` and `/dos/`, and false at `/dos?app=unreal` and `/unreal`. `updateUrlForPrompt()` pushes `/dos` and sets the canonical link to `https://doskit.net/dos`.
  - `app-pages.test.ts`: `findPageCollisions([{ id: 'dos' }], [])` reports `dos`.
  - Run them. Expected: FAIL. Implement, then run again. Expected: PASS. (Add `'dos'` to `RESERVED`.)
- [ ] **Step 5: Rewrite the selector-facing suites of `DosPlayerWithApps.test.tsx`.**
  - Delete `Behind the selector`, `Selector overlay`, `Overlay click handling` and `App selection and loading`.
  - Rewrite `Prop synchronization`, `Callbacks`, `Requested apps`, `Loading overlay` and `Cancel functionality` against the new props. Cancel and Choose Another call `onBrowse()`, and the end card's "Choose another" calls `onBrowse()` through the Leave check.
  - Add these new tests:

```tsx
it('waits for Play even when the page has fresh user activation', async () => {
  Object.defineProperty(navigator, 'userActivation', {
    value: { isActive: true },
    configurable: true,
  });
  render(<DosPlayerWithApps requestedApp={demo} onBrowse={vi.fn()} />);
  expect(await screen.findByRole('button', { name: 'Play' })).toBeInTheDocument();
  expect(screen.queryByTestId('dos-player')).not.toBeInTheDocument();
});
it('shows the download progress while it loads', async () => {
  /* loader calls onProgress {loadedBytes: 50, totalBytes: 100}; text 'Downloading… 50%' */
});
it('fails with Try again when nothing arrives for 20 s', async () => {
  vi.useFakeTimers(); /* loader never resolves nor reports */
  await act(() => vi.advanceTimersByTimeAsync(20_000));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
});
it('asks before Browse leaves a running tracker, and keeps its files first', async () => {
  /* Leave dialog, then onBrowse */
});
it('starts at once on Try Again while its click is fresh, and waits for Play otherwise', async () => {
  /* loader rejects once, then resolves; userActivation.isActive true -> player mounts with no Play button;
     with isActive false -> Play button shows */
});
```

- [ ] **Step 6: Run** `npx vitest run src/components/DosPlayerWithApps.test.tsx`. Expected: FAIL.
- [ ] **Step 7: Rework `DosPlayerWithApps.tsx`.**
  - Remove: `DemoSelector`, `showAppSelector` and the selector props, `runPick`, `handleSelectApp`, `handleCancelSelector`, `handleOpenSelector`, the pause-under-selector effect and `pausedHandleRef` (with its check in `saveQuietly`), and `onAppChange`. Keep `hasFreshActivation`, now used only for a retry's `play`.
  - The loading effect calls `loadingApp.loader((p) => setProgress({ appId: loadingApp.id, progress: p }), controller.signal)`. If no progress arrives within `START_TIMEOUT_MS = 20_000`, it aborts and dispatches `loadFailed` with a `TimeoutError`, as `DemoSelector.tsx:232-244` did.
  - `pendingPick` becomes `pendingLeave: { sessionId: number; kind?: KindFilter } | null`.
  - `requestBrowse(kind?)` sets `pendingLeave` when `trackerRuns`, and otherwise calls `onBrowse(kind)`. `handleLeave` calls `keepFilesNow()`, then `onBrowse(pending.kind)`.
  - The loading overlay keeps its markup for now, with `describeProgress(progress).text` in place of "Loading application...", and Cancel calling `onBrowse()`.
  - Remove the selector's layers from the z-index list at the top of `DosPlayerWithApps.css`.
- [ ] **Step 8: Run the same test.** Expected: PASS.
- [ ] **Step 9: Write failing App tests.**
  - Rewrite `URL routing`, `Change Application Button` and `Selector visibility management` in `App.test.tsx`. Update the mock `DosPlayerWithApps` props to the new interface.
  - These tests pin the new behaviour:
    - `/` renders the start page and no player.
    - Clicking a production pushes `/<urlId>` and renders the player with it.
    - The prompt item pushes `/dos` and renders the player with `requestedApp` null.
    - Back from `/dos` returns to the start page.
    - `/?app=nope` shows `No production called "nope". Here's everything on DosKit.` and replaces the URL with `/`.
    - `onBrowse('intro')` navigates to `/` with Intros selected.
    - The title at `/dos` is `DOS prompt - DosKit`.
- [ ] **Step 10: Rework `App.tsx`.**
  - Route state comes from `readUrlRoute()`. `navigate(route)` updates the URL (`updateUrlWithApp` or `updateUrlForPrompt`) and the title, then sets the route.
  - `popstate` re-reads the route.
  - Render `StartPage` (with `availableApps`) for `start`, and `DosPlayerWithApps` otherwise.
  - Status is set to `'idle'` on the start page.
  - `onBrowse(kind)` saves `{ kind, query: '', scrollTop: 0, focusId: null }` when given a kind, then navigates to the start page.
  - The old header's "Change Application" becomes a "Browse" button calling `onBrowse()`, until Task 10 removes the header.
  - Run `npm uninstall retro-floppy` and delete the DemoSelector files.
- [ ] **Step 11: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js && npm run test:e2e`. Expected: all pass.
- [ ] **Step 12: Commit:** `feat: open DosKit on the start page, retire the selector, and make every production wait for Play`

## Phase 3: Production page and running view

### Task 8: The production page

**Files:**

- Create: `src/components/ProductionPage.tsx`, `ProductionPage.css`, `ProductionPage.test.tsx`, `src/utils/share.ts`, `src/utils/share.test.ts`
- Modify: `src/utils/urlRouting.ts` (export `canonicalUrlOf`), `src/utils/urlRouting.test.ts`

**Interfaces:**

- Consumes: `CrtScreen`, `DosWindow`, `KeyHint`, `SiteFooter` (Task 3); `ProductionGrid` (Task 5); `moreByAuthor`, `kindLabel` and `KindFilter` (Task 4); `describeProgress` (Task 7); `thumbnailOf` (Task 2); `loadAppPage` from `src/config/appPages.ts` (for `imageAlt`).
- Produces:

```ts
// urlRouting.ts
export function canonicalUrlOf(appId: string): string; // 'https://doskit.net/unreal'
// share.ts
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';
export function shareLink(
  data: { title: string; url: string },
  nav?: Navigator
): Promise<ShareResult>;
// ProductionPage.tsx
export type ProductionPageStatus =
  | { kind: 'loading'; progress: LoadProgress | null }
  | { kind: 'error'; error: FriendlyError }
  | { kind: 'ready' };
interface ProductionPageProps {
  app: DosApp;
  apps: readonly DosApp[];
  status: ProductionPageStatus;
  onPlay: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onBrowse: (kind?: KindFilter) => void;
  onAbout: () => void;
  onOpenApp: (app: DosApp) => void;
  aboutButtonRef?: React.Ref<HTMLButtonElement>;
}
export function ProductionPage(props: ProductionPageProps): JSX.Element;
export function playLabelOf(kind: AppKind): string; // moved from DosPlayerWithApps.tsx:100
```

- Layout (spec, "A production's page", mockup `production-page.png`):
  - A root `section.production-page` with `aria-labelledby` its `h1`, `tabIndex={-1}`, focused on mount unless focus is already inside it.
  - A slim bar: `.copper.copper--thin`, the logo as a link to `/` (whose click calls `onBrowse()`), a breadcrumb `nav aria-label="Breadcrumb"` holding a button `{kindLabel(app.kind)}` that calls `onBrowse(app.kind)` and the current name, then `KeyHint` I "About" and Esc "Browse".
  - Main: `CrtScreen size="large" loading="eager"` with alt from the page file's `imageAlt` (`""` until it loads), the `h1` name, and `DosWindow` titled `{kindLabel} · {year}` holding the author, description, size, the flashing warning, `contentNote`, and `startNote` in `--font-read`.
  - The action area:
    - `loading`: a progress bar as DemoSelector had (`role="progressbar"`, indeterminate without a percentage), the `describeProgress` text, and Cancel.
    - `error`: `role="alert"` with the message, the suggestion, details, and "Try Again".
    - `ready`: `button.doskit-play-button` with `autoFocus` and the label `playLabelOf(app.kind)`, plus an `Enter` hint.
    - In every state, an About button (`aboutButtonRef`) and Share with a polite status: "Link copied" for `copied`, and "Couldn't share this link" for `failed`.
  - "More by {author}": `ProductionGrid variant="strip"`, labelled `More by {author}`, from `moreByAuthor`, left out when empty.
  - `SiteFooter`.
- Keys on the root's `onKeyDown` (not when the target is a text field, nor with Ctrl, Alt or Meta held): `i` or `I` calls `onAbout()`, and Escape calls `onBrowse()`.

- [ ] **Step 1: Write failing tests.**

```ts
// share.test.ts
it('uses the Web Share API where there is one', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  expect(await shareLink({ title: 'Unreal', url: 'u' }, { share } as unknown as Navigator)).toBe(
    'shared'
  );
});
it('reports a cancelled share as cancelled', async () => {
  /* share rejects with DOMException AbortError */
});
it('copies the link without one, and fails without either', async () => {
  /* clipboard.writeText -> 'copied'; {} -> 'failed' */
});
// ProductionPage.test.tsx
it('offers Play, focused, once ready; Start for a tracker; Read for the diskmag', () => {
  /* class doskit-play-button */
});
it('shows progress, then an error with Try Again', () => {
  /* 'Downloading… 50%'; role alert; onRetry */
});
it('opens About on I and browses on Escape, but not from Ctrl+I', async () => {
  /* onAbout, onBrowse */
});
it('browses to its kind from the breadcrumb', async () => {
  /* onBrowse('demo') */
});
it('lists more by the same author, and none for an author with one production', () => {
  /* list name 'More by Future Crew' */
});
it('shows the flashing warning and the start note', () => {
  /* texts present */
});
```

- [ ] **Step 2: Run** `npx vitest run src/utils/share.test.ts src/components/ProductionPage.test.tsx src/utils/urlRouting.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `canonicalUrlOf`, `shareLink` and `ProductionPage` with its CSS.** At `(max-width: 768px)` the page stacks into one column, and the strip becomes 3 columns. Delete `playLabelOf` from `DosPlayerWithApps.tsx` and import it from `./ProductionPage`.
- [ ] **Step 4: Run the same tests.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add the production page: screenshot, facts, Play, Share and more by the same author`

### Task 9: The run bar

**Files:**

- Create: `src/components/RunBar.tsx`, `RunBar.css`, `RunBar.test.tsx`

**Interfaces:**

- Produces:

```ts
interface RunBarProps {
  title: string; // the production's name, or 'DOS prompt'
  meta: string | null; // 'Future Crew · 1993'
  status: PlayerStatus;
  isOnline: boolean;
  onBrowse: () => void;
  onAbout?: () => void; // absent for the prompt
  onFiles?: () => void; // a tracker that saves, once ready
  aboutButtonRef?: React.Ref<HTMLButtonElement>;
  filesButtonRef?: React.Ref<HTMLButtonElement>;
}
export function RunBar(props: RunBarProps): JSX.Element;
```

- Markup:
  - A `div.dos-menu.run-bar` holding the button "◄ Browse", then `span.run-bar-title` with the title, and `span.run-bar-meta` with the meta, hidden under `(max-height: 500px)`.
  - Then a `span role="status"` with `{statusLabel} · {Online|Offline}`. The status labels are App's current ones (Idle, Loading, Ready, Error). It has the class `visually-hidden` while the status is `ready` and the network is online.
  - Then the About and Files buttons when given.
  - Every button has `onMouseDown={(e) => e.preventDefault()}`.
  - Padding by the safe-area insets and `--offline-banner-height`.

- [ ] **Step 1: Write failing tests.** Move the badge assertions from App's `Status display` and `The running app's author and year` suites, adapted, and add:

```tsx
it('hides its status while ready and online, and shows it otherwise', () => {
  const { rerender } = render(
    <RunBar title="Unreal" meta="Future Crew · 1993" status="ready" isOnline onBrowse={vi.fn()} />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Ready · Online');
  expect(screen.getByRole('status')).toHaveClass('visually-hidden');
  rerender(
    <RunBar title="Unreal" meta={null} status="ready" isOnline={false} onBrowse={vi.fn()} />
  );
  expect(screen.getByRole('status')).not.toHaveClass('visually-hidden');
});
it('takes no focus from a click on its buttons', () => {
  /* mousedown defaultPrevented on Browse, About, Files */
});
it('offers About and Files only when given', () => {
  /* prompt: neither */
});
```

- [ ] **Step 2: Run** `npx vitest run src/components/RunBar.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement `RunBar` and `RunBar.css`.** Accelerator letters use `--menu-accel` (blue), never red.
- [ ] **Step 4: Run the same test.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add the run bar shown while a production runs`

### Task 10: Wire the page and the bar in, and drop the header and footer

**Files:**

- Modify: `src/components/DosPlayerWithApps.tsx`, `DosPlayerWithApps.css`, `DosPlayerWithApps.test.tsx`, `src/App.tsx`, `src/App.css`, `src/App.test.tsx`, `e2e/pages.spec.ts`, `e2e/play.spec.ts` and `e2e/hook.js` (comments only), `e2e/trackers.spec.ts` (comments only)

**Interfaces:**

- Consumes: `ProductionPage` and `playLabelOf` (Task 8), `RunBar` (Task 9).
- Produces these additional props on `DosPlayerWithApps`: `onOpenApp: (app: DosApp) => void`, `onAbout: () => void`, `aboutButtonRef?: React.Ref<HTMLButtonElement>`, `isOnline: boolean`, and `apps: readonly DosApp[]`.

- [ ] **Step 1: Write failing tests.**
  - In `DosPlayerWithApps.test.tsx`, rewrite `Play screen`, `Error overlay`, `Loading overlay` and `A tracker's Files panel` (the Files button now lives in the run bar) against the new markup. Add:
    - "the production page carries the download, the error and Play"
    - "the run bar replaces the page once Play is pressed, with Files for a tracker that saves"
    - "More by opens another production through `onOpenApp`"
  - In `App.test.tsx`:
    - Delete `Footer` (moved to SiteFooter), `Status display` and the author/year suite (moved to RunBar).
    - Rewrite `About button` and `Layout`, with no `banner` and no `contentinfo` in the running view.
    - Add the Review Focus 4 test: "Escape with About open closes About and stays on the production's page". The URL is unchanged and About's opener has the focus.
  - In `e2e/pages.spec.ts`, add `test('the start page opens a production's page, which waits for Play')`:
    - `goto('/')`
    - click `getByRole('link', { name: /Second Reality/ })`
    - expect the URL to end with `/secondreality`, a heading "Second Reality", the button "Play", and no `canvas`
- [ ] **Step 2: Run** `npx vitest run src/components/DosPlayerWithApps.test.tsx src/App.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Rework `DosPlayerWithApps.tsx`.**
  - While the phase is `loading`, `error`, `preparing` or `poster`, render `ProductionPage`:
    - `loading` and `preparing` give `{ kind: 'loading', progress }`.
    - `error` gives `{ kind: 'error', error }`.
    - `poster` gives `{ kind: 'ready' }`.
    - `onPlay` dispatches `played`, `onRetry` dispatches `retried`, and `onCancel` is `onBrowse()`.
  - While a session runs, render `RunBar` above the player area:
    - The title is the name, or `'DOS prompt'` for the prompt.
    - The meta is `releaseOf(app)`.
    - `onBrowse` is `requestBrowse`.
    - `onFiles` is given when `session.app.saveFiles` and the status is `ready`.
  - Delete the loading overlay, the error overlay, the poster and the floating `doskit-files-open` button, with their CSS.
  - Restyle the start hint, the Leave dialog and the end card as DOS windows. "Choose another" becomes "Browse".
  - Update the z-index list.
- [ ] **Step 4: Rework `App.tsx` and `App.css`.**
  - Remove the header and the footer.
  - Pass `onAbout`, `aboutButtonRef`, `isOnline`, `onOpenApp` (`navigate({ view: 'app', app })`) and `apps` to the player.
  - `STATUS_BADGES` moves into `RunBar.tsx`.
  - `.app` becomes a column of `main` alone.
- [ ] **Step 5: Run the same unit tests.** Expected: PASS. Then update the e2e comments that say a click with activation skips the Play screen, since it no longer does.
- [ ] **Step 6: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js && npm run test:e2e`. Expected: all pass, the new e2e test included.
- [ ] **Step 7: Visual check.** Start `npx vite --port 5199 --strictPort` in the background, then run `node e2e/tools/screens.mjs http://localhost:5199 /tmp/doskit-screens / /secondreality /dos` and read the PNGs. Expected:
  - `/` and `/secondreality` match the mockups' layout.
  - At 844×390 the run bar and the page bar are one row.
  - Nothing overflows sideways at 390 wide.
  - The forced-colours captures show focus and selection.
  - Stop the server.
- [ ] **Step 8: Commit:** `feat: show each production on its own page and run it under one bar`

## Phase 4: Dialogs and notices

### Task 11: About and Files as DOS windows

**Files:**

- Modify: `src/components/AppInfo.tsx`, `AppInfo.css`, `AppInfo.test.tsx`, `src/components/TrackerFiles.tsx` (classes only)

**Interfaces:**

- Consumes: `SiteFooter`, `KeyHint` (Task 3).
- `AppInfo` keeps its props, focus trap, Escape and focus return as they are.

- [ ] **Step 1: Write failing tests** in `AppInfo.test.tsx`: "ends with the credits and the Licenses link", meaning a `link` named `Licenses` with `href="/licenses/"` inside the dialog, and "shows Esc Close", meaning text `Esc` in a `kbd`.
- [ ] **Step 2: Run** `npx vitest run src/components/AppInfo.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add `SiteFooter className="doskit-info-credits"` as the panel's last section, and `KeyHint` Esc "Close" at the bottom right.
  - Restyle `.doskit-info*` in `AppInfo.css` as a DOS window, following the mockup `phones-and-about.png`:
    - `--window` background and the double `--window-title` border
    - the title set into the border
    - section headings (`h3`) in `--font-ui` and `--title`, 20px
    - body text in `--font-read`, 0.85rem, `#e6e6f2`
  - `TrackerFiles` shares these classes, so check that its buttons and notices use tokens.
- [ ] **Step 4: Run the same test.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat: show About and a tracker's Files as DOS windows, with the credits in About`

### Task 12: Update prompt, offline banner, install prompt and error screen

**Files:**

- Modify: `src/components/UpdateNotification.css`, `OfflineIndicator.css`, `ErrorBoundary.css`, and any user-facing "application" in `UpdateNotification.tsx`, `OfflineIndicator.tsx`, `ErrorBoundary.tsx` and `src/utils/errorMessages.ts`, with their tests

- [ ] **Step 1: List the strings.** Run `grep -rn -i "application" src --include=*.ts --include=*.tsx | grep -v "\.test\." | grep -v "^\s*//"`. Note each user-facing string. Code identifiers and comments stay.
- [ ] **Step 2: Update the tests** that match those strings to the new wording ("production", or what it is). Run them. Expected: FAIL.
- [ ] **Step 3: Change the strings.** Restyle the three CSS files with tokens:
  - the update prompt as a DOS window
  - the offline banner as a `--menu` grey bar with black text
  - the install prompt as a DOS window
  - the error screen as a DOS window on black with "Try Again" as a cyan key-style button
  - Keep every layout variable (`--offline-banner-height`, `--install-prompt-height`), the short-window rules and the forced-colours rules.
- [ ] **Step 4: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js`. Expected: all pass. Then repeat the grep from Step 1. Expected: no user-facing "application" left.
- [ ] **Step 5: Commit:** `feat: carry the DOS look to the update, offline, install and error notices`

## Phase 5: Clean-up

### Task 13: Leftovers and documentation

**Files:**

- Modify: `src/components/DosPlayerWithApps.css` (remove `--color-*` users, if any are left), `docs/ARCHITECTURE.md`, `README.md`, `docs/images/doskit-second-reality.png` (replaced), `llms-full.txt` generator inputs only if they mention the selector (`scripts/generate-app-lists.js`)

- [ ] **Step 1: Find leftovers.** Run `grep -rn -i "retro-floppy\|DemoSelector\|app selector\|the selector\|--color-bg\|667eea\|646cff" src docs README.md scripts index.html public/manifest.json`. A bare "selector" would match every `querySelector`, so don't search for that. Expected: only historical mentions in `CHANGELOG.md`, which stay. Fix everything else: remove dead CSS, and reword comments that describe the selector.
- [ ] **Step 2: Update `docs/ARCHITECTURE.md`.**
  - Technology Stack: no app selector line, and add "Look: VGA design tokens in `src/index.css`, Silkscreen and VT323 from fontsource".
  - Project Structure: the new components and utils, and `src/assets/thumbs/`.
  - Component Hierarchy: App, then StartPage or DosPlayerWithApps (ProductionPage, RunBar, DosPlayer, overlays).
  - The z-index paragraph, with no selector and with the run bar.
  - Routing: `/`, `/<id>` and `/dos`.
  - Caching: fonts and thumbnails precached as bundles.
- [ ] **Step 3: Update `README.md`.**
  - The DOS Prompt feature line (84) and the line at 147: the start page's `C:\> DOS prompt` item opens it.
  - The offline lines stay true.
  - Any "selector", "disk" or "application" wording in the features.
- [ ] **Step 4: Replace the README screenshot.** With the dev server running, capture `/` at 1440×900 with Playwright to `docs/images/doskit-start-page.png`. Point the README image at it, with the alt text "DosKit's start page: the productions' screenshots by kind". Delete the old image with `/bin/rm`.
- [ ] **Step 5: Verify.** Run `npm run lint && npm run format:check && npm test && npm run build && node scripts/check-built-css.js && npm run test:e2e`. Expected: all pass.
- [ ] **Step 6: Commit:** `docs: describe the start page, the production page and the run bar`

### Task 14: Sweep at the edges

**Files:**

- Modify: whatever the sweep finds; each fix gets a test where a unit test can pin it.

- [ ] **Step 1: Capture.** Start the dev server, then run `node e2e/tools/screens.mjs http://localhost:5199 /tmp/doskit-sweep / /secondreality /impulsetracker /dos`. Also capture `/` and `/secondreality` with `reducedMotion: 'reduce'`, and at 1440×900 with the page zoomed to 400% (`page.evaluate(() => document.body.style.zoom = '4')`), at 320×568, and with `--offline-banner-height: 48px` set on `:root`.
- [ ] **Step 2: Check each capture against the spec's anti-goals.**
  - No text over scanlines.
  - No horizontal page scroll at 320 wide.
  - Bars stay one row at 844×390 and at 400% zoom.
  - Focus is visible in forced colours.
  - Nothing sits under the offline banner.
  - The menu shows every item on phones.
    Write down each failure.
- [ ] **Step 3: Fix each failure** in the owning component's CSS. Where behaviour changed, add a test first, as in earlier tasks.
- [ ] **Step 4: Verify.** Run `npm run lint && npm test && npm run build && node scripts/check-built-css.js && npm run test:e2e`. Expected: all pass. Repeat Step 1. Expected: no failures left.
- [ ] **Step 5: Commit:** `fix: keep the new screens whole on phones, short windows, zoom and forced colours`
