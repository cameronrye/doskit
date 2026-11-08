/**
 * Inject build version and bundled assets into service worker
 * This ensures the service worker file changes on every build,
 * triggering browser update detection, and includes all bundled assets
 * for proper offline functionality
 *
 * The build fails if dist/sw.js lacks what this replaces, or if it would
 * precache a file that is not in dist/: cache.addAll() rejects on a single
 * 404, and the service worker would then never install.
 */

import { existsSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

const CACHE_VERSION_PLACEHOLDER = /const CACHE_VERSION = ['"]v1['"];/;
const STATIC_ASSETS_LIST = /(const STATIC_ASSETS = \[[^\]]+)(];)/;
const PRECACHE_LISTS = /const (?:STATIC|EMULATOR)_ASSETS = \[([^\]]*)\]/g;

// Generate version based on current timestamp and git commit (if available)
function generateVersion() {
  const timestamp = Date.now();
  const buildDate = new Date().toISOString();

  // Try to get git commit hash
  let gitHash = 'unknown';
  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Could not get git hash, using timestamp only');
  }

  // Create a unique version string
  const versionString = `${timestamp}-${gitHash}`;
  const hash = createHash('md5').update(versionString).digest('hex').substring(0, 8);

  return {
    version: `v${hash}`,
    buildDate,
    gitHash,
    timestamp,
  };
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
 * Replace the CACHE_VERSION placeholder and append the bundled assets to
 * STATIC_ASSETS
 */
export function injectIntoServiceWorker(swContent, { version, assets }) {
  if (!CACHE_VERSION_PLACEHOLDER.test(swContent)) {
    throw new Error("sw.js has no `const CACHE_VERSION = 'v1';` placeholder");
  }
  if (!STATIC_ASSETS_LIST.test(swContent)) {
    throw new Error('sw.js has no STATIC_ASSETS list for the bundled assets');
  }
  if (assets.length === 0) {
    throw new Error('index.html references no bundles under /assets/');
  }

  const assetsToInject = assets.map((asset) => `  '${asset}',`).join('\n');
  return swContent
    .replace(CACHE_VERSION_PLACEHOLDER, `const CACHE_VERSION = '${version}';`)
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
    const versionInfo = generateVersion();
    const bundledAssets = extractBundledAssets(readFileSync(join(distDir, 'index.html'), 'utf8'));

    console.log(`📦 Found ${bundledAssets.length} bundled assets:`);
    bundledAssets.forEach((asset) => console.log(`   - ${asset}`));

    let swContent = injectIntoServiceWorker(readFileSync(swPath, 'utf8'), {
      version: versionInfo.version,
      assets: bundledAssets,
    });

    const missing = findMissingFiles(precachedPaths(swContent), distDir);
    if (missing.length > 0) {
      throw new Error(`sw.js precaches files that are not in dist/: ${missing.join(', ')}`);
    }
    console.log(`✅ Injected ${bundledAssets.length} bundled assets into service worker`);

    // Add build info as a comment at the top
    const buildInfo = `// Build: ${versionInfo.buildDate} | Git: ${versionInfo.gitHash} | Version: ${versionInfo.version}\n`;
    swContent = buildInfo + swContent;

    writeFileSync(swPath, swContent, 'utf8');

    console.log('✅ Service worker version injected successfully');
    console.log(`   Version: ${versionInfo.version}`);
    console.log(`   Build Date: ${versionInfo.buildDate}`);
    console.log(`   Git Hash: ${versionInfo.gitHash}`);
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
