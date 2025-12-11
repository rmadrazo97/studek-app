/**
 * FSRS Optimizer - Machine Learning for Personalized Weights
 *
 * This module implements the optimization engine that learns personalized
 * FSRS parameters from a user's review history. It uses gradient descent
 * to minimize the binary cross-entropy loss between predicted retrievability
 * and actual recall outcomes.
 *
 * Based on the FSRS v5 optimization specification.
 */

import {
  DEFAULT_PARAMS,
  FSRSParams,
  Rating,
  calculateRetrievability,
  initDifficulty,
  initStability,
  nextDifficulty,
  nextRecallStability,
  nextForgetStability,
} from './index';

// ============================================================================
// Types
// ============================================================================

export interface ReviewRecord {
  cardId: string;
  rating: Rating;
  elapsedDays: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  reviewedAt: Date;
}

export interface OptimizationResult {
  weights: number[];
  loss: number;
  iterations: number;
  rmse: number; // Root Mean Square Error
  logLoss: number; // Binary Cross-Entropy
  sampleSize: number;
  convergenceHistory: number[];
}

export interface OptimizerConfig {
  learningRate: number;
  maxIterations: number;
  convergenceThreshold: number;
  minReviews: number;
  batchSize: number;
  regularization: number; // L2 regularization strength
}

// Default optimizer configuration
export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  learningRate: 0.05,
  maxIterations: 500,
  convergenceThreshold: 1e-6,
  minReviews: 100, // Need at least 100 reviews for meaningful optimization
  batchSize: 32,
  regularization: 0.001, // Small L2 regularization to prevent overfitting
};

// Parameter bounds to ensure physically plausible values
const PARAM_BOUNDS: [number, number][] = [
  [0.01, 10],    // w0: initial stability for Again
  [0.01, 10],    // w1: initial stability for Hard
  [0.1, 30],     // w2: initial stability for Good
  [1, 100],      // w3: initial stability for Easy
  [1, 10],       // w4: initial difficulty baseline
  [0.01, 3],     // w5: difficulty spread
  [0.01, 5],     // w6: difficulty update rate
  [0.001, 0.5],  // w7: mean reversion rate
  [0, 4],        // w8: stability increase base (in exp)
  [0.01, 1],     // w9: stability saturation exponent
  [0.01, 3],     // w10: retrievability gain factor
  [0.1, 5],      // w11: lapse stability scaling
  [0.001, 0.5],  // w12: difficulty impact on lapse
  [0.01, 1],     // w13: stability impact on lapse
  [0.01, 5],     // w14: retrievability impact on lapse
  [0.01, 1],     // w15: hard penalty
  [1, 5],        // w16: easy bonus
  [0, 1],        // w17: short-term stability (v6)
  [0, 1],        // w18: short-term shape (v6)
];

// ============================================================================
// Data Preprocessing
// ============================================================================

interface ProcessedReview {
  elapsedDays: number;
  stability: number;
  difficulty: number;
  passed: boolean; // rating > 1
  rating: Rating;
  isFirstReview: boolean;
}

/**
 * Process raw review records into training data
 * Groups reviews by card and reconstructs the full review history
 */
export function preprocessReviewData(
  reviews: ReviewRecord[],
  weights: number[] = DEFAULT_PARAMS.w
): ProcessedReview[] {
  // Group reviews by card
  const cardReviews = new Map<string, ReviewRecord[]>();
  for (const review of reviews) {
    const existing = cardReviews.get(review.cardId) || [];
    existing.push(review);
    cardReviews.set(review.cardId, existing);
  }

  const processedReviews: ProcessedReview[] = [];

  // Process each card's review history
  for (const [, cardHistory] of cardReviews) {
    // Sort by review time
    cardHistory.sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime());

    let stability = 0;
    let difficulty = 5;
    let isFirstReview = true;

    for (let i = 0; i < cardHistory.length; i++) {
      const review = cardHistory[i];

      // Skip learning/relearning for optimizer (focus on inter-day scheduling)
      if (review.state === 'learning' || review.state === 'relearning') {
        continue;
      }

      // Only include if elapsed days > 0 (not same-day reviews)
      if (review.elapsedDays <= 0 && !isFirstReview) {
        continue;
      }

      if (isFirstReview) {
        // First review - initialize
        difficulty = initDifficulty(review.rating, weights);
        stability = initStability(review.rating, weights);
        isFirstReview = false;

        processedReviews.push({
          elapsedDays: 0,
          stability,
          difficulty,
          passed: review.rating > 1,
          rating: review.rating,
          isFirstReview: true,
        });
      } else {
        // Subsequent review
        const r = calculateRetrievability(review.elapsedDays, stability);

        processedReviews.push({
          elapsedDays: review.elapsedDays,
          stability,
          difficulty,
          passed: review.rating > 1,
          rating: review.rating,
          isFirstReview: false,
        });

        // Update state for next iteration
        difficulty = nextDifficulty(difficulty, review.rating, weights);
        if (review.rating === 1) {
          stability = nextForgetStability(difficulty, stability, r, weights);
        } else {
          stability = nextRecallStability(difficulty, stability, r, review.rating, weights);
        }
      }
    }
  }

  return processedReviews;
}

// ============================================================================
// Loss Functions
// ============================================================================

/**
 * Calculate binary cross-entropy loss
 * Loss = -mean(y * log(p) + (1-y) * log(1-p))
 */
export function binaryCrossEntropy(
  predictions: number[],
  labels: boolean[]
): number {
  const eps = 1e-10; // Small value to prevent log(0)
  let loss = 0;

  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(eps, Math.min(1 - eps, predictions[i]));
    const y = labels[i] ? 1 : 0;
    loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }

  return loss / predictions.length;
}

/**
 * Calculate Root Mean Square Error
 */
export function rmse(predictions: number[], labels: boolean[]): number {
  let sumSquaredError = 0;

  for (let i = 0; i < predictions.length; i++) {
    const y = labels[i] ? 1 : 0;
    const error = y - predictions[i];
    sumSquaredError += error * error;
  }

  return Math.sqrt(sumSquaredError / predictions.length);
}

/**
 * Predict retrievability for all processed reviews using given weights
 */
function predictRetrievability(
  data: ProcessedReview[],
  weights: number[]
): number[] {
  const predictions: number[] = [];

  for (const review of data) {
    if (review.isFirstReview) {
      // First review - retrievability is 1 (just learned)
      predictions.push(1);
    } else {
      // Use forgetting curve
      const r = calculateRetrievability(
        review.elapsedDays,
        review.stability,
        DEFAULT_PARAMS.decay,
        DEFAULT_PARAMS.factor
      );
      predictions.push(r);
    }
  }

  return predictions;
}

/**
 * Calculate total loss with L2 regularization
 */
function calculateLoss(
  data: ProcessedReview[],
  weights: number[],
  regularization: number
): number {
  const predictions = predictRetrievability(data, weights);
  const labels = data.map(d => d.passed);

  const loss = binaryCrossEntropy(predictions, labels);

  // L2 regularization
  const l2Penalty = weights.reduce((sum, w) => sum + w * w, 0) * regularization;

  return loss + l2Penalty;
}

// ============================================================================
// Gradient Descent Optimizer
// ============================================================================

/**
 * Calculate numerical gradient using finite differences
 */
function calculateGradient(
  data: ProcessedReview[],
  weights: number[],
  regularization: number,
  epsilon: number = 1e-5
): number[] {
  const gradient: number[] = new Array(weights.length).fill(0);
  const baseLoss = calculateLoss(data, weights, regularization);

  for (let i = 0; i < weights.length; i++) {
    // Skip v6 parameters if not being used
    if (i >= 17 && !DEFAULT_PARAMS.enableShortTerm) {
      continue;
    }

    const weightsPlus = [...weights];
    weightsPlus[i] += epsilon;

    const lossPlus = calculateLoss(data, weightsPlus, regularization);
    gradient[i] = (lossPlus - baseLoss) / epsilon;
  }

  return gradient;
}

/**
 * Apply parameter bounds (clipping)
 */
function clipWeights(weights: number[]): number[] {
  return weights.map((w, i) => {
    const [min, max] = PARAM_BOUNDS[i] || [0, 10];
    return Math.max(min, Math.min(max, w));
  });
}

/**
 * Main FSRS optimizer using gradient descent
 */
export function optimizeWeights(
  reviews: ReviewRecord[],
  config: Partial<OptimizerConfig> = {}
): OptimizationResult {
  const fullConfig = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };

  // Check minimum reviews
  if (reviews.length < fullConfig.minReviews) {
    return {
      weights: [...DEFAULT_PARAMS.w],
      loss: 0,
      iterations: 0,
      rmse: 0,
      logLoss: 0,
      sampleSize: reviews.length,
      convergenceHistory: [],
    };
  }

  // Initialize weights
  let weights = [...DEFAULT_PARAMS.w];
  let previousLoss = Infinity;
  const convergenceHistory: number[] = [];

  // Preprocess data once with initial weights
  let data = preprocessReviewData(reviews, weights);

  // Filter to only "review" state data (mature cards)
  data = data.filter(d => !d.isFirstReview);

  if (data.length < 50) {
    // Not enough mature card reviews
    return {
      weights: [...DEFAULT_PARAMS.w],
      loss: 0,
      iterations: 0,
      rmse: 0,
      logLoss: 0,
      sampleSize: data.length,
      convergenceHistory: [],
    };
  }

  // Gradient descent loop
  for (let iter = 0; iter < fullConfig.maxIterations; iter++) {
    // Calculate gradient
    const gradient = calculateGradient(data, weights, fullConfig.regularization);

    // Update weights with learning rate
    weights = weights.map((w, i) => w - fullConfig.learningRate * gradient[i]);

    // Apply bounds
    weights = clipWeights(weights);

    // Calculate new loss
    const currentLoss = calculateLoss(data, weights, fullConfig.regularization);
    convergenceHistory.push(currentLoss);

    // Check for convergence
    if (Math.abs(previousLoss - currentLoss) < fullConfig.convergenceThreshold) {
      break;
    }

    // Adaptive learning rate - reduce if loss increases
    if (currentLoss > previousLoss) {
      fullConfig.learningRate *= 0.5;
    }

    previousLoss = currentLoss;

    // Re-preprocess with new weights periodically (every 50 iterations)
    if (iter > 0 && iter % 50 === 0) {
      data = preprocessReviewData(reviews, weights).filter(d => !d.isFirstReview);
    }
  }

  // Calculate final metrics
  const predictions = predictRetrievability(data, weights);
  const labels = data.map(d => d.passed);
  const finalRmse = rmse(predictions, labels);
  const finalLogLoss = binaryCrossEntropy(predictions, labels);

  return {
    weights,
    loss: finalLogLoss,
    iterations: convergenceHistory.length,
    rmse: finalRmse,
    logLoss: finalLogLoss,
    sampleSize: data.length,
    convergenceHistory,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compare optimization result with default parameters
 */
export function compareWithDefaults(
  reviews: ReviewRecord[],
  optimizedWeights: number[]
): { defaultLoss: number; optimizedLoss: number; improvement: number } {
  const data = preprocessReviewData(reviews, DEFAULT_PARAMS.w).filter(d => !d.isFirstReview);

  const defaultPredictions = predictRetrievability(data, DEFAULT_PARAMS.w);
  const optimizedPredictions = predictRetrievability(data, optimizedWeights);
  const labels = data.map(d => d.passed);

  const defaultLoss = binaryCrossEntropy(defaultPredictions, labels);
  const optimizedLoss = binaryCrossEntropy(optimizedPredictions, labels);

  return {
    defaultLoss,
    optimizedLoss,
    improvement: ((defaultLoss - optimizedLoss) / defaultLoss) * 100,
  };
}

/**
 * Validate that weights are within acceptable bounds
 */
export function validateWeights(weights: number[]): boolean {
  if (weights.length < 17) return false;

  for (let i = 0; i < Math.min(weights.length, PARAM_BOUNDS.length); i++) {
    const [min, max] = PARAM_BOUNDS[i];
    if (weights[i] < min || weights[i] > max) {
      return false;
    }
  }

  return true;
}

/**
 * Create FSRS params with custom weights
 */
export function createParamsWithWeights(weights: number[]): FSRSParams {
  return {
    ...DEFAULT_PARAMS,
    w: weights,
  } as FSRSParams;
}

/**
 * Get recommended minimum reviews for optimization
 */
export function getMinReviewsForOptimization(): number {
  return DEFAULT_OPTIMIZER_CONFIG.minReviews;
}

export default {
  optimizeWeights,
  preprocessReviewData,
  binaryCrossEntropy,
  rmse,
  compareWithDefaults,
  validateWeights,
  createParamsWithWeights,
  getMinReviewsForOptimization,
  DEFAULT_OPTIMIZER_CONFIG,
};
