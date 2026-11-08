// @vitest-environment node
/**
 * Behavior of public/sw.js as the build ships it (after inject-sw-version.js), run in a
 * vm sandbox with an in-memory server and Cache Storage that outlive any one worker.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
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

// In a worker, Request() resolves relative URLs against the worker's location
class WorkerRequest extends Request {
  constructor(input, init) {
    super(typeof input === 'string' ? new URL(input, ORIGIN) : input, init);
  }
}

class CacheMock {
  #entries = new Map(); // URL -> Response

  constructor(fetch) {
    this.fetch = fetch;
  }

  async match(request) {
    return this.#entries.get(urlOf(request).href)?.clone();
  }

  async put(request, response) {
    const url = urlOf(request).href;
    // Like browsers, a replaced entry moves to the end of keys()
    this.#entries.delete(url);
    this.#entries.set(url, response);
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

/**
 * What outlives a service worker: the server, whose files change with each deploy, and
 * the origin's Cache Storage
 */
function createBrowser() {
  const server = { deploy: 'A', online: true, requests: [] };

  async function fetch(input) {
    server.requests.push({ path: pathOf(input), cache: input.cache ?? 'default' });
    if (!server.online) {
      throw new TypeError('Failed to fetch');
    }
    // Like GitHub Pages, the server answers / (with any query) with index.html
    const file = urlOf(input).pathname === '/' ? '/index.html' : pathOf(input);
    return new Response(`${file} from deploy ${server.deploy}`, { status: 200 });
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
    async match(request) {
      for (const cache of store.values()) {
        const response = await cache.match(request);
        if (response) {
          return response;
        }
      }
      return undefined;
    },
  };

  return {
    server,
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
function startWorker(browser, { cacheVersion = 'vA', jsDosVersion = '8.3.20' } = {}) {
  const source = injectIntoServiceWorker(SERVICE_WORKER, {
    version: cacheVersion,
    jsDosVersion,
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

// Request() refuses mode 'navigate', so navigations are plain objects
const navigation = (path) => ({
  url: new URL(path, ORIGIN).href,
  method: 'GET',
  mode: 'navigate',
  destination: 'document',
});
const subresource = (path) => new Request(new URL(path, ORIGIN));
const requestedPaths = (browser) => browser.server.requests.map(({ path }) => path);

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/js-dos.js',
  '/js-dos.css',
  ...BUNDLES,
];
const DEFAULT_BACKEND = [
  '/emulators/emulators.js',
  '/emulators/wdosbox.js',
  '/emulators/wdosbox.wasm',
  '/emulators/wlibzip.js',
  '/emulators/wlibzip.wasm',
];
const DOSBOX_X = ['/emulators/wdosbox-x.js', '/emulators/wdosbox-x.wasm'];

describe('install', () => {
  it('precaches the app shell, the bundles and the default DOSBox backend', async () => {
    const browser = createBrowser();

    await startWorker(browser).dispatch('install');

    expect(browser.cachedPaths()).toEqual(
      expect.arrayContaining([...APP_SHELL, ...DEFAULT_BACKEND])
    );
    expect(browser.cachedPaths().filter((path) => DOSBOX_X.includes(path))).toEqual([]);
  });
});

describe('offline navigation', () => {
  it.each(['/', '/?app=panic', '/secondreality'])(
    'serves the cached index.html for %s',
    async (path) => {
      const browser = createBrowser();
      const worker = await installAndActivate(browser);
      browser.server.online = false;

      const { response } = await worker.dispatch('fetch', { request: navigation(path) });

      expect(await response?.text()).toBe('/index.html from deploy A');
    }
  );
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
  /** Navigates to more distinct URLs than the cache may hold */
  async function overflowCache(worker) {
    const visited = Array.from(
      { length: worker.config().MAX_CACHE_SIZE + 10 },
      (_, i) => `/?app=demo-${i}`
    );
    for (const path of visited) {
      await worker.dispatch('fetch', { request: navigation(path) });
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

  it('evicts the least recently used entries, not the ones it just cached', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);

    const visited = await overflowCache(worker);

    const appCache = browser.contents()['doskit-vA'];
    expect(appCache).toHaveLength(worker.config().MAX_CACHE_SIZE);
    expect(appCache).toEqual(expect.arrayContaining(visited.slice(-10)));
    expect(appCache).not.toContain(visited[0]);
  });
});
