# Scene Redesign

DosKit's interface gets a new look and a real start page. The look is drawn from the PC demoscene of 1990 to 1997, the era of the productions DosKit runs. This document is what a builder plans from.

The mockups are images in [`2026-11-15-scene-redesign/`](2026-11-15-scene-redesign/): `start-page.png`, `production-page.png`, `running.png` and `phones-and-about.png`. They use screenshots of the real productions. Where a mockup and this document disagree, this document wins. The known differences:

- The start-page mockup has no Diskmag tab. The document adds it.
- Its info window shows "Sound" and "Machine" lines, which are out of scope.
- It shows an "I Info" key hint, which the start page doesn't have.
- The red accelerator letters on grey fail contrast.

## Intent

The owner wants DosKit to look better, feel modern and be more useful. Today:

- The start page is a dialog titled "Select DOS Application" over an empty page.
- Its 53 floppy disks look nearly alike and sit in one flat list. On a phone that list is about 12,000px tall.
- The base styles are Vite's starter template almost unchanged, plus a stock purple gradient.
- On phones, the header and footer take about 230px of an 844px screen.
- The interface says "Application" while the rest of the project says "production".

The owner chose the **Scene** direction out of three mockups (the others were a neutral modern gallery and a shelf of floppies). Scene means the 16-colour VGA palette, copper bars (the scene's horizontal colour stripes), pixel lettering, DOS-style menus and windows, and each production's real screenshot framed as a CRT screen. It should read as made with love by someone who knows the scene, not as a costume.

## Goals

1. **A real start page at `/`** that lets people browse the productions: tabs by kind with counts, search, a grid of real screenshots, and keyboard shortcuts.
2. **One click from the grid to a production's page.**
3. **Each production's page** (where links and share cards land) shows its screenshot, its facts and Play, plus other productions by the same author.
4. **More room for the player while a production runs:** one thin bar replaces the header and the footer.
5. **One visual language everywhere:** the start page, production pages, the running view, and every dialog and notice. It is built on shared design tokens (CSS custom properties) instead of colours hardcoded in nine files.
6. **Phones work well:** two columns of screenshots, a menu wrapped onto two rows, and no hidden tabs.
7. **"Production" replaces "application"** in every user-facing string.

## Non-goals

- New data fields for productions. The mockups show "Sound" and "Machine" lines, but no such fields exist. The info windows show only what the data files already hold: kind, author, year, description, archive size, warnings and the start note.
- Changes to emulation, start recipes or archives. The player's state machine (`playerSession.ts`) changes only where this document says so: under "A production's page" (nothing starts by itself on arrival), and in how the start page replaces the selector.
- Encoding the tab or search in the URL.
- A light theme. The site stays dark-only, as it is today.
- Restyling js-dos's own interface beyond what CSS overrides of its colours can do (its sidebar, for example).
- New share cards, logo, favicon or social images. These could be a later step. `theme-color` and the manifest colours do change to match (see Phase 1).

## Anti-goals (a failure even if it works)

- Text that is hard to read: pixel fonts in long passages, scanlines over text, or colour pairs below WCAG 2.1 AA.
- Any regression in keyboard use, focus handling, screen-reader announcements, forced-colours mode or reduced motion. The current code is careful about all of these, and its tests pin them.
- Keys leaking between DosKit's controls and DOS (see "Keys around DOS" in `docs/ARCHITECTURE.md`).
- Breaking offline use: the start page must show its screenshots offline once it has been seen online.
- Layout that breaks in short windows (phones held sideways, browser zoom up to 400%), around a notch, or under the offline banner and install prompt.

## Constraints

- **Stack:** React 19, TypeScript and plain CSS, one `Component.css` per component (`docs/STYLE_GUIDE.md`). No CSS framework or component library.
- **Browsers:** Chrome/Edge 98, Firefox 94 and Safari/iOS 15.4 are the floor. No CSS feature newer than these: no `:has()`, container queries, CSS nesting or subgrid. `scripts/check-built-css.js` must still pass, so keep the `100vh` fallbacks before `100dvh` and avoid media queries in range syntax.
- **Offline (service worker, `public/sw.js`):** the deploy cache holds at most 100 runtime entries, trimmed least recently used first, and precached files are never trimmed. The thumbnails (53 today, more as productions are added) must not push bundles out of that cache, and must be available offline once seen. Precaching them or giving them a cache of their own, like `doskit-demos`, both meet this.
- **Fonts:** hosted with the site, never from Google Fonts at runtime. Silkscreen (display) and VT323 (labels and menus) are both under the SIL Open Font License 1.1. Their licence text goes with the other licences in `public/licenses/`. Use woff2 subset to Latin, with `font-display: swap` and a monospace fallback.
- **Pages for search engines:** `scripts/app-pages.ts` writes `<id>.html` for each production, with its text in `#root` for crawlers that run no scripts. That must keep working, and `sitemap.xml` is unchanged.
- **Routing (`src/utils/urlRouting.ts`):** `/<id>` URLs, the old `?app=` links, and the case and hyphen variants all keep working. An unknown `?app=` now shows its notice on the start page instead of in the selector.
- **Layering:** the z-index list at the top of `src/components/DosPlayerWithApps.css` and in `docs/ARCHITECTURE.md` stays the source of truth, and any new layer goes into it.
- **Existing layout hooks:** respect `--offline-banner-height`, `--install-prompt-height` and the safe-area insets, as the header and selector do today.
- **Tests:** unit tests (Vitest) and the Chromium browser tests (`npm run test:e2e`) pass at the end of every phase. The pre-commit hook runs related tests. `.claude/worktrees` tests are picked up by Vitest, so exclude them if worktrees are used.

## Approaches considered

1. **Phased rebuild on the current stack (chosen).** Add shared tokens and fonts, add a new start page component that retires the selector dialog, then restyle each remaining screen. Each phase leaves the site working and the tests passing. This delivers the real start page and keeps the risk to the project's careful keyboard and accessibility behaviour small at each step.
2. **Restyle the current dialog in place.** Cheaper, but it keeps the "dialog over an empty page" problem, which was a main reason for the work.
3. **Add Tailwind or a component library.** It goes against the one-CSS-file-per-component convention and adds weight to an offline-first app, for no gain here.
4. **Rebuild every screen at once.** Too much changes between green test runs. The suite has about 6,000 lines of component tests on keyboard, focus and announcements.

The owner left the how to me, and I chose approach 1.

## The design

### Visual language

- **Palette:** the 16 VGA colours as tokens, such as `--vga-blue: #0000aa`, `--vga-cyan: #00aaaa`, `--vga-lightgrey: #aaaaaa`, `--vga-yellow: #ffff55`, `--vga-lightcyan: #55ffff` and `--vga-lightmagenta: #ff55ff`. On top of these sit semantic tokens such as `--surface`, `--text`, `--text-muted`, `--accent`, `--focus`, `--warning` and `--danger`, and components use only the semantic ones. The page background is black.
- **Type:** three roles.
  - _Display_ is Silkscreen, uppercase, for the logo, page titles and production titles, at 16px or larger. It carries the stacked text shadow seen in the mockups (light magenta, then blue).
  - _Interface_ is VT323, at 18px or larger, for menus, tabs, labels, grid captions, key hints and the short fact lines in info windows.
  - _Reading_ is the system monospace stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`), for anything longer than a line: the About text, start notes, errors and the Files panel's notes.
- **Copper bars:** gradient stripes (purple, pink and gold; and a thin blue one) at the top of pages and between the start page's header and menu. They don't move.
- **CRT frame:** every screenshot sits in a frame with rounded corners, a dark bezel and inner shading, with scanlines and a soft highlight over the image only. Screenshots are scaled with `image-rendering: pixelated` and shown at 4:3, as the share cards do.
- **DOS window:** used for info panels and every dialog. It has a VGA blue background, a 4px double yellow border inset from the edge, the title set into the top border, and a hard drop shadow.
- **DOS menu bar:** light grey with black text, and blue with white text for the selected item. It is used for the start page's kind tabs and the bar shown while a production runs.
- **Key hints:** a key name in a small cyan block, followed by its action. These sit in the start page's shortcut bar and the production page's bar.
- **Contrast:** every text and background pair meets WCAG 2.1 AA, 4.5:1 for text and 3:1 for focus rings and borders that carry meaning. The mockups' red accelerator letters on grey are about 2.9:1 and fail, so these need another treatment, such as VGA blue on grey or an underline in the text colour. Keep the existing pattern of noting each pair's ratio in a CSS comment.
- **Motion:** none beyond small hover and focus transitions. All of it respects `prefers-reduced-motion`, as `src/index.css` does today.
- **Forced colours:** selection and focus use system colours such as `Highlight` and `CanvasText`, as in `DemoSelector.css` today. The CRT effects and copper bars may drop out in that mode.

### Start page (`/`)

From top to bottom (mockup B in `direction.html`, the phone in `scene-screens-v2.html`):

1. A copper bar.
2. A header with the DOSKIT logo in display type and the tagline "The PC demoscene, 1990–1997, running in your browser. 53 productions." The count comes from the data.
3. A thin blue copper bar.
4. **Kind tabs** in a DOS menu bar: All, Demos, Intros, Trackers, Musicdisks, Effects and Diskmag, each with its count, and with a kind hidden while it has no productions. The last item is **`C:\> DOS PROMPT`**, which is not a filter: it opens the plain DOS prompt (see below). On phones the bar wraps onto as many rows as it needs, two or three, and never hides an item. On wide screens it is one row, with the search at its right end.
5. **Search** filters, as you type, on name, author, year and description, combined with the selected tab. When nothing matches, the grid says so and offers to clear the search.
6. **Grid** of productions in their data order (`order`), each a CRT-framed screenshot with the name below in interface type and the author and short year (such as '93) in cyan and magenta. The grid has 4 columns beside the info window on wide screens, more columns without it, and 2 on phones.
7. **Info window** (wide screens only): a DOS window beside the grid that shows the production under the pointer or keyboard focus. It shows the kind and year as its title, the author, the description, the archive size, any flashing or content warning, and a key hint for Enter. It starts on the first production.
8. **Shortcut bar** (devices with a keyboard): ↑↓←→ Choose, Enter Open, / Search, R Random.
9. **Footer:** "Made by Cameron Rye", "Powered by js-dos `<version>`" and "Licenses", static, with no animated heart.

Behaviour:

- **Grid items are real links** (`<a href="/<id>">` in a list), not listbox options. That way open-in-new-tab, middle-click, copying a link by long-pressing on a phone, and crawlers all work. A plain click or tap, or Enter, is handled in the app (a history entry, no page load). A click with a modifier key is left to the browser. The grid stays one tab stop: the arrow keys, Home and End move a roving `tabindex` between the links, using the DemoSelector's column counting for Up and Down. The DemoSelector's listbox tests become tests of this pattern rather than carrying over unchanged.
- `/` focuses the search, and Escape in the search clears it and then leaves it. R opens a random production. Single-key shortcuts never fire while focus is in a text field, or with Ctrl, Alt or Meta held.
- Coming back to the start page by Back, Browse or Escape restores the tab, the search text and the scroll position, and focuses the production you left. This lasts for the browser session.
- An unknown `?app=` shows its notice as an alert above the grid until a production is opened. Suggested wording: `No production called "<value>". Here's everything on DosKit.`
- Nothing runs on the start page. Navigating to it stops a running production, as the start page does today. A tracker with `warnBeforeLeaving` still gets the existing Leave dialog first.
- **The plain DOS prompt stays.** Today it boots when the selector closes without a pick. Now the menu's `C:\> DOS PROMPT` item boots it straight away, with no page before it, in the running view. The bar there reads "DOS prompt" and has no About or Files. It gets a history entry, so Back and Browse return to the start page. It still works offline after the first visit, as the README says. The reducer's `idle` → `running(newSession(null))` path is kept, triggered by this item instead of by closing the selector. Whether the prompt gets a path of its own is the builder's call. If it does, the name must be added to the names `findPageCollisions` reserves, and the README's description of how to reach the prompt is updated in Phase 5.

### A production's page (`/<id>`, before Play)

This is today's Play screen, redesigned (section 1 of `scene-screens-v2.html`):

- **Slim top bar:** the DOSKIT logo (a link to `/`), a breadcrumb `<Kind> ▸ <Name>` whose kind links to the start page with that tab selected, and key hints for I (About) and Esc (Browse).
- **Main:** on the left, the screenshot large in a CRT frame, with the page file's `imageAlt` as its alt text. On the right, the title in display type and a DOS window with the kind and year as its title, then the author, the description, the archive size, warnings, and the start note in reading type.
- **Actions:** the primary button, Play (Start for a tracker, Read for the diskmag, as `playLabelOf` does today), with an Enter hint. Then About, and Share. Share uses the Web Share API where it exists and otherwise copies the link, with a short confirmation.
- **Every production stops at its page and waits for Play,** however it was reached: from the grid, a "More by" item, Back or Forward, or a link. Today a pick with fresh user activation (`hasFreshActivation()`) can start by itself and skip the Play screen. That no longer happens on arrival. Play again on the end card and Try again on the error overlay still start directly, since each is a click on the same screen.
- **The archive starts downloading when the page opens,** as deep links do today. That way the Play click starts the production at once, within its own user activation, which js-dos needs for sound. Downloading on Play instead would leave a slow download outside that activation, and a second click would be needed. While it downloads, its progress shows where the Play button will be, and leaving the page cancels it. Archives are cached after their first download, so returning to a page costs nothing. Offline, with the archive not cached, the page shows the existing offline error there instead. The loading overlay keeps whatever loading the page itself doesn't show, such as Play again.
- **"More by `<author>`":** a strip of up to six other productions whose `author` equals this one's, which is hidden when there are none. Its items are links, like the grid's.
- **Keys:** Enter plays, I opens About, and Esc goes back to the start page. This works only while nothing runs, since afterwards keys belong to DOS.
- **A footer line** with the credits and Licenses, as on the start page.

### While a production runs

Section 2 of `scene-screens-v2.html`:

- **One bar** in the DOS menu style replaces the header and the footer. It holds "◄ Browse", the name, author and year, a status item that appears only while loading, on error or offline, then About, and Files for trackers that save. On short windows it stays one row, and the author and year drop out first, as the header does today.
- **Click only.** No single-key shortcuts while DOS has the keys. The existing `keepKeysFromDos` and `watchKeysAroundDos` handling covers the bar's controls.
- **The status badges' live region stays,** visually hidden while everything is fine, so screen readers still hear Loading, Ready, Error, Online and Offline.
- **The Licenses link and the credits** move to the start page's footer, the production page's footer and the About panel. DosKit ships the GPL notices of js-dos and DOSBox, so the Licenses link must be reachable from every screen. In the running view it is in the About panel, which keeps the bar to one row.
- **Overlays in the new style:** the loading overlay, the error overlay, the start hint, the Leave dialog and the end card. Their behaviour and focus handling don't change.
- **The js-dos sidebar** stays where it is. Its colours may be adjusted with CSS overrides only.

### Dialogs and notices

The About panel, the Files panel, the update prompt, the offline banner, the install prompt and the error boundary's screen all use the DOS window style. They keep their roles, focus traps, focus return, Escape behaviour and live regions as they are. The About panel gains the credits and the Licenses link in a closing section, and shows "Esc Close" at the bottom right.

### Thumbnails

- A script makes a thumbnail for each production from its frame in `cards-src/`, the same source as the share cards, and writes it to `public/thumbs/<id>.png`. The thumbnails are committed, like `public/cards/`.
- Frames come in several sizes: 320×200 and 640×400 for most, but others too, such as 640×480, 512×480, 792×558 and 252×256. Each is scaled to 4:3 with nearest-neighbour, as `scripts/generate-app-cards.js` does for the cards, at a width of about 320px. Palette PNG or lossless WebP are both fine. Aim for under 2 MB for all 53.
- A test fails when a production has no thumbnail, as the card tests do. `docs/` notes for adding a production get the new step.
- Images below the first screen load lazily, and every `<img>` has width and height attributes so the layout doesn't shift as they load.

### Wording

Every user-facing "Application" becomes "production", or names what it is: "Select DOS Application", "Load Application", "Change Application", "Choose Another Application" and the unknown-app message all go. The kind-specific verbs (Play, Start, Read) stay. Tests that match these strings change with them.

## Phases

Each phase ends with lint, unit tests, a production build, `check-built-css` and the Chromium browser tests passing.

**Branching:** pushes to `main` deploy the site and release-please cuts releases. So the whole redesign lives on one feature branch (`feat/scene-redesign`), with each phase merged into it, and goes to `main` once, when all phases are done. The live site never shows a mix of the old and new styles, and no phase needs a temporary style pass.

1. **Foundation:** the tokens in `src/index.css`, which also replace Vite's starter defaults; the self-hosted fonts and their licence; the thumbnail script, the thumbnails and their offline caching; and new `theme-color` and manifest colours, with their tests.
2. **Start page:** the new start page component at `/`. The selector dialog is retired and its keyboard behaviour carried over. Includes routing for `/` and the unknown-app notice, restoring the start page's state, the footer, and the wording on these screens.
3. **Production page and running view:** the redesigned Play screen, the bar shown while a production runs (with the header and footer gone from that view), and the overlays restyled.
4. **Dialogs and notices:** About (with credits and Licenses), Files, the update prompt, the offline banner, the install prompt and the error boundary.
5. **Clean-up:**
   - Remove `retro-floppy` and the DemoSelector with its CSS, and the unused colour variables in `DemoSelector.css`.
   - Update the docs: the component hierarchy and z-index list in `ARCHITECTURE.md`, the README's screenshot, and the app selector line under Technology Stack.
   - Check the whole site at phone, short-window and 400% zoom sizes, and in forced-colours mode.

## Left to the builder

- Exact token values beyond the VGA palette, spacing and size scales, and breakpoints, including where the info window appears.
- Component boundaries and names, such as whether the start page is one component or several, and whether to use the `<dialog>` element.
- Thumbnail format and size, and whether they are precached or get a cache of their own, within the offline constraint.
- How the start page's state is restored: `history.state` or `sessionStorage`.
- How the grid's roving focus is shared between the start page and the "More by" strip, if at all.
- How the js-dos sidebar's colours are matched, or whether they are left alone.
- How the work divides into commits and pull requests within each phase.

## Calls I made that the owner should check

- The floppy disks (`retro-floppy`) leave DosKit entirely. They could instead stay as an animation while a production downloads.
- The "Sound" and "Machine" lines shown in the mockups are left out, because no data exists for them.
- Credits and the Licenses link move out of the running view, to the two pages' footers and the About panel.
- A Share button on each production's page.
- The tab and search aren't put in the URL.
- Every production waits on its page for Play, even when reached by a click that could start it. Its archive downloads as the page opens, so looking around "More by" pages downloads the archives of the pages visited.
- Grid items are links, not listbox options.
- All phases stay on one branch and reach the live site together.

## Decided by the owner

- The Scene direction (option B), and the mockups as shown, with the phone menu wrapped onto two rows.
- The plain DOS prompt stays, as a `C:\> DOS PROMPT` item at the end of the start page's menu.
