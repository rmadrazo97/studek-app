/**
 * Stripe Integration for Subscriptions
 *
 * Handles Stripe Checkout, Customer Portal, and Webhook processing.
 */

import Stripe from 'stripe';
import { getSubscrio } from './index';
import { getOrCreateCustomer, getUserSubscription } from './service';

// Stripe price IDs mapping (configure in Stripe Dashboard and update here)
const STRIPE_PRICES: Record<string, string> = {
  'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  'pro-yearly': process.env.STRIPE_PRICE_PRO_YEARLY || '',
  'premium-monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
  'premium-yearly': process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
};

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
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  userName: string,
  billingCycleKey: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  // Ensure customer exists in Subscrio
  const customerKey = await getOrCreateCustomer(userId, userName);

  // Get or create Stripe customer
  const subscrio = getSubscrio();
  let stripeCustomerId: string | undefined;

  try {
    const customer = await subscrio.customers.getCustomer(customerKey);
    stripeCustomerId = customer?.stripeCustomerId;
  } catch {
    // Customer might not have Stripe ID yet
  }

  if (!stripeCustomerId) {
    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        userId,
        customerKey,
      },
    });
    stripeCustomerId = stripeCustomer.id;

    // Update Subscrio customer with Stripe ID
    await subscrio.customers.updateCustomer(customerKey, {
      stripeCustomerId,
    });
  }

  // Get the Stripe price ID for the billing cycle
  const priceId = STRIPE_PRICES[billingCycleKey];
  if (!priceId) {
    throw new Error(`No Stripe price configured for billing cycle: ${billingCycleKey}`);
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
      customerKey,
      billingCycleKey,
    },
    subscription_data: {
      metadata: {
        userId,
        customerKey,
        billingCycleKey,
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
  const subscrio = getSubscrio();
  const customerKey = `user-${userId}`;

  // Get Stripe customer ID
  const customer = await subscrio.customers.getCustomer(customerKey);
  if (!customer?.stripeCustomerId) {
    throw new Error('No Stripe customer found. Please subscribe first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
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
  const subscrio = getSubscrio();

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
      await handleCheckoutComplete(session, subscrio);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription, subscrio);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription, subscrio);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice, subscrio);
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
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  subscrio: ReturnType<typeof getSubscrio>
): Promise<void> {
  const { userId, customerKey, billingCycleKey } = session.metadata || {};

  if (!userId || !customerKey || !billingCycleKey) {
    console.error('[Stripe Webhook] Missing metadata in checkout session');
    return;
  }

  console.log(`[Stripe Webhook] Checkout complete for user ${userId}`);

  // Check if subscription already exists
  const existingSub = await getUserSubscription(userId);

  if (!existingSub) {
    // Create new subscription in Subscrio
    await subscrio.subscriptions.createSubscription({
      key: `sub-${userId}-${Date.now()}`,
      customerKey,
      billingCycleKey,
      stripeSubscriptionId: session.subscription as string,
    });
  }
}

/**
 * Handle subscription updates from Stripe
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  subscrio: ReturnType<typeof getSubscrio>
): Promise<void> {
  const { userId, customerKey, billingCycleKey } = subscription.metadata || {};

  if (!userId || !customerKey) {
    console.error('[Stripe Webhook] Missing metadata in subscription');
    return;
  }

  console.log(`[Stripe Webhook] Subscription updated for user ${userId}: ${subscription.status}`);

  // Find existing subscription in Subscrio
  const existingSub = await getUserSubscription(userId);

  if (existingSub) {
    // Update subscription status
    await subscrio.subscriptions.updateSubscription(existingSub.key, {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } else if (billingCycleKey) {
    // Create new subscription
    await subscrio.subscriptions.createSubscription({
      key: `sub-${userId}-${Date.now()}`,
      customerKey,
      billingCycleKey,
      stripeSubscriptionId: subscription.id,
    });
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  subscrio: ReturnType<typeof getSubscrio>
): Promise<void> {
  const { userId } = subscription.metadata || {};

  if (!userId) {
    console.error('[Stripe Webhook] Missing userId in subscription metadata');
    return;
  }

  console.log(`[Stripe Webhook] Subscription deleted for user ${userId}`);

  const existingSub = await getUserSubscription(userId);
  if (existingSub) {
    await subscrio.subscriptions.updateSubscription(existingSub.key, {
      status: 'canceled',
    });
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  subscrio: ReturnType<typeof getSubscrio>
): Promise<void> {
  const customerId = invoice.customer as string;
  console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);

  // Get customer to find userId
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) return;

  const userId = customer.metadata?.userId;
  if (!userId) return;

  const existingSub = await getUserSubscription(userId);
  if (existingSub) {
    await subscrio.subscriptions.updateSubscription(existingSub.key, {
      status: 'past_due',
    });
  }
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'trialing',
    incomplete: 'past_due',
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
