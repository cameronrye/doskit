#!/usr/bin/env node

/**
 * Icon Generation Script for DosKit PWA
 * 
 * This script generates PWA icons in multiple sizes from the logo.svg file.
 * 
 * Requirements:
 * - Node.js 18+
 * - sharp package (npm install sharp)
 * 
 * Usage:
 *   node scripts/generate-icons.js
 * 
 * Or install sharp and run:
 *   npm install --save-dev sharp
 *   npm run generate-icons
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes to generate
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Maskable icon sizes (with padding for safe area)
const MASKABLE_SIZES = [
  { size: 192, name: 'icon-192x192-maskable.png' },
  { size: 512, name: 'icon-512x512-maskable.png' },
];

const PUBLIC_DIR = join(__dirname, '..', 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const LOGO_PATH = join(PUBLIC_DIR, 'logo.svg');

async function generateIcons() {
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (error) {
      console.error('❌ Error: sharp package is not installed.');
      console.log('\nTo generate icons, install sharp:');
      console.log('  npm install --save-dev sharp');
      console.log('\nThen run this script again:');
      console.log('  node scripts/generate-icons.js');
      console.log('\nAlternatively, you can use an online tool like:');
      console.log('  - https://realfavicongenerator.net/');
      console.log('  - https://www.pwabuilder.com/imageGenerator');
      process.exit(1);
    }

    // Create icons directory if it doesn't exist
    if (!existsSync(ICONS_DIR)) {
      mkdirSync(ICONS_DIR, { recursive: true });
      console.log('✅ Created icons directory');
    }

    // Check if logo.svg exists
    if (!existsSync(LOGO_PATH)) {
      console.error('❌ Error: logo.svg not found at', LOGO_PATH);
      process.exit(1);
    }

    console.log('🎨 Generating PWA icons from logo.svg...\n');

    // Generate standard icons
    for (const { size, name } of ICON_SIZES) {
      const outputPath = join(ICONS_DIR, name);
      
      await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 26, g: 26, b: 26, alpha: 1 }, // #1a1a1a
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Generate maskable icons (with padding for safe area)
    for (const { size, name } of MASKABLE_SIZES) {
      const outputPath = join(ICONS_DIR, name);
      const padding = Math.floor(size * 0.1); // 10% padding for safe area
      
      await sharp(LOGO_PATH)
        .resize(size - padding * 2, size - padding * 2, {
          fit: 'contain',
          background: { r: 102, g: 126, b: 234, alpha: 1 }, // #667eea (theme color)
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 102, g: 126, b: 234, alpha: 1 },
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size}, maskable)`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${ICONS_DIR}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
generateIcons();

