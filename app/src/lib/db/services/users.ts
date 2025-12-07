/**
 * User Service
 *
 * Provides CRUD operations for user management.
 */

import { create, findById, findBy, update, deleteById, query, now } from '../crud';
import type { User, UserCreate, UserUpdate } from '../types';

const TABLE = 'users';

// Token expiry times
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Create a new user
 */
export function createUser(data: UserCreate): User {
  return create<User>(TABLE, data);
}

/**
 * Find user by ID
 */
export function getUserById(id: string): User | null {
  return findById<User>(TABLE, id);
}

/**
 * Find user by email
 */
export function getUserByEmail(email: string): User | null {
  return findBy<User>(TABLE, 'email', email);
}

/**
 * Update a user
 */
export function updateUser(id: string, data: UserUpdate): User | null {
  return update<User>(TABLE, id, data);
}

/**
 * Delete a user
 */
export function deleteUser(id: string): boolean {
  return deleteById(TABLE, id);
}

/**
 * Check if email is already registered
 */
export function emailExists(email: string): boolean {
  return getUserByEmail(email) !== null;
}

/**
 * Search users by name
 */
export function searchUsersByName(searchTerm: string, limit = 10): User[] {
  return query<User>(TABLE)
    .whereLike('name', `%${searchTerm}%`)
    .limit(limit)
    .all();
}

/**
 * Get user count
 */
export function getUserCount(): number {
  return query<User>(TABLE).count();
}

/**
 * Find user by verification token
 */
export function getUserByVerificationToken(token: string): User | null {
  return findBy<User>(TABLE, 'verification_token', token);
}

/**
 * Find user by password reset token
 */
export function getUserByPasswordResetToken(token: string): User | null {
  return findBy<User>(TABLE, 'password_reset_token', token);
}

/**
 * Set verification token for user
 */
export function setVerificationToken(userId: string, token: string): User | null {
  const expiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  return update<User>(TABLE, userId, {
    verification_token: token,
    verification_token_expires_at: expiresAt,
  });
}

/**
 * Verify user email
 */
export function verifyUserEmail(userId: string): User | null {
  return update<User>(TABLE, userId, {
    email_verified: 1,
    verification_token: null,
    verification_token_expires_at: null,
  });
}

/**
 * Set password reset token for user
 */
export function setPasswordResetToken(userId: string, token: string): User | null {
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  return update<User>(TABLE, userId, {
    password_reset_token: token,
    password_reset_token_expires_at: expiresAt,
  });
}

/**
 * Clear password reset token
 */
export function clearPasswordResetToken(userId: string): User | null {
  return update<User>(TABLE, userId, {
    password_reset_token: null,
    password_reset_token_expires_at: null,
  });
}

/**
 * Check if verification token is valid (not expired)
 */
export function isVerificationTokenValid(user: User): boolean {
  if (!user.verification_token || !user.verification_token_expires_at) {
    return false;
  }
  return new Date(user.verification_token_expires_at) > new Date();
}

/**
 * Check if password reset token is valid (not expired)
 */
export function isPasswordResetTokenValid(user: User): boolean {
  if (!user.password_reset_token || !user.password_reset_token_expires_at) {
    return false;
  }
  return new Date(user.password_reset_token_expires_at) > new Date();
}
