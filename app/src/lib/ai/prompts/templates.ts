/**
 * Prompt Templates for Specific Use Cases
 *
 * Pre-built templates for common flashcard creation scenarios.
 */

// ============================================
// Template Types
// ============================================

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  exampleInput: string;
}

// ============================================
// Language Learning Templates
// ============================================

export const vocabularyTemplate: PromptTemplate = {
  id: 'vocabulary',
  name: 'Vocabulary Builder',
  description: 'Learn vocabulary words with definitions and example sentences',
  category: 'languages',
  promptTemplate: `Create a vocabulary deck for learning {{language}} words.
Focus on: {{focus}}
Level: {{level}}

For each word, create a card with:
- Front: The word in {{language}}
- Back: English translation with a brief example sentence`,
  exampleInput: 'Create a deck of 20 common Spanish verbs for beginners',
};

export const phrasesTemplate: PromptTemplate = {
  id: 'phrases',
  name: 'Useful Phrases',
  description: 'Learn common phrases and expressions',
  category: 'languages',
  promptTemplate: `Create a deck of useful {{language}} phrases for {{situation}}.
Include common expressions that native speakers use.

For each phrase:
- Front: The phrase in {{language}}
- Back: English translation and when to use it`,
  exampleInput: 'Create a deck of Japanese phrases for traveling',
};

// ============================================
// Geography Templates
// ============================================

export const capitalsTemplate: PromptTemplate = {
  id: 'capitals',
  name: 'World Capitals',
  description: 'Learn capital cities of countries',
  category: 'geography',
  promptTemplate: `Create a deck to learn the capital cities of {{region}}.
Include all countries in this region.

For each card:
- Front: What is the capital of [Country]?
- Back: [Capital City]`,
  exampleInput: 'Create a deck with the capitals of South America',
};

export const countriesTemplate: PromptTemplate = {
  id: 'countries',
  name: 'Country Facts',
  description: 'Learn key facts about countries',
  category: 'geography',
  promptTemplate: `Create a deck about {{region}} countries.
Include facts about: population, language, currency, notable features.

Create multiple cards per country covering different aspects.`,
  exampleInput: 'Create a deck about European Union countries',
};

// ============================================
// History Templates
// ============================================

export const historicalFiguresTemplate: PromptTemplate = {
  id: 'historical-figures',
  name: 'Historical Figures',
  description: 'Learn about important people in history',
  category: 'history',
  promptTemplate: `Create a deck about {{topic}} historical figures.
For each person, include cards about:
- Who they were and when they lived
- Their major achievements or contributions
- Why they're historically significant`,
  exampleInput: 'Create a deck to learn the presidents of the USA',
};

export const historicalEventsTemplate: PromptTemplate = {
  id: 'historical-events',
  name: 'Historical Events',
  description: 'Learn about significant events in history',
  category: 'history',
  promptTemplate: `Create a deck about {{topic}}.
For each event, include cards about:
- When and where it happened
- Key figures involved
- Causes and consequences`,
  exampleInput: 'Create a deck about World War II major battles',
};

// ============================================
// Science Templates
// ============================================

export const scientificConceptsTemplate: PromptTemplate = {
  id: 'scientific-concepts',
  name: 'Scientific Concepts',
  description: 'Learn scientific terms and concepts',
  category: 'science',
  promptTemplate: `Create a deck about {{topic}} concepts.
For each concept:
- Front: A clear question about the concept
- Back: A concise, accurate explanation`,
  exampleInput: 'Create a deck about cell biology basics',
};

export const elementsTemplate: PromptTemplate = {
  id: 'elements',
  name: 'Chemical Elements',
  description: 'Learn the periodic table',
  category: 'science',
  promptTemplate: `Create a deck about chemical elements.
Focus on: {{focus}}
Include: symbol, atomic number, and key properties.`,
  exampleInput: 'Create a deck for the first 20 elements of the periodic table',
};

// ============================================
// Programming Templates
// ============================================

export const programmingConceptsTemplate: PromptTemplate = {
  id: 'programming-concepts',
  name: 'Programming Concepts',
  description: 'Learn programming terminology and concepts',
  category: 'programming',
  promptTemplate: `Create a deck about {{topic}} programming concepts.
For each concept:
- Front: What is [concept]?
- Back: Clear definition with a brief example if applicable`,
  exampleInput: 'Create a deck about JavaScript array methods',
};

export const syntaxTemplate: PromptTemplate = {
  id: 'syntax',
  name: 'Language Syntax',
  description: 'Learn programming language syntax',
  category: 'programming',
  promptTemplate: `Create a deck for {{language}} syntax and patterns.
Focus on: {{focus}}
Include practical code examples where helpful.`,
  exampleInput: 'Create a deck for Python list comprehensions',
};

// ============================================
// Medical Templates
// ============================================

export const medicalTermsTemplate: PromptTemplate = {
  id: 'medical-terms',
  name: 'Medical Terminology',
  description: 'Learn medical vocabulary and terms',
  category: 'medicine',
  promptTemplate: `Create a deck about {{topic}} medical terminology.
For each term:
- Front: The medical term
- Back: Definition, etymology if helpful, and clinical relevance`,
  exampleInput: 'Create a deck about common cardiac terminology',
};

export const anatomyTemplate: PromptTemplate = {
  id: 'anatomy',
  name: 'Human Anatomy',
  description: 'Learn anatomical structures and systems',
  category: 'medicine',
  promptTemplate: `Create a deck about {{topic}} anatomy.
Include: structure names, locations, and functions.`,
  exampleInput: 'Create a deck about the bones of the human skeleton',
};

// ============================================
// Template Registry
// ============================================

export const allTemplates: PromptTemplate[] = [
  // Languages
  vocabularyTemplate,
  phrasesTemplate,
  // Geography
  capitalsTemplate,
  countriesTemplate,
  // History
  historicalFiguresTemplate,
  historicalEventsTemplate,
  // Science
  scientificConceptsTemplate,
  elementsTemplate,
  // Programming
  programmingConceptsTemplate,
  syntaxTemplate,
  // Medical
  medicalTermsTemplate,
  anatomyTemplate,
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return allTemplates.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return allTemplates.find(t => t.id === id);
}

/**
 * Get all available categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(allTemplates.map(t => t.category))];
}
