# DOS Applications

Every app in DosKit's selector is made of three pieces:

| Piece          | Where                                          | What it holds                                    |
| -------------- | ---------------------------------------------- | ------------------------------------------------ |
| Archive        | `public/demos/<id>.zip`                        | The program's files                              |
| Config module  | `src/dos-apps/<id>.config.ts` (this folder)    | The archive's URL and the DOSBox configuration   |
| Registry entry | `availableApps` in `src/config/apps.config.ts` | Name, description, and how to load the other two |

When someone picks an app, or opens `/?app=<id>`, DosKit downloads the archive and hands it to
js-dos as the emulator's initial file system, then starts DOSBox with the app's configuration.
The archive's files are the directory the autoexec mounts as `C:`.

## Adding an app

These steps use `my-demo` as the app's id. Keep ids to lowercase letters, digits and hyphens: the
id names the archive and the config module, and it is the `?app=` value in links. Links also work
without the hyphens (`?app=mydemo`), so an id must stay unique with its hyphens removed: `mydemo`
and `my-demo` cannot both be apps.

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
export const myDemoZipUrl = '/demos/my-demo.zip';

export const myDemoDosboxConf = presets
  .demo()
  .addAutoexec('@echo off', 'mount c .', 'c:', 'MYDEMO.EXE')
  .build();
```

Start from a preset in `src/utils/dosboxConfigBuilder.ts` (`demo()` for demos and intros,
`musicTracker()` for trackers) and override what the program needs with the builder's setters.
The autoexec has to mount the archive (`mount c .`), switch to it (`c:`) and start the program.

The `demo()` preset runs the CPU at a fixed 30000 cycles per millisecond, and the
`musicTracker()` preset at 18000. js-dos's sidebar shows the speed DOSBox reaches, in thousands of
cycles per millisecond ("30 KC"). Open the app and watch its effects before you change the speed
with `setCPU({ cycles })`:

- A number runs the program at that speed throughout. StarPort, 3drotate, Unreal and Panic run at
  30000: below it, their effects stutter or fall behind.
- `'max'` gives the program as many cycles as the device can run. Second Reality and Crystal
  Dream 2 run at it (at 30000, Crystal Dream 2 stops with "System overloaded!"), but not every
  program copes with it: Panic plays no sound at `'max'`.
- `'auto'` runs a program at 3,000 cycles per millisecond until it switches the CPU to protected
  mode, and at `'max'` from then on, until it exits. A program that stays in real mode, as most
  of the apps here do, gets a tenth of the preset's speed: enough for the starfield and the Squid
  intro, but Crystal Dream 2's packed loader needed 46 seconds at it before the demo's setup
  appeared.

Every app runs on js-dos's default `dosbox` backend, set in `src/config/jsdos.config.ts`, and
DOSBox ignores settings that backend does not have without a warning. The builder only has
options for settings that backend applies, and only accepts the CPU cores, CPU types, sample rates
and prebuffer values it has. Its only scaler is `none`: the backend also accepts `normal2x`, but
frames reach js-dos unscaled either way. That rules out a few settings DOSBox guides suggest:

- There is no dynamic core: `core` is `auto`, `normal` or `simple`.
- There is no `486` or `pentium` CPU type: `cputype` `auto` is the usual choice.
- There is no `[dos] ver`: DOS reports version 5.00. A program that needs a newer one gets it
  from `VER SET 7 10` in the autoexec.
- The builder has no memory setting: DOS gets DOSBox's default 16 MB.
- There is no mixer `blocksize`: the mixer always works in 2048-sample blocks.
- `prebuffer` goes from 0 to 100 ms, and the sample rates (`rate`, `oplrate`, `pcrate`,
  `tandyrate`) are 8000, 11025, 16000, 22050, 32000, 44100, 48000 or 49716 Hz.

Keep the comments and the autoexec's banner to what the configuration actually sets.

### 3. Register the app

Add an entry to `availableApps` in `src/config/apps.config.ts`:

```ts
{
  id: 'my-demo',
  name: 'My Demo',
  description: 'One line for the selector',
  author: 'Some Group',
  year: 1994,
  loadMethod: 'zip',
  dosboxConf: '',
  loader: async (onProgress, signal) => {
    const config = await import('../dos-apps/my-demo.config');
    return loadZipArchive(config.myDemoZipUrl, onProgress, signal);
  },
  loadDosboxConf: async () => {
    const config = await import('../dos-apps/my-demo.config');
    return config.myDemoDosboxConf;
  },
},
```

Import the config module with `import()`, not statically: each one becomes a small chunk of its
own that is only downloaded when the app is loaded, or when the selector preloads it on hover.
`loadZipArchive` is already imported at the top of the file; pass it the `onProgress` and
`signal` the loader receives, so the selector can show progress and cancel the download.

`author` and `year` are the release's, from the archive's own files where they say; the header
shows them as "Some Group (1994)", or whichever of the two the app has, and the selector names
its disk "My Demo by Some Group (1994)" for screen readers, leaving out a missing author or year.
Both are optional: leave out a year that nothing establishes rather than guess one.

For a program people make things in, such as a tracker, add `warnBeforeLeaving: true`: the page
then asks before it is closed or reloaded while the app runs. Browsers keep Ctrl+W, Ctrl+N and
Ctrl+T for themselves, so a DOS program's Ctrl-W closes the tab at once.

The app now appears in the selector and opens at `/?app=my-demo`. The address bar shows the id
without hyphens (`/?app=mydemo`); both forms work.

### 4. Record where it comes from

Give the archive a row in the table of [`public/demos/README.md`](../../public/demos/README.md)
and an entry like the others there: the program and its authors, its year and the file that gives
it, what the ZIP holds, with its size in bytes and its MD5, where it came from and whether it is
that file byte for byte, and its terms, quoted from its own files, or that none were found. The
registry entry's `author` and `year` should match it.

### 5. List it

[`public/llms-full.txt`](../../public/llms-full.txt) repeats the registry under "Bundled
Applications", for readers that only fetch that file. Add the app there in the same form:

```text
- My Demo (Some Group, 1994): https://doskit.net/?app=mydemo
```

[`ROADMAP.md`](../../ROADMAP.md) lists the apps by name under "Current State" and counts them
there, under "Key Opportunities" and under "Success Metrics": add the app to the list and update
the three counts.

If the program comes from the [sceners](https://github.com/sceners) organization, add it to the
table in [`docs/SCENERS.md`](../../docs/SCENERS.md) as well.

### 6. Check it

- `npx vitest run src/config/apps.config.test.ts` checks every registered app: its loader must
  download `/demos/<id>.zip`, which must be a ZIP archive in `public/demos`, its DOSBox
  configuration must leave out the settings the default backend ignores, and its description and
  autoexec banner must not give another year for the release than its `year`. A banner's `CPU:`
  line must name the cycles the app runs at, and its `Audio:` line the Gravis UltraSound only
  when the app has one. It also checks that every archive in `public/demos` belongs to an app and
  that `public/demos/README.md` lists it and records its size and MD5 as they are.
- Run `npm run dev` and open `http://localhost:5173/?app=my-demo` (Vite takes the next free port
  if 5173 is in use, and prints the address). The program should start on its own, not stop at a
  DOS prompt or an error, and its effects should keep their speed (see the CPU speed notes in
  step 2).

## Legal considerations

Only add programs you may redistribute: freeware, public domain, open source, or software whose
rights holder has given permission. Leave out commercial software and anything whose source and
license you cannot document.
