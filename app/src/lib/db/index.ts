/**
 * SQLite Database Connection Manager
 *
 * Provides a singleton database connection for the Studek application.
 * Uses better-sqlite3 for synchronous, fast SQLite operations.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database connection singleton
let db: Database.Database | null = null;
let migrationsRan = false;

/**
 * Get the database file path from environment or use default
 */
function getDatabasePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'studek.db');
}

/**
 * Get migrations directory path
 */
function getMigrationsDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'migrations'),
    path.join(process.cwd(), 'app', 'migrations'),
    path.join(__dirname, '..', '..', '..', 'migrations'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return possiblePaths[0]; // Fallback
}

/**
 * Run migrations inline (to avoid circular dependencies with migrate.ts)
 */
function runMigrationsInline(database: Database.Database): void {
  if (migrationsRan) return;

  try {
    // Create migrations table
    database.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const migrationsDir = getMigrationsDir();
    if (!fs.existsSync(migrationsDir)) {
      console.log('[DB] No migrations directory found, skipping migrations');
      migrationsRan = true;
      return;
    }

    // Get applied migrations
    const applied = database
      .prepare('SELECT name FROM migrations ORDER BY id')
      .all() as { name: string }[];
    const appliedNames = new Set(applied.map((r) => r.name));

    // Get pending migrations
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.includes('.down.'))
      .sort();

    const pending = files.filter((f) => !appliedNames.has(f));

    if (pending.length === 0) {
      migrationsRan = true;
      return;
    }

    console.log(`[DB] Applying ${pending.length} pending migration(s)...`);

    for (const migration of pending) {
      const filePath = path.join(migrationsDir, migration);
      const sql = fs.readFileSync(filePath, 'utf-8');

      database.transaction(() => {
        database.exec(sql);
        database.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration);
      })();

      console.log(`[DB] Applied migration: ${migration}`);
    }

    migrationsRan = true;
  } catch (error) {
    console.error('[DB] Migration error:', error);
    // Don't throw - allow app to continue with potentially missing tables
    migrationsRan = true;
  }
}

/**
 * Get or create the database connection singleton
 *
 * @returns The SQLite database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath();

    // Create database connection with optimized settings
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable WAL mode for better concurrent read/write performance
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Optimize for performance
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('temp_store = MEMORY');

    console.log(`[DB] Connected to SQLite database at ${dbPath}`);

    // Auto-run migrations on first connection
    runMigrationsInline(db);
  }

  return db;
}

/**
 * Close the database connection
 * Useful for graceful shutdown
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Check if the database is connected
 */
export function isDatabaseConnected(): boolean {
  return db !== null && db.open;
}

/**
 * Execute a raw SQL query (for advanced use cases)
 *
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns Query results
 */
export function executeRaw<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Execute a raw SQL statement that modifies data
 *
 * @param sql - SQL statement
 * @param params - Statement parameters
 * @returns Run result with changes and lastInsertRowid
 */
export function runRaw(sql: string, params: unknown[] = []): Database.RunResult {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
}

/**
 * Run multiple statements in a transaction
 *
 * @param fn - Function containing database operations
 * @returns Result of the function
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}

// Export the Database type for use in other modules
export type { Database };

// Note: Import CRUD utilities from './crud' and services from './services'
