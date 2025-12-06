/**
 * Plans Service
 *
 * Manages subscription plans and their features.
 */

import { getDatabase } from '../db';
import type { DbSubscriptionPlan, DbPlanFeature, SubscriptionPlan, PlanFeature } from './types';

/**
 * Get all active subscription plans with their features
 */
export function getAllPlans(): SubscriptionPlan[] {
  const db = getDatabase();

  const plans = db
    .prepare(`
      SELECT * FROM subscription_plans
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `)
    .all() as DbSubscriptionPlan[];

  return plans.map((plan) => {
    const features = db
      .prepare(`SELECT * FROM plan_features WHERE plan_id = ?`)
      .all(plan.id) as DbPlanFeature[];

    return {
      key: plan.key,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
      features: features.map((f) => ({
        key: f.feature_key,
        name: f.feature_name,
        value: f.value,
        valueType: f.value_type,
      })),
    };
  });
}

/**
 * Get a plan by its key
 */
export function getPlanByKey(key: string): SubscriptionPlan | null {
  const db = getDatabase();

  const plan = db
    .prepare(`SELECT * FROM subscription_plans WHERE key = ? AND is_active = 1`)
    .get(key) as DbSubscriptionPlan | undefined;

  if (!plan) return null;

  const features = db
    .prepare(`SELECT * FROM plan_features WHERE plan_id = ?`)
    .all(plan.id) as DbPlanFeature[];

  return {
    key: plan.key,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.price_monthly,
    priceYearly: plan.price_yearly,
    features: features.map((f) => ({
      key: f.feature_key,
      name: f.feature_name,
      value: f.value,
      valueType: f.value_type,
    })),
  };
}

/**
 * Get a plan by its ID
 */
export function getPlanById(id: string): DbSubscriptionPlan | null {
  const db = getDatabase();
  return db
    .prepare(`SELECT * FROM subscription_plans WHERE id = ?`)
    .get(id) as DbSubscriptionPlan | undefined || null;
}

/**
 * Get plan features
 */
export function getPlanFeatures(planId: string): PlanFeature[] {
  const db = getDatabase();
  const features = db
    .prepare(`SELECT * FROM plan_features WHERE plan_id = ?`)
    .all(planId) as DbPlanFeature[];

  return features.map((f) => ({
    key: f.feature_key,
    name: f.feature_name,
    value: f.value,
    valueType: f.value_type,
  }));
}

/**
 * Get a specific feature value for a plan
 */
export function getPlanFeatureValue(planKey: string, featureKey: string): string | null {
  const db = getDatabase();

  const result = db
    .prepare(`
      SELECT pf.value
      FROM plan_features pf
      JOIN subscription_plans sp ON sp.id = pf.plan_id
      WHERE sp.key = ? AND pf.feature_key = ?
    `)
    .get(planKey, featureKey) as { value: string } | undefined;

  return result?.value ?? null;
}

/**
 * Update Stripe price IDs for a plan
 */
export function updatePlanStripePrices(
  planKey: string,
  monthlyPriceId: string | null,
  yearlyPriceId: string | null
): void {
  const db = getDatabase();

  db.prepare(`
    UPDATE subscription_plans
    SET stripe_price_monthly = ?, stripe_price_yearly = ?, updated_at = datetime('now')
    WHERE key = ?
  `).run(monthlyPriceId, yearlyPriceId, planKey);
}

/**
 * Get Stripe price ID for a plan and billing cycle
 */
export function getStripePriceId(planKey: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const db = getDatabase();

  const plan = db
    .prepare(`SELECT stripe_price_monthly, stripe_price_yearly FROM subscription_plans WHERE key = ?`)
    .get(planKey) as Pick<DbSubscriptionPlan, 'stripe_price_monthly' | 'stripe_price_yearly'> | undefined;

  if (!plan) return null;

  return billingCycle === 'monthly' ? plan.stripe_price_monthly : plan.stripe_price_yearly;
}
