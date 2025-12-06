/**
 * POST /api/subscriptions/checkout
 *
 * Create a Stripe Checkout session for subscription.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/subscriptions/stripe';
import type { CreateCheckoutRequest, CreateCheckoutResponse } from '@/lib/subscriptions/types';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<CreateCheckoutResponse | { error: string }>> {
  try {
    const body = (await request.json()) as CreateCheckoutRequest;
    const { planKey, billingCycle, successUrl, cancelUrl } = body;

    if (!planKey || !billingCycle || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: planKey, billingCycle, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Don't allow checkout for free plan
    if (planKey === 'free') {
      return NextResponse.json(
        { error: 'Cannot checkout for free plan' },
        { status: 400 }
      );
    }

    const { user, auth } = request;

    const session = await createCheckoutSession(
      auth.userId,
      user.email,
      user.name || user.email,
      planKey,
      billingCycle,
      successUrl,
      cancelUrl
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error('[Subscriptions] Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
