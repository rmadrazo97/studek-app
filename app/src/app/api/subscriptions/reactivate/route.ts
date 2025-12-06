/**
 * POST /api/subscriptions/reactivate
 *
 * Reactivate a canceled subscription before the period ends.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { reactivateSubscription, getUserSubscription } from '@/lib/subscriptions/service';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const subscription = await getUserSubscription(request.auth.userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    await reactivateSubscription(request.auth.userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated',
    });
  } catch (error) {
    console.error('[Subscriptions] Reactivate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reactivate subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
