-- Migration: 010_user_achievements_timestamps
-- Description: Add created_at and updated_at columns to user_achievements table
-- This fixes compatibility with the generic CRUD helper that expects these columns
-- Created: 2024-01-01

-- Using SQLite table recreation pattern since ALTER TABLE has limitations

-- Step 1: Cleanup any leftover temp tables
DROP TABLE IF EXISTS user_achievements_new;
DROP TABLE IF EXISTS user_achievements_backup;

-- Step 2: Create new table with proper schema
CREATE TABLE user_achievements_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

-- Step 3: Copy data from old table (set created_at and updated_at to unlocked_at for existing rows)
INSERT INTO user_achievements_new (id, user_id, achievement_id, unlocked_at, created_at, updated_at)
SELECT id, user_id, achievement_id, unlocked_at, unlocked_at, unlocked_at
FROM user_achievements;

-- Step 4: Drop old table
DROP TABLE user_achievements;

-- Step 5: Rename new table
ALTER TABLE user_achievements_new RENAME TO user_achievements;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
