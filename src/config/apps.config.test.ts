/**
 * Tests for the DOS application registry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  APP_ID_MAPPING,
  INTERNAL_TO_URL_MAPPING,
  availableApps,
  findAppById,
  getUrlFriendlyId,
} from './apps.config';
import { loadZipArchive } from '../utils/diskLoader';
import { endMarkerFor, withEndMarker } from '../utils/endMarker';
import type { DosApp } from '../types/dos-app';

vi.mock('../utils/diskLoader', () => ({
  loadZipArchive: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

/** The DOSBox config an app runs with, as DosPlayerWithApps resolves it */
const dosboxConfOf = async (app: DosApp): Promise<string> =>
  (await app.loadDosboxConf?.()) ?? app.dosboxConf;

// node:fs and node:crypto come through importActual, as the tests have the browser's types only
const { readFileSync, readdirSync } = await vi.importActual<{
  readFileSync(file: URL): Uint8Array;
  readFileSync(file: URL, encoding: 'utf8'): string;
  readdirSync(dir: URL): string[];
}>('node:fs');
const { createHash } = await vi.importActual<{
  createHash(algorithm: 'md5'): { update(data: Uint8Array): { digest(encoding: 'hex'): string } };
}>('node:crypto');

/**
 * public/demos, read from disk: the files the build copies to /demos. (Vite would turn
 * new URL('../../public/demos/', import.meta.url) into the address it serves them at.)
 */
const DEMOS = new URL(import.meta.url.replace(/[^/]+$/, '../../public/demos/'));

/** The ZIP archives in public/demos */
const archivesInDemos = (): string[] => readdirSync(DEMOS).filter((name) => name.endsWith('.zip'));

// Lines the default js-dos backend (see jsdos.config.ts) drops or resets without a
// warning. A config that has one states something that never runs.
const IGNORED_BY_DEFAULT_BACKEND = [
  /^\[(video|memory)\]$/m, // sections it does not have (memsize belongs in [dosbox])
  /^(vmemsize|ver|gusrate)=/m, // properties it does not have
  /^blocksize=/m, // its mixer never reads this; it always works in 2048-sample blocks
  /^core=dynamic$/m, // it has no dynamic core and runs the simple one instead
  /^cputype=(486|pentium|pentium_mmx)$/m, // types it does not have; it uses auto instead
];

// The release each app's archive in public/demos holds, dated by the archive's own files
// where they carry a date. public/demos/README.md records every source.
const RELEASES: Record<string, { year: number }> = {
  'second-reality': { year: 1993 }, // README.1ST: "Released on the 7th of October 1993"
  'impulse-tracker': { year: 1997 }, // 2.14 Patch 3: IT.EXE and its drivers date from 21 Dec 1997
  'starport-bbstro': { year: 1993 }, // README: "Copyright (C) 1993 Future Crew"
  'scream-tracker': { year: 1994 }, // 3.21, whose ST3.EXE is dated 25 December 1994
  unreal: { year: 1993 }, // 1.1, README.1ST: "Copyright (C) 1993 by the Future Crew"
  panic: { year: 1993 }, // FILE_ID.DIZ: "Released 4th Feb 1993", after The Party 1992
  'squid-bbstro': { year: 1994 }, // SQUID1.ASM: "31-Jan-1994"; SQUID1.COM is dated 7 Feb 1994
  '3drotate': { year: 1993 }, // 3drotate.txt: "DATE: 02/22/93"
  stars: { year: 1993 }, // stars.txt: "DATE: 03/15/93"
  'crystal-dream-2': { year: 1993 }, // CD2.EXE is dated 31 May 1993
  'mental-surgery': { year: 1991 }, // MENTAL.EXE, "the second version", is dated 14 July 1991
  verses: { year: 1995 }, // Revision II, VERSES.NFO: "Released on the 26th of April, 1995"
  holistic: { year: 1994 }, // HOLISTIC.NFO: "(c)1994"; its files are dated 9 September 1994
  heartquake: { year: 1994 }, // HEARTQ.NFO: "Madrid, 23rd of August, 1994"
  timeless: { year: 1994 }, // TIMELESS.DOC: "a demo in Feb 1994"; its files are of 25-26 Feb 1994
  inconexia: { year: 1993 }, // INCONEXI.NFO: "Madrid, Friday 13th, August, 1993"
  pump: { year: 1995 }, // PUMP.NFO: "Madrid, October 25th of 1995"
  'stars-nooon': { year: 1995 }, // the final release: STARS.EXE is dated 26 September 1995
  'dx-project': { year: 1995 }, // DX.NFO: "Copyright (C) 1995 by Realtech"; its files: 14 Aug 1995
  'untitled-dust': { year: 1994 }, // FILE_ID.DIZ: "Bugfixed-Release 2/1/1994", after The Party 1993
  dope: { year: 1995 }, // DOPE.EXE is dated 15 April 1995, the last day of The Gathering 1995
  solstice: { year: 1995 }, // README.TXT: "Released 15-11-1995", after Wired 1995
  contrast: { year: 1994 }, // TECH.DOC: "(C)1994"; the fixed release's files date from November
  'slideshow-1': { year: 1990 }, // FCINFO17.TXT: "FC-SLIDE.ZIP 350 kb 7-23-90 Slideshow I"
  'machines-of-madness': { year: 1996 }, // MACHINES.NFO: "Copyright (C) 1996 Dubius"
  boost: { year: 1997 }, // BOOST.NFO: Assembly '97, final version; BOOST.EXE is dated 25 Sep 1997
  gr8: { year: 1990 }, // GR8.EXE is dated 5 Jan 1990; its text greets "THE TURN OF THE DECADE"
  yo: { year: 1990 }, // YO.EXE: "by The Future Crew in 1990"; the file is dated 16 Oct 1990
  fishtro: { year: 1992 }, // Future Crew's lists: "4-08-92"; FISHTRO.EXE is dated 21 Oct 1992
  'starport-bbstro-1': { year: 1992 }, // FC's lists: "9-13-92", the date of starport.exe
  'the-party-92-invite': { year: 1992 }, // "Copyright (C) 1992 The Future Crew" (its "?" switch)
  'assembly-93-invite': { year: 1993 }, // readme.1st: "Released: 15th of June 1993"
  'bussimatkaintro-93': { year: 1993 }, // INTRO.EXE is dated 7 November 1993
  'assembly-94-preinvite': { year: 1994 }, // README.1ST: "Released on the 8th of April 1994"
  'assembly-94-invite': { year: 1994 }, // README.1ST: "Released on the 3rd of July 1994"
  soppa: { year: 1994 }, // SOPPA.EXE is dated 6 August 1994, during Assembly '94
  animate: { year: 1995 }, // ANIMATE.COM: "Copyright (c) 1995"; its files date from 10 Aug 1995
  drift: { year: 1995 }, // DRIFT.TXT: "released at the Assembly'95 10-13.08.1995"
  blind: { year: 1997 }, // the final version, FILE_ID.DIZ: "released 5.1.1997"
  helium: { year: 1997 }, // HELIUM.TXT: "Released at asm'97"; HELIUM.COM is dated 5 Aug 1997
  'the-globe': { year: 1993 }, // GLOBE.TXT: "GLOBE was coded bye Jare of VangeliSTeam, 29/5/93"
  'blastersound-2': { year: 1994 }, // BLASTER2.NFO: "Written by Iguana in 1994."
  kukoo2: { year: 1994 }, // 2.43 "short", whose KUKOO2.EXE is dated 28 March 1994
  'journey-1': { year: 1993 }, // FCINFO12.TXT: "JOURNEY1.ZIP 867 kb 12-28-93"
  'journey-2': { year: 1993 }, // FCINFO12.TXT: "JOURNEY2.ZIP 1015 kb 12-28-93"
  'chaotic-mind': { year: 1994 }, // FCINFO13.TXT: "CHMIND.ZIP 1420 kb 02-20-94"; every file is of that day
  'worldcharts-1': { year: 1993 }, // FILE_ID.DIZ: "Released May 26th, 1993"
  'composer-669': { year: 1992 }, // COMPOSD.DOC: "(c) 1992, Tran"; COMPOSD.EXE is dated 4 Dec 1992
  edlib: { year: 1994 }, // EDLIB.REV: "20/12-1994; Version 1.05a: First public release"
  monotone: { year: 2017 }, // 0.3.9: MT.EXE and MONOTONE.REV's last entry are of 8 July 2017
  'adlib-tracker-2': { year: 2026 }, // 2.3.58, rebuilt "06/02/2026" (REVISION.TXT)
  'fire-demo': { year: 1993 }, // FIRE.NFO: "FIRE was coded bye Jare of VangeliSTeam, 9-10/5/93"
  iris: { year: 1993 }, // BIG/IRIS.NFO: "IRIS was coded bye Jare of VangeliSTeam, 12/5/93"
};

describe('availableApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(availableApps)('$name', (app) => {
    it('should download its ZIP archive with the progress callback and abort signal', async () => {
      const onProgress = vi.fn();
      const { signal } = new AbortController();

      await expect(app.loader(onProgress, signal)).resolves.toEqual(new Uint8Array([1, 2, 3]));
      expect(loadZipArchive).toHaveBeenCalledExactlyOnceWith(
        `/demos/${app.id}.zip`,
        onProgress,
        signal
      );
    });

    it('should have that archive in public/demos, as a ZIP', () => {
      // Vite's dev and preview servers answer a missing file with the page itself, which
      // js-dos would take for the archive and mount as an empty C: drive
      const archive = readFileSync(new URL(`${app.id}.zip`, DEMOS));

      expect(String.fromCharCode(...archive.subarray(0, 4))).toBe('PK\x03\x04');
    });

    it('should only state DOSBox settings the default backend applies', async () => {
      const conf = await dosboxConfOf(app);

      for (const ignored of IGNORED_BY_DEFAULT_BACKEND) {
        expect(conf).not.toMatch(ignored);
      }
    });

    it('should not claim a CPU type in its banner', async () => {
      // The backend has no 486 or Pentium type to give it
      const conf = await dosboxConfOf(app);

      expect(conf).not.toMatch(/^echo CPU: .*(486|pentium)/im);
    });

    it('should name in its banner the cycles it runs at', async () => {
      const conf = await dosboxConfOf(app);
      const cycles = /^cycles=(.*)$/m.exec(conf)?.[1] ?? '';
      const names: Record<string, string> = { max: 'Maximum Cycles', auto: 'Auto Cycles' };

      for (const [, banner] of conf.matchAll(/^echo CPU: (.*)$/gm)) {
        expect(banner).toBe(names[cycles] ?? `${cycles} cycles`);
      }
    });

    it('should name the Gravis UltraSound in its banner only when it has one', async () => {
      const conf = await dosboxConfOf(app);
      const hasGus = /^gus=true$/m.test(conf);

      for (const [banner] of conf.matchAll(/^echo Audio: .*$/gm)) {
        expect(banner.includes('Gravis UltraSound')).toBe(hasGus);
      }
    });

    it('should not claim a GUS memory size or stereo sound in its banner', async () => {
      // The backend's GUS always has 1 MB, which no setting changes, and js-dos mixes the
      // sound down to one channel for the page
      const conf = await dosboxConfOf(app);

      expect(conf).not.toMatch(/^echo .*(\d+ ?KB|stereo)/im);
    });

    it('should record the size of its archive, which its disk shows', () => {
      const archive = readFileSync(new URL(`${app.id}.zip`, DEMOS));

      expect(app.archiveBytes).toBe(archive.byteLength);
    });

    it('should end its config with the autoexec, which the end marker follows', async () => {
      const conf = await dosboxConfOf(app);

      expect(() => withEndMarker(conf, endMarkerFor(app.name))).not.toThrow();
      expect(withEndMarker(conf, endMarkerFor(app.name))).toMatch(/ has ended\.\n$/);
    });

    it('should not print the text its start waits for in its own banner', async () => {
      // DOS prints the banner before the program starts, so a ready signal found in it would
      // send the keys before the setup screen reads them
      const ready = app.start?.ready;
      if (!ready || !('stdout' in ready)) return;
      const banner = (await dosboxConfOf(app))
        .split('\n')
        .filter((line) => /^echo /i.test(line))
        .join('\n');

      expect(banner).not.toContain(ready.stdout);
    });

    it('should describe itself without superlatives', () => {
      // Facts read better than praise, and the start page's line has room for one
      expect(app.description).not.toMatch(/legendary|groundbreaking|classic|iconic|ultimate/i);
    });

    it('should name no other year for its release in its description or banner', async () => {
      // A year in the description, or a banner's "by Triton (1993)" or "1993 - ...", is the
      // release year; a party's year in the banner ("The Party 1992") is not
      const conf = await dosboxConfOf(app);
      const named = [
        ...app.description.matchAll(/\b(19\d\d)\b/g),
        ...conf.matchAll(/^echo .*\((19\d\d)\)$/gm),
        ...conf.matchAll(/^echo +(19\d\d) - /gm),
      ].map((match) => Number(match[1]));

      for (const year of named) {
        expect(year).toBe(app.year);
      }
    });
  });

  it('should give each app an id of its own, with or without its hyphens', () => {
    // The address bar shows ids without hyphens, and a link names one app in either form
    const ids = availableApps.map((app) => app.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids.map(getUrlFriendlyId)).size).toBe(ids.length);
  });

  it('should list the demos first, then the intros, musicdisks, diskmags, trackers and effects', () => {
    expect(availableApps.map((app) => [app.id, app.kind])).toEqual([
      ['second-reality', 'demo'],
      ['unreal', 'demo'],
      ['panic', 'demo'],
      ['crystal-dream-2', 'demo'],
      ['mental-surgery', 'demo'],
      ['verses', 'demo'],
      ['holistic', 'demo'],
      ['heartquake', 'demo'],
      ['timeless', 'demo'],
      ['inconexia', 'demo'],
      ['pump', 'demo'],
      ['stars-nooon', 'demo'],
      ['dx-project', 'demo'],
      ['untitled-dust', 'demo'],
      ['dope', 'demo'],
      ['solstice', 'demo'],
      ['contrast', 'demo'],
      ['slideshow-1', 'demo'],
      ['machines-of-madness', 'demo'],
      ['boost', 'demo'],
      ['starport-bbstro', 'intro'],
      ['squid-bbstro', 'intro'],
      ['gr8', 'intro'],
      ['yo', 'intro'],
      ['fishtro', 'intro'],
      ['starport-bbstro-1', 'intro'],
      ['the-party-92-invite', 'intro'],
      ['assembly-93-invite', 'intro'],
      ['bussimatkaintro-93', 'intro'],
      ['assembly-94-preinvite', 'intro'],
      ['assembly-94-invite', 'intro'],
      ['soppa', 'intro'],
      ['animate', 'intro'],
      ['drift', 'intro'],
      ['blind', 'intro'],
      ['helium', 'intro'],
      ['the-globe', 'intro'],
      ['blastersound-2', 'intro'],
      ['kukoo2', 'intro'],
      ['journey-1', 'musicdisk'],
      ['journey-2', 'musicdisk'],
      ['chaotic-mind', 'musicdisk'],
      ['worldcharts-1', 'diskmag'],
      ['impulse-tracker', 'tracker'],
      ['scream-tracker', 'tracker'],
      ['composer-669', 'tracker'],
      ['edlib', 'tracker'],
      ['monotone', 'tracker'],
      ['adlib-tracker-2', 'tracker'],
      ['3drotate', 'effect'],
      ['stars', 'effect'],
      ['fire-demo', 'effect'],
      ['iris', 'effect'],
    ]);
  });

  it('should start each production that waits at a setup screen with its own keys', () => {
    // The others start by themselves, from switches on their command line where they have
    // them; The Globe and BlasterSound #2 take any key as the visitor's, and must get none
    const started = availableApps.filter((app) => app.start).map((app) => app.id);

    expect(started).toEqual([
      'second-reality',
      'unreal',
      'panic',
      'crystal-dream-2',
      'mental-surgery',
      'holistic',
      'heartquake',
      'inconexia',
      'pump',
      'dx-project',
      'solstice',
      'slideshow-1',
      'fishtro',
      'assembly-94-preinvite',
      'drift',
      'blind',
      'kukoo2',
      'journey-1',
      'journey-2',
      'chaotic-mind',
      'impulse-tracker',
      'scream-tracker',
      'composer-669',
      'edlib',
      'monotone',
      '3drotate',
    ]);
  });

  it.each([
    ['blind', [[49], [52], [50]]], // 1 for the GUS, 4 for port 240h, 2 to play it once
    ['slideshow-1', [[57]]], // 9, "Sound Blaster with 12Mhz or faster AT"
    ['monotone', [[49], [48], [52], [257], [32]]], // generic color, PC speaker, four tracks
  ])('should press the digits %s asks for at its setup', (id, keys) => {
    expect(findAppById(id)?.start?.steps.map((step) => step.keys)).toEqual(keys);
  });

  it('should start Unreal 1.1 on the Gravis UltraSound its setup preselects', async () => {
    // Version 1.0's setup started on No sound and took five keys; 1.1's starts on "Gravis
    // Ultrasound 44Khz", which a GUS at 240h, IRQ 5, DMA 3 gives it
    const unreal = findAppById('unreal');

    expect(unreal?.start?.steps.map((step) => step.keys)).toEqual([[257]]);
    expect(await unreal?.loadDosboxConf?.()).toMatch(
      /^\[gus\]\ngus=true\ngusbase=240\ngusirq=5\ngusdma=3\n/m
    );
  });

  it('should tell the visitor what each start does, and which keys to press when it cannot', () => {
    for (const app of availableApps.filter((each) => each.start)) {
      expect(app.startNote, app.id).toMatch(/\.$/);
      expect(app.hint, app.id).toMatch(/\b(press|Press)\b/);
    }
  });

  it('should warn of flashing lights in the productions that flash', () => {
    // Measured frame by frame against WCAG 2.3.1's three flashes a second: Panic for 79 s
    // of 247, Second Reality's techno part, Crystal Dream 2's opening and 20 s more, about
    // 60 s of Inconexia's scroller, Pump's greetings, Contrast's multi-fire part and three
    // stretches of Iris's plasma
    const flashing = availableApps.filter((app) => app.flashing).map((app) => app.id);

    expect(flashing).toEqual([
      'second-reality',
      'panic',
      'crystal-dream-2',
      'inconexia',
      'pump',
      'contrast',
      'iris',
    ]);
  });

  it('should say what else the productions that show nudity show, before they play', () => {
    const noted = availableApps.filter((app) => app.contentNote);

    expect(noted.map((app) => app.id)).toEqual([
      'timeless',
      'stars-nooon',
      'contrast',
      'boost',
      'fishtro',
      'kukoo2',
    ]);
    for (const app of noted) {
      expect(app.contentNote, app.id).toMatch(/^Contains .*\.$/);
    }
  });

  it('should ask before the page closes only while a tracker runs', () => {
    // On Windows, Linux and ChromeOS, browsers keep Ctrl+W, Ctrl+N and Ctrl+T for themselves,
    // and Scream Tracker 3 saves on Ctrl-W: the tab would close with the song unsaved. A demo
    // has nothing to lose.
    const asking = availableApps.filter((app) => app.warnBeforeLeaving).map((app) => app.id);
    const trackers = availableApps.filter((app) => app.kind === 'tracker').map((app) => app.id);

    expect(asking).toEqual(trackers);
    expect(availableApps.filter((app) => app.saveFiles).map((app) => app.id)).toEqual(trackers);
  });

  it.each([
    ['composer-669', ['.669'], undefined],
    ['edlib', ['.edl'], 'SONGS'], // EdLib reads its songs only from SONGS\\
    ['monotone', ['.mon'], undefined],
    ['adlib-tracker-2', expect.arrayContaining(['.a2m', '.a2t']), 'AT2'], // where it runs
  ])("should bring %s's own files into the folder it reads them from", (id, accept, folder) => {
    expect(findAppById(id)?.modules).toEqual({ accept, ...(folder ? { folder } : {}) });
  });

  it('should load every archive in public/demos', () => {
    // Each archive is part of every deploy, whether an app loads it or not
    const unloaded = archivesInDemos().filter((name) => !findAppById(name.replace(/\.zip$/, '')));

    expect(unloaded).toEqual([]);
  });

  it.each(Object.entries(RELEASES))(
    'should date %s by the release its archive holds',
    (id, release) => {
      expect(findAppById(id)?.year).toBe(release.year);
    }
  );

  it('should run Crystal Dream 2 at max cycles', async () => {
    // Its packed loader runs in real mode, where 'auto' gives it 3,000 cycles/ms and its setup
    // appears only after about 46 s; at a fixed 30000 the demo stops: "System overloaded!"
    const conf = await findAppById('crystal-dream-2')?.loadDosboxConf?.();

    expect(conf).toMatch(/^cycles=max$/m);
  });

  it.each(['dope', 'machines-of-madness', 'boost'])('should run %s at max cycles', async (id) => {
    // At a fixed 30000 their later parts fall behind captures of Pentiums with a GUS, or play
    // with half their frames
    expect(await findAppById(id)?.loadDosboxConf?.()).toMatch(/^cycles=max$/m);
  });

  it.each(['panic', 'squid-bbstro', 'inconexia', 'contrast', 'worldcharts-1', 'kukoo2'])(
    'should draw %s on a plain VGA',
    async (id) => {
      // Each changes the palette or the VGA's registers while a frame is drawn. DOSBox's
      // default SVGA machine applies palette changes once a frame, which tears Panic's
      // scroller and plasma, leaves Squid without its raster bars, garbles Inconexia's
      // greetings and Kukoo2's VGA part, flattens Contrast's end gradient and turns half of
      // Worldcharts' colors lime; vgaonly draws line by line, as a real VGA does.
      const conf = await findAppById(id)?.loadDosboxConf?.();

      expect(conf).toMatch(/^\[dosbox\]\nmachine=vgaonly$/m);
    }
  );

  it.each([
    'verses',
    'heartquake',
    'timeless',
    'pump',
    'stars-nooon',
    'dx-project',
    'untitled-dust',
    'dope',
    'solstice',
    'contrast',
    'machines-of-madness',
    'boost',
    'assembly-93-invite',
    'bussimatkaintro-93',
    'assembly-94-preinvite',
    'assembly-94-invite',
    'soppa',
    'drift',
    'blind',
    'journey-1',
    'journey-2',
    'chaotic-mind',
    'worldcharts-1',
  ])(
    'should give %s the Gravis UltraSound at 240h, IRQ 5, DMA 3 it was vetted with',
    async (id) => {
      // Their setups or command lines pick the card there, and several stop, run silent or race
      // ahead of their music without one
      const conf = await findAppById(id)?.loadDosboxConf?.();

      expect(conf).toMatch(/^\[gus\]\ngus=true\ngusbase=240\ngusirq=5\ngusdma=3\n/m);
      expect(conf).toMatch(/^ultradir=C:\\ULTRASND$/m);
    }
  );

  it('should give Holistic no Gravis UltraSound, whose music hangs it', async () => {
    expect(await findAppById('holistic')?.loadDosboxConf?.()).toMatch(/^gus=false$/m);
  });

  it.each([
    ['composer-669', 'sbpro2'], // on the Sound Blaster 16 it plays almost silently
    ['inconexia', 'sbpro2'], // on the Sound Blaster 16 its music stops and its Museum waits
    ['assembly-94-preinvite', 'none'], // its menu's Enter then finds the GUS
  ])('should give %s the Sound Blaster it was vetted with, %s', async (id, sbtype) => {
    expect(await findAppById(id)?.loadDosboxConf?.()).toMatch(
      new RegExp(`^sbtype=${sbtype}$`, 'm')
    );
  });

  it('should run Composer 669 without EMS, XMS or UMB, and Adlib Tracker II with 32 MB', async () => {
    // With EMS and XMS, Composer 669 stops: "Not enough extended memory to run this
    // program!!!"; with DOSBox's default 16 MB, Adlib Tracker II: "Insufficient extended memory!"
    expect(await findAppById('composer-669')?.loadDosboxConf?.()).toMatch(
      /^\[dos\]\numb=false\nems=false\nxms=false$/m
    );
    expect(await findAppById('adlib-tracker-2')?.loadDosboxConf?.()).toMatch(/^memsize=32$/m);
  });

  it.each([
    ['verses', 'VERSES.EXE !'], // "no questions asked": its setup takes the GUS
    ['timeless', 'TIMELESS.EXE /S343 /L1'], // the GUS at 240h, IRQ 5; one pass
    ['untitled-dust', 'UNTITLED.EXE /NS'], // past a setup that wants the mouse on "start"
    ['assembly-94-invite', 'ASM-94_2.EXE -q -c2'], // quick mode, the GUS
    ['composer-669', 'COMPOSD.EXE /SC: /IC:'],
    ['fire-demo', 'SHELLVT.EXE /d:DMA-SB-Stereo /f:22000 /v:63 /hq * /sh:Fire.Exe'], // RUNDEMO's
  ])('should start %s with its own switches', async (id, command) => {
    const conf = (await findAppById(id)?.loadDosboxConf?.()) ?? '';

    expect(conf.trimEnd().split('\n').at(-1)).toBe(command);
  });

  it.each([
    ['iris', 'cd BIG'], // the 1993 release; the IRIS.EXE beside the folder is a later build
    ['pump', 'SET WINDIR=KK'], // its README's fix: without it, it runs at 0.44 of its speed
    ['adlib-tracker-2', 'cd AT2'], // where its files are, and its file browser opens
  ])('should prepare %s with %s before it starts', async (id, line) => {
    const lines = ((await findAppById(id)?.loadDosboxConf?.()) ?? '').trimEnd().split('\n');
    const autoexec = lines.slice(lines.indexOf('[autoexec]'));

    // After the drive is mounted, before the program
    expect(autoexec.indexOf(line)).toBeGreaterThan(autoexec.indexOf('c:'));
    expect(autoexec.indexOf(line)).toBeLessThan(autoexec.length - 1);
  });

  it('should keep Helium at its own aspect, which 4:3 would stretch about 35% wider', () => {
    expect(findAppById('helium')?.jsdos).toEqual({ renderAspect: 'AsIs' });
  });

  it('should run Second Reality at about the speed of a 486DX2-66', async () => {
    // At 'max' it showed the default VGA palette for 12 to 15 s near 1:30 in most runs; at a
    // fixed 24000 it never did, and its timeline stays within about 1% of a real 486DX2-66
    const conf = await findAppById('second-reality')?.loadDosboxConf?.();

    expect(conf).toMatch(/^cycles=24000$/m);
  });

  it.each(['starport-bbstro', 'unreal', 'panic', '3drotate'])(
    'should run %s at a fixed 30000 cycles',
    async (id) => {
      // 'auto' gives these real-mode programs 3,000 cycles/ms: StarPort then draws 35 of its 70
      // frames a second, 3drotate turns its cube at half speed, and Unreal's and Panic's
      // effects fall seconds behind. At 'max' Panic plays no sound.
      expect(await findAppById(id)?.loadDosboxConf?.()).toMatch(/^cycles=30000$/m);
    }
  );

  it('should give Crystal Dream 2 the Ultrasound its setup offers first, and a Sound Blaster', async () => {
    // Without a GUS, DOSBox sets no ULTRASND, and taking the setup's first choice stops the
    // demo at the DOS prompt: "Cannot find ULTRASND enviroment string."
    const conf = await findAppById('crystal-dream-2')?.loadDosboxConf?.();

    expect(conf).toMatch(/^\[gus\]\ngus=true\n/m);
    expect(conf).toMatch(/^ultradir=C:\\ULTRASND$/m);
    expect(conf).toMatch(/^sbtype=sb16$/m);
  });

  it.each(['3drotate', 'stars'])('should credit %s to Draeden of VLA, who wrote it', async (id) => {
    // Its VLA.NFO names Draeden as the writer; Grumpy's source pack only collected it
    const app = findAppById(id);

    expect(app?.author).toBe('Draeden of VLA');
    expect(await app?.loadDosboxConf?.()).toMatch(/^echo +by Draeden of VLA \(1993\)$/m);
  });
});

describe('APP_ID_MAPPING and INTERNAL_TO_URL_MAPPING', () => {
  it.each(['constructor', '__proto__', 'toString'])(
    'should map no app from %s, which every object inherits',
    (name) => {
      // ?app=constructor would otherwise name the Object function as an app, and the page
      // would show no "not found" message
      expect(APP_ID_MAPPING[name]).toBeUndefined();
      expect(INTERNAL_TO_URL_MAPPING[name]).toBeUndefined();
    }
  );

  it('should still map each app from both forms of its id', () => {
    expect(APP_ID_MAPPING['crystaldream2']).toBe('crystal-dream-2');
    expect(APP_ID_MAPPING['crystal-dream-2']).toBe('crystal-dream-2');
    expect(INTERNAL_TO_URL_MAPPING['crystal-dream-2']).toBe('crystaldream2');
  });
});

describe('public/demos/README.md', () => {
  const readme = readFileSync(new URL('README.md', DEMOS), 'utf8');

  it('should list every archive in its table', () => {
    const listed = [...readme.matchAll(/^\| `([^`]+\.zip)` +\|/gm)].map(([, name]) => name);

    expect(listed.sort()).toEqual(archivesInDemos().sort());
  });

  it.each(archivesInDemos())('should record the size and MD5 of %s as it is', (name) => {
    // The archive's entry runs from its heading to the next one
    const entry = readme.split(/^## /m).find((section) => section.startsWith(`\`${name}\``));
    const archive = readFileSync(new URL(name, DEMOS));

    expect(entry, `${name} has no entry`).toBeDefined();
    expect(/the ZIP is ([\d,]+)/.exec(entry ?? '')?.[1]?.replaceAll(',', '')).toBe(
      `${archive.byteLength}`
    );
    expect(/MD5\s+`([0-9a-f]{32})`/.exec(entry ?? '')?.[1]).toBe(
      createHash('md5').update(archive).digest('hex')
    );
  });
});
