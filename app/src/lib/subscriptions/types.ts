/**
 * Subscription Types
 */

export interface SubscriptionPlan {
  key: string;
  displayName: string;
  features: PlanFeature[];
  billingCycles: BillingCycle[];
}

export interface PlanFeature {
  key: string;
  displayName: string;
  value: string;
  valueType: 'numeric' | 'boolean' | 'string';
}

export interface BillingCycle {
  key: string;
  displayName: string;
  durationValue: number;
  durationUnit: 'days' | 'weeks' | 'months' | 'years';
  priceInCents?: number;
  stripePriceId?: string;
}

export interface CustomerSubscription {
  key: string;
  planKey: string;
  planDisplayName: string;
  billingCycleKey: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

export interface SubscriptionCheckoutSession {
  sessionId: string;
  url: string;
}

export interface SubscriptionPortalSession {
  url: string;
}

export interface FeatureAccess {
  featureKey: string;
  hasAccess: boolean;
  value: string | number | boolean;
  limit?: number;
}

// API request/response types
export interface CreateCheckoutRequest {
  billingCycleKey: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface GetPortalRequest {
  returnUrl: string;
}

export interface GetPortalResponse {
  url: string;
}

export interface SubscriptionResponse {
  subscription: CustomerSubscription | null;
  plan: SubscriptionPlan | null;
}

export interface PlansResponse {
  plans: SubscriptionPlan[];
}

export interface FeatureCheckResponse {
  feature: FeatureAccess;
}

// Stripe webhook event types
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';
