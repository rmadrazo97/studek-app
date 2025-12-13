/**
 * Capacitor Native Platform Utilities
 *
 * This module provides utilities for detecting and interacting with native
 * platforms (iOS/Android) when the app is running via Capacitor.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native platform (iOS or Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Get the current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Check if a Capacitor plugin is available
 */
export function isPluginAvailable(pluginName: string): boolean {
  return Capacitor.isPluginAvailable(pluginName);
}

/**
 * Initialize native platform features
 * Call this once when the app starts
 */
export async function initializeNativePlatform(): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  try {
    // Initialize Status Bar
    await initializeStatusBar();

    // Initialize Keyboard handling
    await initializeKeyboard();

    // Hide splash screen after a short delay
    await hideSplashScreen();

    console.log(`[Capacitor] Initialized for ${getPlatform()}`);
  } catch (error) {
    console.error('[Capacitor] Failed to initialize:', error);
  }
}

/**
 * Initialize status bar styling
 */
async function initializeStatusBar(): Promise<void> {
  if (!isPluginAvailable('StatusBar')) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Set dark content (light icons) for our dark theme
    await StatusBar.setStyle({ style: Style.Dark });

    // Make status bar overlay the content on iOS
    if (isIOS()) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }

    // Set background color on Android
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    }
  } catch (error) {
    console.error('[Capacitor] StatusBar init failed:', error);
  }
}

/**
 * Initialize keyboard handling
 */
async function initializeKeyboard(): Promise<void> {
  if (!isPluginAvailable('Keyboard')) return;

  try {
    const { Keyboard } = await import('@capacitor/keyboard');

    // Configure keyboard behavior
    if (isIOS()) {
      // Resize the app when keyboard appears (configured in capacitor.config.ts)
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    }
  } catch (error) {
    console.error('[Capacitor] Keyboard init failed:', error);
  }
}

/**
 * Hide the splash screen
 */
async function hideSplashScreen(): Promise<void> {
  if (!isPluginAvailable('SplashScreen')) return;

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');

    // Wait a moment for the app to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch (error) {
    console.error('[Capacitor] SplashScreen hide failed:', error);
  }
}

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(
  style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'
): Promise<void> {
  if (!isNativePlatform() || !isPluginAvailable('Haptics')) {
    return;
  }

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import(
      '@capacitor/haptics'
    );

    switch (style) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch (error) {
    // Silently fail on haptics - not critical
  }
}

/**
 * Trigger selection haptic feedback (for button presses, toggles, etc.)
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (!isNativePlatform() || !isPluginAvailable('Haptics')) {
    return;
  }

  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch {
    // Silently fail
  }
}
