/**
 * APKG Import Module
 *
 * Provides functionality to import Anki deck packages (.apkg files)
 */

export { parseAPKG } from './parser';
export type {
  APKGParseResult,
  ParsedDeck,
  ParsedCard,
  AnkiNote,
  AnkiCard,
  AnkiDeck,
  AnkiModel,
} from './parser';
