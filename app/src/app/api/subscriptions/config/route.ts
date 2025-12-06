/**
 * GET /api/subscriptions/config
 *
 * Get public subscription configuration (Stripe publishable key).
 */

import { NextResponse } from 'next/server';
import { getPublishableKey } from '@/lib/subscriptions/stripe';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    stripePublishableKey: getPublishableKey(),
  });
}
