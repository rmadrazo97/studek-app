/**
 * GET /api/cards/[id] - Get a single card
 * PATCH /api/cards/[id] - Update a card
 * DELETE /api/cards/[id] - Delete a card
 */

import { NextResponse } from 'next/server';
import {
  withAuth,
  type AuthenticatedRequest,
  forbiddenResponse,
} from '@/lib/auth/middleware';
import {
  getCardById,
  getCardWithFSRS,
  getDeckById,
  updateCard,
  deleteCard,
  userHasAccessToDeck,
} from '@/lib/db/services';
import type { CardUpdate } from '@/lib/db/types';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/cards/[id]
 * Get a single card with FSRS data
 */
export const GET = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Get the card
      const card = getCardWithFSRS(id);
      if (!card) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      // Check access to the deck
      const access = userHasAccessToDeck(userId, card.deck_id);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this card');
      }

      return NextResponse.json({
        ...card,
        tags: JSON.parse(card.tags || '[]'),
        permission: access.permission,
      });
    } catch (error) {
      console.error('[API] GET /api/cards/[id] error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch card' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/cards/[id]
 * Update a card
 */
export const PATCH = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Get the card
      const card = getCardById(id);
      if (!card) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      // Check access to the deck
      const access = userHasAccessToDeck(userId, card.deck_id);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this card');
      }

      // Need write permission to update
      if (access.permission !== 'owner' && access.permission !== 'write' && access.permission !== 'admin') {
        return forbiddenResponse('You do not have permission to edit this card');
      }

      const body = (await request.json()) as CardUpdate;

      // Validate update data
      const updateData: CardUpdate = {};
      if (body.type !== undefined) {
        if (!['basic', 'cloze', 'image-occlusion'].includes(body.type)) {
          return NextResponse.json(
            { error: 'Invalid card type' },
            { status: 400 }
          );
        }
        updateData.type = body.type;
      }
      if (body.front !== undefined) {
        if (typeof body.front !== 'string' || body.front.trim() === '') {
          return NextResponse.json(
            { error: 'Card front cannot be empty' },
            { status: 400 }
          );
        }
        updateData.front = body.front.trim();
      }
      if (body.back !== undefined) {
        if (typeof body.back !== 'string' || body.back.trim() === '') {
          return NextResponse.json(
            { error: 'Card back cannot be empty' },
            { status: 400 }
          );
        }
        updateData.back = body.back.trim();
      }
      if (body.media_type !== undefined) {
        updateData.media_type = body.media_type;
      }
      if (body.media_url !== undefined) {
        updateData.media_url = body.media_url;
      }
      if (body.tags !== undefined) {
        updateData.tags = body.tags;
      }

      const updatedCard = updateCard(id, updateData);

      return NextResponse.json({
        ...updatedCard,
        tags: updatedCard ? JSON.parse(updatedCard.tags || '[]') : [],
      });
    } catch (error) {
      console.error('[API] PATCH /api/cards/[id] error:', error);
      return NextResponse.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/cards/[id]
 * Delete a card
 */
export const DELETE = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const userId = request.auth.userId;

      // Get the card
      const card = getCardById(id);
      if (!card) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      // Check access to the deck - need owner or admin to delete
      const deck = getDeckById(card.deck_id);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      const access = userHasAccessToDeck(userId, card.deck_id);
      if (!access.hasAccess) {
        return forbiddenResponse('You do not have access to this card');
      }

      // Only owners can delete cards
      if (access.permission !== 'owner' && access.permission !== 'admin') {
        return forbiddenResponse('You do not have permission to delete this card');
      }

      const deleted = deleteCard(id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete card' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[API] DELETE /api/cards/[id] error:', error);
      return NextResponse.json(
        { error: 'Failed to delete card' },
        { status: 500 }
      );
    }
  }
);
