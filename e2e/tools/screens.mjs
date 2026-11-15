/**
 * Developer tool, not a test: screenshots pages at the sizes the design is checked at.
 *
 *   node e2e/tools/screens.mjs <baseUrl> <outDir> [path ...]
 *
 * Paths default to / and /secondreality. Each is captured at 1440x900, 390x844 and 844x390,
 * and with forced colours at 1440x900, as <path-slug>-<w>x<h>[-forced].png.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const [baseUrl, outDir, ...rest] = process.argv.slice(2);
if (!baseUrl || !outDir) {
  console.error('usage: node e2e/tools/screens.mjs <baseUrl> <outDir> [path ...]');
  process.exit(1);
}
const paths = rest.length ? rest : ['/', '/secondreality'];
const shots = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 900, forced: true },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const path of paths) {
    const slug = path.replace(/^\/+|\/+$/g, '').replace(/[^\w-]+/g, '-') || 'home';
    for (const { width, height, forced } of shots) {
      const context = await browser.newContext({
        viewport: { width, height },
        ...(forced && { forcedColors: 'active' }),
      });
      const page = await context.newPage();
      await page.goto(new URL(path, baseUrl).href, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const file = join(outDir, `${slug}-${width}x${height}${forced ? '-forced' : ''}.png`);
      await page.screenshot({ path: file });
      console.log(file);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
