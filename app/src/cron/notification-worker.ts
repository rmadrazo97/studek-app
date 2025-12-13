/**
 * Notification Cron Worker
 *
 * Runs as a separate process alongside the Next.js app.
 * Handles scheduled notification jobs internally instead of via GitHub Actions.
 */

import { Cron } from 'croner';

// Environment variables
const DATABASE_PATH = process.env.DATABASE_PATH || '/app/data/studek.db';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Import database and notification services
// We need to dynamically import these to ensure proper initialization
async function getNotificationServices() {
  // Set up database path before importing
  process.env.DATABASE_PATH = DATABASE_PATH;

  const { runNotificationJobs, processWeeklySummaries } = await import('../lib/notifications/index.js');
  return { runNotificationJobs, processWeeklySummaries };
}

/**
 * Main hourly notification job
 * Runs study reminders, streak warnings based on time of day
 */
async function runHourlyJob() {
  const now = new Date();
  console.log(`[Cron] Starting hourly notification job at ${now.toISOString()}`);

  try {
    const { runNotificationJobs } = await getNotificationServices();
    const results = await runNotificationJobs();

    console.log('[Cron] Hourly job completed:', JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('[Cron] Hourly job failed:', error);
    throw error;
  }
}

/**
 * Weekly summary job
 * Runs on Sunday at 18:00 UTC
 */
async function runWeeklySummaryJob() {
  const now = new Date();
  console.log(`[Cron] Starting weekly summary job at ${now.toISOString()}`);

  try {
    const { processWeeklySummaries } = await getNotificationServices();
    const results = await processWeeklySummaries();

    console.log('[Cron] Weekly summary completed:', JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('[Cron] Weekly summary job failed:', error);
    throw error;
  }
}

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  console.log('[Cron] Initializing notification cron jobs...');
  console.log(`[Cron] Environment: ${NODE_ENV}`);
  console.log(`[Cron] Database: ${DATABASE_PATH}`);

  // Hourly job - runs at the start of every hour
  // Cron pattern: minute hour day month weekday
  const hourlyJob = new Cron('0 * * * *', async () => {
    await runHourlyJob();
  });

  // Weekly summary - runs on Sunday at 18:00 UTC
  // Cron pattern: 0 18 * * 0 (minute 0, hour 18, any day, any month, Sunday)
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

  return { hourlyJob, weeklySummaryJob };
}

/**
 * Health check - can be called to verify cron is running
 */
function getHealthStatus() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: DATABASE_PATH,
  };
}

// Start the cron worker
console.log('====================================');
console.log('Studek Notification Cron Worker');
console.log('====================================');

const jobs = initCronJobs();

// Keep the process running
process.on('SIGINT', () => {
  console.log('[Cron] Received SIGINT, stopping cron jobs...');
  jobs.hourlyJob.stop();
  jobs.weeklySummaryJob.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Cron] Received SIGTERM, stopping cron jobs...');
  jobs.hourlyJob.stop();
  jobs.weeklySummaryJob.stop();
  process.exit(0);
});

// Run initial job in development for testing
if (NODE_ENV === 'development' && process.argv.includes('--run-now')) {
  console.log('[Cron] Running initial job for testing...');
  runHourlyJob().catch(console.error);
}

// Export for potential testing
export { runHourlyJob, runWeeklySummaryJob, getHealthStatus };
