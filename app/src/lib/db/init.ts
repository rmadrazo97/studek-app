/**
 * Database Initialization
 *
 * Ensures database is set up with migrations and seeding on application startup.
 */

import { getDatabase } from './index';
import { runMigrations } from './migrate';

let initialized = false;

/**
 * Initialize the database
 * - Runs pending migrations
 * - Should be called once on app startup
 */
export function initializeDatabase(): void {
  if (initialized) {
    return;
  }

  console.log('[DB] Initializing database...');

  try {
    // Get database connection (creates file if needed)
    getDatabase();

    // Run any pending migrations
    const result = runMigrations();

    if (result.applied.length > 0) {
      console.log(`[DB] Applied ${result.applied.length} migration(s)`);
    }

    initialized = true;
    console.log('[DB] Database initialization complete');
  } catch (error) {
    console.error('[DB] Database initialization failed:', error);
    throw error;
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return initialized;
}
