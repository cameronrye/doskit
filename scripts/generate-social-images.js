/**
 * Generate social media preview images from SVG sources
 * Converts SVG files to PNG format for Open Graph and Twitter Cards
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const distDir = join(__dirname, '..', 'dist');

// Ensure directories exist
try {
  mkdirSync(publicDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

/**
 * Convert SVG to PNG
 * @param {string} inputPath - Path to input SVG file
 * @param {string} outputPath - Path to output PNG file
 * @param {number} width - Output width in pixels
 * @param {number} height - Output height in pixels
 */
async function convertSvgToPng(inputPath, outputPath, width, height) {
  try {
    const svgBuffer = readFileSync(inputPath);
    
    await sharp(svgBuffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(outputPath);
    
    console.log(`✓ Generated: ${outputPath} (${width}x${height})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${outputPath}:`, error.message);
    throw error;
  }
}

/**
 * Generate all social media images
 */
async function generateSocialImages() {
  console.log('🎨 Generating social media preview images...\n');
  
  const images = [
    {
      name: 'Open Graph image',
      input: join(publicDir, 'social-preview.svg'),
      output: join(publicDir, 'og-image.png'),
      width: 1200,
      height: 630
    },
    {
      name: 'GitHub social preview',
      input: join(publicDir, 'github-social-preview.svg'),
      output: join(publicDir, 'github-social.png'),
      width: 1280,
      height: 640
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const image of images) {
    try {
      await convertSvgToPng(image.input, image.output, image.width, image.height);
      successCount++;
    } catch (error) {
      console.error(`Failed to generate ${image.name}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);
  
  // Also copy to dist directory if it exists
  try {
    mkdirSync(distDir, { recursive: true });
    
    for (const image of images) {
      const distOutput = join(distDir, image.output.split('/').pop());
      await sharp(image.output).toFile(distOutput);
      console.log(`✓ Copied to dist: ${distOutput}`);
    }
  } catch (error) {
    // Dist directory might not exist yet, that's okay
    console.log('ℹ Skipping dist copy (directory not found)');
  }
  
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run the script
generateSocialImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

