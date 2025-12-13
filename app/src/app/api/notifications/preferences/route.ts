/**
 * GET /api/notifications/preferences - Get user notification preferences
 * PUT /api/notifications/preferences - Update user notification preferences
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications';

/**
 * GET - Get notification preferences
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const preferences = getNotificationPreferences(userId);

    return NextResponse.json({
      preferences: {
        // Email settings
        emailEnabled: !!preferences.email_enabled,
        emailStudyReminders: !!preferences.email_study_reminders,
        emailStreakWarnings: !!preferences.email_streak_warnings,
        emailWeeklySummary: !!preferences.email_weekly_summary,
        emailAchievementUnlocks: !!preferences.email_achievement_unlocks,

        // Push settings
        pushEnabled: !!preferences.push_enabled,
        pushStudyReminders: !!preferences.push_study_reminders,
        pushStreakWarnings: !!preferences.push_streak_warnings,
        pushCardsDue: !!preferences.push_cards_due,

        // Timing
        reminderTime: preferences.reminder_time,
        timezone: preferences.timezone,

        // Quiet hours
        quietHoursEnabled: !!preferences.quiet_hours_enabled,
        quietHoursStart: preferences.quiet_hours_start,
        quietHoursEnd: preferences.quiet_hours_end,
      },
    });
  } catch (error) {
    return handleApiError('GET /api/notifications/preferences', error, 'Failed to fetch preferences');
  }
});

/**
 * PUT - Update notification preferences
 */
export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json();

    // Map camelCase to snake_case for database
    const updates: Record<string, number | string | undefined> = {};

    if (body.emailEnabled !== undefined) updates.email_enabled = body.emailEnabled ? 1 : 0;
    if (body.emailStudyReminders !== undefined) updates.email_study_reminders = body.emailStudyReminders ? 1 : 0;
    if (body.emailStreakWarnings !== undefined) updates.email_streak_warnings = body.emailStreakWarnings ? 1 : 0;
    if (body.emailWeeklySummary !== undefined) updates.email_weekly_summary = body.emailWeeklySummary ? 1 : 0;
    if (body.emailAchievementUnlocks !== undefined) updates.email_achievement_unlocks = body.emailAchievementUnlocks ? 1 : 0;

    if (body.pushEnabled !== undefined) updates.push_enabled = body.pushEnabled ? 1 : 0;
    if (body.pushStudyReminders !== undefined) updates.push_study_reminders = body.pushStudyReminders ? 1 : 0;
    if (body.pushStreakWarnings !== undefined) updates.push_streak_warnings = body.pushStreakWarnings ? 1 : 0;
    if (body.pushCardsDue !== undefined) updates.push_cards_due = body.pushCardsDue ? 1 : 0;

    if (body.reminderTime !== undefined) {
      // Validate time format HH:MM
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.reminderTime)) {
        return NextResponse.json(
          { error: 'Invalid reminder time format. Use HH:MM' },
          { status: 400 }
        );
      }
      updates.reminder_time = body.reminderTime;
    }

    if (body.timezone !== undefined) {
      // Basic timezone validation
      try {
        new Date().toLocaleString('en-US', { timeZone: body.timezone });
        updates.timezone = body.timezone;
      } catch {
        return NextResponse.json(
          { error: 'Invalid timezone' },
          { status: 400 }
        );
      }
    }

    if (body.quietHoursEnabled !== undefined) updates.quiet_hours_enabled = body.quietHoursEnabled ? 1 : 0;
    if (body.quietHoursStart !== undefined) {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.quietHoursStart)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours start time format. Use HH:MM' },
          { status: 400 }
        );
      }
      updates.quiet_hours_start = body.quietHoursStart;
    }
    if (body.quietHoursEnd !== undefined) {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.quietHoursEnd)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours end time format. Use HH:MM' },
          { status: 400 }
        );
      }
      updates.quiet_hours_end = body.quietHoursEnd;
    }

    const preferences = updateNotificationPreferences(userId, updates);

    return NextResponse.json({
      message: 'Preferences updated',
      preferences: {
        emailEnabled: !!preferences.email_enabled,
        emailStudyReminders: !!preferences.email_study_reminders,
        emailStreakWarnings: !!preferences.email_streak_warnings,
        emailWeeklySummary: !!preferences.email_weekly_summary,
        emailAchievementUnlocks: !!preferences.email_achievement_unlocks,
        pushEnabled: !!preferences.push_enabled,
        pushStudyReminders: !!preferences.push_study_reminders,
        pushStreakWarnings: !!preferences.push_streak_warnings,
        pushCardsDue: !!preferences.push_cards_due,
        reminderTime: preferences.reminder_time,
        timezone: preferences.timezone,
        quietHoursEnabled: !!preferences.quiet_hours_enabled,
        quietHoursStart: preferences.quiet_hours_start,
        quietHoursEnd: preferences.quiet_hours_end,
      },
    });
  } catch (error) {
    return handleApiError('PUT /api/notifications/preferences', error, 'Failed to update preferences');
  }
});
