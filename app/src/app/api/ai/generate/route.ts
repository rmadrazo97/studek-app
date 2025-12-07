/**
 * AI Generation API Route
 *
 * POST /api/ai/generate - Generate decks or cards using AI
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  isOpenAIConfigured,
  generateDeck,
  generateCards,
  type CreateDeckToolResult,
  type AddCardsToolResult,
} from '@/lib/ai';
import {
  createDeck,
  getDeckById,
  getDeckWithStats,
} from '@/lib/db/services/decks';
import { createCard } from '@/lib/db/services/cards';
import type { DeckCategory } from '@/lib/db/types';

// ============================================
// Types
// ============================================

interface GenerateRequest {
  prompt: string;
  deck_id?: string | null;
  options?: {
    save?: boolean;
    is_public?: boolean;
  };
}

interface GenerateResponse {
  success: boolean;
  action: 'create_deck' | 'add_cards';
  deck?: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
  };
  cards: Array<{
    id?: string;
    front: string;
    back: string;
    tags?: string[];
  }>;
  message: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Route Handler
// ============================================

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI generation is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const userId = request.auth.userId;
    const body = (await request.json()) as GenerateRequest;

    // Validate request
    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim();
    const deckId = body.deck_id || null;
    const shouldSave = body.options?.save !== false; // Default to true
    const isPublic = body.options?.is_public ?? false;

    let response: GenerateResponse;

    if (deckId) {
      // Adding cards to existing deck
      const existingDeck = getDeckWithStats(deckId);

      if (!existingDeck) {
        return NextResponse.json(
          { error: 'Deck not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (existingDeck.user_id !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to modify this deck' },
          { status: 403 }
        );
      }

      console.log(`[AI] Generating cards for deck: ${existingDeck.name}`);

      const { result, usage } = await generateCards(prompt, {
        name: existingDeck.name,
        description: existingDeck.description || undefined,
        existingCardCount: existingDeck.card_count,
      });

      const savedCards: Array<{ id: string; front: string; back: string; tags?: string[] }> = [];

      if (shouldSave) {
        // Save cards to database
        for (const card of result.cards) {
          const savedCard = createCard({
            deck_id: deckId,
            front: card.front,
            back: card.back,
            tags: card.tags || null,
          });
          savedCards.push({
            id: savedCard.id,
            front: savedCard.front,
            back: savedCard.back,
            tags: card.tags,
          });
        }
      }

      response = {
        success: true,
        action: 'add_cards',
        deck: {
          id: existingDeck.id,
          name: existingDeck.name,
          description: existingDeck.description,
          category: existingDeck.category,
        },
        cards: shouldSave ? savedCards : result.cards.map(c => ({
          front: c.front,
          back: c.back,
          tags: c.tags,
        })),
        message: result.message,
        usage,
      };

      console.log(`[AI] Generated ${result.cards.length} cards for deck ${deckId}`);

    } else {
      // Creating a new deck
      console.log(`[AI] Generating new deck from prompt: ${prompt.substring(0, 50)}...`);

      const { result, usage } = await generateDeck(prompt);

      let savedDeck: { id: string; name: string; description: string | null; category: string | null } | null = null;
      const savedCards: Array<{ id: string; front: string; back: string; tags?: string[] }> = [];

      if (shouldSave) {
        // Create the deck
        const deck = createDeck({
          user_id: userId,
          name: result.deck.name,
          description: result.deck.description || null,
          category: (result.deck.category as DeckCategory) || null,
          is_public: isPublic,
        });

        savedDeck = {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          category: deck.category,
        };

        // Create cards
        for (const card of result.cards) {
          const savedCard = createCard({
            deck_id: deck.id,
            front: card.front,
            back: card.back,
            tags: card.tags || null,
          });
          savedCards.push({
            id: savedCard.id,
            front: savedCard.front,
            back: savedCard.back,
            tags: card.tags,
          });
        }
      }

      response = {
        success: true,
        action: 'create_deck',
        deck: savedDeck || {
          id: '',
          name: result.deck.name,
          description: result.deck.description || null,
          category: result.deck.category || null,
        },
        cards: shouldSave ? savedCards : result.cards.map(c => ({
          front: c.front,
          back: c.back,
          tags: c.tags,
        })),
        message: result.message,
        usage,
      };

      console.log(`[AI] Created deck "${result.deck.name}" with ${result.cards.length} cards`);
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    return handleApiError('POST /api/ai/generate', error, 'Failed to generate content');
  }
});

// ============================================
// GET - Check AI Status
// ============================================

export async function GET() {
  return NextResponse.json({
    configured: isOpenAIConfigured(),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
}
