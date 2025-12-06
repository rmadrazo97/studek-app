-- Migration: 003_deck_share_links
-- Description: Add public share links for decks
-- Created: 2024-01-15

-- ============================================
-- Deck Share Links Table
-- ============================================
-- Allows users to create public shareable links for their decks
-- Different from deck_shares which is for user-to-user sharing

CREATE TABLE IF NOT EXISTS deck_share_links (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'clone')),
    is_active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT,
    access_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deck_share_links_deck_id ON deck_share_links(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_share_links_code ON deck_share_links(code);
CREATE INDEX IF NOT EXISTS idx_deck_share_links_active ON deck_share_links(is_active);

-- ============================================
-- Deck Clone History Table
-- ============================================
-- Track when users clone shared decks

CREATE TABLE IF NOT EXISTS deck_clones (
    id TEXT PRIMARY KEY,
    original_deck_id TEXT NOT NULL,
    cloned_deck_id TEXT NOT NULL,
    cloned_by_user_id TEXT NOT NULL,
    share_link_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (original_deck_id) REFERENCES decks(id) ON DELETE SET NULL,
    FOREIGN KEY (cloned_deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (cloned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (share_link_id) REFERENCES deck_share_links(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deck_clones_original ON deck_clones(original_deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_clones_cloned_by ON deck_clones(cloned_by_user_id);
