/**
 * MCP Schemas for Deck and Card Operations
 *
 * Defines the structured schemas for AI-generated decks and cards.
 * These schemas ensure consistent output format from the AI.
 */

import { z } from 'zod';
import { DECK_CATEGORIES, type DeckCategory } from '@/lib/db/types';

// ============================================
// Card Schemas
// ============================================

/**
 * Schema for a single flashcard
 */
export const CardSchema = z.object({
  front: z
    .string()
    .min(1)
    .describe('The question or prompt shown on the front of the card'),
  back: z
    .string()
    .min(1)
    .describe('The answer or information shown on the back of the card'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional tags to categorize the card'),
  difficulty_hint: z
    .enum(['easy', 'medium', 'hard'])
    .optional()
    .describe('Suggested initial difficulty for spaced repetition scheduling'),
});

export type CardInput = z.infer<typeof CardSchema>;

/**
 * Schema for multiple cards
 */
export const CardsArraySchema = z.array(CardSchema).min(1);

// ============================================
// Deck Schemas
// ============================================

/**
 * Schema for deck metadata
 */
export const DeckMetadataSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe('A clear, descriptive name for the deck'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('A brief description of what this deck covers'),
  category: z
    .enum(DECK_CATEGORIES)
    .optional()
    .describe('The category that best fits this deck content'),
});

export type DeckMetadataInput = z.infer<typeof DeckMetadataSchema>;

/**
 * Schema for creating a new deck with cards
 */
export const CreateDeckSchema = z.object({
  deck: DeckMetadataSchema,
  cards: CardsArraySchema,
});

export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

/**
 * Schema for adding cards to an existing deck
 */
export const AddCardsSchema = z.object({
  cards: CardsArraySchema,
});

export type AddCardsInput = z.infer<typeof AddCardsSchema>;

// ============================================
// Response Schemas
// ============================================

/**
 * Schema for AI generation response
 */
export const GenerationResponseSchema = z.object({
  action: z.enum(['create_deck', 'add_cards']),
  deck: DeckMetadataSchema.optional(),
  cards: CardsArraySchema,
  message: z.string().describe('A brief message summarizing what was generated'),
});

export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate a card input
 */
export function validateCard(data: unknown): CardInput {
  return CardSchema.parse(data);
}

/**
 * Validate cards array
 */
export function validateCards(data: unknown): CardInput[] {
  return CardsArraySchema.parse(data);
}

/**
 * Validate deck creation input
 */
export function validateCreateDeck(data: unknown): CreateDeckInput {
  return CreateDeckSchema.parse(data);
}

/**
 * Validate add cards input
 */
export function validateAddCards(data: unknown): AddCardsInput {
  return AddCardsSchema.parse(data);
}

/**
 * Validate generation response
 */
export function validateGenerationResponse(data: unknown): GenerationResponse {
  return GenerationResponseSchema.parse(data);
}

// ============================================
// Category Helpers
// ============================================

/**
 * Get category suggestions based on content
 */
export function suggestCategory(content: string): DeckCategory | undefined {
  const lowerContent = content.toLowerCase();

  const categoryKeywords: Record<DeckCategory, string[]> = {
    languages: ['language', 'vocabulary', 'grammar', 'spanish', 'french', 'japanese', 'english', 'german', 'chinese', 'korean', 'words', 'phrases'],
    medicine: ['medicine', 'medical', 'anatomy', 'disease', 'drug', 'pharmacology', 'health', 'clinical', 'patient', 'diagnosis'],
    science: ['science', 'biology', 'chemistry', 'physics', 'scientific', 'experiment', 'lab', 'molecule', 'atom', 'cell'],
    mathematics: ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'equation', 'formula', 'theorem', 'statistics'],
    history: ['history', 'historical', 'war', 'century', 'ancient', 'medieval', 'president', 'revolution', 'civilization'],
    geography: ['geography', 'capital', 'country', 'city', 'continent', 'river', 'mountain', 'ocean', 'map', 'location'],
    programming: ['programming', 'code', 'coding', 'software', 'javascript', 'python', 'algorithm', 'data structure', 'api', 'development'],
    business: ['business', 'marketing', 'finance', 'accounting', 'management', 'economics', 'investment', 'startup'],
    law: ['law', 'legal', 'court', 'constitution', 'rights', 'contract', 'criminal', 'civil'],
    arts: ['art', 'painting', 'sculpture', 'artist', 'museum', 'design', 'creative', 'visual'],
    music: ['music', 'musical', 'composer', 'instrument', 'song', 'melody', 'rhythm', 'note', 'chord'],
    literature: ['literature', 'book', 'novel', 'author', 'poetry', 'poem', 'writer', 'story', 'character'],
    philosophy: ['philosophy', 'philosopher', 'ethics', 'logic', 'metaphysics', 'epistemology', 'thought'],
    psychology: ['psychology', 'psychological', 'behavior', 'cognitive', 'mental', 'brain', 'mind', 'therapy'],
    'test-prep': ['test', 'exam', 'sat', 'gre', 'gmat', 'mcat', 'lsat', 'certification', 'preparation'],
    other: [],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      return category as DeckCategory;
    }
  }

  return undefined;
}
