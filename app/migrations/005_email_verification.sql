-- Migration: 005_email_verification
-- Description: Add email verification and password reset fields to users table
-- Created: 2024-12-07

-- ============================================
-- Add Email Verification Fields to Users
-- ============================================

-- Email verified status (default to false for new users)
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

-- Verification token and expiry
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_token_expires_at TEXT;

-- Password reset token and expiry
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TEXT;

-- ============================================
-- Indexes for Token Lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- ============================================
-- Set existing users as verified (optional)
-- Uncomment if you want existing users to be auto-verified
-- ============================================
-- UPDATE users SET email_verified = 1;
