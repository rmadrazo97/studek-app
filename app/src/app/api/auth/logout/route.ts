/**
 * POST /api/auth/logout
 *
 * Revoke the refresh token (logout).
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken, handleAuthError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { refreshToken?: string };

    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    revokeRefreshToken(refreshToken);

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
