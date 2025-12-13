/**
 * GET /api/decks/shared/[code] - Access a shared deck via link
 * POST /api/decks/shared/[code] - Clone a shared deck
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  validateShareLink,
  incrementShareLinkAccess,
  cloneDeck,
  getCardsByDeckId,
  getDeckWithStats,
} from '@/lib/db/services';
import type { AuthContext, SafeUser } from '@/lib/auth/types';
import {
  assertDeckCreationAllowed,
  assertPublicDeckAdoptionAllowed,
  PlanLimitError,
  planLimitToResponse,
} from '@/lib/billing/limits';

type RouteContext = { params: Promise<{ code: string }> };

/**
 * GET /api/decks/shared/[code]
 * Access a shared deck via its share link code
 */
export const GET = withOptionalAuth(
  async (
    request: NextRequest & { auth?: AuthContext; user?: SafeUser },
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    try {
      const { code } = await context!.params! as { code: string };

      // Validate the share link
      const validation = validateShareLink(code);

      if (!validation.valid || !validation.deck || !validation.link) {
        return NextResponse.json(
          { error: validation.error || 'Invalid share link' },
          { status: 404 }
        );
      }

      const { deck, link } = validation;

      // Increment access count
      incrementShareLinkAccess(link.id);

      // Get deck stats
      const deckWithStats = getDeckWithStats(deck.id);

      // Get cards if permission allows
      const cards = link.permission === 'clone' || link.permission === 'read'
        ? getCardsByDeckId(deck.id, { limit: 100 })
        : [];

      return NextResponse.json({
        deck: {
          id: deckWithStats?.id || deck.id,
          name: deck.name,
          description: deck.description,
          card_count: deckWithStats?.card_count || 0,
          created_at: deck.created_at,
        },
        cards: cards.map((c) => ({
          id: c.id,
          type: c.type,
          front: c.front,
          back: c.back,
          tags: JSON.parse(c.tags || '[]'),
        })),
        permission: link.permission,
        can_clone: link.permission === 'clone',
      });
    } catch (error) {
      return handleApiError('GET /api/decks/shared/[code]', error, 'Failed to access shared deck');
    }
  }
);

/**
 * POST /api/decks/shared/[code]
 * Clone a shared deck to user's library
 */
export const POST = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { code } = await context.params;
      const userId = request.auth.userId;

      // Validate the share link
      const validation = validateShareLink(code);

      if (!validation.valid || !validation.deck || !validation.link) {
        return NextResponse.json(
          { error: validation.error || 'Invalid share link' },
          { status: 404 }
        );
      }

      const { deck, link } = validation;

      // Check if cloning is allowed
      if (link.permission !== 'clone') {
        return NextResponse.json(
          { error: 'This share link does not allow cloning' },
          { status: 403 }
        );
      }

      assertDeckCreationAllowed(userId, { isAiGenerated: false });
      assertPublicDeckAdoptionAllowed(userId);

      // Clone the deck
      const { deck: clonedDeck, cardCount } = cloneDeck(
        deck.id,
        userId,
        link.id
      );

      return NextResponse.json({
        success: true,
        deck: clonedDeck,
        card_count: cardCount,
        message: `Successfully cloned "${deck.name}" with ${cardCount} cards`,
      }, { status: 201 });
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return NextResponse.json(planLimitToResponse(error), { status: error.statusCode });
      }
      return handleApiError('POST /api/decks/shared/[code]', error, 'Failed to clone deck');
    }
  }
);
