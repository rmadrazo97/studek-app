/**
 * GET /api/auth/callback/google
 *
 * Handle Google OAuth callback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback, verifyOAuthState } from '@/lib/auth/oauth';
import { handleAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studek.com';

    // Check for error from Google
    if (error) {
      console.error('[OAuth Google] Error from provider:', error);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent('Authentication cancelled or failed')}`
      );
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Verify state to prevent CSRF
    const provider = verifyOAuthState(state);
    if (provider !== 'google') {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent('Invalid or expired state parameter')}`
      );
    }

    // Handle OAuth callback
    const result = await handleOAuthCallback('google', code);

    // Redirect to dashboard with tokens in URL fragment (for client-side handling)
    // Using fragment (#) instead of query params for security
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: JSON.stringify(result.user),
    });

    return NextResponse.redirect(`${baseUrl}/auth/callback#${params.toString()}`);
  } catch (error) {
    console.error('[OAuth Google] Callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studek.com';

    // Get error message
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';

    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
