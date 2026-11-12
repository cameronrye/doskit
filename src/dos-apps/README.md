# DOS Applications

Every app in DosKit's selector is made of five pieces:

| Piece         | Where                                           | What it holds                                                       |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| Archive       | `public/demos/<id>.zip`                         | The program's files                                                 |
| Config module | `src/dos-apps/<id>.config.ts` (this folder)     | The DOSBox configuration, exported as `dosboxConf`                  |
| Data file     | `src/apps/<id>.json`                            | Name, description, author, year, archive size, start keys, and more |
| Page file     | `src/apps/<id>.page.json`                       | The text of its page and its About panel                            |
| Share card    | `public/cards/<id>.png`, the id without hyphens | The image a shared link to its page shows                           |

When someone picks an app, or opens its page, DosKit downloads the archive and hands it to js-dos
as the emulator's initial file system, then starts DOSBox with the app's configuration. The
archive's files are the directory the autoexec mounts as `C:`.

## Adding an app

These steps use `my-demo` as the app's id. Keep ids to lowercase letters, digits and hyphens: the
id names the archive, the config module and the data and page files, and without its hyphens it is
the app's page, `/mydemo`, and the name of its share card. Links also work with the hyphens
(`/?app=my-demo`), so an id must stay unique with its hyphens removed: `mydemo` and `my-demo`
cannot both be apps. Nor can an id take a name the site already uses, such as `index`, `licenses`
or `cards`: the build fails for either (`findPageCollisions` in `scripts/app-pages.ts`).

### 1. Add the archive

Put the program's files in a ZIP archive at `public/demos/my-demo.zip`, with the executable at
the top level. Vite copies `public/` into the build as it is, so the app downloads the archive
from `/demos/my-demo.zip`. Where you can, use the archive as its source has it, byte for byte:
several of the archives here ask to be passed on unmodified, and a repacked one loses the file
dates that help establish the year.

### 2. Write the config module

Create `src/dos-apps/my-demo.config.ts`:

```ts
import { presets } from '../utils/dosboxConfigBuilder';

/** My Demo by Some Group (1994), from <where the archive comes from> */
export const myDemoDosboxConf = presets
  .demo()
  .addAutoexec('@echo off', 'mount c .', 'c:', 'MYDEMO.EXE')
  .build();

/** The config under the name the registry reads */
export { myDemoDosboxConf as dosboxConf };
```

The modules here also export their archive's URL, which nothing reads: the registry always
downloads `/demos/<id>.zip`.

Start from a preset in `src/utils/dosboxConfigBuilder.ts` (`demo()` for demos and intros,
`musicTracker()` for trackers) and override what the program needs with the builder's setters.
The autoexec has to mount the archive (`mount c .`), switch to it (`c:`) and start the program.
Keep the autoexec the config's last section, as `build()` writes it: DosKit adds a line after it,
`echo My Demo has ended.`, which it listens for to show the end card once the program returns to
DOS (`src/utils/endMarker.ts`).

The `demo()` preset runs the CPU at a fixed 30000 cycles per millisecond, and the
`musicTracker()` preset at 18000. js-dos's sidebar shows the speed DOSBox reaches, in thousands of
cycles per millisecond ("30 KC"). Open the app and watch its effects before you change the speed
with `setCPU({ cycles })`:

- A number runs the program at that speed throughout. StarPort, 3drotate, Unreal and Panic run at
  30000: below it, their effects stutter or fall behind. Second Reality runs at 24000, about a
  486DX2-66, the machine its setup says it was made for; compared frame by frame with a capture of
  a real one, its timeline matches to about 1%.
- `'max'` gives the program as many cycles as the device can run. Crystal Dream 2 runs at it (at
  30000 it stops with "System overloaded!"), but not every program copes with it: Panic plays no
  sound at `'max'`, and Second Reality showed the default VGA palette for about 12 seconds near
  1:30 in most runs.
- `'auto'` runs a program at 3,000 cycles per millisecond until it switches the CPU to protected
  mode, and at `'max'` from then on, until it exits. A program that stays in real mode, as most
  of the apps here do, gets a tenth of the preset's speed: enough for the starfield and the Squid
  intro, but Crystal Dream 2's packed loader needed 46 seconds at it before the demo's setup
  appeared.

Every app runs on js-dos's default `dosbox` backend, set in `src/config/jsdos.config.ts`, and
DOSBox ignores settings that backend does not have without a warning. The builder only has
options for settings that backend applies, and only accepts the CPU cores, CPU types, sample rates
and prebuffer values it has. Its only scaler is `none`, the one the backend has: it resets any
other value to its default, `normal2x`, and frames reach js-dos unscaled either way. That rules
out a few settings DOSBox guides suggest:

- There is no dynamic core: `core` is `auto`, `normal` or `simple`.
- There is no `486` or `pentium` CPU type: `cputype` `auto` is the usual choice.
- There is no `[dos] ver`: DOS reports version 5.00. A program that needs a newer one gets it
  from `VER SET 7 10` in the autoexec.
- Memory is `memsize` in the `[dosbox]` section, set with `setMachine({ memsize })`, up to 63 MB;
  left out, DOS gets DOSBox's default 16 MB. There is no `[memory]` section.
- The machine is `svga_s3` unless `setMachine({ machine: 'vgaonly' })` says otherwise. `svga_s3`
  applies palette changes once a frame; a program that changes the palette while a frame is
  drawn (raster bars, split palettes, as in Panic and the Squid intro) needs `vgaonly`, which
  draws line by line as a real VGA does, at the cost of 16-bit colour and about 10% more CPU.
- `cputype` also has `486_slow` and `pentium_slow`, besides `auto`, `386`, `386_slow` and
  `386_prefetch`.
- There is no mixer `blocksize`: the mixer always works in 2048-sample blocks.
- `prebuffer` goes from 0 to 100 ms, and the sample rates (`rate`, `oplrate`, `pcrate`,
  `tandyrate`) are 8000, 11025, 16000, 22050, 32000, 44100, 48000 or 49716 Hz.

Keep the comments and the autoexec's banner to what the configuration actually sets.

### 3. Add its data file

Add a data file for it, `src/apps/my-demo.json`, named after its id:

```json
{
  "id": "my-demo",
  "order": 11,
  "kind": "demo",
  "name": "My Demo",
  "description": "Some Group's demo, first at Some Party '94",
  "author": "Some Group",
  "year": 1994,
  "archiveBytes": 123456
}
```

`src/config/apps.config.ts` builds the registry from these files, in `order`, with
`import.meta.glob`, and finds the config module by the same id. The config module is imported only
when the app loads, or when the selector preloads it on hover: each one is a small chunk of its own
(in production builds the service worker still stores every chunk when it installs, so that the
app can start offline). `AppData` in `src/types/dos-app.ts` gives every field:

- `order` is its place in the selector, which lists the demos first, then the intros, the trackers
  and the effects.
- `kind` is `demo`, `intro`, `tracker` or `effect`. The generated app lists name it, the Play
  screen's button says Start for a tracker and Play for the others, and a tracker's page calls it
  a MultimediaApplication in its structured data.
- `description` is one line of facts for the selector: no "legendary" or "classic".
- `archiveBytes` is the archive's size in bytes, which its disk shows; a test checks it.
- `flashing: true` for a production that flashes more than three times a second over a large
  part of the picture, the limit of WCAG 2.3.1: the selector, the Play screen, the About panel and
  its page warn of it.

`author` and `year` are the release's, from the archive's own files where they say; the header
shows them as "Some Group (1994)", or whichever of the two the app has, and the selector names
its disk "My Demo by Some Group (1994). Press Enter to load." for screen readers, leaving out a
missing author or year.
Both are optional: leave out a year that nothing establishes rather than guess one.

For a program that waits at a setup screen for a key, add its `start` and `hint` (step 4). For a
program people make things in, such as a tracker:

- `saveFiles: true` keeps what the program saves: DosKit asks js-dos for the files that differ from
  the archive 3 seconds after the last key or tap, every 30 seconds, and when the tab is
  hidden or the page goes, keeps them in the browser's IndexedDB, and starts the app with them
  after its archive the next time. The app gets the Files button, which downloads them, brings in
  modules, or starts over, and picking another app in the selector asks before it leaves.
- `warnBeforeLeaving: true` makes the page ask before it is closed or reloaded while the app runs.
  On Windows, Linux and ChromeOS, browsers keep Ctrl+W, Ctrl+N and Ctrl+T for themselves, so a DOS
  program's Ctrl-W would close the tab at once (macOS browsers use ⌘ for these, and Ctrl+W reaches
  DOS).

`jsdos` gives js-dos options of the app's own, which win over DosKit's and the visitor's saved
settings: Impulse Tracker's `{ "renderAspect": "AsIs" }` lines its own mouse pointer up with the
real one.

The app now appears in the selector and opens at `/mydemo`, its page; `/?app=my-demo` works too,
and the address bar shows `/mydemo`.

### 4. Give it its start keys

A production that waits at a setup screen for a key, as many do for their sound card, gets its
keys from its data file, and DosKit presses them once that screen is up:

```json
"start": {
  "keys": ["Enter"],
  "ready": { "frames": [1234567890] },
  "note": "DosKit picks the Gravis UltraSound in its setup."
},
"hint": "My Demo waits at its setup: press Enter to start it with the Gravis UltraSound."
```

- `keys` has one step per key, by its name in `src/utils/dosKeys.ts`: the letters, `Space`,
  `Enter`, `Escape`, `Tab`, `Backspace`, `Up`, `Down`, `Left`, `Right`, `PageUp`, `PageDown`,
  `Home`, `End`, `F1` to `F10`, `LeftShift`, `LeftCtrl` and `LeftAlt`. Keys held together are
  joined by `+`, as in `"LeftCtrl+L"`. The registry throws for a name it does not know.
- `gapMs` is the wait between one key's release and the next one's press, 250 ms when left out.
  Unreal's five keys take 100.
- `ready` says that the setup screen is up and takes keys: keys sent earlier are lost, as Second
  Reality, Crystal Dream 2 and Impulse Tracker drop every key that comes before they read the
  keyboard. It is one of:
  - `{ "frames": [<fingerprint>, ...] }`: the screen's fingerprint is one of these (Second
    Reality, Unreal, Panic and Crystal Dream 2)
  - `{ "stdout": "<text>" }`: DOS printed a line holding this text (Scream Tracker 3 and the 3D
    Rotation Demo)
  - `{ "message": "<text>", "calmMs": <ms> }`: DOSBox logged a line holding this text, and the
    screen has not changed for this long since (Impulse Tracker, whose screen changes under the
    mouse)
- `note` is what the start does, for the Play screen: what it picks, and what comes first. It ends
  with a period.
- `hint` is what to press, which a bar over the player shows when DosKit cannot send the keys or
  they do not take. It says "press".

DosKit waits up to 45 seconds for the signal, sends the keys through `ci.sendKeyEvent()`, one at a
time (`src/utils/keyQueue.ts`), and then checks for 4 seconds that the screen went on: a screen not
seen while it waited, a change of mode, or sound. It sends a start of one key up to 3 times, and
one of several keys only once, since a second Right would move a menu's choice again
(`src/utils/startRecipe.ts`). Unreal's setup starts on No sound, so its keys, Right, Right, Down,
Down and Enter, pick SoundBlaster Pro at 20 kHz.

A fingerprint is the FNV-1a hash of every byte of the frame js-dos hands out
(`src/utils/frameHash.ts`), which only a real emulator gives. Measure it on a fresh build: give the
app `"ready": { "frames": [] }` first, then run

```bash
npm run build && node e2e/tools/fingerprints.mjs my-demo
```

It opens each app it is given whose `ready` has `frames` at its page in Chromium, lets it run for
16 seconds with no key pressed, and prints the screens it rested on longest, with how long and from
when: put the setup screen's in `frames`. Measure again whenever the app's config, its banner or
js-dos changes; a plain VGA gave Panic's menu another fingerprint.

### 5. Write its page file

Add `src/apps/my-demo.page.json`, the text of the app's page and of its About panel (`AppPage` in
`src/types/dos-app.ts`):

```json
{
  "description": "My Demo by Some Group, first in the PC demo competition at Some Party '94, running from its original files in your browser.",
  "about": ["My Demo is Some Group's demo for MS-DOS, released in May 1994."],
  "released": "Some Party '94: first in the PC demo competition.",
  "credits": "Code by Someone, music by Someone Else.",
  "terms": "Freeware: “you may copy it freely, unmodified.” (README.TXT)",
  "accuracy": ["Mono: js-dos mixes the two channels into one."],
  "links": [{ "label": "pouet.net", "url": "https://www.pouet.net/prod.php?which=123" }],
  "imageAlt": "My Demo's title screen, running in DosKit"
}
```

- `description` is the page's meta description and its share card's text, one or two sentences.
- `about` holds paragraphs about the production, `released` where and when it was shown or
  released, and how it placed, and `credits` who made it, by role.
- `terms` quotes its authors' terms from its own files, or says that none were found, as
  `public/demos/README.md` records them (step 7).
- `accuracy` says how it runs here compared with the original on real hardware: what DosKit picks
  at its setup, what runs faster or in mono, what is off, or that it has not been compared yet.
- `links` are its pages elsewhere, such as pouet.net's and Demozoo's, which its page's structured
  data gives too.
- `imageAlt` is the share card's alt text.
- `authorType` is `"Person"` for an author who is one person; the default is `"Organization"`.

The build puts the text into the app's page, `mydemo.html`, which GitHub Pages serves at `/mydemo`
with the app's title, description and card, for crawlers that run no scripts and for shared links;
the About panel loads the file when it opens. `scripts/app-pages.test.ts` checks that every app has
one, with a `description` that ends in a period, `about`, `terms`, `accuracy`, and an `imageAlt`
that ends in "running in DosKit".

### 6. Make its share card

The card, `public/cards/mydemo.png`, is 1200x630: a frame of the production running, beside its
name, author and year. The frames come from the emulator in a browser, and the text is drawn with
the machine's fonts, so the cards are made by hand and committed:

1. `npm run build && node e2e/tools/frames.mjs cards-src my-demo` opens the app at its page,
   clicks Play, and saves frames of it at the emulator's own resolution, as
   `cards-src/mydemo-<seconds>s.png`: 5 seconds after Play, unless `MOMENTS` in the tool gives it
   other moments.
2. Keep the frame that shows the production best as `cards-src/mydemo.png`, and delete the others.
3. `npm run generate-app-cards` draws every app's card from its frame and its data file into
   `public/cards/`. Commit the frame and the card.

`scripts/app-pages.test.ts` checks that every app has a card, and that it is 1200x630.

### 7. Record where it comes from

Give the archive a row in the table of [`public/demos/README.md`](../../public/demos/README.md)
and an entry like the others there: the program and its authors, its year and the file that gives
it, what the ZIP holds, with its size in bytes and its MD5, where it came from and whether it is
that file byte for byte, and its terms, quoted from its own files, or that none were found. The
data file's `author` and `year` should match it.

### 8. List it

The app lists in [`README.md`](../../README.md) and
[`public/llms-full.txt`](../../public/llms-full.txt) are written from the data files, between
`<!-- apps:start -->` and `<!-- apps:end -->`: run `npm run generate-app-lists` rather than edit
them by hand. `scripts/generate-app-lists.test.js` fails while one is out of date.

[`ROADMAP.md`](../../ROADMAP.md) names and counts the programs under "Done": add the app there.

If the program comes from the [sceners](https://github.com/sceners) organization, add it to the
table in [`docs/SCENERS.md`](../../docs/SCENERS.md) as well.

### 9. Check it

- `npx vitest run src/config/apps.config.test.ts` checks every registered app: its loader must
  download `/demos/<id>.zip`, which must be a ZIP archive in `public/demos` of the size its
  `archiveBytes` gives, its DOSBox configuration must leave out the settings the default backend
  ignores and end with the autoexec, which the end marker follows, and its description and
  autoexec banner must not give another year for the release than its `year`. A banner's `CPU:`
  line must name the cycles the app runs at, and its `Audio:` line the Gravis UltraSound only
  when the app has one. It also checks that every archive in `public/demos` belongs to an app and
  that `public/demos/README.md` lists it and records its size and MD5 as they are. Some of its
  tests list the apps by id (the selector's order, the ones with start keys, the ones that flash,
  the ones that ask before the page closes): add the new app to the lists it belongs in.
- `npx vitest run scripts/app-pages.test.ts` checks its page file and its card, and that its page
  takes no name the site uses.
- Run `npm run dev` and open `http://localhost:5173/mydemo` (Vite takes the next free port if 5173
  is in use, and prints the address). The app waits on its Play screen, as a page opened from its
  address has no click to start sound with. After Play, the program should start on its own, past
  its setup screen if it has start keys, not stop at a DOS prompt or an error, and its effects
  should keep their speed (see the CPU speed notes in step 2). Once it returns to DOS, the end
  card should show.
- Add the app to `RUNS` in `e2e/play.spec.ts`, which says whether it makes sound and, where it
  matters, the screen size it runs at; the test fails for an app without an entry. Then
  `npm run build && npm run test:e2e` opens each app at its page, clicks Play, and checks that its
  start keys went and a new screen followed, that its picture moves, and that it makes the sound
  `RUNS` gives it (see [CONTRIBUTING.md](../../CONTRIBUTING.md#browser-tests)).

## Legal considerations

Only add programs you may redistribute: freeware, public domain, open source, or software whose
rights holder has given permission. Leave out commercial software and anything whose source and
license you cannot document.
