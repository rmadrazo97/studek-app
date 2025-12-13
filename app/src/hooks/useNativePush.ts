/**
 * Native Push Notifications Hook
 *
 * Handles Capacitor push notifications for iOS (APNs) and Android (FCM).
 * Automatically registers device tokens with the backend when the user is authenticated.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/stores/auth';
import { isNativePlatform, getPlatform } from '@/lib/capacitor/native';

// Types for Capacitor PushNotifications
interface PushNotificationToken {
  value: string;
}

interface PushNotificationActionPerformed {
  actionId: string;
  inputValue?: string;
  notification: PushNotificationSchema;
}

interface PushNotificationSchema {
  title?: string;
  subtitle?: string;
  body?: string;
  id: string;
  tag?: string;
  badge?: number;
  data: Record<string, unknown>;
  click_action?: string;
  link?: string;
}

interface PushNotificationsPlugin {
  checkPermissions(): Promise<{ receive: string }>;
  requestPermissions(): Promise<{ receive: string }>;
  register(): Promise<void>;
  addListener(
    eventName: 'registration',
    listenerFunc: (token: PushNotificationToken) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'registrationError',
    listenerFunc: (error: { error: string }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'pushNotificationReceived',
    listenerFunc: (notification: PushNotificationSchema) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'pushNotificationActionPerformed',
    listenerFunc: (notification: PushNotificationActionPerformed) => void
  ): Promise<{ remove: () => void }>;
  removeAllListeners(): Promise<void>;
}

// Dynamically import Capacitor PushNotifications
async function getPushNotifications(): Promise<PushNotificationsPlugin | null> {
  if (!isNativePlatform()) return null;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    return PushNotifications as unknown as PushNotificationsPlugin;
  } catch {
    console.warn('[NativePush] @capacitor/push-notifications not available');
    return null;
  }
}

// Get device info for registration
async function getDeviceInfo(): Promise<{
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}> {
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return {
      deviceName: info.name || undefined,
      deviceModel: info.model || undefined,
      osVersion: info.osVersion || undefined,
      appVersion: undefined, // Could add App plugin for this
    };
  } catch {
    return {};
  }
}

/**
 * Hook to manage native push notifications
 */
export function useNativePush() {
  const { isAuthenticated, token } = useAuth();
  const registeredRef = useRef(false);
  const listenersRef = useRef<Array<{ remove: () => void }>>([]);

  /**
   * Register device token with backend
   */
  const registerTokenWithBackend = useCallback(
    async (deviceToken: string) => {
      if (!token) return;

      const platform = getPlatform();
      if (platform !== 'ios' && platform !== 'android') return;

      try {
        const deviceInfo = await getDeviceInfo();

        const response = await fetch('/api/notifications/native-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            token: deviceToken,
            platform,
            ...deviceInfo,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[NativePush] Failed to register token:', error);
        } else {
          console.log('[NativePush] Token registered successfully');
        }
      } catch (error) {
        console.error('[NativePush] Error registering token:', error);
      }
    },
    [token]
  );

  /**
   * Initialize push notifications
   */
  const initializePush = useCallback(async () => {
    if (registeredRef.current) return;

    const PushNotifications = await getPushNotifications();
    if (!PushNotifications) return;

    try {
      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        // Request permission
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          console.log('[NativePush] Permission denied');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('[NativePush] Permission not granted:', permStatus.receive);
        return;
      }

      // Set up listeners
      const registrationListener = await PushNotifications.addListener(
        'registration',
        (token: PushNotificationToken) => {
          console.log('[NativePush] Registration successful:', token.value.substring(0, 20) + '...');
          registerTokenWithBackend(token.value);
        }
      );
      listenersRef.current.push(registrationListener);

      const errorListener = await PushNotifications.addListener(
        'registrationError',
        (error: { error: string }) => {
          console.error('[NativePush] Registration error:', error.error);
        }
      );
      listenersRef.current.push(errorListener);

      const receivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('[NativePush] Notification received:', notification.title);
          // Could show local notification or update UI here
        }
      );
      listenersRef.current.push(receivedListener);

      const actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: PushNotificationActionPerformed) => {
          console.log('[NativePush] Action performed:', action.actionId);
          // Handle notification tap - navigate to relevant page
          const data = action.notification.data;
          if (data?.url && typeof window !== 'undefined') {
            window.location.href = data.url as string;
          }
        }
      );
      listenersRef.current.push(actionListener);

      // Register with APNs/FCM
      await PushNotifications.register();
      registeredRef.current = true;

      console.log('[NativePush] Initialized successfully');
    } catch (error) {
      console.error('[NativePush] Initialization error:', error);
    }
  }, [registerTokenWithBackend]);

  /**
   * Cleanup listeners
   */
  const cleanup = useCallback(async () => {
    for (const listener of listenersRef.current) {
      listener.remove();
    }
    listenersRef.current = [];
    registeredRef.current = false;
  }, []);

  // Initialize when authenticated on native platform
  useEffect(() => {
    if (isAuthenticated && isNativePlatform()) {
      initializePush();
    }

    return () => {
      cleanup();
    };
  }, [isAuthenticated, initializePush, cleanup]);

  return {
    initializePush,
    cleanup,
  };
}

/**
 * Request push notification permissions manually
 */
export async function requestPushPermission(): Promise<boolean> {
  const PushNotifications = await getPushNotifications();
  if (!PushNotifications) return false;

  try {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function checkPushPermission(): Promise<boolean> {
  const PushNotifications = await getPushNotifications();
  if (!PushNotifications) return false;

  try {
    const result = await PushNotifications.checkPermissions();
    return result.receive === 'granted';
  } catch {
    return false;
  }
}
