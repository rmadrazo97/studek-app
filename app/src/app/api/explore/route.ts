/**
 * GET /api/explore - Get public decks for exploration
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/errors';
import {
  getPublicDecksWithAuthor,
  getCategoriesWithCounts,
  getFeaturedDecks,
} from '@/lib/db/services';
import type { DeckCategory } from '@/lib/db/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as DeckCategory | null;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const featured = searchParams.get('featured') === 'true';

    // Get featured decks if requested
    if (featured) {
      const featuredDecks = getFeaturedDecks(6);
      return NextResponse.json({ featured: featuredDecks });
    }

    // Get categories with counts
    const categories = getCategoriesWithCounts();

    // Get decks
    const { decks, total } = getPublicDecksWithAuthor({
      category: category || undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      decks,
      categories,
      total,
      limit,
      offset,
      hasMore: offset + decks.length < total,
    });
  } catch (error) {
    return handleApiError('GET /api/explore', error, 'Failed to fetch public decks');
  }
}
