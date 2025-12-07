/**
 * GET /api/decks/[id] - Get a single deck
 * PATCH /api/decks/[id] - Update a deck
 * DELETE /api/decks/[id] - Delete a deck
 */

import { NextResponse } from 'next/server';
import {
  withAuth,
  type AuthenticatedRequest,
  forbiddenResponse,
} from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getDeckWithStats,
  getDeckById,
  updateDeck,
  deleteDeck,
  userHasAccessToDeck,
} from '@/lib/db/services';
import type { DeckUpdate } from '@/lib/db/types';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/decks/[id]
 * Get a single deck with stats
 */
export const GET = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Check access
      const access = userHasAccessToDeck(userId, id);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this deck');
      }

      const deck = getDeckWithStats(id);

      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      return NextResponse.json({
        ...deck,
        permission: access.permission,
      });
    } catch (error) {
      return handleApiError('GET /api/decks/[id]', error, 'Failed to fetch deck');
    }
  }
);

/**
 * PATCH /api/decks/[id]
 * Update a deck
 */
export const PATCH = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Get the deck
      const deck = getDeckById(id);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      // Check ownership (only owners can update)
      if (deck.user_id !== userId) {
        return forbiddenResponse('Only the deck owner can update this deck');
      }

      const body = (await request.json()) as DeckUpdate;

      // Validate update data
      const updateData: DeckUpdate = {};
      if (body.name !== undefined) {
        if (typeof body.name !== 'string' || body.name.trim() === '') {
          return NextResponse.json(
            { error: 'Deck name cannot be empty' },
            { status: 400 }
          );
        }
        updateData.name = body.name.trim();
      }
      if (body.description !== undefined) {
        updateData.description = body.description?.trim();
      }
      if (body.parent_id !== undefined) {
        updateData.parent_id = body.parent_id;
      }
      if (body.hierarchy !== undefined) {
        updateData.hierarchy = body.hierarchy;
      }
      if (body.is_public !== undefined) {
        updateData.is_public = body.is_public;
      }

      const updatedDeck = updateDeck(id, updateData);

      return NextResponse.json(updatedDeck);
    } catch (error) {
      return handleApiError('PATCH /api/decks/[id]', error, 'Failed to update deck');
    }
  }
);

/**
 * DELETE /api/decks/[id]
 * Delete a deck
 */
export const DELETE = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Get the deck
      const deck = getDeckById(id);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      // Check ownership (only owners can delete)
      if (deck.user_id !== userId) {
        return forbiddenResponse('Only the deck owner can delete this deck');
      }

      const deleted = deleteDeck(id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete deck' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError('DELETE /api/decks/[id]', error, 'Failed to delete deck');
    }
  }
);
