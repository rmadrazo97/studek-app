/**
 * Features Service
 *
 * Feature flags and access control based on subscription plans.
 */

import { getDatabase } from '../db';
import { getUserSubscription } from './subscriptions';
import type { FeatureAccess, DbPlanFeature } from './types';

// Default feature values for users without subscription (free tier)
const DEFAULT_FEATURES: Record<string, { value: string; valueType: 'boolean' | 'number' | 'string' }> = {
  max_decks: { value: '5', valueType: 'number' },
  max_cards_per_deck: { value: '100', valueType: 'number' },
  ai_card_generation: { value: 'false', valueType: 'boolean' },
  advanced_analytics: { value: 'false', valueType: 'boolean' },
  export_import: { value: 'true', valueType: 'boolean' },
  collaboration: { value: 'false', valueType: 'boolean' },
  priority_support: { value: 'false', valueType: 'boolean' },
};

/**
 * Check if a user has access to a feature
 */
export function checkFeatureAccess(userId: string, featureKey: string): FeatureAccess {
  const db = getDatabase();

  // Get user's subscription
  const subscription = getUserSubscription(userId);

  let featureValue: string | null = null;
  let valueType: 'boolean' | 'number' | 'string' = 'boolean';

  if (subscription) {
    // Get feature value from user's plan
    const feature = db
      .prepare(`
        SELECT pf.value, pf.value_type
        FROM plan_features pf
        JOIN subscription_plans sp ON sp.id = pf.plan_id
        WHERE sp.key = ? AND pf.feature_key = ?
      `)
      .get(subscription.planKey, featureKey) as { value: string; value_type: string } | undefined;

    if (feature) {
      featureValue = feature.value;
      valueType = feature.value_type as 'boolean' | 'number' | 'string';
    }
  }

  // Fall back to default if no subscription or feature not found
  if (featureValue === null) {
    const defaultFeature = DEFAULT_FEATURES[featureKey];
    if (defaultFeature) {
      featureValue = defaultFeature.value;
      valueType = defaultFeature.valueType;
    } else {
      // Feature not defined, deny access
      return {
        featureKey,
        hasAccess: false,
        value: false,
      };
    }
  }

  // Parse the value based on type
  return parseFeatureValue(featureKey, featureValue, valueType);
}

/**
 * Parse feature value and determine access
 */
function parseFeatureValue(
  featureKey: string,
  value: string,
  valueType: 'boolean' | 'number' | 'string'
): FeatureAccess {
  if (valueType === 'boolean') {
    const boolValue = value === 'true';
    return {
      featureKey,
      hasAccess: boolValue,
      value: boolValue,
    };
  }

  if (valueType === 'number') {
    const numValue = parseInt(value, 10);

    // -1 means unlimited
    if (numValue === -1) {
      return {
        featureKey,
        hasAccess: true,
        value: Infinity,
      };
    }

    return {
      featureKey,
      hasAccess: numValue > 0,
      value: numValue,
      limit: numValue,
    };
  }

  // String type
  return {
    featureKey,
    hasAccess: value !== '' && value !== 'none',
    value: value,
  };
}

/**
 * Check if user can create more decks
 */
export function canCreateDeck(userId: string, currentDeckCount: number): boolean {
  const access = checkFeatureAccess(userId, 'max_decks');

  if (!access.hasAccess) return false;

  // Unlimited
  if (access.value === Infinity) return true;

  // Check against limit
  return currentDeckCount < (access.limit || 0);
}

/**
 * Check if user can add more cards to a deck
 */
export function canAddCardToDeck(userId: string, currentCardCount: number): boolean {
  const access = checkFeatureAccess(userId, 'max_cards_per_deck');

  if (!access.hasAccess) return false;

  // Unlimited
  if (access.value === Infinity) return true;

  // Check against limit
  return currentCardCount < (access.limit || 0);
}

/**
 * Check if user has AI card generation
 */
export function hasAICardGeneration(userId: string): boolean {
  const access = checkFeatureAccess(userId, 'ai_card_generation');
  return access.hasAccess;
}

/**
 * Check if user has advanced analytics
 */
export function hasAdvancedAnalytics(userId: string): boolean {
  const access = checkFeatureAccess(userId, 'advanced_analytics');
  return access.hasAccess;
}

/**
 * Check if user has export/import feature
 */
export function hasExportImport(userId: string): boolean {
  const access = checkFeatureAccess(userId, 'export_import');
  return access.hasAccess;
}

/**
 * Check if user has collaboration feature
 */
export function hasCollaboration(userId: string): boolean {
  const access = checkFeatureAccess(userId, 'collaboration');
  return access.hasAccess;
}

/**
 * Check if user has priority support
 */
export function hasPrioritySupport(userId: string): boolean {
  const access = checkFeatureAccess(userId, 'priority_support');
  return access.hasAccess;
}

/**
 * Get all feature access for a user
 */
export function getAllFeatureAccess(userId: string): Record<string, FeatureAccess> {
  const features: Record<string, FeatureAccess> = {};

  for (const featureKey of Object.keys(DEFAULT_FEATURES)) {
    features[featureKey] = checkFeatureAccess(userId, featureKey);
  }

  return features;
}
