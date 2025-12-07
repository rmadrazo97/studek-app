/**
 * Gamification System
 *
 * This module provides the XP, streak, and gamification logic
 * for the Studek app. It follows the "Hooked Model":
 * Trigger → Action → Variable Reward → Investment
 */

import type { Rating } from '@/lib/db/types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface XPConfig {
  baseReview: number;
  newCard: number;
  comboBonus: number;
  comboThreshold: number;
  speedBonus: number;
  speedThreshold: number; // milliseconds
  difficultyMultiplierBase: number;
}

export interface XPBreakdown {
  base: number;
  newCardBonus: number;
  comboBonus: number;
  speedBonus: number;
  difficultyBonus: number;
  total: number;
}

export interface ReviewXPResult {
  xp: XPBreakdown;
  newCombo: number;
  comboLost: boolean;
}

export interface SessionXPResult {
  totalXP: number;
  breakdown: {
    baseXP: number;
    newCardXP: number;
    comboXP: number;
    speedXP: number;
    difficultyXP: number;
    accuracyBonus: number;
    streakBonus: number;
  };
  cardsReviewed: number;
  correctCount: number;
  accuracy: number;
  bestCombo: number;
  avgTimeMs: number;
}

export interface StreakStatus {
  current: number;
  longest: number;
  isActive: boolean;
  xpEarnedToday: number;
  dailyGoal: number;
  goalMet: boolean;
  freezesAvailable: number;
  freezesUsed: number;
  lastStudyDate: string | null;
}

export interface LeagueTier {
  id: number;
  name: string;
  icon: string;
  color: string;
  minXP: number;
  promotionZone: number; // top N positions
  demotionZone: number; // bottom N positions
}

export interface LeagueStatus {
  tier: LeagueTier;
  rank: number;
  totalInCohort: number;
  weeklyXP: number;
  promotionDistance: number; // XP needed to reach promotion zone
  demotionDistance: number; // XP margin above demotion zone
  isInPromotionZone: boolean;
  isInDemotionZone: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_XP_CONFIG: XPConfig = {
  baseReview: 10,
  newCard: 15,
  comboBonus: 5,
  comboThreshold: 5, // Bonus every N correct answers
  speedBonus: 2,
  speedThreshold: 5000, // 5 seconds
  difficultyMultiplierBase: 0.1, // XP multiplied by (1 + difficulty * this)
};

export const DAILY_XP_GOAL = 50;
export const STREAK_XP_THRESHOLD = 50; // XP needed to maintain streak

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 1, name: 'Bronze', icon: 'shield', color: '#CD7F32', minXP: 0, promotionZone: 5, demotionZone: 0 },
  { id: 2, name: 'Silver', icon: 'shield', color: '#C0C0C0', minXP: 500, promotionZone: 5, demotionZone: 5 },
  { id: 3, name: 'Gold', icon: 'shield', color: '#FFD700', minXP: 1500, promotionZone: 5, demotionZone: 5 },
  { id: 4, name: 'Diamond', icon: 'gem', color: '#B9F2FF', minXP: 3500, promotionZone: 3, demotionZone: 5 },
  { id: 5, name: 'Champion', icon: 'crown', color: '#9B59B6', minXP: 7000, promotionZone: 0, demotionZone: 3 },
];

export const COHORT_SIZE = 30;

// ============================================================================
// XP Calculation Functions
// ============================================================================

/**
 * Calculate XP for a single card review
 */
export function calculateReviewXP(
  rating: Rating,
  isNewCard: boolean,
  currentCombo: number,
  durationMs: number,
  cardDifficulty: number,
  config: XPConfig = DEFAULT_XP_CONFIG
): ReviewXPResult {
  const isCorrect = rating > 1; // Anything except "Again" is considered correct
  const comboLost = !isCorrect && currentCombo > 0;

  const xp: XPBreakdown = {
    base: 0,
    newCardBonus: 0,
    comboBonus: 0,
    speedBonus: 0,
    difficultyBonus: 0,
    total: 0,
  };

  // Base XP for reviewing
  xp.base = config.baseReview;

  // New card bonus
  if (isNewCard) {
    xp.newCardBonus = config.newCard - config.baseReview; // Extra XP for new cards
  }

  // Combo bonus (only on correct answers)
  const newCombo = isCorrect ? currentCombo + 1 : 0;
  if (isCorrect && newCombo > 0 && newCombo % config.comboThreshold === 0) {
    xp.comboBonus = config.comboBonus;
  }

  // Speed bonus (only on correct answers under threshold)
  if (isCorrect && durationMs < config.speedThreshold) {
    xp.speedBonus = config.speedBonus;
  }

  // Difficulty multiplier (harder cards give more XP)
  // Difficulty ranges from 1-10, so multiplier is 1.1 to 2.0
  const difficultyMultiplier = 1 + (cardDifficulty * config.difficultyMultiplierBase);
  const baseWithDifficulty = Math.floor(xp.base * difficultyMultiplier);
  xp.difficultyBonus = baseWithDifficulty - xp.base;

  // Calculate total
  xp.total = xp.base + xp.newCardBonus + xp.comboBonus + xp.speedBonus + xp.difficultyBonus;

  return {
    xp,
    newCombo,
    comboLost,
  };
}

/**
 * Calculate total XP for a study session
 */
export function calculateSessionXP(
  reviews: Array<{
    rating: Rating;
    isNewCard: boolean;
    durationMs: number;
    cardDifficulty: number;
  }>,
  currentStreak: number,
  config: XPConfig = DEFAULT_XP_CONFIG
): SessionXPResult {
  let combo = 0;
  let bestCombo = 0;
  let totalDurationMs = 0;

  const breakdown = {
    baseXP: 0,
    newCardXP: 0,
    comboXP: 0,
    speedXP: 0,
    difficultyXP: 0,
    accuracyBonus: 0,
    streakBonus: 0,
  };

  let correctCount = 0;

  for (const review of reviews) {
    const result = calculateReviewXP(
      review.rating,
      review.isNewCard,
      combo,
      review.durationMs,
      review.cardDifficulty,
      config
    );

    breakdown.baseXP += result.xp.base;
    breakdown.newCardXP += result.xp.newCardBonus;
    breakdown.comboXP += result.xp.comboBonus;
    breakdown.speedXP += result.xp.speedBonus;
    breakdown.difficultyXP += result.xp.difficultyBonus;

    combo = result.newCombo;
    bestCombo = Math.max(bestCombo, combo);
    totalDurationMs += review.durationMs;

    if (review.rating > 1) {
      correctCount++;
    }
  }

  const accuracy = reviews.length > 0 ? (correctCount / reviews.length) * 100 : 0;

  // Accuracy bonus (extra 10% XP for 90%+ accuracy)
  if (accuracy >= 90) {
    const baseTotal = breakdown.baseXP + breakdown.newCardXP + breakdown.comboXP +
                      breakdown.speedXP + breakdown.difficultyXP;
    breakdown.accuracyBonus = Math.floor(baseTotal * 0.1);
  }

  // Streak bonus (extra 5% per 7-day streak, max 25%)
  const streakMultiplier = Math.min(0.25, Math.floor(currentStreak / 7) * 0.05);
  if (streakMultiplier > 0) {
    const baseTotal = breakdown.baseXP + breakdown.newCardXP + breakdown.comboXP +
                      breakdown.speedXP + breakdown.difficultyXP + breakdown.accuracyBonus;
    breakdown.streakBonus = Math.floor(baseTotal * streakMultiplier);
  }

  const totalXP = breakdown.baseXP + breakdown.newCardXP + breakdown.comboXP +
                  breakdown.speedXP + breakdown.difficultyXP + breakdown.accuracyBonus +
                  breakdown.streakBonus;

  return {
    totalXP,
    breakdown,
    cardsReviewed: reviews.length,
    correctCount,
    accuracy,
    bestCombo,
    avgTimeMs: reviews.length > 0 ? totalDurationMs / reviews.length : 0,
  };
}

// ============================================================================
// Streak Functions
// ============================================================================

/**
 * Check and update streak status for a user
 */
export function calculateStreakStatus(
  currentStreak: number,
  longestStreak: number,
  lastStudyDate: string | null,
  xpEarnedToday: number,
  dailyGoal: number = DAILY_XP_GOAL,
  freezesAvailable: number = 1,
  freezesUsed: number = 0
): StreakStatus {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let isActive = false;
  let effectiveStreak = currentStreak;

  if (lastStudyDate === today) {
    // Studied today - streak is active
    isActive = xpEarnedToday >= STREAK_XP_THRESHOLD;
    effectiveStreak = currentStreak;
  } else if (lastStudyDate === yesterday) {
    // Didn't study yet today, but studied yesterday - streak continues if they study
    isActive = false;
    effectiveStreak = currentStreak;
  } else if (lastStudyDate) {
    // Missed at least one day
    const daysMissed = Math.floor(
      (new Date(today).getTime() - new Date(lastStudyDate).getTime()) / 86400000
    );

    if (daysMissed <= freezesAvailable - freezesUsed) {
      // Can use freeze(s)
      effectiveStreak = currentStreak;
      isActive = false;
    } else {
      // Streak is broken
      effectiveStreak = 0;
      isActive = false;
    }
  }

  return {
    current: effectiveStreak,
    longest: Math.max(longestStreak, effectiveStreak),
    isActive,
    xpEarnedToday,
    dailyGoal,
    goalMet: xpEarnedToday >= dailyGoal,
    freezesAvailable,
    freezesUsed,
    lastStudyDate,
  };
}

/**
 * Update streak after a study session
 */
export function updateStreakAfterSession(
  currentStreak: number,
  longestStreak: number,
  lastStudyDate: string | null,
  xpEarnedInSession: number,
  previousDailyXP: number
): {
  newStreak: number;
  newLongestStreak: number;
  streakIncreased: boolean;
  freezeUsed: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const totalDailyXP = previousDailyXP + xpEarnedInSession;

  let newStreak = currentStreak;
  let streakIncreased = false;
  let freezeUsed = false;

  // Only increment streak if we've met the XP threshold and haven't already today
  if (totalDailyXP >= STREAK_XP_THRESHOLD && previousDailyXP < STREAK_XP_THRESHOLD) {
    if (lastStudyDate === null || lastStudyDate === today) {
      // First study ever or already studied today - just met threshold
      newStreak = currentStreak + 1;
      streakIncreased = true;
    } else if (lastStudyDate === yesterday) {
      // Continuing streak from yesterday
      newStreak = currentStreak + 1;
      streakIncreased = true;
    } else {
      // Streak was broken, but we check for freeze
      const daysMissed = Math.floor(
        (new Date(today).getTime() - new Date(lastStudyDate).getTime()) / 86400000
      );
      if (daysMissed === 2) {
        // Missed one day, can use freeze
        newStreak = currentStreak + 1;
        streakIncreased = true;
        freezeUsed = true;
      } else {
        // Streak broken, start fresh
        newStreak = 1;
        streakIncreased = true;
      }
    }
  }

  return {
    newStreak,
    newLongestStreak: Math.max(longestStreak, newStreak),
    streakIncreased,
    freezeUsed,
  };
}

// ============================================================================
// League Functions
// ============================================================================

/**
 * Get league tier by ID
 */
export function getLeagueTier(tierId: number): LeagueTier {
  return LEAGUE_TIERS.find(t => t.id === tierId) || LEAGUE_TIERS[0];
}

/**
 * Calculate league status for a user
 */
export function calculateLeagueStatus(
  userWeeklyXP: number,
  userRank: number,
  cohortSize: number,
  currentTier: number
): LeagueStatus {
  const tier = getLeagueTier(currentTier);
  const nextTier = currentTier < 5 ? getLeagueTier(currentTier + 1) : null;

  // Assume we have XP thresholds for promotion/demotion zones
  const isInPromotionZone = userRank <= tier.promotionZone;
  const isInDemotionZone = tier.demotionZone > 0 && userRank > cohortSize - tier.demotionZone;

  // Estimate XP needed for promotion (simplified - in reality would need cohort data)
  const promotionDistance = isInPromotionZone ? 0 : Math.max(0, (tier.promotionZone * 100) - userWeeklyXP);
  const demotionDistance = isInDemotionZone ? 0 : userWeeklyXP;

  return {
    tier,
    rank: userRank,
    totalInCohort: cohortSize,
    weeklyXP: userWeeklyXP,
    promotionDistance,
    demotionDistance,
    isInPromotionZone,
    isInDemotionZone,
  };
}

/**
 * Determine if a user should be promoted or demoted at week end
 */
export function calculateLeagueTransition(
  currentTier: number,
  finalRank: number,
  cohortSize: number
): { newTier: number; promoted: boolean; demoted: boolean } {
  const tier = getLeagueTier(currentTier);

  if (finalRank <= tier.promotionZone && currentTier < 5) {
    return { newTier: currentTier + 1, promoted: true, demoted: false };
  }

  if (tier.demotionZone > 0 && finalRank > cohortSize - tier.demotionZone && currentTier > 1) {
    return { newTier: currentTier - 1, promoted: false, demoted: true };
  }

  return { newTier: currentTier, promoted: false, demoted: false };
}

// ============================================================================
// Achievement Checking
// ============================================================================

export interface AchievementCheck {
  id: string;
  name: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

/**
 * Check progress towards streak achievements
 */
export function checkStreakAchievements(currentStreak: number): AchievementCheck[] {
  const streakMilestones = [
    { id: 'streak_7', name: 'Week Warrior', target: 7 },
    { id: 'streak_30', name: 'Monthly Master', target: 30 },
    { id: 'streak_100', name: 'Century Scholar', target: 100 },
    { id: 'streak_365', name: 'Year of Dedication', target: 365 },
  ];

  return streakMilestones.map(milestone => ({
    id: milestone.id,
    name: milestone.name,
    unlocked: currentStreak >= milestone.target,
    progress: Math.min(currentStreak, milestone.target),
    target: milestone.target,
  }));
}

/**
 * Check progress towards review count achievements
 */
export function checkReviewAchievements(totalReviews: number): AchievementCheck[] {
  const reviewMilestones = [
    { id: 'reviews_100', name: 'Getting Started', target: 100 },
    { id: 'reviews_1000', name: 'Thousand Cards', target: 1000 },
    { id: 'reviews_10000', name: 'Ten Thousand', target: 10000 },
    { id: 'reviews_100000', name: 'Memory Master', target: 100000 },
  ];

  return reviewMilestones.map(milestone => ({
    id: milestone.id,
    name: milestone.name,
    unlocked: totalReviews >= milestone.target,
    progress: Math.min(totalReviews, milestone.target),
    target: milestone.target,
  }));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format XP number with abbreviation
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

/**
 * Get XP level from total XP (logarithmic scaling)
 */
export function getLevel(totalXP: number): { level: number; xpForCurrentLevel: number; xpForNextLevel: number; progress: number } {
  // Level formula: level = floor(sqrt(totalXP / 100))
  // XP for level N: N^2 * 100
  const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)));
  const xpForCurrentLevel = level * level * 100;
  const xpForNextLevel = (level + 1) * (level + 1) * 100;
  const progress = (totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);

  return { level, xpForCurrentLevel, xpForNextLevel, progress };
}

/**
 * Get motivational message based on performance
 */
export function getMotivationalMessage(accuracy: number, streak: number, xpEarned: number): string {
  if (accuracy >= 95 && streak >= 7) {
    return "Phenomenal! Your consistency is paying off!";
  }
  if (accuracy >= 90) {
    return "Excellent work! You're mastering this material.";
  }
  if (accuracy >= 80) {
    return "Great session! Keep pushing forward.";
  }
  if (streak >= 3) {
    return `${streak} day streak! Don't break the chain.`;
  }
  if (xpEarned >= 100) {
    return "Solid effort! Every review counts.";
  }
  return "Progress is progress. Come back tomorrow!";
}

export default {
  calculateReviewXP,
  calculateSessionXP,
  calculateStreakStatus,
  updateStreakAfterSession,
  calculateLeagueStatus,
  calculateLeagueTransition,
  getLeagueTier,
  checkStreakAchievements,
  checkReviewAchievements,
  formatXP,
  getLevel,
  getMotivationalMessage,
  LEAGUE_TIERS,
  DAILY_XP_GOAL,
  STREAK_XP_THRESHOLD,
  DEFAULT_XP_CONFIG,
};
