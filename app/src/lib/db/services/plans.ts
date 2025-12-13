import { getDatabase } from '../index';
import { findAll, findBy, generateId, now } from '../crud';
import type { Plan, UserSubscription } from '../types';

export interface PlanSeed {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year';
  is_default?: boolean;
  max_decks?: number | null;
  max_sessions_per_deck?: number | null;
  max_public_decks?: number | null;
  max_ai_decks?: number | null;
  metadata?: Record<string, unknown>;
}

export const PLAN_SEEDS: PlanSeed[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    price_cents: 0,
    currency: 'usd',
    interval: 'month',
    is_default: true,
    max_decks: 2,
    max_sessions_per_deck: 3,
    max_public_decks: 1,
    max_ai_decks: 0,
    metadata: { note: 'Default free tier' },
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    price_cents: 399,
    currency: 'usd',
    interval: 'month',
    is_default: false,
    max_decks: null,
    max_sessions_per_deck: null,
    max_public_decks: null,
    max_ai_decks: 2,
    metadata: { note: 'Premium monthly' },
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    slug: 'pro',
    price_cents: 599,
    currency: 'usd',
    interval: 'month',
    is_default: false,
    max_decks: null,
    max_sessions_per_deck: null,
    max_public_decks: null,
    max_ai_decks: null,
    metadata: { note: 'Pro monthly' },
  },
];

export function getPlanById(id: string): Plan | null {
  return findBy<Plan>('plans', 'id', id);
}

export function getPlanBySlug(slug: string): Plan | null {
  return findBy<Plan>('plans', 'slug', slug);
}

export function listPlans(): Plan[] {
  return findAll<Plan>('plans', {}, { orderBy: 'price_cents', order: 'ASC', limit: 50 });
}

export function getDefaultPlan(): Plan | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM plans WHERE is_default = 1 ORDER BY created_at ASC LIMIT 1')
    .get() as Plan | undefined;
  return row || null;
}

export function getUserPlan(userId: string): Plan | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `
      SELECT p.*
      FROM users u
      JOIN plans p ON p.id = u.plan_id
      WHERE u.id = ?
    `
    )
    .get(userId) as Plan | undefined;
  return row || null;
}

export function assignPlanToUser(userId: string, planId: string): void {
  const db = getDatabase();
  db.prepare(
    `
      UPDATE users
      SET plan_id = ?, plan_started_at = ?
      WHERE id = ?
    `
  ).run(planId, now(), userId);
}

export function seedPlans(): void {
  const db = getDatabase();

  db.transaction(() => {
    for (const plan of PLAN_SEEDS) {
      db.prepare(
        `
          INSERT INTO plans (
            id, name, slug, price_cents, currency, interval,
            is_default, max_decks, max_sessions_per_deck, max_public_decks, max_ai_decks, metadata, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            price_cents = excluded.price_cents,
            currency = excluded.currency,
            interval = excluded.interval,
            is_default = excluded.is_default,
            max_decks = excluded.max_decks,
            max_sessions_per_deck = excluded.max_sessions_per_deck,
            max_public_decks = excluded.max_public_decks,
            max_ai_decks = excluded.max_ai_decks,
            metadata = excluded.metadata,
            updated_at = datetime('now')
        `
      ).run(
        plan.id,
        plan.name,
        plan.slug,
        plan.price_cents,
        plan.currency,
        plan.interval,
        plan.is_default ? 1 : 0,
        plan.max_decks ?? null,
        plan.max_sessions_per_deck ?? null,
        plan.max_public_decks ?? null,
        plan.max_ai_decks ?? null,
        plan.metadata ? JSON.stringify(plan.metadata) : null
      );
    }

    db.prepare(
      `UPDATE users SET plan_id = ? WHERE plan_id IS NULL OR plan_id = ''`
    ).run('plan_free');
  })();
}

export function getLatestSubscriptionForUser(userId: string): UserSubscription | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `
        SELECT * FROM user_subscriptions
        WHERE user_id = ?
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      `
    )
    .get(userId) as UserSubscription | undefined;
  return row || null;
}

export function upsertUserSubscription(data: {
  id?: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  status?: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  ended_at?: string | null;
}): UserSubscription {
  const db = getDatabase();
  const existing =
    (data.stripe_subscription_id &&
      findBy<UserSubscription>('user_subscriptions', 'stripe_subscription_id', data.stripe_subscription_id)) ||
    getLatestSubscriptionForUser(data.user_id);

  const timestamp = now();

  if (existing) {
    db.prepare(
      `
        UPDATE user_subscriptions
        SET plan_id = ?, stripe_customer_id = ?, stripe_subscription_id = ?, stripe_price_id = ?,
            status = ?, current_period_end = ?, cancel_at_period_end = ?, ended_at = ?, updated_at = ?
        WHERE id = ?
      `
    ).run(
      data.plan_id,
      data.stripe_customer_id ?? existing.stripe_customer_id,
      data.stripe_subscription_id ?? existing.stripe_subscription_id,
      data.stripe_price_id ?? existing.stripe_price_id,
      data.status ?? existing.status,
      data.current_period_end ?? existing.current_period_end,
      data.cancel_at_period_end === undefined
        ? existing.cancel_at_period_end
        : data.cancel_at_period_end
          ? 1
          : 0,
      data.ended_at ?? existing.ended_at,
      timestamp,
      existing.id
    );

    return findBy<UserSubscription>('user_subscriptions', 'id', existing.id)!;
  }

  const id = data.id || generateId();
  db.prepare(
    `
      INSERT INTO user_subscriptions (
        id, user_id, plan_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        status, current_period_end, cancel_at_period_end, ended_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    data.user_id,
    data.plan_id,
    data.stripe_customer_id ?? null,
    data.stripe_subscription_id ?? null,
    data.stripe_price_id ?? null,
    data.status ?? 'inactive',
    data.current_period_end ?? null,
    data.cancel_at_period_end ? 1 : 0,
    data.ended_at ?? null,
    timestamp,
    timestamp
  );

  return findBy<UserSubscription>('user_subscriptions', 'id', id)!;
}

