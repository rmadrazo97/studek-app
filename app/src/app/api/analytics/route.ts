/**
 * GET /api/analytics - Get analytics data for the dashboard
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getDatabase } from '@/lib/db';
import {
  getReviewCountByDate,
  getRetentionRate,
} from '@/lib/db/services/reviews';

// Default stats when gamification tables don't exist
const DEFAULT_USER_STATS = {
  total_xp: 0,
  weekly_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  streak_freezes_available: 1,
  streak_freezes_used: 0,
  league_tier: 1,
  daily_xp_earned: 0,
  last_study_date: null,
};

const DEFAULT_LEVEL = {
  level: 1,
  progress: 0,
};

const DEFAULT_TIER = {
  name: 'Bronze',
  color: '#cd7f32',
};

/**
 * Safely get user stats from gamification tables
 */
function safeGetUserStats(userId: string): typeof DEFAULT_USER_STATS {
  try {
    const db = getDatabase();
    // Check if table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='user_stats'
    `).get();

    if (!tableExists) {
      return DEFAULT_USER_STATS;
    }

    const stats = db.prepare(`SELECT * FROM user_stats WHERE user_id = ?`).get(userId);
    return stats ? (stats as typeof DEFAULT_USER_STATS) : DEFAULT_USER_STATS;
  } catch {
    return DEFAULT_USER_STATS;
  }
}

/**
 * Get level info from XP (inline to avoid import issues)
 */
function safeGetLevel(totalXp: number): typeof DEFAULT_LEVEL {
  try {
    // Level = floor(sqrt(XP / 100))
    const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 100)));
    const xpForCurrentLevel = Math.pow(level, 2) * 100;
    const xpForNextLevel = Math.pow(level + 1, 2) * 100;
    const progress = (totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
    return {
      level,
      progress: Math.min(Math.max(progress, 0), 1),
    };
  } catch {
    return DEFAULT_LEVEL;
  }
}

/**
 * Get league tier info (inline to avoid import issues)
 */
function safeGetLeagueTier(tierNum: number): typeof DEFAULT_TIER {
  const tiers = [
    { name: 'Bronze', color: '#cd7f32' },
    { name: 'Silver', color: '#c0c0c0' },
    { name: 'Gold', color: '#ffd700' },
    { name: 'Diamond', color: '#00d4ff' },
    { name: 'Champion', color: '#a855f7' },
  ];
  return tiers[Math.min(Math.max(tierNum - 1, 0), tiers.length - 1)] || DEFAULT_TIER;
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '365', 10);

    // Get user stats (safely handles missing gamification tables)
    const stats = safeGetUserStats(userId);
    const levelInfo = safeGetLevel(stats.total_xp);
    const tier = safeGetLeagueTier(stats.league_tier);

    // Get heatmap data (review count by date)
    const heatmapData = getReviewCountByDate(userId, days);

    // Convert to the format expected by the frontend
    const heatmap = generateHeatmapWithLevels(heatmapData, days);

    // Get retention rate
    const retentionRate = getRetentionRate(userId, 30);

    // Get daily stats for the past week
    const dailyStats = getDailyStats(userId, 7);

    // Get hourly breakdown
    const hourlyBreakdown = db.prepare(`
      SELECT
        CAST(strftime('%H', reviewed_at) AS INTEGER) as hour,
        COUNT(*) as count,
        AVG(CASE WHEN rating >= 3 THEN 1.0 ELSE 0.0 END) * 100 as retention
      FROM review_logs
      WHERE user_id = ?
        AND reviewed_at >= date('now', '-30 days')
      GROUP BY strftime('%H', reviewed_at)
      ORDER BY hour
    `).all(userId) as Array<{ hour: number; count: number; retention: number }>;

    // Get card state distribution
    const cardStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN cf.state = 'new' OR cf.state IS NULL THEN 1 END) as new_cards,
        COUNT(CASE WHEN cf.state = 'learning' THEN 1 END) as learning,
        COUNT(CASE WHEN cf.state = 'review' THEN 1 END) as review,
        COUNT(CASE WHEN cf.state = 'relearning' THEN 1 END) as relearning,
        COUNT(CASE WHEN cf.stability >= 21 THEN 1 END) as mature,
        COUNT(CASE WHEN cf.lapses >= 8 THEN 1 END) as leeches
      FROM cards c
      JOIN decks d ON d.id = c.deck_id
      LEFT JOIN card_fsrs cf ON cf.card_id = c.id
      WHERE d.user_id = ?
    `).get(userId) as {
      total: number;
      new_cards: number;
      learning: number;
      review: number;
      relearning: number;
      mature: number;
      leeches: number;
    };

    // Get future workload (cards due in next 30 days)
    const futureWorkload = db.prepare(`
      SELECT
        date(cf.due) as date,
        COUNT(*) as count
      FROM card_fsrs cf
      JOIN cards c ON c.id = cf.card_id
      JOIN decks d ON d.id = c.deck_id
      WHERE d.user_id = ?
        AND cf.due >= date('now')
        AND cf.due < date('now', '+30 days')
      GROUP BY date(cf.due)
      ORDER BY date
    `).all(userId) as Array<{ date: string; count: number }>;

    // Calculate average stability and difficulty
    const avgMetrics = db.prepare(`
      SELECT
        AVG(cf.stability) as avg_stability,
        AVG(cf.difficulty) as avg_difficulty
      FROM card_fsrs cf
      JOIN cards c ON c.id = cf.card_id
      JOIN decks d ON d.id = c.deck_id
      WHERE d.user_id = ?
        AND cf.state = 'review'
    `).get(userId) as { avg_stability: number | null; avg_difficulty: number | null };

    // Calculate retention history (last 30 days)
    const retentionHistory = db.prepare(`
      SELECT
        date(reviewed_at) as date,
        AVG(CASE WHEN rating >= 2 THEN 1.0 ELSE 0.0 END) * 100 as retention
      FROM review_logs
      WHERE user_id = ?
        AND reviewed_at >= date('now', '-30 days')
      GROUP BY date(reviewed_at)
      ORDER BY date
    `).all(userId) as Array<{ date: string; retention: number }>;

    // Calculate week-over-week trend
    const thisWeek = db.prepare(`
      SELECT AVG(CASE WHEN rating >= 2 THEN 1.0 ELSE 0.0 END) * 100 as retention
      FROM review_logs
      WHERE user_id = ? AND reviewed_at >= date('now', '-7 days')
    `).get(userId) as { retention: number | null };

    const lastWeek = db.prepare(`
      SELECT AVG(CASE WHEN rating >= 2 THEN 1.0 ELSE 0.0 END) * 100 as retention
      FROM review_logs
      WHERE user_id = ?
        AND reviewed_at >= date('now', '-14 days')
        AND reviewed_at < date('now', '-7 days')
    `).get(userId) as { retention: number | null };

    const trend = (thisWeek.retention || 0) - (lastWeek.retention || 0);

    // Today's stats
    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as reviewed,
        SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct,
        SUM(duration_ms) as time_spent,
        COUNT(DISTINCT card_id) as unique_cards
      FROM review_logs
      WHERE user_id = ?
        AND date(reviewed_at) = date('now')
    `).get(userId) as {
      reviewed: number;
      correct: number;
      time_spent: number | null;
      unique_cards: number;
    };

    // Week stats
    const weekStats = db.prepare(`
      SELECT
        COUNT(*) as total_reviews,
        AVG(CASE WHEN rating >= 2 THEN 1.0 ELSE 0.0 END) * 100 as avg_retention,
        SUM(duration_ms) as total_time,
        COUNT(DISTINCT date(reviewed_at)) as active_days
      FROM review_logs
      WHERE user_id = ?
        AND reviewed_at >= date('now', '-7 days')
    `).get(userId) as {
      total_reviews: number;
      avg_retention: number | null;
      total_time: number | null;
      active_days: number;
    };

    return NextResponse.json({
      heatmap,
      streak: {
        current: stats.current_streak,
        longest: stats.longest_streak,
        freezesAvailable: stats.streak_freezes_available - stats.streak_freezes_used,
        freezesUsed: stats.streak_freezes_used,
        lastActiveDate: stats.last_study_date,
      },
      retention: {
        trueRetention: retentionRate,
        desiredRetention: 90, // Target
        avgRetrievability: retentionRate, // Simplified
        avgStability: avgMetrics.avg_stability || 0,
        avgDifficulty: avgMetrics.avg_difficulty || 5,
        trend,
        historyData: retentionHistory.map(r => r.retention),
      },
      cardStats: {
        total: cardStats.total,
        new: cardStats.new_cards,
        learning: cardStats.learning,
        review: cardStats.review,
        relearning: cardStats.relearning,
        mature: cardStats.mature,
        young: cardStats.review - cardStats.mature,
        suspended: 0,
        leeches: cardStats.leeches,
      },
      hourlyStats: hourlyBreakdown,
      futureWorkload: formatFutureWorkload(futureWorkload),
      todayStats: {
        reviewed: todayStats.reviewed || 0,
        correct: todayStats.correct || 0,
        timeSpent: Math.round((todayStats.time_spent || 0) / 60000),
        newLearned: 0, // Would need to track separately
      },
      weekStats: {
        totalReviews: weekStats.total_reviews || 0,
        avgRetention: weekStats.avg_retention || 0,
        avgTimePerDay: weekStats.active_days
          ? Math.round((weekStats.total_time || 0) / weekStats.active_days / 60000)
          : 0,
        activeDays: weekStats.active_days || 0,
        studyTime: Math.round((weekStats.total_time || 0) / 60000),
      },
      xp: {
        today: stats.daily_xp_earned,
        total: stats.total_xp,
        weekly: stats.weekly_xp,
      },
      level: {
        current: levelInfo.level,
        progress: levelInfo.progress,
      },
      league: {
        tier: tier.name,
        tierColor: tier.color,
      },
    });
  } catch (error) {
    return handleApiError('GET /api/analytics', error, 'Failed to fetch analytics');
  }
});

/**
 * Generate heatmap data with level quantization
 */
function generateHeatmapWithLevels(
  data: Array<{ date: string; count: number }>,
  days: number
): Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> {
  const now = new Date();
  const result: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];

  // Create a map for quick lookup
  const dataMap = new Map(data.map(d => [d.date, d.count]));

  // Find max for quantization
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const p90 = data.length > 0
    ? data.map(d => d.count).sort((a, b) => a - b)[Math.floor(data.length * 0.9)] || maxCount
    : maxCount;

  // Generate all dates
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = dataMap.get(dateStr) || 0;

    // Quantize to 0-4 levels
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / Math.max(p90, 1);
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }

    result.push({ date: dateStr, count, level });
  }

  return result;
}

/**
 * Format future workload data
 */
function formatFutureWorkload(
  data: Array<{ date: string; count: number }>
): Array<{ date: string; reviews: number; total: number; backlog: number }> {
  const result: Array<{ date: string; reviews: number; total: number; backlog: number }> = [];
  let backlog = 0;

  const now = new Date();
  const dataMap = new Map(data.map(d => [d.date, d.count]));

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const reviews = dataMap.get(dateStr) || 0;
    backlog += reviews;

    result.push({
      date: dateStr,
      reviews,
      total: reviews,
      backlog,
    });
  }

  return result;
}
