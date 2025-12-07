/**
 * Authentication Service
 *
 * Handles user registration, login, token generation, and session management.
 */

import { executeRaw, runRaw } from '../db';
import { generateId, now } from '../db/crud';
import {
  createUser,
  getUserByEmail,
  getUserById,
  emailExists,
  getUserByVerificationToken,
  getUserByPasswordResetToken,
  setVerificationToken,
  verifyUserEmail,
  setPasswordResetToken,
  clearPasswordResetToken,
  isVerificationTokenValid,
  isPasswordResetTokenValid,
} from '../db/services/users';
import { emailService } from '../email';
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  generateRandomToken,
  hashToken,
} from './crypto';
import {
  getUserRoleNames,
  getUserPermissionNames,
  assignRoleToUserByName,
} from './rbac';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  SafeUser,
  RefreshToken,
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

  // Generate verification token
  const verificationToken = generateRandomToken();
  const verificationTokenExpiry = new Date(
    Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  ).toISOString();

  // Create user with verification token
  const user = createUser({
    email: data.email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: data.name?.trim() || null,
    email_verified: 0,
    verification_token: hashToken(verificationToken),
    verification_token_expires_at: verificationTokenExpiry,
  });

  // Assign default user role
  assignRoleToUserByName(user.id, DEFAULT_ROLES.USER);

  // Send welcome email with verification link (non-blocking)
  emailService.sendWelcomeEmail(
    user.email,
    user.name,
    verificationToken
  ).catch((err) => {
    console.error('[Auth] Failed to send welcome email:', err);
  });

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
    email_verified: user.email_verified === 1,
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

// ============================================
// Email Verification
// ============================================

/**
 * Verify email using token
 */
export function verifyEmail(token: string): { success: boolean; message: string } {
  const tokenHash = hashToken(token);

  // Find user with this verification token
  const user = getUserByVerificationToken(tokenHash);
  if (!user) {
    return { success: false, message: 'Invalid or expired verification link' };
  }

  // Check if token is expired
  if (!isVerificationTokenValid(user)) {
    return { success: false, message: 'Verification link has expired. Please request a new one.' };
  }

  // Verify the email
  verifyUserEmail(user.id);

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<{ success: boolean; message: string }> {
  const user = getUserById(userId);
  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND');
  }

  // Check if already verified
  if (user.email_verified === 1) {
    return { success: false, message: 'Email is already verified' };
  }

  // Generate new verification token
  const verificationToken = generateRandomToken();
  setVerificationToken(user.id, hashToken(verificationToken));

  // Send verification email
  const result = await emailService.sendVerificationEmail(
    user.email,
    user.name,
    verificationToken
  );

  if (!result.success) {
    return { success: false, message: 'Failed to send verification email. Please try again.' };
  }

  return { success: true, message: 'Verification email sent successfully' };
}

// ============================================
// Password Reset via Email
// ============================================

/**
 * Request password reset (send email with reset link)
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const user = getUserByEmail(email.toLowerCase().trim());

  // Always return success message to prevent email enumeration
  const successMessage = 'If an account exists with this email, you will receive a password reset link shortly.';

  if (!user) {
    // Don't reveal that user doesn't exist
    return { success: true, message: successMessage };
  }

  // Generate password reset token
  const resetToken = generateRandomToken();
  setPasswordResetToken(user.id, hashToken(resetToken));

  // Send password reset email
  const result = await emailService.sendPasswordResetEmail(
    user.email,
    user.name,
    resetToken
  );

  if (!result.success) {
    console.error('[Auth] Failed to send password reset email:', result.error);
    // Still return success to prevent enumeration
    return { success: true, message: successMessage };
  }

  return { success: true, message: successMessage };
}

/**
 * Reset password using token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const tokenHash = hashToken(token);

  // Find user with this reset token
  const user = getUserByPasswordResetToken(tokenHash);
  if (!user) {
    return { success: false, message: 'Invalid or expired password reset link' };
  }

  // Check if token is expired
  if (!isPasswordResetTokenValid(user)) {
    return { success: false, message: 'Password reset link has expired. Please request a new one.' };
  }

  // Validate new password
  if (newPassword.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
    };
  }

  // Reset the password
  await resetPassword(user.id, newPassword);

  // Clear the reset token
  clearPasswordResetToken(user.id);

  return { success: true, message: 'Password reset successfully. You can now log in with your new password.' };
}

/**
 * Validate password reset token (for UI to show reset form)
 */
export function validatePasswordResetToken(token: string): { valid: boolean; message?: string } {
  const tokenHash = hashToken(token);

  const user = getUserByPasswordResetToken(tokenHash);
  if (!user) {
    return { valid: false, message: 'Invalid password reset link' };
  }

  if (!isPasswordResetTokenValid(user)) {
    return { valid: false, message: 'Password reset link has expired' };
  }

  return { valid: true };
}
