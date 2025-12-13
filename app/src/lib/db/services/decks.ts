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
  DeckCategory,
  PublicDeckWithAuthor,
  DeckVisit,
  PaginationOptions,
  SortOptions,
} from '../types';

const TABLE = 'decks';
const VISITS_TABLE = 'deck_visits';

/**
 * Create a new deck
 */
export function createDeck(data: DeckCreate): Deck {
  console.log('[DeckService] createDeck - Input data:', JSON.stringify(data, null, 2));

  const preparedData = {
    ...data,
    is_public: data.is_public ?? false,
    is_ai_generated: data.is_ai_generated ?? false,
  };

  console.log('[DeckService] createDeck - Prepared data for CRUD:', JSON.stringify(preparedData, null, 2));

  // Log each field with type info
  for (const [key, value] of Object.entries(preparedData)) {
    const valueType = typeof value;
    const isValidSqlite = value === null || ['string', 'number', 'boolean', 'bigint'].includes(valueType) || Buffer.isBuffer(value);
    console.log(`[DeckService] Field "${key}": value=${JSON.stringify(value)}, type=${valueType}, isValidSQLite=${isValidSqlite}`);
  }

  return create<Deck>(TABLE, preparedData);
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

// ============================================
// Explore / Public Decks
// ============================================

/**
 * Get public decks with author info and stats, grouped by category
 */
export function getPublicDecksWithAuthor(options: {
  category?: DeckCategory;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): { decks: PublicDeckWithAuthor[]; total: number } {
  const db = getDatabase();
  const { category, search, limit = 20, offset = 0 } = options;

  let whereClause = 'd.is_public = 1';
  const params: (string | number)[] = [];

  if (category) {
    whereClause += ' AND d.category = ?';
    params.push(category);
  }

  if (search) {
    whereClause += ' AND (d.name LIKE ? OR d.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Count total
  const countSql = `SELECT COUNT(DISTINCT d.id) as count FROM decks d WHERE ${whereClause}`;
  const countResult = db.prepare(countSql).get(...params) as { count: number };
  const total = countResult.count;

  // Get decks
  const sql = `
    SELECT
      d.*,
      u.name as author_name,
      u.email as author_email,
      COUNT(DISTINCT c.id) as card_count,
      COUNT(DISTINCT CASE WHEN cf.due <= datetime('now') THEN c.id END) as due_count,
      COUNT(DISTINCT CASE WHEN cf.state = 'new' THEN c.id END) as new_count,
      (SELECT COUNT(*) FROM deck_clones dc WHERE dc.original_deck_id = d.id) as clone_count
    FROM decks d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE ${whereClause}
    GROUP BY d.id
    ORDER BY clone_count DESC, d.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const decks = db.prepare(sql).all(...params, limit, offset) as PublicDeckWithAuthor[];

  return { decks, total };
}

/**
 * Get categories with deck counts
 */
export function getCategoriesWithCounts(): Array<{ category: DeckCategory; count: number }> {
  const db = getDatabase();

  const sql = `
    SELECT category, COUNT(*) as count
    FROM decks
    WHERE is_public = 1 AND category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `;

  return db.prepare(sql).all() as Array<{ category: DeckCategory; count: number }>;
}

/**
 * Get featured public decks (most cloned)
 */
export function getFeaturedDecks(limit = 6): PublicDeckWithAuthor[] {
  const db = getDatabase();

  const sql = `
    SELECT
      d.*,
      u.name as author_name,
      u.email as author_email,
      COUNT(DISTINCT c.id) as card_count,
      0 as due_count,
      0 as new_count,
      (SELECT COUNT(*) FROM deck_clones dc WHERE dc.original_deck_id = d.id) as clone_count
    FROM decks d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN cards c ON c.deck_id = d.id
    WHERE d.is_public = 1
    GROUP BY d.id
    HAVING card_count > 0
    ORDER BY clone_count DESC, card_count DESC
    LIMIT ?
  `;

  return db.prepare(sql).all(limit) as PublicDeckWithAuthor[];
}

// ============================================
// Visit Tracking
// ============================================

/**
 * Record a deck visit
 */
export function recordDeckVisit(userId: string, deckId: string): void {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  // Upsert visit record
  db.prepare(`
    INSERT INTO ${VISITS_TABLE} (id, user_id, deck_id, visited_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, deck_id) DO UPDATE SET visited_at = excluded.visited_at
  `).run(
    `${userId}-${deckId}`,
    userId,
    deckId,
    timestamp
  );

  // Update deck's last_accessed_at
  db.prepare(`UPDATE ${TABLE} SET last_accessed_at = ? WHERE id = ?`).run(timestamp, deckId);
}

/**
 * Get recently visited decks for a user
 */
export function getRecentlyVisitedDecks(userId: string, limit = 6): DeckWithStats[] {
  const db = getDatabase();

  const sql = `
    SELECT
      d.*,
      COUNT(c.id) as card_count,
      COUNT(CASE WHEN cf.due <= datetime('now') THEN 1 END) as due_count,
      COUNT(CASE WHEN cf.state = 'new' THEN 1 END) as new_count
    FROM deck_visits dv
    JOIN decks d ON d.id = dv.deck_id
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN card_fsrs cf ON cf.card_id = c.id
    WHERE dv.user_id = ?
    GROUP BY d.id
    ORDER BY dv.visited_at DESC
    LIMIT ?
  `;

  return db.prepare(sql).all(userId, limit) as DeckWithStats[];
}

/**
 * Get recently created decks for a user
 */
export function getRecentlyCreatedDecks(userId: string, limit = 6): DeckWithStats[] {
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
    ORDER BY d.created_at DESC
    LIMIT ?
  `;

  return db.prepare(sql).all(userId, limit) as DeckWithStats[];
}

/**
 * Get decks with cards due for review
 */
export function getDecksWithDueCards(userId: string): DeckWithStats[] {
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
    HAVING due_count > 0
    ORDER BY due_count DESC
  `;

  return db.prepare(sql).all(userId) as DeckWithStats[];
}
