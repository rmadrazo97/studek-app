/**
 * Subscription Service
 *
 * High-level subscription operations for the Studek app.
 */

import { getSubscrio } from './index';
import type {
  SubscriptionPlan,
  CustomerSubscription,
  FeatureAccess,
  BillingCycle,
  PlanFeature,
} from './types';

const PRODUCT_KEY = 'studek';

/**
 * Get or create a customer for a user
 */
export async function getOrCreateCustomer(userId: string, displayName: string): Promise<string> {
  const subscrio = getSubscrio();
  const customerKey = `user-${userId}`;

  try {
    // Try to get existing customer
    const existing = await subscrio.customers.getCustomer(customerKey);
    if (existing) {
      return customerKey;
    }
  } catch {
    // Customer doesn't exist, create it
  }

  await subscrio.customers.createCustomer({
    key: customerKey,
    displayName,
  });

  return customerKey;
}

/**
 * Get all available subscription plans
 */
export async function getAvailablePlans(): Promise<SubscriptionPlan[]> {
  const subscrio = getSubscrio();

  const plans: SubscriptionPlan[] = [];

  // Get all plans for the studek product
  const planKeys = ['free', 'pro', 'premium'];

  for (const planKey of planKeys) {
    try {
      const plan = await subscrio.plans.getPlan(planKey);
      if (!plan) continue;

      // Get billing cycles for this plan
      const billingCycles: BillingCycle[] = [];
      const cycleKeys = planKey === 'free'
        ? ['free-monthly']
        : [`${planKey}-monthly`, `${planKey}-yearly`];

      for (const cycleKey of cycleKeys) {
        try {
          const cycle = await subscrio.billingCycles.getBillingCycle(cycleKey);
          if (cycle) {
            billingCycles.push({
              key: cycle.key,
              displayName: cycle.displayName,
              durationValue: cycle.durationValue,
              durationUnit: cycle.durationUnit as 'days' | 'weeks' | 'months' | 'years',
            });
          }
        } catch {
          // Cycle not found
        }
      }

      // Get features for this plan
      const features: PlanFeature[] = [];
      const featureKeys = [
        'max-decks',
        'max-cards-per-deck',
        'ai-card-generation',
        'advanced-analytics',
        'export-import',
        'collaboration',
      ];

      for (const featureKey of featureKeys) {
        try {
          const value = await subscrio.plans.getFeatureValue(planKey, featureKey);
          const feature = await subscrio.features.getFeature(featureKey);
          if (feature && value !== undefined) {
            features.push({
              key: featureKey,
              displayName: feature.displayName,
              value: String(value),
              valueType: feature.valueType as 'numeric' | 'boolean' | 'string',
            });
          }
        } catch {
          // Feature not found
        }
      }

      plans.push({
        key: plan.key,
        displayName: plan.displayName,
        features,
        billingCycles,
      });
    } catch {
      // Plan not found
    }
  }

  return plans;
}

/**
 * Get a user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<CustomerSubscription | null> {
  const subscrio = getSubscrio();
  const customerKey = `user-${userId}`;

  try {
    const subscriptions = await subscrio.subscriptions.getCustomerSubscriptions(customerKey);

    if (!subscriptions || subscriptions.length === 0) {
      return null;
    }

    // Get the most recent active subscription
    const activeSub = subscriptions.find(
      (s: { status: string }) => s.status === 'active' || s.status === 'trialing'
    ) || subscriptions[0];

    // Get plan details
    const billingCycle = await subscrio.billingCycles.getBillingCycle(activeSub.billingCycleKey);
    const plan = billingCycle ? await subscrio.plans.getPlan(billingCycle.planKey) : null;

    return {
      key: activeSub.key,
      planKey: plan?.key || 'unknown',
      planDisplayName: plan?.displayName || 'Unknown',
      billingCycleKey: activeSub.billingCycleKey,
      status: activeSub.status as CustomerSubscription['status'],
      currentPeriodStart: activeSub.currentPeriodStart,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd || false,
      stripeSubscriptionId: activeSub.stripeSubscriptionId,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new subscription for a user (free plan)
 */
export async function createFreeSubscription(userId: string, displayName: string): Promise<CustomerSubscription> {
  const subscrio = getSubscrio();

  // Ensure customer exists
  const customerKey = await getOrCreateCustomer(userId, displayName);

  // Create subscription on free plan
  const subscription = await subscrio.subscriptions.createSubscription({
    key: `sub-${userId}-${Date.now()}`,
    customerKey,
    billingCycleKey: 'free-monthly',
  });

  return {
    key: subscription.key,
    planKey: 'free',
    planDisplayName: 'Free',
    billingCycleKey: 'free-monthly',
    status: 'active',
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Check if a user has access to a feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<FeatureAccess> {
  const subscrio = getSubscrio();
  const customerKey = `user-${userId}`;

  try {
    const value = await subscrio.featureChecker.getValueForCustomer(
      customerKey,
      PRODUCT_KEY,
      featureKey
    );

    // Parse the value based on expected type
    const feature = await subscrio.features.getFeature(featureKey);
    let parsedValue: string | number | boolean = value;
    let hasAccess = true;

    if (feature?.valueType === 'boolean') {
      parsedValue = value === 'true';
      hasAccess = parsedValue === true;
    } else if (feature?.valueType === 'numeric') {
      if (value === 'unlimited') {
        parsedValue = Infinity;
        hasAccess = true;
      } else {
        parsedValue = parseInt(value, 10);
        hasAccess = parsedValue > 0;
      }
    }

    return {
      featureKey,
      hasAccess,
      value: parsedValue,
      limit: typeof parsedValue === 'number' && parsedValue !== Infinity ? parsedValue : undefined,
    };
  } catch {
    // Default to free tier limits if no subscription found
    const defaultValues: Record<string, string | number | boolean> = {
      'max-decks': 5,
      'max-cards-per-deck': 100,
      'ai-card-generation': false,
      'advanced-analytics': false,
      'export-import': true,
      'collaboration': false,
    };

    const defaultValue = defaultValues[featureKey];
    const hasAccess = typeof defaultValue === 'boolean' ? defaultValue : (defaultValue as number) > 0;

    return {
      featureKey,
      hasAccess,
      value: defaultValue ?? false,
      limit: typeof defaultValue === 'number' ? defaultValue : undefined,
    };
  }
}

/**
 * Get the user's plan key (for quick checks)
 */
export async function getUserPlanKey(userId: string): Promise<string> {
  const subscription = await getUserSubscription(userId);
  return subscription?.planKey || 'free';
}

/**
 * Check if user is on a paid plan
 */
export async function isPaidUser(userId: string): Promise<boolean> {
  const planKey = await getUserPlanKey(userId);
  return planKey !== 'free';
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscrio = getSubscrio();
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  await subscrio.subscriptions.cancelSubscription(subscription.key, {
    cancelAtPeriodEnd: true,
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const subscrio = getSubscrio();
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error('No subscription found');
  }

  await subscrio.subscriptions.reactivateSubscription(subscription.key);
}
