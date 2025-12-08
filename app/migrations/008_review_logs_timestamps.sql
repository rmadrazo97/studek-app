-- Migration: 008_review_logs_timestamps
-- Description: Add created_at and updated_at columns to review_logs table
-- Created: 2024-12-08

-- These columns are needed by the generic CRUD create() function

-- Add created_at column (use reviewed_at as default for existing rows)
ALTER TABLE review_logs ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Add updated_at column
ALTER TABLE review_logs ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Update existing rows to use reviewed_at as created_at
UPDATE review_logs SET created_at = reviewed_at WHERE created_at = datetime('now');
