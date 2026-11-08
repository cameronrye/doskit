/**
 * Tests for the DOS application registry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { availableApps, findAppById } from './apps.config';
import { loadZipArchive } from '../utils/diskLoader';
import type { DosApp } from '../types/dos-app';

vi.mock('../utils/diskLoader', () => ({
  loadZipArchive: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

/** The DOSBox config an app runs with, as DemoSelector resolves it */
const dosboxConfOf = async (app: DosApp): Promise<string> =>
  (await app.loadDosboxConf?.()) ?? app.dosboxConf;

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
  'impulse-tracker': { year: 1997 }, // 2.14 Patch 3, whose files are dated 21 December 1997
  'starport-bbstro': { year: 1993 }, // README: "Copyright (C) 1993 Future Crew"
  'scream-tracker': { year: 1994 }, // 3.21, whose ST3.EXE is dated 25 December 1994
  unreal: { year: 1992 }, // README.NOW: "Copyright (C) 1992"; UNREAL.EXE is dated 8 August 1992
  panic: { year: 1993 }, // FILE_ID.DIZ: "Released 4th Feb 1993", after The Party 1992
  'squid-bbstro': { year: 1994 }, // SQUID1.ASM, in its source repo: "31-Jan-1994"
  '3drotate': { year: 1993 }, // 3DROTATE.TXT, in its source repo: "DATE: 02/22/93"
  stars: { year: 1993 }, // STARS.TXT, in its source repo: "DATE: 03/15/93"
  'crystal-dream-2': { year: 1993 }, // CD2.EXE is dated 31 May 1993
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

    it('should not claim a GUS memory size or stereo sound in its banner', async () => {
      // The backend's GUS always has 1 MB, which no setting changes, and js-dos mixes the
      // sound down to one channel for the page
      const conf = await dosboxConfOf(app);

      expect(conf).not.toMatch(/^echo .*(\d+ ?KB|stereo)/im);
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

  it.each(Object.entries(RELEASES))(
    'should date %s by the release its archive holds',
    (id, release) => {
      expect(findAppById(id)?.year).toBe(release.year);
    }
  );

  it.each(['3drotate', 'stars'])('should credit %s to Draeden of VLA, who wrote it', async (id) => {
    // Its VLA.NFO says "Written By: Draeden"; Grumpy's source pack only collected it
    const app = findAppById(id);

    expect(app?.author).toBe('Draeden of VLA');
    expect(await app?.loadDosboxConf?.()).toMatch(/^echo +by Draeden of VLA \(1993\)$/m);
  });
});
