/**
 * Authentication Service
 *
 * Handles user registration, login, token generation, and session management.
 */

import { getDatabase, executeRaw, runRaw, transaction } from '../db';
import { generateId, now } from '../db/crud';
import { createUser, getUserByEmail, getUserById, emailExists } from '../db/services/users';
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  generateRandomToken,
  hashToken,
} from './crypto';
import {
  getUserRoles,
  getUserPermissions,
  getUserRoleNames,
  getUserPermissionNames,
  assignRoleToUserByName,
} from './rbac';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  SafeUser,
  TokenPayload,
  RefreshToken,
  AuthError as AuthErrorType,
} from './types';
import { AuthError, AUTH_CONSTANTS, DEFAULT_ROLES } from './types';

// ============================================
// User Registration
// ============================================

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    throw new AuthError('Invalid email address', 'INVALID_CREDENTIALS', 400);
  }

  // Validate password
  if (!data.password || data.password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    throw new AuthError(
      `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
      'INVALID_CREDENTIALS',
      400
    );
  }

  // Check if email exists
  if (emailExists(data.email)) {
    throw new AuthError('Email already registered', 'EMAIL_EXISTS', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = createUser({
    email: data.email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: data.name?.trim() || null,
  });

  // Assign default user role
  assignRoleToUserByName(user.id, DEFAULT_ROLES.USER);

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email);

  // Return response
  return {
    user: getSafeUser(user.id)!,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// User Login
// ============================================

/**
 * Login a user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // Get user by email
  const user = getUserByEmail(data.email.toLowerCase().trim());
  if (!user) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.password_hash);
  if (!isValid) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email);

  // Return response
  return {
    user: getSafeUser(user.id)!,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ============================================
// Token Management
// ============================================

/**
 * Generate access and refresh tokens
 */
async function generateTokens(
  userId: string,
  email: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const roles = getUserRoleNames(userId);

  // Generate access token
  const accessToken = createToken(
    { userId, email, roles, type: 'access' },
    AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY
  );

  // Generate refresh token
  const refreshTokenValue = generateRandomToken();
  const refreshTokenHash = hashToken(refreshTokenValue);

  // Store refresh token in database
  const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000).toISOString();

  runRaw(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [generateId(), userId, refreshTokenHash, expiresAt, now()]
  );

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const tokenHash = hashToken(refreshToken);

  // Find refresh token in database
  const tokens = executeRaw<RefreshToken>(
    `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0`,
    [tokenHash]
  );

  if (tokens.length === 0) {
    throw new AuthError('Invalid refresh token', 'INVALID_TOKEN');
  }

  const storedToken = tokens[0];

  // Check if expired
  if (new Date(storedToken.expires_at) < new Date()) {
    // Revoke expired token
    runRaw(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`, [storedToken.id]);
    throw new AuthError('Refresh token expired', 'TOKEN_EXPIRED');
  }

  // Get user
  const user = getUserById(storedToken.user_id);
  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND');
  }

  // Revoke old refresh token (rotation)
  runRaw(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`, [storedToken.id]);

  // Generate new tokens
  return generateTokens(user.id, user.email);
}

/**
 * Revoke a refresh token
 */
export function revokeRefreshToken(refreshToken: string): boolean {
  const tokenHash = hashToken(refreshToken);
  const result = runRaw(
    `UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?`,
    [tokenHash]
  );
  return result.changes > 0;
}

/**
 * Revoke all refresh tokens for a user
 */
export function revokeAllUserTokens(userId: string): number {
  const result = runRaw(
    `UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`,
    [userId]
  );
  return result.changes;
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export function cleanupExpiredTokens(): number {
  const result = runRaw(
    `DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked = 1`,
    [now()]
  );
  return result.changes;
}

// ============================================
// Token Verification
// ============================================

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload {
  const payload = verifyToken(token);

  if (payload.type !== 'access') {
    throw new AuthError('Invalid token type', 'INVALID_TOKEN');
  }

  return payload;
}

// ============================================
// User Helpers
// ============================================

/**
 * Get a safe user object (without password)
 */
export function getSafeUser(userId: string): SafeUser | null {
  const user = getUserById(userId);
  if (!user) return null;

  const roles = getUserRoleNames(userId);
  const permissions = getUserPermissionNames(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    roles,
    permissions,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Get user from access token
 */
export function getUserFromToken(token: string): SafeUser | null {
  try {
    const payload = verifyAccessToken(token);
    return getSafeUser(payload.userId);
  } catch {
    return null;
  }
}

// ============================================
// Password Management
// ============================================

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = getUserById(userId);
  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new AuthError('Current password is incorrect', 'INVALID_CREDENTIALS');
  }

  // Validate new password
  if (newPassword.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    throw new AuthError(
      `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
      'INVALID_CREDENTIALS',
      400
    );
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(newPassword);
  runRaw(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [
    newPasswordHash,
    now(),
    userId,
  ]);

  // Revoke all refresh tokens for security
  revokeAllUserTokens(userId);

  return true;
}

/**
 * Reset password (admin action or via reset token)
 */
export async function resetPassword(userId: string, newPassword: string): Promise<boolean> {
  // Validate new password
  if (newPassword.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    throw new AuthError(
      `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
      'INVALID_CREDENTIALS',
      400
    );
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(newPassword);
  const result = runRaw(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [
    newPasswordHash,
    now(),
    userId,
  ]);

  if (result.changes === 0) {
    throw new AuthError('User not found', 'USER_NOT_FOUND');
  }

  // Revoke all refresh tokens for security
  revokeAllUserTokens(userId);

  return true;
}
