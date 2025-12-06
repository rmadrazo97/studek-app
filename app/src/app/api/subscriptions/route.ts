/**
 * GET /api/subscriptions
 *
 * Get the current user's subscription status.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { getUserSubscription, getAvailablePlans } from '@/lib/subscriptions/service';
import type { SubscriptionResponse } from '@/lib/subscriptions/types';

async function handler(request: AuthenticatedRequest): Promise<NextResponse<SubscriptionResponse>> {
  try {
    const subscription = await getUserSubscription(request.auth.userId);

    // Get plan details if subscription exists
    let plan = null;
    if (subscription) {
      const plans = await getAvailablePlans();
      plan = plans.find((p) => p.key === subscription.planKey) || null;
    }

    return NextResponse.json({ subscription, plan });
  } catch (error) {
    console.error('[Subscriptions] Error fetching subscription:', error);
    return NextResponse.json(
      { subscription: null, plan: null },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
