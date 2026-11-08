import { createRequire } from 'node:module';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
 * boots the app for path-style deep links (/secondreality), which App then rewrites to
 * /?app=secondreality.
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), githubPagesSpaFallback()],
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
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden', // Generate source maps but don't reference them in production bundles
    rolldownOptions: {
      output: {
        // React changes far less often than the app, so its own chunk stays cached across
        // releases. A group also pulls in what its modules import (scheduler).
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
