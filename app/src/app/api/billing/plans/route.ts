import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { listPlans, getUserPlan, getLatestSubscriptionForUser } from '@/lib/db/services/plans';
import { getPriceIdForPlan } from '@/lib/billing/stripe';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;

    const plans = listPlans().map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      price_cents: plan.price_cents,
      interval: plan.interval,
      currency: plan.currency,
      is_default: plan.is_default === 1,
      limits: {
        decks: plan.max_decks,
        study_sessions_per_deck: plan.max_sessions_per_deck,
        public_decks: plan.max_public_decks,
        ai_decks: plan.max_ai_decks,
      },
      stripe_price_id: getPriceIdForPlan(plan.slug),
    }));

    const currentPlan = getUserPlan(userId);
    const subscription = getLatestSubscriptionForUser(userId);

    return NextResponse.json({
      plans,
      currentPlan: currentPlan
        ? {
            id: currentPlan.id,
            slug: currentPlan.slug,
            name: currentPlan.name,
            price_cents: currentPlan.price_cents,
            interval: currentPlan.interval,
          }
        : null,
      subscriptionStatus: subscription?.status ?? null,
    });
  } catch (error) {
    return handleApiError('GET /api/billing/plans', error, 'Failed to load plans');
  }
});
