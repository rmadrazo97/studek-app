/**
 * Email Notification Service
 *
 * Handles sending email notifications for study reminders,
 * streak warnings, and weekly summaries.
 */

import {
  studyReminderEmailTemplate,
  streakWarningEmailTemplate,
  weeklySummaryEmailTemplate,
} from '@/lib/email/templates';
import {
  createNotificationLog,
  updateNotificationLogStatus,
  isNotificationEnabled,
  wasNotificationSentRecently,
} from '@/lib/db/services/notifications';
import type { NotificationType } from '@/lib/db/types';

// Type for Resend client
interface ResendClient {
  emails: {
    send: (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<{ data?: { id: string }; error?: { message: string } }>;
  };
}

// Lazy-loaded Resend client
let resendClient: ResendClient | null | undefined = undefined;

async function getResendClient(): Promise<ResendClient | null> {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[NotificationEmail] RESEND_API_KEY not set.');
    resendClient = null;
    return null;
  }

  try {
    const { Resend } = await import('resend');
    resendClient = new Resend(apiKey) as unknown as ResendClient;
    return resendClient;
  } catch {
    console.warn('[NotificationEmail] Resend package not available.');
    resendClient = null;
    return null;
  }
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'Studek <onboarding@resend.dev>';
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://studek.com';
}

export interface SendEmailNotificationResult {
  success: boolean;
  log_id?: string;
  message_id?: string;
  error?: string;
}

/**
 * Send a notification email
 */
async function sendNotificationEmail(
  userId: string,
  email: string,
  type: NotificationType,
  subject: string,
  html: string
): Promise<SendEmailNotificationResult> {
  // Check if this type is enabled
  if (!isNotificationEnabled(userId, type, 'email')) {
    return { success: false, error: 'Notification type disabled' };
  }

  // Check if we already sent this type recently
  if (wasNotificationSentRecently(userId, type, 20)) {
    return { success: false, error: 'Already sent recently' };
  }

  // Create log entry
  const log = createNotificationLog({
    user_id: userId,
    type,
    channel: 'email',
    title: subject,
    body: null,
  });

  const resend = await getResendClient();

  if (!resend) {
    console.log(`[NotificationEmail] Would send ${type} to:`, email);
    console.log('[NotificationEmail] Subject:', subject);
    updateNotificationLogStatus(log.id, 'sent', { email_message_id: 'dev-mode' });
    return { success: true, log_id: log.id, message_id: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error(`[NotificationEmail] Failed to send ${type}:`, error);
      updateNotificationLogStatus(log.id, 'failed', { error_message: error.message });
      return { success: false, log_id: log.id, error: error.message };
    }

    updateNotificationLogStatus(log.id, 'sent', { email_message_id: data?.id });
    console.log(`[NotificationEmail] Sent ${type} to:`, email);
    return { success: true, log_id: log.id, message_id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[NotificationEmail] Error sending ${type}:`, err);
    updateNotificationLogStatus(log.id, 'failed', { error_message: errorMessage });
    return { success: false, log_id: log.id, error: errorMessage };
  }
}

/**
 * Send study reminder email
 */
export async function sendStudyReminderEmail(
  userId: string,
  email: string,
  data: {
    name: string | null;
    cardsDue: number;
    currentStreak: number;
  }
): Promise<SendEmailNotificationResult> {
  const template = studyReminderEmailTemplate({
    ...data,
    studyUrl: `${getAppUrl()}/study`,
  });

  return sendNotificationEmail(
    userId,
    email,
    'study_reminder',
    template.subject,
    template.html
  );
}

/**
 * Send streak warning email
 */
export async function sendStreakWarningEmail(
  userId: string,
  email: string,
  data: {
    name: string | null;
    currentStreak: number;
    xpNeeded: number;
  }
): Promise<SendEmailNotificationResult> {
  // Calculate hours remaining until midnight in UTC
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const hoursRemaining = Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));

  const template = streakWarningEmailTemplate({
    ...data,
    hoursRemaining,
    studyUrl: `${getAppUrl()}/study`,
  });

  return sendNotificationEmail(
    userId,
    email,
    'streak_warning',
    template.subject,
    template.html
  );
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(
  userId: string,
  email: string,
  data: {
    name: string | null;
    weeklyXP: number;
    totalReviews: number;
    currentStreak: number;
    retentionRate?: number;
    studyTimeMinutes?: number;
    cardsLearned?: number;
  }
): Promise<SendEmailNotificationResult> {
  const template = weeklySummaryEmailTemplate({
    ...data,
    retentionRate: data.retentionRate ?? 0,
    studyTimeMinutes: data.studyTimeMinutes ?? 0,
    cardsLearned: data.cardsLearned ?? 0,
    dashboardUrl: `${getAppUrl()}/dashboard`,
  });

  return sendNotificationEmail(
    userId,
    email,
    'weekly_summary',
    template.subject,
    template.html
  );
}

/**
 * Check if email notifications are configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
