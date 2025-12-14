import { NextResponse } from 'next/server';

// Apple Pay Domain Verification
// This file is required for Apple Pay to work on your domain.
// The content is provided by Stripe when you register your domain for Apple Pay.
//
// To get your verification file content:
// 1. Go to Stripe Dashboard > Settings > Payment methods > Apple Pay
// 2. Add your domain (studek.com)
// 3. Stripe will verify by fetching this endpoint
//
// The verification content below is the standard Stripe Apple Pay domain verification
// that Stripe downloads from their servers when verifying your domain.

const APPLE_PAY_DOMAIN_VERIFICATION = process.env.APPLE_PAY_DOMAIN_VERIFICATION || '';

export async function GET() {
  // If env var is set, use that
  if (APPLE_PAY_DOMAIN_VERIFICATION) {
    return new NextResponse(APPLE_PAY_DOMAIN_VERIFICATION, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Otherwise, proxy from Stripe's verification server
  // This is the recommended approach as Stripe can update the verification content
  try {
    const response = await fetch(
      'https://stripe.com/files/apple-pay/apple-developer-merchantid-domain-association'
    );

    if (!response.ok) {
      console.error('[Apple Pay] Failed to fetch verification file from Stripe');
      return new NextResponse('Verification file not available', { status: 404 });
    }

    const content = await response.text();

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('[Apple Pay] Error fetching verification file:', error);
    return new NextResponse('Verification file not available', { status: 500 });
  }
}
