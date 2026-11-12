import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import {
  findPageCollisions,
  readApps,
  renderAppPage,
  renderSitemap,
  urlIdOf,
} from './scripts/app-pages.ts';

const require = createRequire(import.meta.url);
const versionOf = (manifest: string) => (require(manifest) as { version: string }).version;

/**
 * Versions read from package.json when Vite starts, so release-please bumps and js-dos
 * upgrades reach the footer and index.html without hand edits. Code reads them from
 * import.meta.env and index.html uses %VITE_APP_VERSION%. vitest.config.ts applies them too.
 */
export const versionDefines = {
  'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionOf('./package.json')),
  'import.meta.env.VITE_JSDOS_VERSION': JSON.stringify(versionOf('js-dos/package.json')),
};

/**
 * GitHub Pages answers a path it has no file for with 404.html. As a copy of index.html it
 * boots the app for paths no page answers, such as /secondreality/ or /SecondReality, which
 * App then rewrites to the app's own page, /secondreality.
 */
export function githubPagesSpaFallback(): Plugin {
  return {
    name: 'doskit:github-pages-spa-fallback',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (index?.type !== 'asset') {
        this.error('index.html is missing from the build, so there is no page for 404.html');
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: index.source });
    },
  };
}

/**
 * A page per app, <id>.html at the site's root, which GitHub Pages serves at /<id> with a 200:
 * index.html with the app's title, description, share card, canonical URL and structured
 * data, and its text for crawlers (scripts/app-pages.ts). And the sitemap that lists them.
 * The build fails when an app's id would take a name the site already uses.
 */
export function appPages(appsDir = 'src/apps', publicDir = 'public'): Plugin {
  return {
    name: 'doskit:app-pages',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (index?.type !== 'asset') {
        this.error('index.html is missing from the build, so there is no page to copy');
      }
      const apps = readApps(appsDir);
      const rootNames = [
        ...readdirSync(publicDir),
        ...Object.keys(bundle).map((fileName) => fileName.split('/')[0] ?? fileName),
      ];
      const collisions = findPageCollisions(apps, rootNames);
      if (collisions.length > 0) {
        this.error(`App pages would take names the site uses: ${collisions.join('; ')}`);
      }
      for (const app of apps) {
        this.emitFile({
          type: 'asset',
          fileName: `${urlIdOf(app.id)}.html`,
          source: renderAppPage(String(index.source), app),
        });
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(apps) });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), githubPagesSpaFallback(), appPages()],
  define: versionDefines,

  // Custom domain deployment configuration
  // Using custom domain doskit.net, so base path is '/'
  base: '/',

  // Optimize for cross-platform compatibility
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: false,
    // No COOP/COEP headers: js-dos doesn't need cross-origin isolation, and
    // GitHub Pages can't send them, so dev matches production.
  },

  // Build configuration for production
  build: {
    // The oldest browsers README supports, the first with structuredClone(). The CSS
    // minifier writes for these too: for newer ones it drops the 100vh fallbacks before
    // 100dvh and rewrites max-width media queries in range syntax, which these ignore.
    // scripts/check-built-css.js checks the result in CI.
    target: ['chrome98', 'edge98', 'firefox94', 'opera84', 'safari15.4', 'ios15.4'],
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden', // Generate source maps but don't reference them in production bundles
    // The minifier drops the @license comments of the packages it bundles (React and the
    // rest), so their licenses go to a file that public/licenses/index.html links. It is
    // Markdown, named .txt so that every browser shows it rather than downloading it.
    license: { fileName: 'licenses/third-party-licenses.txt' },
    rolldownOptions: {
      output: {
        // React changes far less often than the app, so its own chunk keeps its name across
        // releases, and the service worker's install takes it from the previous release's
        // cache instead of downloading it again. A group also pulls in what its modules
        // import (scheduler).
        codeSplitting: {
          groups: [{ name: 'react-vendor', test: /node_modules[\\/]react(-dom)?[\\/]/ }],
        },
      },
    },
  },

  // Preview server configuration
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
});
