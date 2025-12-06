/**
 * User Service
 *
 * Provides CRUD operations for user management.
 */

import { create, findById, findBy, update, deleteById, query } from '../crud';
import type { User, UserCreate, UserUpdate } from '../types';

const TABLE = 'users';

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
