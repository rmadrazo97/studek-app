/**
 * POST /api/reviews/session - Complete a study session with all reviews
 * Updated for FSRS v5 with learning steps and personalized parameters
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getDatabase, transaction } from '@/lib/db';
import { create, now } from '@/lib/db/crud';
import { createReviewLog } from '@/lib/db/services/reviews';
import {
  getUserStats,
  recordStudySession,
  checkAndUnlockAchievements,
} from '@/lib/db/services/gamification';
import { calculateSessionXP, getMotivationalMessage, getLevel } from '@/lib/gamification';
import type { Rating, StudySession } from '@/lib/db/types';
import { assertStudySessionAllowed, PlanLimitError, planLimitToResponse } from '@/lib/billing/limits';

interface SessionReview {
  cardId: string;
  rating: Rating;
  durationMs: number;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  isNewCard: boolean;
  // FSRS v5 additions
  stateBefore?: string;
  stateAfter?: string;
  stepBefore?: number;
  stepAfter?: number;
  scheduledDays?: number;
  elapsedDays?: number;
}

interface SessionRequest {
  deckId: string;
  reviews: SessionReview[];
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json() as SessionRequest;
    const { deckId, reviews } = body;

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews to record' },
        { status: 400 }
      );
    }

    assertStudySessionAllowed(userId, deckId);

    const db = getDatabase();

    // Get current stats for streak calculation
    const statsBefore = getUserStats(userId);

    // Process all reviews in a transaction
    const result = transaction(() => {
      // Create study session record
      const session = create<StudySession>('study_sessions', {
        user_id: userId,
        deck_id: deckId,
        cards_reviewed: reviews.length,
        cards_correct: reviews.filter(r => r.rating > 1).length,
        total_duration_ms: reviews.reduce((sum, r) => sum + r.durationMs, 0),
        started_at: now(),
        ended_at: now(),
      });

      // Create individual review logs
      for (const review of reviews) {
        createReviewLog({
          card_id: review.cardId,
          user_id: userId,
          rating: review.rating,
          duration_ms: review.durationMs,
          stability_before: review.stabilityBefore,
          stability_after: review.stabilityAfter,
          difficulty_before: review.difficultyBefore,
          difficulty_after: review.difficultyAfter,
        });

        // Update card FSRS data with v5 fields
        const existingFSRS = db.prepare(`
          SELECT * FROM card_fsrs WHERE card_id = ?
        `).get(review.cardId);

        // Calculate due based on scheduled days (supports learning steps in minutes)
        const scheduledDays = review.scheduledDays ?? Math.max(1, Math.round(review.stabilityAfter));
        const newState = review.stateAfter || (review.rating === 1 ? 'relearning' : 'review');
        const newStep = review.stepAfter ?? 0;
        const elapsedDays = review.elapsedDays ?? 0;

        // For learning steps, scheduledDays might be a fraction (minutes/1440)
        // Convert to proper interval
        let dueInterval: string;
        if (scheduledDays < 1) {
          // Learning step - use minutes
          const minutes = Math.max(1, Math.round(scheduledDays * 24 * 60));
          dueInterval = `+${minutes} minutes`;
        } else {
          dueInterval = `+${Math.round(scheduledDays)} days`;
        }

        if (existingFSRS) {
          db.prepare(`
            UPDATE card_fsrs
            SET stability = ?, difficulty = ?, last_review = ?, reps = reps + 1,
                lapses = lapses + ?, state = ?, step = ?,
                elapsed_days = ?, scheduled_days = ?,
                due = datetime('now', '${dueInterval}')
            WHERE card_id = ?
          `).run(
            review.stabilityAfter,
            review.difficultyAfter,
            now(),
            review.rating === 1 ? 1 : 0,
            newState,
            newStep,
            elapsedDays,
            Math.round(scheduledDays),
            review.cardId
          );
        } else {
          db.prepare(`
            INSERT INTO card_fsrs (card_id, stability, difficulty, due, last_review, reps, lapses, state, step, elapsed_days, scheduled_days)
            VALUES (?, ?, ?, datetime('now', '${dueInterval}'), ?, 1, ?, ?, ?, ?, ?)
          `).run(
            review.cardId,
            review.stabilityAfter,
            review.difficultyAfter,
            now(),
            review.rating === 1 ? 1 : 0,
            newState,
            newStep,
            elapsedDays,
            Math.round(scheduledDays)
          );
        }
      }

      return session;
    });

    // Calculate session XP
    const xpResult = calculateSessionXP(
      reviews.map(r => ({
        rating: r.rating,
        isNewCard: r.isNewCard,
        durationMs: r.durationMs,
        cardDifficulty: r.difficultyAfter,
      })),
      statsBefore.current_streak
    );

    // Record the study session and update gamification stats
    const statsAfter = recordStudySession(userId, {
      cardsReviewed: reviews.length,
      cardsCorrect: reviews.filter(r => r.rating > 1).length,
      totalDurationMs: reviews.reduce((sum, r) => sum + r.durationMs, 0),
      xpEarned: xpResult.totalXP,
      bestCombo: xpResult.bestCombo,
    });

    // Check for new achievements
    const newAchievements = checkAndUnlockAchievements(userId);

    // Calculate level info
    const levelInfo = getLevel(statsAfter.total_xp);
    const levelBefore = getLevel(statsBefore.total_xp);
    const leveledUp = levelInfo.level > levelBefore.level;

    // Get motivational message
    const message = getMotivationalMessage(
      xpResult.accuracy,
      statsAfter.current_streak,
      xpResult.totalXP
    );

    // Check if streak increased
    const streakIncreased = statsAfter.current_streak > statsBefore.current_streak;

    return NextResponse.json({
      session: {
        id: result.id,
        cardsReviewed: reviews.length,
        cardsCorrect: reviews.filter(r => r.rating > 1).length,
        accuracy: xpResult.accuracy,
        totalDurationMs: reviews.reduce((sum, r) => sum + r.durationMs, 0),
        avgTimeMs: xpResult.avgTimeMs,
        bestCombo: xpResult.bestCombo,
      },
      xp: {
        total: xpResult.totalXP,
        breakdown: xpResult.breakdown,
      },
      stats: {
        totalXP: statsAfter.total_xp,
        dailyXP: statsAfter.daily_xp_earned,
        dailyGoal: statsAfter.daily_xp_goal,
        streak: statsAfter.current_streak,
        longestStreak: statsAfter.longest_streak,
        streakIncreased,
        freezesAvailable: statsAfter.streak_freezes_available - statsAfter.streak_freezes_used,
      },
      level: {
        current: levelInfo.level,
        xpProgress: statsAfter.total_xp - levelInfo.xpForCurrentLevel,
        xpNeeded: levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel,
        progress: levelInfo.progress,
        leveledUp,
      },
      achievements: newAchievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xp_reward,
        rarity: a.rarity,
      })),
      message,
    });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(planLimitToResponse(error), { status: error.statusCode });
    }
    return handleApiError('POST /api/reviews/session', error, 'Failed to complete study session');
  }
});
