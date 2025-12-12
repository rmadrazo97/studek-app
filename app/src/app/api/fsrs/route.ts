/**
 * FSRS Settings and Optimization API
 *
 * GET /api/fsrs - Get user's FSRS settings
 * PUT /api/fsrs - Update user's FSRS settings
 * POST /api/fsrs/optimize - Run FSRS optimizer on review history
 * POST /api/fsrs/reset - Reset to default parameters
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getUserFSRSParams,
  updateUserFSRSParams,
  toFSRSParams,
  resetUserFSRSParams,
  saveOptimizationResult,
  getOptimizationHistory,
  ensureFSRSParamsTables,
} from '@/lib/db/services/fsrs-params';
import { getReviewLogsByDateRange } from '@/lib/db/services/reviews';
import { optimizeWeights, compareWithDefaults, getMinReviewsForOptimization } from '@/lib/fsrs/optimizer';
import { DEFAULT_PARAMS } from '@/lib/fsrs';
import type { Rating } from '@/lib/db/types';

/**
 * GET /api/fsrs - Get user's FSRS settings
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    ensureFSRSParamsTables();

    const userId = request.auth.userId;
    const params = getUserFSRSParams(userId);
    const fsrsParams = toFSRSParams(params);
    const history = getOptimizationHistory(userId, 5);

    return NextResponse.json({
      settings: {
        weights: fsrsParams.w,
        requestRetention: fsrsParams.requestRetention,
        maximumInterval: fsrsParams.maximumInterval,
        learningSteps: fsrsParams.learningSteps,
        relearningSteps: fsrsParams.relearningSteps,
        graduatingInterval: fsrsParams.graduatingInterval,
        easyInterval: fsrsParams.easyInterval,
        enableFuzz: fsrsParams.enableFuzz,
        fuzzFactor: fsrsParams.fuzzFactor,
        enableShortTerm: fsrsParams.enableShortTerm,
      },
      optimization: {
        lastOptimizedAt: params.last_optimized_at,
        sampleSize: params.optimization_sample_size,
        loss: params.optimization_loss,
        rmse: params.optimization_rmse,
        minReviewsRequired: getMinReviewsForOptimization(),
      },
      history: history.map(h => ({
        id: h.id,
        improvementPercent: h.improvement_percent,
        sampleSize: h.sample_size,
        createdAt: h.created_at,
      })),
      defaults: {
        weights: DEFAULT_PARAMS.w,
        requestRetention: DEFAULT_PARAMS.requestRetention,
        learningSteps: DEFAULT_PARAMS.learningSteps,
        relearningSteps: DEFAULT_PARAMS.relearningSteps,
      },
    });
  } catch (error) {
    return handleApiError('GET /api/fsrs', error, 'Failed to get FSRS settings');
  }
});

/**
 * PUT /api/fsrs - Update user's FSRS settings
 */
export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    ensureFSRSParamsTables();

    const userId = request.auth.userId;
    const body = await request.json();

    const updates: Record<string, unknown> = {};

    // Validate and map settings
    if (body.requestRetention !== undefined) {
      const retention = Number(body.requestRetention);
      if (retention < 0.7 || retention > 0.99) {
        return NextResponse.json(
          { error: 'Request retention must be between 0.7 and 0.99' },
          { status: 400 }
        );
      }
      updates.request_retention = retention;
    }

    if (body.maximumInterval !== undefined) {
      const maxInterval = Number(body.maximumInterval);
      if (maxInterval < 30 || maxInterval > 36500) {
        return NextResponse.json(
          { error: 'Maximum interval must be between 30 and 36500 days' },
          { status: 400 }
        );
      }
      updates.maximum_interval = maxInterval;
    }

    if (body.learningSteps !== undefined) {
      if (!Array.isArray(body.learningSteps) || body.learningSteps.length === 0) {
        return NextResponse.json(
          { error: 'Learning steps must be a non-empty array of minutes' },
          { status: 400 }
        );
      }
      updates.learning_steps = JSON.stringify(body.learningSteps);
    }

    if (body.relearningSteps !== undefined) {
      if (!Array.isArray(body.relearningSteps) || body.relearningSteps.length === 0) {
        return NextResponse.json(
          { error: 'Relearning steps must be a non-empty array of minutes' },
          { status: 400 }
        );
      }
      updates.relearning_steps = JSON.stringify(body.relearningSteps);
    }

    if (body.graduatingInterval !== undefined) {
      const gradInterval = Number(body.graduatingInterval);
      if (gradInterval < 1 || gradInterval > 365) {
        return NextResponse.json(
          { error: 'Graduating interval must be between 1 and 365 days' },
          { status: 400 }
        );
      }
      updates.graduating_interval = gradInterval;
    }

    if (body.easyInterval !== undefined) {
      const easyInterval = Number(body.easyInterval);
      if (easyInterval < 1 || easyInterval > 365) {
        return NextResponse.json(
          { error: 'Easy interval must be between 1 and 365 days' },
          { status: 400 }
        );
      }
      updates.easy_interval = easyInterval;
    }

    if (body.enableFuzz !== undefined) {
      updates.enable_fuzz = body.enableFuzz ? 1 : 0;
    }

    if (body.fuzzFactor !== undefined) {
      const fuzzFactor = Number(body.fuzzFactor);
      if (fuzzFactor < 0 || fuzzFactor > 0.25) {
        return NextResponse.json(
          { error: 'Fuzz factor must be between 0 and 0.25' },
          { status: 400 }
        );
      }
      updates.fuzz_factor = fuzzFactor;
    }

    if (body.enableShortTerm !== undefined) {
      updates.enable_short_term = body.enableShortTerm ? 1 : 0;
    }

    const updatedParams = updateUserFSRSParams(userId, updates);
    const fsrsParams = toFSRSParams(updatedParams);

    return NextResponse.json({
      success: true,
      settings: {
        weights: fsrsParams.w,
        requestRetention: fsrsParams.requestRetention,
        maximumInterval: fsrsParams.maximumInterval,
        learningSteps: fsrsParams.learningSteps,
        relearningSteps: fsrsParams.relearningSteps,
        graduatingInterval: fsrsParams.graduatingInterval,
        easyInterval: fsrsParams.easyInterval,
        enableFuzz: fsrsParams.enableFuzz,
        fuzzFactor: fsrsParams.fuzzFactor,
        enableShortTerm: fsrsParams.enableShortTerm,
      },
    });
  } catch (error) {
    return handleApiError('PUT /api/fsrs', error, 'Failed to update FSRS settings');
  }
});

/**
 * POST /api/fsrs - Reset to default parameters
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    ensureFSRSParamsTables();

    const userId = request.auth.userId;
    const body = await request.json();

    if (body.action === 'reset') {
      const params = resetUserFSRSParams(userId);
      const fsrsParams = toFSRSParams(params);

      return NextResponse.json({
        success: true,
        message: 'FSRS parameters reset to defaults',
        settings: {
          weights: fsrsParams.w,
          requestRetention: fsrsParams.requestRetention,
          maximumInterval: fsrsParams.maximumInterval,
          learningSteps: fsrsParams.learningSteps,
          relearningSteps: fsrsParams.relearningSteps,
          graduatingInterval: fsrsParams.graduatingInterval,
          easyInterval: fsrsParams.easyInterval,
          enableFuzz: fsrsParams.enableFuzz,
          fuzzFactor: fsrsParams.fuzzFactor,
          enableShortTerm: fsrsParams.enableShortTerm,
        },
      });
    }

    if (body.action === 'optimize') {
      // Get all review logs for the user (last 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const reviewLogs = getReviewLogsByDateRange(
        userId,
        twoYearsAgo.toISOString(),
        endDate.toISOString()
      );

      const minReviews = getMinReviewsForOptimization();
      if (reviewLogs.length < minReviews) {
        return NextResponse.json({
          success: false,
          error: `Need at least ${minReviews} reviews to optimize. You have ${reviewLogs.length}.`,
          currentReviews: reviewLogs.length,
          minReviewsRequired: minReviews,
        }, { status: 400 });
      }

      // Convert to optimizer format
      const reviews = reviewLogs.map(log => ({
        cardId: log.card_id,
        rating: log.rating as Rating,
        elapsedDays: (new Date(log.reviewed_at).getTime() - (log.stability_before > 0 ?
          new Date(log.reviewed_at).getTime() - log.stability_before * 24 * 60 * 60 * 1000 :
          new Date(log.reviewed_at).getTime())) / (1000 * 60 * 60 * 24),
        state: 'review' as const, // We'll filter in the optimizer
        reviewedAt: new Date(log.reviewed_at),
      }));

      // Get current weights
      const currentParams = getUserFSRSParams(userId);
      const currentWeights = JSON.parse(currentParams.weights);

      // Run optimization
      const result = optimizeWeights(reviews);

      if (result.iterations === 0) {
        return NextResponse.json({
          success: false,
          error: 'Not enough valid review data for optimization',
          sampleSize: result.sampleSize,
        }, { status: 400 });
      }

      // Compare with current
      const comparison = compareWithDefaults(reviews, result.weights);

      // Save results
      saveOptimizationResult(
        userId,
        currentWeights,
        result.weights,
        comparison.defaultLoss,
        result.loss,
        result.rmse,
        result.sampleSize,
        result.iterations
      );

      // Get updated params
      const updatedParams = getUserFSRSParams(userId);
      const fsrsParams = toFSRSParams(updatedParams);

      return NextResponse.json({
        success: true,
        message: 'FSRS parameters optimized successfully',
        optimization: {
          iterations: result.iterations,
          sampleSize: result.sampleSize,
          loss: result.loss,
          rmse: result.rmse,
          improvementPercent: comparison.improvement,
        },
        settings: {
          weights: fsrsParams.w,
          requestRetention: fsrsParams.requestRetention,
          maximumInterval: fsrsParams.maximumInterval,
          learningSteps: fsrsParams.learningSteps,
          relearningSteps: fsrsParams.relearningSteps,
          graduatingInterval: fsrsParams.graduatingInterval,
          easyInterval: fsrsParams.easyInterval,
          enableFuzz: fsrsParams.enableFuzz,
          fuzzFactor: fsrsParams.fuzzFactor,
          enableShortTerm: fsrsParams.enableShortTerm,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "reset" or "optimize"' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError('POST /api/fsrs', error, 'Failed to process FSRS action');
  }
});
