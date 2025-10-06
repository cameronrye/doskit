/**
 * Inject build version into service worker
 * This ensures the service worker file changes on every build,
 * triggering browser update detection
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

// Inject version into service worker
function injectVersion() {
  const swPath = join(__dirname, '../dist/sw.js');
  
  try {
    let swContent = readFileSync(swPath, 'utf8');
    const versionInfo = generateVersion();
    
    // Replace the CACHE_VERSION line
    swContent = swContent.replace(
      /const CACHE_VERSION = ['"]v1['"];/,
      `const CACHE_VERSION = '${versionInfo.version}';`
    );
    
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

injectVersion();

