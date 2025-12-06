/**
 * Database Migration Runner
 *
 * Runs SQL migrations in order, tracking which have been applied.
 * Migrations are stored in the /migrations folder as .sql files.
 */

import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase } from './index';

interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

/**
 * Get the migrations directory path
 */
function getMigrationsDir(): string {
  // Try multiple paths to find migrations
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

  throw new Error('Migrations directory not found');
}

/**
 * Ensure the migrations tracking table exists
 */
function ensureMigrationsTable(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Get list of applied migrations
 */
function getAppliedMigrations(): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT name FROM migrations ORDER BY id').all() as Migration[];
  return rows.map((row) => row.name);
}

/**
 * Get list of pending migration files
 */
function getPendingMigrations(): string[] {
  const migrationsDir = getMigrationsDir();
  const appliedMigrations = getAppliedMigrations();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.filter((f) => !appliedMigrations.includes(f));
}

/**
 * Apply a single migration
 */
function applyMigration(filename: string): void {
  const db = getDatabase();
  const migrationsDir = getMigrationsDir();
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`[Migrate] Applying: ${filename}`);

  // Run migration in a transaction
  db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(filename);
  })();

  console.log(`[Migrate] Applied: ${filename}`);
}

/**
 * Run all pending migrations
 */
export function runMigrations(): { applied: string[]; pending: string[] } {
  console.log('[Migrate] Starting migration process...');

  ensureMigrationsTable();

  const pending = getPendingMigrations();

  if (pending.length === 0) {
    console.log('[Migrate] No pending migrations');
    return { applied: [], pending: [] };
  }

  console.log(`[Migrate] Found ${pending.length} pending migration(s)`);

  const applied: string[] = [];

  for (const migration of pending) {
    try {
      applyMigration(migration);
      applied.push(migration);
    } catch (error) {
      console.error(`[Migrate] Failed to apply ${migration}:`, error);
      throw error;
    }
  }

  console.log(`[Migrate] Successfully applied ${applied.length} migration(s)`);

  return { applied, pending: getPendingMigrations() };
}

/**
 * Rollback the last migration (if the migration has a corresponding down file)
 */
export function rollbackMigration(): string | null {
  const db = getDatabase();
  const migrationsDir = getMigrationsDir();

  const lastMigration = db
    .prepare('SELECT name FROM migrations ORDER BY id DESC LIMIT 1')
    .get() as Migration | undefined;

  if (!lastMigration) {
    console.log('[Migrate] No migrations to rollback');
    return null;
  }

  const downFile = lastMigration.name.replace('.sql', '.down.sql');
  const downPath = path.join(migrationsDir, downFile);

  if (!fs.existsSync(downPath)) {
    console.log(`[Migrate] No rollback file found for ${lastMigration.name}`);
    console.log('[Migrate] Create a file named:', downFile);
    return null;
  }

  const sql = fs.readFileSync(downPath, 'utf-8');

  console.log(`[Migrate] Rolling back: ${lastMigration.name}`);

  db.transaction(() => {
    db.exec(sql);
    db.prepare('DELETE FROM migrations WHERE name = ?').run(lastMigration.name);
  })();

  console.log(`[Migrate] Rolled back: ${lastMigration.name}`);

  return lastMigration.name;
}

/**
 * Get migration status
 */
export function getMigrationStatus(): {
  applied: string[];
  pending: string[];
  total: number;
} {
  ensureMigrationsTable();

  const applied = getAppliedMigrations();
  const pending = getPendingMigrations();

  return {
    applied,
    pending,
    total: applied.length + pending.length,
  };
}

/**
 * Create a new migration file
 */
export function createMigration(name: string): string {
  const migrationsDir = getMigrationsDir();

  // Generate migration number
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const nextNumber = String(files.length + 1).padStart(3, '0');

  // Sanitize name
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const filename = `${nextNumber}_${safeName}.sql`;
  const filePath = path.join(migrationsDir, filename);

  const template = `-- Migration: ${filename}
-- Description: ${name}
-- Created: ${new Date().toISOString().split('T')[0]}

-- Add your migration SQL here

`;

  fs.writeFileSync(filePath, template);
  console.log(`[Migrate] Created: ${filename}`);

  return filename;
}

// CLI entry point
if (require.main === module) {
  const command = process.argv[2] || 'run';

  try {
    switch (command) {
      case 'run':
      case 'up':
        runMigrations();
        break;
      case 'rollback':
      case 'down':
        rollbackMigration();
        break;
      case 'status':
        const status = getMigrationStatus();
        console.log('\n[Migration Status]');
        console.log(`Applied: ${status.applied.length}`);
        console.log(`Pending: ${status.pending.length}`);
        console.log(`Total: ${status.total}`);
        if (status.pending.length > 0) {
          console.log('\nPending migrations:');
          status.pending.forEach((m) => console.log(`  - ${m}`));
        }
        break;
      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.error('Usage: migrate create <migration_name>');
          process.exit(1);
        }
        createMigration(name);
        break;
      default:
        console.log('Usage: migrate [run|rollback|status|create <name>]');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
