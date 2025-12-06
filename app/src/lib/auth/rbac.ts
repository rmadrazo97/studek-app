/**
 * RBAC (Role-Based Access Control) Service
 *
 * Manages roles, permissions, and user-role assignments.
 */

import { getDatabase, executeRaw, runRaw, transaction } from '../db';
import { create, findById, findBy, findAll, update, deleteById, generateId, now } from '../db/crud';
import type {
  Role,
  RoleCreate,
  RoleUpdate,
  Permission,
  PermissionCreate,
  UserRole,
  RolePermission,
} from './types';

const TABLES = {
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  USER_ROLES: 'user_roles',
  ROLE_PERMISSIONS: 'role_permissions',
};

// ============================================
// Role Management
// ============================================

/**
 * Create a new role
 */
export function createRole(data: RoleCreate): Role {
  return create<Role>(TABLES.ROLES, data);
}

/**
 * Get role by ID
 */
export function getRoleById(id: string): Role | null {
  return findById<Role>(TABLES.ROLES, id);
}

/**
 * Get role by name
 */
export function getRoleByName(name: string): Role | null {
  return findBy<Role>(TABLES.ROLES, 'name', name);
}

/**
 * Get all roles
 */
export function getAllRoles(): Role[] {
  return findAll<Role>(TABLES.ROLES, {}, { orderBy: 'name', order: 'ASC' });
}

/**
 * Update a role
 */
export function updateRole(id: string, data: RoleUpdate): Role | null {
  return update<Role>(TABLES.ROLES, id, data);
}

/**
 * Delete a role
 */
export function deleteRole(id: string): boolean {
  return deleteById(TABLES.ROLES, id);
}

// ============================================
// Permission Management
// ============================================

/**
 * Create a new permission
 */
export function createPermission(data: PermissionCreate): Permission {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();

  const record = {
    id,
    ...data,
    created_at: timestamp,
  };

  const columns = Object.keys(record);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(record);

  const sql = `INSERT INTO ${TABLES.PERMISSIONS} (${columns.join(', ')}) VALUES (${placeholders})`;
  db.prepare(sql).run(...values);

  return record as Permission;
}

/**
 * Get permission by ID
 */
export function getPermissionById(id: string): Permission | null {
  return findById<Permission>(TABLES.PERMISSIONS, id);
}

/**
 * Get permission by name
 */
export function getPermissionByName(name: string): Permission | null {
  return findBy<Permission>(TABLES.PERMISSIONS, 'name', name);
}

/**
 * Get all permissions
 */
export function getAllPermissions(): Permission[] {
  const db = getDatabase();
  return db.prepare(`SELECT * FROM ${TABLES.PERMISSIONS} ORDER BY resource, action`).all() as Permission[];
}

/**
 * Get permissions by resource
 */
export function getPermissionsByResource(resource: string): Permission[] {
  return executeRaw<Permission>(
    `SELECT * FROM ${TABLES.PERMISSIONS} WHERE resource = ? ORDER BY action`,
    [resource]
  );
}

// ============================================
// Role-Permission Management
// ============================================

/**
 * Assign permission to role
 */
export function assignPermissionToRole(roleId: string, permissionId: string): boolean {
  const db = getDatabase();
  try {
    db.prepare(
      `INSERT OR IGNORE INTO ${TABLES.ROLE_PERMISSIONS} (role_id, permission_id, created_at) VALUES (?, ?, ?)`
    ).run(roleId, permissionId, now());
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove permission from role
 */
export function removePermissionFromRole(roleId: string, permissionId: string): boolean {
  const result = runRaw(
    `DELETE FROM ${TABLES.ROLE_PERMISSIONS} WHERE role_id = ? AND permission_id = ?`,
    [roleId, permissionId]
  );
  return result.changes > 0;
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(roleId: string): Permission[] {
  return executeRaw<Permission>(
    `SELECT p.* FROM ${TABLES.PERMISSIONS} p
     INNER JOIN ${TABLES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?
     ORDER BY p.resource, p.action`,
    [roleId]
  );
}

/**
 * Set all permissions for a role (replaces existing)
 */
export function setRolePermissions(roleId: string, permissionIds: string[]): void {
  transaction(() => {
    runRaw(`DELETE FROM ${TABLES.ROLE_PERMISSIONS} WHERE role_id = ?`, [roleId]);

    const timestamp = now();
    for (const permissionId of permissionIds) {
      runRaw(
        `INSERT INTO ${TABLES.ROLE_PERMISSIONS} (role_id, permission_id, created_at) VALUES (?, ?, ?)`,
        [roleId, permissionId, timestamp]
      );
    }
  });
}

// ============================================
// User-Role Management
// ============================================

/**
 * Assign role to user
 */
export function assignRoleToUser(userId: string, roleId: string): boolean {
  const db = getDatabase();
  try {
    db.prepare(
      `INSERT OR IGNORE INTO ${TABLES.USER_ROLES} (user_id, role_id, created_at) VALUES (?, ?, ?)`
    ).run(userId, roleId, now());
    return true;
  } catch {
    return false;
  }
}

/**
 * Assign role to user by role name
 */
export function assignRoleToUserByName(userId: string, roleName: string): boolean {
  const role = getRoleByName(roleName);
  if (!role) return false;
  return assignRoleToUser(userId, role.id);
}

/**
 * Remove role from user
 */
export function removeRoleFromUser(userId: string, roleId: string): boolean {
  const result = runRaw(
    `DELETE FROM ${TABLES.USER_ROLES} WHERE user_id = ? AND role_id = ?`,
    [userId, roleId]
  );
  return result.changes > 0;
}

/**
 * Get roles for a user
 */
export function getUserRoles(userId: string): Role[] {
  return executeRaw<Role>(
    `SELECT r.* FROM ${TABLES.ROLES} r
     INNER JOIN ${TABLES.USER_ROLES} ur ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.name`,
    [userId]
  );
}

/**
 * Get role names for a user
 */
export function getUserRoleNames(userId: string): string[] {
  const roles = getUserRoles(userId);
  return roles.map((r) => r.name);
}

/**
 * Set all roles for a user (replaces existing)
 */
export function setUserRoles(userId: string, roleIds: string[]): void {
  transaction(() => {
    runRaw(`DELETE FROM ${TABLES.USER_ROLES} WHERE user_id = ?`, [userId]);

    const timestamp = now();
    for (const roleId of roleIds) {
      runRaw(
        `INSERT INTO ${TABLES.USER_ROLES} (user_id, role_id, created_at) VALUES (?, ?, ?)`,
        [userId, roleId, timestamp]
      );
    }
  });
}

/**
 * Set roles for a user by role names (replaces existing)
 */
export function setUserRolesByName(userId: string, roleNames: string[]): void {
  const roleIds: string[] = [];
  for (const name of roleNames) {
    const role = getRoleByName(name);
    if (role) roleIds.push(role.id);
  }
  setUserRoles(userId, roleIds);
}

// ============================================
// Permission Checking
// ============================================

/**
 * Get all permissions for a user (via their roles)
 */
export function getUserPermissions(userId: string): Permission[] {
  return executeRaw<Permission>(
    `SELECT DISTINCT p.* FROM ${TABLES.PERMISSIONS} p
     INNER JOIN ${TABLES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     INNER JOIN ${TABLES.USER_ROLES} ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY p.resource, p.action`,
    [userId]
  );
}

/**
 * Get permission names for a user
 */
export function getUserPermissionNames(userId: string): string[] {
  const permissions = getUserPermissions(userId);
  return permissions.map((p) => p.name);
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(userId: string, permissionName: string): boolean {
  const result = executeRaw<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLES.PERMISSIONS} p
     INNER JOIN ${TABLES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     INNER JOIN ${TABLES.USER_ROLES} ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ? AND p.name = ?`,
    [userId, permissionName]
  );
  return result[0]?.count > 0;
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(userId: string, permissionNames: string[]): boolean {
  if (permissionNames.length === 0) return false;

  const placeholders = permissionNames.map(() => '?').join(', ');
  const result = executeRaw<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLES.PERMISSIONS} p
     INNER JOIN ${TABLES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     INNER JOIN ${TABLES.USER_ROLES} ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ? AND p.name IN (${placeholders})`,
    [userId, ...permissionNames]
  );
  return result[0]?.count > 0;
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(userId: string, permissionNames: string[]): boolean {
  if (permissionNames.length === 0) return true;

  for (const name of permissionNames) {
    if (!userHasPermission(userId, name)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user has a specific role
 */
export function userHasRole(userId: string, roleName: string): boolean {
  const result = executeRaw<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLES.ROLES} r
     INNER JOIN ${TABLES.USER_ROLES} ur ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.name = ?`,
    [userId, roleName]
  );
  return result[0]?.count > 0;
}

/**
 * Check if user is a superadmin
 */
export function isSuperAdmin(userId: string): boolean {
  return userHasRole(userId, 'superadmin');
}

/**
 * Check if user is an admin (including superadmin)
 */
export function isAdmin(userId: string): boolean {
  return userHasRole(userId, 'admin') || userHasRole(userId, 'superadmin');
}
