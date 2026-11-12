// Captures frames of each production running, at its own resolution, for its share card
// (scripts/generate-app-cards.js reads cards-src/<id>.png), and a screenshot of the page
// for the README:
//
//   npm run build && node e2e/tools/frames.mjs <outDir> [id...]
//
// Each production is opened at its link and started with a click on Play, as a visitor
// would; frames are taken at the moments listed below, from js-dos's own screenshot().
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { startServer } from '../server.mjs';

const [outDir = 'cards-src', ...ids] = process.argv.slice(2);
// Seconds after Play: a few candidates each, to pick the frame that shows the production
const MOMENTS = {
  'second-reality': [22, 40, 75],
  unreal: [12, 30, 60],
  panic: [8, 20, 45],
  'crystal-dream-2': [14, 30, 60],
  'starport-bbstro': [3, 6, 10],
  'squid-bbstro': [3, 6, 10],
  'impulse-tracker': [4],
  'scream-tracker': [4],
  '3drotate': [3, 6],
  stars: [3, 6],
};

const apps = readdirSync('src/apps')
  .filter((name) => /^[^.]+\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(`src/apps/${name}`, 'utf8')))
  .filter((app) => ids.length === 0 || ids.includes(app.id));

mkdirSync(outDir, { recursive: true });
const site = await startServer({ port: 4464 });
const browser = await chromium.launch();
try {
  for (const app of apps) {
    const context = await browser.newContext({
      serviceWorkers: 'block',
      viewport: { width: 1280, height: 720 },
    });
    await context.addInitScript({ path: 'e2e/hook.js' });
    const page = await context.newPage();
    let button = null;
    page.on('console', (message) => {
      if (message.text().includes('"play-button"')) button = JSON.parse(message.text().slice(6));
    });
    await page.goto(`${site.url}/${app.id.replaceAll('-', '')}`);
    while (!button) await page.waitForTimeout(100);
    await page.mouse.click(button.x, button.y);
    const started = Date.now();
    for (const second of MOMENTS[app.id] ?? [5]) {
      await page.waitForTimeout(Math.max(0, second * 1000 - (Date.now() - started)));
      // Run in the page, where globalThis is its window
      const png = await page.evaluate(async () => {
        const ci = globalThis.__e2e.starts.at(-1).ci;
        const image = await ci.screenshot();
        const canvas = globalThis.document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').putImageData(image, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      });
      const file = join(outDir, `${app.id.replaceAll('-', '')}-${second}s.png`);
      writeFileSync(file, Buffer.from(png, 'base64'));
      if (app.id === 'second-reality' && second === MOMENTS[app.id].at(-1)) {
        await page.screenshot({ path: join(outDir, 'doskit-page.png') });
      }
      console.log(file);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}
