-- Migration: 003_subscriptions
-- Description: Add subscription and billing tables with feature flags
-- Created: 2024-12-06

-- ============================================
-- Subscription Plans Table
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL DEFAULT 0,
    price_yearly INTEGER NOT NULL DEFAULT 0,
    stripe_price_monthly TEXT,
    stripe_price_yearly TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_key ON subscription_plans(key);

-- ============================================
-- Plan Features Table (Feature Flags per Plan)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_features (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('boolean', 'number', 'string')),
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    UNIQUE (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_key ON plan_features(feature_key);

-- ============================================
-- User Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'free')),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    canceled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================
-- Stripe Customers Table (link users to Stripe)
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_customers (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- ============================================
-- Default Subscription Plans
-- ============================================
INSERT OR IGNORE INTO subscription_plans (id, key, name, description, price_monthly, price_yearly, sort_order) VALUES
    ('plan-free', 'free', 'Free', 'Basic features for getting started', 0, 0, 0),
    ('plan-pro', 'pro', 'Pro', 'Advanced features for serious learners', 999, 9900, 1),
    ('plan-premium', 'premium', 'Premium', 'Unlimited access to all features', 1999, 19900, 2);

-- ============================================
-- Free Plan Features
-- ============================================
INSERT OR IGNORE INTO plan_features (id, plan_id, feature_key, feature_name, value_type, value) VALUES
    ('feat-free-decks', 'plan-free', 'max_decks', 'Maximum Decks', 'number', '5'),
    ('feat-free-cards', 'plan-free', 'max_cards_per_deck', 'Cards per Deck', 'number', '100'),
    ('feat-free-ai', 'plan-free', 'ai_card_generation', 'AI Card Generation', 'boolean', 'false'),
    ('feat-free-analytics', 'plan-free', 'advanced_analytics', 'Advanced Analytics', 'boolean', 'false'),
    ('feat-free-export', 'plan-free', 'export_import', 'Export/Import', 'boolean', 'true'),
    ('feat-free-collab', 'plan-free', 'collaboration', 'Deck Collaboration', 'boolean', 'false'),
    ('feat-free-priority', 'plan-free', 'priority_support', 'Priority Support', 'boolean', 'false');

-- ============================================
-- Pro Plan Features
-- ============================================
INSERT OR IGNORE INTO plan_features (id, plan_id, feature_key, feature_name, value_type, value) VALUES
    ('feat-pro-decks', 'plan-pro', 'max_decks', 'Maximum Decks', 'number', '50'),
    ('feat-pro-cards', 'plan-pro', 'max_cards_per_deck', 'Cards per Deck', 'number', '1000'),
    ('feat-pro-ai', 'plan-pro', 'ai_card_generation', 'AI Card Generation', 'boolean', 'true'),
    ('feat-pro-analytics', 'plan-pro', 'advanced_analytics', 'Advanced Analytics', 'boolean', 'true'),
    ('feat-pro-export', 'plan-pro', 'export_import', 'Export/Import', 'boolean', 'true'),
    ('feat-pro-collab', 'plan-pro', 'collaboration', 'Deck Collaboration', 'boolean', 'true'),
    ('feat-pro-priority', 'plan-pro', 'priority_support', 'Priority Support', 'boolean', 'false');

-- ============================================
-- Premium Plan Features
-- ============================================
INSERT OR IGNORE INTO plan_features (id, plan_id, feature_key, feature_name, value_type, value) VALUES
    ('feat-premium-decks', 'plan-premium', 'max_decks', 'Maximum Decks', 'number', '-1'),
    ('feat-premium-cards', 'plan-premium', 'max_cards_per_deck', 'Cards per Deck', 'number', '-1'),
    ('feat-premium-ai', 'plan-premium', 'ai_card_generation', 'AI Card Generation', 'boolean', 'true'),
    ('feat-premium-analytics', 'plan-premium', 'advanced_analytics', 'Advanced Analytics', 'boolean', 'true'),
    ('feat-premium-export', 'plan-premium', 'export_import', 'Export/Import', 'boolean', 'true'),
    ('feat-premium-collab', 'plan-premium', 'collaboration', 'Deck Collaboration', 'boolean', 'true'),
    ('feat-premium-priority', 'plan-premium', 'priority_support', 'Priority Support', 'boolean', 'true');
