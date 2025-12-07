/**
 * MCP Tools for OpenAI Function Calling
 *
 * Defines the tools (functions) that OpenAI can call to create
 * and manage decks and flashcards.
 */

import type OpenAI from 'openai';
import { DECK_CATEGORIES } from '@/lib/db/types';

// ============================================
// Tool Definitions
// ============================================

/**
 * Tool for creating a new deck with cards
 * Uses Topic Rotation Algorithm for spaced repetition
 */
export const createDeckTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_deck',
    description: 'Create a new flashcard deck with cards organized into topic groups for the Topic Rotation spaced repetition system',
    parameters: {
      type: 'object',
      properties: {
        deck: {
          type: 'object',
          description: 'The deck metadata',
          properties: {
            name: {
              type: 'string',
              description: 'A clear, descriptive name for the deck (max 100 characters)',
            },
            description: {
              type: 'string',
              description: 'A brief description of what this deck covers (max 500 characters)',
            },
            category: {
              type: 'string',
              enum: DECK_CATEGORIES,
              description: 'The category that best fits this deck content',
            },
          },
          required: ['name'],
        },
        topic_groups: {
          type: 'array',
          description: 'Summary of topic groups in this deck for the rotation schedule',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The topic group identifier (lowercase with hyphens)',
              },
              name: {
                type: 'string',
                description: 'Human-readable name for this topic group',
              },
              card_count: {
                type: 'number',
                description: 'Number of cards in this topic group',
              },
              complexity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Overall complexity of this topic group (high = needs more frequent review)',
              },
            },
            required: ['id', 'name'],
          },
        },
        cards: {
          type: 'array',
          description: 'The flashcards to include in the deck, organized by topic groups',
          items: {
            type: 'object',
            properties: {
              front: {
                type: 'string',
                description: 'The question or prompt (what the learner sees first)',
              },
              back: {
                type: 'string',
                description: 'The answer (revealed after the learner attempts recall)',
              },
              topic_group: {
                type: 'string',
                description: 'The topic group this card belongs to (REQUIRED for rotation scheduling). Use lowercase with hyphens.',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to further categorize the card',
              },
              difficulty_hint: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                description: 'Suggested initial difficulty for this specific card',
              },
            },
            required: ['front', 'back', 'topic_group'],
          },
          minItems: 1,
        },
        message: {
          type: 'string',
          description: 'A brief, friendly message summarizing what was created and how the topic rotation will work',
        },
      },
      required: ['deck', 'cards', 'message'],
    },
  },
};

/**
 * Tool for adding cards to an existing deck
 * Supports Topic Rotation Algorithm for spaced repetition
 */
export const addCardsTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'add_cards',
    description: 'Add new flashcards to an existing deck, organized into topic groups for the Topic Rotation system',
    parameters: {
      type: 'object',
      properties: {
        new_topic_groups: {
          type: 'array',
          description: 'Any new topic groups being introduced (if cards belong to new topics)',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The topic group identifier (lowercase with hyphens)',
              },
              name: {
                type: 'string',
                description: 'Human-readable name for this topic group',
              },
              complexity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Overall complexity of this topic group',
              },
            },
            required: ['id', 'name'],
          },
        },
        cards: {
          type: 'array',
          description: 'The flashcards to add to the deck, organized by topic groups',
          items: {
            type: 'object',
            properties: {
              front: {
                type: 'string',
                description: 'The question or prompt (what the learner sees first)',
              },
              back: {
                type: 'string',
                description: 'The answer (revealed after the learner attempts recall)',
              },
              topic_group: {
                type: 'string',
                description: 'The topic group this card belongs to (REQUIRED). Can be existing or new. Use lowercase with hyphens.',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to further categorize the card',
              },
              difficulty_hint: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                description: 'Suggested initial difficulty for this specific card',
              },
            },
            required: ['front', 'back', 'topic_group'],
          },
          minItems: 1,
        },
        message: {
          type: 'string',
          description: 'A brief, friendly message summarizing what was added and how it affects the rotation schedule',
        },
      },
      required: ['cards', 'message'],
    },
  },
};

// ============================================
// Tool Collections
// ============================================

/**
 * All available tools for deck generation
 */
export const deckGenerationTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  createDeckTool,
  addCardsTool,
];

/**
 * Tools for creating new decks only
 */
export const createDeckTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  createDeckTool,
];

/**
 * Tools for adding cards only
 */
export const addCardsTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  addCardsTool,
];

// ============================================
// Tool Result Types
// ============================================

export interface TopicGroup {
  id: string;
  name: string;
  card_count?: number;
  complexity?: 'low' | 'medium' | 'high';
}

export interface CreateDeckToolResult {
  deck: {
    name: string;
    description?: string;
    category?: string;
  };
  topic_groups?: TopicGroup[];
  cards: Array<{
    front: string;
    back: string;
    topic_group: string;
    tags?: string[];
    difficulty_hint?: 'easy' | 'medium' | 'hard';
  }>;
  message: string;
}

export interface AddCardsToolResult {
  new_topic_groups?: TopicGroup[];
  cards: Array<{
    front: string;
    back: string;
    topic_group: string;
    tags?: string[];
    difficulty_hint?: 'easy' | 'medium' | 'hard';
  }>;
  message: string;
}

// ============================================
// Tool Parsing
// ============================================

/**
 * Parse a tool call result from OpenAI
 */
export function parseToolCall<T>(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall
): { name: string; result: T } {
  return {
    name: toolCall.function.name,
    result: JSON.parse(toolCall.function.arguments) as T,
  };
}
