/**
 * POST /api/auth/forgot-password
 *
 * Request password reset email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    // Always return success to prevent email enumeration
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('[API] Forgot password error:', error);
    // Still return success to prevent enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    });
  }
}
