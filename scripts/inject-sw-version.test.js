import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  collectBundledAssets,
  extractBundledAssets,
  findMissingFiles,
  hashDemoArchives,
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

/** A build output directory holding the given files, by path and contents */
function createDist(files) {
  const dist = mkdtempSync(join(tmpdir(), 'inject-sw-version-'));
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), contents);
  }
  return dist;
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

describe('collectBundledAssets', () => {
  let dist;

  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('lists every JS and CSS file in dist/assets, lazily imported chunks too', () => {
    // An app opened offline imports its config chunk, which index.html does not name
    dist = createDist({
      'index.html': BUILT_INDEX_HTML,
      'assets/index-abc123.js': '',
      'assets/index-abc123.js.map': '',
      'assets/index-789xyz.css': '',
      'assets/react-vendor-def456.js': '',
      'assets/react-vendor-def456.js.map': '',
      'assets/stars.config-jFmm8M_d.js': '',
      'assets/stars.config-jFmm8M_d.js.map': '',
      'assets/dosboxConfigBuilder-D22AmzC0.js': '',
      'assets/dosboxConfigBuilder-D22AmzC0.js.map': '',
    });

    expect(collectBundledAssets(dist)).toEqual([
      '/assets/dosboxConfigBuilder-D22AmzC0.js',
      '/assets/index-789xyz.css',
      '/assets/index-abc123.js',
      '/assets/react-vendor-def456.js',
      '/assets/stars.config-jFmm8M_d.js',
    ]);
  });

  it('keeps what index.html references under /assets/, so a missing bundle fails the build', () => {
    dist = createDist({ 'index.html': BUILT_INDEX_HTML, 'assets/index-abc123.js': '' });

    const assets = collectBundledAssets(dist);

    expect(assets).toEqual([
      '/assets/index-789xyz.css',
      '/assets/index-abc123.js',
      '/assets/react-vendor-def456.js',
    ]);
    expect(findMissingFiles(assets, dist)).toEqual([
      '/assets/index-789xyz.css',
      '/assets/react-vendor-def456.js',
    ]);
  });
});

describe('injectIntoServiceWorker', () => {
  const assets = ['/assets/index-abc123.js', '/assets/index-789xyz.css'];
  const build = { version: 'v1a2b3c4d', jsDosVersion: '8.3.20', demosHash: '0123456789ab', assets };

  it('stamps the version and precaches the bundles', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(result).toContain("const CACHE_VERSION = 'v1a2b3c4d';");
    expect(precachedPaths(result)).toEqual(
      expect.arrayContaining(['/', '/index.html', '/js-dos.js', ...assets])
    );
  });

  it('stamps the js-dos version, which names the emulator cache', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(result).toContain("const JS_DOS_VERSION = '8.3.20';");
  });

  it('stamps the hash of the demo archives, which names the demo cache', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(result).toContain("const DEMOS_HASH = '0123456789ab';");
  });

  it('produces a worker that still loads', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(evaluate(result)).toEqual(['install', 'activate', 'fetch', 'message']);
  });

  it('fails when the version placeholder is missing', () => {
    const source = serviceWorker.replace(
      "const CACHE_VERSION = 'v1';",
      "const CACHE_VERSION = 'v2';"
    );

    expect(() => injectIntoServiceWorker(source, build)).toThrow(/CACHE_VERSION/);
  });

  it('fails when the js-dos version placeholder is missing', () => {
    const source = serviceWorker.replace(
      "const JS_DOS_VERSION = 'dev';",
      "const JS_DOS_VERSION = '8.3.20';"
    );

    expect(() => injectIntoServiceWorker(source, build)).toThrow(/JS_DOS_VERSION/);
  });

  it.each([undefined, '', "8.3.20'; importScripts('https://example.com/x.js'); '"])(
    'fails on the js-dos version %j',
    (jsDosVersion) => {
      expect(() => injectIntoServiceWorker(serviceWorker, { ...build, jsDosVersion })).toThrow(
        /js-dos version/
      );
    }
  );

  it('fails when the demo archive hash placeholder is missing', () => {
    const source = serviceWorker.replace(
      "const DEMOS_HASH = 'dev';",
      "const DEMOS_HASH = '0123456789ab';"
    );

    expect(() => injectIntoServiceWorker(source, build)).toThrow(/DEMOS_HASH/);
  });

  it.each([undefined, '', "0a'; importScripts('https://example.com/x.js'); '"])(
    'fails on the demo archive hash %j',
    (demosHash) => {
      expect(() => injectIntoServiceWorker(serviceWorker, { ...build, demosHash })).toThrow(
        /demo archive hash/
      );
    }
  );

  it('fails when there is no STATIC_ASSETS list to extend', () => {
    const source = serviceWorker.replace('const STATIC_ASSETS', 'const APP_SHELL');

    expect(() => injectIntoServiceWorker(source, build)).toThrow(/STATIC_ASSETS/);
  });

  it('fails when the build produced no bundles', () => {
    expect(() => injectIntoServiceWorker(serviceWorker, { ...build, assets: [] })).toThrow(
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

describe('hashDemoArchives', () => {
  const dists = [];
  const ARCHIVES = { 'panic.zip': 'PK panic', 'stars.zip': 'PK stars' };

  /** The hash of a dist/demos holding these files */
  function hashOf(files) {
    const dist = createDist(
      Object.fromEntries(Object.entries(files).map(([name, bytes]) => [`demos/${name}`, bytes]))
    );
    dists.push(dist);
    return hashDemoArchives(dist);
  }

  afterEach(() => {
    for (const dist of dists.splice(0)) {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it('is a short hex digest that the same archives always give', () => {
    expect(hashOf(ARCHIVES)).toMatch(/^[0-9a-f]{12}$/);
    expect(hashOf({ 'stars.zip': 'PK stars', 'panic.zip': 'PK panic' })).toBe(hashOf(ARCHIVES));
  });

  it('leaves out files other than .zip archives', () => {
    expect(hashOf({ ...ARCHIVES, 'README.md': '# Demos' })).toBe(hashOf(ARCHIVES));
  });

  it.each([
    ['an archive changes', { ...ARCHIVES, 'stars.zip': 'PK stars 2' }],
    ['an archive is renamed', { 'panic.zip': 'PK panic', 'starz.zip': 'PK stars' }],
    ['an archive is added', { ...ARCHIVES, 'unreal.zip': 'PK unreal' }],
    ['an archive is removed', { 'stars.zip': 'PK stars' }],
    // Hashed one after the other, names and bytes alone would read the same
    ['one archive holds what reads as the next', { 'panic.zip': 'PK panicstars.zip\0PK stars' }],
  ])('changes when %s', (_, archives) => {
    expect(hashOf(archives)).not.toBe(hashOf(ARCHIVES));
  });

  it('fails when dist/demos has no archives', () => {
    expect(() => hashOf({ 'README.md': '# Demos' })).toThrow(/no \.zip archives/);
  });
});
