/**
 * POST /api/auth/refresh
 *
 * Refresh access token using a refresh token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, handleAuthError } from '@/lib/auth';

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

    const result = await refreshAccessToken(refreshToken);

    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
