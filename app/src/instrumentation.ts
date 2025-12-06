/**
 * Next.js Instrumentation
 *
 * This file runs once when the server starts.
 * Used to initialize database and run migrations.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server...');

    try {
      // Dynamically import to avoid client-side bundling issues
      const { runMigrations } = await import('./lib/db/migrate');
      const { seedAdmin } = await import('./lib/auth/seed');

      // Run migrations (includes subscription tables)
      console.log('[Instrumentation] Running database migrations...');
      runMigrations();

      // Seed admin user
      console.log('[Instrumentation] Seeding admin user...');
      await seedAdmin();

      console.log('[Instrumentation] Server initialization complete');
    } catch (error) {
      console.error('[Instrumentation] Initialization error:', error);
      // Don't throw - let the app start even if migrations fail
      // Individual requests will fail with more specific errors
    }
  }
}
