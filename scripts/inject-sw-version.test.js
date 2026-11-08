import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  extractBundledAssets,
  findMissingFiles,
  injectIntoServiceWorker,
  precachedPaths,
} from './inject-sw-version.js';

const serviceWorker = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../public/sw.js'),
  'utf8'
);

const BUILT_INDEX_HTML = `
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/js-dos.css" />
  <script src="/js-dos.js"></script>
  <script type="module" crossorigin src="/assets/index-abc123.js"></script>
  <link rel="modulepreload" crossorigin href="/assets/react-vendor-def456.js">
  <link rel="stylesheet" crossorigin href="/assets/index-789xyz.css">
  <link rel="modulepreload" crossorigin href="/assets/react-vendor-def456.js">
`;

// Runs the worker's top level and returns the events it listens for
function evaluate(source) {
  const listeners = [];
  vm.runInNewContext(source, {
    self: {
      location: new URL('https://doskit.net/sw.js'),
      addEventListener: (type) => listeners.push(type),
    },
    URL,
    console: { log() {} },
  });
  return listeners;
}

describe('extractBundledAssets', () => {
  it('returns each bundle under /assets/ once, sorted', () => {
    expect(extractBundledAssets(BUILT_INDEX_HTML)).toEqual([
      '/assets/index-789xyz.css',
      '/assets/index-abc123.js',
      '/assets/react-vendor-def456.js',
    ]);
  });
});

describe('injectIntoServiceWorker', () => {
  const assets = ['/assets/index-abc123.js', '/assets/index-789xyz.css'];

  it('stamps the version and precaches the bundles', () => {
    const result = injectIntoServiceWorker(serviceWorker, { version: 'v1a2b3c4d', assets });

    expect(result).toContain("const CACHE_VERSION = 'v1a2b3c4d';");
    expect(precachedPaths(result)).toEqual(
      expect.arrayContaining(['/', '/index.html', '/js-dos.js', ...assets])
    );
  });

  it('produces a worker that still loads', () => {
    const result = injectIntoServiceWorker(serviceWorker, { version: 'v1a2b3c4d', assets });

    expect(evaluate(result)).toEqual(['install', 'activate', 'fetch', 'message']);
  });

  it('fails when the version placeholder is missing', () => {
    const source = serviceWorker.replace(
      "const CACHE_VERSION = 'v1';",
      "const CACHE_VERSION = 'v2';"
    );

    expect(() => injectIntoServiceWorker(source, { version: 'v1a2b3c4d', assets })).toThrow(
      /CACHE_VERSION/
    );
  });

  it('fails when there is no STATIC_ASSETS list to extend', () => {
    const source = serviceWorker.replace('const STATIC_ASSETS', 'const APP_SHELL');

    expect(() => injectIntoServiceWorker(source, { version: 'v1a2b3c4d', assets })).toThrow(
      /STATIC_ASSETS/
    );
  });

  it('fails when the build produced no bundles', () => {
    expect(() => injectIntoServiceWorker(serviceWorker, { version: 'v1', assets: [] })).toThrow(
      /no bundles/
    );
  });
});

describe('precachedPaths', () => {
  it('lists the app shell and the default DOSBox backend, but not DOSBox-X', () => {
    const paths = precachedPaths(serviceWorker);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/',
        '/index.html',
        '/manifest.json',
        '/js-dos.js',
        '/js-dos.css',
        '/emulators/emulators.js',
        '/emulators/wdosbox.js',
        '/emulators/wdosbox.wasm',
        '/emulators/wlibzip.js',
        '/emulators/wlibzip.wasm',
      ])
    );
    expect(paths.filter((path) => path.includes('wdosbox-x'))).toEqual([]);
  });
});

describe('findMissingFiles', () => {
  let dist;

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'inject-sw-version-'));
    for (const file of ['index.html', 'js-dos.js', 'emulators/wdosbox.wasm']) {
      mkdirSync(dirname(join(dist, file)), { recursive: true });
      writeFileSync(join(dist, file), '');
    }
  });

  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('reports precached paths that are not in dist/', () => {
    const paths = ['/', '/index.html', '/js-dos.js', '/js-dos.css', '/emulators/wdosbox.wasm'];

    expect(findMissingFiles(paths, dist)).toEqual(['/js-dos.css']);
  });
});
