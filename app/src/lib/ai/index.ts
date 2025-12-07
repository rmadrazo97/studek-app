/**
 * AI Module
 *
 * Provides AI-powered deck and card generation using OpenAI.
 * Exports client, prompts, MCP tools, and generation utilities.
 */

// OpenAI Client
export {
  getOpenAIClient,
  isOpenAIConfigured,
  generateChatCompletion,
  generateWithTools,
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
  type ChatMessage,
  type GenerateOptions,
  type GenerateResult,
} from './openai';

// MCP Tools and Schemas
export {
  // Schemas
  CardSchema,
  CardsArraySchema,
  DeckMetadataSchema,
  CreateDeckSchema,
  AddCardsSchema,
  GenerationResponseSchema,
  validateCard,
  validateCards,
  validateCreateDeck,
  validateAddCards,
  validateGenerationResponse,
  suggestCategory,
  type CardInput,
  type DeckMetadataInput,
  type CreateDeckInput,
  type AddCardsInput,
  type GenerationResponse,
  // Tools
  createDeckTool,
  addCardsTool,
  deckGenerationTools,
  createDeckTools,
  addCardsTools,
  parseToolCall,
  type CreateDeckToolResult,
  type AddCardsToolResult,
} from './mcp';

// Prompts
export {
  SPACED_REPETITION_CONTEXT,
  CARD_CREATION_GUIDELINES,
  DECK_GENERATION_SYSTEM_PROMPT,
  buildSystemPrompt,
  buildCreateDeckPrompt,
  buildAddCardsPrompt,
  // Templates
  type PromptTemplate,
  allTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateCategories,
} from './prompts';

// ============================================
// High-Level Generation Functions
// ============================================

import { generateWithTools, type ChatMessage } from './openai';
import { createDeckTools, addCardsTools, type CreateDeckToolResult, type AddCardsToolResult } from './mcp';
import { buildSystemPrompt, buildCreateDeckPrompt, buildAddCardsPrompt } from './prompts';

/**
 * Generate a new deck with cards from a user prompt
 */
export async function generateDeck(
  userPrompt: string
): Promise<{ result: CreateDeckToolResult; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildCreateDeckPrompt(userPrompt) },
  ];

  return generateWithTools<CreateDeckToolResult>(messages, createDeckTools);
}

/**
 * Generate cards to add to an existing deck
 */
export async function generateCards(
  userPrompt: string,
  deckContext: { name: string; description?: string; existingCardCount: number }
): Promise<{ result: AddCardsToolResult; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildAddCardsPrompt(userPrompt, deckContext) },
  ];

  return generateWithTools<AddCardsToolResult>(messages, addCardsTools);
}
