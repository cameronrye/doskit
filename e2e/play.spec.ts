/**
 * Every production, opened from its link and started with one real click on Play: its start
 * keys must get it past its setup screen, its picture must move, and the ones with sound must
 * make some, with the browser letting it play.
 *
 * Nothing here queries the page before the click. Playwright's locators and page.evaluate()
 * give the page user activation, and DosKit starts a production at once, without its Play
 * screen, when the page has a fresh one. Everything is read from the console lines of
 * e2e/hook.js instead, and the click goes where the hook says the button is.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

interface AppData {
  id: string;
  name: string;
  kind: string;
  start?: unknown;
}

const apps: AppData[] = readdirSync('src/apps')
  .filter((name) => name.endsWith('.json') && !name.endsWith('.page.json'))
  .map((name) => JSON.parse(readFileSync(`src/apps/${name}`, 'utf8')));

/** What "it runs" means for each production, from runs against real hardware captures */
const RUNS: Record<string, { sound: boolean; size?: [number, number] }> = {
  // Second Reality's opening is 17 s of black text mode with its music playing
  'second-reality': { sound: true },
  unreal: { sound: true, size: [320, 200] },
  // On a plain VGA (machine=vgaonly) the emulator doubles its 320x200 mode to 640x400
  panic: { sound: true, size: [640, 400] },
  'crystal-dream-2': { sound: true },
  'starport-bbstro': { sound: true },
  'squid-bbstro': { sound: true },
  // The trackers make no sound until a song is played
  'impulse-tracker': { sound: false },
  'scream-tracker': { sound: false },
  '3drotate': { sound: false, size: [320, 200] },
  stars: { sound: false },
  // Its setup waits for five keys (Y, N, Y, Enter, Enter), then 320x200 throughout
  'mental-surgery': { sound: true, size: [320, 200] },
  // No setup ("VERSES.EXE !"): GUS music from the start; 640x480 in its IFS part (23 to 61 s)
  verses: { sound: true },
  // A 640x400 setup, which its keys pass, then a load ("Loading the demo may take a while")
  holistic: { sound: true },
  // A 640x400 setup, then 320x200; its start is Enter only, as Space would skip a part
  heartquake: { sound: true },
  // It plays once (/L1) and returns to DOS at about 201 s, or 214 s; its end picture is 640x350
  timeless: { sound: true, size: [320, 200] },
  // Its setup waits for Enter (720x400 text on vgaonly); its parts show at 640x400 on vgaonly
  inconexia: { sound: true },
  // It returns to DOS by itself at about 131.5 s
  pump: { sound: true, size: [320, 200] },
  // It takes no keys: Space and Escape neither skip nor stop it
  'stars-nooon': { sound: true, size: [320, 200] },
  // Six start keys, sent once; then 640x480 through VESA on svga_s3
  'dx-project': { sound: true, size: [640, 480] },
  // /NS skips its setup, so it starts with the dungeon and needs no keys
  'untitled-dust': { sound: true, size: [320, 200] },
  // At max cycles
  dope: { sound: true, size: [320, 200] },
  // Three Enters at its MIDAS sound setup; it returns to DOS by itself after about 3.5 minutes
  solstice: { sound: true },
  // On a plain VGA its 320x200 and 320x400 parts both show at 640x400; it ends on a BBS screen
  // of its own, in text mode, which waits for Space or Escape
  contrast: { sound: true, size: [640, 400] },
  // Its sound menu waits for 9; the first picture then stays until a key is pressed
  'slideshow-1': { sound: true, size: [320, 200] },
  // Picks the GUS by itself; 320x200, with a 640x480 VESA title picture and a 320x255 painting
  'machines-of-madness': { sound: true },
  // MIDAS picks the GUS by itself; 320x200 hi-color through VESA
  boost: { sound: true },
  // EGA's 320x200 16-color mode (0Dh) from 0.1 s to the end; it has no sound, by design
  gr8: { sound: false, size: [320, 200] },
  // VGA text mode at 80x50 with the 8x8 font throughout; PC-speaker music
  yo: { sound: true, size: [640, 400] },
  // Its setup waits for Enter; a 3 s notice, then part 1 at 320x200 and part 2 at 316x200
  fishtro: { sound: true },
  // A 640x350 16-color graphics screen drawn to look like text (not text mode); AdLib music
  'starport-bbstro-1': { sound: true, size: [640, 350] },
  // It finds the Sound Blaster by itself; 320x200 throughout its 6 minutes
  'the-party-92-invite': { sound: true, size: [320, 200] },
  // 640x480 in 16 colors throughout (readme.1st); its last page waits for Escape
  'assembly-93-invite': { sound: true, size: [640, 480] },
  // Five pages of text in 640x400; it waits on each until Down, Up or Escape
  'bussimatkaintro-93': { sound: true, size: [640, 400] },
  // A sound card menu that waits for Enter; then 320x240 with a 640x480 logo picture, in a loop
  'assembly-94-preinvite': { sound: true },
  // Black for its first 12.5 s while its music plays; 640x400 (a 320x400 mode) after that
  'assembly-94-invite': { sound: true },
  // Black for its first 10 s while its music plays; 320x240, with a 640x480 title from 29.4 to
  // 36.9 s; it returns to DOS by itself at about 128 s
  soppa: { sound: true },
  // No sound, by design; 320x200, and it returns to DOS by itself at about 48.5 s
  animate: { sound: false },
  // Its eight start keys are sent once; GUS; 320x200, and 640x480 for its end scroller
  drift: { sound: true },
  // Its setup waits for three digits; GUS; back at DOS about 159 s after its keys
  blind: { sound: true, size: [320, 200] },
  // AdLib music; a tweaked 252x256 mode, shown AsIs; back at DOS by itself at about 95 s
  helium: { sound: true },
  // No sound; DosKit must send it no keys (a key stops its cycle of figures)
  'the-globe': { sound: false, size: [320, 200] },
  // 640x480 in 16 colors, with AdLib music; DosKit must send it no keys (a key ends it)
  'blastersound-2': { sound: true, size: [640, 480] },
  // Its CGA pre-intro plays the Belgian anthem on the PC speaker, then waits for Space at about
  // 14 s; on a plain VGA its VGA part then shows at 792x558
  kukoo2: { sound: true, size: [792, 558] },
  // Enter plays the first song: its 512x480 menu gives way to the 640x480 playing screen
  'journey-1': { sound: true },
  // Enter plays the first song: its 512x480 menu gives way to the 640x480 playing screen
  'journey-2': { sound: true },
  // Enter plays the first song, Amazonas: its 512x480 menu gives way to the 640x480 playing screen
  'chaotic-mind': { sound: true },
  // No start keys: it finds the GUS and plays its music on its main menu, up at about 2 s
  'worldcharts-1': { sound: true },
  // 80x50 text mode; silent, as it comes with no song
  'composer-669': { sound: false, size: [640, 400] },
  // Its About box waits for Escape; 80x50 text; silent until a song is played
  edlib: { sound: false, size: [640, 400] },
  // Its setup and title screen take DosKit's keys; 40x25 text shown at 640x400; silent until
  // a song is played
  monotone: { sound: false, size: [640, 400] },
  // About 14 s of a still DOS screen before its 720x480 editor; silent until a song is played
  'adlib-tracker-2': { sound: false, size: [720, 480] },
  // Its music plays throughout; any key ends it
  'fire-demo': { sound: true, size: [320, 200] },
  // No sound, by design; it runs until a key
  iris: { sound: false, size: [320, 200] },
};

/** What the Play button says, where it does not say Play: a tracker is started, a diskmag read */
const PLAY_LABELS: Record<string, string> = { tracker: 'Start', diskmag: 'Read' };

interface Frame {
  t: number;
  hash: number;
  width: number;
  height: number;
}

/** What the page's emulator does, from e2e/hook.js's console lines */
function watch(page: Page) {
  const seen = {
    frames: [] as Frame[],
    loudness: [] as { second: number; ac: number }[],
    keys: [] as { t: number; code: number }[],
    audioStates: [] as string[],
    starts: 0,
    playButton: null as { x: number; y: number; name: string } | null,
  };
  page.on('console', (message) => {
    const text = message.text();
    if (!text.startsWith('[e2e] ')) return;
    const line = JSON.parse(text.slice(6));
    switch (line.event) {
      case 'play-button':
        seen.playButton = line;
        break;
      case 'start':
        seen.starts += 1;
        break;
      case 'audio-context':
      case 'audio-state':
        seen.audioStates.push(line.state);
        break;
      case 'frame':
        seen.frames.push(line);
        break;
      case 'loudness':
        seen.loudness.push(line);
        break;
      case 'key':
        seen.keys.push(line);
        break;
    }
  });
  return seen;
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript({ path: 'e2e/hook.js' });
});

for (const app of apps) {
  const runs = RUNS[app.id];

  test(`${app.name} plays from its link with one press`, async ({ page, browserName }) => {
    expect(runs, `RUNS has no entry for ${app.id}`).toBeDefined();
    const seen = watch(page);
    await page.goto(`/${app.id.replaceAll('-', '')}`);

    // The Play screen, with nothing running behind it
    await expect.poll(() => seen.playButton, { timeout: 30_000 }).not.toBeNull();
    expect(seen.playButton?.name).toBe(PLAY_LABELS[app.kind] ?? 'Play');
    expect(seen.starts).toBe(0);
    await page.mouse.click(seen.playButton!.x, seen.playButton!.y);

    await expect
      .poll(
        () => {
          const last = seen.frames.at(-1);
          if (!last) return 'no picture';
          // A production with start keys: they went, and a screen never seen before them
          // followed, or its size changed, or its music started
          const firstKey = seen.keys[0];
          if (app.start) {
            if (!firstKey) return 'no keys sent';
            const before = new Set(seen.frames.filter((f) => f.t < firstKey.t).map((f) => f.hash));
            const after = seen.frames.filter((f) => f.t > firstKey.t);
            if (!after.some((f) => !before.has(f.hash))) return 'no new screen after its keys';
          } else if (new Set(seen.frames.map((f) => f.hash)).size < 3) {
            return 'a still picture';
          }
          if (runs!.size && (last.width !== runs!.size[0] || last.height !== runs!.size[1])) {
            return `at ${last.width}x${last.height}`;
          }
          if (runs!.sound && !seen.loudness.some(({ ac }) => ac > 0.003)) return 'silent';
          return 'running';
        },
        { timeout: 60_000, intervals: [500] }
      )
      .toBe('running');

    // DosKit's own start did it: the visitor was never asked to press keys
    await expect(page.locator('.doskit-start-hint')).toHaveCount(0);
    // An automated WebKit window is never the frontmost app, so its sound stays interrupted
    if (runs!.sound && browserName === 'chromium') {
      expect(seen.audioStates).toContain('running');
    }
  });
}

test('Enter on the focused Play button starts a production with sound too', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', "An automated WebKit window's sound stays interrupted");
  const seen = watch(page);
  await page.goto('/panic');
  await expect.poll(() => seen.playButton, { timeout: 30_000 }).not.toBeNull();

  // The Play button has the focus: a real key press, with no query of the page first
  await page.keyboard.press('Enter');

  await expect
    .poll(() => seen.loudness.some(({ ac }) => ac > 0.003), { timeout: 30_000 })
    .toBe(true);
  expect(seen.audioStates).toContain('running');
});
