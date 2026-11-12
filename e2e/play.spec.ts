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
};

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
    expect(seen.playButton?.name).toBe(app.kind === 'tracker' ? 'Start' : 'Play');
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
