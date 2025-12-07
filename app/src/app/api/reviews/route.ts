/**
 * POST /api/reviews - Record a review and award XP
 * GET /api/reviews - Get review history
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getDatabase } from '@/lib/db';
import { createReviewLog, getReviewLogsByDateRange } from '@/lib/db/services/reviews';
import { awardXP, getUserStats, recordStudySession, checkAndUnlockAchievements } from '@/lib/db/services/gamification';
import { calculateReviewXP, DEFAULT_XP_CONFIG } from '@/lib/gamification';
import type { Rating } from '@/lib/db/types';

interface ReviewRequest {
  cardId: string;
  rating: Rating;
  durationMs: number;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  isNewCard?: boolean;
  currentCombo?: number;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json() as ReviewRequest;

    const {
      cardId,
      rating,
      durationMs,
      stabilityBefore,
      stabilityAfter,
      difficultyBefore,
      difficultyAfter,
      isNewCard = false,
      currentCombo = 0,
    } = body;

    // Validate required fields
    if (!cardId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: 'Invalid review data' },
        { status: 400 }
      );
    }

    // Create review log
    const reviewLog = createReviewLog({
      card_id: cardId,
      user_id: userId,
      rating,
      duration_ms: durationMs || 0,
      stability_before: stabilityBefore || 0,
      stability_after: stabilityAfter || 0,
      difficulty_before: difficultyBefore || 5,
      difficulty_after: difficultyAfter || 5,
    });

    // Calculate XP for this review
    const xpResult = calculateReviewXP(
      rating,
      isNewCard,
      currentCombo,
      durationMs,
      difficultyAfter,
      DEFAULT_XP_CONFIG
    );

    // Award XP
    const xpAwarded = awardXP(
      userId,
      xpResult.xp.total,
      'review',
      cardId,
      {
        rating,
        isNewCard,
        durationMs,
        combo: currentCombo,
        breakdown: xpResult.xp,
      }
    );

    // Get updated stats
    const stats = getUserStats(userId);

    return NextResponse.json({
      review: reviewLog,
      xp: {
        earned: xpResult.xp.total,
        breakdown: xpResult.xp,
        newTotal: xpAwarded.newTotal,
        newDaily: xpAwarded.newDaily,
      },
      combo: {
        current: xpResult.newCombo,
        lost: xpResult.comboLost,
      },
      stats: {
        streak: stats.current_streak,
        dailyGoalProgress: stats.daily_xp_earned,
        dailyGoal: stats.daily_xp_goal,
      },
    });
  } catch (error) {
    return handleApiError('POST /api/reviews', error, 'Failed to record review');
  }
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const { searchParams } = new URL(request.url);

    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const reviews = getReviewLogsByDateRange(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    return NextResponse.json({ reviews });
  } catch (error) {
    return handleApiError('GET /api/reviews', error, 'Failed to fetch reviews');
  }
});
