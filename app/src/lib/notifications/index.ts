/**
 * Notification Service
 *
 * Main orchestrator for sending notifications via email and push.
 * Handles daily study reminders, streak warnings, and weekly summaries.
 */

import {
  getUsersNeedingStudyReminders,
  getUsersWithStreaksAtRisk,
  getUsersForWeeklySummary,
  isInQuietHours,
} from '@/lib/db/services/notifications';
import {
  sendStudyReminderEmail,
  sendStreakWarningEmail,
  sendWeeklySummaryEmail,
} from './email-service';
import {
  sendStudyReminderAllChannels,
  sendStreakWarningAllChannels,
} from './push-service';

export interface NotificationBatchResult {
  emailsSent: number;
  emailsFailed: number;
  pushSent: number;
  pushFailed: number;
  skipped: number;
  errors: string[];
}

/**
 * Process all pending study reminders
 * Should be called periodically (e.g., every hour)
 */
export async function processStudyReminders(): Promise<NotificationBatchResult> {
  const result: NotificationBatchResult = {
    emailsSent: 0,
    emailsFailed: 0,
    pushSent: 0,
    pushFailed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const users = getUsersNeedingStudyReminders();
    console.log(`[Notifications] Processing study reminders for ${users.length} users`);

    for (const user of users) {
      try {
        // Check quiet hours
        if (isInQuietHours(user.user_id)) {
          result.skipped++;
          continue;
        }

        // Check if it's time for reminder based on user's preferred time
        if (!isReminderTime(user.reminder_time, user.timezone)) {
          result.skipped++;
          continue;
        }

        // Send email if enabled
        if (user.email_enabled) {
          const emailResult = await sendStudyReminderEmail(user.user_id, user.email, {
            name: user.name,
            cardsDue: user.cards_due,
            currentStreak: user.current_streak,
          });

          if (emailResult.success) {
            result.emailsSent++;
          } else {
            result.emailsFailed++;
            if (emailResult.error && emailResult.error !== 'Already sent recently') {
              result.errors.push(`Email to ${user.email}: ${emailResult.error}`);
            }
          }
        }

        // Send push if enabled (to all channels: Web, iOS, Android)
        if (user.push_enabled) {
          const pushResult = await sendStudyReminderAllChannels(
            user.user_id,
            user.cards_due,
            user.current_streak
          );
          result.pushSent += pushResult.total.sent;
          result.pushFailed += pushResult.total.failed;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`User ${user.user_id}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Failed to get users: ${errorMessage}`);
  }

  console.log('[Notifications] Study reminder results:', result);
  return result;
}

/**
 * Process streak warnings
 * Should be called in the afternoon/evening to warn users at risk
 */
export async function processStreakWarnings(): Promise<NotificationBatchResult> {
  const result: NotificationBatchResult = {
    emailsSent: 0,
    emailsFailed: 0,
    pushSent: 0,
    pushFailed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const users = getUsersWithStreaksAtRisk();
    console.log(`[Notifications] Processing streak warnings for ${users.length} users`);

    for (const user of users) {
      try {
        // Check quiet hours
        if (isInQuietHours(user.user_id)) {
          result.skipped++;
          continue;
        }

        const xpNeeded = Math.max(0, user.daily_xp_goal - user.daily_xp_earned);

        // Send email if enabled
        if (user.email_enabled) {
          const emailResult = await sendStreakWarningEmail(user.user_id, user.email, {
            name: user.name,
            currentStreak: user.current_streak,
            xpNeeded,
          });

          if (emailResult.success) {
            result.emailsSent++;
          } else {
            result.emailsFailed++;
            if (emailResult.error && emailResult.error !== 'Already sent recently') {
              result.errors.push(`Email to ${user.email}: ${emailResult.error}`);
            }
          }
        }

        // Send push if enabled (to all channels: Web, iOS, Android)
        if (user.push_enabled) {
          const pushResult = await sendStreakWarningAllChannels(
            user.user_id,
            user.current_streak,
            xpNeeded
          );
          result.pushSent += pushResult.total.sent;
          result.pushFailed += pushResult.total.failed;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`User ${user.user_id}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Failed to get users: ${errorMessage}`);
  }

  console.log('[Notifications] Streak warning results:', result);
  return result;
}

/**
 * Process weekly summaries
 * Should be called on Sunday evening
 */
export async function processWeeklySummaries(): Promise<NotificationBatchResult> {
  const result: NotificationBatchResult = {
    emailsSent: 0,
    emailsFailed: 0,
    pushSent: 0,
    pushFailed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const users = getUsersForWeeklySummary();
    console.log(`[Notifications] Processing weekly summaries for ${users.length} users`);

    for (const user of users) {
      try {
        const emailResult = await sendWeeklySummaryEmail(user.user_id, user.email, {
          name: user.name,
          weeklyXP: user.weekly_xp,
          totalReviews: user.total_reviews_this_week,
          currentStreak: user.current_streak,
        });

        if (emailResult.success) {
          result.emailsSent++;
        } else {
          result.emailsFailed++;
          if (emailResult.error && emailResult.error !== 'Already sent recently') {
            result.errors.push(`Email to ${user.email}: ${emailResult.error}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`User ${user.user_id}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Failed to get users: ${errorMessage}`);
  }

  console.log('[Notifications] Weekly summary results:', result);
  return result;
}

/**
 * Check if it's time to send a reminder based on user's preferred time
 */
function isReminderTime(reminderTime: string, timezone: string): boolean {
  try {
    const now = new Date();
    const userTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone || 'UTC',
    });

    // Parse times
    const [userHour, userMinute] = userTime.split(':').map(Number);
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);

    // Allow within 1 hour window of reminder time
    const userMinutes = userHour * 60 + userMinute;
    const reminderMinutes = reminderHour * 60 + reminderMinute;

    return userMinutes >= reminderMinutes && userMinutes < reminderMinutes + 60;
  } catch {
    // If timezone parsing fails, default to sending
    return true;
  }
}

/**
 * Run all notification jobs
 * Convenience function for cron jobs
 */
export async function runNotificationJobs(): Promise<{
  studyReminders: NotificationBatchResult;
  streakWarnings: NotificationBatchResult;
  weeklySummary?: NotificationBatchResult;
}> {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  const results: {
    studyReminders: NotificationBatchResult;
    streakWarnings: NotificationBatchResult;
    weeklySummary?: NotificationBatchResult;
  } = {
    studyReminders: { emailsSent: 0, emailsFailed: 0, pushSent: 0, pushFailed: 0, skipped: 0, errors: [] },
    streakWarnings: { emailsSent: 0, emailsFailed: 0, pushSent: 0, pushFailed: 0, skipped: 0, errors: [] },
  };

  // Study reminders - run throughout the day
  results.studyReminders = await processStudyReminders();

  // Streak warnings - run in the afternoon/evening (14:00-22:00 UTC)
  if (hour >= 14 && hour < 22) {
    results.streakWarnings = await processStreakWarnings();
  }

  // Weekly summary - run on Sunday (day 0) at 18:00 UTC
  if (dayOfWeek === 0 && hour === 18) {
    results.weeklySummary = await processWeeklySummaries();
  }

  return results;
}

// Re-export useful functions
export {
  getVapidPublicKey,
  isPushConfigured,
  isAnyPushConfigured,
  sendPushToAllChannels,
} from './push-service';
export { isEmailConfigured } from './email-service';
export { isAPNsConfigured } from './apns-service';
export { isFCMConfigured } from './fcm-service';
export {
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserPushSubscriptions,
  upsertPushSubscription,
  deletePushSubscription,
  // Native push token functions
  getUserNativePushTokens,
  upsertNativePushToken,
  deleteNativePushToken,
} from '@/lib/db/services/notifications';
