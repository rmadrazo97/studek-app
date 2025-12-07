/**
 * GET /api/stats - Get user gamification stats
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getUserStats,
  getUserAchievements,
  getUserRank,
} from '@/lib/db/services/gamification';
import {
  getLevel,
  getLeagueTier,
  calculateStreakStatus,
  checkStreakAchievements,
  checkReviewAchievements,
} from '@/lib/gamification';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const stats = getUserStats(userId);
    const achievements = getUserAchievements(userId);
    const rankInfo = getUserRank(userId);
    const levelInfo = getLevel(stats.total_xp);
    const tier = getLeagueTier(stats.league_tier);

    // Calculate streak status
    const streakStatus = calculateStreakStatus(
      stats.current_streak,
      stats.longest_streak,
      stats.last_study_date,
      stats.daily_xp_earned,
      stats.daily_xp_goal,
      stats.streak_freezes_available,
      stats.streak_freezes_used
    );

    // Get achievement progress
    const streakProgress = checkStreakAchievements(stats.current_streak);
    const reviewProgress = checkReviewAchievements(stats.total_reviews);

    return NextResponse.json({
      xp: {
        total: stats.total_xp,
        weekly: stats.weekly_xp,
        daily: stats.daily_xp_earned,
        dailyGoal: stats.daily_xp_goal,
      },
      level: {
        current: levelInfo.level,
        xpProgress: stats.total_xp - levelInfo.xpForCurrentLevel,
        xpNeeded: levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel,
        progress: levelInfo.progress,
      },
      streak: {
        current: streakStatus.current,
        longest: streakStatus.longest,
        isActive: streakStatus.isActive,
        goalMet: streakStatus.goalMet,
        freezesAvailable: streakStatus.freezesAvailable - streakStatus.freezesUsed,
        lastStudyDate: streakStatus.lastStudyDate,
      },
      league: {
        tier: {
          id: tier.id,
          name: tier.name,
          icon: tier.icon,
          color: tier.color,
        },
        rank: rankInfo.rank,
        totalInCohort: rankInfo.total,
        weeklyXP: rankInfo.weeklyXP,
        isInPromotionZone: rankInfo.rank <= tier.promotionZone,
        isInDemotionZone: tier.demotionZone > 0 && rankInfo.rank > rankInfo.total - tier.demotionZone,
      },
      totals: {
        reviews: stats.total_reviews,
        correct: stats.total_correct,
        studyTimeMs: stats.total_study_time_ms,
        bestCombo: stats.best_combo,
      },
      achievements: {
        unlocked: achievements.map(a => ({
          id: a.achievement_id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          rarity: a.rarity,
          unlockedAt: a.unlocked_at,
        })),
        progress: {
          streak: streakProgress,
          reviews: reviewProgress,
        },
      },
    });
  } catch (error) {
    return handleApiError('GET /api/stats', error, 'Failed to fetch user stats');
  }
});
