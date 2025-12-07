/**
 * MCP Schemas for Deck and Card Operations
 *
 * Defines the structured schemas for AI-generated decks and cards.
 * These schemas ensure consistent output format from the AI.
 */

import { z } from 'zod';
import { DECK_CATEGORIES, type DeckCategory } from '@/lib/db/types';

// ============================================
// Topic Group Schema
// ============================================

/**
 * Schema for a topic group (used in Topic Rotation algorithm)
 */
export const TopicGroupSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Topic group ID must be lowercase with hyphens only')
    .describe('The topic group identifier (lowercase with hyphens)'),
  name: z
    .string()
    .min(1)
    .describe('Human-readable name for this topic group'),
  card_count: z
    .number()
    .optional()
    .describe('Number of cards in this topic group'),
  complexity: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('Overall complexity of this topic group (high = needs more frequent review)'),
});

export type TopicGroupInput = z.infer<typeof TopicGroupSchema>;

/**
 * Schema for multiple topic groups
 */
export const TopicGroupsArraySchema = z.array(TopicGroupSchema);

// ============================================
// Card Schemas
// ============================================

/**
 * Schema for a single flashcard with topic group for Topic Rotation
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
  topic_group: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Topic group must be lowercase with hyphens only')
    .describe('The topic group this card belongs to (REQUIRED for Topic Rotation scheduling)'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional tags to further categorize the card'),
  difficulty_hint: z
    .enum(['easy', 'medium', 'hard'])
    .optional()
    .describe('Suggested initial difficulty for this specific card'),
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
 * Schema for creating a new deck with cards (Topic Rotation enabled)
 */
export const CreateDeckSchema = z.object({
  deck: DeckMetadataSchema,
  topic_groups: TopicGroupsArraySchema.optional()
    .describe('Summary of topic groups in this deck for the rotation schedule'),
  cards: CardsArraySchema,
});

export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

/**
 * Schema for adding cards to an existing deck (Topic Rotation enabled)
 */
export const AddCardsSchema = z.object({
  new_topic_groups: TopicGroupsArraySchema.optional()
    .describe('Any new topic groups being introduced'),
  cards: CardsArraySchema,
});

export type AddCardsInput = z.infer<typeof AddCardsSchema>;

// ============================================
// Response Schemas
// ============================================

/**
 * Schema for AI generation response (with Topic Rotation support)
 */
export const GenerationResponseSchema = z.object({
  action: z.enum(['create_deck', 'add_cards']),
  deck: DeckMetadataSchema.optional(),
  topic_groups: TopicGroupsArraySchema.optional()
    .describe('Topic groups for rotation scheduling'),
  cards: CardsArraySchema,
  message: z.string().describe('A brief message summarizing what was generated and the rotation schedule'),
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
