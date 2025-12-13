-- Migration: 013_native_push_tokens.sql
-- Description: Add native push notification tokens for iOS (APNs) and Android (FCM)
-- Created: 2024-12-13

-- Native push tokens table for APNs and FCM device tokens
CREATE TABLE IF NOT EXISTS native_push_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('ios', 'android')),
  token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_native_push_tokens_user_id ON native_push_tokens(user_id);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_native_push_tokens_token ON native_push_tokens(token);

-- Index for platform-specific queries
CREATE INDEX IF NOT EXISTS idx_native_push_tokens_platform ON native_push_tokens(platform);
