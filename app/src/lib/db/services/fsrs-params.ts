/**
 * FSRS Parameters Service
 *
 * Manages user-specific and deck-specific FSRS parameters.
 * Supports personalized weights from optimization.
 */

import { getDatabase, transaction } from '../index';
import { create, now } from '../crud';
import type {
  UserFSRSParams,
  UserFSRSParamsUpdate,
  DeckFSRSParams,
  FSRSOptimizationHistory,
} from '../types';
import { DEFAULT_PARAMS, FSRSParams } from '@/lib/fsrs';

const USER_PARAMS_TABLE = 'user_fsrs_params';
const DECK_PARAMS_TABLE = 'deck_fsrs_params';
const OPTIMIZATION_HISTORY_TABLE = 'fsrs_optimization_history';

// ============================================================================
// User FSRS Parameters
// ============================================================================

/**
 * Get user's FSRS parameters, creating defaults if they don't exist
 */
export function getUserFSRSParams(userId: string): UserFSRSParams {
  const db = getDatabase();

  // Try to get existing params
  const existing = db.prepare(`
    SELECT * FROM ${USER_PARAMS_TABLE} WHERE user_id = ?
  `).get(userId) as UserFSRSParams | undefined;

  if (existing) {
    return existing;
  }

  // Create default params
  const defaultWeights = JSON.stringify(DEFAULT_PARAMS.w);
  const defaultLearningSteps = JSON.stringify(DEFAULT_PARAMS.learningSteps);
  const defaultRelearningSteps = JSON.stringify(DEFAULT_PARAMS.relearningSteps);

  db.prepare(`
    INSERT INTO ${USER_PARAMS_TABLE} (
      user_id, weights, request_retention, maximum_interval,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      enable_fuzz, fuzz_factor, enable_short_term,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    defaultWeights,
    DEFAULT_PARAMS.requestRetention,
    DEFAULT_PARAMS.maximumInterval,
    defaultLearningSteps,
    defaultRelearningSteps,
    DEFAULT_PARAMS.graduatingInterval,
    DEFAULT_PARAMS.easyInterval,
    DEFAULT_PARAMS.enableFuzz ? 1 : 0,
    DEFAULT_PARAMS.fuzzFactor,
    DEFAULT_PARAMS.enableShortTerm ? 1 : 0,
    now(),
    now()
  );

  return db.prepare(`
    SELECT * FROM ${USER_PARAMS_TABLE} WHERE user_id = ?
  `).get(userId) as UserFSRSParams;
}

/**
 * Update user's FSRS parameters
 */
export function updateUserFSRSParams(
  userId: string,
  updates: UserFSRSParamsUpdate
): UserFSRSParams {
  const db = getDatabase();

  // Ensure params exist first
  getUserFSRSParams(userId);

  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return getUserFSRSParams(userId);
  }

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  db.prepare(`
    UPDATE ${USER_PARAMS_TABLE}
    SET ${setClause}, updated_at = ?
    WHERE user_id = ?
  `).run(...values, now(), userId);

  return getUserFSRSParams(userId);
}

/**
 * Convert database params to FSRSParams for the algorithm
 */
export function toFSRSParams(userParams: UserFSRSParams): FSRSParams {
  return {
    w: JSON.parse(userParams.weights),
    requestRetention: userParams.request_retention,
    maximumInterval: userParams.maximum_interval,
    decay: DEFAULT_PARAMS.decay,
    factor: DEFAULT_PARAMS.factor,
    learningSteps: JSON.parse(userParams.learning_steps),
    relearningSteps: JSON.parse(userParams.relearning_steps),
    graduatingInterval: userParams.graduating_interval,
    easyInterval: userParams.easy_interval,
    enableFuzz: userParams.enable_fuzz === 1,
    fuzzFactor: userParams.fuzz_factor,
    enableShortTerm: userParams.enable_short_term === 1,
  };
}

/**
 * Get effective FSRS params for a deck (merges user + deck overrides)
 */
export function getEffectiveFSRSParams(
  userId: string,
  deckId?: string
): FSRSParams {
  const userParams = getUserFSRSParams(userId);
  const baseParams = toFSRSParams(userParams);

  if (!deckId) {
    return baseParams;
  }

  // Check for deck-specific overrides
  const db = getDatabase();
  const deckParams = db.prepare(`
    SELECT * FROM ${DECK_PARAMS_TABLE} WHERE deck_id = ?
  `).get(deckId) as DeckFSRSParams | undefined;

  if (!deckParams) {
    return baseParams;
  }

  // Merge deck overrides
  return {
    ...baseParams,
    w: deckParams.weights ? JSON.parse(deckParams.weights) : baseParams.w,
    requestRetention: deckParams.request_retention ?? baseParams.requestRetention,
    maximumInterval: deckParams.maximum_interval ?? baseParams.maximumInterval,
    learningSteps: deckParams.learning_steps
      ? JSON.parse(deckParams.learning_steps)
      : baseParams.learningSteps,
    relearningSteps: deckParams.relearning_steps
      ? JSON.parse(deckParams.relearning_steps)
      : baseParams.relearningSteps,
    graduatingInterval: deckParams.graduating_interval ?? baseParams.graduatingInterval,
    easyInterval: deckParams.easy_interval ?? baseParams.easyInterval,
    enableFuzz: deckParams.enable_fuzz !== null
      ? deckParams.enable_fuzz === 1
      : baseParams.enableFuzz,
    fuzzFactor: deckParams.fuzz_factor ?? baseParams.fuzzFactor,
  };
}

// ============================================================================
// Deck FSRS Parameters
// ============================================================================

/**
 * Get deck-specific FSRS parameters
 */
export function getDeckFSRSParams(deckId: string): DeckFSRSParams | null {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${DECK_PARAMS_TABLE} WHERE deck_id = ?
  `).get(deckId) as DeckFSRSParams | undefined ?? null;
}

/**
 * Set deck-specific FSRS parameters
 */
export function setDeckFSRSParams(
  deckId: string,
  params: Partial<Omit<DeckFSRSParams, 'deck_id' | 'created_at' | 'updated_at'>>
): DeckFSRSParams {
  const db = getDatabase();

  const existing = getDeckFSRSParams(deckId);

  if (existing) {
    // Update
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length > 0) {
      const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
      const values = entries.map(([, val]) => val);

      db.prepare(`
        UPDATE ${DECK_PARAMS_TABLE}
        SET ${setClause}, updated_at = ?
        WHERE deck_id = ?
      `).run(...values, now(), deckId);
    }
  } else {
    // Insert
    db.prepare(`
      INSERT INTO ${DECK_PARAMS_TABLE} (
        deck_id, weights, request_retention, maximum_interval,
        learning_steps, relearning_steps, graduating_interval, easy_interval,
        enable_fuzz, fuzz_factor, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      deckId,
      params.weights ?? null,
      params.request_retention ?? null,
      params.maximum_interval ?? null,
      params.learning_steps ?? null,
      params.relearning_steps ?? null,
      params.graduating_interval ?? null,
      params.easy_interval ?? null,
      params.enable_fuzz ?? null,
      params.fuzz_factor ?? null,
      now(),
      now()
    );
  }

  return getDeckFSRSParams(deckId)!;
}

/**
 * Clear deck-specific FSRS parameters (revert to user defaults)
 */
export function clearDeckFSRSParams(deckId: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM ${DECK_PARAMS_TABLE} WHERE deck_id = ?`).run(deckId);
}

// ============================================================================
// Optimization
// ============================================================================

/**
 * Save optimization result to user params and history
 */
export function saveOptimizationResult(
  userId: string,
  weightsBefore: number[],
  weightsAfter: number[],
  lossBefore: number,
  lossAfter: number,
  rmse: number,
  sampleSize: number,
  iterations: number,
  deckId?: string
): FSRSOptimizationHistory {
  return transaction(() => {
    const db = getDatabase();

    const improvement = ((lossBefore - lossAfter) / lossBefore) * 100;

    // Save to history
    const history = create<FSRSOptimizationHistory>(OPTIMIZATION_HISTORY_TABLE, {
      user_id: userId,
      deck_id: deckId || null,
      weights_before: JSON.stringify(weightsBefore),
      weights_after: JSON.stringify(weightsAfter),
      loss_before: lossBefore,
      loss_after: lossAfter,
      improvement_percent: improvement,
      rmse,
      sample_size: sampleSize,
      iterations,
    });

    // Update params
    if (deckId) {
      setDeckFSRSParams(deckId, {
        weights: JSON.stringify(weightsAfter),
        last_optimized_at: now(),
        optimization_sample_size: sampleSize,
        optimization_loss: lossAfter,
      });
    } else {
      updateUserFSRSParams(userId, {
        weights: JSON.stringify(weightsAfter),
        last_optimized_at: now(),
        optimization_sample_size: sampleSize,
        optimization_loss: lossAfter,
        optimization_rmse: rmse,
      });
    }

    return history;
  });
}

/**
 * Get optimization history for a user
 */
export function getOptimizationHistory(
  userId: string,
  limit = 10
): FSRSOptimizationHistory[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM ${OPTIMIZATION_HISTORY_TABLE}
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as FSRSOptimizationHistory[];
}

/**
 * Reset user params to defaults
 */
export function resetUserFSRSParams(userId: string): UserFSRSParams {
  const db = getDatabase();

  db.prepare(`DELETE FROM ${USER_PARAMS_TABLE} WHERE user_id = ?`).run(userId);

  return getUserFSRSParams(userId); // Will create fresh defaults
}

// ============================================================================
// Table Initialization
// ============================================================================

let tablesEnsured = false;

/**
 * Ensure FSRS params tables exist
 */
export function ensureFSRSParamsTables(): void {
  if (tablesEnsured) return;

  const db = getDatabase();

  try {
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='user_fsrs_params'
    `).get();

    if (!tableExists) {
      console.log('[FSRS] Creating FSRS params tables...');

      // Create tables - this should be done via migration, but fallback here
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_fsrs_params (
          user_id TEXT PRIMARY KEY,
          weights TEXT NOT NULL DEFAULT '${JSON.stringify(DEFAULT_PARAMS.w)}',
          request_retention REAL NOT NULL DEFAULT ${DEFAULT_PARAMS.requestRetention},
          maximum_interval INTEGER NOT NULL DEFAULT ${DEFAULT_PARAMS.maximumInterval},
          learning_steps TEXT NOT NULL DEFAULT '${JSON.stringify(DEFAULT_PARAMS.learningSteps)}',
          relearning_steps TEXT NOT NULL DEFAULT '${JSON.stringify(DEFAULT_PARAMS.relearningSteps)}',
          graduating_interval INTEGER NOT NULL DEFAULT ${DEFAULT_PARAMS.graduatingInterval},
          easy_interval INTEGER NOT NULL DEFAULT ${DEFAULT_PARAMS.easyInterval},
          enable_fuzz INTEGER NOT NULL DEFAULT ${DEFAULT_PARAMS.enableFuzz ? 1 : 0},
          fuzz_factor REAL NOT NULL DEFAULT ${DEFAULT_PARAMS.fuzzFactor},
          enable_short_term INTEGER NOT NULL DEFAULT ${DEFAULT_PARAMS.enableShortTerm ? 1 : 0},
          last_optimized_at TEXT,
          optimization_sample_size INTEGER,
          optimization_loss REAL,
          optimization_rmse REAL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS deck_fsrs_params (
          deck_id TEXT PRIMARY KEY,
          weights TEXT,
          request_retention REAL,
          maximum_interval INTEGER,
          learning_steps TEXT,
          relearning_steps TEXT,
          graduating_interval INTEGER,
          easy_interval INTEGER,
          enable_fuzz INTEGER,
          fuzz_factor REAL,
          last_optimized_at TEXT,
          optimization_sample_size INTEGER,
          optimization_loss REAL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS fsrs_optimization_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          deck_id TEXT,
          weights_before TEXT NOT NULL,
          weights_after TEXT NOT NULL,
          loss_before REAL NOT NULL,
          loss_after REAL NOT NULL,
          improvement_percent REAL NOT NULL,
          rmse REAL NOT NULL,
          sample_size INTEGER NOT NULL,
          iterations INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL
        )
      `);

      console.log('[FSRS] Tables created successfully');
    }

    tablesEnsured = true;
  } catch (error) {
    console.error('[FSRS] Failed to ensure tables:', error);
    tablesEnsured = true; // Prevent repeated attempts
  }
}

export default {
  getUserFSRSParams,
  updateUserFSRSParams,
  toFSRSParams,
  getEffectiveFSRSParams,
  getDeckFSRSParams,
  setDeckFSRSParams,
  clearDeckFSRSParams,
  saveOptimizationResult,
  getOptimizationHistory,
  resetUserFSRSParams,
  ensureFSRSParamsTables,
};
