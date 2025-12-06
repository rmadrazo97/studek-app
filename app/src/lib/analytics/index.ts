/**
 * Analytics Service
 *
 * This module provides analytics data processing and aggregation
 * following the "Lambda Architecture" pattern:
 * - Historical Layer: Pre-computed materialized data
 * - Real-Time Layer: Today's data computed on demand
 *
 * In production, this would interface with PostgreSQL materialized views.
 * Currently uses mock data that simulates realistic patterns.
 */

import {
  calculateRetrievability,
  calculateTrueRetention,
  getHourlyBreakdown,
  simulateFutureWorkload,
  calculateAverageRetrievability,
  FSRSCard,
  ReviewLog,
} from '@/lib/fsrs';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DailyAnalytics {
  date: string;
  totalReviews: number;
  lapses: number;
  avgTimeMs: number;
  retentionRate: number;
  newCards: number;
  matureReviews: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  freezesAvailable: number;
  freezesUsed: number;
}

export interface RetentionMetrics {
  trueRetention: number;
  desiredRetention: number;
  avgRetrievability: number;
  avgStability: number;
  avgDifficulty: number;
  trend: number; // % change from previous period
  historyData: number[]; // Last 30 days
}

export interface HourlyStats {
  hour: number;
  count: number;
  retention: number;
}

export interface FutureWorkload {
  date: string;
  newCards: number;
  reviews: number;
  total: number;
  backlog: number; // Accumulated if not studied
}

export interface CardStats {
  total: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
  mature: number; // stability >= 21 days
  young: number;
  suspended: number;
  leeches: number; // Cards with high lapses
}

export interface DeckStats {
  id: string;
  name: string;
  cards: CardStats;
  dueToday: number;
  retention: number;
  lastStudied?: Date;
}

export interface AnalyticsSummary {
  streak: StreakData;
  retention: RetentionMetrics;
  cards: CardStats;
  todayStats: {
    reviewed: number;
    correct: number;
    timeSpent: number; // minutes
    newLearned: number;
  };
  weekStats: {
    totalReviews: number;
    avgRetention: number;
    avgTimePerDay: number;
    activeDays: number;
  };
}

export interface ForgettingCurvePoint {
  day: number;
  retention: number;
}

// ============================================================================
// Mock Data Generation
// ============================================================================

/**
 * Generate realistic mock heatmap data
 * Simulates a user with varying activity levels
 */
export function generateMockHeatmapData(days: number = 365): DailyAnalytics[] {
  const data: DailyAnalytics[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simulate varying activity patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base probability of studying
    let studyProb = isWeekend ? 0.6 : 0.85;

    // Add some randomness for vacations/breaks
    const weekNumber = Math.floor(i / 7);
    if (weekNumber % 8 === 0) studyProb *= 0.3; // Vacation week

    const didStudy = Math.random() < studyProb;

    if (didStudy) {
      // Generate realistic review counts
      const baseReviews = isWeekend ? 30 : 50;
      const variance = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
      const totalReviews = Math.floor(baseReviews * variance);

      // Retention typically between 85-97%
      const retentionRate = 0.85 + Math.random() * 0.12;
      const lapses = Math.floor(totalReviews * (1 - retentionRate));

      data.push({
        date: dateStr,
        totalReviews,
        lapses,
        avgTimeMs: 3000 + Math.random() * 2000,
        retentionRate,
        newCards: Math.floor(Math.random() * 10),
        matureReviews: Math.floor(totalReviews * 0.7),
      });
    } else {
      data.push({
        date: dateStr,
        totalReviews: 0,
        lapses: 0,
        avgTimeMs: 0,
        retentionRate: 0,
        newCards: 0,
        matureReviews: 0,
      });
    }
  }

  return data;
}

/**
 * Generate mock review logs for detailed analytics
 */
export function generateMockReviewLogs(count: number = 1000): ReviewLog[] {
  const logs: ReviewLog[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.random() * 90; // Last 90 days
    const reviewDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Weighted random rating (most cards are "Good")
    const ratingRoll = Math.random();
    let rating: 1 | 2 | 3 | 4;
    if (ratingRoll < 0.08) rating = 1;
    else if (ratingRoll < 0.18) rating = 2;
    else if (ratingRoll < 0.85) rating = 3;
    else rating = 4;

    const state: FSRSCard['state'] = Math.random() < 0.7 ? 'review' : 'learning';

    logs.push({
      id: `log_${i}`,
      cardId: `card_${Math.floor(Math.random() * 500)}`,
      rating,
      state,
      due: reviewDate,
      stability: Math.random() * 100 + 5,
      difficulty: Math.random() * 4 + 3, // 3-7 range
      elapsedDays: Math.random() * 30,
      lastElapsedDays: Math.random() * 20,
      scheduledDays: Math.random() * 60 + 1,
      review: reviewDate,
      duration: Math.floor(Math.random() * 8000 + 2000),
    });
  }

  return logs.sort((a, b) => b.review.getTime() - a.review.getTime());
}

/**
 * Generate mock cards
 */
export function generateMockCards(count: number = 500): FSRSCard[] {
  const cards: FSRSCard[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Distribution: 10% new, 20% learning, 70% review
    const roll = Math.random();
    let state: FSRSCard['state'];
    let stability: number;
    let reps: number;

    if (roll < 0.1) {
      state = 'new';
      stability = 0;
      reps = 0;
    } else if (roll < 0.3) {
      state = 'learning';
      stability = Math.random() * 20 + 1;
      reps = Math.floor(Math.random() * 5) + 1;
    } else {
      state = 'review';
      stability = Math.random() * 200 + 21;
      reps = Math.floor(Math.random() * 20) + 5;
    }

    const difficulty = Math.random() * 4 + 3;
    const daysUntilDue = Math.random() * 14 - 2; // Some overdue
    const dueDate = new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

    cards.push({
      difficulty,
      stability,
      retrievability: calculateRetrievability(Math.max(0, -daysUntilDue), stability),
      due: dueDate,
      lastReview: state !== 'new' ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      reps,
      lapses: Math.floor(reps * 0.15),
      state,
    });
  }

  return cards;
}

// ============================================================================
// Analytics Calculations
// ============================================================================

/**
 * Calculate streak from daily analytics
 */
export function calculateStreak(dailyData: DailyAnalytics[]): StreakData {
  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let lastActiveDate = '';

  // Sort by date descending
  const sorted = [...dailyData].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Find current streak (from today backwards)
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].date === checkDate && sorted[i].totalReviews > 0) {
      current++;
      lastActiveDate = sorted[i].date;
      // Move to previous day
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else if (sorted[i].date === checkDate) {
      // Day with no reviews - streak broken (unless it's today)
      if (i > 0) break;
      // If today has no reviews yet, check yesterday
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
      i--; // Re-check this entry
    }
  }

  // Find longest streak
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].totalReviews > 0) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    current,
    longest,
    lastActiveDate: lastActiveDate || today,
    freezesAvailable: 3,
    freezesUsed: 0,
  };
}

/**
 * Calculate retention metrics from logs and cards
 */
export function calculateRetentionMetrics(
  logs: ReviewLog[],
  cards: FSRSCard[],
  desiredRetention: number = 0.9
): RetentionMetrics {
  const trueRetention = calculateTrueRetention(logs);
  const avgRetrievability = calculateAverageRetrievability(cards);

  // Calculate averages from cards
  const reviewCards = cards.filter(c => c.state === 'review');
  const avgStability = reviewCards.length > 0
    ? reviewCards.reduce((sum, c) => sum + c.stability, 0) / reviewCards.length
    : 0;
  const avgDifficulty = reviewCards.length > 0
    ? reviewCards.reduce((sum, c) => sum + c.difficulty, 0) / reviewCards.length
    : 5;

  // Generate history data (last 30 days retention)
  const historyData: number[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayLogs = logs.filter(
      l => l.review >= dayStart && l.review <= dayEnd && l.state === 'review'
    );

    if (dayLogs.length > 0) {
      const dayRetention = dayLogs.filter(l => l.rating > 1).length / dayLogs.length;
      historyData.push(dayRetention * 100);
    } else {
      // Use interpolated value or previous
      historyData.push(historyData.length > 0 ? historyData[historyData.length - 1] : 90);
    }
  }

  // Calculate trend (compare last 7 days to previous 7)
  const recent = historyData.slice(-7);
  const previous = historyData.slice(-14, -7);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
  const trend = recentAvg - prevAvg;

  return {
    trueRetention: trueRetention * 100,
    desiredRetention: desiredRetention * 100,
    avgRetrievability: avgRetrievability * 100,
    avgStability,
    avgDifficulty,
    trend,
    historyData,
  };
}

/**
 * Calculate card statistics
 */
export function calculateCardStats(cards: FSRSCard[]): CardStats {
  const stats: CardStats = {
    total: cards.length,
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    mature: 0,
    young: 0,
    suspended: 0,
    leeches: 0,
  };

  for (const card of cards) {
    switch (card.state) {
      case 'new': stats.new++; break;
      case 'learning': stats.learning++; break;
      case 'review': stats.review++; break;
      case 'relearning': stats.relearning++; break;
    }

    if (card.stability >= 21) {
      stats.mature++;
    } else if (card.state !== 'new') {
      stats.young++;
    }

    if (card.lapses >= 8) {
      stats.leeches++;
    }
  }

  return stats;
}

/**
 * Get complete analytics summary
 */
export function getAnalyticsSummary(
  dailyData: DailyAnalytics[],
  logs: ReviewLog[],
  cards: FSRSCard[],
  desiredRetention: number = 0.9
): AnalyticsSummary {
  const streak = calculateStreak(dailyData);
  const retention = calculateRetentionMetrics(logs, cards, desiredRetention);
  const cardStats = calculateCardStats(cards);

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyData.find(d => d.date === today);
  const todayLogs = logs.filter(l =>
    l.review.toISOString().split('T')[0] === today
  );

  const todayStats = {
    reviewed: todayData?.totalReviews || 0,
    correct: todayLogs.filter(l => l.rating > 1).length,
    timeSpent: Math.round(todayLogs.reduce((sum, l) => sum + l.duration, 0) / 60000),
    newLearned: todayData?.newCards || 0,
  };

  // Week stats
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekDates.push(d.toISOString().split('T')[0]);
  }
  const weekData = dailyData.filter(d => weekDates.includes(d.date));
  const activeDays = weekData.filter(d => d.totalReviews > 0).length;

  const weekStats = {
    totalReviews: weekData.reduce((sum, d) => sum + d.totalReviews, 0),
    avgRetention: weekData.filter(d => d.retentionRate > 0).length > 0
      ? weekData.filter(d => d.retentionRate > 0).reduce((sum, d) => sum + d.retentionRate, 0) /
        weekData.filter(d => d.retentionRate > 0).length * 100
      : 0,
    avgTimePerDay: Math.round(
      weekData.reduce((sum, d) => sum + (d.avgTimeMs * d.totalReviews), 0) /
      Math.max(activeDays, 1) / 60000
    ),
    activeDays,
  };

  return {
    streak,
    retention,
    cards: cardStats,
    todayStats,
    weekStats,
  };
}

/**
 * Get heatmap data in the format needed by the component
 * Returns array of { date: 'YYYY-MM-DD', count: N, level: 0-4 }
 */
export function getHeatmapData(
  dailyData: DailyAnalytics[],
  weeks: number = 52
): { date: string; count: number; level: number }[] {
  const days = weeks * 7;
  const now = new Date();
  const result: { date: string; count: number; level: number }[] = [];

  // Find max for quantization
  const maxCount = Math.max(...dailyData.map(d => d.totalReviews), 1);
  const p90 = dailyData
    .map(d => d.totalReviews)
    .sort((a, b) => a - b)
    [Math.floor(dailyData.length * 0.9)] || maxCount;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayData = dailyData.find(d => d.date === dateStr);
    const count = dayData?.totalReviews || 0;

    // Quantize to 0-4 levels using p90 as max
    let level = 0;
    if (count > 0) {
      const ratio = count / p90;
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
 * Get workload forecast with accumulating backlog
 */
export function getWorkloadForecast(
  cards: FSRSCard[],
  days: number = 30
): FutureWorkload[] {
  const workload = simulateFutureWorkload(cards, days);

  // Add backlog accumulation
  let backlog = 0;
  return workload.map(day => {
    backlog += day.total;
    return { ...day, backlog };
  });
}

// ============================================================================
// Export Singleton Service
// ============================================================================

class AnalyticsService {
  private dailyData: DailyAnalytics[];
  private logs: ReviewLog[];
  private cards: FSRSCard[];

  constructor() {
    // Initialize with mock data
    this.dailyData = generateMockHeatmapData(365);
    this.logs = generateMockReviewLogs(2000);
    this.cards = generateMockCards(800);
  }

  getSummary(desiredRetention: number = 0.9): AnalyticsSummary {
    return getAnalyticsSummary(this.dailyData, this.logs, this.cards, desiredRetention);
  }

  getHeatmap(weeks: number = 52) {
    return getHeatmapData(this.dailyData, weeks);
  }

  getHourlyStats() {
    return getHourlyBreakdown(this.logs);
  }

  getWorkloadForecast(days: number = 30) {
    return getWorkloadForecast(this.cards, days);
  }

  getRetentionHistory() {
    return calculateRetentionMetrics(this.logs, this.cards).historyData;
  }

  // For demonstration - refresh mock data
  refreshData() {
    this.dailyData = generateMockHeatmapData(365);
    this.logs = generateMockReviewLogs(2000);
    this.cards = generateMockCards(800);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
