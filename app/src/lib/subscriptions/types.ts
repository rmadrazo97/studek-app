/**
 * Subscription Types
 */

// Database row types
export interface DbSubscriptionPlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_price_monthly: string | null;
  stripe_price_yearly: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbPlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_name: string;
  value_type: 'boolean' | 'number' | 'string';
  value: string;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
}

// Enum types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'incomplete';
export type BillingCycle = 'monthly' | 'yearly' | 'free';

// API types
export interface SubscriptionPlan {
  key: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeature[];
}

export interface PlanFeature {
  key: string;
  name: string;
  value: string;
  valueType: 'boolean' | 'number' | 'string';
}

export interface CustomerSubscription {
  id: string;
  planKey: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export interface FeatureAccess {
  featureKey: string;
  hasAccess: boolean;
  value: string | number | boolean;
  limit?: number;
}

// API request/response types
export interface CreateCheckoutRequest {
  planKey: string;
  billingCycle: 'monthly' | 'yearly';
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
