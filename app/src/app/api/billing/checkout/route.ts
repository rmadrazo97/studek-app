import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getStripeClient, getPriceIdForPlan, getDefaultCancelUrl, getDefaultSuccessUrl } from '@/lib/billing/stripe';
import { getPlanBySlug, getLatestSubscriptionForUser, upsertUserSubscription } from '@/lib/db/services/plans';

interface CheckoutRequest {
  plan: string;
  successUrl?: string;
  cancelUrl?: string;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { plan: planSlug, successUrl, cancelUrl } = (await request.json()) as CheckoutRequest;
    const userId = request.auth.userId;
    const userEmail = request.user?.email;

    const plan = getPlanBySlug(planSlug);
    if (!plan || plan.slug === 'free') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(plan.slug);
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price is not configured for plan ${plan.slug}` },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();
    const latestSubscription = getLatestSubscriptionForUser(userId);
    const customerId = latestSubscription?.stripe_customer_id;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer: customerId || undefined,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId,
          planId: plan.id,
          planSlug: plan.slug,
        },
      },
      metadata: {
        userId,
        planId: plan.id,
        planSlug: plan.slug,
        priceId,
      },
      success_url: successUrl || `${getDefaultSuccessUrl()}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || getDefaultCancelUrl(),
    });

    upsertUserSubscription({
      user_id: userId,
      plan_id: plan.id,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
      stripe_price_id: priceId,
      status: session.status || 'open',
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError('POST /api/billing/checkout', error, 'Failed to create checkout session');
  }
});
