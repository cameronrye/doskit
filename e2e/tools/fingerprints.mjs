// Measures the fingerprint of each production's setup screen, which its start recipe waits
// for (src/apps/<id>.json, start.ready.frames). Run it on a fresh build whenever a production's
// config, its banner or js-dos changes:
//
//   npm run build && node e2e/tools/fingerprints.mjs [id...]
//
// It opens each production in Chromium, lets it reach its setup screen with no key pressed,
// and prints the screens it rested on longest, with how long and from when.
import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { startServer } from '../server.mjs';

const ids = process.argv.slice(2);
const apps = readdirSync('src/apps')
  .filter((name) => name.endsWith('.json') && !name.endsWith('.page.json'))
  .map((name) => JSON.parse(readFileSync(`src/apps/${name}`, 'utf8')))
  .filter((app) => app.start?.ready?.frames && (ids.length === 0 || ids.includes(app.id)));

const site = await startServer({ port: 4461 });
const browser = await chromium.launch();
try {
  for (const app of apps) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.addInitScript({ path: 'e2e/hook.js' });
    const page = await context.newPage();
    await page.goto(`${site.url}/?app=${app.id.replaceAll('-', '')}`);
    // Crystal Dream 2 shows its menu after about 8.5 s
    await page.waitForTimeout(16_000);
    // Run in the page, where globalThis is its window
    const hashes = await page.evaluate(() => globalThis.__e2e.starts.at(-1)?.hashes ?? []);
    const held = new Map();
    hashes.forEach(([t, hash, width, height], i) => {
      const until = hashes[i + 1]?.[0] ?? 16_000;
      const entry = held.get(hash) ?? { ms: 0, from: t, size: `${width}x${height}` };
      entry.ms += until - t;
      held.set(hash, entry);
    });
    const longest = [...held].sort((a, b) => b[1].ms - a[1].ms).slice(0, 3);
    console.log(
      `${app.id}: data ${JSON.stringify(app.start.ready.frames)}; seen ` +
        longest.map(([hash, e]) => `${hash} (${e.size}, ${e.ms} ms from ${e.from} ms)`).join(', ')
    );
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}
