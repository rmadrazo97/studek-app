/**
 * Push Notification Service
 *
 * Handles sending push notifications using VAPID protocol.
 * Uses the web-push library for sending notifications.
 */

import {
  getUserPushSubscriptions,
  updateSubscriptionLastUsed,
  incrementSubscriptionErrors,
  deactivatePushSubscription,
  createNotificationLog,
  updateNotificationLogStatus,
  isNotificationEnabled,
  isInQuietHours,
} from '@/lib/db/services/notifications';
import type { NotificationType, PushSubscription } from '@/lib/db/types';

// VAPID keys should be generated once and stored as environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@studek.com';

// Type for web-push library (dynamically imported)
interface WebPushLib {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options?: { TTL?: number; urgency?: string }
  ) => Promise<{ statusCode: number }>;
}

// Lazy-loaded web-push client
let webPushClient: WebPushLib | null | undefined = undefined;

async function getWebPushClient(): Promise<WebPushLib | null> {
  if (webPushClient !== undefined) {
    return webPushClient;
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured. Push notifications disabled.');
    webPushClient = null;
    return null;
  }

  try {
    const webPush = await import('web-push');
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    webPushClient = webPush as unknown as WebPushLib;
    return webPushClient;
  } catch {
    console.warn('[Push] web-push package not available. Push notifications disabled.');
    webPushClient = null;
    return null;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

export interface SendPushResult {
  success: boolean;
  subscription_id: string;
  log_id?: string;
  error?: string;
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushNotificationPayload,
  notificationType: NotificationType
): Promise<SendPushResult> {
  const webPush = await getWebPushClient();

  if (!webPush) {
    return {
      success: false,
      subscription_id: subscription.id,
      error: 'Push service not configured',
    };
  }

  // Create notification log
  const log = createNotificationLog({
    user_id: subscription.user_id,
    type: notificationType,
    channel: 'push',
    title: payload.title,
    body: payload.body,
    subscription_id: subscription.id,
  });

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    };

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      url: payload.url || '/study',
      tag: payload.tag || notificationType,
      data: payload.data,
      actions: payload.actions || [
        { action: 'study', title: 'Study Now' },
        { action: 'later', title: 'Later' },
      ],
    });

    await webPush.sendNotification(pushSubscription, payloadString, {
      TTL: 86400, // 24 hours
      urgency: 'normal',
    });

    // Update log and subscription
    updateNotificationLogStatus(log.id, 'sent');
    updateSubscriptionLastUsed(subscription.id);

    return {
      success: true,
      subscription_id: subscription.id,
      log_id: log.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Push] Failed to send to ${subscription.endpoint}:`, errorMessage);

    // Update log with error
    updateNotificationLogStatus(log.id, 'failed', { error_message: errorMessage });

    // Handle specific errors
    if (errorMessage.includes('410') || errorMessage.includes('expired')) {
      // Subscription has expired or been unsubscribed
      deactivatePushSubscription(subscription.id);
    } else {
      // Other error - increment error count
      incrementSubscriptionErrors(subscription.id);
    }

    return {
      success: false,
      subscription_id: subscription.id,
      log_id: log.id,
      error: errorMessage,
    };
  }
}

/**
 * Send a push notification to all of a user's devices
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
  notificationType: NotificationType
): Promise<{
  sent: number;
  failed: number;
  results: SendPushResult[];
}> {
  // Check if notifications are enabled and not in quiet hours
  if (!isNotificationEnabled(userId, notificationType, 'push')) {
    return { sent: 0, failed: 0, results: [] };
  }

  if (isInQuietHours(userId)) {
    console.log(`[Push] Skipping notification for ${userId} - in quiet hours`);
    return { sent: 0, failed: 0, results: [] };
  }

  const subscriptions = getUserPushSubscriptions(userId);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results: SendPushResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const result = await sendPushToSubscription(subscription, payload, notificationType);
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
 * Send study reminder push notification
 */
export async function sendStudyReminderPush(
  userId: string,
  cardsDue: number,
  streak: number
): Promise<{ sent: number; failed: number }> {
  const title = cardsDue > 0 ? `${cardsDue} cards waiting for you!` : 'Time to study!';

  let body = '';
  if (streak > 0) {
    body = `Keep your ${streak}-day streak alive! 🔥`;
  } else if (cardsDue > 0) {
    body = "Don't let your knowledge slip away.";
  } else {
    body = 'Review your flashcards to stay sharp.';
  }

  return sendPushToUser(
    userId,
    {
      title,
      body,
      url: '/study',
      tag: 'study_reminder',
    },
    'study_reminder'
  );
}

/**
 * Send streak warning push notification
 */
export async function sendStreakWarningPush(
  userId: string,
  streak: number,
  xpNeeded: number
): Promise<{ sent: number; failed: number }> {
  const title = `Your ${streak}-day streak is at risk! 🔥`;
  const body = `Earn ${xpNeeded} more XP before midnight to keep it going!`;

  return sendPushToUser(
    userId,
    {
      title,
      body,
      url: '/study',
      tag: 'streak_warning',
      actions: [
        { action: 'study', title: 'Save Streak' },
        { action: 'later', title: 'Remind Later' },
      ],
    },
    'streak_warning'
  );
}

/**
 * Send cards due push notification
 */
export async function sendCardsDuePush(
  userId: string,
  cardsDue: number
): Promise<{ sent: number; failed: number }> {
  const title = `${cardsDue} cards are due!`;
  const body = 'Review now for optimal retention.';

  return sendPushToUser(
    userId,
    {
      title,
      body,
      url: '/study',
      tag: 'cards_due',
    },
    'cards_due'
  );
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
