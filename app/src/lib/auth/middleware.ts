/**
 * Authentication Middleware for Next.js Route Handlers
 *
 * Provides utilities for protecting API routes and checking permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, getSafeUser } from './auth';
import { userHasAnyPermission, isSuperAdmin } from './rbac';
import type { AuthContext, SafeUser } from './types';
import { AuthError } from './types';

// ============================================
// Types
// ============================================

export interface AuthenticatedRequest extends NextRequest {
  auth: AuthContext;
  user: SafeUser;
}

export type RouteHandler<T = unknown> = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse<T>>;

export type AuthenticatedHandler<T = unknown> = (
  request: AuthenticatedRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse<T>>;

// ============================================
// Token Extraction
// ============================================

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

// ============================================
// Authentication Check
// ============================================

/**
 * Verify token and get auth context
 */
export function getAuthContext(request: NextRequest): AuthContext | null {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      permissions: [], // Will be populated if needed
    };
  } catch {
    return null;
  }
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  return getAuthContext(request) !== null;
}

// ============================================
// Error Responses
// ============================================

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

/**
 * Handle auth errors
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error('[Auth] Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

// ============================================
// Middleware Wrappers
// ============================================

/**
 * Wrap a handler to require authentication
 */
export function withAuth<T>(handler: AuthenticatedHandler<T>): RouteHandler<T> {
  return async (request: NextRequest, context) => {
    const auth = getAuthContext(request);

    if (!auth) {
      return unauthorizedResponse() as NextResponse<T>;
    }

    const user = getSafeUser(auth.userId);
    if (!user) {
      return unauthorizedResponse('User not found') as NextResponse<T>;
    }

    // Add auth info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.auth = {
      ...auth,
      permissions: user.permissions,
    };
    authenticatedRequest.user = user;

    return handler(authenticatedRequest, context);
  };
}

/**
 * Wrap a handler to require specific permission(s)
 */
export function withPermission<T>(
  permission: string | string[],
  handler: AuthenticatedHandler<T>
): RouteHandler<T> {
  return withAuth(async (request, context) => {
    const { auth } = request;
    const permissions = Array.isArray(permission) ? permission : [permission];

    // Super admins bypass permission checks
    if (isSuperAdmin(auth.userId)) {
      return handler(request, context);
    }

    const hasPermission = userHasAnyPermission(auth.userId, permissions);
    if (!hasPermission) {
      return forbiddenResponse(`Missing required permission: ${permissions.join(' or ')}`) as NextResponse<T>;
    }

    return handler(request, context);
  });
}

/**
 * Wrap a handler to require specific role(s)
 */
export function withRole<T>(
  role: string | string[],
  handler: AuthenticatedHandler<T>
): RouteHandler<T> {
  return withAuth(async (request, context) => {
    const { auth } = request;
    const roles = Array.isArray(role) ? role : [role];

    const hasRole = roles.some((r) => auth.roles.includes(r));
    if (!hasRole) {
      return forbiddenResponse(`Missing required role: ${roles.join(' or ')}`) as NextResponse<T>;
    }

    return handler(request, context);
  });
}

/**
 * Wrap a handler to require admin access
 */
export function withAdmin<T>(handler: AuthenticatedHandler<T>): RouteHandler<T> {
  return withRole(['admin', 'superadmin'], handler);
}

/**
 * Wrap a handler to require superadmin access
 */
export function withSuperAdmin<T>(handler: AuthenticatedHandler<T>): RouteHandler<T> {
  return withRole('superadmin', handler);
}

// ============================================
// Optional Auth
// ============================================

/**
 * Get auth context if available, but don't require it
 */
export function withOptionalAuth<T>(
  handler: (
    request: NextRequest & { auth?: AuthContext; user?: SafeUser },
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse<T>>
): RouteHandler<T> {
  return async (request, context) => {
    const auth = getAuthContext(request);
    const extendedRequest = request as NextRequest & { auth?: AuthContext; user?: SafeUser };

    if (auth) {
      const user = getSafeUser(auth.userId);
      if (user) {
        extendedRequest.auth = {
          ...auth,
          permissions: user.permissions,
        };
        extendedRequest.user = user;
      }
    }

    return handler(extendedRequest, context);
  };
}

// ============================================
// Resource Ownership
// ============================================

/**
 * Check if the authenticated user owns a resource
 */
export function checkOwnership(
  request: AuthenticatedRequest,
  resourceUserId: string
): boolean {
  // Super admins can access any resource
  if (isSuperAdmin(request.auth.userId)) {
    return true;
  }

  return request.auth.userId === resourceUserId;
}

/**
 * Wrap a handler to require ownership of a resource
 */
export function withOwnership<T>(
  getResourceUserId: (request: AuthenticatedRequest, context?: { params?: Promise<Record<string, string>> }) => Promise<string | null>,
  handler: AuthenticatedHandler<T>
): RouteHandler<T> {
  return withAuth(async (request, context) => {
    const resourceUserId = await getResourceUserId(request, context);

    if (!resourceUserId) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 }) as NextResponse<T>;
    }

    if (!checkOwnership(request, resourceUserId)) {
      return forbiddenResponse('You do not have access to this resource') as NextResponse<T>;
    }

    return handler(request, context);
  });
}
