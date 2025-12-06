/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events.
 * This endpoint should NOT require authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/lib/subscriptions/stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the raw body as text for signature verification
    const payload = await request.text();

    // Get the Stripe signature from headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const result = await processWebhookEvent(payload, signature);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
