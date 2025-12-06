/**
 * Stripe Integration for Subscriptions
 *
 * Handles Stripe Checkout, Customer Portal, and Webhook processing.
 */

import Stripe from 'stripe';
import { getDatabase } from '../db';
import { generateId } from '../db/crud';
import {
  getUserSubscription,
  createSubscription,
  updateSubscriptionStatus,
  updateSubscriptionPeriod,
  getSubscriptionByStripeId,
} from './subscriptions';
import type { DbStripeCustomer, SubscriptionStatus } from './types';

/**
 * Get the Stripe client instance
 */
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

/**
 * Get Stripe price ID from environment
 */
function getStripePriceId(planKey: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const priceMap: Record<string, string | undefined> = {
    'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
    'pro-yearly': process.env.STRIPE_PRICE_PRO_YEARLY,
    'max-monthly': process.env.STRIPE_PRICE_MAX_MONTHLY,
    'max-yearly': process.env.STRIPE_PRICE_MAX_YEARLY,
  };

  return priceMap[`${planKey}-${billingCycle}`] || null;
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const db = getDatabase();

  // Check if we already have a Stripe customer for this user
  const existing = db
    .prepare(`SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?`)
    .get(userId) as { stripe_customer_id: string } | undefined;

  if (existing) {
    return existing.stripe_customer_id;
  }

  // Create new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  // Save to database
  db.prepare(`
    INSERT INTO stripe_customers (id, user_id, stripe_customer_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(generateId(), userId, customer.id);

  return customer.id;
}

/**
 * Get Stripe customer ID for a user
 */
export function getStripeCustomerId(userId: string): string | null {
  const db = getDatabase();
  const result = db
    .prepare(`SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?`)
    .get(userId) as { stripe_customer_id: string } | undefined;

  return result?.stripe_customer_id || null;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  userName: string,
  planKey: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  // Get or create Stripe customer
  const stripeCustomerId = await getOrCreateStripeCustomer(userId, userEmail, userName);

  // Get the Stripe price ID
  const priceId = getStripePriceId(planKey, billingCycle);
  if (!priceId) {
    throw new Error(`No Stripe price configured for ${planKey} ${billingCycle}`);
  }

  // Create Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planKey,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        userId,
        planKey,
        billingCycle,
      },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const stripe = getStripe();

  // Get Stripe customer ID
  const stripeCustomerId = getStripeCustomerId(userId);
  if (!stripeCustomerId) {
    throw new Error('No Stripe customer found. Please subscribe first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Process Stripe webhook event
 */
export async function processWebhookEvent(
  payload: string,
  signature: string
): Promise<{ received: boolean; type: string }> {
  const stripe = getStripe();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return { received: true, type: event.type };
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const { userId, planKey, billingCycle } = session.metadata || {};

  if (!userId || !planKey || !billingCycle) {
    console.error('[Stripe Webhook] Missing metadata in checkout session');
    return;
  }

  console.log(`[Stripe Webhook] Checkout complete for user ${userId}`);

  // Get subscription details from Stripe
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Create subscription in our database
  createSubscription({
    userId,
    planKey,
    billingCycle: billingCycle as 'monthly' | 'yearly',
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: session.customer as string,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
  });
}

/**
 * Handle subscription updates from Stripe
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const { userId, planKey, billingCycle } = subscription.metadata || {};

  console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  // First, try to find existing subscription by Stripe ID
  const existingSub = getSubscriptionByStripeId(subscription.id);

  if (existingSub) {
    // Update existing subscription
    updateSubscriptionStatus(
      subscription.id,
      mapStripeStatus(subscription.status),
      subscription.cancel_at_period_end
    );

    updateSubscriptionPeriod(
      subscription.id,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000)
    );
  } else if (userId && planKey && billingCycle) {
    // Create new subscription
    createSubscription({
      userId,
      planKey,
      billingCycle: billingCycle as 'monthly' | 'yearly',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);

  updateSubscriptionStatus(subscription.id, 'canceled');
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log(`[Stripe Webhook] Payment failed for invoice: ${invoice.id}`);

  if (invoice.subscription) {
    updateSubscriptionStatus(invoice.subscription as string, 'past_due');
  }
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'paused',
  };

  return statusMap[stripeStatus] || 'active';
}

/**
 * Get Stripe publishable key for frontend
 */
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
}

/**
 * Cancel subscription in Stripe
 */
export async function cancelStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();

  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate subscription in Stripe
 */
export async function reactivateStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();

  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
