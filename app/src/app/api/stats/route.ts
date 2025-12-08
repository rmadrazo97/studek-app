/**
 * GET /api/stats - Get user gamification stats
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getDatabase } from '@/lib/db';

// Default values when gamification tables don't exist
const DEFAULT_STATS = {
  total_xp: 0,
  weekly_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  streak_freezes_available: 1,
  streak_freezes_used: 0,
  league_tier: 1,
  daily_xp_earned: 0,
  daily_xp_goal: 50,
  last_study_date: null as string | null,
  total_reviews: 0,
  total_correct: 0,
  total_study_time_ms: 0,
  best_combo: 0,
};

const DEFAULT_TIER = {
  id: 1,
  name: 'Bronze',
  icon: 'shield',
  color: '#cd7f32',
  promotionZone: 5,
  demotionZone: 0,
};

/**
 * Check if gamification tables exist
 */
function gamificationTablesExist(): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='user_stats'
    `).get();
    return !!result;
  } catch {
    return false;
  }
}

/**
 * Safely get user stats
 */
function safeGetUserStats(userId: string): typeof DEFAULT_STATS {
  if (!gamificationTablesExist()) {
    return DEFAULT_STATS;
  }

  try {
    const db = getDatabase();
    const stats = db.prepare(`SELECT * FROM user_stats WHERE user_id = ?`).get(userId);
    return stats ? (stats as typeof DEFAULT_STATS) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

/**
 * Safely get user achievements
 */
function safeGetUserAchievements(userId: string): Array<{
  achievement_id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked_at: string;
}> {
  if (!gamificationTablesExist()) {
    return [];
  }

  try {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        ua.achievement_id,
        a.name,
        a.description,
        a.icon,
        a.rarity,
        ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `).all(userId) as Array<{
      achievement_id: string;
      name: string;
      description: string;
      icon: string;
      rarity: string;
      unlocked_at: string;
    }>;
  } catch {
    return [];
  }
}

/**
 * Safely get user rank
 */
function safeGetUserRank(userId: string, stats: typeof DEFAULT_STATS): { rank: number; total: number; weeklyXP: number } {
  if (!gamificationTablesExist()) {
    return { rank: 1, total: 1, weeklyXP: 0 };
  }

  try {
    const db = getDatabase();
    const weekStart = getWeekStartDate();

    const result = db.prepare(`
      SELECT COUNT(*) as higher_count
      FROM user_stats
      WHERE league_tier = ?
        AND week_start_date = ?
        AND weekly_xp > ?
    `).get(stats.league_tier, weekStart, stats.weekly_xp) as { higher_count: number };

    const total = db.prepare(`
      SELECT COUNT(*) as total
      FROM user_stats
      WHERE league_tier = ?
        AND week_start_date = ?
    `).get(stats.league_tier, weekStart) as { total: number };

    return {
      rank: result.higher_count + 1,
      total: total.total || 1,
      weeklyXP: stats.weekly_xp,
    };
  } catch {
    return { rank: 1, total: 1, weeklyXP: 0 };
  }
}

/**
 * Get week start date (Monday)
 */
function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get level info from XP
 */
function getLevel(totalXP: number): {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
} {
  // Level = floor(sqrt(XP / 100))
  const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)));
  const xpForCurrentLevel = Math.pow(level, 2) * 100;
  const xpForNextLevel = Math.pow(level + 1, 2) * 100;
  const progress = (totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);

  return {
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    progress: Math.min(Math.max(progress, 0), 1),
  };
}

/**
 * Get league tier info
 */
function getLeagueTier(tierNum: number): typeof DEFAULT_TIER {
  const tiers = [
    { id: 1, name: 'Bronze', icon: 'shield', color: '#cd7f32', promotionZone: 5, demotionZone: 0 },
    { id: 2, name: 'Silver', icon: 'shield', color: '#c0c0c0', promotionZone: 5, demotionZone: 5 },
    { id: 3, name: 'Gold', icon: 'crown', color: '#ffd700', promotionZone: 5, demotionZone: 5 },
    { id: 4, name: 'Diamond', icon: 'sparkles', color: '#00d4ff', promotionZone: 3, demotionZone: 5 },
    { id: 5, name: 'Champion', icon: 'trophy', color: '#a855f7', promotionZone: 0, demotionZone: 3 },
  ];

  return tiers[Math.min(Math.max(tierNum - 1, 0), tiers.length - 1)];
}

/**
 * Calculate streak status
 */
function calculateStreakStatus(stats: typeof DEFAULT_STATS): {
  current: number;
  longest: number;
  isActive: boolean;
  goalMet: boolean;
  freezesAvailable: number;
  freezesUsed: number;
  lastStudyDate: string | null;
} {
  const today = new Date().toISOString().split('T')[0];
  const goalMet = stats.daily_xp_earned >= stats.daily_xp_goal;

  return {
    current: stats.current_streak,
    longest: stats.longest_streak,
    isActive: stats.last_study_date === today || goalMet,
    goalMet,
    freezesAvailable: stats.streak_freezes_available,
    freezesUsed: stats.streak_freezes_used,
    lastStudyDate: stats.last_study_date,
  };
}

/**
 * Check streak achievement progress
 */
function checkStreakAchievements(currentStreak: number): Array<{ name: string; target: number; current: number }> {
  const milestones = [
    { name: 'Week Warrior', target: 7 },
    { name: 'Monthly Master', target: 30 },
    { name: 'Century Scholar', target: 100 },
    { name: 'Year of Dedication', target: 365 },
  ];

  return milestones
    .filter(m => currentStreak < m.target)
    .slice(0, 2)
    .map(m => ({ ...m, current: currentStreak }));
}

/**
 * Check review count achievement progress
 */
function checkReviewAchievements(totalReviews: number): Array<{ name: string; target: number; current: number }> {
  const milestones = [
    { name: 'Getting Started', target: 100 },
    { name: 'Thousand Cards', target: 1000 },
    { name: 'Ten Thousand', target: 10000 },
    { name: 'Memory Master', target: 100000 },
  ];

  return milestones
    .filter(m => totalReviews < m.target)
    .slice(0, 2)
    .map(m => ({ ...m, current: totalReviews }));
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const stats = safeGetUserStats(userId);
    const achievements = safeGetUserAchievements(userId);
    const rankInfo = safeGetUserRank(userId, stats);
    const levelInfo = getLevel(stats.total_xp);
    const tier = getLeagueTier(stats.league_tier);
    const streakStatus = calculateStreakStatus(stats);
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
