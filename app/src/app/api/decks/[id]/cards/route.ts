/**
 * GET /api/decks/[id]/cards - Get all cards in a deck
 * POST /api/decks/[id]/cards - Create a new card in the deck
 */

import { NextResponse } from 'next/server';
import {
  withAuth,
  type AuthenticatedRequest,
  forbiddenResponse,
} from '@/lib/auth/middleware';
import {
  getDeckById,
  getCardsByDeckId,
  getCardsPaginated,
  getDueCards,
  getNewCards,
  createCard,
  createCards,
  userHasAccessToDeck,
} from '@/lib/db/services';
import type { CardCreate } from '@/lib/db/types';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/decks/[id]/cards
 * Get all cards in a deck with optional filtering
 */
export const GET = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: deckId } = await context.params;
      const userId = request.auth.userId;
      const { searchParams } = new URL(request.url);

      // Check access
      const access = userHasAccessToDeck(userId, deckId);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this deck');
      }

      // Parse query params
      const filter = searchParams.get('filter'); // 'due', 'new', or null for all
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      let cards;
      let total = 0;

      if (filter === 'due') {
        cards = getDueCards(deckId, limit);
        total = cards.length; // For due cards, we return all that are due
      } else if (filter === 'new') {
        cards = getNewCards(deckId, limit);
        total = cards.length;
      } else {
        // Paginated fetch of all cards
        const result = getCardsPaginated(deckId, { limit, offset });
        cards = result.data;
        total = result.total;
      }

      return NextResponse.json({
        cards,
        total,
        limit,
        offset,
        hasMore: offset + cards.length < total,
      });
    } catch (error) {
      console.error('[API] GET /api/decks/[id]/cards error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/decks/[id]/cards
 * Create new card(s) in the deck
 */
export const POST = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: deckId } = await context.params;
      const userId = request.auth.userId;

      // Get the deck and verify ownership
      const deck = getDeckById(deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      // Check access - need write permission to create cards
      const access = userHasAccessToDeck(userId, deckId);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this deck');
      }

      // Only owners and users with write/admin permission can create cards
      if (access.permission !== 'owner' && access.permission !== 'write' && access.permission !== 'admin') {
        return forbiddenResponse('You do not have permission to add cards to this deck');
      }

      const body = await request.json();

      // Check if single card or array of cards
      const isArray = Array.isArray(body);
      const cardsData: Partial<CardCreate>[] = isArray ? body : [body];

      // Validate cards
      for (const cardData of cardsData) {
        if (!cardData.front || typeof cardData.front !== 'string') {
          return NextResponse.json(
            { error: 'Card front is required' },
            { status: 400 }
          );
        }
        if (!cardData.back || typeof cardData.back !== 'string') {
          return NextResponse.json(
            { error: 'Card back is required' },
            { status: 400 }
          );
        }
        if (cardData.type && !['basic', 'cloze', 'image-occlusion'].includes(cardData.type)) {
          return NextResponse.json(
            { error: 'Invalid card type' },
            { status: 400 }
          );
        }
      }

      // Create card(s)
      const validCards: CardCreate[] = cardsData.map((c) => ({
        deck_id: deckId,
        type: c.type || 'basic',
        front: c.front!.trim(),
        back: c.back!.trim(),
        media_type: c.media_type,
        media_url: c.media_url,
        tags: c.tags || [],
      }));

      const createdCards = isArray
        ? createCards(validCards)
        : [createCard(validCards[0])];

      return NextResponse.json(
        isArray ? createdCards : createdCards[0],
        { status: 201 }
      );
    } catch (error) {
      console.error('[API] POST /api/decks/[id]/cards error:', error);
      return NextResponse.json(
        { error: 'Failed to create card(s)' },
        { status: 500 }
      );
    }
  }
);
