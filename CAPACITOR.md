# Capacitor Setup Guide for Studek

This guide covers how to build native iOS and Android apps from the Studek PWA using Capacitor.

## Quick Start

```bash
cd app

# 1. Generate all native assets (icons, splash screens)
npm run generate:native-assets

# 2. Add native platforms
npx cap add ios
npx cap add android

# 3. Build and sync
npm run capacitor:build

# 4. Open in IDE
npm run ios      # Opens Xcode
npm run android  # Opens Android Studio
```

## Prerequisites

### General Requirements
- Node.js 20+ (required for sharp image processing)
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

### Generate All Native Assets

Run the comprehensive asset generator to create all required icons and splash screens:

```bash
npm run generate:native-assets
```

This generates:
- **iOS App Icons**: All 20 required sizes with Contents.json
- **Android Launcher Icons**: mdpi through xxxhdpi
- **Android Adaptive Icons**: Foreground and background layers
- **Splash Screens**: All iOS device sizes + Android universal
- **PWA Icons**: Updated PNG versions

Generated assets are placed in:
```
public/
├── capacitor/
│   ├── ios/           # iOS App Icon set with Contents.json
│   └── android/       # Android mipmap-* folders
├── splash/            # Splash screens for all devices
└── icons/             # PWA icons
```

### Copy Icons to Native Projects

After running `npx cap add ios` and `npx cap add android`:

**iOS:**
```bash
# Replace the entire AppIcon.appiconset folder
cp -r public/capacitor/ios/* ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

**Android:**
```bash
# Copy mipmap folders
cp -r public/capacitor/android/mipmap-* android/app/src/main/res/
```

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

## Native Behavior (Built-in)

The app includes native optimizations that activate automatically on iOS/Android:

### Automatic Features
- **Status Bar**: Dark style with app background color
- **Keyboard Handling**: Proper resize behavior
- **Splash Screen**: Auto-hide after app loads
- **Haptic Feedback**: Available via `useCapacitor` hook
- **Safe Areas**: CSS handles notch/Dynamic Island

### Using Native Features in Code

```typescript
import { useCapacitor } from '@/hooks/useCapacitor';

function MyComponent() {
  const { isNative, isIOS, isAndroid, hapticMedium, hapticSuccess } = useCapacitor();

  const handlePress = () => {
    hapticMedium(); // Triggers haptic feedback on native
    // ... your logic
  };

  return (
    <button onClick={handlePress}>
      {isNative ? 'Native App' : 'Web App'}
    </button>
  );
}
```

---

## App Store Submission Checklist

### iOS App Store Checklist

#### Before Submission
- [ ] Apple Developer Program membership ($99/year)
- [ ] App Store Connect app record created
- [ ] Bundle ID registered: `com.studek.app`
- [ ] App icons generated and copied to Xcode
- [ ] Splash screens configured
- [ ] Signing certificate and provisioning profiles set up

#### App Information
- [ ] App name: Studek
- [ ] Subtitle (30 chars): "AI-Powered Flashcards"
- [ ] Category: Education
- [ ] Age Rating: 4+ (no objectionable content)
- [ ] Privacy Policy URL: https://studek.com/privacy
- [ ] Support URL: https://studek.com/help

#### Screenshots Required
| Device | Size | Count |
|--------|------|-------|
| iPhone 6.7" | 1290x2796 | 4-10 |
| iPhone 6.5" | 1242x2688 | 4-10 |
| iPhone 5.5" | 1242x2208 | 4-10 |
| iPad 12.9" | 2048x2732 | 4-10 (if iPad supported) |

**Recommended Screenshots:**
1. Dashboard/Home view
2. Study session (flashcard review)
3. AI deck creation
4. Analytics/Progress view

#### App Store Description
```
Master any subject with zero setup.

Studek combines the world's most powerful spaced repetition algorithm (FSRS) with next-gen AI. Turn PDFs, videos, and notes into intelligent flashcards in seconds.

FEATURES:
• AI-Powered Deck Creation - Generate flashcards from any topic
• FSRS Algorithm - Science-backed memory optimization
• Beautiful Study Experience - Dark mode, haptic feedback
• Progress Tracking - Detailed analytics and streaks
• Offline Support - Study anywhere without internet

Perfect for students, medical professionals, language learners, and anyone who wants to learn faster and remember longer.
```

#### Keywords (100 chars)
```
flashcards,spaced repetition,study,anki,learn,memory,quiz,education,AI,FSRS
```

#### Review Notes
```
Test Account:
Email: reviewer@studek.com
Password: [create test account]

The app requires sign-in to access study features.
Core functionality: Create AI flashcards, study with spaced repetition.
```

---

### Google Play Store Checklist

#### Before Submission
- [ ] Google Play Developer account ($25 one-time)
- [ ] App created in Play Console
- [ ] Keystore created and backed up securely
- [ ] Release AAB built and signed

#### Store Listing
- [ ] App name: Studek
- [ ] Short description (80 chars): "AI-powered flashcards with FSRS spaced repetition"
- [ ] Full description (4000 chars): See iOS description above
- [ ] App category: Education
- [ ] Content rating questionnaire completed

#### Graphics Required
| Asset | Size | Notes |
|-------|------|-------|
| App icon | 512x512 | PNG, 32-bit |
| Feature graphic | 1024x500 | Shown on store page |
| Phone screenshots | 320-3840px | Min 2, max 8 |
| 7" tablet screenshots | Optional | If tablet supported |
| 10" tablet screenshots | Optional | If tablet supported |

#### Data Safety
- [ ] Data collection disclosure completed
- [ ] Privacy policy linked
- [ ] Account deletion method documented

#### App Content
- [ ] Target audience: 13+ or general
- [ ] Ads declaration: No ads
- [ ] In-app purchases: [if applicable]

---

### Pre-Launch Testing

#### iOS TestFlight
1. Archive app in Xcode
2. Upload to App Store Connect
3. Add internal testers (up to 100)
4. Get feedback before public release

#### Android Internal Testing
1. Create internal test track
2. Upload AAB
3. Add tester emails
4. Distribute via Play Store

---

### Common Rejection Reasons & How to Avoid

#### iOS
| Reason | Solution |
|--------|----------|
| Crasher or bugs | Test on multiple devices before submission |
| Incomplete metadata | Fill all required fields |
| Placeholder content | Remove Lorem ipsum, test accounts in screenshots |
| Login wall | Provide demo/test account for reviewers |
| Privacy concerns | Add clear privacy policy, data collection disclosure |

#### Android
| Reason | Solution |
|--------|----------|
| Policy violations | Review latest Play Store policies |
| Broken functionality | Test release build thoroughly |
| Misleading metadata | Ensure screenshots match actual app |
| Data safety issues | Complete data safety form accurately |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
- [App Store Screenshot Generator](https://screenshots.pro)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
