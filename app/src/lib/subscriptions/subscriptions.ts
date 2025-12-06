/**
 * Subscriptions Service
 *
 * Manages user subscriptions.
 */

import { getDatabase } from '../db';
import { generateId, now } from '../db/crud';
import { getPlanByKey, getPlanById } from './plans';
import type { DbSubscription, CustomerSubscription, SubscriptionStatus, BillingCycle } from './types';

/**
 * Get a user's active subscription
 */
export function getUserSubscription(userId: string): CustomerSubscription | null {
  const db = getDatabase();

  const subscription = db
    .prepare(`
      SELECT s.*, sp.key as plan_key, sp.name as plan_name
      FROM subscriptions s
      JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE s.user_id = ? AND s.status IN ('active', 'trialing', 'past_due')
      ORDER BY s.created_at DESC
      LIMIT 1
    `)
    .get(userId) as (DbSubscription & { plan_key: string; plan_name: string }) | undefined;

  if (!subscription) return null;

  return {
    id: subscription.id,
    planKey: subscription.plan_key,
    planName: subscription.plan_name,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end === 1,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  };
}

/**
 * Get a subscription by Stripe subscription ID
 */
export function getSubscriptionByStripeId(stripeSubscriptionId: string): DbSubscription | null {
  const db = getDatabase();
  return db
    .prepare(`SELECT * FROM subscriptions WHERE stripe_subscription_id = ?`)
    .get(stripeSubscriptionId) as DbSubscription | undefined || null;
}

/**
 * Create a free subscription for a user
 */
export function createFreeSubscription(userId: string): CustomerSubscription {
  const db = getDatabase();

  // Check if user already has a subscription
  const existing = getUserSubscription(userId);
  if (existing) return existing;

  // Get free plan
  const freePlan = db
    .prepare(`SELECT * FROM subscription_plans WHERE key = 'free'`)
    .get() as { id: string; key: string; name: string } | undefined;

  if (!freePlan) {
    throw new Error('Free plan not found');
  }

  const id = generateId();
  const timestamp = now();

  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, created_at, updated_at)
    VALUES (?, ?, ?, 'active', 'free', ?, ?)
  `).run(id, userId, freePlan.id, timestamp, timestamp);

  return {
    id,
    planKey: freePlan.key,
    planName: freePlan.name,
    status: 'active',
    billingCycle: 'free',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: null,
  };
}

/**
 * Create a paid subscription
 */
export function createSubscription(params: {
  userId: string;
  planKey: string;
  billingCycle: 'monthly' | 'yearly';
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}): CustomerSubscription {
  const db = getDatabase();

  // Get plan
  const plan = db
    .prepare(`SELECT * FROM subscription_plans WHERE key = ?`)
    .get(params.planKey) as { id: string; key: string; name: string } | undefined;

  if (!plan) {
    throw new Error(`Plan not found: ${params.planKey}`);
  }

  // Cancel any existing subscriptions
  db.prepare(`
    UPDATE subscriptions
    SET status = 'canceled', canceled_at = datetime('now'), updated_at = datetime('now')
    WHERE user_id = ? AND status IN ('active', 'trialing')
  `).run(params.userId);

  const id = generateId();
  const timestamp = now();

  db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, plan_id, status, billing_cycle,
      stripe_subscription_id, stripe_customer_id,
      current_period_start, current_period_end,
      created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.userId,
    plan.id,
    params.billingCycle,
    params.stripeSubscriptionId,
    params.stripeCustomerId,
    params.currentPeriodStart.toISOString(),
    params.currentPeriodEnd.toISOString(),
    timestamp,
    timestamp
  );

  return {
    id,
    planKey: plan.key,
    planName: plan.name,
    status: 'active',
    billingCycle: params.billingCycle,
    currentPeriodStart: params.currentPeriodStart.toISOString(),
    currentPeriodEnd: params.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: params.stripeSubscriptionId,
  };
}

/**
 * Update subscription status
 */
export function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  cancelAtPeriodEnd?: boolean
): void {
  const db = getDatabase();

  if (cancelAtPeriodEnd !== undefined) {
    db.prepare(`
      UPDATE subscriptions
      SET status = ?, cancel_at_period_end = ?, updated_at = datetime('now')
      WHERE stripe_subscription_id = ?
    `).run(status, cancelAtPeriodEnd ? 1 : 0, stripeSubscriptionId);
  } else {
    db.prepare(`
      UPDATE subscriptions
      SET status = ?, updated_at = datetime('now')
      WHERE stripe_subscription_id = ?
    `).run(status, stripeSubscriptionId);
  }
}

/**
 * Update subscription period
 */
export function updateSubscriptionPeriod(
  stripeSubscriptionId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): void {
  const db = getDatabase();

  db.prepare(`
    UPDATE subscriptions
    SET current_period_start = ?, current_period_end = ?, updated_at = datetime('now')
    WHERE stripe_subscription_id = ?
  `).run(
    currentPeriodStart.toISOString(),
    currentPeriodEnd.toISOString(),
    stripeSubscriptionId
  );
}

/**
 * Cancel subscription at period end
 */
export function cancelSubscriptionAtPeriodEnd(userId: string): void {
  const db = getDatabase();

  db.prepare(`
    UPDATE subscriptions
    SET cancel_at_period_end = 1, updated_at = datetime('now')
    WHERE user_id = ? AND status = 'active'
  `).run(userId);
}

/**
 * Reactivate a canceled subscription
 */
export function reactivateSubscription(userId: string): void {
  const db = getDatabase();

  db.prepare(`
    UPDATE subscriptions
    SET cancel_at_period_end = 0, updated_at = datetime('now')
    WHERE user_id = ? AND status = 'active' AND cancel_at_period_end = 1
  `).run(userId);
}

/**
 * Get user's plan key (for quick checks)
 */
export function getUserPlanKey(userId: string): string {
  const subscription = getUserSubscription(userId);
  return subscription?.planKey || 'free';
}

/**
 * Check if user is on a paid plan
 */
export function isPaidUser(userId: string): boolean {
  const planKey = getUserPlanKey(userId);
  return planKey !== 'free';
}
