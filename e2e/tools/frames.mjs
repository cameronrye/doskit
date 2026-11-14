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
  'mental-surgery': [15, 30, 60],
  verses: [35, 80],
  holistic: [30, 60, 90],
  heartquake: [15, 45, 90],
  // Its end picture, from about 190 s, shows two nude figures
  timeless: [45, 125],
  inconexia: [70, 100],
  pump: [28, 76, 106],
  // Not from 30 to 65 s or 130 to 170 s, where its pin-up is nude: 95 s is the wasp
  'stars-nooon': [90, 95, 100],
  'dx-project': [30, 60, 90],
  'untitled-dust': [10, 20, 60],
  dope: [20, 60, 90],
  solstice: [15, 45, 90],
  contrast: [15, 30],
  'slideshow-1': [6, 10],
  'machines-of-madness': [5, 30, 60],
  boost: [15, 45, 90],
  gr8: [5, 12, 25],
  yo: [5, 15, 30],
  fishtro: [10, 25, 60],
  'starport-bbstro-1': [5, 15, 40],
  'the-party-92-invite': [10, 20, 45],
  'assembly-93-invite': [8, 20],
  'bussimatkaintro-93': [5, 10],
  // Not 18 to 20 s, as it enters its main screen in a strip 68 pixels wide
  'assembly-94-preinvite': [30, 45],
  // Black for its first 12.5 s
  'assembly-94-invite': [20, 60, 90],
  soppa: [15, 33, 60],
  animate: [12, 27],
  drift: [20, 60],
  blind: [20, 50, 90],
  helium: [21, 40],
  'the-globe': [26, 70],
  'blastersound-2': [36, 90],
  kukoo2: [8, 25, 40],
  'journey-1': [8, 15],
  'journey-2': [8, 15],
  'chaotic-mind': [8, 15],
  'worldcharts-1': [5, 10],
  'composer-669': [5, 10],
  edlib: [6, 10],
  monotone: [3, 6, 10],
  'adlib-tracker-2': [20, 25],
  'fire-demo': [5, 30, 60],
  iris: [10, 30],
};

const apps = readdirSync('src/apps')
  .filter((name) => /^[^.]+\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(`src/apps/${name}`, 'utf8')))
  .filter((app) => ids.length === 0 || ids.includes(app.id));

mkdirSync(outDir, { recursive: true });
// PORT lets two of these run at once
const site = await startServer({ port: Number(process.env.PORT ?? 4464) });
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
