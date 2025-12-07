/**
 * Database Types for Studek Application
 *
 * These types represent the database schema and are used
 * throughout the application for type safety.
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  avatar_url: string | null;
  email_verified: number; // SQLite stores booleans as 0/1
  verification_token: string | null;
  verification_token_expires_at: string | null;
  password_reset_token: string | null;
  password_reset_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password_hash: string;
  name?: string;
  avatar_url?: string;
  email_verified?: number;
  verification_token?: string;
  verification_token_expires_at?: string;
}

export interface UserUpdate {
  email?: string;
  password_hash?: string;
  name?: string;
  avatar_url?: string;
  email_verified?: number;
  verification_token?: string | null;
  verification_token_expires_at?: string | null;
  password_reset_token?: string | null;
  password_reset_token_expires_at?: string | null;
}

// ============================================
// Deck Categories
// ============================================

export const DECK_CATEGORIES = [
  'languages',
  'medicine',
  'science',
  'mathematics',
  'history',
  'geography',
  'programming',
  'business',
  'law',
  'arts',
  'music',
  'literature',
  'philosophy',
  'psychology',
  'test-prep',
  'other',
] as const;

export type DeckCategory = typeof DECK_CATEGORIES[number];

// ============================================
// Deck Types
// ============================================

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  hierarchy: string | null;
  category: DeckCategory | null;
  is_public: boolean;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeckCreate {
  user_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  hierarchy?: string;
  category?: DeckCategory;
  is_public?: boolean;
}

export interface DeckUpdate {
  name?: string;
  description?: string;
  parent_id?: string;
  hierarchy?: string;
  category?: DeckCategory;
  is_public?: boolean;
}

export interface DeckWithStats extends Deck {
  card_count: number;
  due_count: number;
  new_count: number;
}

// Deck with author info for explore page
export interface PublicDeckWithAuthor extends DeckWithStats {
  author_name: string | null;
  author_email: string;
  clone_count: number;
}

// ============================================
// Deck Visit Types
// ============================================

export interface DeckVisit {
  id: string;
  user_id: string;
  deck_id: string;
  visited_at: string;
}

export interface DeckVisitCreate {
  user_id: string;
  deck_id: string;
}

// ============================================
// Card Types
// ============================================

export type CardType = 'basic' | 'cloze' | 'image-occlusion';

export interface Card {
  id: string;
  deck_id: string;
  type: CardType;
  front: string;
  back: string;
  media_type: string | null;
  media_url: string | null;
  tags: string; // JSON array stored as string
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  deck_id: string;
  type: CardType;
  front: string;
  back: string;
  media_type?: string;
  media_url?: string;
  tags?: string[];
}

export interface CardUpdate {
  type?: CardType;
  front?: string;
  back?: string;
  media_type?: string;
  media_url?: string;
  tags?: string[];
}

// ============================================
// FSRS (Spaced Repetition) Types
// ============================================

export interface CardFSRS {
  card_id: string;
  stability: number;
  difficulty: number;
  due: string;
  last_review: string | null;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

export interface CardFSRSUpdate {
  stability?: number;
  difficulty?: number;
  due?: string;
  last_review?: string;
  reps?: number;
  lapses?: number;
  state?: 'new' | 'learning' | 'review' | 'relearning';
}

// ============================================
// Review Log Types
// ============================================

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: Rating;
  duration_ms: number;
  stability_before: number;
  stability_after: number;
  difficulty_before: number;
  difficulty_after: number;
  reviewed_at: string;
}

export interface ReviewLogCreate {
  card_id: string;
  user_id: string;
  rating: Rating;
  duration_ms: number;
  stability_before: number;
  stability_after: number;
  difficulty_before: number;
  difficulty_after: number;
}

// ============================================
// Source Document Types
// ============================================

export type SourceType = 'pdf' | 'video' | 'web' | 'text' | 'audio' | 'image';

export interface SourceDocument {
  id: string;
  user_id: string;
  type: SourceType;
  title: string;
  url: string | null;
  content: string | null;
  metadata: string | null; // JSON stored as string
  created_at: string;
  updated_at: string;
}

export interface SourceDocumentCreate {
  user_id: string;
  type: SourceType;
  title: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface SourceDocumentUpdate {
  type?: SourceType;
  title?: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Studio Document Types
// ============================================

export interface StudioDocument {
  id: string;
  user_id: string;
  title: string;
  source_document_id: string | null;
  blocks: string; // JSON array stored as string
  created_at: string;
  updated_at: string;
}

export interface StudioDocumentCreate {
  user_id: string;
  title: string;
  source_document_id?: string;
  blocks?: unknown[];
}

export interface StudioDocumentUpdate {
  title?: string;
  source_document_id?: string;
  blocks?: unknown[];
}

// ============================================
// Study Session Types
// ============================================

export interface StudySession {
  id: string;
  user_id: string;
  deck_id: string | null;
  cards_reviewed: number;
  cards_correct: number;
  total_duration_ms: number;
  started_at: string;
  ended_at: string | null;
}

export interface StudySessionCreate {
  user_id: string;
  deck_id?: string;
}

export interface StudySessionUpdate {
  cards_reviewed?: number;
  cards_correct?: number;
  total_duration_ms?: number;
  ended_at?: string;
}

// ============================================
// Tag Types
// ============================================

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface TagCreate {
  user_id: string;
  name: string;
  color?: string;
}

// ============================================
// Deck Share Types
// ============================================

export type SharePermission = 'read' | 'write' | 'admin';
export type ShareLinkPermission = 'read' | 'clone';

export interface DeckShare {
  id: string;
  deck_id: string;
  shared_with_user_id: string;
  permission: SharePermission;
  created_at: string;
}

export interface DeckShareCreate {
  deck_id: string;
  shared_with_user_id: string;
  permission?: SharePermission;
}

export interface DeckShareLink {
  id: string;
  deck_id: string;
  code: string;
  permission: ShareLinkPermission;
  is_active: boolean;
  expires_at: string | null;
  access_count: number;
  max_uses: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeckShareLinkCreate {
  deck_id: string;
  permission?: ShareLinkPermission;
  expires_at?: string;
  max_uses?: number;
}

export interface DeckShareLinkUpdate {
  permission?: ShareLinkPermission;
  is_active?: boolean;
  expires_at?: string;
  max_uses?: number;
}

export interface DeckClone {
  id: string;
  original_deck_id: string;
  cloned_deck_id: string;
  cloned_by_user_id: string;
  share_link_id: string | null;
  created_at: string;
}

export interface DeckCloneCreate {
  original_deck_id: string;
  cloned_deck_id: string;
  cloned_by_user_id: string;
  share_link_id?: string;
}

// Deck with share info for API responses
export interface DeckWithShareInfo extends Deck {
  share_links?: DeckShareLink[];
  shared_with?: Array<{
    user_id: string;
    user_email: string;
    user_name: string | null;
    permission: SharePermission;
  }>;
}

// ============================================
// Query Options
// ============================================

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface FilterOptions {
  where?: Record<string, unknown>;
}

export type QueryOptions = PaginationOptions & SortOptions & FilterOptions;

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
