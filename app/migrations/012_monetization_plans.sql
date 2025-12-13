-- Migration: 012_monetization_plans
-- Description: Add plans, subscriptions, defaults, and AI deck tracking
-- Created: 2025-12-13

-- ============================================
-- Plans Table
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    is_default INTEGER NOT NULL DEFAULT 0,
    max_decks INTEGER,
    max_sessions_per_deck INTEGER,
    max_public_decks INTEGER,
    max_ai_decks INTEGER,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_is_default ON plans(is_default);

-- ============================================
-- User Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id);

-- Users: plan tracking
-- ============================================
ALTER TABLE users ADD COLUMN plan_id TEXT NOT NULL DEFAULT 'plan_free';
-- SQLite cannot add a column with a non-constant default; add then backfill
ALTER TABLE users ADD COLUMN plan_started_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

-- ============================================
-- Decks: AI generation flag
-- ============================================
ALTER TABLE decks ADD COLUMN is_ai_generated INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- Seed Plans (idempotent)
-- ============================================
INSERT OR IGNORE INTO plans (
    id, name, slug, price_cents, currency, interval, is_default,
    max_decks, max_sessions_per_deck, max_public_decks, max_ai_decks, metadata
) VALUES
    ('plan_free', 'Free', 'free', 0, 'usd', 'month', 1, 2, 3, 1, 0, '{"note":"Default free tier"}'),
    ('plan_premium', 'Premium', 'premium', 399, 'usd', 'month', 0, NULL, NULL, NULL, 2, '{"note":"Premium monthly"}'),
    ('plan_pro', 'Pro', 'pro', 599, 'usd', 'month', 0, NULL, NULL, NULL, NULL, '{"note":"Pro monthly"}');

-- Ensure existing users are assigned to Free plan
UPDATE users SET plan_id = 'plan_free' WHERE plan_id IS NULL OR plan_id = '';
-- Backfill plan_started_at
UPDATE users SET plan_started_at = datetime('now') WHERE plan_started_at IS NULL OR plan_started_at = '';
