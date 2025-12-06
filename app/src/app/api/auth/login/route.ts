/**
 * POST /api/auth/login
 *
 * Authenticate a user and return tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { login, handleAuthError, LoginRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await login({ email, password });

    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
