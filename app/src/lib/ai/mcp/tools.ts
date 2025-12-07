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
 */
export const createDeckTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_deck',
    description: 'Create a new flashcard deck with cards for spaced repetition learning',
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
        cards: {
          type: 'array',
          description: 'The flashcards to include in the deck',
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
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to categorize the card',
              },
              difficulty_hint: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                description: 'Suggested initial difficulty for scheduling',
              },
            },
            required: ['front', 'back'],
          },
          minItems: 1,
        },
        message: {
          type: 'string',
          description: 'A brief, friendly message summarizing what was created',
        },
      },
      required: ['deck', 'cards', 'message'],
    },
  },
};

/**
 * Tool for adding cards to an existing deck
 */
export const addCardsTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'add_cards',
    description: 'Add new flashcards to an existing deck',
    parameters: {
      type: 'object',
      properties: {
        cards: {
          type: 'array',
          description: 'The flashcards to add to the deck',
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
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to categorize the card',
              },
              difficulty_hint: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                description: 'Suggested initial difficulty for scheduling',
              },
            },
            required: ['front', 'back'],
          },
          minItems: 1,
        },
        message: {
          type: 'string',
          description: 'A brief, friendly message summarizing what was added',
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

export interface CreateDeckToolResult {
  deck: {
    name: string;
    description?: string;
    category?: string;
  };
  cards: Array<{
    front: string;
    back: string;
    tags?: string[];
    difficulty_hint?: 'easy' | 'medium' | 'hard';
  }>;
  message: string;
}

export interface AddCardsToolResult {
  cards: Array<{
    front: string;
    back: string;
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
