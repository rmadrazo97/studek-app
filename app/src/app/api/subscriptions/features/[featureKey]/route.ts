/**
 * GET /api/subscriptions/features/[featureKey]
 *
 * Check if the current user has access to a specific feature.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { checkFeatureAccess } from '@/lib/subscriptions/service';
import type { FeatureCheckResponse } from '@/lib/subscriptions/types';

async function handler(
  request: AuthenticatedRequest,
  context: { params?: Promise<Record<string, string>> }
): Promise<NextResponse<FeatureCheckResponse | { error: string }>> {
  try {
    const params = await context.params;
    const featureKey = params?.featureKey;

    if (!featureKey) {
      return NextResponse.json(
        { error: 'Missing feature key' },
        { status: 400 }
      );
    }

    const feature = await checkFeatureAccess(request.auth.userId, featureKey);

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('[Subscriptions] Feature check error:', error);
    const message = error instanceof Error ? error.message : 'Failed to check feature access';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
