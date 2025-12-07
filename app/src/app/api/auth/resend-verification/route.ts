/**
 * POST /api/auth/resend-verification
 *
 * Resend verification email to authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, resendVerificationEmail, handleAuthError } from '@/lib/auth';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const userId = request.auth.userId;
    const result = await resendVerificationEmail(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    return handleAuthError(error);
  }
});
