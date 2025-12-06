/**
 * Authentication & RBAC Types
 */

// ============================================
// Role Types
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  name: string;
  description?: string;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
}

// ============================================
// Permission Types
// ============================================

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
}

export interface PermissionCreate {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

// ============================================
// Junction Table Types
// ============================================

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: string;
}

// ============================================
// Refresh Token Types
// ============================================

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: number;
  created_at: string;
}

// ============================================
// Auth Request/Response Types
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// ============================================
// Safe User (without password)
// ============================================

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Extended User with Roles
// ============================================

export interface UserWithRoles {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  avatar_url: string | null;
  roles: Role[];
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Auth Context (for middleware)
// ============================================

export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// ============================================
// Auth Error Types
// ============================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'UNAUTHORIZED'
  | 'REFRESH_TOKEN_REVOKED';

// ============================================
// Constants
// ============================================

export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  PASSWORD_MIN_LENGTH: 8,
  SALT_ROUNDS: 12,
  JWT_ALGORITHM: 'HS256' as const,
} as const;

export const DEFAULT_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
} as const;
