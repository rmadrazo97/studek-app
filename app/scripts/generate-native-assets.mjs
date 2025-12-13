#!/usr/bin/env node
/**
 * Native App Assets Generator for iOS and Android
 *
 * Generates all required icons and splash screens for App Store submission.
 * Run: npm run generate:native-assets
 *
 * This script creates:
 * - All iOS App Icon sizes (required for App Store)
 * - All Android launcher icon sizes (mipmap)
 * - Android adaptive icon foreground/background
 * - Splash screens for iOS and Android
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// iOS App Icon sizes (all required for App Store)
const IOS_ICONS = [
  { size: 20, scales: [1, 2, 3], idiom: 'iphone' },
  { size: 29, scales: [1, 2, 3], idiom: 'iphone' },
  { size: 40, scales: [2, 3], idiom: 'iphone' },
  { size: 60, scales: [2, 3], idiom: 'iphone' },
  { size: 20, scales: [1, 2], idiom: 'ipad' },
  { size: 29, scales: [1, 2], idiom: 'ipad' },
  { size: 40, scales: [1, 2], idiom: 'ipad' },
  { size: 76, scales: [1, 2], idiom: 'ipad' },
  { size: 83.5, scales: [2], idiom: 'ipad' },
  { size: 1024, scales: [1], idiom: 'ios-marketing' }, // App Store icon
];

// Android mipmap icon sizes
const ANDROID_ICONS = [
  { density: 'mdpi', size: 48 },
  { density: 'hdpi', size: 72 },
  { density: 'xhdpi', size: 96 },
  { density: 'xxhdpi', size: 144 },
  { density: 'xxxhdpi', size: 192 },
];

// Android adaptive icon sizes (foreground should have padding)
const ANDROID_ADAPTIVE_ICONS = [
  { density: 'mdpi', size: 108 },
  { density: 'hdpi', size: 162 },
  { density: 'xhdpi', size: 216 },
  { density: 'xxhdpi', size: 324 },
  { density: 'xxxhdpi', size: 432 },
];

// iOS Splash screen sizes
const IOS_SPLASH_SCREENS = [
  { width: 2048, height: 2732, name: 'Default-Portrait@2x~ipad' }, // 12.9" iPad Pro
  { width: 1668, height: 2388, name: 'Default-Portrait-1668x2388' }, // 11" iPad Pro
  { width: 1668, height: 2224, name: 'Default-Portrait-1668x2224' }, // 10.5" iPad Pro
  { width: 1536, height: 2048, name: 'Default-Portrait-1536x2048' }, // iPad Air/Mini
  { width: 1290, height: 2796, name: 'Default-Portrait-1290x2796' }, // iPhone 14 Pro Max
  { width: 1179, height: 2556, name: 'Default-Portrait-1179x2556' }, // iPhone 14 Pro
  { width: 1284, height: 2778, name: 'Default-Portrait-1284x2778' }, // iPhone 14 Plus
  { width: 1170, height: 2532, name: 'Default-Portrait-1170x2532' }, // iPhone 14/13/12
  { width: 1125, height: 2436, name: 'Default-Portrait-1125x2436' }, // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'Default-Portrait-1242x2688' }, // iPhone XS Max
  { width: 828, height: 1792, name: 'Default-Portrait-828x1792' }, // iPhone XR/11
  { width: 750, height: 1334, name: 'Default-Portrait-750x1334' }, // iPhone 8/7/6s/6
  { width: 640, height: 1136, name: 'Default-Portrait-640x1136' }, // iPhone SE
];

// App colors
const BACKGROUND_COLOR = '#0a0a0a';
const ACCENT_COLOR = '#22d3ee';

async function generateNativeAssets() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('Sharp not installed. Installing...');
    const { execSync } = await import('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    sharp = (await import('sharp')).default;
  }

  const publicDir = path.join(__dirname, '..', 'public');
  const iconSource = path.join(publicDir, 'icons', 'icon.svg');
  const maskableSource = path.join(publicDir, 'icons', 'maskable-icon.svg');

  // Create output directories
  const iosIconsDir = path.join(publicDir, 'capacitor', 'ios');
  const androidIconsDir = path.join(publicDir, 'capacitor', 'android');
  const splashDir = path.join(publicDir, 'splash');

  for (const dir of [iosIconsDir, androidIconsDir, splashDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('\n🍎 Generating iOS App Icons...\n');

  // Generate iOS icons
  const iosContents = {
    images: [],
    info: { version: 1, author: 'xcode' }
  };

  for (const icon of IOS_ICONS) {
    for (const scale of icon.scales) {
      const actualSize = Math.round(icon.size * scale);
      const filename = `AppIcon-${icon.size}x${icon.size}@${scale}x.png`;
      const outputPath = path.join(iosIconsDir, filename);

      try {
        await sharp(iconSource)
          .resize(actualSize, actualSize, { fit: 'contain', background: BACKGROUND_COLOR })
          .flatten({ background: BACKGROUND_COLOR })
          .png({ quality: 100 })
          .toFile(outputPath);

        console.log(`  ✓ ${filename} (${actualSize}x${actualSize})`);

        iosContents.images.push({
          size: `${icon.size}x${icon.size}`,
          idiom: icon.idiom,
          filename: filename,
          scale: `${scale}x`
        });
      } catch (error) {
        console.error(`  ✗ Failed: ${filename} - ${error.message}`);
      }
    }
  }

  // Write iOS Contents.json
  fs.writeFileSync(
    path.join(iosIconsDir, 'Contents.json'),
    JSON.stringify(iosContents, null, 2)
  );
  console.log('  ✓ Contents.json');

  console.log('\n🤖 Generating Android Icons...\n');

  // Generate Android standard icons
  for (const icon of ANDROID_ICONS) {
    const densityDir = path.join(androidIconsDir, `mipmap-${icon.density}`);
    if (!fs.existsSync(densityDir)) {
      fs.mkdirSync(densityDir, { recursive: true });
    }

    const outputPath = path.join(densityDir, 'ic_launcher.png');

    try {
      await sharp(iconSource)
        .resize(icon.size, icon.size, { fit: 'contain', background: BACKGROUND_COLOR })
        .flatten({ background: BACKGROUND_COLOR })
        .png({ quality: 100 })
        .toFile(outputPath);

      console.log(`  ✓ mipmap-${icon.density}/ic_launcher.png (${icon.size}x${icon.size})`);

      // Also create round version
      const roundPath = path.join(densityDir, 'ic_launcher_round.png');
      await sharp(iconSource)
        .resize(icon.size, icon.size, { fit: 'contain', background: BACKGROUND_COLOR })
        .flatten({ background: BACKGROUND_COLOR })
        .composite([{
          input: Buffer.from(`<svg width="${icon.size}" height="${icon.size}"><circle cx="${icon.size/2}" cy="${icon.size/2}" r="${icon.size/2}" fill="white"/></svg>`),
          blend: 'dest-in'
        }])
        .png({ quality: 100 })
        .toFile(roundPath);

      console.log(`  ✓ mipmap-${icon.density}/ic_launcher_round.png (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ✗ Failed: mipmap-${icon.density} - ${error.message}`);
    }
  }

  // Generate Android adaptive icons
  console.log('\n🔄 Generating Android Adaptive Icons...\n');

  for (const icon of ANDROID_ADAPTIVE_ICONS) {
    const densityDir = path.join(androidIconsDir, `mipmap-${icon.density}`);
    if (!fs.existsSync(densityDir)) {
      fs.mkdirSync(densityDir, { recursive: true });
    }

    // Foreground (the icon with safe zone padding - icon should be 66% of size)
    const foregroundPath = path.join(densityDir, 'ic_launcher_foreground.png');
    const iconSize = Math.round(icon.size * 0.66);
    const padding = Math.round((icon.size - iconSize) / 2);

    try {
      // Create a transparent canvas with the icon centered
      const iconBuffer = await sharp(maskableSource)
        .resize(iconSize, iconSize)
        .toBuffer();

      await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{ input: iconBuffer, left: padding, top: padding }])
        .png({ quality: 100 })
        .toFile(foregroundPath);

      console.log(`  ✓ mipmap-${icon.density}/ic_launcher_foreground.png (${icon.size}x${icon.size})`);

      // Background (solid color)
      const backgroundPath = path.join(densityDir, 'ic_launcher_background.png');
      await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: BACKGROUND_COLOR
        }
      })
        .png({ quality: 100 })
        .toFile(backgroundPath);

      console.log(`  ✓ mipmap-${icon.density}/ic_launcher_background.png (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ✗ Failed: adaptive icons for ${icon.density} - ${error.message}`);
    }
  }

  console.log('\n🖼️  Generating Splash Screens...\n');

  // Generate splash screens
  for (const splash of IOS_SPLASH_SCREENS) {
    const outputPath = path.join(splashDir, `${splash.name}.png`);

    try {
      // Load the icon and resize it for splash (centered, ~25% of smaller dimension)
      const iconSize = Math.round(Math.min(splash.width, splash.height) * 0.25);
      const iconBuffer = await sharp(iconSource)
        .resize(iconSize, iconSize)
        .toBuffer();

      // Create splash with centered icon
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: BACKGROUND_COLOR
        }
      })
        .composite([{
          input: iconBuffer,
          left: Math.round((splash.width - iconSize) / 2),
          top: Math.round((splash.height - iconSize) / 2)
        }])
        .png({ quality: 100 })
        .toFile(outputPath);

      console.log(`  ✓ ${splash.name}.png (${splash.width}x${splash.height})`);
    } catch (error) {
      console.error(`  ✗ Failed: ${splash.name}.png - ${error.message}`);
    }
  }

  // Generate Android splash screen
  const androidSplashPath = path.join(splashDir, 'splash.png');
  try {
    const iconSize = 288; // Good size for splash
    const iconBuffer = await sharp(iconSource)
      .resize(iconSize, iconSize)
      .toBuffer();

    await sharp({
      create: {
        width: 2732,
        height: 2732,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
      .composite([{
        input: iconBuffer,
        left: Math.round((2732 - iconSize) / 2),
        top: Math.round((2732 - iconSize) / 2)
      }])
      .png({ quality: 100 })
      .toFile(androidSplashPath);

    console.log(`  ✓ splash.png (2732x2732 - Android universal)`);
  } catch (error) {
    console.error(`  ✗ Failed: splash.png - ${error.message}`);
  }

  // Also generate PWA icons if they don't exist
  console.log('\n📱 Generating PWA Icons...\n');

  const pwaIcons = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 256, name: 'icon-256x256.png' },
    { size: 128, name: 'icon-128x128.png' },
  ];

  const iconsDir = path.join(publicDir, 'icons');
  for (const icon of pwaIcons) {
    const outputPath = path.join(iconsDir, icon.name);
    try {
      await sharp(iconSource)
        .resize(icon.size, icon.size)
        .png({ quality: 100 })
        .toFile(outputPath);
      console.log(`  ✓ icons/${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ✗ Failed: ${icon.name} - ${error.message}`);
    }
  }

  // Generate apple-touch-icon.png
  try {
    await sharp(path.join(publicDir, 'icons', 'apple-touch-icon.svg'))
      .resize(180, 180)
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('  ✓ apple-touch-icon.png (180x180)');
  } catch (error) {
    console.error(`  ✗ Failed: apple-touch-icon.png - ${error.message}`);
  }

  console.log('\n✨ Native asset generation complete!\n');
  console.log('Generated assets:');
  console.log(`  📁 public/capacitor/ios/ - iOS App Icons + Contents.json`);
  console.log(`  📁 public/capacitor/android/ - Android launcher icons`);
  console.log(`  📁 public/splash/ - Splash screens for iOS & Android`);
  console.log(`  📁 public/icons/ - PWA icons`);
  console.log('\nNext steps:');
  console.log('  1. Run: npx cap add ios && npx cap add android');
  console.log('  2. Copy icons to native projects or run capacitor:sync');
  console.log('  3. In Xcode: Replace AppIcon.appiconset with generated icons');
  console.log('  4. In Android Studio: Replace res/mipmap-* folders');
}

generateNativeAssets().catch(console.error);
