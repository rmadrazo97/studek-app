/**
 * Notification Cron Worker (Production)
 *
 * This is a standalone Node.js script that runs alongside Next.js
 * to handle scheduled notification jobs.
 *
 * Uses dynamic imports to load notification services from the built Next.js app.
 */

import { Cron } from 'croner';

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('====================================');
console.log('Studek Notification Cron Worker');
console.log('====================================');
console.log(`Environment: ${NODE_ENV}`);
console.log(`App URL: ${APP_URL}`);
console.log(`Cron Secret configured: ${!!CRON_SECRET}`);
console.log('');

/**
 * Call the notification trigger API
 */
async function triggerNotificationJob(job = 'all') {
  const url = `${APP_URL}/api/notifications/trigger?job=${job}`;
  console.log(`[Cron] Triggering job: ${job}`);
  console.log(`[Cron] URL: ${url}`);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Cron] Job failed with status ${response.status}:`, data);
      return { success: false, error: data.error || 'Unknown error' };
    }

    console.log('[Cron] Job completed:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('[Cron] Job failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main hourly notification job
 */
async function runHourlyJob() {
  const now = new Date();
  console.log(`\n[Cron] Starting hourly job at ${now.toISOString()}`);
  await triggerNotificationJob('all');
}

/**
 * Weekly summary job (Sunday 18:00 UTC)
 */
async function runWeeklySummaryJob() {
  const now = new Date();
  console.log(`\n[Cron] Starting weekly summary at ${now.toISOString()}`);
  await triggerNotificationJob('weekly_summary');
}

/**
 * Wait for the app to be ready before starting cron
 */
async function waitForApp(maxAttempts = 30, intervalMs = 2000) {
  console.log('[Cron] Waiting for app to be ready...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${APP_URL}/api/health`);
      if (response.ok) {
        console.log('[Cron] App is ready!');
        return true;
      }
    } catch {
      // App not ready yet
    }

    console.log(`[Cron] Attempt ${attempt}/${maxAttempts} - waiting...`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.error('[Cron] App did not become ready in time');
  return false;
}

/**
 * Initialize cron jobs
 */
async function initCronJobs() {
  // Wait for app to be ready
  const appReady = await waitForApp();
  if (!appReady) {
    console.error('[Cron] Cannot start cron jobs - app not ready');
    process.exit(1);
  }

  console.log('\n[Cron] Initializing cron jobs...');

  // Hourly job - runs at the start of every hour
  const hourlyJob = new Cron('0 * * * *', async () => {
    await runHourlyJob();
  });

  // Weekly summary - runs on Sunday at 18:00 UTC
  const weeklySummaryJob = new Cron('0 18 * * 0', async () => {
    await runWeeklySummaryJob();
  });

  console.log('[Cron] Cron jobs initialized:');
  console.log('  - Hourly notifications: 0 * * * * (every hour)');
  console.log('  - Weekly summary: 0 18 * * 0 (Sunday 18:00 UTC)');

  // Log next run times
  const nextHourly = hourlyJob.nextRun();
  const nextWeekly = weeklySummaryJob.nextRun();
  console.log(`[Cron] Next hourly run: ${nextHourly?.toISOString()}`);
  console.log(`[Cron] Next weekly run: ${nextWeekly?.toISOString()}`);
  console.log('');

  return { hourlyJob, weeklySummaryJob };
}

// Handle signals
let jobs = null;

process.on('SIGINT', () => {
  console.log('\n[Cron] Received SIGINT, stopping...');
  if (jobs) {
    jobs.hourlyJob.stop();
    jobs.weeklySummaryJob.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Cron] Received SIGTERM, stopping...');
  if (jobs) {
    jobs.hourlyJob.stop();
    jobs.weeklySummaryJob.stop();
  }
  process.exit(0);
});

// Start the cron worker
initCronJobs()
  .then((j) => {
    jobs = j;
    console.log('[Cron] Worker is running. Press Ctrl+C to stop.');
  })
  .catch((error) => {
    console.error('[Cron] Failed to initialize:', error);
    process.exit(1);
  });

// Run immediately in development if --run-now flag is passed
if (process.argv.includes('--run-now')) {
  console.log('[Cron] Running immediate job for testing...');
  triggerNotificationJob('all');
}
