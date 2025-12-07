/**
 * POST /api/auth/reset-password
 * GET /api/auth/reset-password?token=xxx
 *
 * Reset password using token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken, validatePasswordResetToken } from '@/lib/auth';

/**
 * GET - Validate reset token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = validatePasswordResetToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('[API] Validate reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST - Reset password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting password' },
      { status: 500 }
    );
  }
}
