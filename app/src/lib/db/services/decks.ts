/**
 * Deck Service
 *
 * Provides CRUD operations for deck management.
 */

import { getDatabase } from '../index';
import {
  create,
  findById,
  findAll,
  findAllPaginated,
  update,
  deleteById,
  query,
  count,
} from '../crud';
import type {
  Deck,
  DeckCreate,
  DeckUpdate,
  DeckWithStats,
  PaginationOptions,
  SortOptions,
} from '../types';

const TABLE = 'decks';

/**
 * Create a new deck
 */
export function createDeck(data: DeckCreate): Deck {
  return create<Deck>(TABLE, {
    ...data,
    is_public: data.is_public ?? false,
  });
}

/**
 * Find deck by ID
 */
export function getDeckById(id: string): Deck | null {
  return findById<Deck>(TABLE, id);
}

/**
 * Get all decks for a user
 */
export function getDecksByUserId(
  userId: string,
  options: PaginationOptions & SortOptions = {}
): Deck[] {
  return findAll<Deck>(TABLE, { user_id: userId }, options);
}

/**
 * Get decks with pagination
 */
export function getDecksPaginated(
  userId: string,
  options: PaginationOptions & SortOptions = {}
) {
  return findAllPaginated<Deck>(TABLE, { user_id: userId }, options);
}

/**
 * Get deck with card statistics
 */
export function getDeckWithStats(id: string): DeckWithStats | null {
  const db = getDatabase();

  const sql = `
    SELECT
      d.*,
      COUNT(c.id) as card_count,
      COUNT(CASE WHEN cf.due <= datetime('now') THEN 1 END) as due_count,
      COUNT(CASE WHEN cf.state = 'new' THEN 1 END) as new_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE d.id = ?
    GROUP BY d.id
  `;

  const result = db.prepare(sql).get(id) as DeckWithStats | undefined;
  return result || null;
}

/**
 * Get all decks with stats for a user
 */
export function getDecksWithStats(userId: string): DeckWithStats[] {
  const db = getDatabase();

  const sql = `
    SELECT
      d.*,
      COUNT(c.id) as card_count,
      COUNT(CASE WHEN cf.due <= datetime('now') THEN 1 END) as due_count,
      COUNT(CASE WHEN cf.state = 'new' THEN 1 END) as new_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE d.user_id = ?
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `;

  return db.prepare(sql).all(userId) as DeckWithStats[];
}

/**
 * Get child decks
 */
export function getChildDecks(parentId: string): Deck[] {
  return findAll<Deck>(TABLE, { parent_id: parentId });
}

/**
 * Get root-level decks (no parent)
 */
export function getRootDecks(userId: string): Deck[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM ${TABLE}
    WHERE user_id = ? AND parent_id IS NULL
    ORDER BY name ASC
  `;
  return db.prepare(sql).all(userId) as Deck[];
}

/**
 * Update a deck
 */
export function updateDeck(id: string, data: DeckUpdate): Deck | null {
  return update<Deck>(TABLE, id, data);
}

/**
 * Delete a deck (cascades to cards)
 */
export function deleteDeck(id: string): boolean {
  return deleteById(TABLE, id);
}

/**
 * Get public decks
 */
export function getPublicDecks(
  options: PaginationOptions & SortOptions = {}
): Deck[] {
  return findAll<Deck>(TABLE, { is_public: 1 }, options);
}

/**
 * Search decks by name
 */
export function searchDecks(
  userId: string,
  searchTerm: string,
  limit = 20
): Deck[] {
  return query<Deck>(TABLE)
    .where('user_id', userId)
    .whereLike('name', `%${searchTerm}%`)
    .limit(limit)
    .all();
}

/**
 * Get deck count for user
 */
export function getDeckCount(userId: string): number {
  return count(TABLE, { user_id: userId });
}

/**
 * Check if user owns deck
 */
export function userOwnsDeck(userId: string, deckId: string): boolean {
  const deck = getDeckById(deckId);
  return deck !== null && deck.user_id === userId;
}
