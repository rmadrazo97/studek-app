/**
 * Firebase Cloud Messaging (FCM) Service
 *
 * Handles sending push notifications to Android devices.
 * Uses Firebase Admin SDK.
 */

import {
  getUserNativePushTokensByPlatform,
  updateNativeTokenLastUsed,
  incrementNativeTokenErrors,
  deactivateNativePushToken,
  createNotificationLog,
  updateNotificationLogStatus,
  isNotificationEnabled,
  isInQuietHours,
} from '@/lib/db/services/notifications';
import type { NativePushToken, NotificationType } from '@/lib/db/types';

// FCM Configuration - expects JSON service account key
const FCM_SERVICE_ACCOUNT = process.env.FCM_SERVICE_ACCOUNT || '';

// Types for Firebase Admin SDK
interface FirebaseApp {
  messaging(): FirebaseMessaging;
}

interface FirebaseMessaging {
  send(message: FCMMessage): Promise<string>;
}

interface FCMMessage {
  token: string;
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number;
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      clickAction?: string;
      channelId?: string;
    };
  };
  data?: Record<string, string>;
}

interface FirebaseCredential {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

// Lazy-loaded Firebase Admin app
let firebaseApp: FirebaseApp | null | undefined = undefined;

async function getFirebaseMessaging(): Promise<FirebaseMessaging | null> {
  if (firebaseApp !== undefined) {
    return firebaseApp?.messaging() || null;
  }

  if (!FCM_SERVICE_ACCOUNT) {
    console.warn('[FCM] Service account not configured. Android push notifications disabled.');
    firebaseApp = null;
    return null;
  }

  try {
    const admin = await import('firebase-admin');

    // Parse service account JSON
    let credential: FirebaseCredential;
    try {
      credential = JSON.parse(FCM_SERVICE_ACCOUNT);
    } catch {
      console.error('[FCM] Invalid service account JSON');
      firebaseApp = null;
      return null;
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credential as admin.ServiceAccount),
    }) as unknown as FirebaseApp;

    console.log('[FCM] Firebase Admin initialized');
    return firebaseApp.messaging();
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Admin:', error);
    firebaseApp = null;
    return null;
  }
}

export interface FCMPayload {
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  color?: string;
  sound?: string;
  tag?: string;
  channelId?: string;
  url?: string;
  data?: Record<string, string>;
}

export interface SendFCMResult {
  success: boolean;
  token_id: string;
  log_id?: string;
  message_id?: string;
  error?: string;
}

/**
 * Send FCM notification to a single device
 */
export async function sendFCMToDevice(
  token: NativePushToken,
  payload: FCMPayload,
  notificationType: NotificationType
): Promise<SendFCMResult> {
  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    return {
      success: false,
      token_id: token.id,
      error: 'FCM not configured',
    };
  }

  // Create notification log
  const log = createNotificationLog({
    user_id: token.user_id,
    type: notificationType,
    channel: 'push',
    title: payload.title,
    body: payload.body,
    subscription_id: token.id,
  });

  try {
    const message: FCMMessage = {
      token: token.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      android: {
        priority: 'high',
        ttl: 86400000, // 24 hours in ms
        notification: {
          icon: payload.icon || 'ic_notification',
          color: payload.color || '#22d3ee',
          sound: payload.sound || 'default',
          tag: payload.tag || notificationType,
          channelId: payload.channelId || 'studek_notifications',
        },
      },
      data: {
        url: payload.url || '/study',
        type: notificationType,
        ...payload.data,
      },
    };

    const messageId = await messaging.send(message);

    updateNotificationLogStatus(log.id, 'sent');
    updateNativeTokenLastUsed(token.id);

    return {
      success: true,
      token_id: token.id,
      log_id: log.id,
      message_id: messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[FCM] Failed to send to device:`, errorMessage);

    updateNotificationLogStatus(log.id, 'failed', { error_message: errorMessage });

    // Handle specific errors
    if (
      errorMessage.includes('not-registered') ||
      errorMessage.includes('invalid-registration-token') ||
      errorMessage.includes('registration-token-not-registered')
    ) {
      deactivateNativePushToken(token.id);
    } else {
      incrementNativeTokenErrors(token.id);
    }

    return {
      success: false,
      token_id: token.id,
      log_id: log.id,
      error: errorMessage,
    };
  }
}

/**
 * Send FCM notification to all Android devices for a user
 */
export async function sendFCMToUser(
  userId: string,
  payload: FCMPayload,
  notificationType: NotificationType
): Promise<{
  sent: number;
  failed: number;
  results: SendFCMResult[];
}> {
  // Check if notifications are enabled
  if (!isNotificationEnabled(userId, notificationType, 'push')) {
    return { sent: 0, failed: 0, results: [] };
  }

  if (isInQuietHours(userId)) {
    console.log(`[FCM] Skipping for ${userId} - in quiet hours`);
    return { sent: 0, failed: 0, results: [] };
  }

  const tokens = getUserNativePushTokensByPlatform(userId, 'android');

  if (tokens.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results: SendFCMResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    const result = await sendFCMToDevice(token, payload, notificationType);
    results.push(result);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, results };
}

/**
 * Check if FCM is configured
 */
export function isFCMConfigured(): boolean {
  return !!FCM_SERVICE_ACCOUNT;
}
