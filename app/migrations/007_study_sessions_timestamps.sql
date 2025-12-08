-- Migration: 007_study_sessions_timestamps
-- Description: Add created_at and updated_at columns to study_sessions table
-- Created: 2024-12-08

-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check if column exists first
-- These columns are needed by the generic CRUD create() function

-- Add created_at column (use started_at as default for existing rows)
ALTER TABLE study_sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Add updated_at column
ALTER TABLE study_sessions ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Update existing rows to use started_at as created_at
UPDATE study_sessions SET created_at = started_at WHERE created_at = datetime('now');
