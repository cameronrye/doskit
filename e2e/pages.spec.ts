/// <reference lib="dom" />
/**
 * Each production's page, as GitHub Pages serves the build (e2e/server.mjs answers paths
 * the way doskit.net does): its own status, title and share card, and old links brought to
 * the one URL form.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const apps: { id: string; name: string; order: number }[] = readdirSync('src/apps')
  .filter((name) => /^[^.]+\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(`src/apps/${name}`, 'utf8')))
  .sort((a, b) => a.order - b.order);

const urlIdOf = (id: string) => id.replaceAll('-', '');

for (const app of apps) {
  test(`${app.name} has a page of its own, with its own share card`, async ({ request }) => {
    const page = await request.get(`/${urlIdOf(app.id)}`, { maxRedirects: 0 });

    expect(page.status()).toBe(200);
    const html = await page.text();
    expect(html).toContain(`<title>${app.name} - DosKit</title>`);
    expect(html).toContain(`<link rel="canonical" href="https://doskit.net/${urlIdOf(app.id)}" />`);
    const card = html.match(
      /<meta property="og:image" content="https:\/\/doskit\.net([^"]+)"/
    )?.[1];
    expect(card).toBe(`/cards/${urlIdOf(app.id)}.png`);
    const image = await request.get(card!);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');
  });
}

test('the sitemap lists the start page and every production, at their pages', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>https:\/\/doskit\.net([^<]*)<\/loc>/g)].map((m) => m[1]);

  expect(urls).toEqual(['/', ...apps.map((app) => `/${urlIdOf(app.id)}`)]);
  for (const url of urls) {
    expect((await request.get(url!, { maxRedirects: 0 })).status()).toBe(200);
  }
});

test('an old /?app= link opens the production at its page, without a new history entry', async ({
  page,
}) => {
  // The history as the page starts, before the app can push or replace anything
  await page.addInitScript(() => {
    (globalThis as { startLength?: number }).startLength = history.length;
  });
  await page.goto('/?app=secondreality&ref=blog');

  await expect(page).toHaveURL(/\/secondreality\?ref=blog$/);
  await expect(page).toHaveTitle('Second Reality - DosKit');
  const [start, now] = await page.evaluate(() => [
    (globalThis as { startLength?: number }).startLength,
    history.length,
  ]);
  expect(now).toBe(start);
});

test('a page with a trailing slash or capitals still opens its production', async ({ page }) => {
  // GitHub Pages answers these with 404.html, a copy of the app
  const response = await page.goto('/SecondReality/');

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/secondreality$/);
  await expect(page).toHaveTitle('Second Reality - DosKit');
});
