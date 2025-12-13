-- Migration: 010_notifications
-- Description: Add notification preferences, push subscriptions, and notification logs
-- Created: 2025-01-01

-- ============================================
-- Notification Preferences Table
-- User settings for email and push notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY,

    -- Email Notifications
    email_enabled INTEGER NOT NULL DEFAULT 1,  -- Master switch for emails
    email_study_reminders INTEGER NOT NULL DEFAULT 1,  -- Daily study reminders
    email_streak_warnings INTEGER NOT NULL DEFAULT 1,  -- Streak at risk alerts
    email_weekly_summary INTEGER NOT NULL DEFAULT 1,  -- Weekly progress summary
    email_achievement_unlocks INTEGER NOT NULL DEFAULT 1,  -- Achievement notifications

    -- Push Notifications
    push_enabled INTEGER NOT NULL DEFAULT 1,  -- Master switch for push
    push_study_reminders INTEGER NOT NULL DEFAULT 1,  -- Daily study reminders
    push_streak_warnings INTEGER NOT NULL DEFAULT 1,  -- Streak at risk alerts
    push_cards_due INTEGER NOT NULL DEFAULT 1,  -- Cards due notification

    -- Timing Preferences
    reminder_time TEXT NOT NULL DEFAULT '09:00',  -- Preferred reminder time (HH:MM in user's timezone)
    timezone TEXT NOT NULL DEFAULT 'UTC',  -- User's timezone

    -- Quiet Hours
    quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
    quiet_hours_start TEXT DEFAULT '22:00',  -- Start of quiet hours (HH:MM)
    quiet_hours_end TEXT DEFAULT '08:00',  -- End of quiet hours (HH:MM)

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Push Subscriptions Table
-- Store VAPID push subscriptions for each device
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    -- Subscription details (from PushSubscription JSON)
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,  -- Public key
    auth_key TEXT NOT NULL,  -- Auth secret

    -- Device info
    device_name TEXT,  -- User-provided or auto-detected device name
    user_agent TEXT,  -- Browser user agent for debugging

    -- Status
    is_active INTEGER NOT NULL DEFAULT 1,
    last_used_at TEXT,  -- Last time a notification was sent to this subscription
    error_count INTEGER NOT NULL DEFAULT 0,  -- Failed delivery attempts

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active, user_id);

-- ============================================
-- Notification Logs Table
-- Track sent notifications to prevent spam and for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    -- Notification details
    type TEXT NOT NULL,  -- 'study_reminder', 'streak_warning', 'weekly_summary', 'achievement', 'cards_due'
    channel TEXT NOT NULL,  -- 'email', 'push'

    -- Content
    title TEXT NOT NULL,
    body TEXT,

    -- Delivery status
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed', 'clicked'
    error_message TEXT,

    -- Tracking
    sent_at TEXT,
    delivered_at TEXT,
    clicked_at TEXT,

    -- Reference
    subscription_id TEXT,  -- For push notifications
    email_message_id TEXT,  -- For email notifications (from Resend)

    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status, type);

-- ============================================
-- Notification Schedule Table
-- Track when users should receive their next notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notification_schedule (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    -- Schedule details
    notification_type TEXT NOT NULL,  -- 'study_reminder', 'streak_warning', 'weekly_summary'
    scheduled_for TEXT NOT NULL,  -- When to send (datetime)

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'sent', 'cancelled'

    -- Tracking
    processed_at TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, notification_type, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_notification_schedule_pending ON notification_schedule(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_user ON notification_schedule(user_id, notification_type);
