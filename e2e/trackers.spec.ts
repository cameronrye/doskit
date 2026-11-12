/// <reference lib="dom" />
/**
 * A tracker's files across visits, in a real browser with its IndexedDB: a song saved in
 * Scream Tracker 3 comes back after a reload, downloads as the ZIP js-dos packed, and a
 * module brought in from the computer appears in its file system under a DOS name.
 *
 * As in play.spec.ts, nothing queries the page before the click on Start: Playwright's
 * locators would give the page user activation, which skips the Start screen. Keys go to
 * DOS through the real keyboard, and the file system is read with page.evaluate() only
 * after the tracker has started.
 */
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript({ path: 'e2e/hook.js' });
});

/** Open Scream Tracker 3 at its page and start it, as a visitor would */
async function startScreamTracker(page: Page) {
  let button: { x: number; y: number } | null = null;
  let keys = 0;
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('"play-button"')) button = JSON.parse(text.slice(6));
    if (text.includes('"event":"key"')) keys += 1;
  });
  await page.goto('/screamtracker');
  await expect.poll(() => button, { timeout: 30_000 }).not.toBeNull();
  await page.mouse.click(button!.x, button!.y);
  // Its start key, Space, takes it past the title screen to the pattern editor
  await expect.poll(() => keys, { timeout: 30_000 }).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
}

/** The names of the files at the root of the running emulator's C: drive */
async function rootFiles(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const e2e = (globalThis as { __e2e?: { starts: { ci?: { fsTree(): Promise<unknown> } }[] } })
      .__e2e;
    // A restarted emulator has no command interface until it is ready
    const ci = e2e?.starts.at(-1)?.ci;
    if (!ci) return [];
    const tree = (await ci.fsTree()) as {
      nodes: { name: string; nodes: unknown }[] | null;
    };
    return (tree.nodes ?? []).filter((node) => node.nodes === null).map((node) => node.name);
  });
}

test('a song saved in Scream Tracker 3 is there again after a reload', async ({ page }) => {
  await startScreamTracker(page);

  // Ctrl+W saves the song, under a name the tracker asks for
  await page.keyboard.press('Control+w');
  await page.waitForTimeout(800);
  await page.keyboard.type('MYSONG');
  await page.keyboard.press('Enter');
  // DosKit keeps the files three seconds after the last key
  await page.waitForTimeout(4500);
  expect(await rootFiles(page)).toContain('MYSONG.S3M');

  await page.reload();
  await startScreamTracker(page);

  expect(await rootFiles(page)).toContain('MYSONG.S3M');

  // The Files panel downloads them, as the ZIP js-dos packed
  await page.getByRole('button', { name: 'Files' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download/i }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('scream-tracker-files.zip');
  const zip = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of zip) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('PK\x03\x04');
  expect(bytes.includes(Buffer.from('MYSONG.S3M'))).toBe(true);
});

test("a module of the visitor's own appears in the tracker under a DOS name", async ({ page }) => {
  await startScreamTracker(page);
  await page.getByRole('button', { name: 'Files' }).click();

  await page.getByLabel(/bring in modules/i).setInputFiles({
    name: 'my cool song.s3m',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('SCRM module bytes'),
  });

  // The tracker restarts with it
  await expect.poll(() => rootFiles(page), { timeout: 30_000 }).toContain('MYCOOLSO.S3M');

  // and DosKit keeps it, with no key pressed since: it is there after a reload
  await page.waitForTimeout(2500);
  await page.reload();
  await startScreamTracker(page);
  expect(await rootFiles(page)).toContain('MYCOOLSO.S3M');
});
