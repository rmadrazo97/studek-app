-- Migration: 011_xp_transactions_updated_at
-- Description: Add updated_at column to xp_transactions table
-- This fixes compatibility with the generic CRUD helper that expects this column
-- Created: 2024-01-01

-- Using SQLite table recreation pattern since ALTER TABLE has limitations

-- Step 1: Cleanup any leftover temp tables
DROP TABLE IF EXISTS xp_transactions_new;
DROP TABLE IF EXISTS xp_transactions_backup;

-- Step 2: Create new table with proper schema
CREATE TABLE xp_transactions_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Copy data from old table (set updated_at to created_at for existing rows)
INSERT INTO xp_transactions_new (id, user_id, amount, source, source_id, metadata, created_at, updated_at)
SELECT id, user_id, amount, source, source_id, metadata, created_at, created_at
FROM xp_transactions;

-- Step 4: Drop old table
DROP TABLE xp_transactions;

-- Step 5: Rename new table
ALTER TABLE xp_transactions_new RENAME TO xp_transactions;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at);
