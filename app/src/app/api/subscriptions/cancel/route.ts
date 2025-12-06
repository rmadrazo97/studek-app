/**
 * POST /api/subscriptions/cancel
 *
 * Cancel the current user's subscription at period end.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { getUserSubscription, cancelSubscriptionAtPeriodEnd } from '@/lib/subscriptions/subscriptions';
import { cancelStripeSubscription } from '@/lib/subscriptions/stripe';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const subscription = getUserSubscription(request.auth.userId);

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

    // Cancel in Stripe if we have a Stripe subscription
    if (subscription.stripeSubscriptionId) {
      await cancelStripeSubscription(subscription.stripeSubscriptionId);
    }

    // Mark as canceling in our database
    cancelSubscriptionAtPeriodEnd(request.auth.userId);

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
