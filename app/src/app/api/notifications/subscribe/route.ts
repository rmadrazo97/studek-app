/**
 * POST /api/notifications/subscribe - Subscribe to push notifications
 * DELETE /api/notifications/subscribe - Unsubscribe from push notifications
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  upsertPushSubscription,
  deletePushSubscription,
  getUserPushSubscriptions,
} from '@/lib/notifications';

/**
 * POST - Subscribe to push notifications
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json();

    // Validate subscription data
    if (!body.subscription) {
      return NextResponse.json(
        { error: 'Missing subscription data' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = body.subscription;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription format. Missing endpoint or keys.' },
        { status: 400 }
      );
    }

    // Get device info from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const deviceName = body.deviceName || detectDeviceName(userAgent);

    // Create or update subscription
    const subscription = upsertPushSubscription({
      user_id: userId,
      endpoint,
      p256dh_key: keys.p256dh,
      auth_key: keys.auth,
      device_name: deviceName,
      user_agent: userAgent,
    });

    return NextResponse.json({
      message: 'Subscribed to push notifications',
      subscription: {
        id: subscription.id,
        deviceName: subscription.device_name,
        createdAt: subscription.created_at,
      },
    });
  } catch (error) {
    return handleApiError('POST /api/notifications/subscribe', error, 'Failed to subscribe');
  }
});

/**
 * DELETE - Unsubscribe from push notifications
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();

    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400 }
      );
    }

    const deleted = deletePushSubscription(body.endpoint);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Unsubscribed from push notifications',
    });
  } catch (error) {
    return handleApiError('DELETE /api/notifications/subscribe', error, 'Failed to unsubscribe');
  }
});

/**
 * GET - List user's push subscriptions
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const subscriptions = getUserPushSubscriptions(userId);

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        deviceName: sub.device_name,
        lastUsedAt: sub.last_used_at,
        createdAt: sub.created_at,
      })),
    });
  } catch (error) {
    return handleApiError('GET /api/notifications/subscribe', error, 'Failed to get subscriptions');
  }
});

/**
 * Detect device name from user agent
 */
function detectDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';

  // Mobile devices
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android.*Mobile/i.test(userAgent)) return 'Android Phone';
  if (/Android/i.test(userAgent)) return 'Android Tablet';

  // Desktop browsers
  if (/Chrome/i.test(userAgent)) {
    if (/Edg/i.test(userAgent)) return 'Microsoft Edge';
    if (/OPR/i.test(userAgent)) return 'Opera';
    return 'Chrome';
  }
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Safari/i.test(userAgent)) return 'Safari';

  // Operating systems
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Mac/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux';

  return 'Web Browser';
}
