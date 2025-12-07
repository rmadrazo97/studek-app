/**
 * Gamification Database Service
 *
 * Provides operations for user stats, XP, streaks, and achievements.
 */

import { getDatabase, transaction } from '../index';
import { create, findById, now } from '../crud';
import type {
  UserStats,
  UserStatsCreate,
  UserStatsUpdate,
  XPTransaction,
  XPTransactionCreate,
  Achievement,
  UserAchievement,
  UserAchievementWithDetails,
} from '../types';

const USER_STATS_TABLE = 'user_stats';
const XP_TRANSACTIONS_TABLE = 'xp_transactions';
const ACHIEVEMENTS_TABLE = 'achievements';
const USER_ACHIEVEMENTS_TABLE = 'user_achievements';

// ============================================
// User Stats
// ============================================

/**
 * Get user stats, creating if doesn't exist
 */
export function getUserStats(userId: string): UserStats {
  const db = getDatabase();
  const existing = db.prepare(`SELECT * FROM ${USER_STATS_TABLE} WHERE user_id = ?`).get(userId) as UserStats | undefined;

  if (existing) {
    // Check if we need to reset daily XP (new day)
    const today = new Date().toISOString().split('T')[0];
    if (existing.daily_goal_date !== today) {
      db.prepare(`
        UPDATE ${USER_STATS_TABLE}
        SET daily_xp_earned = 0, daily_goal_date = ?, updated_at = ?
        WHERE user_id = ?
      `).run(today, now(), userId);

      return { ...existing, daily_xp_earned: 0, daily_goal_date: today };
    }

    // Check if we need to reset weekly XP (new week)
    const weekStart = getWeekStartDate();
    if (existing.week_start_date !== weekStart) {
      db.prepare(`
        UPDATE ${USER_STATS_TABLE}
        SET weekly_xp = 0, week_start_date = ?, updated_at = ?
        WHERE user_id = ?
      `).run(weekStart, now(), userId);

      return { ...existing, weekly_xp: 0, week_start_date: weekStart };
    }

    return existing;
  }

  // Create new user stats
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStartDate();

  db.prepare(`
    INSERT INTO ${USER_STATS_TABLE} (
      user_id, total_xp, weekly_xp, week_start_date, current_streak, longest_streak,
      streak_freezes_available, streak_freezes_used, league_tier, best_combo,
      total_reviews, total_correct, total_study_time_ms, daily_xp_goal,
      daily_xp_earned, daily_goal_date, created_at, updated_at
    ) VALUES (?, 0, 0, ?, 0, 0, 1, 0, 1, 0, 0, 0, 0, 50, 0, ?, ?, ?)
  `).run(userId, weekStart, today, now(), now());

  return db.prepare(`SELECT * FROM ${USER_STATS_TABLE} WHERE user_id = ?`).get(userId) as UserStats;
}

/**
 * Update user stats
 */
export function updateUserStats(userId: string, updates: UserStatsUpdate): UserStats {
  const db = getDatabase();

  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return getUserStats(userId);
  }

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  db.prepare(`
    UPDATE ${USER_STATS_TABLE}
    SET ${setClause}, updated_at = ?
    WHERE user_id = ?
  `).run(...values, now(), userId);

  return getUserStats(userId);
}

/**
 * Award XP to a user
 */
export function awardXP(
  userId: string,
  amount: number,
  source: XPTransactionCreate['source'],
  sourceId?: string,
  metadata?: Record<string, unknown>
): { newTotal: number; newWeekly: number; newDaily: number; transaction: XPTransaction } {
  const db = getDatabase();

  return transaction(() => {
    // Ensure stats exist
    const stats = getUserStats(userId);

    // Create XP transaction
    const txn = create<XPTransaction>(XP_TRANSACTIONS_TABLE, {
      user_id: userId,
      amount,
      source,
      source_id: sourceId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Update stats
    const newTotal = stats.total_xp + amount;
    const newWeekly = stats.weekly_xp + amount;
    const newDaily = stats.daily_xp_earned + amount;

    db.prepare(`
      UPDATE ${USER_STATS_TABLE}
      SET total_xp = ?, weekly_xp = ?, daily_xp_earned = ?, updated_at = ?
      WHERE user_id = ?
    `).run(newTotal, newWeekly, newDaily, now(), userId);

    return {
      newTotal,
      newWeekly,
      newDaily,
      transaction: txn,
    };
  })();
}

/**
 * Record a study session and update all gamification stats
 */
export function recordStudySession(
  userId: string,
  sessionData: {
    cardsReviewed: number;
    cardsCorrect: number;
    totalDurationMs: number;
    xpEarned: number;
    bestCombo: number;
  }
): UserStats {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  return transaction(() => {
    const stats = getUserStats(userId);

    // Calculate streak update
    let newStreak = stats.current_streak;
    let freezeUsed = false;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const xpThreshold = 50; // XP needed to maintain streak

    if (stats.daily_xp_earned < xpThreshold && stats.daily_xp_earned + sessionData.xpEarned >= xpThreshold) {
      // Just met the daily threshold
      if (stats.last_study_date === null || stats.last_study_date === today) {
        // First ever or already counted today
        newStreak = stats.current_streak + 1;
      } else if (stats.last_study_date === yesterday) {
        // Continuing streak
        newStreak = stats.current_streak + 1;
      } else {
        // Check if we can use a freeze
        const daysMissed = Math.floor(
          (new Date(today).getTime() - new Date(stats.last_study_date).getTime()) / 86400000
        );
        if (daysMissed === 2 && stats.streak_freezes_available > stats.streak_freezes_used) {
          newStreak = stats.current_streak + 1;
          freezeUsed = true;
        } else {
          newStreak = 1; // Start fresh
        }
      }
    }

    const newLongestStreak = Math.max(stats.longest_streak, newStreak);
    const newBestCombo = Math.max(stats.best_combo, sessionData.bestCombo);

    // Update stats
    db.prepare(`
      UPDATE ${USER_STATS_TABLE}
      SET
        total_xp = total_xp + ?,
        weekly_xp = weekly_xp + ?,
        daily_xp_earned = daily_xp_earned + ?,
        current_streak = ?,
        longest_streak = ?,
        last_study_date = ?,
        streak_freezes_used = streak_freezes_used + ?,
        best_combo = ?,
        total_reviews = total_reviews + ?,
        total_correct = total_correct + ?,
        total_study_time_ms = total_study_time_ms + ?,
        updated_at = ?
      WHERE user_id = ?
    `).run(
      sessionData.xpEarned,
      sessionData.xpEarned,
      sessionData.xpEarned,
      newStreak,
      newLongestStreak,
      today,
      freezeUsed ? 1 : 0,
      newBestCombo,
      sessionData.cardsReviewed,
      sessionData.cardsCorrect,
      sessionData.totalDurationMs,
      now(),
      userId
    );

    return getUserStats(userId);
  })();
}

// ============================================
// XP Transactions
// ============================================

/**
 * Get XP transactions for a user
 */
export function getXPTransactions(
  userId: string,
  limit = 50,
  offset = 0
): XPTransaction[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${XP_TRANSACTIONS_TABLE}
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as XPTransaction[];
}

/**
 * Get XP earned in date range
 */
export function getXPByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): { date: string; xp: number }[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      date(created_at) as date,
      SUM(amount) as xp
    FROM ${XP_TRANSACTIONS_TABLE}
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(userId, startDate, endDate) as { date: string; xp: number }[];
}

// ============================================
// Achievements
// ============================================

/**
 * Get all achievements
 */
export function getAllAchievements(): Achievement[] {
  const db = getDatabase();
  return db.prepare(`SELECT * FROM ${ACHIEVEMENTS_TABLE} ORDER BY rarity, requirement_value`).all() as Achievement[];
}

/**
 * Get user's unlocked achievements
 */
export function getUserAchievements(userId: string): UserAchievementWithDetails[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      ua.*,
      a.name,
      a.description,
      a.icon,
      a.category,
      a.requirement_type,
      a.requirement_value,
      a.xp_reward,
      a.rarity
    FROM ${USER_ACHIEVEMENTS_TABLE} ua
    JOIN ${ACHIEVEMENTS_TABLE} a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.unlocked_at DESC
  `).all(userId) as UserAchievementWithDetails[];
}

/**
 * Unlock an achievement for a user
 */
export function unlockAchievement(
  userId: string,
  achievementId: string
): { unlocked: boolean; achievement?: Achievement; xpAwarded?: number } {
  const db = getDatabase();

  // Check if already unlocked
  const existing = db.prepare(`
    SELECT * FROM ${USER_ACHIEVEMENTS_TABLE}
    WHERE user_id = ? AND achievement_id = ?
  `).get(userId, achievementId);

  if (existing) {
    return { unlocked: false };
  }

  // Get achievement details
  const achievement = db.prepare(`
    SELECT * FROM ${ACHIEVEMENTS_TABLE} WHERE id = ?
  `).get(achievementId) as Achievement | undefined;

  if (!achievement) {
    return { unlocked: false };
  }

  return transaction(() => {
    // Create user achievement
    create<UserAchievement>(USER_ACHIEVEMENTS_TABLE, {
      user_id: userId,
      achievement_id: achievementId,
    });

    // Award XP for achievement
    if (achievement.xp_reward > 0) {
      awardXP(userId, achievement.xp_reward, 'achievement', achievementId, {
        achievementName: achievement.name,
      });
    }

    return {
      unlocked: true,
      achievement,
      xpAwarded: achievement.xp_reward,
    };
  })();
}

/**
 * Check and unlock any earned achievements
 */
export function checkAndUnlockAchievements(userId: string): Achievement[] {
  const stats = getUserStats(userId);
  const unlockedAchievements: Achievement[] = [];

  // Get all achievements user doesn't have yet
  const db = getDatabase();
  const unearned = db.prepare(`
    SELECT a.* FROM ${ACHIEVEMENTS_TABLE} a
    WHERE a.id NOT IN (
      SELECT achievement_id FROM ${USER_ACHIEVEMENTS_TABLE} WHERE user_id = ?
    )
  `).all(userId) as Achievement[];

  for (const achievement of unearned) {
    let shouldUnlock = false;

    switch (achievement.requirement_type) {
      case 'streak':
        shouldUnlock = stats.current_streak >= achievement.requirement_value ||
                       stats.longest_streak >= achievement.requirement_value;
        break;
      case 'count':
        if (achievement.category === 'reviews') {
          shouldUnlock = stats.total_reviews >= achievement.requirement_value;
        }
        break;
      // Add more requirement types as needed
    }

    if (shouldUnlock) {
      const result = unlockAchievement(userId, achievement.id);
      if (result.unlocked && result.achievement) {
        unlockedAchievements.push(result.achievement);
      }
    }
  }

  return unlockedAchievements;
}

// ============================================
// Leaderboard
// ============================================

/**
 * Get leaderboard for a league tier
 */
export function getLeaderboard(
  tier: number,
  limit = 30
): Array<UserStats & { rank: number; user_name?: string }> {
  const db = getDatabase();
  const weekStart = getWeekStartDate();

  return db.prepare(`
    SELECT
      us.*,
      u.name as user_name,
      ROW_NUMBER() OVER (ORDER BY us.weekly_xp DESC) as rank
    FROM ${USER_STATS_TABLE} us
    LEFT JOIN users u ON us.user_id = u.id
    WHERE us.league_tier = ?
      AND us.week_start_date = ?
    ORDER BY us.weekly_xp DESC
    LIMIT ?
  `).all(tier, weekStart, limit) as Array<UserStats & { rank: number; user_name?: string }>;
}

/**
 * Get user's rank in their league
 */
export function getUserRank(userId: string): { rank: number; total: number; weeklyXP: number } {
  const db = getDatabase();
  const stats = getUserStats(userId);
  const weekStart = getWeekStartDate();

  // Count users with more XP in same tier
  const result = db.prepare(`
    SELECT COUNT(*) as higher_count
    FROM ${USER_STATS_TABLE}
    WHERE league_tier = ?
      AND week_start_date = ?
      AND weekly_xp > ?
  `).get(stats.league_tier, weekStart, stats.weekly_xp) as { higher_count: number };

  const total = db.prepare(`
    SELECT COUNT(*) as total
    FROM ${USER_STATS_TABLE}
    WHERE league_tier = ?
      AND week_start_date = ?
  `).get(stats.league_tier, weekStart) as { total: number };

  return {
    rank: result.higher_count + 1,
    total: total.total,
    weeklyXP: stats.weekly_xp,
  };
}

// ============================================
// Helpers
// ============================================

/**
 * Get the start of the current week (Monday)
 */
function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
