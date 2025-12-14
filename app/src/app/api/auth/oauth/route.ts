/**
 * GET /api/auth/oauth?provider=google|github
 *
 * Redirects user to OAuth provider authorization page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthAuthorizationUrl, OAuthProvider } from '@/lib/auth/oauth';

const VALID_PROVIDERS: OAuthProvider[] = ['google', 'github'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') as OAuthProvider | null;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid or missing provider. Use "google" or "github".' },
        { status: 400 }
      );
    }

    // Check if provider credentials are configured
    const clientId =
      provider === 'google'
        ? process.env.GOOGLE_CLIENT_ID
        : process.env.GH_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: `${provider} OAuth is not configured` },
        { status: 503 }
      );
    }

    const authorizationUrl = getOAuthAuthorizationUrl(provider);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('[OAuth] Error generating authorization URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
