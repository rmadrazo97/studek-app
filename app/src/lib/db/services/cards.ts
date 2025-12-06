/**
 * Card Service
 *
 * Provides CRUD operations for flashcard management.
 */

import { getDatabase, transaction } from '../index';
import {
  create,
  findById,
  findAll,
  findAllPaginated,
  update,
  deleteById,
  bulkDelete,
  query,
  count,
  generateId,
  now,
} from '../crud';
import type {
  Card,
  CardCreate,
  CardUpdate,
  CardFSRS,
  CardFSRSUpdate,
  PaginationOptions,
  SortOptions,
} from '../types';

const TABLE = 'cards';
const FSRS_TABLE = 'card_fsrs';

// Default FSRS parameters for new cards
const DEFAULT_FSRS: Omit<CardFSRS, 'card_id'> = {
  stability: 0,
  difficulty: 5.0, // Medium difficulty
  due: new Date().toISOString(),
  last_review: null,
  reps: 0,
  lapses: 0,
  state: 'new',
};

/**
 * Create a new card with FSRS data
 */
export function createCard(data: CardCreate): Card & { fsrs: CardFSRS } {
  return transaction(() => {
    const card = create<Card>(TABLE, {
      ...data,
      tags: JSON.stringify(data.tags || []),
    });

    // Create FSRS record
    const db = getDatabase();
    const fsrsData: CardFSRS = {
      card_id: card.id,
      ...DEFAULT_FSRS,
    };

    db.prepare(`
      INSERT INTO ${FSRS_TABLE} (card_id, stability, difficulty, due, last_review, reps, lapses, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fsrsData.card_id,
      fsrsData.stability,
      fsrsData.difficulty,
      fsrsData.due,
      fsrsData.last_review,
      fsrsData.reps,
      fsrsData.lapses,
      fsrsData.state
    );

    return { ...card, fsrs: fsrsData };
  });
}

/**
 * Create multiple cards at once
 */
export function createCards(
  cards: CardCreate[]
): Array<Card & { fsrs: CardFSRS }> {
  return transaction(() => {
    return cards.map((cardData) => createCard(cardData));
  });
}

/**
 * Find card by ID
 */
export function getCardById(id: string): Card | null {
  return findById<Card>(TABLE, id);
}

/**
 * Get card with FSRS data
 */
export function getCardWithFSRS(
  id: string
): (Card & { fsrs: CardFSRS }) | null {
  const db = getDatabase();

  const sql = `
    SELECT c.*, cf.stability, cf.difficulty, cf.due, cf.last_review,
           cf.reps, cf.lapses, cf.state
    FROM cards c
    LEFT JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE c.id = ?
  `;

  const row = db.prepare(sql).get(id) as
    | (Card & {
        stability: number;
        difficulty: number;
        due: string;
        last_review: string | null;
        reps: number;
        lapses: number;
        state: string;
      })
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    deck_id: row.deck_id,
    type: row.type,
    front: row.front,
    back: row.back,
    media_type: row.media_type,
    media_url: row.media_url,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fsrs: {
      card_id: row.id,
      stability: row.stability,
      difficulty: row.difficulty,
      due: row.due,
      last_review: row.last_review,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state as CardFSRS['state'],
    },
  };
}

/**
 * Get all cards in a deck
 */
export function getCardsByDeckId(
  deckId: string,
  options: PaginationOptions & SortOptions = {}
): Card[] {
  return findAll<Card>(TABLE, { deck_id: deckId }, options);
}

/**
 * Get cards with pagination
 */
export function getCardsPaginated(
  deckId: string,
  options: PaginationOptions & SortOptions = {}
) {
  return findAllPaginated<Card>(TABLE, { deck_id: deckId }, options);
}

/**
 * Get due cards for review
 */
export function getDueCards(
  deckId: string,
  limit = 20
): Array<Card & { fsrs: CardFSRS }> {
  const db = getDatabase();

  const sql = `
    SELECT c.*, cf.stability, cf.difficulty, cf.due, cf.last_review,
           cf.reps, cf.lapses, cf.state
    FROM cards c
    JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE c.deck_id = ?
      AND cf.due <= datetime('now')
    ORDER BY cf.due ASC
    LIMIT ?
  `;

  const rows = db.prepare(sql).all(deckId, limit) as Array<
    Card & {
      stability: number;
      difficulty: number;
      due: string;
      last_review: string | null;
      reps: number;
      lapses: number;
      state: string;
    }
  >;

  return rows.map((row) => ({
    id: row.id,
    deck_id: row.deck_id,
    type: row.type,
    front: row.front,
    back: row.back,
    media_type: row.media_type,
    media_url: row.media_url,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fsrs: {
      card_id: row.id,
      stability: row.stability,
      difficulty: row.difficulty,
      due: row.due,
      last_review: row.last_review,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state as CardFSRS['state'],
    },
  }));
}

/**
 * Get new cards (not yet studied)
 */
export function getNewCards(
  deckId: string,
  limit = 10
): Array<Card & { fsrs: CardFSRS }> {
  const db = getDatabase();

  const sql = `
    SELECT c.*, cf.stability, cf.difficulty, cf.due, cf.last_review,
           cf.reps, cf.lapses, cf.state
    FROM cards c
    JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE c.deck_id = ?
      AND cf.state = 'new'
    ORDER BY c.created_at ASC
    LIMIT ?
  `;

  const rows = db.prepare(sql).all(deckId, limit) as Array<
    Card & {
      stability: number;
      difficulty: number;
      due: string;
      last_review: string | null;
      reps: number;
      lapses: number;
      state: string;
    }
  >;

  return rows.map((row) => ({
    id: row.id,
    deck_id: row.deck_id,
    type: row.type,
    front: row.front,
    back: row.back,
    media_type: row.media_type,
    media_url: row.media_url,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fsrs: {
      card_id: row.id,
      stability: row.stability,
      difficulty: row.difficulty,
      due: row.due,
      last_review: row.last_review,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state as CardFSRS['state'],
    },
  }));
}

/**
 * Update a card
 */
export function updateCard(id: string, data: CardUpdate): Card | null {
  const updateData: Partial<Card> = { ...data };
  if (data.tags) {
    updateData.tags = JSON.stringify(data.tags);
  }
  return update<Card>(TABLE, id, updateData);
}

/**
 * Update FSRS data after a review
 */
export function updateCardFSRS(
  cardId: string,
  data: CardFSRSUpdate
): CardFSRS | null {
  const db = getDatabase();

  const entries = Object.entries(data);
  if (entries.length === 0) return getCardFSRS(cardId);

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const sql = `UPDATE ${FSRS_TABLE} SET ${setClause} WHERE card_id = ?`;
  db.prepare(sql).run(...values, cardId);

  return getCardFSRS(cardId);
}

/**
 * Get FSRS data for a card
 */
export function getCardFSRS(cardId: string): CardFSRS | null {
  const db = getDatabase();
  const sql = `SELECT * FROM ${FSRS_TABLE} WHERE card_id = ?`;
  return db.prepare(sql).get(cardId) as CardFSRS | null;
}

/**
 * Delete a card
 */
export function deleteCard(id: string): boolean {
  return deleteById(TABLE, id);
}

/**
 * Delete multiple cards
 */
export function deleteCards(ids: string[]): number {
  return bulkDelete(TABLE, ids);
}

/**
 * Get card count for a deck
 */
export function getCardCount(deckId: string): number {
  return count(TABLE, { deck_id: deckId });
}

/**
 * Get due card count for a deck
 */
export function getDueCardCount(deckId: string): number {
  const db = getDatabase();
  const sql = `
    SELECT COUNT(*) as count
    FROM cards c
    JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE c.deck_id = ? AND cf.due <= datetime('now')
  `;
  const result = db.prepare(sql).get(deckId) as { count: number };
  return result.count;
}

/**
 * Search cards by content
 */
export function searchCards(
  deckId: string,
  searchTerm: string,
  limit = 50
): Card[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM ${TABLE}
    WHERE deck_id = ?
      AND (front LIKE ? OR back LIKE ?)
    LIMIT ?
  `;
  const pattern = `%${searchTerm}%`;
  return db.prepare(sql).all(deckId, pattern, pattern, limit) as Card[];
}

/**
 * Get cards by tag
 */
export function getCardsByTag(deckId: string, tag: string): Card[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM ${TABLE}
    WHERE deck_id = ?
      AND tags LIKE ?
  `;
  return db.prepare(sql).all(deckId, `%"${tag}"%`) as Card[];
}

/**
 * Move cards to another deck
 */
export function moveCards(cardIds: string[], newDeckId: string): number {
  const db = getDatabase();
  const placeholders = cardIds.map(() => '?').join(', ');
  const sql = `UPDATE ${TABLE} SET deck_id = ?, updated_at = ? WHERE id IN (${placeholders})`;
  const result = db.prepare(sql).run(newDeckId, now(), ...cardIds);
  return result.changes;
}
