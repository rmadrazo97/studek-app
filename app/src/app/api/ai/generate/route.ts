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
  generateDeckFromSource,
  generateCardsFromSource,
  type CreateDeckToolResult,
  type AddCardsToolResult,
  type SourceInfo,
} from '@/lib/ai';
import {
  createDeck,
  getDeckById,
  getDeckWithStats,
} from '@/lib/db/services/decks';
import { createCard } from '@/lib/db/services/cards';
import type { DeckCategory } from '@/lib/db/types';
import { assertDeckCreationAllowed, PlanLimitError, planLimitToResponse } from '@/lib/billing/limits';

// ============================================
// Types
// ============================================

interface SourceInput {
  type: 'youtube' | 'pdf' | 'url';
  content: string;
  title?: string;
  url?: string;
}

interface GenerateRequest {
  prompt?: string;
  deck_id?: string | null;
  source?: SourceInput;
  focus_prompt?: string;
  options?: {
    save?: boolean;
    is_public?: boolean;
  };
}

interface TopicGroupInfo {
  id: string;
  name: string;
  card_count?: number;
  complexity?: 'low' | 'medium' | 'high';
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
  topic_groups?: TopicGroupInfo[];
  cards: Array<{
    id?: string;
    front: string;
    back: string;
    topic_group?: string;
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
  console.log('[AI Route] POST /api/ai/generate - Request received');
  console.log('[AI Route] Auth context:', JSON.stringify({
    userId: request.auth?.userId,
    email: request.auth?.email,
    roles: request.auth?.roles,
  }));
  console.log('[AI Route] User:', JSON.stringify({
    id: request.user?.id,
    email: request.user?.email,
  }));

  try {
    // Check if OpenAI is configured
    console.log('[AI Route] Checking OpenAI configuration...');
    console.log('[AI Route] OPENAI_APIKEY env present:', !!process.env.OPENAI_APIKEY);
    console.log('[AI Route] OPENAI_APIKEY preview:', process.env.OPENAI_APIKEY ? `${process.env.OPENAI_APIKEY.substring(0, 10)}...` : 'not set');

    if (!isOpenAIConfigured()) {
      console.log('[AI Route] OpenAI not configured - returning 503');
      return NextResponse.json(
        { error: 'AI generation is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const userId = request.auth.userId;
    console.log('[AI Route] Processing request for userId:', userId);

    const body = (await request.json()) as GenerateRequest;
    console.log('[AI Route] Request body:', JSON.stringify({
      prompt: body.prompt?.substring(0, 50),
      deck_id: body.deck_id,
      source: body.source ? { type: body.source.type, hasContent: !!body.source.content } : null,
      focus_prompt: body.focus_prompt?.substring(0, 50),
      options: body.options,
    }));

    // Validate request - either prompt or source is required
    const hasPrompt = body.prompt && typeof body.prompt === 'string' && body.prompt.trim() !== '';
    const hasSource = body.source && body.source.type && body.source.content;

    if (!hasPrompt && !hasSource) {
      return NextResponse.json(
        { error: 'Either prompt or source is required' },
        { status: 400 }
      );
    }

    const prompt = body.prompt?.trim() || '';
    const deckId = body.deck_id || null;
    const shouldSave = body.options?.save !== false; // Default to true
    const isPublic = body.options?.is_public ?? false;
    const source = body.source;
    const focusPrompt = body.focus_prompt?.trim();

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

      let result: AddCardsToolResult;
      let usage: { promptTokens: number; completionTokens: number; totalTokens: number };

      if (source) {
        // Generate from source material
        const sourceInfo: SourceInfo = {
          type: source.type,
          content: source.content,
          title: source.title,
          url: source.url,
        };
        console.log(`[AI] Using source-based generation from ${source.type}`);
        const generated = await generateCardsFromSource(sourceInfo, {
          name: existingDeck.name,
          description: existingDeck.description || undefined,
          existingCardCount: existingDeck.card_count,
        }, focusPrompt);
        result = generated.result;
        usage = generated.usage;
      } else {
        // Generate from text prompt
        const generated = await generateCards(prompt, {
          name: existingDeck.name,
          description: existingDeck.description || undefined,
          existingCardCount: existingDeck.card_count,
        });
        result = generated.result;
        usage = generated.usage;
      }

      const savedCards: Array<{ id: string; front: string; back: string; tags?: string[] }> = [];

      if (shouldSave) {
        // Save cards to database
        // Store topic_group as a special tag with "topic:" prefix for Topic Rotation algorithm
        for (const card of result.cards) {
          const allTags = card.tags ? [...card.tags] : [];
          // Add topic_group as a special tag if present
          if (card.topic_group) {
            allTags.unshift(`topic:${card.topic_group}`);
          }

          const savedCard = createCard({
            deck_id: deckId,
            type: 'basic',
            front: card.front,
            back: card.back,
            tags: allTags.length > 0 ? allTags : null,
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
        topic_groups: result.new_topic_groups,
        cards: shouldSave ? savedCards : result.cards.map(c => ({
          front: c.front,
          back: c.back,
          topic_group: c.topic_group,
          tags: c.tags,
        })),
        message: result.message,
        usage,
      };

      console.log(`[AI] Generated ${result.cards.length} cards for deck ${deckId}`);

    } else {
      // Creating a new deck
      console.log(`[AI] Generating new deck from ${source ? source.type + ' source' : 'prompt'}`);

      let result: CreateDeckToolResult;
      let usage: { promptTokens: number; completionTokens: number; totalTokens: number };

      if (source) {
        // Generate from source material
        const sourceInfo: SourceInfo = {
          type: source.type,
          content: source.content,
          title: source.title,
          url: source.url,
        };
        console.log(`[AI] Using source-based generation from ${source.type}${focusPrompt ? ' with focus prompt' : ''}`);
        const generated = await generateDeckFromSource(sourceInfo, focusPrompt);
        result = generated.result;
        usage = generated.usage;
      } else {
        // Generate from text prompt
        const generated = await generateDeck(prompt);
        result = generated.result;
        usage = generated.usage;
      }

      let savedDeck: { id: string; name: string; description: string | null; category: string | null } | null = null;
      const savedCards: Array<{ id: string; front: string; back: string; tags?: string[] }> = [];

      if (shouldSave) {
        assertDeckCreationAllowed(userId, { isAiGenerated: true });

        // Create the deck
        const deck = createDeck({
          user_id: userId,
          name: result.deck.name,
          description: result.deck.description || null,
          category: (result.deck.category as DeckCategory) || null,
          is_public: isPublic,
          is_ai_generated: true,
        });

        savedDeck = {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          category: deck.category,
        };

        // Create cards with topic_group stored as special tag for Topic Rotation
        for (const card of result.cards) {
          const allTags = card.tags ? [...card.tags] : [];
          // Add topic_group as a special tag if present
          if (card.topic_group) {
            allTags.unshift(`topic:${card.topic_group}`);
          }

          const savedCard = createCard({
            deck_id: deck.id,
            type: 'basic',
            front: card.front,
            back: card.back,
            tags: allTags.length > 0 ? allTags : null,
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
        topic_groups: result.topic_groups,
        cards: shouldSave ? savedCards : result.cards.map(c => ({
          front: c.front,
          back: c.back,
          topic_group: c.topic_group,
          tags: c.tags,
        })),
        message: result.message,
        usage,
      };

      console.log(`[AI] Created deck "${result.deck.name}" with ${result.cards.length} cards`);
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(planLimitToResponse(error), { status: error.statusCode });
    }
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
