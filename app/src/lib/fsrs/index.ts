/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Based on FSRS v4/v5 algorithm specifications
 *
 * DSR Model:
 * - D (Difficulty): 1-10 scale, inherent difficulty of the card
 * - S (Stability): Days until R drops to 90%
 * - R (Retrievability): Probability of recall at time t
 */

// FSRS Parameters (default weights, can be personalized via optimization)
export const DEFAULT_PARAMS = {
  w: [
    0.4, // w0: initial stability for "Again"
    0.6, // w1: initial stability for "Hard"
    2.4, // w2: initial stability for "Good"
    5.8, // w3: initial stability for "Easy"
    4.93, // w4: difficulty weight
    0.94, // w5: difficulty decay
    0.86, // w6: stability growth for "Hard"
    0.01, // w7: stability decay for failure
    1.49, // w8: stability growth for "Good"
    0.14, // w9: difficulty adjustment after failure
    0.94, // w10: hard penalty
    2.18, // w11: easy bonus
    0.05, // w12: short-term stability modifier
    0.34, // w13: long-term stability modifier
    1.26, // w14: stability increase after lapse
    0.29, // w15: difficulty mean reversion
    2.61, // w16: stability ceiling factor
  ],
  requestRetention: 0.9, // Target retention (90%)
  maximumInterval: 36500, // 100 years max
  decay: -0.5, // Power law decay constant
  factor: Math.pow(0.9, 1 / -0.5) - 1, // ~19/81
};

export interface FSRSCard {
  difficulty: number; // 1-10
  stability: number; // days
  retrievability: number; // 0-1
  due: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
  state: FSRSCard['state'];
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: Date;
  duration: number; // milliseconds
}

export type Rating = 1 | 2 | 3 | 4;

/**
 * Calculate retrievability using power law forgetting curve
 * R(t) = (1 + factor * t / S) ^ decay
 */
export function calculateRetrievability(
  elapsedDays: number,
  stability: number,
  decay = DEFAULT_PARAMS.decay,
  factor = DEFAULT_PARAMS.factor
): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (factor * elapsedDays) / stability, decay);
}

/**
 * Calculate the interval needed to achieve target retention
 * Derived from R(t) formula, solving for t
 */
export function calculateInterval(
  stability: number,
  requestRetention: number = DEFAULT_PARAMS.requestRetention,
  decay = DEFAULT_PARAMS.decay,
  factor = DEFAULT_PARAMS.factor
): number {
  const interval = (stability / factor) * (Math.pow(requestRetention, 1 / decay) - 1);
  return Math.max(1, Math.min(Math.round(interval), DEFAULT_PARAMS.maximumInterval));
}

/**
 * Calculate initial difficulty for a new card
 */
export function initDifficulty(rating: Rating, w = DEFAULT_PARAMS.w): number {
  const d = w[4] - (rating - 3) * w[5];
  return clampDifficulty(d);
}

/**
 * Calculate initial stability for a new card based on rating
 */
export function initStability(rating: Rating, w = DEFAULT_PARAMS.w): number {
  return Math.max(0.1, w[rating - 1]);
}

/**
 * Update difficulty after a review
 */
export function nextDifficulty(
  d: number,
  rating: Rating,
  w = DEFAULT_PARAMS.w
): number {
  const deltaDifficulty = -w[6] * (rating - 3);
  const meanReversion = w[7] * (w[4] - d);
  return clampDifficulty(d + deltaDifficulty + meanReversion);
}

/**
 * Calculate next stability after a successful recall (rating >= 2)
 */
export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w = DEFAULT_PARAMS.w
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  return s * (
    1 +
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hardPenalty *
    easyBonus
  );
}

/**
 * Calculate next stability after a lapse (rating = 1)
 */
export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  w = DEFAULT_PARAMS.w
): number {
  return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]);
}

/**
 * Clamp difficulty to valid range [1, 10]
 */
function clampDifficulty(d: number): number {
  return Math.max(1, Math.min(10, d));
}

/**
 * Full FSRS scheduler - process a review and get next card state
 */
export function scheduleReview(
  card: FSRSCard,
  rating: Rating,
  reviewDate: Date = new Date(),
  w = DEFAULT_PARAMS.w
): { card: FSRSCard; log: Partial<ReviewLog> } {
  const now = reviewDate;
  const elapsedDays = card.lastReview
    ? Math.max(0, (now.getTime() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  let newStability: number;
  let newDifficulty: number;
  let newState: FSRSCard['state'];
  let newLapses = card.lapses;
  let newReps = card.reps + 1;

  if (card.state === 'new') {
    // First review - initialize card
    newDifficulty = initDifficulty(rating, w);
    newStability = initStability(rating, w);
    newState = rating === 1 ? 'learning' : 'review';
    if (rating === 1) newLapses++;
  } else {
    // Subsequent review
    const r = calculateRetrievability(elapsedDays, card.stability);
    newDifficulty = nextDifficulty(card.difficulty, rating, w);

    if (rating === 1) {
      // Lapse - forgot the card
      newStability = nextForgetStability(card.difficulty, card.stability, r, w);
      newState = 'relearning';
      newLapses++;
    } else {
      // Successful recall
      newStability = nextRecallStability(card.difficulty, card.stability, r, rating, w);
      newState = 'review';
    }
  }

  const scheduledDays = calculateInterval(newStability);
  const newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
  const newRetrievability = calculateRetrievability(0, newStability);

  const newCard: FSRSCard = {
    difficulty: newDifficulty,
    stability: newStability,
    retrievability: newRetrievability,
    due: newDue,
    lastReview: now,
    reps: newReps,
    lapses: newLapses,
    state: newState,
  };

  const log: Partial<ReviewLog> = {
    cardId: '', // To be filled by caller
    rating,
    state: card.state,
    due: card.due,
    stability: newStability,
    difficulty: newDifficulty,
    elapsedDays,
    scheduledDays,
    review: now,
  };

  return { card: newCard, log };
}

/**
 * Get next review intervals for all ratings (preview)
 */
export function getNextIntervals(card: FSRSCard): Record<Rating, number> {
  const intervals: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const rating of [1, 2, 3, 4] as Rating[]) {
    const { card: nextCard } = scheduleReview(card, rating);
    intervals[rating] = calculateInterval(nextCard.stability);
  }

  return intervals;
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60);
    return minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 60)}h`;
  }
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/**
 * Create a new FSRS card
 */
export function createNewCard(): FSRSCard {
  return {
    difficulty: 5, // Default middle difficulty
    stability: 0,
    retrievability: 0,
    due: new Date(),
    lastReview: undefined,
    reps: 0,
    lapses: 0,
    state: 'new',
  };
}

/**
 * Simulate forgetting curve data points for visualization
 */
export function generateForgettingCurve(
  stability: number,
  days: number = 30,
  points: number = 100
): { day: number; retention: number }[] {
  const data: { day: number; retention: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const day = (i / points) * days;
    const retention = calculateRetrievability(day, stability) * 100;
    data.push({ day, retention });
  }

  return data;
}

/**
 * Calculate average retrievability across all cards
 */
export function calculateAverageRetrievability(
  cards: FSRSCard[],
  now: Date = new Date()
): number {
  if (cards.length === 0) return 0;

  let totalR = 0;
  for (const card of cards) {
    if (card.state === 'new') {
      totalR += 0; // New cards have 0 retrievability
    } else if (card.lastReview) {
      const elapsedDays = (now.getTime() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24);
      totalR += calculateRetrievability(elapsedDays, card.stability);
    }
  }

  return totalR / cards.length;
}

/**
 * Calculate true retention from review logs
 */
export function calculateTrueRetention(logs: ReviewLog[]): number {
  // Filter to only "review" state cards (mature cards)
  const reviewLogs = logs.filter(log => log.state === 'review');
  if (reviewLogs.length === 0) return 0;

  const passed = reviewLogs.filter(log => log.rating > 1).length;
  return passed / reviewLogs.length;
}

/**
 * Group reviews by hour of day
 */
export function getHourlyBreakdown(
  logs: ReviewLog[]
): { hour: number; count: number; retention: number }[] {
  const hourlyData: { [hour: number]: { total: number; passed: number } } = {};

  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { total: 0, passed: 0 };
  }

  for (const log of logs) {
    const hour = new Date(log.review).getHours();
    hourlyData[hour].total++;
    if (log.rating > 1) hourlyData[hour].passed++;
  }

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    count: data.total,
    retention: data.total > 0 ? (data.passed / data.total) * 100 : 0,
  }));
}

/**
 * Simulate future workload using FSRS predictions
 */
export function simulateFutureWorkload(
  cards: FSRSCard[],
  days: number = 30,
  now: Date = new Date()
): { date: string; newCards: number; reviews: number; total: number }[] {
  const workload: { [date: string]: { newCards: number; reviews: number } } = {};

  // Initialize all days
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    workload[dateStr] = { newCards: 0, reviews: 0 };
  }

  // Count cards due on each day
  for (const card of cards) {
    const dueDate = new Date(card.due);
    const dateStr = dueDate.toISOString().split('T')[0];

    if (workload[dateStr]) {
      if (card.state === 'new') {
        workload[dateStr].newCards++;
      } else {
        workload[dateStr].reviews++;
      }
    }
  }

  return Object.entries(workload).map(([date, data]) => ({
    date,
    newCards: data.newCards,
    reviews: data.reviews,
    total: data.newCards + data.reviews,
  }));
}

export default {
  calculateRetrievability,
  calculateInterval,
  scheduleReview,
  getNextIntervals,
  formatInterval,
  createNewCard,
  generateForgettingCurve,
  calculateAverageRetrievability,
  calculateTrueRetention,
  getHourlyBreakdown,
  simulateFutureWorkload,
  DEFAULT_PARAMS,
};
