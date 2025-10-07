/**
 * Inject build version and bundled assets into service worker
 * This ensures the service worker file changes on every build,
 * triggering browser update detection, and includes all bundled assets
 * for proper offline functionality
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    timestamp
  };
}

// Extract bundled asset filenames from index.html
function extractBundledAssets() {
  const indexPath = join(__dirname, '../dist/index.html');

  try {
    const indexContent = readFileSync(indexPath, 'utf8');
    const assets = [];

    // Match script tags with src="/assets/..."
    const scriptRegex = /<script[^>]+src="(\/assets\/[^"]+)"/g;
    let match;
    while ((match = scriptRegex.exec(indexContent)) !== null) {
      assets.push(match[1]);
    }

    // Match link tags with href="/assets/..." (CSS and preload)
    const linkRegex = /<link[^>]+href="(\/assets\/[^"]+)"/g;
    while ((match = linkRegex.exec(indexContent)) !== null) {
      assets.push(match[1]);
    }

    // Remove duplicates and sort
    const uniqueAssets = [...new Set(assets)].sort();

    console.log(`📦 Found ${uniqueAssets.length} bundled assets:`);
    uniqueAssets.forEach(asset => console.log(`   - ${asset}`));

    return uniqueAssets;
  } catch (error) {
    console.error('❌ Failed to extract bundled assets:', error.message);
    return [];
  }
}

// Inject version and bundled assets into service worker
function injectVersionAndAssets() {
  const swPath = join(__dirname, '../dist/sw.js');

  try {
    let swContent = readFileSync(swPath, 'utf8');
    const versionInfo = generateVersion();
    const bundledAssets = extractBundledAssets();

    // Replace the CACHE_VERSION line
    swContent = swContent.replace(
      /const CACHE_VERSION = ['"]v1['"];/,
      `const CACHE_VERSION = '${versionInfo.version}';`
    );

    // Inject bundled assets into STATIC_ASSETS array
    // Find the STATIC_ASSETS array and add bundled assets before the closing bracket
    if (bundledAssets.length > 0) {
      const assetsToInject = bundledAssets.map(asset => `  \`\${BASE_PATH}${asset}\`,`).join('\n');

      swContent = swContent.replace(
        /(const STATIC_ASSETS = \[[^\]]+)(];)/s,
        `$1  // Bundled assets (auto-injected during build)\n${assetsToInject}\n$2`
      );

      console.log(`✅ Injected ${bundledAssets.length} bundled assets into service worker`);
    }

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

injectVersionAndAssets();

