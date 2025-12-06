#!/usr/bin/env node
/**
 * PWA Icon Generator Script
 *
 * Generates all required PWA icons from the source SVG files.
 * Run: npm run generate:icons
 *
 * Requirements:
 * - npm install sharp
 *
 * This script creates:
 * - icon-192x192.png (standard PWA icon)
 * - icon-512x512.png (large PWA icon)
 * - apple-touch-icon.png (180x180 for iOS)
 * - maskable-icon-192x192.png (Android adaptive icon)
 * - maskable-icon-512x512.png (Android adaptive icon large)
 * - favicon-32x32.png
 * - favicon-16x16.png
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('Sharp not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    sharp = require('sharp');
  }

  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const iconConfigs = [
    // Standard PWA icons
    { input: 'icons/icon.svg', output: 'icons/icon-192x192.png', size: 192 },
    { input: 'icons/icon.svg', output: 'icons/icon-512x512.png', size: 512 },
    { input: 'icons/icon.svg', output: 'icons/icon-384x384.png', size: 384 },
    { input: 'icons/icon.svg', output: 'icons/icon-256x256.png', size: 256 },
    { input: 'icons/icon.svg', output: 'icons/icon-128x128.png', size: 128 },
    { input: 'icons/icon.svg', output: 'icons/icon-96x96.png', size: 96 },
    { input: 'icons/icon.svg', output: 'icons/icon-72x72.png', size: 72 },
    { input: 'icons/icon.svg', output: 'icons/icon-48x48.png', size: 48 },

    // Maskable icons (for Android adaptive icons)
    { input: 'icons/maskable-icon.svg', output: 'icons/maskable-icon-192x192.png', size: 192 },
    { input: 'icons/maskable-icon.svg', output: 'icons/maskable-icon-512x512.png', size: 512 },

    // Apple touch icon
    { input: 'icons/apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },

    // Favicons
    { input: 'favicon.svg', output: 'favicon-32x32.png', size: 32 },
    { input: 'favicon.svg', output: 'favicon-16x16.png', size: 16 },
  ];

  console.log('Generating PWA icons...\n');

  for (const config of iconConfigs) {
    const inputPath = path.join(publicDir, config.input);
    const outputPath = path.join(publicDir, config.output);

    try {
      await sharp(inputPath)
        .resize(config.size, config.size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`✓ Generated ${config.output} (${config.size}x${config.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${config.output}: ${error.message}`);
    }
  }

  // Generate ICO file from favicon SVG
  try {
    const icoPath = path.join(publicDir, 'favicon.ico');
    const sizes = [16, 32, 48];

    // Create multi-size ICO by using the 32x32 version
    await sharp(path.join(publicDir, 'favicon.svg'))
      .resize(32, 32)
      .png()
      .toFile(icoPath.replace('.ico', '.png'));

    // For proper ICO, you'd need ico-encoder or similar
    // For now, copy the 32x32 PNG as a fallback
    console.log('\n✓ Note: favicon.ico should be generated from favicon.svg using an ICO converter');
  } catch (error) {
    console.error(`✗ ICO generation note: ${error.message}`);
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\nGenerated icons are in the public/icons/ directory.');
  console.log('Remember to also update your manifest.json with the icon paths.');
}

generateIcons().catch(console.error);
