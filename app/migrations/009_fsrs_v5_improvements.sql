-- Migration: 009_fsrs_v5_improvements
-- Description: Add FSRS v5 features - learning steps, personalized weights, enhanced tracking
-- Created: 2024-01-01

-- ============================================
-- Add learning step tracking to card_fsrs
-- ============================================

-- Add step column for learning/relearning step tracking
ALTER TABLE card_fsrs ADD COLUMN step INTEGER NOT NULL DEFAULT 0;

-- Add elapsed_days for same-day review handling
ALTER TABLE card_fsrs ADD COLUMN elapsed_days REAL NOT NULL DEFAULT 0;

-- Add scheduled_days for tracking the assigned interval
ALTER TABLE card_fsrs ADD COLUMN scheduled_days INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- User FSRS Parameters (Personalized Weights)
-- ============================================
CREATE TABLE IF NOT EXISTS user_fsrs_params (
    user_id TEXT PRIMARY KEY,

    -- 19 FSRS v5 weights stored as JSON array
    weights TEXT NOT NULL DEFAULT '[0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.007, 1.9395, 0.11, 0.2939, 2.2697, 0.2315, 2.9898, 0.51, 0.6]',

    -- Scheduling preferences
    request_retention REAL NOT NULL DEFAULT 0.9,
    maximum_interval INTEGER NOT NULL DEFAULT 36500,

    -- Learning steps configuration (JSON arrays of minutes)
    learning_steps TEXT NOT NULL DEFAULT '[1, 10]',
    relearning_steps TEXT NOT NULL DEFAULT '[10]',
    graduating_interval INTEGER NOT NULL DEFAULT 1,
    easy_interval INTEGER NOT NULL DEFAULT 4,

    -- Fuzzing settings
    enable_fuzz INTEGER NOT NULL DEFAULT 1,
    fuzz_factor REAL NOT NULL DEFAULT 0.05,

    -- Short-term scheduling (v6 experimental)
    enable_short_term INTEGER NOT NULL DEFAULT 0,

    -- Optimization metadata
    last_optimized_at TEXT,
    optimization_sample_size INTEGER DEFAULT 0,
    optimization_loss REAL,
    optimization_rmse REAL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Deck-specific FSRS Parameters (Optional Override)
-- ============================================
CREATE TABLE IF NOT EXISTS deck_fsrs_params (
    deck_id TEXT PRIMARY KEY,

    -- Override weights for this deck (null = use user defaults)
    weights TEXT,

    -- Scheduling preferences
    request_retention REAL,
    maximum_interval INTEGER,

    -- Learning steps configuration
    learning_steps TEXT,
    relearning_steps TEXT,
    graduating_interval INTEGER,
    easy_interval INTEGER,

    -- Fuzzing settings
    enable_fuzz INTEGER,
    fuzz_factor REAL,

    -- Optimization metadata
    last_optimized_at TEXT,
    optimization_sample_size INTEGER,
    optimization_loss REAL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- ============================================
-- Enhanced Review Logs
-- ============================================

-- Add state tracking columns if they don't exist
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS
-- These will be handled gracefully if columns already exist

-- state_before: Card state before this review
-- state_after: Card state after this review
-- step_before: Learning step before review
-- step_after: Learning step after review
-- retrievability: Predicted R at time of review

-- We'll add these via application code since SQLite ALTER TABLE is limited

-- ============================================
-- Optimization History (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS fsrs_optimization_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    deck_id TEXT, -- NULL for user-level optimization

    -- Results
    weights_before TEXT NOT NULL,
    weights_after TEXT NOT NULL,
    loss_before REAL NOT NULL,
    loss_after REAL NOT NULL,
    improvement_percent REAL NOT NULL,
    rmse REAL NOT NULL,
    sample_size INTEGER NOT NULL,
    iterations INTEGER NOT NULL,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fsrs_opt_history_user ON fsrs_optimization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fsrs_opt_history_deck ON fsrs_optimization_history(deck_id);

-- ============================================
-- Card Statistics for Analytics
-- ============================================
CREATE TABLE IF NOT EXISTS card_statistics (
    card_id TEXT PRIMARY KEY,

    -- Retention tracking
    review_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0, -- Current correct streak
    best_streak INTEGER NOT NULL DEFAULT 0,

    -- Time tracking
    total_time_ms INTEGER NOT NULL DEFAULT 0,
    avg_time_ms REAL NOT NULL DEFAULT 0,

    -- Difficulty analysis
    avg_difficulty REAL NOT NULL DEFAULT 5,
    difficulty_history TEXT NOT NULL DEFAULT '[]', -- JSON array of last 10 difficulties

    -- Lapse analysis
    lapse_count INTEGER NOT NULL DEFAULT 0,
    last_lapse_at TEXT,
    is_leech INTEGER NOT NULL DEFAULT 0, -- Flagged as problematic card

    -- Timestamps
    first_review_at TEXT,
    last_review_at TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Index for finding leeches
CREATE INDEX IF NOT EXISTS idx_card_stats_leech ON card_statistics(is_leech) WHERE is_leech = 1;
