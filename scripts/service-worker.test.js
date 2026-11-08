// @vitest-environment node
/**
 * Behavior of public/sw.js as the build ships it (after inject-sw-version.js), run in a
 * vm sandbox with an in-memory server and Cache Storage that outlive any one worker.
 */
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { injectIntoServiceWorker } from './inject-sw-version.js';

const ORIGIN = 'https://doskit.net';
const SERVICE_WORKER = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../public/sw.js'),
  'utf8'
);
const BUNDLES = ['/assets/index-abc123.js', '/assets/index-789xyz.css'];

const urlOf = (input) =>
  new URL(typeof input === 'object' && 'url' in input ? input.url : String(input), ORIGIN);
const pathOf = (input) => {
  const { pathname, search } = urlOf(input);
  return pathname + search;
};

/**
 * A navigation, which Request() cannot make: it refuses mode 'navigate'. Like a browser's,
 * it follows no redirects itself: the browser does, as a new navigation.
 */
class Navigation {
  constructor(path) {
    this.url = new URL(path, ORIGIN).href;
    this.method = 'GET';
    this.mode = 'navigate';
    this.destination = 'document';
    this.cache = 'default';
    this.redirect = 'manual';
    this.headers = new Headers({ Accept: 'text/html' });
  }
}

// In a worker, Request() resolves relative URLs against the worker's location. As in
// browsers, a copy of a navigation made with an init is a same-origin request that keeps
// the navigation's headers and redirect mode.
class WorkerRequest extends Request {
  constructor(input, init) {
    if (input instanceof Navigation) {
      if (init?.mode === 'navigate') {
        throw new TypeError("Request() cannot make a request of mode 'navigate'");
      }
      if (!init || Object.keys(init).length === 0) {
        return Object.assign(new Navigation(input.url), input);
      }
      const { headers, redirect, cache } = input;
      super(input.url, { headers, redirect, cache, ...init, mode: 'same-origin' });
      return;
    }
    super(typeof input === 'string' ? new URL(input, ORIGIN) : input, init);
  }
}

// cache.addAll() takes paths, which have no headers
const headersOf = (request) =>
  new Headers(typeof request === 'object' ? request.headers : undefined);

class CacheMock {
  #entries = new Map(); // URL -> headers of the stored request, body and init of the response

  constructor(fetch) {
    this.fetch = fetch;
  }

  // Like Cache Storage, an entry whose response has a Vary header matches only requests
  // that agree with the stored one on each header it names, unless ignoreVary is set
  async match(request, { ignoreVary = false } = {}) {
    const entry = this.#entries.get(urlOf(request).href);
    const vary = entry && new Headers(entry.init.headers).get('Vary');
    const varied = (name) =>
      name === '*' || headersOf(request).get(name) !== entry.requestHeaders.get(name);
    if (!entry || (!ignoreVary && vary?.split(',').some((name) => varied(name.trim())))) {
      return undefined;
    }
    return new Response(entry.body, entry.init);
  }

  // Like Cache.put(), this reads the whole body before it stores anything, so a body
  // that breaks off makes it reject
  async put(request, response) {
    const body = await response.arrayBuffer();
    const { status, statusText, headers } = response;
    const url = urlOf(request).href;
    // Like browsers, a replaced entry moves to the end of keys()
    this.#entries.delete(url);
    this.#entries.set(url, {
      requestHeaders: headersOf(request),
      body,
      init: { status, statusText, headers: [...headers] },
    });
  }

  async addAll(requests) {
    const responses = await Promise.all(requests.map((request) => this.fetch(request)));
    const failed = responses.findIndex((response) => !response.ok);
    if (failed >= 0) {
      throw new TypeError(`${pathOf(requests[failed])} returned ${responses[failed].status}`);
    }
    for (const [i, request] of requests.entries()) {
      await this.put(request, responses[i]);
    }
  }

  async keys() {
    return [...this.#entries.keys()].map((url) => new Request(url));
  }

  async delete(request) {
    return this.#entries.delete(urlOf(request).href);
  }

  paths() {
    return [...this.#entries.keys()].map(pathOf);
  }
}

const CONTENT_TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
};

/**
 * A response body that arrives in two halves, the second once `arrived` resolves. The
 * request's signal breaks it off, as when the page aborts a download.
 */
function bodyOf(bytes, signal, arrived) {
  const half = Math.ceil(bytes.length / 2);
  return new ReadableStream({
    start(controller) {
      let ended = false;
      const end = (finish) => {
        if (!ended) {
          ended = true;
          finish();
        }
      };
      controller.enqueue(bytes.slice(0, half));
      signal?.addEventListener('abort', () => end(() => controller.error(signal.reason)));
      arrived.then(() =>
        end(() => {
          controller.enqueue(bytes.slice(half));
          controller.close();
        })
      );
    },
  });
}

/**
 * What outlives a service worker: the server, whose files change with each deploy, the
 * browser's HTTP cache and the origin's Cache Storage
 */
function createBrowser() {
  const server = {
    deploy: 'A',
    online: true,
    // Each fetch the worker makes, the ones the HTTP cache answers included
    requests: [],
    // The requests themselves, as the worker passed them to fetch()
    received: [],
    // Sent with every response, such as the Vary: Origin of vite preview
    headers: {},
    held: new Map(), // path -> promise the second half of its body waits for
    stalled: new Map(), // path -> promise its response waits for
    /** Holds back the second half of the file's body until the returned release() */
    hold(path) {
      let release;
      this.held.set(path, new Promise((resolve) => (release = resolve)));
      return release;
    },
    /** Holds back the response to the path until the returned release() */
    stall(path) {
      let release;
      this.stalled.set(path, new Promise((resolve) => (release = resolve)));
      return release;
    },
  };

  // GitHub Pages sends Cache-Control: max-age=600, so for 10 minutes the browser answers a
  // request of cache mode 'default' with the copy it last got, from whichever deploy that
  // was, without asking the server. `fresh` stands for those 10 minutes. 'no-cache'
  // revalidates: GitHub Pages changes every ETag on a deploy, so it gets the current file.
  const httpCache = { fresh: false, copies: new Map() }; // path -> deploy of the copy

  async function fetch(input) {
    const path = pathOf(input);
    const cache = input.cache ?? 'default';
    server.requests.push({ path, cache });
    server.received.push(input);
    if (!server.online) {
      throw new TypeError('Failed to fetch');
    }
    input.signal?.throwIfAborted();
    const stalled = server.stalled.get(path);
    if (stalled) {
      await stalled;
    }
    const reusable = httpCache.fresh && (cache === 'default' || cache === 'force-cache');
    const deploy = (reusable && httpCache.copies.get(path)) || server.deploy;
    if (cache !== 'no-store') {
      httpCache.copies.set(path, deploy);
    }
    // Like GitHub Pages, the server answers / (with any query) with index.html, and a path
    // it has no file for, such as /secondreality, with 404.html, a copy of index.html, and
    // status 404
    const { pathname } = urlOf(input);
    const file = pathname === '/' ? '/index.html' : extname(pathname) ? path : '/404.html';
    const bytes = new TextEncoder().encode(`${file} from deploy ${deploy}`);
    const arrived = server.held.get(path) ?? Promise.resolve();
    return new Response(bodyOf(bytes, input.signal, arrived), {
      status: file === '/404.html' ? 404 : 200,
      headers: {
        'Content-Length': String(bytes.length),
        'Content-Type': CONTENT_TYPES[extname(urlOf(file).pathname)] ?? 'text/plain',
        ...server.headers,
      },
    });
  }

  const store = new Map(); // cache name -> CacheMock
  const caches = {
    async open(name) {
      if (!store.has(name)) {
        store.set(name, new CacheMock(fetch));
      }
      return store.get(name);
    },
    async has(name) {
      return store.has(name);
    },
    async delete(name) {
      return store.delete(name);
    },
    async keys() {
      return [...store.keys()];
    },
    async match(request, options) {
      for (const cache of store.values()) {
        const response = await cache.match(request, options);
        if (response) {
          return response;
        }
      }
      return undefined;
    },
  };

  return {
    server,
    httpCache,
    fetch,
    caches,
    /** Cached paths by cache name, without the LRU metadata */
    contents() {
      return Object.fromEntries(
        [...store]
          .filter(([name]) => !name.endsWith('-metadata'))
          .map(([name, cache]) => [name, cache.paths()])
      );
    },
    cachedPaths() {
      return Object.values(this.contents()).flat();
    },
  };
}

/** Dispatches an event and waits for all the work it started */
async function dispatch(listener, init = {}) {
  const extensions = [];
  let response;
  const event = {
    ...init,
    waitUntil(promise) {
      extensions.push(promise);
    },
    respondWith(promise) {
      response = promise;
    },
  };
  listener(event);
  const result = { responded: response !== undefined, response: await response };
  for (let settled = 0; settled < extensions.length; ) {
    const pending = extensions.slice(settled);
    settled = extensions.length;
    await Promise.all(pending);
  }
  // Cache writes the worker does not wait for finish within a few turns
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  return result;
}

/** Starts public/sw.js as one build would ship it */
function startWorker(
  browser,
  { cacheVersion = 'vA', jsDosVersion = '8.3.20', demosHash = 'aaaa' } = {}
) {
  const source = injectIntoServiceWorker(SERVICE_WORKER, {
    version: cacheVersion,
    jsDosVersion,
    demosHash,
    assets: BUNDLES,
  });
  const listeners = {};
  const self = {
    location: new URL('/sw.js', ORIGIN),
    addEventListener: (type, listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn(() => Promise.resolve()),
    clients: { claim: () => Promise.resolve() },
  };
  const context = vm.createContext({
    self,
    caches: browser.caches,
    fetch: browser.fetch,
    Request: WorkerRequest,
    Response,
    URL,
    console: { log() {}, warn() {}, error() {} },
    // The timeout of a fetch that already settled must not keep the test run alive
    setTimeout: (callback, ms) => setTimeout(callback, ms).unref(),
    clearTimeout,
  });
  vm.runInContext(source, context, { filename: 'sw.js' });
  return {
    self,
    dispatch: (type, init) => dispatch(listeners[type], init),
    config: () => vm.runInContext('CONFIG', context),
  };
}

async function installAndActivate(browser, build) {
  const worker = startWorker(browser, build);
  await worker.dispatch('install');
  await worker.dispatch('activate');
  return worker;
}

const navigation = (path) => new Navigation(path);
const subresource = (path, init) => new Request(new URL(path, ORIGIN), init);
const requestedPaths = (browser) => browser.server.requests.map(({ path }) => path);
const isDemo = (path) => path.startsWith('/demos/');

// The shell files whose names carry no content hash, unlike the bundles. index.html is
// stored once, as /.
const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/js-dos.js',
  '/js-dos.css',
];
const APP_SHELL = [...SHELL_FILES, ...BUNDLES];
const DEFAULT_BACKEND = [
  '/emulators/emulators.js',
  '/emulators/wdosbox.js',
  '/emulators/wdosbox.wasm',
  '/emulators/wlibzip.js',
  '/emulators/wlibzip.wasm',
];
const DOSBOX_X = ['/emulators/wdosbox-x.js', '/emulators/wdosbox-x.wasm'];
// Named after the hash of the archives startWorker() stamps by default
const DEMO_CACHE = 'doskit-demos-aaaa';

describe('install', () => {
  it('precaches the app shell, the bundles and the default DOSBox backend', async () => {
    const browser = createBrowser();

    await startWorker(browser).dispatch('install');

    expect(browser.contents()['doskit-vA'].sort()).toEqual([...APP_SHELL].sort());
    expect(browser.contents()['doskit-emulators-8.3.20'].sort()).toEqual(
      [...DEFAULT_BACKEND].sort()
    );
  });

  it('asks the server for the shell files whose names carry no content hash', async () => {
    // GitHub Pages lets browsers reuse a file for 10 minutes, so an install that soon
    // after a visit could take the previous deploy's index.html from the HTTP cache. A
    // bundle's name changes with its content, so a copy from the HTTP cache is current.
    const browser = createBrowser();

    await startWorker(browser).dispatch('install');

    const modeOf = (path) =>
      browser.server.requests.find((request) => request.path === path)?.cache;
    expect(Object.fromEntries(APP_SHELL.map((path) => [path, modeOf(path)]))).toEqual({
      ...Object.fromEntries(SHELL_FILES.map((path) => [path, 'no-cache'])),
      ...Object.fromEntries(BUNDLES.map((path) => [path, 'default'])),
    });
  });
});

describe('pages', () => {
  it.each(['/', '/?app=panic', '/secondreality'])(
    'serves the cached index.html for %s offline',
    async (path) => {
      const browser = createBrowser();
      const worker = await installAndActivate(browser);
      browser.server.online = false;

      const { response } = await worker.dispatch('fetch', { request: navigation(path) });

      expect(await response?.text()).toBe('/index.html from deploy A');
    }
  );

  it("serves the deploy's index.html, not the previous deploy's one the HTTP cache holds", async () => {
    // Within the 10 minutes GitHub Pages lets browsers reuse a page, the HTTP cache still
    // holds the previous deploy's index.html for a URL visited before the deploy. It loads
    // bundles the new deploy's cache does not have, so offline the app would not start.
    const browser = createBrowser();
    browser.httpCache.fresh = true;
    const previous = await installAndActivate(browser, { cacheVersion: 'vA' });
    await previous.dispatch('fetch', { request: navigation('/?app=stars') });
    browser.server.deploy = 'B';
    const worker = await installAndActivate(browser, { cacheVersion: 'vB' });

    const { response: online } = await worker.dispatch('fetch', {
      request: navigation('/?app=stars'),
    });
    browser.server.online = false;
    const { response: offline } = await worker.dispatch('fetch', {
      request: navigation('/?app=stars'),
    });

    expect(await online?.text()).toBe('/index.html from deploy B');
    expect(await offline?.text()).toBe('/index.html from deploy B');
  });

  it('keeps the one copy of index.html install stored, whatever URLs are opened', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    const installed = browser.contents();

    for (const path of ['/', '/?app=stars', '/?app=panic', '/index.html', '/secondreality']) {
      await worker.dispatch('fetch', { request: navigation(path) });
    }

    expect(browser.contents()).toEqual(installed);
  });

  it('revalidates a page with the server and leaves its redirects to the browser', async () => {
    // A browser refuses a response that followed a redirect as the answer to a navigation,
    // so the request the worker sends must keep the navigation's redirect mode
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.received.length = 0;

    await worker.dispatch('fetch', { request: navigation('/?app=stars') });

    expect(
      browser.server.received.map(({ url, cache, redirect }) => ({ url, cache, redirect }))
    ).toEqual([{ url: `${ORIGIN}/?app=stars`, cache: 'no-cache', redirect: 'manual' }]);
  });

  it('passes on the 404 page GitHub Pages answers a path-style link with', async () => {
    // 404.html is a copy of index.html: the app starts and rewrites the URL to /?app=
    const browser = createBrowser();
    const worker = await installAndActivate(browser);

    const { response } = await worker.dispatch('fetch', {
      request: navigation('/secondreality'),
    });

    expect(response?.status).toBe(404);
    expect(await response?.text()).toBe('/404.html from deploy A');
  });

  describe('on a slow network', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('serves the cached index.html once 5 seconds have passed', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const browser = createBrowser();
      const worker = await installAndActivate(browser);
      browser.server.stall('/?app=stars');
      let answered = false;

      const visit = worker.dispatch('fetch', { request: navigation('/?app=stars') });
      visit.then(() => (answered = true));
      await vi.advanceTimersByTimeAsync(4999);
      expect(answered).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const { response } = await visit;

      expect(await response?.text()).toBe('/index.html from deploy A');
    });
  });
});

describe('bundles', () => {
  it('serves them from the cache without asking the network again', async () => {
    // A bundle's name changes with its content, so the cached copy never goes stale
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    for (const path of BUNDLES) {
      const { response } = await worker.dispatch('fetch', { request: subresource(path) });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }

    expect(requestedPaths(browser)).toEqual([]);
  });

  it('stores one install did not precache on first use and serves it from the cache', async () => {
    // Such as a bundle of a later deploy's index.html, which a page online gets
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    await worker.dispatch('fetch', { request: subresource('/assets/index-later1.js') });
    await worker.dispatch('fetch', { request: subresource('/assets/index-later1.js') });
    browser.server.online = false;
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/assets/index-later1.js'),
    });

    expect(await response?.text()).toBe('/assets/index-later1.js from deploy A');
    expect(requestedPaths(browser)).toEqual(['/assets/index-later1.js']);
  });

  it('serves them to the crossorigin requests of index.html, whatever Vary says', async () => {
    // Its module scripts and stylesheet have crossorigin, so Chrome sends Origin, which
    // install's requests did not. On a host that answers with Vary: Origin (vite preview
    // does), the app could not start offline before a load online had stored them again.
    const browser = createBrowser();
    browser.server.headers = { Vary: 'Origin' };
    const worker = await installAndActivate(browser);
    browser.server.online = false;

    for (const path of BUNDLES) {
      const { response } = await worker.dispatch('fetch', {
        request: subresource(path, { headers: { Origin: ORIGIN } }),
      });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }
  });
});

describe('emulator files', () => {
  it('serves the default backend from the precache', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    for (const path of DEFAULT_BACKEND) {
      const { response } = await worker.dispatch('fetch', { request: subresource(path) });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }
    expect(requestedPaths(browser)).toEqual([]);
  });

  it('serves the precached wasm to the preload in index.html, which sends Origin', async () => {
    // The preload has crossorigin, so Chrome sends Origin, and install's request did not.
    // A host that answers with Vary: Origin (vite preview does) makes that a miss unless
    // the lookup ignores Vary.
    const browser = createBrowser();
    browser.server.headers = { Vary: 'Origin' };
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    const { response } = await worker.dispatch('fetch', {
      request: subresource('/emulators/wdosbox.wasm', { headers: { Origin: ORIGIN } }),
    });

    expect(await response?.text()).toBe('/emulators/wdosbox.wasm from deploy A');
    expect(requestedPaths(browser)).toEqual([]);
  });

  it('caches DOSBox-X on first use and serves it from the cache, offline too', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    for (const path of DOSBOX_X) {
      await worker.dispatch('fetch', { request: subresource(path) });
      await worker.dispatch('fetch', { request: subresource(path) });
    }
    browser.server.online = false;

    for (const path of DOSBOX_X) {
      const { response } = await worker.dispatch('fetch', { request: subresource(path) });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }
    expect(requestedPaths(browser)).toEqual(DOSBOX_X);
  });

  it('keeps them across deploys that keep the js-dos version', async () => {
    const browser = createBrowser();
    const previous = await installAndActivate(browser, { cacheVersion: 'vA' });
    await previous.dispatch('fetch', { request: subresource(DOSBOX_X[1]) });
    browser.server.deploy = 'B';
    browser.server.requests.length = 0;

    const worker = await installAndActivate(browser, { cacheVersion: 'vB' });
    for (const path of [...DEFAULT_BACKEND, DOSBOX_X[1]]) {
      const { response } = await worker.dispatch('fetch', { request: subresource(path) });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }

    expect(requestedPaths(browser)).toEqual(expect.arrayContaining(APP_SHELL));
    expect(requestedPaths(browser).filter((path) => path.startsWith('/emulators/'))).toEqual([]);
  });

  it('replaces them when js-dos changes, once the new worker activates', async () => {
    const browser = createBrowser();
    const previous = await installAndActivate(browser, { cacheVersion: 'vA' });
    await previous.dispatch('fetch', { request: subresource(DOSBOX_X[1]) });
    browser.server.deploy = 'B';
    browser.server.requests.length = 0;

    const worker = startWorker(browser, { cacheVersion: 'vB', jsDosVersion: '8.4.0' });
    await worker.dispatch('install');
    expect(requestedPaths(browser)).toEqual(expect.arrayContaining(DEFAULT_BACKEND));
    // The waiting update must not change the files under the open page's js-dos
    const { response: current } = await previous.dispatch('fetch', {
      request: subresource('/emulators/wdosbox.wasm'),
    });
    expect(await current?.text()).toBe('/emulators/wdosbox.wasm from deploy A');

    await worker.dispatch('activate');

    expect(Object.keys(browser.contents()).sort()).toEqual(['doskit-emulators-8.4.0', 'doskit-vB']);
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/emulators/wdosbox.wasm'),
    });
    expect(await response?.text()).toBe('/emulators/wdosbox.wasm from deploy B');
  });

  it('asks the server for them rather than the HTTP cache', async () => {
    // A cache entry is kept for as long as js-dos stays the same, so it must not come
    // from an HTTP cache entry that is still fresh but from the previous js-dos
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    await worker.dispatch('fetch', { request: subresource(DOSBOX_X[1]) });

    const emulatorRequests = browser.server.requests.filter(({ path }) =>
      path.startsWith('/emulators/')
    );
    expect(emulatorRequests.map(({ path }) => path).sort()).toEqual(
      [...DEFAULT_BACKEND, DOSBOX_X[1]].sort()
    );
    expect(new Set(emulatorRequests.map(({ cache }) => cache))).toEqual(new Set(['no-cache']));
  });
});

describe('demo archives', () => {
  it('stores an archive on first use and serves it from the cache, offline too', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    browser.server.requests.length = 0;

    await worker.dispatch('fetch', { request: subresource('/demos/stars.zip') });
    await worker.dispatch('fetch', { request: subresource('/demos/stars.zip') });
    browser.server.online = false;
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });

    expect(await response?.text()).toBe('/demos/stars.zip from deploy A');
    expect(requestedPaths(browser)).toEqual(['/demos/stars.zip']);
    expect(browser.contents()[DEMO_CACHE]).toEqual(['/demos/stars.zip']);
  });

  it('serves a cached archive with the headers it was downloaded with', async () => {
    // The app shows download progress against Content-Length
    const browser = createBrowser();
    const worker = await installAndActivate(browser);

    const { response: downloaded } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });
    const { response: cached } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });

    expect(requestedPaths(browser).filter(isDemo)).toEqual(['/demos/stars.zip']);
    expect([...cached.headers]).toEqual([...downloaded.headers]);
    expect(Number(cached.headers.get('Content-Length'))).toBe(
      (await cached.arrayBuffer()).byteLength
    );
  });

  it('serves a cached archive whatever the headers its Vary names', async () => {
    const browser = createBrowser();
    browser.server.headers = { Vary: 'Origin' };
    const worker = await installAndActivate(browser);
    await worker.dispatch('fetch', { request: subresource('/demos/stars.zip') });
    browser.server.requests.length = 0;

    const { response } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip', { headers: { Origin: ORIGIN } }),
    });

    expect(await response?.text()).toBe('/demos/stars.zip from deploy A');
    expect(requestedPaths(browser)).toEqual([]);
  });

  it('keeps them across deploys that leave the archives unchanged', async () => {
    const browser = createBrowser();
    const previous = await installAndActivate(browser, { cacheVersion: 'vA' });
    for (const path of ['/demos/stars.zip', '/demos/panic.zip']) {
      await previous.dispatch('fetch', { request: subresource(path) });
    }
    browser.server.deploy = 'B';
    browser.server.requests.length = 0;

    const worker = await installAndActivate(browser, { cacheVersion: 'vB' });
    for (const path of ['/demos/stars.zip', '/demos/panic.zip']) {
      const { response } = await worker.dispatch('fetch', { request: subresource(path) });
      expect(await response?.text()).toBe(`${path} from deploy A`);
    }

    expect(requestedPaths(browser).filter(isDemo)).toEqual([]);
  });

  it('replaces them when an archive changes, once the new worker activates', async () => {
    const browser = createBrowser();
    const previous = await installAndActivate(browser, { cacheVersion: 'vA', demosHash: 'aaaa' });
    await previous.dispatch('fetch', { request: subresource('/demos/stars.zip') });
    browser.server.deploy = 'B';

    const worker = startWorker(browser, { cacheVersion: 'vB', demosHash: 'bbbb' });
    await worker.dispatch('install');
    // The waiting update must not change the archives under the open page
    const { response: current } = await previous.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });
    expect(await current?.text()).toBe('/demos/stars.zip from deploy A');

    await worker.dispatch('activate');

    expect(Object.keys(browser.contents()).filter((name) => name.includes('demos'))).toEqual([]);
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });
    expect(await response?.text()).toBe('/demos/stars.zip from deploy B');
    expect(browser.contents()['doskit-demos-bbbb']).toEqual(['/demos/stars.zip']);
  });

  it('asks the server for them rather than the HTTP cache', async () => {
    // A cached archive is kept until the archives change, so it must not come from an
    // HTTP cache entry that is still fresh but holds the previous deploy's archive
    const browser = createBrowser();
    const worker = await installAndActivate(browser);

    await worker.dispatch('fetch', { request: subresource('/demos/stars.zip') });

    expect(browser.server.requests.filter(({ path }) => isDemo(path))).toEqual([
      { path: '/demos/stars.zip', cache: 'no-cache' },
    ]);
  });

  it('stores nothing of a download the app aborts, and downloads it whole next time', async () => {
    // The app aborts the download of an app it no longer loads. This is a browser that
    // passes that abort on to the worker; Chromium does not, and stores the whole archive.
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    const release = browser.server.hold('/demos/second-reality.zip');
    const download = new AbortController();

    const aborted = worker.dispatch('fetch', {
      request: subresource('/demos/second-reality.zip', { signal: download.signal }),
    });
    await vi.waitFor(() => expect(requestedPaths(browser)).toContain('/demos/second-reality.zip'));
    download.abort();
    release();
    await aborted;

    expect(browser.contents()[DEMO_CACHE] ?? []).toEqual([]);
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/demos/second-reality.zip'),
    });
    expect(await response?.text()).toBe('/demos/second-reality.zip from deploy A');
    expect(browser.contents()[DEMO_CACHE]).toEqual(['/demos/second-reality.zip']);
  });
});

describe('activate', () => {
  it('replaces the caches of the previous deploy', async () => {
    const browser = createBrowser();
    const previous = await installAndActivate(browser, { cacheVersion: 'vA' });
    await previous.dispatch('fetch', { request: subresource('/humans.txt') });
    await browser.caches.open('another-app');
    browser.server.deploy = 'B';

    const worker = await installAndActivate(browser, { cacheVersion: 'vB' });

    const names = await browser.caches.keys();
    expect(names.filter((name) => name.includes('vA'))).toEqual([]);
    expect(names).toContain('another-app');
    browser.server.online = false;
    const { response } = await worker.dispatch('fetch', { request: navigation('/') });
    expect(await response?.text()).toBe('/index.html from deploy B');
  });
});

describe('worker script', () => {
  it('leaves requests for it to the network and never caches it', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    // serviceWorkerRegistration.ts fetches it to check that the worker still exists
    const check = () =>
      new Request(new URL('/sw.js', ORIGIN), { headers: { 'Service-Worker': 'script' } });

    const first = await worker.dispatch('fetch', { request: check() });
    const second = await worker.dispatch('fetch', { request: check() });

    expect([first.responded, second.responded]).toEqual([false, false]);
    expect(browser.cachedPaths()).not.toContain('/sw.js');
  });
});

describe('messages', () => {
  it('activates the waiting worker on SKIP_WAITING', async () => {
    const worker = startWorker(createBrowser());
    await worker.dispatch('install');

    await worker.dispatch('message', { data: { type: 'SKIP_WAITING' } });

    expect(worker.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it('ignores other messages', async () => {
    const browser = createBrowser();
    const worker = startWorker(browser);
    await worker.dispatch('install');
    const cached = browser.contents();
    browser.server.requests.length = 0;

    for (const data of [{ type: 'CLEAR_CACHE' }, { type: 'CACHE_URLS', urls: ['/x'] }, null]) {
      await worker.dispatch('message', { data });
    }

    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    expect(browser.contents()).toEqual(cached);
    expect(requestedPaths(browser)).toEqual([]);
  });
});

describe('cache trimming', () => {
  /** Fetches more distinct files than the cache may hold, each stored at runtime */
  async function overflowCache(worker) {
    const visited = Array.from(
      { length: worker.config().MAX_CACHE_SIZE + 10 },
      (_, i) => `/notes/note-${i}.txt`
    );
    for (const path of visited) {
      await worker.dispatch('fetch', { request: subresource(path) });
    }
    return visited;
  }

  it('never evicts what install precached, however long ago it was used', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    const precached = browser.cachedPaths();
    // Loading the app records a use of each shell file, older than any visit below
    await worker.dispatch('fetch', { request: navigation('/') });
    for (const path of APP_SHELL.filter((path) => path !== '/')) {
      await worker.dispatch('fetch', { request: subresource(path) });
    }

    await overflowCache(worker);

    expect(browser.cachedPaths()).toEqual(expect.arrayContaining(precached));
    browser.server.online = false;
    const { response } = await worker.dispatch('fetch', { request: navigation('/secondreality') });
    expect(await response?.text()).toBe('/index.html from deploy A');
  });

  it('never evicts a demo archive, however long ago it was used', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    await worker.dispatch('fetch', { request: subresource('/demos/stars.zip') });

    await overflowCache(worker);

    browser.server.online = false;
    const { response } = await worker.dispatch('fetch', {
      request: subresource('/demos/stars.zip'),
    });
    expect(await response?.text()).toBe('/demos/stars.zip from deploy A');
  });

  it('evicts the least recently used entries, not the ones it just cached', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);

    const visited = await overflowCache(worker);

    const appCache = browser.contents()['doskit-vA'];
    expect(appCache).toHaveLength(worker.config().MAX_CACHE_SIZE);
    expect(appCache).toEqual(expect.arrayContaining(visited.slice(-10)));
    expect(appCache).not.toContain(visited[0]);
  });

  it('keeps to its limit while the body it stores is still arriving', async () => {
    // Cache.put() writes the entry only once it has the whole body
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    await overflowCache(worker);
    const release = browser.server.hold('/notes/slow.txt');

    const visit = worker.dispatch('fetch', { request: subresource('/notes/slow.txt') });
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    await visit;

    const appCache = browser.contents()['doskit-vA'];
    expect(appCache).toHaveLength(worker.config().MAX_CACHE_SIZE);
    expect(appCache).toContain('/notes/slow.txt');
  });
});
