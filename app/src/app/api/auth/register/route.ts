/**
 * POST /api/auth/register
 *
 * Register a new user account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { register, handleAuthError, RegisterRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterRequest;

    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await register({ email, password, name });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
