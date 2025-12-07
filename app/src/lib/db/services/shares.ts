/**
 * Shares Service
 *
 * Provides operations for deck sharing and share links.
 */

import { getDatabase, transaction } from '../index';
import {
  create,
  findById,
  findAll,
  update,
  deleteById,
  generateId,
  now,
} from '../crud';
import { createDeck } from './decks';
import { createCard, getCardsByDeckId } from './cards';
import type {
  DeckShare,
  DeckShareCreate,
  DeckShareLink,
  DeckShareLinkCreate,
  DeckShareLinkUpdate,
  DeckClone,
  DeckCloneCreate,
  Deck,
} from '../types';
import crypto from 'crypto';

const SHARE_TABLE = 'deck_shares';
const LINK_TABLE = 'deck_share_links';
const CLONE_TABLE = 'deck_clones';

// ============================================
// Share Code Generation
// ============================================

/**
 * Generate a unique share code
 */
function generateShareCode(): string {
  return crypto.randomBytes(8).toString('base64url');
}

// ============================================
// User-to-User Sharing
// ============================================

/**
 * Share a deck with a specific user
 */
export function shareDeckWithUser(data: DeckShareCreate): DeckShare {
  return create<DeckShare>(SHARE_TABLE, {
    ...data,
    permission: data.permission ?? 'read',
  });
}

/**
 * Get all shares for a deck
 */
export function getDeckShares(deckId: string): DeckShare[] {
  return findAll<DeckShare>(SHARE_TABLE, { deck_id: deckId });
}

/**
 * Get shares with user details
 */
export function getDeckSharesWithUsers(deckId: string): Array<{
  share: DeckShare;
  user: { id: string; email: string; name: string | null };
}> {
  const db = getDatabase();
  const sql = `
    SELECT
      ds.id, ds.deck_id, ds.shared_with_user_id, ds.permission, ds.created_at,
      u.id as user_id, u.email as user_email, u.name as user_name
    FROM deck_shares ds
    JOIN users u ON u.id = ds.shared_with_user_id
    WHERE ds.deck_id = ?
  `;

  const rows = db.prepare(sql).all(deckId) as Array<{
    id: string;
    deck_id: string;
    shared_with_user_id: string;
    permission: string;
    created_at: string;
    user_id: string;
    user_email: string;
    user_name: string | null;
  }>;

  return rows.map((row) => ({
    share: {
      id: row.id,
      deck_id: row.deck_id,
      shared_with_user_id: row.shared_with_user_id,
      permission: row.permission as DeckShare['permission'],
      created_at: row.created_at,
    },
    user: {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
    },
  }));
}

/**
 * Get decks shared with a user
 */
export function getDecksSharedWithUser(userId: string): Array<{
  deck: Deck;
  permission: string;
}> {
  const db = getDatabase();
  const sql = `
    SELECT d.*, ds.permission
    FROM decks d
    JOIN deck_shares ds ON ds.deck_id = d.id
    WHERE ds.shared_with_user_id = ?
    ORDER BY d.updated_at DESC
  `;

  const rows = db.prepare(sql).all(userId) as Array<Deck & { permission: string }>;

  return rows.map((row) => ({
    deck: {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      parent_id: row.parent_id,
      hierarchy: row.hierarchy,
      is_public: row.is_public,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    permission: row.permission,
  }));
}

/**
 * Update share permission
 */
export function updateDeckShare(
  shareId: string,
  permission: DeckShare['permission']
): DeckShare | null {
  return update<DeckShare>(SHARE_TABLE, shareId, { permission });
}

/**
 * Remove a share
 */
export function removeDeckShare(shareId: string): boolean {
  return deleteById(SHARE_TABLE, shareId);
}

/**
 * Check if user has access to deck
 */
export function userHasAccessToDeck(
  userId: string,
  deckId: string
): { hasAccess: boolean; permission: string | null } {
  const db = getDatabase();

  // Check ownership
  const deck = db.prepare('SELECT user_id, is_public FROM decks WHERE id = ?').get(deckId) as {
    user_id: string;
    is_public: number;
  } | undefined;

  if (!deck) {
    return { hasAccess: false, permission: null };
  }

  if (deck.user_id === userId) {
    return { hasAccess: true, permission: 'owner' };
  }

  if (deck.is_public) {
    return { hasAccess: true, permission: 'read' };
  }

  // Check shares
  const share = db
    .prepare('SELECT permission FROM deck_shares WHERE deck_id = ? AND shared_with_user_id = ?')
    .get(deckId, userId) as { permission: string } | undefined;

  if (share) {
    return { hasAccess: true, permission: share.permission };
  }

  return { hasAccess: false, permission: null };
}

// ============================================
// Share Links
// ============================================

/**
 * Create a share link for a deck
 */
export function createShareLink(data: DeckShareLinkCreate): DeckShareLink {
  const code = generateShareCode();

  const db = getDatabase();
  const id = generateId();
  const timestamp = now();

  db.prepare(`
    INSERT INTO ${LINK_TABLE} (id, deck_id, code, permission, expires_at, max_uses, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.deck_id,
    code,
    data.permission ?? 'read',
    data.expires_at ?? null,
    data.max_uses ?? null,
    timestamp,
    timestamp
  );

  return getShareLinkById(id)!;
}

/**
 * Get share link by ID
 */
export function getShareLinkById(id: string): DeckShareLink | null {
  return findById<DeckShareLink>(LINK_TABLE, id);
}

/**
 * Get share link by code
 */
export function getShareLinkByCode(code: string): DeckShareLink | null {
  const db = getDatabase();
  const result = db.prepare(`SELECT * FROM ${LINK_TABLE} WHERE code = ?`).get(code);
  return (result as DeckShareLink) || null;
}

/**
 * Get all share links for a deck
 */
export function getShareLinksForDeck(deckId: string): DeckShareLink[] {
  return findAll<DeckShareLink>(LINK_TABLE, { deck_id: deckId });
}

/**
 * Update a share link
 */
export function updateShareLink(
  id: string,
  data: DeckShareLinkUpdate
): DeckShareLink | null {
  return update<DeckShareLink>(LINK_TABLE, id, data);
}

/**
 * Deactivate a share link
 */
export function deactivateShareLink(id: string): DeckShareLink | null {
  return update<DeckShareLink>(LINK_TABLE, id, { is_active: false });
}

/**
 * Delete a share link
 */
export function deleteShareLink(id: string): boolean {
  return deleteById(LINK_TABLE, id);
}

/**
 * Increment access count for a share link
 */
export function incrementShareLinkAccess(id: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE ${LINK_TABLE} SET access_count = access_count + 1, updated_at = ? WHERE id = ?`).run(
    now(),
    id
  );
}

/**
 * Validate a share link
 */
export function validateShareLink(code: string): {
  valid: boolean;
  link: DeckShareLink | null;
  deck: Deck | null;
  error?: string;
} {
  const link = getShareLinkByCode(code);

  if (!link) {
    return { valid: false, link: null, deck: null, error: 'Share link not found' };
  }

  if (!link.is_active) {
    return { valid: false, link, deck: null, error: 'Share link is no longer active' };
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { valid: false, link, deck: null, error: 'Share link has expired' };
  }

  if (link.max_uses && link.access_count >= link.max_uses) {
    return { valid: false, link, deck: null, error: 'Share link has reached maximum uses' };
  }

  const db = getDatabase();
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(link.deck_id) as Deck | undefined;

  if (!deck) {
    return { valid: false, link, deck: null, error: 'Deck not found' };
  }

  return { valid: true, link, deck };
}

// ============================================
// Deck Cloning
// ============================================

/**
 * Clone a deck for a user
 */
export function cloneDeck(
  originalDeckId: string,
  userId: string,
  shareLinkId?: string
): { deck: Deck; cardCount: number } {
  return transaction(() => {
    const db = getDatabase();

    // Get the original deck
    const originalDeck = db.prepare('SELECT * FROM decks WHERE id = ?').get(originalDeckId) as
      | Deck
      | undefined;

    if (!originalDeck) {
      throw new Error('Original deck not found');
    }

    // Create the cloned deck
    const newDeck = createDeck({
      user_id: userId,
      name: `${originalDeck.name} (Copy)`,
      description: originalDeck.description ?? undefined,
      is_public: false, // Cloned decks are private by default
    });

    // Get and clone all cards
    const originalCards = getCardsByDeckId(originalDeckId);
    let cardCount = 0;

    for (const card of originalCards) {
      createCard({
        deck_id: newDeck.id,
        type: card.type,
        front: card.front,
        back: card.back,
        media_type: card.media_type ?? undefined,
        media_url: card.media_url ?? undefined,
        tags: JSON.parse(card.tags || '[]'),
      });
      cardCount++;
    }

    // Record the clone
    const cloneRecord: DeckCloneCreate = {
      original_deck_id: originalDeckId,
      cloned_deck_id: newDeck.id,
      cloned_by_user_id: userId,
      share_link_id: shareLinkId,
    };

    create<DeckClone>(CLONE_TABLE, cloneRecord);

    // Increment share link access if applicable
    if (shareLinkId) {
      incrementShareLinkAccess(shareLinkId);
    }

    return { deck: newDeck, cardCount };
  });
}

/**
 * Get clone history for a deck
 */
export function getDeckCloneHistory(deckId: string): DeckClone[] {
  return findAll<DeckClone>(CLONE_TABLE, { original_deck_id: deckId });
}

/**
 * Get clones made by a user
 */
export function getUserClones(userId: string): DeckClone[] {
  return findAll<DeckClone>(CLONE_TABLE, { cloned_by_user_id: userId });
}
