/**
 * GET /api/decks - Get all decks for authenticated user
 * POST /api/decks - Create a new deck
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getDecksWithStats,
  createDeck,
  getDecksSharedWithUser,
} from '@/lib/db/services';
import type { DeckCreate } from '@/lib/db/types';
import { assertDeckCreationAllowed, PlanLimitError, planLimitToResponse } from '@/lib/billing/limits';

/**
 * GET /api/decks
 * Get all decks for the authenticated user (owned + shared)
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const { searchParams } = new URL(request.url);
    const includeShared = searchParams.get('includeShared') !== 'false';

    // Get user's own decks with stats
    const ownedDecks = getDecksWithStats(userId);

    // Get decks shared with the user
    const sharedDecks = includeShared
      ? getDecksSharedWithUser(userId).map((s) => ({
          ...s.deck,
          card_count: 0, // Will be populated if needed
          due_count: 0,
          new_count: 0,
          shared_permission: s.permission,
        }))
      : [];

    return NextResponse.json({
      owned: ownedDecks,
      shared: sharedDecks,
    });
  } catch (error) {
    return handleApiError('GET /api/decks', error, 'Failed to fetch decks');
  }
});

/**
 * POST /api/decks
 * Create a new deck
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = (await request.json()) as Partial<DeckCreate>;

    console.log('[API] POST /api/decks - Raw request body:', JSON.stringify(body, null, 2));
    console.log('[API] POST /api/decks - userId:', userId);

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      console.log('[API] POST /api/decks - Validation failed: name is required');
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    assertDeckCreationAllowed(userId, { isAiGenerated: false });

    // Create the deck - only include defined values, convert undefined to null for SQLite
    const deckData = {
      user_id: userId,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      parent_id: body.parent_id ?? null,
      hierarchy: body.hierarchy ?? null,
      is_public: body.is_public ?? false,
      is_ai_generated: false,
      category: body.category ?? null,
    };

    console.log('[API] POST /api/decks - Prepared deckData:', JSON.stringify(deckData, null, 2));

    // Log each field type to catch any non-primitive values
    for (const [key, value] of Object.entries(deckData)) {
      console.log(`[API] POST /api/decks - Field "${key}": value=${JSON.stringify(value)}, type=${typeof value}, isNull=${value === null}, isUndefined=${value === undefined}`);
    }

    const deck = createDeck(deckData);

    console.log('[API] POST /api/decks - Created deck:', JSON.stringify(deck, null, 2));
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(planLimitToResponse(error), { status: error.statusCode });
    }
    return handleApiError('POST /api/decks', error, 'Failed to create deck');
  }
});
