/**
 * GET /api/subscriptions/plans
 *
 * Get all available subscription plans.
 */

import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/subscriptions/plans';
import type { PlansResponse } from '@/lib/subscriptions/types';

export async function GET(): Promise<NextResponse<PlansResponse | { error: string }>> {
  try {
    const plans = getAllPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('[Subscriptions] Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
