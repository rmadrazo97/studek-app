# Capacitor Setup Guide for Studek

This guide covers how to build native iOS and Android apps from the Studek PWA using Capacitor.

## Prerequisites

### General Requirements
- Node.js 18+
- npm or yarn

### iOS Development
- macOS with Xcode 15+
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for App Store deployment)

### Android Development
- Android Studio Arctic Fox (2020.3.1) or newer
- Android SDK (API level 22+)
- Java Development Kit (JDK) 17+

## Initial Setup

### 1. Install Capacitor Dependencies

```bash
cd app
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. Install Recommended Capacitor Plugins

```bash
# Essential plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard

# Optional but recommended
npm install @capacitor/haptics @capacitor/local-notifications @capacitor/push-notifications
npm install @capacitor/app @capacitor/storage @capacitor/network
```

### 3. Initialize Capacitor (if not already done)

The `capacitor.config.ts` is already configured. If needed, initialize with:

```bash
npm run capacitor:init
```

### 4. Add Native Platforms

```bash
# Add iOS platform (macOS only)
npx cap add ios

# Add Android platform
npx cap add android
```

## Building for Native Platforms

### Build Process

1. **Build the static export:**
   ```bash
   npm run build:static
   ```
   This creates an optimized static build in the `out/` directory.

2. **Sync with native projects:**
   ```bash
   npx cap sync
   ```
   This copies the web assets and updates native dependencies.

3. **Or use the combined command:**
   ```bash
   npm run capacitor:build
   ```

### iOS Build

```bash
# Open in Xcode
npm run ios

# Or run directly on connected device/simulator
npm run ios:run
```

**In Xcode:**
1. Select your team in Signing & Capabilities
2. Update the Bundle Identifier if needed
3. Build and run on simulator or device

### Android Build

```bash
# Open in Android Studio
npm run android

# Or run directly on connected device/emulator
npm run android:run
```

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Select a device/emulator
3. Click Run

## App Store Deployment

### iOS App Store

1. **Create App Store Connect Record:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app with Bundle ID: `com.studek.app`

2. **Configure Signing:**
   - In Xcode > Signing & Capabilities
   - Enable "Automatically manage signing"
   - Select your team

3. **Archive and Upload:**
   ```bash
   # In Xcode: Product > Archive
   # Then: Distribute App > App Store Connect
   ```

4. **Submit for Review:**
   - Complete app metadata
   - Add screenshots (see screenshot sizes below)
   - Submit for review

### Google Play Store

1. **Generate Signed APK/AAB:**
   - In Android Studio: Build > Generate Signed Bundle/APK
   - Create or use existing keystore
   - Select release build variant

2. **Create Play Console Listing:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Complete store listing

3. **Upload and Publish:**
   - Upload AAB to Production/Beta track
   - Complete content rating questionnaire
   - Submit for review

## Icon and Splash Screen Setup

### Generate PNG Icons

First, generate PNG icons from the SVG sources:

```bash
npm run generate:icons
```

This requires the `sharp` package:
```bash
npm install sharp --save-dev
```

### iOS Icons

Copy generated icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 20x20 @1x, @2x, @3x
- 29x29 @1x, @2x, @3x
- 40x40 @1x, @2x, @3x
- 60x60 @2x, @3x
- 76x76 @1x, @2x
- 83.5x83.5 @2x
- 1024x1024

### Android Icons

Copy to `android/app/src/main/res/`:
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

Also create adaptive icons in:
- `mipmap-*/ic_launcher_foreground.png`
- `mipmap-*/ic_launcher_background.png`

### Splash Screens

Create splash screens in `public/splash/`:

**iOS Sizes:**
- 2048x2732 (12.9" iPad Pro)
- 1668x2388 (11" iPad Pro)
- 1536x2048 (9.7" iPad)
- 1290x2796 (iPhone 14 Pro Max)
- 1179x2556 (iPhone 14 Pro)
- 1170x2532 (iPhone 13/14)

**Android:**
Configure in `capacitor.config.ts` using the SplashScreen plugin.

## App Screenshots

### iOS Screenshots Needed

**iPhone 6.7" Display (1290x2796):**
- Dashboard view
- Study session view
- Create deck view
- Analytics view

**iPhone 5.5" Display (1242x2208):**
- Same 4 screenshots

**iPad Pro 12.9" Display (2048x2732):**
- Same 4 screenshots (if iPad supported)

### Android Screenshots Needed

**Phone (16:9 or taller):**
- Min 2, max 8 screenshots
- 320px - 3840px per side

## Configuration Reference

### capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  appId: "com.studek.app",
  appName: "Studek",
  webDir: "out",
  // ... see full config in app/capacitor.config.ts
};
```

### Key Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `appId` | `com.studek.app` | Bundle/Package identifier |
| `appName` | `Studek` | App display name |
| `webDir` | `out` | Static export directory |
| `androidScheme` | `https` | URL scheme for Android |
| `iosScheme` | `https` | URL scheme for iOS |

## Troubleshooting

### iOS Issues

**"Signing requires a development team":**
- Open Xcode > Select target > Signing & Capabilities > Select Team

**CocoaPods issues:**
```bash
cd ios/App
pod install --repo-update
```

### Android Issues

**Gradle sync failed:**
- File > Sync Project with Gradle Files
- Check Java version matches project requirements

**SDK version issues:**
- Update `android/app/build.gradle` with correct SDK versions

### General Issues

**Changes not appearing:**
```bash
npx cap sync
```

**Complete rebuild:**
```bash
rm -rf ios android
npx cap add ios
npx cap add android
npm run capacitor:build
```

## Live Reload During Development

For faster development, enable live reload:

1. Update `capacitor.config.ts`:
```typescript
server: {
  url: "http://YOUR_LOCAL_IP:3000",
  cleartext: true,
}
```

2. Start dev server:
```bash
npm run dev
```

3. Run on device:
```bash
npx cap run ios -l --external
# or
npx cap run android -l --external
```

**Note:** Remove the `server.url` before production builds!

## Native Plugin Usage

### Haptics (Feedback)

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

await Haptics.impact({ style: ImpactStyle.Medium });
```

### Local Notifications (Study Reminders)

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

await LocalNotifications.schedule({
  notifications: [{
    title: "Time to study!",
    body: "You have cards due for review",
    id: 1,
    schedule: { at: new Date(Date.now() + 1000 * 60 * 60) },
  }]
});
```

### Network Status

```typescript
import { Network } from '@capacitor/network';

const status = await Network.getStatus();
console.log('Online:', status.connected);
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
