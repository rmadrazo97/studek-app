-- Migration: 002_auth_rbac
-- Description: Add RBAC (Role-Based Access Control) tables and update users table
-- Created: 2024-12-06

-- ============================================
-- Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- ============================================
-- Role-Permission Junction Table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================
-- User-Role Junction Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ============================================
-- Refresh Tokens Table (for JWT refresh)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ============================================
-- Default Roles
-- ============================================
INSERT OR IGNORE INTO roles (id, name, description) VALUES
    ('role-superadmin', 'superadmin', 'Super administrator with full access'),
    ('role-admin', 'admin', 'Administrator with management access'),
    ('role-user', 'user', 'Regular user with standard access');

-- ============================================
-- Default Permissions
-- ============================================
-- User management permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-users-create', 'users:create', 'Create users', 'users', 'create'),
    ('perm-users-read', 'users:read', 'Read users', 'users', 'read'),
    ('perm-users-update', 'users:update', 'Update users', 'users', 'update'),
    ('perm-users-delete', 'users:delete', 'Delete users', 'users', 'delete'),
    ('perm-users-manage', 'users:manage', 'Full user management', 'users', 'manage');

-- Role management permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-roles-create', 'roles:create', 'Create roles', 'roles', 'create'),
    ('perm-roles-read', 'roles:read', 'Read roles', 'roles', 'read'),
    ('perm-roles-update', 'roles:update', 'Update roles', 'roles', 'update'),
    ('perm-roles-delete', 'roles:delete', 'Delete roles', 'roles', 'delete'),
    ('perm-roles-assign', 'roles:assign', 'Assign roles to users', 'roles', 'assign');

-- Deck permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-decks-create', 'decks:create', 'Create decks', 'decks', 'create'),
    ('perm-decks-read', 'decks:read', 'Read decks', 'decks', 'read'),
    ('perm-decks-update', 'decks:update', 'Update decks', 'decks', 'update'),
    ('perm-decks-delete', 'decks:delete', 'Delete decks', 'decks', 'delete');

-- Card permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-cards-create', 'cards:create', 'Create cards', 'cards', 'create'),
    ('perm-cards-read', 'cards:read', 'Read cards', 'cards', 'read'),
    ('perm-cards-update', 'cards:update', 'Update cards', 'cards', 'update'),
    ('perm-cards-delete', 'cards:delete', 'Delete cards', 'cards', 'delete');

-- Study permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-study-access', 'study:access', 'Access study sessions', 'study', 'access');

-- Admin permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
    ('perm-admin-access', 'admin:access', 'Access admin panel', 'admin', 'access'),
    ('perm-admin-settings', 'admin:settings', 'Manage system settings', 'admin', 'settings');

-- ============================================
-- Assign Permissions to Roles
-- ============================================
-- Superadmin gets all permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-superadmin', id FROM permissions;

-- Admin gets most permissions except role management
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
    ('role-admin', 'perm-users-create'),
    ('role-admin', 'perm-users-read'),
    ('role-admin', 'perm-users-update'),
    ('role-admin', 'perm-roles-read'),
    ('role-admin', 'perm-decks-create'),
    ('role-admin', 'perm-decks-read'),
    ('role-admin', 'perm-decks-update'),
    ('role-admin', 'perm-decks-delete'),
    ('role-admin', 'perm-cards-create'),
    ('role-admin', 'perm-cards-read'),
    ('role-admin', 'perm-cards-update'),
    ('role-admin', 'perm-cards-delete'),
    ('role-admin', 'perm-study-access'),
    ('role-admin', 'perm-admin-access');

-- User gets basic permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
    ('role-user', 'perm-decks-create'),
    ('role-user', 'perm-decks-read'),
    ('role-user', 'perm-decks-update'),
    ('role-user', 'perm-decks-delete'),
    ('role-user', 'perm-cards-create'),
    ('role-user', 'perm-cards-read'),
    ('role-user', 'perm-cards-update'),
    ('role-user', 'perm-cards-delete'),
    ('role-user', 'perm-study-access');
