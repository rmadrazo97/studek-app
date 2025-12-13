import { getDatabase } from '../db';
import { getDeckCount } from '../db/services/decks';
import { getUserPlan, getDefaultPlan, PLAN_SEEDS } from '../db/services/plans';
import { getUserClones } from '../db/services/shares';
import type { Plan } from '../db/types';

export type PlanLimitCode =
  | 'deck_limit'
  | 'ai_deck_limit'
  | 'public_deck_limit'
  | 'study_session_limit';

export interface PlanLimits {
  maxDecks: number | null;
  maxSessionsPerDeck: number | null;
  maxPublicDecks: number | null;
  maxAiDecks: number | null;
}

export interface PlanLimitContext {
  code: PlanLimitCode;
  limit: number | null;
  current: number;
  plan: Plan | null;
}

export class PlanLimitError extends Error {
  context: PlanLimitContext;
  statusCode: number;

  constructor(message: string, context: PlanLimitContext, statusCode = 402) {
    super(message);
    this.name = 'PlanLimitError';
    this.context = context;
    this.statusCode = statusCode;
  }
}

function fallbackPlanFromSeeds(): Plan {
  const seed = PLAN_SEEDS.find((p) => p.slug === 'free') ?? PLAN_SEEDS[0];
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    price_cents: seed.price_cents,
    currency: seed.currency,
    interval: seed.interval,
    is_default: seed.is_default ? 1 : 0,
    max_decks: seed.max_decks ?? null,
    max_sessions_per_deck: seed.max_sessions_per_deck ?? null,
    max_public_decks: seed.max_public_decks ?? null,
    max_ai_decks: seed.max_ai_decks ?? null,
    metadata: seed.metadata ? JSON.stringify(seed.metadata) : null,
    created_at: '',
    updated_at: '',
  };
}

function extractPlanLimits(plan: Plan | null): PlanLimits {
  return {
    maxDecks: plan?.max_decks ?? null,
    maxSessionsPerDeck: plan?.max_sessions_per_deck ?? null,
    maxPublicDecks: plan?.max_public_decks ?? null,
    maxAiDecks: plan?.max_ai_decks ?? null,
  };
}

export function getPlanContext(userId: string): { plan: Plan; limits: PlanLimits } {
  const plan = getUserPlan(userId) ?? getDefaultPlan() ?? fallbackPlanFromSeeds();
  return { plan, limits: extractPlanLimits(plan) };
}

function getAiDeckCount(userId: string): number {
  const db = getDatabase();
  const result = db
    .prepare(`SELECT COUNT(*) as count FROM decks WHERE user_id = ? AND is_ai_generated = 1`)
    .get(userId) as { count: number };
  return result.count || 0;
}

function getStudySessionCount(userId: string, deckId: string): number {
  const db = getDatabase();
  const result = db
    .prepare(`SELECT COUNT(*) as count FROM study_sessions WHERE user_id = ? AND deck_id = ?`)
    .get(userId, deckId) as { count: number };
  return result.count || 0;
}

export function assertDeckCreationAllowed(userId: string, options: { isAiGenerated?: boolean } = {}): void {
  const { plan, limits } = getPlanContext(userId);

  const deckCount = getDeckCount(userId);
  if (limits.maxDecks !== null && deckCount >= limits.maxDecks) {
    throw new PlanLimitError('Deck limit reached', {
      code: 'deck_limit',
      limit: limits.maxDecks,
      current: deckCount,
      plan,
    });
  }

  if (options.isAiGenerated) {
    const aiDeckCount = getAiDeckCount(userId);
    if (limits.maxAiDecks !== null && aiDeckCount >= limits.maxAiDecks) {
      throw new PlanLimitError('AI deck limit reached', {
        code: 'ai_deck_limit',
        limit: limits.maxAiDecks,
        current: aiDeckCount,
        plan,
      });
    }
  }
}

export function assertPublicDeckAdoptionAllowed(userId: string): void {
  const { plan, limits } = getPlanContext(userId);
  if (limits.maxPublicDecks === null) return;

  const clones = getUserClones(userId);
  const current = clones.length;

  if (current >= limits.maxPublicDecks) {
    throw new PlanLimitError('Public/shared deck limit reached', {
      code: 'public_deck_limit',
      limit: limits.maxPublicDecks,
      current,
      plan,
    });
  }
}

export function assertStudySessionAllowed(userId: string, deckId: string | null | undefined): void {
  if (!deckId) return;

  const { plan, limits } = getPlanContext(userId);
  if (limits.maxSessionsPerDeck === null) return;

  const current = getStudySessionCount(userId, deckId);
  if (current >= limits.maxSessionsPerDeck) {
    throw new PlanLimitError('Study session limit reached for this deck', {
      code: 'study_session_limit',
      limit: limits.maxSessionsPerDeck,
      current,
      plan,
    });
  }
}

export function planLimitToResponse(error: PlanLimitError) {
  return {
    error: 'plan_limit_exceeded',
    message: error.message,
    code: error.context.code,
    limit: error.context.limit,
    current: error.context.current,
    plan: error.context.plan
      ? {
          id: error.context.plan.id,
          slug: error.context.plan.slug,
          name: error.context.plan.name,
        }
      : null,
  };
}
