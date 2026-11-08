#!/usr/bin/env node

/**
 * Icon Generation Script for DosKit PWA
 *
 * This script generates PWA icons in multiple sizes from the logo.svg file.
 * It needs the Node.js version that package.json's engines field gives, and
 * sharp, one of the devDependencies that npm ci installs.
 *
 * logo.svg's text is set in Courier New, which each machine renders with the
 * fonts it has, so the icons come out differently from one machine to another.
 * Commit only the icons a change is meant for (see public/icons/README.md).
 *
 * Usage:
 *   npm run generate-icons
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
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

// Apple touch icon sizes: iPhones with 3x screens use 180x180 and those with 2x ones
// 120x120, while iPads scale the 180x180 one down
const APPLE_TOUCH_SIZES = [
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
];

// The theme colour, #667eea. The maskable and Apple touch icons are flattened onto it,
// since logo.svg's corners and margins are transparent, and launchers fill those with a
// colour of their own and iOS with black. The background given to resize() fills only
// the bars that fit: 'contain' adds, and a square logo gets none.
const THEME_COLOR = { r: 102, g: 126, b: 234, alpha: 1 };

const PUBLIC_DIR = join(__dirname, '..', 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const LOGO_PATH = join(PUBLIC_DIR, 'logo.svg');

async function generateIcons() {
  try {
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
          background: THEME_COLOR,
        })
        .flatten({ background: THEME_COLOR })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: THEME_COLOR,
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size}, maskable)`);
    }

    // Generate the Apple touch icons, opaque like the maskable ones
    for (const { size, name } of APPLE_TOUCH_SIZES) {
      const outputPath = join(ICONS_DIR, name);

      await sharp(LOGO_PATH)
        .resize(size, size, { fit: 'contain', background: THEME_COLOR })
        .flatten({ background: THEME_COLOR })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size}, Apple touch icon)`);
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
