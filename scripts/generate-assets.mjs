#!/usr/bin/env node
/**
 * Generate Favicons and OG Image
 * Uses sharp to process images for web optimization
 *
 * Run: node scripts/generate-assets.mjs
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const imagesDir = join(publicDir, 'images');

async function generateFavicons() {
  const logoPath = join(imagesDir, 'Logo_Header.png');

  if (!existsSync(logoPath)) {
    console.error('❌ Logo_Header.png not found in public/images/');
    return false;
  }

  console.log('🔧 Generating favicons from Logo_Header.png...');

  try {
    // Generate 32x32 favicon PNG
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'favicon-32.png'));
    console.log('  ✓ favicon-32.png (32x32)');

    // Generate Apple Touch Icon (180x180)
    await sharp(logoPath)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));
    console.log('  ✓ apple-touch-icon.png (180x180)');

    // Generate favicon.ico (actually a PNG, but most browsers accept it)
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'favicon.ico'));
    console.log('  ✓ favicon.ico (32x32 PNG)');

    return true;
  } catch (err) {
    console.error('❌ Failed to generate favicons:', err.message);
    return false;
  }
}

async function generateOgImage() {
  const slidePath = join(imagesDir, 'slide1.jpg');
  const outputPath = join(imagesDir, 'og-default.jpg');

  if (!existsSync(slidePath)) {
    console.error('❌ slide1.jpg not found in public/images/');
    return false;
  }

  console.log('🔧 Generating OG image from slide1.jpg...');

  try {
    // OG images should be 1200x630 for optimal display
    await sharp(slidePath)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    console.log('  ✓ og-default.jpg (1200x630)');

    return true;
  } catch (err) {
    console.error('❌ Failed to generate OG image:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Asset Generation Script\n');

  const faviconResult = await generateFavicons();
  console.log('');
  const ogResult = await generateOgImage();

  console.log('\n---');
  if (faviconResult && ogResult) {
    console.log('✅ All assets generated successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some assets failed to generate.');
    process.exit(1);
  }
}

main();
