import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getWebhookSecret, getPlanSlugForPrice } from '@/lib/billing/stripe';
import {
  assignPlanToUser,
  getPlanById,
  getPlanBySlug,
  getDefaultPlan,
  upsertUserSubscription,
} from '@/lib/db/services/plans';
import type Stripe from 'stripe';
import { now } from '@/lib/db/crud';

export const runtime = 'nodejs';

function mapPriceToPlan(priceId: string | null | undefined) {
  const slug = getPlanSlugForPrice(priceId);
  if (slug) {
    return getPlanBySlug(slug);
  }
  return null;
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const stripe = getStripeClient();
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = (session.client_reference_id || session.metadata?.userId) as string | undefined;

  if (!userId) {
    console.warn('[Stripe webhook] checkout.session.completed without userId metadata');
    return;
  }

  const plan =
    (session.metadata?.planId && getPlanById(session.metadata.planId)) ||
    (session.metadata?.planSlug && getPlanBySlug(session.metadata.planSlug)) ||
    mapPriceToPlan(session.metadata?.priceId) ||
    getDefaultPlan();

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id;

  let subscription: Stripe.Subscription | null = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  const priceId =
    (subscription?.items?.data?.[0]?.price?.id as string | undefined) ||
    (session.metadata?.priceId as string | undefined) ||
    null;

  upsertUserSubscription({
    user_id: userId,
    plan_id: plan?.id ?? getDefaultPlan()?.id ?? 'plan_free',
    stripe_customer_id: (session.customer as string) || subscription?.customer?.toString() || null,
    stripe_subscription_id: subscriptionId ?? null,
    stripe_price_id: priceId,
    status: subscription?.status || session.status || 'active',
    current_period_end: subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
    ended_at: subscription?.status === 'canceled' ? now() : null,
  });

  if (plan) {
    assignPlanToUser(userId, plan.id);
  }
}

function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata?.userId as string | undefined) ?? null;
  if (!userId) {
    console.warn('[Stripe webhook] subscription event missing userId metadata');
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan =
    (subscription.metadata?.planId && getPlanById(subscription.metadata.planId)) ||
    (subscription.metadata?.planSlug && getPlanBySlug(subscription.metadata.planSlug)) ||
    mapPriceToPlan(priceId) ||
    getDefaultPlan();

  const status = subscription.status;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  upsertUserSubscription({
    user_id: userId,
    plan_id: plan?.id ?? getDefaultPlan()?.id ?? 'plan_free',
    stripe_customer_id: (subscription.customer as string) || null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId ?? null,
    status,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    ended_at: status === 'canceled' ? now() : null,
  });

  if (plan && (status === 'active' || status === 'trialing')) {
    assignPlanToUser(userId, plan.id);
  }

  if (status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid') {
    const fallback = getDefaultPlan();
    if (fallback) {
      assignPlanToUser(userId, fallback.id);
    }
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = Buffer.from(await request.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('[Stripe webhook] Error handling event', event.type, err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
