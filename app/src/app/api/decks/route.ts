/**
 * GET /api/decks - Get all decks for authenticated user
 * POST /api/decks - Create a new deck
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getDecksWithStats,
  createDeck,
  getDecksSharedWithUser,
} from '@/lib/db/services';
import type { DeckCreate } from '@/lib/db/types';

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
    console.error('[API] GET /api/decks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    );
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

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    // Create the deck
    const deck = createDeck({
      user_id: userId,
      name: body.name.trim(),
      description: body.description?.trim(),
      parent_id: body.parent_id,
      hierarchy: body.hierarchy,
      is_public: body.is_public ?? false,
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/decks error:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
});
