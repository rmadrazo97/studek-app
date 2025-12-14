/**
 * Prompts Library
 *
 * Exports all prompt templates and builders for AI deck generation.
 */

// System prompts
export {
  SPACED_REPETITION_CONTEXT,
  CARD_CREATION_GUIDELINES,
  DECK_GENERATION_SYSTEM_PROMPT,
  SOURCE_EXTRACTION_CONTEXT,
  buildSystemPrompt,
  buildSourceBasedSystemPrompt,
  buildCreateDeckPrompt,
  buildAddCardsPrompt,
  buildSourceBasedCreateDeckPrompt,
  buildSourceBasedAddCardsPrompt,
  type SourceType,
  type SourceInfo,
} from './system';

// Templates
export {
  // Types
  type PromptTemplate,
  // Language templates
  vocabularyTemplate,
  phrasesTemplate,
  // Geography templates
  capitalsTemplate,
  countriesTemplate,
  // History templates
  historicalFiguresTemplate,
  historicalEventsTemplate,
  // Science templates
  scientificConceptsTemplate,
  elementsTemplate,
  // Programming templates
  programmingConceptsTemplate,
  syntaxTemplate,
  // Medical templates
  medicalTermsTemplate,
  anatomyTemplate,
  // Registry
  allTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateCategories,
} from './templates';
