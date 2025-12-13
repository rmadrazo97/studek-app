/**
 * Apple Push Notification Service (APNs)
 *
 * Handles sending push notifications to iOS devices.
 * Uses the apns2 library with JWT-based authentication.
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

// APNs Configuration
const APNS_KEY_ID = process.env.APNS_KEY_ID || '';
const APNS_TEAM_ID = process.env.APNS_TEAM_ID || '';
const APNS_KEY = process.env.APNS_KEY || ''; // .p8 key contents
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID || 'com.studek.app';
const APNS_PRODUCTION = process.env.NODE_ENV === 'production';

// Type for apns2 library
interface APNsClient {
  send(notification: APNsNotification, deviceToken: string): Promise<APNsResponse>;
}

interface APNsNotification {
  aps: {
    alert?: {
      title?: string;
      subtitle?: string;
      body?: string;
    };
    badge?: number;
    sound?: string;
    'content-available'?: number;
    'mutable-content'?: number;
    category?: string;
    'thread-id'?: string;
  };
  [key: string]: unknown;
}

interface APNsResponse {
  sent: boolean;
  error?: {
    reason: string;
    statusCode: number;
  };
}

// Lazy-loaded APNs client
let apnsClient: APNsClient | null | undefined = undefined;

async function getAPNsClient(): Promise<APNsClient | null> {
  if (apnsClient !== undefined) {
    return apnsClient;
  }

  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_KEY) {
    console.warn('[APNs] APNs credentials not configured. iOS push notifications disabled.');
    apnsClient = null;
    return null;
  }

  try {
    const apns2 = await import('apns2');

    // Create client with JWT authentication
    apnsClient = new apns2.default({
      team: APNS_TEAM_ID,
      keyId: APNS_KEY_ID,
      signingKey: APNS_KEY,
      defaultTopic: APNS_BUNDLE_ID,
      host: APNS_PRODUCTION
        ? 'api.push.apple.com'
        : 'api.sandbox.push.apple.com',
    }) as APNsClient;

    console.log('[APNs] Client initialized');
    return apnsClient;
  } catch (error) {
    console.error('[APNs] Failed to initialize client:', error);
    apnsClient = null;
    return null;
  }
}

export interface APNsPayload {
  title: string;
  body: string;
  subtitle?: string;
  badge?: number;
  sound?: string;
  category?: string;
  threadId?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface SendAPNsResult {
  success: boolean;
  token_id: string;
  log_id?: string;
  error?: string;
}

/**
 * Send APNs notification to a single device
 */
export async function sendAPNsToDevice(
  token: NativePushToken,
  payload: APNsPayload,
  notificationType: NotificationType
): Promise<SendAPNsResult> {
  const client = await getAPNsClient();

  if (!client) {
    return {
      success: false,
      token_id: token.id,
      error: 'APNs not configured',
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
    const notification: APNsNotification = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
          subtitle: payload.subtitle,
        },
        badge: payload.badge,
        sound: payload.sound || 'default',
        'mutable-content': 1,
        category: payload.category || notificationType,
      },
      // Custom data
      url: payload.url || '/study',
      type: notificationType,
      ...payload.data,
    };

    const response = await client.send(notification, token.token);

    if (response.sent) {
      updateNotificationLogStatus(log.id, 'sent');
      updateNativeTokenLastUsed(token.id);

      return {
        success: true,
        token_id: token.id,
        log_id: log.id,
      };
    } else {
      const errorReason = response.error?.reason || 'Unknown error';
      updateNotificationLogStatus(log.id, 'failed', { error_message: errorReason });

      // Handle specific errors
      if (
        errorReason === 'BadDeviceToken' ||
        errorReason === 'Unregistered' ||
        errorReason === 'ExpiredToken'
      ) {
        deactivateNativePushToken(token.id);
      } else {
        incrementNativeTokenErrors(token.id);
      }

      return {
        success: false,
        token_id: token.id,
        log_id: log.id,
        error: errorReason,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[APNs] Failed to send to device:`, errorMessage);

    updateNotificationLogStatus(log.id, 'failed', { error_message: errorMessage });
    incrementNativeTokenErrors(token.id);

    return {
      success: false,
      token_id: token.id,
      log_id: log.id,
      error: errorMessage,
    };
  }
}

/**
 * Send APNs notification to all iOS devices for a user
 */
export async function sendAPNsToUser(
  userId: string,
  payload: APNsPayload,
  notificationType: NotificationType
): Promise<{
  sent: number;
  failed: number;
  results: SendAPNsResult[];
}> {
  // Check if notifications are enabled
  if (!isNotificationEnabled(userId, notificationType, 'push')) {
    return { sent: 0, failed: 0, results: [] };
  }

  if (isInQuietHours(userId)) {
    console.log(`[APNs] Skipping for ${userId} - in quiet hours`);
    return { sent: 0, failed: 0, results: [] };
  }

  const tokens = getUserNativePushTokensByPlatform(userId, 'ios');

  if (tokens.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results: SendAPNsResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    const result = await sendAPNsToDevice(token, payload, notificationType);
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
 * Check if APNs is configured
 */
export function isAPNsConfigured(): boolean {
  return !!(APNS_KEY_ID && APNS_TEAM_ID && APNS_KEY);
}
