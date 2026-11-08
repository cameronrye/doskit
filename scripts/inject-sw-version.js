/**
 * Inject build version and bundled assets into service worker
 * The version is a hash of what the build made, so the service worker file
 * changes, and browsers install it as an update, only when something the
 * site serves or the worker itself has changed: a deploy of the same site
 * writes the same sw.js and offers no update. It also includes all bundled
 * assets for proper offline functionality: every JS and CSS file in
 * dist/assets, so that the chunks the app imports lazily load offline too.
 *
 * It also stamps the version of the js-dos copied into dist/, which names the
 * worker's emulator cache: the js-dos player (js-dos.js and js-dos.css) and
 * its emulator files stay cached across deploys until js-dos changes. A hash
 * of the archives in dist/demos/ names the demo cache the same way, so a
 * deploy that changes none downloads none again.
 *
 * The build fails if dist/sw.js lacks what this replaces, or if it would
 * precache a file that is not in dist/: cache.addAll() rejects on a single
 * 404, and the service worker would then never install.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join, relative, sep } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');
// Where copy-js-dos.js takes js-dos.js, js-dos.css and the files in dist/emulators/ from
const jsDosPackage = join(__dirname, '../node_modules/js-dos/package.json');

const CACHE_VERSION_PLACEHOLDER = /const CACHE_VERSION = ['"]v1['"];/;
const JS_DOS_VERSION_PLACEHOLDER = /const JS_DOS_VERSION = ['"]dev['"];/;
const DEMOS_HASH_PLACEHOLDER = /const DEMOS_HASH = ['"]dev['"];/;
// npm versions are semver: letters, digits, dots, hyphens and plus signs
const PLAIN_VERSION = /^[0-9A-Za-z.+-]+$/;
const HEX_DIGEST = /^[0-9a-f]+$/;
// The files in dist/demos/ that the worker's DEMO_ARCHIVE serves from the demo cache
const DEMO_ARCHIVE = /\.zip$/;
const STATIC_ASSETS_LIST = /(const STATIC_ASSETS = \[[^\]]+)(];)/;
const PRECACHE_LISTS = /const (?:STATIC|EMULATOR)_ASSETS = \[([^\]]*)\]/g;
// JavaScript and CSS, without their source maps (*.js.map)
const BUNDLE_FILE = /\.(?:js|css)$/;

/**
 * The worker's CACHE_VERSION: a short hash of every file in dist/ but sw.js, by path and
 * bytes, and of sw.js as vite copied it, with the lists and versions injected into it.
 * Neither the time of the build nor its commit goes in, so a deploy that changes nothing
 * the site serves, such as one of Markdown files outside public/, keeps the worker byte for
 * byte, while one that changes a file, or the worker, installs a new worker with an app
 * shell cache of its own.
 * @param {string} dir - The build output directory
 * @param {string} serviceWorker - dist/sw.js, before anything is injected into it
 * @param {object} injected - The js-dos version, demo archive hash and bundles it gets
 */
export function hashSite(dir, serviceWorker, injected) {
  const hash = createHash('sha256');
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .filter((file) => file !== 'sw.js')
    .sort();
  for (const file of files) {
    const bytes = readFileSync(join(dir, file));
    // Each file's path and length come first, as in hashDemoArchives
    hash.update(`${file}\0${bytes.length}\0`).update(bytes);
  }
  hash.update(`sw.js\0${serviceWorker}\0${JSON.stringify(injected)}`);
  return `v${hash.digest('hex').slice(0, 12)}`;
}

/**
 * Bundled asset paths referenced by the built index.html
 * (script src and link href, which covers CSS and modulepreload)
 */
export function extractBundledAssets(indexHtml) {
  const patterns = [/<script[^>]+src="(\/assets\/[^"]+)"/g, /<link[^>]+href="(\/assets\/[^"]+)"/g];
  const assets = patterns.flatMap((pattern) => [...indexHtml.matchAll(pattern)].map((m) => m[1]));
  return [...new Set(assets)].sort();
}

/**
 * What install precaches from dist/assets: every JS and CSS file there, including the
 * chunks the app imports lazily (each app's config and the DOSBox config builder), which
 * an app opened offline needs although index.html does not name them. What index.html
 * references is listed too, so that a bundle missing from dist/ fails the build.
 */
export function collectBundledAssets(dir) {
  const emitted = readdirSync(join(dir, 'assets'), { recursive: true })
    .filter((file) => BUNDLE_FILE.test(file))
    .map((file) => `/assets/${file.split(sep).join('/')}`);
  const referenced = extractBundledAssets(readFileSync(join(dir, 'index.html'), 'utf8'));
  return [...new Set([...referenced, ...emitted])].sort();
}

/**
 * A short hash of the demo archives in dist/demos/, over their sorted names and bytes,
 * which names the worker's demo cache
 */
export function hashDemoArchives(dir) {
  const demosDir = join(dir, 'demos');
  const archives = readdirSync(demosDir)
    .filter((name) => DEMO_ARCHIVE.test(name))
    .sort();
  if (archives.length === 0) {
    throw new Error('dist/demos/ has no .zip archives');
  }
  const hash = createHash('sha256');
  for (const name of archives) {
    const bytes = readFileSync(join(demosDir, name));
    // Each archive's name and length come first, so bytes cannot move between archives
    // without changing the hash
    hash.update(`${name}\0${bytes.length}\0`).update(bytes);
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * Replace the CACHE_VERSION, JS_DOS_VERSION and DEMOS_HASH placeholders and append
 * the bundled assets to STATIC_ASSETS
 */
export function injectIntoServiceWorker(swContent, { version, jsDosVersion, demosHash, assets }) {
  if (!CACHE_VERSION_PLACEHOLDER.test(swContent)) {
    throw new Error("sw.js has no `const CACHE_VERSION = 'v1';` placeholder");
  }
  if (!JS_DOS_VERSION_PLACEHOLDER.test(swContent)) {
    throw new Error("sw.js has no `const JS_DOS_VERSION = 'dev';` placeholder");
  }
  if (!DEMOS_HASH_PLACEHOLDER.test(swContent)) {
    throw new Error("sw.js has no `const DEMOS_HASH = 'dev';` placeholder");
  }
  if (!STATIC_ASSETS_LIST.test(swContent)) {
    throw new Error('sw.js has no STATIC_ASSETS list for the bundled assets');
  }
  if (typeof jsDosVersion !== 'string' || !PLAIN_VERSION.test(jsDosVersion)) {
    throw new Error(`js-dos version ${JSON.stringify(jsDosVersion)} is not a version number`);
  }
  if (typeof demosHash !== 'string' || !HEX_DIGEST.test(demosHash)) {
    throw new Error(`demo archive hash ${JSON.stringify(demosHash)} is not a hex digest`);
  }
  if (assets.length === 0) {
    throw new Error('the build has no bundles under /assets/');
  }

  const assetsToInject = assets.map((asset) => `  '${asset}',`).join('\n');
  return swContent
    .replace(CACHE_VERSION_PLACEHOLDER, `const CACHE_VERSION = '${version}';`)
    .replace(JS_DOS_VERSION_PLACEHOLDER, `const JS_DOS_VERSION = '${jsDosVersion}';`)
    .replace(DEMOS_HASH_PLACEHOLDER, `const DEMOS_HASH = '${demosHash}';`)
    .replace(
      STATIC_ASSETS_LIST,
      `$1  // Bundled assets (auto-injected during build)\n${assetsToInject}\n$2`
    );
}

/**
 * Paths listed in STATIC_ASSETS and EMULATOR_ASSETS, which install precaches
 */
export function precachedPaths(swContent) {
  return [...swContent.matchAll(PRECACHE_LISTS)].flatMap(([, list]) =>
    [...list.matchAll(/'(\/[^']*)'/g)].map(([, path]) => path)
  );
}

/**
 * Precached paths with no file in the build output ('/' is index.html)
 */
export function findMissingFiles(paths, dir) {
  return paths.filter((path) => !existsSync(join(dir, path === '/' ? 'index.html' : path)));
}

// Inject version and bundled assets into service worker
function injectVersionAndAssets() {
  const swPath = join(distDir, 'sw.js');

  try {
    const serviceWorker = readFileSync(swPath, 'utf8');
    const jsDosVersion = JSON.parse(readFileSync(jsDosPackage, 'utf8')).version;
    const demosHash = hashDemoArchives(distDir);
    const bundledAssets = collectBundledAssets(distDir);
    const injected = { jsDosVersion, demosHash, assets: bundledAssets };
    const version = hashSite(distDir, serviceWorker, injected);

    console.log(`📦 Found ${bundledAssets.length} bundled assets:`);
    bundledAssets.forEach((asset) => console.log(`   - ${asset}`));

    // No build date or commit goes into the file, which must stay the same for the same site
    const swContent = injectIntoServiceWorker(serviceWorker, { version, ...injected });

    const missing = findMissingFiles(precachedPaths(swContent), distDir);
    if (missing.length > 0) {
      throw new Error(`sw.js precaches files that are not in dist/: ${missing.join(', ')}`);
    }
    console.log(`✅ Injected ${bundledAssets.length} bundled assets into service worker`);

    writeFileSync(swPath, swContent, 'utf8');

    console.log('✅ Service worker version injected successfully');
    console.log(`   Version: ${version} (a hash of the site, names the app shell cache)`);
    console.log(`   js-dos: ${jsDosVersion} (names the emulator cache)`);
    console.log(`   Demo archives: ${demosHash} (names the demo cache)`);
  } catch (error) {
    console.error('❌ Failed to inject service worker version:', error.message);
    process.exit(1);
  }
}

const isEntryPoint = () => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(__filename);
  } catch {
    return false;
  }
};

if (isEntryPoint()) {
  injectVersionAndAssets();
}
