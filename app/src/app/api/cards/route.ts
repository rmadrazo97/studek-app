/**
 * GET /api/cards - Search cards across all decks
 * POST /api/cards - Bulk create cards (with deck_id in body)
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db';
import { createCards, getDeckById, userHasAccessToDeck } from '@/lib/db/services';
import type { Card, CardCreate } from '@/lib/db/types';

/**
 * GET /api/cards
 * Search cards across user's decks
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDatabase();

    let sql = `
      SELECT c.*, d.name as deck_name
      FROM cards c
      JOIN decks d ON d.id = c.deck_id
      WHERE d.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (search) {
      sql += ` AND (c.front LIKE ? OR c.back LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countSql = sql.replace('SELECT c.*, d.name as deck_name', 'SELECT COUNT(*) as count');
    const countResult = db.prepare(countSql).get(...params) as { count: number };
    const total = countResult.count;

    // Add pagination
    sql += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const cards = db.prepare(sql).all(...params) as Array<Card & { deck_name: string }>;

    return NextResponse.json({
      cards: cards.map((c) => ({
        ...c,
        tags: JSON.parse(c.tags || '[]'),
      })),
      total,
      limit,
      offset,
      hasMore: offset + cards.length < total,
    });
  } catch (error) {
    console.error('[API] GET /api/cards error:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/cards
 * Bulk create cards (deck_id must be in each card object)
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const body = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Request body must be a non-empty array of cards' },
        { status: 400 }
      );
    }

    // Validate all cards and check deck access
    const deckIds = new Set<string>();
    for (const card of body) {
      if (!card.deck_id) {
        return NextResponse.json(
          { error: 'Each card must have a deck_id' },
          { status: 400 }
        );
      }
      deckIds.add(card.deck_id);
    }

    // Verify access to all decks
    for (const deckId of deckIds) {
      const deck = getDeckById(deckId);
      if (!deck) {
        return NextResponse.json(
          { error: `Deck not found: ${deckId}` },
          { status: 404 }
        );
      }
      const access = userHasAccessToDeck(userId, deckId);
      if (!access.hasAccess || (access.permission !== 'owner' && access.permission !== 'write' && access.permission !== 'admin')) {
        return NextResponse.json(
          { error: `No write access to deck: ${deckId}` },
          { status: 403 }
        );
      }
    }

    // Validate card data
    const validCards: CardCreate[] = body.map((c: Partial<CardCreate> & { deck_id: string }) => {
      if (!c.front || typeof c.front !== 'string') {
        throw new Error('Card front is required');
      }
      if (!c.back || typeof c.back !== 'string') {
        throw new Error('Card back is required');
      }
      return {
        deck_id: c.deck_id,
        type: c.type || 'basic',
        front: c.front.trim(),
        back: c.back.trim(),
        media_type: c.media_type,
        media_url: c.media_url,
        tags: c.tags || [],
      };
    });

    const createdCards = createCards(validCards);

    return NextResponse.json(createdCards, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/cards error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create cards' },
      { status: 500 }
    );
  }
});
