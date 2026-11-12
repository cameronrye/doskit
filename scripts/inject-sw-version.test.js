import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  collectBundledAssets,
  extractBundledAssets,
  findMissingFiles,
  injectIntoServiceWorker,
  precachedPaths,
  versionDemoArchives,
} from './inject-sw-version.js';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const serviceWorker = readFileSync(join(SCRIPTS, '../public/sw.js'), 'utf8');

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
  const demoVersions = { '/demos/panic.zip': '0123456789ab', '/demos/stars.zip': 'ba9876543210' };
  const build = { version: 'v1a2b3c4d', jsDosVersion: '8.3.20', demoVersions, assets };

  it('stamps the version and precaches the bundles', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(result).toContain("const CACHE_VERSION = 'v1a2b3c4d';");
    expect(precachedPaths(result)).toEqual(expect.arrayContaining(['/', '/js-dos.js', ...assets]));
  });

  it('stamps the js-dos version, which names the emulator cache', () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(result).toContain("const JS_DOS_VERSION = '8.3.20';");
  });

  it("stamps each demo archive's version, under which the demo cache keeps it", () => {
    const result = injectIntoServiceWorker(serviceWorker, build);

    expect(
      vm.runInNewContext(`${result}; DEMO_VERSIONS`, {
        self: { location: new URL('https://doskit.net/sw.js'), addEventListener() {} },
        URL,
        console: { log() {} },
      })
    ).toEqual(demoVersions);
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

  it('fails when the demo archive versions placeholder is missing', () => {
    const source = serviceWorker.replace(
      'const DEMO_VERSIONS = {};',
      'const DEMO_VERSIONS = {"x":1};'
    );

    expect(() => injectIntoServiceWorker(source, build)).toThrow(/DEMO_VERSIONS/);
  });

  it.each([
    ['no versions', undefined],
    ['no archives', {}],
    ['a path outside /demos/', { '/sw.js': '0123456789ab' }],
    ['a version that is no hex digest', { '/demos/x.zip': "0'; importScripts('x'); '" }],
  ])('fails on %s', (_, demoVersions) => {
    expect(() => injectIntoServiceWorker(serviceWorker, { ...build, demoVersions })).toThrow(
      /demo archive/
    );
  });

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
  it('lists the app shell, and js-dos with its default backend, but not DOSBox-X', () => {
    const paths = precachedPaths(serviceWorker);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/',
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

describe('versionDemoArchives', () => {
  const dists = [];
  const ARCHIVES = { 'panic.zip': 'PK panic', 'stars.zip': 'PK stars' };

  /** The versions of a dist/demos holding these files */
  function versionsOf(files) {
    const dist = createDist(
      Object.fromEntries(Object.entries(files).map(([name, bytes]) => [`demos/${name}`, bytes]))
    );
    dists.push(dist);
    return versionDemoArchives(dist);
  }

  afterEach(() => {
    for (const dist of dists.splice(0)) {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it('gives each archive a short hex digest of its bytes, by its path on the site', () => {
    const versions = versionsOf(ARCHIVES);

    expect(Object.keys(versions)).toEqual(['/demos/panic.zip', '/demos/stars.zip']);
    // The first 12 hex digits of SHA-256, which the worker computes too, to keep archives
    // an earlier worker stored
    expect(versions['/demos/stars.zip']).toBe(
      createHash('sha256').update('PK stars').digest('hex').slice(0, 12)
    );
  });

  it('leaves out files other than .zip archives', () => {
    expect(versionsOf({ ...ARCHIVES, 'README.md': '# Demos' })).toEqual(versionsOf(ARCHIVES));
  });

  it('changes the version of a changed archive only', () => {
    const before = versionsOf(ARCHIVES);
    const after = versionsOf({ ...ARCHIVES, 'stars.zip': 'PK stars 2' });

    expect(after['/demos/panic.zip']).toBe(before['/demos/panic.zip']);
    expect(after['/demos/stars.zip']).not.toBe(before['/demos/stars.zip']);
  });

  it('fails when dist/demos has no archives', () => {
    expect(() => versionsOf({ 'README.md': '# Demos' })).toThrow(/no \.zip archives/);
  });
});

// The step as `npm run build` runs it, after vite build, on a copy of the project
describe('the build step', () => {
  const projects = [];

  /**
   * A project as vite build leaves it: this script in scripts/, dist/ with sw.js and what
   * it precaches, and js-dos's package.json in node_modules/. DosKit's own package.json
   * gives another version, so the js-dos version cannot come from it by mistake.
   * @param {Record<string, string | null>} dist - Files of dist/ to add, change, or (null) leave out
   */
  function createProject(dist = {}) {
    const root = mkdtempSync(join(tmpdir(), 'inject-sw-version-build-'));
    projects.push(root);
    const files = {
      'package.json': JSON.stringify({ name: 'doskit', version: '1.1.0', type: 'module' }),
      'node_modules/js-dos/package.json': JSON.stringify({ name: 'js-dos', version: '9.9.9' }),
      'scripts/inject-sw-version.js': readFileSync(join(SCRIPTS, 'inject-sw-version.js')),
      ...Object.fromEntries(
        Object.entries({
          'sw.js': serviceWorker,
          'index.html': BUILT_INDEX_HTML,
          'assets/index-abc123.js': 'console.log("app")',
          'assets/index-789xyz.css': 'body {}',
          'assets/react-vendor-def456.js': 'console.log("react")',
          'demos/stars.zip': 'PK stars',
          'manifest.json': '{}',
          'logo.svg': '<svg></svg>',
          'favicon.svg': '<svg></svg>',
          'js-dos.js': 'console.log("js-dos")',
          'js-dos.css': '.jsdos {}',
          'emulators/emulators.js': '',
          'emulators/wdosbox.js': '',
          'emulators/wdosbox.wasm': '',
          'emulators/wlibzip.js': '',
          'emulators/wlibzip.wasm': '',
          ...dist,
        }).map(([file, contents]) => [`dist/${file}`, contents])
      ),
    };
    for (const [file, contents] of Object.entries(files)) {
      if (contents !== null) {
        mkdirSync(dirname(join(root, file)), { recursive: true });
        writeFileSync(join(root, file), contents);
      }
    }
    return root;
  }

  /** Runs the step in the project, as a script of its own, and reads what it left in dist/ */
  function build(root) {
    const run = spawnSync(process.execPath, [join(root, 'scripts/inject-sw-version.js')], {
      cwd: root,
      encoding: 'utf8',
    });
    return { ...run, serviceWorker: readFileSync(join(root, 'dist/sw.js'), 'utf8') };
  }

  afterEach(() => {
    for (const root of projects.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const cacheVersionOf = (source) => source.match(/const CACHE_VERSION = '([^']*)';/)?.[1];

  it('writes the same sw.js for a site that has not changed', () => {
    // Browsers install a worker whose script changed, and the app then offers an update:
    // a deploy that changes nothing the site serves, such as one of Markdown files outside
    // public/, must offer none
    const first = build(createProject());
    const second = build(createProject());

    expect([first.status, second.status]).toEqual([0, 0]);
    expect(second.serviceWorker).toBe(first.serviceWorker);
    expect(cacheVersionOf(first.serviceWorker)).toMatch(/^v[0-9a-f]{12}$/);
  });

  it.each([
    ['a bundle', { 'assets/index-abc123.js': 'console.log("app 2")' }],
    ['a file that only the worker serves', { 'humans.txt': 'Thanks' }],
    ['a demo archive', { 'demos/stars.zip': 'PK stars 2' }],
    ['the worker', { 'sw.js': `${serviceWorker}\n// A fix\n` }],
  ])('gives the caches a new version when %s changes', (_, dist) => {
    const before = build(createProject());
    const after = build(createProject(dist));

    expect(after.status).toBe(0);
    expect(cacheVersionOf(after.serviceWorker)).not.toBe(cacheVersionOf(before.serviceWorker));
  });

  // The worker never stores a page but index.html: it answers navigations from the network,
  // and offline with index.html. A page's text reaches visitors without a new worker, and
  // without the update prompt a new version brings.
  it.each([
    ["an app's page", { 'secondreality.html': '<title>Second Reality - DosKit</title>' }],
    ['the sitemap', { 'sitemap.xml': '<urlset>2</urlset>' }],
  ])("keeps the caches' version when %s changes", (_, dist) => {
    const before = build(createProject());
    const after = build(createProject(dist));

    expect(after.status).toBe(0);
    expect(cacheVersionOf(after.serviceWorker)).toBe(cacheVersionOf(before.serviceWorker));
  });

  it('gives the caches a new version when index.html changes, which install stores', () => {
    const before = build(createProject());
    const after = build(createProject({ 'index.html': '<title>Changed</title>' }));

    expect(cacheVersionOf(after.serviceWorker)).not.toBe(cacheVersionOf(before.serviceWorker));
  });

  it('stamps the version of the js-dos it copied, from node_modules/js-dos', () => {
    const result = build(createProject());

    expect(result.status).toBe(0);
    expect(result.serviceWorker).toContain("const JS_DOS_VERSION = '9.9.9';");
  });

  it('fails the build, and leaves sw.js as it was, when a file it precaches is missing', () => {
    // cache.addAll() rejects on a single 404, and the worker would never install
    const result = build(createProject({ 'manifest.json': null }));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/manifest.json');
    expect(result.serviceWorker).toBe(serviceWorker);
  });
});
