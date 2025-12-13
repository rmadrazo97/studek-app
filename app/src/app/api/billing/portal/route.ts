import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getStripeClient, getDefaultCancelUrl } from '@/lib/billing/stripe';
import { getLatestSubscriptionForUser } from '@/lib/db/services/plans';

interface PortalRequest {
  returnUrl?: string;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const { returnUrl } = (await request.json().catch(() => ({}))) as PortalRequest;

    const latestSubscription = getLatestSubscriptionForUser(userId);
    const customerId = latestSubscription?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing customer found. Start a subscription first.' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || getDefaultCancelUrl(),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError('POST /api/billing/portal', error, 'Failed to create portal session');
  }
});
