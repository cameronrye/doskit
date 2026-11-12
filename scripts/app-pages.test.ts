// @vitest-environment node
// The static page the build writes for each app, and the sitemap that lists them
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  findPageCollisions,
  readApps,
  renderAppPage,
  renderSitemap,
  urlIdOf,
  type AppForPage,
} from './app-pages.ts';

/** The head and root of index.html as the page renderer finds them, each tag once */
const INDEX = `<!doctype html>
<html lang="en">
  <head>
    <title>DosKit - DOS demoscene classics in your browser</title>
    <link rel="canonical" href="https://doskit.net/" />
    <meta name="title" content="DosKit - DOS demoscene classics in your browser" />
    <meta name="description" content="Home page description" />
    <meta property="og:url" content="https://doskit.net/" />
    <meta property="og:title" content="DosKit" />
    <meta property="og:description" content="Home" />
    <meta property="og:image" content="https://doskit.net/og-image.png" />
    <meta property="og:image:alt" content="Home card" />
    <meta name="twitter:url" content="https://doskit.net/" />
    <meta name="twitter:title" content="DosKit" />
    <meta name="twitter:description" content="Home" />
    <meta name="twitter:image" content="https://doskit.net/og-image.png" />
    <meta name="twitter:image:alt" content="Home card" />
    <script type="application/ld+json">{"@graph": []}</script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const APP: AppForPage = {
  id: 'second-reality',
  name: 'Second Reality',
  description: "Future Crew's demo, first at Assembly '93",
  author: 'Future Crew',
  year: 1993,
  kind: 'demo',
  flashing: true,
  page: {
    description: "Watch Second Reality, the winner of Assembly '93, in your browser.",
    about: ['Second Reality is a demo by Future Crew <and friends>.'],
    imageAlt: 'The title picture of Second Reality',
    links: [{ label: 'pouet.net', url: 'https://www.pouet.net/prod.php?which=63' }],
  },
};

const metaOf = (html: string, key: string) =>
  html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];

describe('renderAppPage', () => {
  const page = renderAppPage(INDEX, APP);

  it("gives the page the app's title, the one the app sets as it runs", () => {
    expect(page).toContain('<title>Second Reality - DosKit</title>');
    expect(metaOf(page, 'title')).toBe('Second Reality - DosKit');
    expect(metaOf(page, 'og:title')).toBe('Second Reality - DosKit');
    expect(metaOf(page, 'twitter:title')).toBe('Second Reality - DosKit');
  });

  it('names its own URL as canonical, for its share card too', () => {
    expect(page).toContain('<link rel="canonical" href="https://doskit.net/secondreality" />');
    expect(metaOf(page, 'og:url')).toBe('https://doskit.net/secondreality');
    expect(metaOf(page, 'twitter:url')).toBe('https://doskit.net/secondreality');
  });

  it('gives the app its own description and share card', () => {
    expect(metaOf(page, 'description')).toBe(
      'Watch Second Reality, the winner of Assembly &#39;93, in your browser.'
    );
    expect(metaOf(page, 'og:image')).toBe('https://doskit.net/cards/secondreality.png');
    expect(metaOf(page, 'twitter:image')).toBe('https://doskit.net/cards/secondreality.png');
    expect(metaOf(page, 'og:image:alt')).toBe('The title picture of Second Reality');
  });

  it('describes the production in its structured data, with its other pages', () => {
    const json = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const graph = JSON.parse(json ?? '{}')['@graph'] as Record<string, unknown>[];
    const work = graph.find((node) => node['@type'] === 'SoftwareApplication');

    expect(work).toMatchObject({
      name: 'Second Reality',
      url: 'https://doskit.net/secondreality',
      operatingSystem: 'MS-DOS',
      datePublished: '1993',
      sameAs: ['https://www.pouet.net/prod.php?which=63'],
    });
  });

  it('puts its text in the page for crawlers that run no scripts, escaped', () => {
    expect(page).toContain('<h1>Second Reality</h1>');
    expect(page).toContain('Second Reality is a demo by Future Crew &lt;and friends&gt;.');
    expect(page).toMatch(/flashing lights/);
    expect(page).not.toContain('<div id="root"></div>');
  });

  it("fails the build when index.html lacks a tag it rewrites, rather than keep the home page's", () => {
    expect(() => renderAppPage(INDEX.replace(/<meta property="og:url"[^>]*>/, ''), APP)).toThrow(
      /og:url/
    );
  });
});

describe('renderSitemap', () => {
  it('lists the home page and every app page by its canonical URL, without dates', () => {
    const sitemap = renderSitemap([APP, { ...APP, id: 'stars' }]);

    expect([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1])).toEqual([
      'https://doskit.net/',
      'https://doskit.net/secondreality',
      'https://doskit.net/stars',
    ]);
    expect(sitemap).not.toContain('lastmod');
  });
});

describe('findPageCollisions', () => {
  it.each([
    ['index', 'the site already serves /index'],
    ['licenses', 'the site already serves /licenses'],
    ['sitemap', 'the site already serves /sitemap'],
    ['library', 'the site already serves /library'],
    ['star_wars', 'is not [a-z0-9]+'],
  ])('refuses an app called %s', (id, why) => {
    expect(findPageCollisions([{ ...APP, id }], ['index.html', 'licenses']).join()).toContain(why);
  });

  it('refuses two apps whose ids differ only by hyphens', () => {
    expect(
      findPageCollisions(
        [
          { ...APP, id: 'stars' },
          { ...APP, id: 'st-ars' },
        ],
        []
      )
    ).toEqual(['st-ars: stars is /stars too']);
  });
});

describe("DosKit's apps", () => {
  const apps = readApps('src/apps');

  it('each get a page, under a name the site has free', () => {
    expect(apps).toHaveLength(
      readdirSync('src/apps').filter((n) => /^[^.]+\.json$/.test(n)).length
    );
    expect(findPageCollisions(apps, readdirSync('public'))).toEqual([]);
  });

  it('each have page text of their own: what it is, its terms, and how faithful it runs', () => {
    for (const app of apps) {
      const file = JSON.parse(readFileSync(`src/apps/${app.id}.page.json`, 'utf8'));
      expect(file.description, app.id).toMatch(/\.$/);
      expect(file.about.length, app.id).toBeGreaterThan(0);
      expect(file.terms, app.id).toBeTruthy();
      expect(file.accuracy.length, app.id).toBeGreaterThan(0);
      expect(file.imageAlt, app.id).toMatch(/running in DosKit$/);
    }
  });

  it('each have a share card of their own, 1200x630', () => {
    for (const app of apps) {
      const card = readFileSync(`public/cards/${urlIdOf(app.id)}.png`);
      // The PNG header's width and height
      expect([card.readUInt32BE(16), card.readUInt32BE(20)]).toEqual([1200, 630]);
    }
  });
});
