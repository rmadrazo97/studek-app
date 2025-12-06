/**
 * GET /api/auth/me
 *
 * Get the current authenticated user.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(request: AuthenticatedRequest) {
  return NextResponse.json({ user: request.user });
}

export const GET = withAuth(handler);
