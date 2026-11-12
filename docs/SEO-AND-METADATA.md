# SEO and Metadata Implementation Guide

This document describes the comprehensive SEO, metadata, and web standards implementation for DosKit.

## Overview

DosKit now includes a complete suite of web metadata, SEO optimizations, and discovery files to ensure maximum visibility and proper representation across search engines, social media platforms, and AI/LLM crawlers.

## Implemented Features

### 1. Social Media Meta Tags

#### Open Graph (Facebook, LinkedIn, etc.)

- `og:type` - Website type
- `og:url` - Canonical URL (https://doskit.net/, and each app's own on its page)
- `og:site_name` - Site name
- `og:title` - Page title
- `og:description` - Detailed description
- `og:image` - Social preview image (1200x630px PNG)
- `og:image:width` - Image width
- `og:image:height` - Image height
- `og:image:alt` - Image alt text
- `og:locale` - Language locale

#### Twitter Cards

- `twitter:card` - Card type (summary_large_image)
- `twitter:url` - Canonical URL
- `twitter:title` - Page title
- `twitter:description` - Detailed description
- `twitter:image` - Social preview image
- `twitter:image:alt` - Image alt text
- `twitter:creator` - Creator handle (@cameronrye)
- `twitter:site` - Site handle (@cameronrye)

### 2. Social Media Images

#### Generated Images

- **Open Graph Image**: `og-image.png` (1200x630px)
  - Optimized for Facebook, LinkedIn, and other OG-compatible platforms
  - Features terminal interface with DosKit branding
  - High-quality PNG with proper compression

- **GitHub Social Preview**: `github-social.png` (1280x640px)
  - Optimized for GitHub repository social preview
  - Includes additional context and branding
  - Proper dimensions for GitHub's requirements

- **Share Cards**: `cards/<id>.png` (1200x630px), one per app, with the id's hyphens removed
  - A frame of the production running, with its name, author and year
  - The card of the app's page (see [App Pages](#app-pages)); the home page keeps `og-image.png`

#### Image Generation Process

1. SVG source files created in `/public/`:
   - `social-preview.svg` (1200x630 viewBox)
   - `github-social-preview.svg` (1280x640 viewBox)

2. Conversion using Sharp:
   - Script: `scripts/generate-social-images.js`
   - Converts SVG to high-quality PNG
   - Writes `og-image.png` and `github-social.png` into `public/`
   - Run by hand after editing an SVG: `npm run generate-social-images`

3. Build Integration:
   - The build does not regenerate the images: the PNGs only change when an SVG does, and their bytes depend on the local Sharp build, so they are committed
   - Vite copies them from `public/` into `dist/` like any other static file

The share cards are made the same way, by hand, and committed: `npm run generate-app-cards` (`scripts/generate-app-cards.js`) draws each one from a frame of the app running, `cards-src/<id>.png` at the emulator's own resolution, and the name, author and year in the app's data file, `src/apps/<id>.json`, and writes `public/cards/<id>.png`. Its text is drawn with the machine's fonts, and the frames need a browser and the emulator: `e2e/tools/frames.mjs` captures them from the production build. Run it after changing a frame or an app's name, author or year.

### 3. SEO and Structured Data

#### Sitemap.xml

Location: `dist/sitemap.xml`, which the build writes (`renderSitemap` in `scripts/app-pages.ts`, through the `appPages` plugin in `vite.config.ts`); there is no `public/sitemap.xml`

Includes:

- Main page, https://doskit.net/
- Every app's page, by its canonical URL, in the selector's order, such as https://doskit.net/secondreality

It has no `lastmod`, `priority` or `changefreq`. Google ignores `priority` and `changefreq`, and uses `lastmod` only while it stays consistently accurate, which a date the build set at every deploy would not be.

It lists only pages on doskit.net that exist: the documentation is not deployed with the site, and a sitemap may only list URLs on its own host.

#### App Pages

Each app has a page of its own at `/<id>`, its id with the hyphens dropped, such as https://doskit.net/secondreality. The build writes it as `dist/<id>.html` from the built `index.html` (`renderAppPage` in `scripts/app-pages.ts`), and GitHub Pages serves it at `/<id>` with a 200. It differs from the home page in:

- `<title>`, `title`, `og:title` and `twitter:title`: `<App name> - DosKit`, the title the app sets once it runs
- `description`, `og:description` and `twitter:description`: the description in the app's page file, `src/apps/<id>.page.json`
- The canonical link, `og:url` and `twitter:url`: `https://doskit.net/<id>`
- `og:image` and `twitter:image`: its share card, `https://doskit.net/cards/<id>.png` (1200x630), with the page file's `imageAlt` as `og:image:alt` and `twitter:image:alt`
- The JSON-LD: the WebSite, a WebPage for the app's page, and the production as a SoftwareApplication, with `operatingSystem` MS-DOS, its author and year from its data file, its card, and its pages elsewhere as `sameAs`
- `#root`, which holds the app's name, author and year, its page file's `about` and `released` text, and its flashing warning where it has one, for crawlers that run no scripts; React replaces it when it boots

Every tag the build rewrites must be in `index.html` exactly once: a tag that is renamed or reformatted fails the build rather than leave a page with the home page's metadata. The build also fails when an app's id would take a name the site already uses (`findPageCollisions`): a file or directory at the site's root, such as `index` or `licenses`, a name kept for the site's own pages, such as `about` or `cards`, or another app's id without its hyphens.

The app writes `/<id>` as each app's URL, and rewrites the other forms it accepts, an old `/?app=secondreality` link or another spelling such as `?app=Second-Reality`, to it without adding a history entry. It also sets the canonical link to the URL it shows, since picking another app in the selector changes the URL without loading that app's page. Share and list app pages in the `/<id>` form:

- A `/?app=` link is answered with the home page's `index.html`, so a crawler that does not run JavaScript, such as a social media preview, sees the home page's title, description, `og:url` and image there.
- GitHub Pages has no file for a path with a trailing slash or capitals, such as `/secondreality/` or `/SecondReality`, so it answers with `404.html` (the build's copy of `index.html`) and HTTP status 404. The app still opens, but crawlers treat the URL as missing.

#### JSON-LD Structured Data

Location: `index.html` (in `<head>`); each app's page has its own instead (see [App Pages](#app-pages))

Implements Schema.org types:

- **WebSite**: Site-level information
- **SoftwareApplication**: Application details, version and features
- **Person**: Author/developer information
- **WebPage**: Page-specific metadata
- **ImageObject**: Primary image information

`softwareVersion` is `%VITE_APP_VERSION%` in `index.html`; the build replaces it with the version in `package.json`, so a release needs no edit here.

There is no `aggregateRating`: the five-star rating the markup once carried came from no real reviews. Google only shows its software app rich result for markup with an `aggregateRating` or a `review`, so DosKit's markup describes the site without earning that result. Add a rating only once real reviews exist.

Benefits:

- Enhanced search engine understanding
- Better indexing of application features
- Improved knowledge graph representation

### 4. LLM Discovery Files

#### llms.txt

Location: `/public/llms.txt`

Concise project summary for AI crawlers including:

- Project overview
- Key features
- Technology stack
- Project structure
- Usage instructions
- Development commands
- License and links
- Browser compatibility

#### llms-full.txt

Location: `/public/llms-full.txt`

Comprehensive documentation for AI crawlers including:

- Complete table of contents
- Detailed feature descriptions
- Architecture overview
- Full project structure
- Installation and setup
- Configuration options
- API documentation
- Development workflow
- Deployment guide
- Browser compatibility matrix
- Troubleshooting guide
- Contributing guidelines
- Contact information

The llms.txt proposal (see Resources) puts its file at `/llms.txt`, which is where DosKit's summary is, so tools that look for the proposal's file find it; the full documentation is `/llms-full.txt`, next to it. `/llm.txt` and `/llm-full.txt`, the names the two files had before, are short files that point to them.

### 5. Standard Web Files

#### robots.txt

Location: `/public/robots.txt`

Features:

- Allow all crawlers by default
- Disallow source maps (`/*.map$`) for every crawler; the JS and CSS in `/assets/` stay crawlable, since crawlers need them to render the app
- Explicit allow rules for AI/LLM crawlers, a group for each token its vendor documents:
  - OpenAI: GPTBot, OAI-SearchBot and ChatGPT-User
  - Common Crawl: CCBot
  - Anthropic: ClaudeBot, Claude-SearchBot and Claude-User
  - Google: Google-Extended
  - Perplexity: PerplexityBot and Perplexity-User
- Sitemap location

A comment above each vendor's groups gives the address of the vendor's page on its crawlers. Anthropic's older tokens, `anthropic-ai` and `Claude-Web`, have no group: Anthropic told 404 Media in July 2024 that they are no longer in use, and its page names neither. Every AI/LLM group allows what the `*` group does, so naming them changes no crawler's access.

A crawler obeys only the group that names it, or the `*` group when none does, so every group repeats `Disallow: /*.map$`, the AI/LLM crawlers' included. `scripts/robots-txt.test.js` groups the file's lines as RFC 9309 does. It fails for a group without that rule or one that does not allow `/`, for a token on its list without a group or a group for a token not on it, and for `anthropic-ai` or `Claude-Web` in any letter case.

#### humans.txt

Location: `/public/humans.txt`

Includes:

- Team information (developer, contact, social links)
- Acknowledgments (the js-dos, DOSBox, React and Vite teams, and the authors of the productions DosKit runs)
- Technology colophon (the tools DosKit is built with, named without versions)
- Project information (license, repository, website, the year it started and the date of its last update)
- Site details (standards, accessibility, SEO)
- Feature list
- Browser support
- Contact information
- ASCII art logo

### 6. Well-Known URIs

#### .well-known/security.txt

Location: `/public/.well-known/security.txt`

Follows RFC 9116 standard:

- Contact information (email, the reporting channel `SECURITY.md` documents)
- Expiration date, kept less than a year ahead as RFC 9116 recommends
- Preferred languages
- Canonical URL
- Security policy link (`SECURITY.md`)
- Acknowledgments link (the repository's published security advisories, which credit reporters)

DosKit has no user accounts, so it serves no `.well-known/change-password`: that URL is meant to redirect to a site's page for changing a password.

## File Locations

### Source Files

```
public/
├── .well-known/
│   └── security.txt
├── cards/<id>.png (generated from cards-src/<id>.png)
├── social-preview.svg
├── github-social-preview.svg
├── og-image.png (generated)
├── github-social.png (generated)
├── robots.txt
├── humans.txt
├── llms.txt
├── llms-full.txt
├── llm.txt (points to llms.txt)
└── llm-full.txt (points to llms-full.txt)

src/apps/
├── <id>.json (an app's data: its name, author, year, kind and the rest)
└── <id>.page.json (its page text: description, about, terms, accuracy notes, links, imageAlt)
```

### Build Output

Vite copies every file in `public/` into `dist/` as it is. The build also writes a page per app, `dist/<id>.html`, and `dist/sitemap.xml` (see [App Pages](#app-pages)); `dist/404.html`, a copy of the built `index.html` that GitHub Pages serves for the paths no page answers; and `dist/licenses/third-party-licenses.txt`, the licenses of the packages bundled into the app, which the licenses page links.

## Build Process

### Scripts

1. **Generate Social Images**

   ```bash
   npm run generate-social-images
   ```

   Converts SVG source files to PNG images. Run it by hand after editing an SVG; the build does not run it.

2. **Generate Share Cards**

   ```bash
   npm run generate-app-cards
   ```

   Draws each app's share card from its frame in `cards-src/`. Run it by hand after changing a frame or an app's name, author or year; the build does not run it.

3. **Build**
   ```bash
   npm run build
   ```
   Full build process:
   - Copy js-dos into `public/` (the `prebuild` script)
   - TypeScript compilation
   - Vite production build, with a page per app and the sitemap
   - Service worker version injection

### Automated Steps

1. `copy-js-dos.js` copies the js-dos player and emulator files from `node_modules/js-dos` into `public/` (the copies are gitignored)
2. `tsc -b` type-checks the project
3. Vite builds the app and copies `public/` into `dist/`, replacing `%VITE_APP_VERSION%` in `index.html` with the version in `package.json` and writing the app pages, `dist/sitemap.xml`, `dist/404.html` and `dist/licenses/third-party-licenses.txt`
4. `inject-sw-version.js` gives the service worker its cache version, a hash of the site the build made but for the app pages and the sitemap, which the worker never stores, so only a deploy that changes the rest of the site or the worker installs a new worker; the list of bundles to precache; the js-dos version, which names its emulator cache; and each demo archive's version, a hash of its bytes, under which its demo cache keeps the archive

## Validation

### Testing Social Media Previews

1. **Facebook/Open Graph**
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Enter URL: https://doskit.net/
   - Check image preview and metadata

2. **X (Twitter) Cards**
   - X removed the preview from its Card Validator
   - Paste https://doskit.net/ into a new post on X instead, then discard the post
   - Verify card preview

3. **LinkedIn**
   - Use LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Enter URL: https://doskit.net/
   - Check preview

Check an app's page too, such as https://doskit.net/secondreality, whose preview shows the production's own card and description. In the repository, `e2e/pages.spec.ts` checks each page of the built site for its 200 status, title, canonical link and card, and the sitemap for every page (see [CONTRIBUTING.md](../CONTRIBUTING.md#browser-tests)).

### Testing Structured Data

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Enter URL: https://doskit.net/
   - Verify structured data is valid
   - Expect it to flag the SoftwareApplication for having no `aggregateRating` or `review` (see JSON-LD Structured Data)

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Enter URL: https://doskit.net/
   - Check for errors

### Testing SEO

1. **Google Search Console**
   - Submit sitemap: https://doskit.net/sitemap.xml
   - Monitor indexing status
   - Check for errors

2. **Bing Webmaster Tools**
   - Submit sitemap
   - Monitor crawl stats

## Maintenance

### Updating Social Images

1. Edit SVG source files in `/public/`:
   - `social-preview.svg`
   - `github-social-preview.svg`

2. Run image generation (the build does not):

   ```bash
   npm run generate-social-images
   ```

3. Commit both SVG and generated PNG files

### Updating Metadata

1. **index.html**: Update meta tags as needed; the build fills in the JSON-LD's `softwareVersion`
2. **sitemap.xml**: Nothing to update by hand: the build writes it from the app data files in `src/apps/`, so an app is listed once its data file is there
3. **App pages**: Edit an app's page file, `src/apps/<id>.page.json`, for its description, text and card's alt text, and its data file for its name, author and year; the build writes the page from both. `scripts/app-pages.test.ts` fails for an app without a page file, a description that does not end its sentence, or a share card that is not 1200x630
4. **llms.txt / llms-full.txt**: Update when features or documentation changes; `llm.txt` and `llm-full.txt` only point to them. The application lists in `llms-full.txt` and `README.md` are written by `npm run generate-app-lists`, and a test fails while one is out of date
5. **humans.txt**: Update when the team, the tools or the bundled productions change, and set its "Last update" date by hand when you do. It names no versions of DosKit or of its tools, so releases and upgrades need no edit there. Its browser list is written by hand too: keep it to the minimums in the README's [Browser Compatibility](../README.md#browser-compatibility).
6. **.well-known/security.txt**: Renew `Expires` before it passes, keeping it less than a year ahead

## Best Practices

1. **Images**
   - Keep SVG sources in version control
   - Regenerate PNGs after SVG changes
   - Optimize for file size while maintaining quality
   - Use descriptive alt text

2. **Metadata**
   - Keep descriptions concise but informative
   - Update dates when content changes
   - Maintain consistency across platforms
   - Test previews before deployment

3. **Structured Data**
   - Validate after changes
   - Leave `softwareVersion` as `%VITE_APP_VERSION%`: the build fills it in from `package.json`
   - Only add ratings or reviews that real users left
   - Ensure URLs are absolute
   - Use proper Schema.org types

4. **Discovery Files**
   - Keep llms.txt concise (< 3KB)
   - Make llms-full.txt comprehensive
   - Update when features change
   - Include relevant keywords

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [X Cards Markup](https://web.archive.org/web/20231229075931/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup) (an archived copy: X's own Cards pages now redirect to a general overview)
- [Schema.org](https://schema.org/)
- [robots.txt Specification](https://www.robotstxt.org/)
- [humans.txt](https://humanstxt.org/)
- [llms.txt Proposal](https://llmstxt.org/)
- [RFC 9116 - security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)
- [Well-Known URIs](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml)

## Troubleshooting

### Images Not Showing in Social Previews

1. Check image URLs are absolute (https://doskit.net/og-image.png)
2. Verify images are accessible (not blocked by robots.txt)
3. Clear social media cache (use debugging tools)
4. Check image dimensions (1200x630 for OG)
5. Verify Content-Type header (image/png)

### Structured Data Errors

1. Validate JSON-LD syntax
2. Check for required properties
3. Ensure URLs are absolute
4. Verify Schema.org types are correct
5. Test with Google Rich Results Test

### Sitemap Not Being Crawled

1. Submit to Google Search Console
2. Check robots.txt allows crawling
3. Verify sitemap URL in robots.txt
4. Ensure XML is valid
5. Check for 404 errors

### App Pages Reported as Not Found

1. Check the URL's form: an app's page is its id in lowercase, without hyphens or a trailing slash, such as https://doskit.net/secondreality. GitHub Pages serves `/secondreality/` and `/SecondReality` with `404.html` and HTTP status 404, and `/?app=secondreality` with the home page
2. Link to and list that form, which the sitemap lists too (see [App Pages](#app-pages))
3. Check that the build wrote the page: `dist/<id>.html`, one for each data file in `src/apps/`

## Future Enhancements

Potential additions:

- Multi-language support (hreflang tags)
- Additional structured data types (FAQPage, HowTo), though Google has deprecated HowTo rich results and shows FAQ ones mainly for government and health sites
- Video structured data (if video content added)
- Breadcrumb structured data
- Organization structured data
- Additional well-known URIs as needed
- RSS/Atom feed for updates

---

Last updated: 2026-11-11
