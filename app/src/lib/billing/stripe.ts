import Stripe from 'stripe';

const STRIPE_API_VERSION = '2024-06-20' as const;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeClient;
}

export function getPriceIdForPlan(slug: string): string | null {
  const map: Record<string, string | undefined> = {
    premium: process.env.STRIPE_PRICE_PREMIUM,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  return map[slug] ?? null;
}

export function getPlanSlugForPrice(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  const entries: Array<[string | undefined, string]> = [
    [process.env.STRIPE_PRICE_PREMIUM, 'premium'],
    [process.env.STRIPE_PRICE_PRO, 'pro'],
  ];

  for (const [envPrice, slug] of entries) {
    if (envPrice && envPrice === priceId) {
      return slug;
    }
  }
  return null;
}

export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

export function getDefaultSuccessUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';
  return `${base}/billing/success`;
}

export function getDefaultCancelUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';
  return `${base}/billing/cancel`;
}
