/**
 * Auth Seeding Script
 *
 * Seeds the database with default admin user.
 * Run with: npx tsx src/lib/auth/seed.ts
 */

import { getDatabase, closeDatabase } from '../db';
import { runMigrations } from '../db/migrate';
import { hashPassword } from './crypto';
import { generateId, now } from '../db/crud';

const ADMIN_EMAIL = 'admin@studek.app';
const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = 'Administrator';

async function seedAdmin(): Promise<void> {
  console.log('[Seed] Starting admin seeding...');

  // Run migrations first
  runMigrations();

  const db = getDatabase();

  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);

  if (existing) {
    console.log('[Seed] Admin user already exists, skipping...');
    return;
  }

  // Hash password
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const userId = generateId();
  const timestamp = now();

  // Create admin user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, ADMIN_EMAIL, passwordHash, ADMIN_NAME, timestamp, timestamp);

  console.log(`[Seed] Created admin user: ${ADMIN_EMAIL}`);

  // Assign superadmin role
  const superadminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('superadmin') as { id: string } | undefined;

  if (superadminRole) {
    db.prepare(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at)
      VALUES (?, ?, ?)
    `).run(userId, superadminRole.id, timestamp);
    console.log('[Seed] Assigned superadmin role to admin user');
  } else {
    console.warn('[Seed] Warning: superadmin role not found, run migrations first');
  }

  console.log('[Seed] Admin seeding complete!');
  console.log(`[Seed] Email: ${ADMIN_EMAIL}`);
  console.log(`[Seed] Password: ${ADMIN_PASSWORD}`);
}

// CLI entry point
if (require.main === module) {
  seedAdmin()
    .then(() => {
      closeDatabase();
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Error:', error);
      closeDatabase();
      process.exit(1);
    });
}

export { seedAdmin };
