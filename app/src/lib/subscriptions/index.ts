/**
 * Subscription Management Service
 *
 * Uses @saas-experts/subscrio for subscription lifecycle management
 * with Stripe integration for payment processing.
 */

import { Subscrio } from '@saas-experts/subscrio';

// Singleton instance
let subscrio: Subscrio | null = null;
let initialized = false;

/**
 * Get the Subscrio connection string from environment
 */
function getConnectionString(): string {
  const url = process.env.SUBSCRIO_DATABASE_URL;
  if (!url) {
    throw new Error('SUBSCRIO_DATABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Get the Stripe secret key from environment
 */
function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || undefined;
}

/**
 * Get or create the Subscrio instance singleton
 */
export function getSubscrio(): Subscrio {
  if (!subscrio) {
    subscrio = new Subscrio({
      database: {
        connectionString: getConnectionString(),
        poolSize: parseInt(process.env.SUBSCRIO_POOL_SIZE || '10'),
      },
      stripe: {
        secretKey: getStripeSecretKey(),
      },
      logging: {
        level: (process.env.NODE_ENV === 'development' ? 'debug' : 'info') as 'debug' | 'info' | 'warn' | 'error',
      },
    });

    console.log('[Subscrio] Instance created');
  }

  return subscrio;
}

/**
 * Initialize the Subscrio schema (run once on first deployment)
 */
export async function initializeSubscrio(): Promise<void> {
  if (initialized) {
    return;
  }

  const instance = getSubscrio();

  try {
    // Check if schema already exists
    const schemaExists = await instance.verifySchema();

    if (!schemaExists) {
      console.log('[Subscrio] Installing database schema...');
      await instance.installSchema();
      console.log('[Subscrio] Schema installed successfully');

      // Seed default product and plans
      await seedDefaultPlans();
    } else {
      console.log('[Subscrio] Schema already exists');
    }

    initialized = true;
  } catch (error) {
    console.error('[Subscrio] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Seed default subscription plans
 */
async function seedDefaultPlans(): Promise<void> {
  const instance = getSubscrio();

  console.log('[Subscrio] Seeding default plans...');

  // Create the main product
  const product = await instance.products.createProduct({
    key: 'studek',
    displayName: 'Studek - Smart Flashcards',
  });

  // Create features
  const features = [
    { key: 'max-decks', displayName: 'Maximum Decks', valueType: 'numeric' as const, defaultValue: '5' },
    { key: 'max-cards-per-deck', displayName: 'Cards per Deck', valueType: 'numeric' as const, defaultValue: '100' },
    { key: 'ai-card-generation', displayName: 'AI Card Generation', valueType: 'boolean' as const, defaultValue: 'false' },
    { key: 'advanced-analytics', displayName: 'Advanced Analytics', valueType: 'boolean' as const, defaultValue: 'false' },
    { key: 'export-import', displayName: 'Export/Import', valueType: 'boolean' as const, defaultValue: 'true' },
    { key: 'collaboration', displayName: 'Deck Collaboration', valueType: 'boolean' as const, defaultValue: 'false' },
  ];

  for (const feature of features) {
    await instance.features.createFeature(feature);
    await instance.products.associateFeature(product.key, feature.key);
  }

  // Create Free plan
  const freePlan = await instance.plans.createPlan({
    productKey: product.key,
    key: 'free',
    displayName: 'Free',
  });

  await instance.plans.setFeatureValue(freePlan.key, 'max-decks', '5');
  await instance.plans.setFeatureValue(freePlan.key, 'max-cards-per-deck', '100');
  await instance.plans.setFeatureValue(freePlan.key, 'ai-card-generation', 'false');
  await instance.plans.setFeatureValue(freePlan.key, 'advanced-analytics', 'false');
  await instance.plans.setFeatureValue(freePlan.key, 'export-import', 'true');
  await instance.plans.setFeatureValue(freePlan.key, 'collaboration', 'false');

  // Create billing cycle for free plan (monthly, $0)
  await instance.billingCycles.createBillingCycle({
    planKey: freePlan.key,
    key: 'free-monthly',
    displayName: 'Free Monthly',
    durationValue: 1,
    durationUnit: 'months',
  });

  // Create Pro plan
  const proPlan = await instance.plans.createPlan({
    productKey: product.key,
    key: 'pro',
    displayName: 'Pro',
  });

  await instance.plans.setFeatureValue(proPlan.key, 'max-decks', '50');
  await instance.plans.setFeatureValue(proPlan.key, 'max-cards-per-deck', '1000');
  await instance.plans.setFeatureValue(proPlan.key, 'ai-card-generation', 'true');
  await instance.plans.setFeatureValue(proPlan.key, 'advanced-analytics', 'true');
  await instance.plans.setFeatureValue(proPlan.key, 'export-import', 'true');
  await instance.plans.setFeatureValue(proPlan.key, 'collaboration', 'true');

  // Create billing cycles for pro plan
  await instance.billingCycles.createBillingCycle({
    planKey: proPlan.key,
    key: 'pro-monthly',
    displayName: 'Pro Monthly ($9.99/mo)',
    durationValue: 1,
    durationUnit: 'months',
  });

  await instance.billingCycles.createBillingCycle({
    planKey: proPlan.key,
    key: 'pro-yearly',
    displayName: 'Pro Yearly ($99/yr)',
    durationValue: 1,
    durationUnit: 'years',
  });

  // Create Premium plan
  const premiumPlan = await instance.plans.createPlan({
    productKey: product.key,
    key: 'premium',
    displayName: 'Premium',
  });

  await instance.plans.setFeatureValue(premiumPlan.key, 'max-decks', 'unlimited');
  await instance.plans.setFeatureValue(premiumPlan.key, 'max-cards-per-deck', 'unlimited');
  await instance.plans.setFeatureValue(premiumPlan.key, 'ai-card-generation', 'true');
  await instance.plans.setFeatureValue(premiumPlan.key, 'advanced-analytics', 'true');
  await instance.plans.setFeatureValue(premiumPlan.key, 'export-import', 'true');
  await instance.plans.setFeatureValue(premiumPlan.key, 'collaboration', 'true');

  // Create billing cycles for premium plan
  await instance.billingCycles.createBillingCycle({
    planKey: premiumPlan.key,
    key: 'premium-monthly',
    displayName: 'Premium Monthly ($19.99/mo)',
    durationValue: 1,
    durationUnit: 'months',
  });

  await instance.billingCycles.createBillingCycle({
    planKey: premiumPlan.key,
    key: 'premium-yearly',
    displayName: 'Premium Yearly ($199/yr)',
    durationValue: 1,
    durationUnit: 'years',
  });

  console.log('[Subscrio] Default plans seeded successfully');
}

/**
 * Close the Subscrio connection
 */
export async function closeSubscrio(): Promise<void> {
  if (subscrio) {
    await subscrio.close();
    subscrio = null;
    initialized = false;
    console.log('[Subscrio] Connection closed');
  }
}

/**
 * Check if Subscrio is initialized
 */
export function isSubscrioInitialized(): boolean {
  return initialized;
}
