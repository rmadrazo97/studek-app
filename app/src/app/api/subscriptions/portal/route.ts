/**
 * POST /api/subscriptions/portal
 *
 * Create a Stripe Customer Portal session for managing subscription.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { createPortalSession } from '@/lib/subscriptions/stripe';
import type { GetPortalRequest, GetPortalResponse } from '@/lib/subscriptions/types';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<GetPortalResponse | { error: string }>> {
  try {
    const body = (await request.json()) as GetPortalRequest;
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing required field: returnUrl' },
        { status: 400 }
      );
    }

    const session = await createPortalSession(request.auth.userId, returnUrl);

    return NextResponse.json(session);
  } catch (error) {
    console.error('[Subscriptions] Portal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create portal session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
