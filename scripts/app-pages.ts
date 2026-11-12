/**
 * A static page per app: the built index.html with its head rewritten for one app (title,
 * description, Open Graph and Twitter tags, canonical URL, JSON-LD), and the app's text in
 * #root, which React replaces when it boots. GitHub Pages serves <id>.html at /<id> with a
 * 200, so a shared link to a production unfurls with its own card, and crawlers that run no
 * scripts read its text.
 *
 * Every tag it rewrites must be in index.html exactly once: a tag that is renamed or
 * reformatted fails the build instead of leaving a page with the home page's metadata.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE = 'https://doskit.net';

/** What an app's page file, src/apps/<id>.page.json, says for visitors and crawlers */
export interface AppPageText {
  /** The meta description and the text of the share card: one or two sentences */
  description: string;
  /** Paragraphs about the production */
  about: string[];
  /** Where and when it was shown or released, and how it placed */
  released?: string;
  /** Who made it, by role */
  credits?: string;
  /** Its authors' terms, quoted or summed up */
  terms?: string;
  /** How DosKit's version differs from the original on real hardware */
  accuracy?: string[];
  /** Its pages elsewhere, such as pouet.net's and Demozoo's */
  links?: { label: string; url: string }[];
  /** The share card's alt text */
  imageAlt: string;
  /** Who the author is, for structured data: a group, or one person */
  authorType?: 'Organization' | 'Person';
}

/** An app as its page needs it: its data file's facts, and its page text */
export interface AppForPage {
  id: string;
  name: string;
  description: string;
  author?: string;
  year?: number;
  kind: string;
  flashing?: boolean;
  page: AppPageText;
}

/** The app's id as its URL carries it, without hyphens (src/config/apps.config.ts) */
export const urlIdOf = (id: string): string => id.replace(/-/g, '');

/** The title an app's page has: the one the app sets once it runs (src/utils/urlRouting.ts) */
export const pageTitleOf = (app: Pick<AppForPage, 'name'>): string => `${app.name} - DosKit`;

/** "Author, year", or whichever of the two an app gives */
const releaseOf = (app: AppForPage): string =>
  [app.author, app.year].filter((part) => part !== undefined).join(', ');

/**
 * Every app in a directory of data files, each with its page file where it has one, and
 * otherwise a page made of its data: the app writes /<id> as every app's URL, so an app
 * without a page would be a 404 to crawlers and to anyone reloading its link
 */
export function readApps(dir: string): AppForPage[] {
  const names = readdirSync(dir);
  return names
    .filter((name) => /^[^.]+\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')))
    .sort((a, b) => a.order - b.order)
    .map((data) => {
      const pageFile = `${data.id}.page.json`;
      const page: AppPageText = names.includes(pageFile)
        ? JSON.parse(readFileSync(join(dir, pageFile), 'utf8'))
        : {
            description: `${data.name}: ${data.description}. Runs from its original files in your browser.`,
            about: [`${data.name}, ${releaseOf(data)}. ${data.description}.`],
            imageAlt: `${data.name} running in DosKit`,
          };
      return { ...data, page };
    });
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Replace what must be there exactly once */
function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  const found = html.match(new RegExp(pattern.source, 'g'))?.length ?? 0;
  if (found !== 1) {
    throw new Error(`index.html has ${found} of ${what}, and an app page needs exactly one`);
  }
  return html.replace(pattern, () => replacement);
}

/** Set the content of the one <meta> with this name or property */
function setMeta(html: string, attribute: 'name' | 'property', key: string, content: string) {
  return replaceOnce(
    html,
    new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`),
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
    `<meta ${attribute}="${key}">`
  );
}

/** The JSON-LD of an app's page: the site as on the home page, the page, and the production */
export function appJsonLd(app: AppForPage): object {
  const url = `${SITE}/${urlIdOf(app.id)}`;
  const image = `${SITE}/cards/${urlIdOf(app.id)}.png`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'DosKit' },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: pageTitleOf(app),
        description: app.page.description,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${SITE}/#website` },
        mainEntity: { '@id': `${url}#work` },
        primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}#work`,
        name: app.name,
        url,
        description: app.description,
        applicationCategory:
          app.kind === 'tracker' ? 'MultimediaApplication' : 'EntertainmentApplication',
        operatingSystem: 'MS-DOS',
        ...(app.year ? { datePublished: String(app.year) } : {}),
        ...(app.author
          ? { author: { '@type': app.page.authorType ?? 'Organization', name: app.author } }
          : {}),
        image,
        isAccessibleForFree: true,
        ...(app.page.links?.length ? { sameAs: app.page.links.map((link) => link.url) } : {}),
      },
    ],
  };
}

/** What a crawler, or a visitor whose scripts have not run yet, finds in #root */
export function appStaticText(app: AppForPage): string {
  const lines = [
    '<div id="root">',
    '      <article style="max-width: 40rem; margin: 0 auto; padding: 2rem; line-height: 1.5">',
    `        <h1>${escapeHtml(app.name)}</h1>`,
    `        <p>${escapeHtml(releaseOf(app))}</p>`,
    ...app.page.about.map((text) => `        <p>${escapeHtml(text)}</p>`),
    ...(app.page.released ? [`        <p>${escapeHtml(app.page.released)}</p>`] : []),
    ...(app.flashing
      ? [
          '        <p>Contains flashing lights, which may affect people with photosensitive epilepsy.</p>',
        ]
      : []),
    `        <p><a href="/">DosKit: DOS demoscene classics and the trackers behind them</a></p>`,
    '      </article>',
    '    </div>',
  ];
  return lines.join('\n');
}

/**
 * The page of one app, from the built index.html
 * @param indexHtml - dist/index.html as Vite built it
 */
export function renderAppPage(indexHtml: string, app: AppForPage): string {
  const url = `${SITE}/${urlIdOf(app.id)}`;
  const title = pageTitleOf(app);
  const image = `${SITE}/cards/${urlIdOf(app.id)}.png`;
  const { description, imageAlt } = app.page;

  let html = indexHtml;
  html = replaceOnce(
    html,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
    '<title>'
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
    '<link rel="canonical">'
  );
  html = setMeta(html, 'name', 'title', title);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', imageAlt);
  html = setMeta(html, 'name', 'twitter:url', url);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:image:alt', imageAlt);
  html = replaceOnce(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(appJsonLd(app), null, 2).replace(/</g, '\\u003c')}\n    </script>`,
    'the JSON-LD <script>'
  );
  html = replaceOnce(html, /<div id="root"><\/div>/, appStaticText(app), '<div id="root"></div>');
  return html;
}

/**
 * sitemap.xml: the home page and every app page, by its canonical URL. No dates: a date
 * set by the build would change the site, and prompt every visitor to update, at every deploy.
 */
export function renderSitemap(apps: Pick<AppForPage, 'id'>[]): string {
  const urls = [`${SITE}/`, ...apps.map((app) => `${SITE}/${urlIdOf(app.id)}`)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`),
    '</urlset>',
    '',
  ].join('\n');
}

/** Names kept for the site's own pages and for files the build writes, present or not */
export const RESERVED = [
  'index',
  '404',
  'sitemap',
  'sw',
  'about',
  'library',
  'apps',
  'app',
  'play',
  'embed',
  'credits',
  'terms',
  'privacy',
  'help',
  'docs',
  'api',
  'demos',
  'intros',
  'trackers',
  'assets',
  'cards',
];

/**
 * What stops an app's page from having its name: GitHub Pages answers /x with x.html, then
 * the directory x/, then x.xml, so an app called "index", "licenses" or "sitemap" would
 * replace or hide one of the site's own. Names are compared by stem, whatever the extension.
 * @param rootNames - The names of the files and directories at the site's root
 */
export function findPageCollisions(apps: Pick<AppForPage, 'id'>[], rootNames: string[]): string[] {
  const taken = new Set([...rootNames.map((name) => name.replace(/\.[^.]*$/, '')), ...RESERVED]);
  const seen = new Map<string, string>();
  const collisions: string[] = [];
  for (const app of apps) {
    const urlId = urlIdOf(app.id);
    if (!/^[a-z0-9]+$/.test(urlId)) collisions.push(`${app.id}: "${urlId}" is not [a-z0-9]+`);
    if (taken.has(urlId)) collisions.push(`${app.id}: the site already serves /${urlId}`);
    if (seen.has(urlId)) collisions.push(`${app.id}: ${seen.get(urlId)} is /${urlId} too`);
    seen.set(urlId, app.id);
  }
  return collisions;
}
