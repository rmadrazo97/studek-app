/**
 * GET /api/notifications/vapid-key - Get VAPID public key for push subscription
 */

import { NextResponse } from 'next/server';
import { getVapidPublicKey, isPushConfigured } from '@/lib/notifications';

/**
 * GET - Get VAPID public key
 * This endpoint is public (no auth required) as it's needed before subscription
 */
export async function GET() {
  const vapidKey = getVapidPublicKey();
  const isConfigured = isPushConfigured();

  if (!isConfigured || !vapidKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured', configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    vapidPublicKey: vapidKey,
    configured: true,
  });
}
