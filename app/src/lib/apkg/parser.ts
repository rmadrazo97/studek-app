/**
 * APKG Parser
 *
 * Parses Anki deck packages (.apkg files) and extracts cards.
 *
 * APKG file structure:
 * - collection.anki2 or collection.anki21: SQLite database
 * - media: JSON file mapping numbers to filenames
 * - Numbered files (0, 1, 2...): media files
 */

import Database from 'better-sqlite3';
import { parseZip, extractFile, hasFile, listFiles, type ZipFile } from './zip';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Anki field separator
const FIELD_SEPARATOR = '\x1f';

export interface AnkiNote {
  id: number;
  guid: string;
  mid: number; // model id
  tags: string[];
  fields: string[];
  sortField: string;
}

export interface AnkiCard {
  id: number;
  nid: number; // note id
  did: number; // deck id
  ord: number; // template ordinal
  type: number; // 0=new, 1=learning, 2=review, 3=relearning
  queue: number;
  due: number;
  ivl: number; // interval
  factor: number;
  reps: number;
  lapses: number;
}

export interface AnkiDeck {
  id: number;
  name: string;
  description?: string;
}

export interface AnkiModel {
  id: number;
  name: string;
  type: number; // 0=standard, 1=cloze
  fields: Array<{ name: string; ord: number }>;
  templates: Array<{
    name: string;
    qfmt: string; // question format
    afmt: string; // answer format
    ord: number;
  }>;
}

export interface ParsedCard {
  front: string;
  back: string;
  type: 'basic' | 'cloze';
  tags: string[];
  mediaFiles: string[];
}

export interface ParsedDeck {
  name: string;
  description?: string;
  cards: ParsedCard[];
  mediaFiles: Map<string, Buffer>;
}

export interface APKGParseResult {
  decks: ParsedDeck[];
  totalCards: number;
  totalMedia: number;
}

/**
 * Parse an APKG file buffer
 */
export function parseAPKG(buffer: Buffer): APKGParseResult {
  const zip = parseZip(buffer);

  // Find the SQLite database
  const dbFilename = hasFile(zip, 'collection.anki21')
    ? 'collection.anki21'
    : hasFile(zip, 'collection.anki2')
      ? 'collection.anki2'
      : null;

  if (!dbFilename) {
    throw new Error('Invalid APKG: No collection database found');
  }

  // Extract database to temp file (better-sqlite3 needs a file path)
  const dbBuffer = extractFile(zip, dbFilename);
  const tempDir = join(tmpdir(), `apkg-${randomUUID()}`);
  mkdirSync(tempDir, { recursive: true });
  const tempDbPath = join(tempDir, 'collection.db');
  writeFileSync(tempDbPath, dbBuffer);

  // Parse media mapping
  const mediaMap = parseMediaMap(zip);

  // Extract media files
  const mediaFiles = extractMedia(zip, mediaMap);

  try {
    const db = new Database(tempDbPath, { readonly: true });

    // Parse collection metadata (models, decks)
    const col = db.prepare('SELECT models, decks FROM col').get() as {
      models: string;
      decks: string;
    };

    const models = parseModels(col.models);
    const ankiDecks = parseAnkiDecks(col.decks);

    // Get all notes
    const notes = db.prepare('SELECT id, guid, mid, tags, flds, sfld FROM notes').all() as Array<{
      id: number;
      guid: string;
      mid: number;
      tags: string;
      flds: string;
      sfld: string;
    }>;

    // Get all cards
    const cards = db.prepare('SELECT id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses FROM cards').all() as AnkiCard[];

    // Build note map
    const noteMap = new Map<number, AnkiNote>();
    for (const note of notes) {
      noteMap.set(note.id, {
        id: note.id,
        guid: note.guid,
        mid: note.mid,
        tags: note.tags.trim().split(/\s+/).filter(Boolean),
        fields: note.flds.split(FIELD_SEPARATOR),
        sortField: note.sfld,
      });
    }

    // Group cards by deck
    const deckCards = new Map<number, AnkiCard[]>();
    for (const card of cards) {
      const existing = deckCards.get(card.did) || [];
      existing.push(card);
      deckCards.set(card.did, existing);
    }

    // Build parsed decks
    const parsedDecks: ParsedDeck[] = [];
    let totalCards = 0;

    for (const [deckId, deckCards2] of deckCards) {
      const ankiDeck = ankiDecks.get(deckId);
      if (!ankiDeck) continue;

      // Skip default deck if it's empty or just has the name "Default"
      if (ankiDeck.name === 'Default' && deckCards2.length === 0) continue;

      const parsedCards: ParsedCard[] = [];

      for (const card of deckCards2) {
        const note = noteMap.get(card.nid);
        if (!note) continue;

        const model = models.get(note.mid);
        if (!model) continue;

        const parsedCard = convertCard(note, card, model, mediaMap);
        if (parsedCard) {
          parsedCards.push(parsedCard);
          totalCards++;
        }
      }

      if (parsedCards.length > 0) {
        parsedDecks.push({
          name: cleanDeckName(ankiDeck.name),
          description: ankiDeck.description,
          cards: parsedCards,
          mediaFiles,
        });
      }
    }

    db.close();

    // Cleanup temp file
    try {
      const { unlinkSync, rmdirSync } = require('fs');
      unlinkSync(tempDbPath);
      rmdirSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }

    return {
      decks: parsedDecks,
      totalCards,
      totalMedia: mediaFiles.size,
    };
  } catch (error) {
    // Cleanup on error
    try {
      const { unlinkSync, rmdirSync } = require('fs');
      unlinkSync(tempDbPath);
      rmdirSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Parse models (note types) from JSON
 */
function parseModels(modelsJson: string): Map<number, AnkiModel> {
  const models = new Map<number, AnkiModel>();
  const parsed = JSON.parse(modelsJson);

  for (const [id, model] of Object.entries(parsed)) {
    const m = model as {
      name: string;
      type: number;
      flds: Array<{ name: string; ord: number }>;
      tmpls: Array<{ name: string; qfmt: string; afmt: string; ord: number }>;
    };

    models.set(Number(id), {
      id: Number(id),
      name: m.name,
      type: m.type,
      fields: m.flds.map((f) => ({ name: f.name, ord: f.ord })),
      templates: m.tmpls.map((t) => ({
        name: t.name,
        qfmt: t.qfmt,
        afmt: t.afmt,
        ord: t.ord,
      })),
    });
  }

  return models;
}

/**
 * Parse decks from JSON
 */
function parseAnkiDecks(decksJson: string): Map<number, AnkiDeck> {
  const decks = new Map<number, AnkiDeck>();
  const parsed = JSON.parse(decksJson);

  for (const [id, deck] of Object.entries(parsed)) {
    const d = deck as { name: string; desc?: string };
    decks.set(Number(id), {
      id: Number(id),
      name: d.name,
      description: d.desc,
    });
  }

  return decks;
}

/**
 * Parse media mapping file
 */
function parseMediaMap(zip: ZipFile): Map<string, string> {
  const mediaMap = new Map<string, string>();

  if (!hasFile(zip, 'media')) {
    return mediaMap;
  }

  try {
    const mediaBuffer = extractFile(zip, 'media');
    const mediaJson = JSON.parse(mediaBuffer.toString('utf8'));

    for (const [num, filename] of Object.entries(mediaJson)) {
      mediaMap.set(num, filename as string);
    }
  } catch {
    // Ignore media parsing errors
  }

  return mediaMap;
}

/**
 * Extract media files from ZIP
 */
function extractMedia(zip: ZipFile, mediaMap: Map<string, string>): Map<string, Buffer> {
  const files = new Map<string, Buffer>();

  for (const [num, filename] of mediaMap) {
    try {
      if (hasFile(zip, num)) {
        const buffer = extractFile(zip, num);
        files.set(filename, buffer);
      }
    } catch {
      // Ignore individual file extraction errors
    }
  }

  return files;
}

/**
 * Convert Anki card to our format
 */
function convertCard(
  note: AnkiNote,
  card: AnkiCard,
  model: AnkiModel,
  mediaMap: Map<string, string>
): ParsedCard | null {
  const fields = note.fields;

  // Determine card type
  const isCloze = model.type === 1;

  // For cloze cards, the first field contains the cloze text
  if (isCloze) {
    const front = cleanHtml(fields[0] || '');
    const back = fields.length > 1 ? cleanHtml(fields[1] || '') : '';

    // Extract media references
    const mediaFiles = extractMediaReferences(front + ' ' + back, mediaMap);

    return {
      front: convertClozeFormat(front, card.ord + 1),
      back: back || extractClozeAnswer(front, card.ord + 1),
      type: 'cloze',
      tags: note.tags,
      mediaFiles,
    };
  }

  // For basic cards, use templates to determine front/back
  const template = model.templates.find((t) => t.ord === card.ord);
  if (!template && model.templates.length > 0) {
    // Fallback to first template
  }

  // Simple approach: first field is front, second is back
  const front = cleanHtml(fields[0] || '');
  const back = cleanHtml(fields[1] || '');

  if (!front && !back) return null;

  // Extract media references
  const mediaFiles = extractMediaReferences(front + ' ' + back, mediaMap);

  return {
    front: front || '(empty)',
    back: back || '(empty)',
    type: 'basic',
    tags: note.tags,
    mediaFiles,
  };
}

/**
 * Clean HTML content
 */
function cleanHtml(html: string): string {
  return html
    // Convert <br> and <div> to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    // Remove other HTML tags but keep content
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    // Clean up whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Convert Anki cloze format to our format
 * Anki: {{c1::answer::hint}} -> our format: {{answer}}
 */
function convertClozeFormat(text: string, ordinal: number): string {
  // Replace the specific cloze for this card with blank
  const regex = new RegExp(`\\{\\{c${ordinal}::([^:}]+)(?:::[^}]+)?\\}\\}`, 'g');
  let result = text.replace(regex, '{{$1}}');

  // Replace other clozes with their answers (revealed)
  result = result.replace(/\{\{c\d+::([^:}]+)(?:::[^}]+)?\}\}/g, '$1');

  return result;
}

/**
 * Extract the answer from a cloze deletion
 */
function extractClozeAnswer(text: string, ordinal: number): string {
  const regex = new RegExp(`\\{\\{c${ordinal}::([^:}]+)(?:::[^}]+)?\\}\\}`);
  const match = text.match(regex);
  return match ? match[1] : '';
}

/**
 * Extract media file references from content
 */
function extractMediaReferences(content: string, mediaMap: Map<string, string>): string[] {
  const refs: string[] = [];

  // Match [sound:filename] and <img src="filename">
  const soundMatches = content.matchAll(/\[sound:([^\]]+)\]/g);
  const imgMatches = content.matchAll(/src=["']([^"']+)["']/g);

  for (const match of soundMatches) {
    if (mediaMap.has(match[1]) || Array.from(mediaMap.values()).includes(match[1])) {
      refs.push(match[1]);
    }
  }

  for (const match of imgMatches) {
    if (mediaMap.has(match[1]) || Array.from(mediaMap.values()).includes(match[1])) {
      refs.push(match[1]);
    }
  }

  return refs;
}

/**
 * Clean deck name (remove Anki hierarchy separators)
 */
function cleanDeckName(name: string): string {
  // Anki uses :: for hierarchy, we'll keep just the last part or full name
  // Actually, let's preserve the hierarchy as-is but clean it up
  return name.replace(/::/g, ' - ').trim();
}

export type { ZipFile };
