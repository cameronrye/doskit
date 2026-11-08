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
function startWorker(browser, { cacheVersion = 'vA' } = {}) {
  const source = injectIntoServiceWorker(SERVICE_WORKER, {
    version: cacheVersion,
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

  it('never evicts what install precached', async () => {
    const browser = createBrowser();
    const worker = await installAndActivate(browser);
    const precached = browser.cachedPaths();

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
