-- Migration: 004_deck_categories
-- Description: Add category field to decks for explore functionality
-- Created: 2024-01-15

-- Add category column to decks table
ALTER TABLE decks ADD COLUMN category TEXT;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_decks_category ON decks(category);

-- Create index for public decks with category
CREATE INDEX IF NOT EXISTS idx_decks_public_category ON decks(is_public, category);

-- Add last_accessed_at for tracking recently visited decks
ALTER TABLE decks ADD COLUMN last_accessed_at TEXT;

-- Create deck_visits table to track user's recently visited decks
CREATE TABLE IF NOT EXISTS deck_visits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    deck_id TEXT NOT NULL,
    visited_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    UNIQUE(user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_visits_user ON deck_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_visits_recent ON deck_visits(user_id, visited_at DESC);
