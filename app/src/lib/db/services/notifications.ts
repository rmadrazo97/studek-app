/**
 * Notifications Database Service
 *
 * Provides operations for notification preferences, push subscriptions,
 * and notification logs.
 */

import { getDatabase, transaction } from '../index';
import { create, now } from '../crud';
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
  PushSubscription,
  PushSubscriptionCreate,
  NotificationLog,
  NotificationLogCreate,
  NotificationSchedule,
  NotificationType,
} from '../types';

const NOTIFICATION_PREFERENCES_TABLE = 'notification_preferences';
const PUSH_SUBSCRIPTIONS_TABLE = 'push_subscriptions';
const NOTIFICATION_LOGS_TABLE = 'notification_logs';
const NOTIFICATION_SCHEDULE_TABLE = 'notification_schedule';

// Track if we've ensured tables exist
let tablesEnsured = false;

/**
 * Ensure notification tables exist (fallback if migrations didn't run)
 */
function ensureTablesExist(): void {
  if (tablesEnsured) return;

  const db = getDatabase();

  try {
    // Check if notification_preferences table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='notification_preferences'
    `).get();

    if (!tableExists) {
      console.log('[Notifications] Creating notification tables...');

      // Create notification_preferences table
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
          user_id TEXT PRIMARY KEY,
          email_enabled INTEGER NOT NULL DEFAULT 1,
          email_study_reminders INTEGER NOT NULL DEFAULT 1,
          email_streak_warnings INTEGER NOT NULL DEFAULT 1,
          email_weekly_summary INTEGER NOT NULL DEFAULT 1,
          email_achievement_unlocks INTEGER NOT NULL DEFAULT 1,
          push_enabled INTEGER NOT NULL DEFAULT 1,
          push_study_reminders INTEGER NOT NULL DEFAULT 1,
          push_streak_warnings INTEGER NOT NULL DEFAULT 1,
          push_cards_due INTEGER NOT NULL DEFAULT 1,
          reminder_time TEXT NOT NULL DEFAULT '09:00',
          timezone TEXT NOT NULL DEFAULT 'UTC',
          quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
          quiet_hours_start TEXT DEFAULT '22:00',
          quiet_hours_end TEXT DEFAULT '08:00',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create push_subscriptions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          device_name TEXT,
          user_agent TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_used_at TEXT,
          error_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create notification_logs table
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          channel TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          error_message TEXT,
          sent_at TEXT,
          delivered_at TEXT,
          clicked_at TEXT,
          subscription_id TEXT,
          email_message_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create notification_schedule table
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_schedule (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          notification_type TEXT NOT NULL,
          scheduled_for TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          processed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, notification_type, scheduled_for)
        )
      `);

      console.log('[Notifications] Tables created successfully');
    }

    tablesEnsured = true;
  } catch (error) {
    console.error('[Notifications] Failed to ensure tables:', error);
    tablesEnsured = true;
  }
}

// ============================================
// Notification Preferences
// ============================================

/**
 * Get user notification preferences, creating defaults if not exist
 */
export function getNotificationPreferences(userId: string): NotificationPreferences {
  ensureTablesExist();

  const db = getDatabase();
  const existing = db.prepare(
    `SELECT * FROM ${NOTIFICATION_PREFERENCES_TABLE} WHERE user_id = ?`
  ).get(userId) as NotificationPreferences | undefined;

  if (existing) {
    return existing;
  }

  // Create default preferences
  db.prepare(`
    INSERT INTO ${NOTIFICATION_PREFERENCES_TABLE} (
      user_id, created_at, updated_at
    ) VALUES (?, ?, ?)
  `).run(userId, now(), now());

  return db.prepare(
    `SELECT * FROM ${NOTIFICATION_PREFERENCES_TABLE} WHERE user_id = ?`
  ).get(userId) as NotificationPreferences;
}

/**
 * Update user notification preferences
 */
export function updateNotificationPreferences(
  userId: string,
  updates: NotificationPreferencesUpdate
): NotificationPreferences {
  ensureTablesExist();

  const db = getDatabase();

  // Ensure preferences exist
  getNotificationPreferences(userId);

  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return getNotificationPreferences(userId);
  }

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  db.prepare(`
    UPDATE ${NOTIFICATION_PREFERENCES_TABLE}
    SET ${setClause}, updated_at = ?
    WHERE user_id = ?
  `).run(...values, now(), userId);

  return getNotificationPreferences(userId);
}

/**
 * Check if a notification type is enabled for a user
 */
export function isNotificationEnabled(
  userId: string,
  type: NotificationType,
  channel: 'email' | 'push'
): boolean {
  const prefs = getNotificationPreferences(userId);

  // Check master switch
  if (channel === 'email' && !prefs.email_enabled) return false;
  if (channel === 'push' && !prefs.push_enabled) return false;

  // Check specific type
  if (channel === 'email') {
    switch (type) {
      case 'study_reminder':
        return !!prefs.email_study_reminders;
      case 'streak_warning':
        return !!prefs.email_streak_warnings;
      case 'weekly_summary':
        return !!prefs.email_weekly_summary;
      case 'achievement':
        return !!prefs.email_achievement_unlocks;
      default:
        return false;
    }
  } else {
    switch (type) {
      case 'study_reminder':
        return !!prefs.push_study_reminders;
      case 'streak_warning':
        return !!prefs.push_streak_warnings;
      case 'cards_due':
        return !!prefs.push_cards_due;
      default:
        return false;
    }
  }
}

/**
 * Check if current time is in quiet hours
 */
export function isInQuietHours(userId: string): boolean {
  const prefs = getNotificationPreferences(userId);

  if (!prefs.quiet_hours_enabled) return false;

  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: prefs.timezone || 'UTC',
  });

  const start = prefs.quiet_hours_start || '22:00';
  const end = prefs.quiet_hours_end || '08:00';

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return nowTime >= start || nowTime < end;
  }

  return nowTime >= start && nowTime < end;
}

// ============================================
// Push Subscriptions
// ============================================

/**
 * Get all push subscriptions for a user
 */
export function getUserPushSubscriptions(userId: string): PushSubscription[] {
  ensureTablesExist();

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${PUSH_SUBSCRIPTIONS_TABLE}
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).all(userId) as PushSubscription[];
}

/**
 * Get a push subscription by endpoint
 */
export function getPushSubscriptionByEndpoint(endpoint: string): PushSubscription | null {
  ensureTablesExist();

  const db = getDatabase();
  const result = db.prepare(
    `SELECT * FROM ${PUSH_SUBSCRIPTIONS_TABLE} WHERE endpoint = ?`
  ).get(endpoint) as PushSubscription | undefined;

  return result || null;
}

/**
 * Create or update a push subscription
 */
export function upsertPushSubscription(data: PushSubscriptionCreate): PushSubscription {
  ensureTablesExist();

  const db = getDatabase();

  // Check if subscription with this endpoint already exists
  const existing = getPushSubscriptionByEndpoint(data.endpoint);

  if (existing) {
    // Update existing subscription
    db.prepare(`
      UPDATE ${PUSH_SUBSCRIPTIONS_TABLE}
      SET user_id = ?, p256dh_key = ?, auth_key = ?, device_name = ?,
          user_agent = ?, is_active = 1, error_count = 0, updated_at = ?
      WHERE endpoint = ?
    `).run(
      data.user_id,
      data.p256dh_key,
      data.auth_key,
      data.device_name || null,
      data.user_agent || null,
      now(),
      data.endpoint
    );

    return db.prepare(
      `SELECT * FROM ${PUSH_SUBSCRIPTIONS_TABLE} WHERE endpoint = ?`
    ).get(data.endpoint) as PushSubscription;
  }

  // Create new subscription
  return create<PushSubscription>(PUSH_SUBSCRIPTIONS_TABLE, {
    user_id: data.user_id,
    endpoint: data.endpoint,
    p256dh_key: data.p256dh_key,
    auth_key: data.auth_key,
    device_name: data.device_name || null,
    user_agent: data.user_agent || null,
  });
}

/**
 * Delete a push subscription by endpoint
 */
export function deletePushSubscription(endpoint: string): boolean {
  ensureTablesExist();

  const db = getDatabase();
  const result = db.prepare(
    `DELETE FROM ${PUSH_SUBSCRIPTIONS_TABLE} WHERE endpoint = ?`
  ).run(endpoint);

  return result.changes > 0;
}

/**
 * Mark a subscription as inactive (soft delete)
 */
export function deactivatePushSubscription(subscriptionId: string): void {
  ensureTablesExist();

  const db = getDatabase();
  db.prepare(`
    UPDATE ${PUSH_SUBSCRIPTIONS_TABLE}
    SET is_active = 0, updated_at = ?
    WHERE id = ?
  `).run(now(), subscriptionId);
}

/**
 * Increment error count for a subscription
 */
export function incrementSubscriptionErrors(subscriptionId: string): void {
  ensureTablesExist();

  const db = getDatabase();
  db.prepare(`
    UPDATE ${PUSH_SUBSCRIPTIONS_TABLE}
    SET error_count = error_count + 1, updated_at = ?
    WHERE id = ?
  `).run(now(), subscriptionId);

  // Deactivate if too many errors
  const sub = db.prepare(
    `SELECT error_count FROM ${PUSH_SUBSCRIPTIONS_TABLE} WHERE id = ?`
  ).get(subscriptionId) as { error_count: number } | undefined;

  if (sub && sub.error_count >= 5) {
    deactivatePushSubscription(subscriptionId);
  }
}

/**
 * Update last used timestamp for a subscription
 */
export function updateSubscriptionLastUsed(subscriptionId: string): void {
  ensureTablesExist();

  const db = getDatabase();
  db.prepare(`
    UPDATE ${PUSH_SUBSCRIPTIONS_TABLE}
    SET last_used_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now(), now(), subscriptionId);
}

// ============================================
// Notification Logs
// ============================================

/**
 * Create a notification log entry
 */
export function createNotificationLog(data: NotificationLogCreate): NotificationLog {
  ensureTablesExist();

  return create<NotificationLog>(NOTIFICATION_LOGS_TABLE, {
    user_id: data.user_id,
    type: data.type,
    channel: data.channel,
    title: data.title,
    body: data.body || null,
    subscription_id: data.subscription_id || null,
    status: 'pending',
  });
}

/**
 * Update notification log status
 */
export function updateNotificationLogStatus(
  logId: string,
  status: 'sent' | 'delivered' | 'failed' | 'clicked',
  extra?: { error_message?: string; email_message_id?: string }
): void {
  ensureTablesExist();

  const db = getDatabase();
  const timestampField =
    status === 'sent'
      ? 'sent_at'
      : status === 'delivered'
        ? 'delivered_at'
        : status === 'clicked'
          ? 'clicked_at'
          : null;

  let query = `UPDATE ${NOTIFICATION_LOGS_TABLE} SET status = ?`;
  const params: (string | null)[] = [status];

  if (timestampField) {
    query += `, ${timestampField} = ?`;
    params.push(now());
  }

  if (extra?.error_message) {
    query += ', error_message = ?';
    params.push(extra.error_message);
  }

  if (extra?.email_message_id) {
    query += ', email_message_id = ?';
    params.push(extra.email_message_id);
  }

  query += ' WHERE id = ?';
  params.push(logId);

  db.prepare(query).run(...params);
}

/**
 * Get recent notifications for a user
 */
export function getUserNotificationLogs(
  userId: string,
  limit = 50,
  offset = 0
): NotificationLog[] {
  ensureTablesExist();

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${NOTIFICATION_LOGS_TABLE}
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as NotificationLog[];
}

/**
 * Check if a notification of given type was sent recently
 */
export function wasNotificationSentRecently(
  userId: string,
  type: NotificationType,
  withinHours = 24
): boolean {
  ensureTablesExist();

  const db = getDatabase();
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

  const result = db.prepare(`
    SELECT COUNT(*) as count FROM ${NOTIFICATION_LOGS_TABLE}
    WHERE user_id = ? AND type = ? AND created_at > ? AND status != 'failed'
  `).get(userId, type, cutoff) as { count: number };

  return result.count > 0;
}

// ============================================
// Notification Scheduling
// ============================================

/**
 * Schedule a notification
 */
export function scheduleNotification(
  userId: string,
  type: NotificationType,
  scheduledFor: string
): NotificationSchedule | null {
  ensureTablesExist();

  const db = getDatabase();

  try {
    return create<NotificationSchedule>(NOTIFICATION_SCHEDULE_TABLE, {
      user_id: userId,
      notification_type: type,
      scheduled_for: scheduledFor,
      status: 'pending',
    });
  } catch {
    // Likely duplicate, return null
    return null;
  }
}

/**
 * Get pending notifications ready to be sent
 */
export function getPendingScheduledNotifications(limit = 100): NotificationSchedule[] {
  ensureTablesExist();

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${NOTIFICATION_SCHEDULE_TABLE}
    WHERE status = 'pending' AND scheduled_for <= datetime('now')
    ORDER BY scheduled_for ASC
    LIMIT ?
  `).all(limit) as NotificationSchedule[];
}

/**
 * Mark a scheduled notification as processed
 */
export function markScheduledNotificationProcessed(id: string): void {
  ensureTablesExist();

  const db = getDatabase();
  db.prepare(`
    UPDATE ${NOTIFICATION_SCHEDULE_TABLE}
    SET status = 'sent', processed_at = ?
    WHERE id = ?
  `).run(now(), id);
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(
  userId: string,
  type: NotificationType
): void {
  ensureTablesExist();

  const db = getDatabase();
  db.prepare(`
    UPDATE ${NOTIFICATION_SCHEDULE_TABLE}
    SET status = 'cancelled'
    WHERE user_id = ? AND notification_type = ? AND status = 'pending'
  `).run(userId, type);
}

// ============================================
// Batch Operations for Notification System
// ============================================

/**
 * Get users who need study reminders
 * Returns users who:
 * - Have email/push notifications enabled for study reminders
 * - Haven't studied today
 * - Haven't received a reminder today
 * - Are past their reminder time
 */
export function getUsersNeedingStudyReminders(): Array<{
  user_id: string;
  email: string;
  name: string | null;
  cards_due: number;
  current_streak: number;
  reminder_time: string;
  timezone: string;
  email_enabled: number;
  push_enabled: number;
}> {
  ensureTablesExist();

  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  return db.prepare(`
    SELECT
      u.id as user_id,
      u.email,
      u.name,
      COALESCE(us.current_streak, 0) as current_streak,
      np.reminder_time,
      np.timezone,
      np.email_enabled,
      np.push_enabled,
      (
        SELECT COUNT(*) FROM card_fsrs cf
        JOIN cards c ON cf.card_id = c.id
        JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = u.id AND cf.due <= datetime('now')
      ) as cards_due
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    JOIN notification_preferences np ON u.id = np.user_id
    WHERE u.email_verified = 1
      AND (np.email_study_reminders = 1 OR np.push_study_reminders = 1)
      AND (us.last_study_date IS NULL OR us.last_study_date < ?)
      AND u.id NOT IN (
        SELECT user_id FROM notification_logs
        WHERE type = 'study_reminder'
          AND created_at > datetime('now', '-20 hours')
          AND status != 'failed'
      )
  `).all(today) as Array<{
    user_id: string;
    email: string;
    name: string | null;
    cards_due: number;
    current_streak: number;
    reminder_time: string;
    timezone: string;
    email_enabled: number;
    push_enabled: number;
  }>;
}

/**
 * Get users with streaks at risk
 * Returns users who:
 * - Have a streak > 0
 * - Haven't studied today
 * - Haven't earned enough XP today
 * - Haven't received a streak warning today
 */
export function getUsersWithStreaksAtRisk(): Array<{
  user_id: string;
  email: string;
  name: string | null;
  current_streak: number;
  daily_xp_earned: number;
  daily_xp_goal: number;
  email_enabled: number;
  push_enabled: number;
}> {
  ensureTablesExist();

  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  return db.prepare(`
    SELECT
      u.id as user_id,
      u.email,
      u.name,
      us.current_streak,
      us.daily_xp_earned,
      us.daily_xp_goal,
      np.email_enabled,
      np.push_enabled
    FROM users u
    JOIN user_stats us ON u.id = us.user_id
    JOIN notification_preferences np ON u.id = np.user_id
    WHERE u.email_verified = 1
      AND us.current_streak > 0
      AND (us.last_study_date IS NULL OR us.last_study_date < ?)
      AND us.daily_xp_earned < us.daily_xp_goal
      AND (np.email_streak_warnings = 1 OR np.push_streak_warnings = 1)
      AND u.id NOT IN (
        SELECT user_id FROM notification_logs
        WHERE type = 'streak_warning'
          AND created_at > datetime('now', '-20 hours')
          AND status != 'failed'
      )
  `).all(today) as Array<{
    user_id: string;
    email: string;
    name: string | null;
    current_streak: number;
    daily_xp_earned: number;
    daily_xp_goal: number;
    email_enabled: number;
    push_enabled: number;
  }>;
}

/**
 * Get users for weekly summary (Sunday evening)
 */
export function getUsersForWeeklySummary(): Array<{
  user_id: string;
  email: string;
  name: string | null;
  weekly_xp: number;
  total_reviews_this_week: number;
  current_streak: number;
}> {
  ensureTablesExist();

  const db = getDatabase();

  return db.prepare(`
    SELECT
      u.id as user_id,
      u.email,
      u.name,
      COALESCE(us.weekly_xp, 0) as weekly_xp,
      COALESCE(us.current_streak, 0) as current_streak,
      (
        SELECT COUNT(*) FROM review_logs rl
        WHERE rl.user_id = u.id
          AND rl.reviewed_at > datetime('now', '-7 days')
      ) as total_reviews_this_week
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    JOIN notification_preferences np ON u.id = np.user_id
    WHERE u.email_verified = 1
      AND np.email_enabled = 1
      AND np.email_weekly_summary = 1
      AND u.id NOT IN (
        SELECT user_id FROM notification_logs
        WHERE type = 'weekly_summary'
          AND created_at > datetime('now', '-6 days')
          AND status != 'failed'
      )
  `).all() as Array<{
    user_id: string;
    email: string;
    name: string | null;
    weekly_xp: number;
    total_reviews_this_week: number;
    current_streak: number;
  }>;
}
