/**
 * POST /api/notifications/trigger - Trigger notification jobs
 *
 * This endpoint is meant to be called by a cron job or admin.
 * Requires a secret token for authorization.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  processStudyReminders,
  processStreakWarnings,
  processWeeklySummaries,
  runNotificationJobs,
} from '@/lib/notifications';

// Secret token for cron authorization
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify cron authorization
 */
function verifyCronAuth(request: NextRequest): boolean {
  // In development, allow without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for secret in header or query param
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');

  if (!CRON_SECRET) {
    console.warn('[Notifications] CRON_SECRET not configured');
    return false;
  }

  const token = authHeader?.replace('Bearer ', '') || queryToken;
  return token === CRON_SECRET;
}

/**
 * POST - Trigger notification jobs
 *
 * Query params:
 * - job: 'all' | 'study_reminders' | 'streak_warnings' | 'weekly_summary'
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get('job') || 'all';

  try {
    let results;

    switch (job) {
      case 'study_reminders':
        results = { studyReminders: await processStudyReminders() };
        break;

      case 'streak_warnings':
        results = { streakWarnings: await processStreakWarnings() };
        break;

      case 'weekly_summary':
        results = { weeklySummary: await processWeeklySummaries() };
        break;

      case 'all':
      default:
        results = await runNotificationJobs();
        break;
    }

    console.log('[Notifications] Job completed:', job, results);

    return NextResponse.json({
      message: `Notification job '${job}' completed`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Notifications] Job failed:', error);

    return NextResponse.json(
      {
        error: 'Notification job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check and job status
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  return NextResponse.json({
    status: 'ok',
    timestamp: now.toISOString(),
    config: {
      cronSecretConfigured: !!CRON_SECRET,
      vapidConfigured: !!process.env.VAPID_PRIVATE_KEY,
      resendConfigured: !!process.env.RESEND_API_KEY,
    },
    schedule: {
      studyReminders: 'every hour',
      streakWarnings: hour >= 14 && hour < 22 ? 'active (14:00-22:00 UTC)' : 'inactive',
      weeklySummary: dayOfWeek === 0 && hour === 18 ? 'active (Sunday 18:00 UTC)' : 'inactive',
    },
  });
}
