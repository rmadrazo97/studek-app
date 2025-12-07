import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.studek.app",
  appName: "Studek",
  webDir: "out",
  // Server configuration for development
  server: {
    // For development, point to your local server
    // url: "http://localhost:3000",
    // cleartext: true,
    // For production, the app will use the bundled web assets
    androidScheme: "https",
    iosScheme: "https",
  },
  // iOS specific configuration
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: true,
    // Enable edge-to-edge design
    backgroundColor: "#0a0a0a",
  },
  // Android specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#0a0a0a",
    // Build variant (debug/release)
    buildOptions: {
      signingType: "apksigner",
    },
  },
  // Plugins configuration
  plugins: {
    // Splash Screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Status Bar configuration
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0a0a0a",
    },
    // Keyboard configuration
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    // Push Notifications (for future use)
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Local Notifications for study reminders
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
      sound: "default",
    },
    // Haptics for feedback
    Haptics: {
      impactMedium: true,
    },
    // App Updates
    AppUpdate: {
      appId: "com.studek.app",
    },
  },
  // Logging
  loggingBehavior: "none",
};

export default config;
