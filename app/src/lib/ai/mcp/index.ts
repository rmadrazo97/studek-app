/**
 * MCP (Model Context Protocol) Module
 *
 * Exports schemas and tools for structured AI interactions
 * with deck and card operations using Topic Rotation algorithm.
 */

// Schemas
export {
  // Topic Group schemas (for Topic Rotation algorithm)
  TopicGroupSchema,
  TopicGroupsArraySchema,
  type TopicGroupInput,
  // Card schemas
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
} from './schemas';

// Tools
export {
  createDeckTool,
  addCardsTool,
  deckGenerationTools,
  createDeckTools,
  addCardsTools,
  parseToolCall,
  type TopicGroup,
  type CreateDeckToolResult,
  type AddCardsToolResult,
} from './tools';
