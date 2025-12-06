/**
 * POST /api/subscriptions/cancel
 *
 * Cancel the current user's subscription at period end.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { cancelSubscription, getUserSubscription } from '@/lib/subscriptions/service';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const subscription = await getUserSubscription(request.auth.userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (subscription.planKey === 'free') {
      return NextResponse.json(
        { error: 'Cannot cancel free plan' },
        { status: 400 }
      );
    }

    await cancelSubscription(request.auth.userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
    });
  } catch (error) {
    console.error('[Subscriptions] Cancel error:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
