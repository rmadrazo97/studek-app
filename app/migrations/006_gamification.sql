-- Migration: 006_gamification
-- Description: Add gamification features - XP, streaks, leagues
-- Created: 2024-01-01

-- ============================================
-- User Stats Table (Gamification State)
-- Fast lookups for UI header and leaderboards
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id TEXT PRIMARY KEY,
    -- XP System
    total_xp INTEGER NOT NULL DEFAULT 0,
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    week_start_date TEXT NOT NULL DEFAULT (date('now', 'weekday 0', '-7 days')),

    -- Streak System
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_study_date TEXT,
    streak_freezes_available INTEGER NOT NULL DEFAULT 1,
    streak_freezes_used INTEGER NOT NULL DEFAULT 0,

    -- League System
    league_tier INTEGER NOT NULL DEFAULT 1, -- 1=Bronze, 2=Silver, 3=Gold, 4=Diamond, 5=Champion
    league_cohort_id TEXT,
    league_rank INTEGER,

    -- Combo/Session Stats
    best_combo INTEGER NOT NULL DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_study_time_ms INTEGER NOT NULL DEFAULT 0,

    -- Daily Goals
    daily_xp_goal INTEGER NOT NULL DEFAULT 50,
    daily_xp_earned INTEGER NOT NULL DEFAULT 0,
    daily_goal_date TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_stats_league ON user_stats(league_tier, weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_stats(current_streak DESC);

-- ============================================
-- League Cohorts Table
-- Weekly cohorts of ~30 users with similar XP velocity
-- ============================================
CREATE TABLE IF NOT EXISTS league_cohorts (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL,
    league_tier INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_league_cohorts_week ON league_cohorts(week_start_date, league_tier);

-- ============================================
-- XP Transactions Table (Audit Log)
-- Track every XP gain for transparency and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'review', 'new_card', 'combo', 'speed', 'difficulty', 'streak', 'achievement'
    source_id TEXT, -- card_id, session_id, etc.
    metadata TEXT, -- JSON with additional context
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_date ON xp_transactions(created_at);

-- ============================================
-- Achievements Table
-- Unlockable achievements and badges
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL, -- 'streak', 'reviews', 'mastery', 'speed', 'consistency'
    requirement_type TEXT NOT NULL, -- 'count', 'streak', 'retention', 'time'
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    rarity TEXT NOT NULL DEFAULT 'common' -- 'common', 'rare', 'epic', 'legendary'
);

-- Seed default achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
-- Streak Achievements
('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 'streak', 7, 100, 'common'),
('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'flame', 'streak', 'streak', 30, 500, 'rare'),
('streak_100', 'Century Scholar', 'Maintain a 100-day streak', 'flame', 'streak', 'streak', 100, 2000, 'epic'),
('streak_365', 'Year of Dedication', 'Maintain a 365-day streak', 'crown', 'streak', 'streak', 365, 10000, 'legendary'),

-- Review Count Achievements
('reviews_100', 'Getting Started', 'Complete 100 reviews', 'book', 'reviews', 'count', 100, 50, 'common'),
('reviews_1000', 'Thousand Cards', 'Complete 1,000 reviews', 'book-open', 'reviews', 'count', 1000, 200, 'common'),
('reviews_10000', 'Ten Thousand', 'Complete 10,000 reviews', 'library', 'reviews', 'count', 10000, 1000, 'rare'),
('reviews_100000', 'Memory Master', 'Complete 100,000 reviews', 'graduation-cap', 'reviews', 'count', 100000, 5000, 'legendary'),

-- Speed Achievements
('speed_demon', 'Speed Demon', 'Answer 10 cards in under 5 seconds each', 'zap', 'speed', 'count', 10, 100, 'rare'),
('lightning', 'Lightning Fast', 'Answer 50 cards in under 3 seconds each', 'bolt', 'speed', 'count', 50, 500, 'epic'),

-- Retention Achievements
('perfect_session', 'Perfect Session', 'Complete a session with 100% retention', 'star', 'mastery', 'retention', 100, 150, 'rare'),
('retention_master', 'Retention Master', 'Maintain 95%+ retention for 30 days', 'target', 'mastery', 'retention', 95, 1000, 'epic');

-- ============================================
-- User Achievements Table (Unlocked)
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- Add state tracking to review_logs
-- ============================================
-- Add columns if they don't exist (SQLite doesn't have ADD COLUMN IF NOT EXISTS)
-- These will be handled by the application if columns already exist

-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we handle this in code
-- The following columns should be added:
-- state_before TEXT (card state before review)
-- state_after TEXT (card state after review)
-- xp_earned INTEGER (XP earned from this review)
