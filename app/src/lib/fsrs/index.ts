/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Based on FSRS v4/v5 algorithm specifications
 *
 * DSR Model:
 * - D (Difficulty): 1-10 scale, inherent difficulty of the card
 * - S (Stability): Days until R drops to 90%
 * - R (Retrievability): Probability of recall at time t
 */

// FSRS v5 Parameters (19 weights, can be personalized via optimization)
// Based on analysis of millions of reviews from the open spaced repetition community
export const DEFAULT_PARAMS = {
  w: [
    0.4072,  // w0: initial stability for "Again"
    1.1829,  // w1: initial stability for "Hard"
    3.1262,  // w2: initial stability for "Good"
    15.4722, // w3: initial stability for "Easy"
    7.2102,  // w4: initial difficulty baseline
    0.5316,  // w5: initial difficulty spread based on grade
    1.0651,  // w6: difficulty update rate
    0.0234,  // w7: difficulty mean reversion rate
    1.6160,  // w8: stability increase base factor (e^w8)
    0.1544,  // w9: stability saturation exponent
    1.0070,  // w10: retrievability gain factor (desirable difficulty)
    1.9395,  // w11: stability lapse scaling factor
    0.1100,  // w12: difficulty impact on lapse stability
    0.2939,  // w13: previous stability impact on lapse
    2.2697,  // w14: retrievability impact on lapse stability
    0.2315,  // w15: "Hard" penalty multiplier
    2.9898,  // w16: "Easy" bonus multiplier
    0.5100,  // w17: (v6) short-term stability scaling
    0.6000,  // w18: (v6) short-term curve shape
  ],
  requestRetention: 0.9, // Target retention (90%)
  maximumInterval: 36500, // 100 years max
  decay: -0.5, // Power law decay constant C
  factor: 19 / 81, // F = (0.9^(1/-0.5) - 1) ≈ 19/81 ≈ 0.2345

  // Learning steps configuration
  learningSteps: [1, 10], // minutes: 1m → 10m → graduate
  relearningSteps: [10], // minutes: 10m → back to review
  graduatingInterval: 1, // days after final learning step
  easyInterval: 4, // days for "Easy" on new card

  // Fuzzing configuration
  enableFuzz: true,
  fuzzFactor: 0.05, // ±5% variance (spec recommends 2.5%, we use 5% for better distribution)

  // Same-day review handling
  enableShortTerm: false, // Enable v6 short-term scheduling (experimental)
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
  // Learning steps tracking
  step: number; // Current learning step index (0-based)
  // For same-day review tracking
  elapsedDays: number; // Days since last review
  scheduledDays: number; // Scheduled interval in days
}

export interface FSRSParams {
  w: number[];
  requestRetention: number;
  maximumInterval: number;
  decay: number;
  factor: number;
  learningSteps: number[];
  relearningSteps: number[];
  graduatingInterval: number;
  easyInterval: number;
  enableFuzz: boolean;
  fuzzFactor: number;
  enableShortTerm: boolean;
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

// ============================================================================
// Interval Fuzzing (Prevents Review Clumping)
// ============================================================================

/**
 * Apply fuzzing to an interval to prevent cards from clumping on the same day.
 * Uses a deterministic seed based on card properties for reproducibility.
 */
export function fuzzInterval(
  interval: number,
  seed: number = Date.now(),
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): number {
  if (!params.enableFuzz || interval < 3) {
    return interval;
  }

  // Calculate fuzz range based on interval length
  const fuzzDays = Math.max(1, Math.round(interval * params.fuzzFactor));
  const minInterval = Math.max(2, interval - fuzzDays);
  const maxInterval = interval + fuzzDays;

  // Use seeded random for reproducibility
  const random = seededRandom(seed);
  const fuzzedInterval = Math.round(minInterval + random * (maxInterval - minInterval));

  return Math.max(1, Math.min(fuzzedInterval, params.maximumInterval));
}

/**
 * Simple seeded random number generator (Mulberry32)
 */
function seededRandom(seed: number): number {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Get fuzz range for an interval (for UI display)
 */
export function getFuzzRange(
  interval: number,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): { min: number; max: number } {
  if (!params.enableFuzz || interval < 3) {
    return { min: interval, max: interval };
  }
  const fuzzDays = Math.max(1, Math.round(interval * params.fuzzFactor));
  return {
    min: Math.max(2, interval - fuzzDays),
    max: Math.min(interval + fuzzDays, params.maximumInterval),
  };
}

// ============================================================================
// Learning Steps System
// ============================================================================

/**
 * Get the interval (in minutes) for a learning step
 */
export function getLearningStepInterval(
  step: number,
  isRelearning: boolean,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): number {
  const steps = isRelearning ? params.relearningSteps : params.learningSteps;
  if (step < 0 || step >= steps.length) {
    return 0; // Should graduate
  }
  return steps[step];
}

/**
 * Check if card should graduate from learning to review
 */
export function shouldGraduate(
  step: number,
  isRelearning: boolean,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): boolean {
  const steps = isRelearning ? params.relearningSteps : params.learningSteps;
  return step >= steps.length;
}

/**
 * Calculate due date for a learning step (in minutes from now)
 */
export function calculateLearningDue(
  stepMinutes: number,
  fromDate: Date = new Date()
): Date {
  return new Date(fromDate.getTime() + stepMinutes * 60 * 1000);
}

// ============================================================================
// Same-Day Review Handling (FSRS v6 Experimental)
// ============================================================================

/**
 * Check if this is a same-day review (intra-day)
 */
export function isSameDayReview(lastReview: Date | undefined, now: Date = new Date()): boolean {
  if (!lastReview) return false;
  const lastDate = new Date(lastReview);
  return lastDate.toDateString() === now.toDateString();
}

/**
 * Calculate short-term stability for same-day reviews (FSRS v6)
 * This is experimental and should only be used when enableShortTerm is true
 */
export function calculateShortTermStability(
  stability: number,
  elapsedMinutes: number,
  rating: Rating,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): number {
  if (!params.enableShortTerm) {
    return stability;
  }

  const w = params.w;
  // Short-term stability uses w17 and w18
  // S' = S * (1 + w17 * (t_minutes / 1440)^w18)
  const dayFraction = elapsedMinutes / 1440; // Convert to day fraction
  const shortTermFactor = 1 + w[17] * Math.pow(dayFraction, w[18]);

  if (rating === 1) {
    // Failure - apply lapse formula with short-term adjustment
    return stability * 0.5 * shortTermFactor;
  }

  return stability * shortTermFactor;
}

// ============================================================================
// Core FSRS v5 Algorithm Functions
// ============================================================================

/**
 * Calculate retrievability using power law forgetting curve
 * R(t, S) = (1 + F * t / S)^C
 * Where F = 19/81 and C = -0.5
 */
export function calculateRetrievability(
  elapsedDays: number,
  stability: number,
  decay = DEFAULT_PARAMS.decay,
  factor = DEFAULT_PARAMS.factor
): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.pow(1 + (factor * elapsedDays) / stability, decay);
}

/**
 * Calculate the interval needed to achieve target retention
 * Derived from R(t) formula, solving for t:
 * I = (S / F) * (R^(1/C) - 1)
 */
export function calculateInterval(
  stability: number,
  requestRetention: number = DEFAULT_PARAMS.requestRetention,
  decay = DEFAULT_PARAMS.decay,
  factor = DEFAULT_PARAMS.factor,
  maxInterval = DEFAULT_PARAMS.maximumInterval
): number {
  if (stability <= 0) return 1;
  const interval = (stability / factor) * (Math.pow(requestRetention, 1 / decay) - 1);
  return Math.max(1, Math.min(Math.round(interval), maxInterval));
}

/**
 * Calculate initial difficulty for a new card (FSRS v5)
 * D0(G) = w4 - e^(w5 * (G - 1)) + 1
 * Clamped to [1, 10]
 */
export function initDifficulty(rating: Rating, w = DEFAULT_PARAMS.w): number {
  // FSRS v5 formula: D0 = w4 - e^(w5 * (G - 1)) + 1
  const d = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return clampDifficulty(d);
}

/**
 * Calculate initial stability for a new card based on rating
 * S0(G) = w[G-1]
 */
export function initStability(rating: Rating, w = DEFAULT_PARAMS.w): number {
  return Math.max(0.1, w[rating - 1]);
}

/**
 * Update difficulty after a review (FSRS v5)
 * D' = D - w6 * (G - 3)
 * Then apply mean reversion: D'' = w7 * D0(3) + (1 - w7) * D'
 */
export function nextDifficulty(
  d: number,
  rating: Rating,
  w = DEFAULT_PARAMS.w
): number {
  // Linear adjustment based on grade
  const deltaDifficulty = -w[6] * (rating - 3);
  const dNext = d + deltaDifficulty;

  // Mean reversion towards default difficulty (D0 for grade 3)
  const d0Good = initDifficulty(3, w);
  const meanReverted = w[7] * d0Good + (1 - w[7]) * dNext;

  return clampDifficulty(meanReverted);
}

/**
 * Calculate next stability after a successful recall (rating >= 2)
 * FSRS v5 formula:
 * SInc = e^w8 * (11 - D) * S^(-w9) * (e^(w10*(1-R)) - 1) * HardPenalty * EasyBonus
 * S' = S * (1 + SInc)
 */
export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w = DEFAULT_PARAMS.w
): number {
  // Hard penalty (w15) and Easy bonus (w16)
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  // Stability increase factor
  const sInc =
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hardPenalty *
    easyBonus;

  const newStability = s * (1 + sInc);

  // Ensure stability doesn't decrease for successful recalls
  return Math.max(s, newStability);
}

/**
 * Calculate next stability after a lapse (rating = 1)
 * FSRS v5 formula:
 * S' = w11 * D^(-w12) * ((S+1)^w13 - 1) * e^(w14*(1-R))
 * Clamped to be less than previous stability (logical consistency)
 */
export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  w = DEFAULT_PARAMS.w
): number {
  const newStability =
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14]);

  // Post-lapse stability should not exceed pre-lapse stability
  return Math.min(newStability, s);
}

/**
 * Clamp difficulty to valid range [1, 10]
 */
function clampDifficulty(d: number): number {
  return Math.max(1, Math.min(10, d));
}

/**
 * Scheduling result for a single rating
 */
export interface SchedulingResult {
  card: FSRSCard;
  log: Partial<ReviewLog>;
}

/**
 * Full scheduling options for all possible ratings
 */
export interface SchedulingCards {
  again: SchedulingResult;
  hard: SchedulingResult;
  good: SchedulingResult;
  easy: SchedulingResult;
}

/**
 * Full FSRS v5 scheduler - process a review and get next card state
 * Now includes learning steps, fuzzing, and same-day handling
 */
export function scheduleReview(
  card: FSRSCard,
  rating: Rating,
  reviewDate: Date = new Date(),
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): SchedulingResult {
  const w = params.w;
  const now = reviewDate;

  // Calculate elapsed time
  const elapsedMs = card.lastReview
    ? Math.max(0, now.getTime() - card.lastReview.getTime())
    : 0;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // Check for same-day review
  const sameDayReview = isSameDayReview(card.lastReview, now);

  let newStability: number;
  let newDifficulty: number;
  let newState: FSRSCard['state'];
  let newLapses = card.lapses;
  let newStep = card.step || 0;
  let newDue: Date;
  let scheduledDays: number;
  const newReps = card.reps + 1;

  // Handle based on current state
  switch (card.state) {
    case 'new':
      // First review - initialize card
      newDifficulty = initDifficulty(rating, w);
      newStability = initStability(rating, w);

      if (rating === 1) {
        // Again on new card → enter learning
        newState = 'learning';
        newStep = 0;
        newLapses++;
        const stepMinutes = getLearningStepInterval(0, false, params);
        newDue = calculateLearningDue(stepMinutes, now);
        scheduledDays = stepMinutes / (60 * 24);
      } else if (rating === 4) {
        // Easy on new card → skip to review with easy interval
        newState = 'review';
        newStep = 0;
        scheduledDays = params.easyInterval;
        newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
      } else {
        // Hard/Good on new card → enter learning at step 0 or 1
        newState = 'learning';
        newStep = rating === 2 ? 0 : 1; // Hard stays at step 0, Good advances
        if (shouldGraduate(newStep, false, params)) {
          // Graduate immediately
          newState = 'review';
          scheduledDays = params.graduatingInterval;
          newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
        } else {
          const stepMinutes = getLearningStepInterval(newStep, false, params);
          newDue = calculateLearningDue(stepMinutes, now);
          scheduledDays = stepMinutes / (60 * 24);
        }
      }
      break;

    case 'learning':
      // In learning phase
      newDifficulty = card.difficulty || initDifficulty(3, w);
      newStability = card.stability || initStability(3, w);

      if (rating === 1) {
        // Again → reset to step 0
        newState = 'learning';
        newStep = 0;
        const stepMinutes = getLearningStepInterval(0, false, params);
        newDue = calculateLearningDue(stepMinutes, now);
        scheduledDays = stepMinutes / (60 * 24);
      } else if (rating === 4) {
        // Easy → graduate immediately
        newState = 'review';
        newStep = 0;
        scheduledDays = params.easyInterval;
        newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
      } else {
        // Hard/Good → advance step
        newStep = rating === 2 ? card.step : (card.step || 0) + 1;
        if (shouldGraduate(newStep, false, params)) {
          // Graduate to review
          newState = 'review';
          scheduledDays = params.graduatingInterval;
          newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
        } else {
          newState = 'learning';
          const stepMinutes = getLearningStepInterval(newStep, false, params);
          newDue = calculateLearningDue(stepMinutes, now);
          scheduledDays = stepMinutes / (60 * 24);
        }
      }
      break;

    case 'review':
      // Mature card - full FSRS algorithm
      const r = sameDayReview && params.enableShortTerm
        ? calculateRetrievability(elapsedMinutes / 1440, card.stability)
        : calculateRetrievability(elapsedDays, card.stability);

      newDifficulty = nextDifficulty(card.difficulty, rating, w);

      if (rating === 1) {
        // Lapse - forgot the card
        newStability = nextForgetStability(card.difficulty, card.stability, r, w);
        newState = 'relearning';
        newStep = 0;
        newLapses++;
        const stepMinutes = getLearningStepInterval(0, true, params);
        newDue = calculateLearningDue(stepMinutes, now);
        scheduledDays = stepMinutes / (60 * 24);
      } else {
        // Successful recall
        newStability = nextRecallStability(card.difficulty, card.stability, r, rating, w);
        newState = 'review';
        newStep = 0;

        // Calculate interval with optional fuzzing
        const baseInterval = calculateInterval(
          newStability,
          params.requestRetention,
          params.decay,
          params.factor,
          params.maximumInterval
        );

        // Apply fuzzing for intervals >= 3 days
        scheduledDays = params.enableFuzz
          ? fuzzInterval(baseInterval, hashCode(card.due?.toISOString() || ''), params)
          : baseInterval;

        newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
      }
      break;

    case 'relearning':
      // Relearning after lapse
      newDifficulty = card.difficulty;
      newStability = card.stability;

      if (rating === 1) {
        // Again → reset to step 0
        newState = 'relearning';
        newStep = 0;
        const stepMinutes = getLearningStepInterval(0, true, params);
        newDue = calculateLearningDue(stepMinutes, now);
        scheduledDays = stepMinutes / (60 * 24);
      } else if (rating === 4) {
        // Easy → back to review immediately
        newState = 'review';
        newStep = 0;
        scheduledDays = Math.max(1, Math.round(card.stability));
        newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
      } else {
        // Hard/Good → advance relearning step
        newStep = rating === 2 ? card.step : (card.step || 0) + 1;
        if (shouldGraduate(newStep, true, params)) {
          // Graduate back to review
          newState = 'review';
          scheduledDays = Math.max(1, Math.round(card.stability));
          newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
        } else {
          newState = 'relearning';
          const stepMinutes = getLearningStepInterval(newStep, true, params);
          newDue = calculateLearningDue(stepMinutes, now);
          scheduledDays = stepMinutes / (60 * 24);
        }
      }
      break;

    default:
      // Fallback - treat as new
      newDifficulty = initDifficulty(rating, w);
      newStability = initStability(rating, w);
      newState = 'review';
      newStep = 0;
      scheduledDays = 1;
      newDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
  }

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
    step: newStep,
    elapsedDays,
    scheduledDays,
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
 * Simple hash function for fuzzing seed
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get scheduling options for all ratings (for UI preview)
 */
export function getSchedulingCards(
  card: FSRSCard,
  reviewDate: Date = new Date(),
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): SchedulingCards {
  return {
    again: scheduleReview(card, 1, reviewDate, params),
    hard: scheduleReview(card, 2, reviewDate, params),
    good: scheduleReview(card, 3, reviewDate, params),
    easy: scheduleReview(card, 4, reviewDate, params),
  };
}

/**
 * Get next review intervals for all ratings (preview)
 * Returns intervals in days (or fractions for learning steps)
 */
export function getNextIntervals(
  card: FSRSCard,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): Record<Rating, number> {
  const intervals: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const schedulingCards = getSchedulingCards(card, new Date(), params);

  intervals[1] = schedulingCards.again.card.scheduledDays;
  intervals[2] = schedulingCards.hard.card.scheduledDays;
  intervals[3] = schedulingCards.good.card.scheduledDays;
  intervals[4] = schedulingCards.easy.card.scheduledDays;

  return intervals;
}

/**
 * Format interval for display (handles minutes, hours, days, months, years)
 */
export function formatInterval(days: number): string {
  if (days < 1 / 24) {
    // Less than an hour
    const minutes = Math.max(1, Math.round(days * 24 * 60));
    return `${minutes}m`;
  }
  if (days < 1) {
    // Less than a day
    const hours = Math.round(days * 24);
    return hours === 1 ? '1h' : `${hours}h`;
  }
  if (days < 30) {
    const d = Math.round(days);
    return d === 1 ? '1d' : `${d}d`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1mo' : `${months}mo`;
  }
  const years = days / 365;
  return years < 2 ? `${years.toFixed(1)}y` : `${Math.round(years)}y`;
}

/**
 * Format interval with range for fuzzing display
 */
export function formatIntervalRange(
  days: number,
  params: FSRSParams = DEFAULT_PARAMS as FSRSParams
): string {
  const range = getFuzzRange(days, params);
  if (range.min === range.max) {
    return formatInterval(days);
  }
  return `${formatInterval(range.min)}-${formatInterval(range.max)}`;
}

/**
 * Create a new FSRS card with all fields initialized
 */
export function createNewCard(): FSRSCard {
  return {
    difficulty: 0, // Will be set on first review
    stability: 0,
    retrievability: 0,
    due: new Date(),
    lastReview: undefined,
    reps: 0,
    lapses: 0,
    state: 'new',
    step: 0,
    elapsedDays: 0,
    scheduledDays: 0,
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

const fsrs = {
  // Core algorithm
  calculateRetrievability,
  calculateInterval,
  scheduleReview,
  getSchedulingCards,
  getNextIntervals,

  // Initialization
  initDifficulty,
  initStability,
  createNewCard,

  // Update functions
  nextDifficulty,
  nextRecallStability,
  nextForgetStability,

  // Interval fuzzing
  fuzzInterval,
  getFuzzRange,

  // Learning steps
  getLearningStepInterval,
  shouldGraduate,
  calculateLearningDue,

  // Same-day handling
  isSameDayReview,
  calculateShortTermStability,

  // Display formatting
  formatInterval,
  formatIntervalRange,

  // Analytics
  generateForgettingCurve,
  calculateAverageRetrievability,
  calculateTrueRetention,
  getHourlyBreakdown,
  simulateFutureWorkload,

  // Configuration
  DEFAULT_PARAMS,
};

export default fsrs;
