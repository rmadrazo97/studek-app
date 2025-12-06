/**
 * Authentication & RBAC Module
 *
 * Exports all auth-related functionality.
 */

// Types
export * from './types';

// Crypto utilities
export {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  generateRandomToken,
  hashToken,
} from './crypto';

// RBAC service
export {
  // Roles
  createRole,
  getRoleById,
  getRoleByName,
  getAllRoles,
  updateRole,
  deleteRole,
  // Permissions
  createPermission,
  getPermissionById,
  getPermissionByName,
  getAllPermissions,
  getPermissionsByResource,
  // Role-Permission management
  assignPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  setRolePermissions,
  // User-Role management
  assignRoleToUser,
  assignRoleToUserByName,
  removeRoleFromUser,
  getUserRoles,
  getUserRoleNames,
  setUserRoles,
  setUserRolesByName,
  // Permission checking
  getUserPermissions,
  getUserPermissionNames,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  userHasRole,
  isSuperAdmin,
  isAdmin,
} from './rbac';

// Auth service
export {
  register,
  login,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  verifyAccessToken,
  getSafeUser,
  getUserFromToken,
  changePassword,
  resetPassword,
} from './auth';

// Middleware
export {
  extractToken,
  getAuthContext,
  isAuthenticated,
  unauthorizedResponse,
  forbiddenResponse,
  handleAuthError,
  withAuth,
  withPermission,
  withRole,
  withAdmin,
  withSuperAdmin,
  withOptionalAuth,
  checkOwnership,
  withOwnership,
} from './middleware';

export type { AuthenticatedRequest, RouteHandler, AuthenticatedHandler } from './middleware';
