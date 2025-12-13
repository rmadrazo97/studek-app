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
  plan_id: string;
  plan_started_at: string;
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
  plan_id?: string;
  plan_started_at?: string;
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
  plan_id?: string;
  plan_started_at?: string;
}

// ============================================
// Plan Types
// ============================================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year';
  is_default: number;
  max_decks: number | null;
  max_sessions_per_deck: number | null;
  max_public_decks: number | null;
  max_ai_decks: number | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanSummary {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  interval: 'month' | 'year';
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: number;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
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
  is_ai_generated: boolean;
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
  is_ai_generated?: boolean;
}

export interface DeckUpdate {
  name?: string;
  description?: string;
  parent_id?: string;
  hierarchy?: string;
  category?: DeckCategory;
  is_public?: boolean;
  is_ai_generated?: boolean;
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
  // FSRS v5 additions
  step: number; // Current learning/relearning step (0-based)
  elapsed_days: number; // Days since last review
  scheduled_days: number; // Scheduled interval in days
}

export interface CardFSRSUpdate {
  stability?: number;
  difficulty?: number;
  due?: string;
  last_review?: string;
  reps?: number;
  lapses?: number;
  state?: 'new' | 'learning' | 'review' | 'relearning';
  // FSRS v5 additions
  step?: number;
  elapsed_days?: number;
  scheduled_days?: number;
}

// ============================================
// User FSRS Parameters (Personalized Weights)
// ============================================

export interface UserFSRSParams {
  user_id: string;
  weights: string; // JSON array of 19 weights
  request_retention: number;
  maximum_interval: number;
  learning_steps: string; // JSON array of minutes
  relearning_steps: string; // JSON array of minutes
  graduating_interval: number;
  easy_interval: number;
  enable_fuzz: number; // SQLite boolean
  fuzz_factor: number;
  enable_short_term: number; // SQLite boolean
  last_optimized_at: string | null;
  optimization_sample_size: number | null;
  optimization_loss: number | null;
  optimization_rmse: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserFSRSParamsUpdate {
  weights?: string;
  request_retention?: number;
  maximum_interval?: number;
  learning_steps?: string;
  relearning_steps?: string;
  graduating_interval?: number;
  easy_interval?: number;
  enable_fuzz?: number;
  fuzz_factor?: number;
  enable_short_term?: number;
  last_optimized_at?: string;
  optimization_sample_size?: number;
  optimization_loss?: number;
  optimization_rmse?: number;
}

// ============================================
// Deck FSRS Parameters Override
// ============================================

export interface DeckFSRSParams {
  deck_id: string;
  weights: string | null;
  request_retention: number | null;
  maximum_interval: number | null;
  learning_steps: string | null;
  relearning_steps: string | null;
  graduating_interval: number | null;
  easy_interval: number | null;
  enable_fuzz: number | null;
  fuzz_factor: number | null;
  last_optimized_at: string | null;
  optimization_sample_size: number | null;
  optimization_loss: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// FSRS Optimization History
// ============================================

export interface FSRSOptimizationHistory {
  id: string;
  user_id: string;
  deck_id: string | null;
  weights_before: string;
  weights_after: string;
  loss_before: number;
  loss_after: number;
  improvement_percent: number;
  rmse: number;
  sample_size: number;
  iterations: number;
  created_at: string;
}

// ============================================
// Card Statistics
// ============================================

export interface CardStatistics {
  card_id: string;
  review_count: number;
  correct_count: number;
  streak: number;
  best_streak: number;
  total_time_ms: number;
  avg_time_ms: number;
  avg_difficulty: number;
  difficulty_history: string; // JSON array
  lapse_count: number;
  last_lapse_at: string | null;
  is_leech: number; // SQLite boolean
  first_review_at: string | null;
  last_review_at: string | null;
  created_at: string;
  updated_at: string;
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

// ============================================
// Gamification Types
// ============================================

export interface UserStats {
  user_id: string;
  total_xp: number;
  weekly_xp: number;
  week_start_date: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  streak_freezes_available: number;
  streak_freezes_used: number;
  league_tier: number;
  league_cohort_id: string | null;
  league_rank: number | null;
  best_combo: number;
  total_reviews: number;
  total_correct: number;
  total_study_time_ms: number;
  daily_xp_goal: number;
  daily_xp_earned: number;
  daily_goal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStatsCreate {
  user_id: string;
  daily_xp_goal?: number;
}

export interface UserStatsUpdate {
  total_xp?: number;
  weekly_xp?: number;
  week_start_date?: string;
  current_streak?: number;
  longest_streak?: number;
  last_study_date?: string;
  streak_freezes_available?: number;
  streak_freezes_used?: number;
  league_tier?: number;
  league_cohort_id?: string;
  league_rank?: number;
  best_combo?: number;
  total_reviews?: number;
  total_correct?: number;
  total_study_time_ms?: number;
  daily_xp_goal?: number;
  daily_xp_earned?: number;
  daily_goal_date?: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: 'review' | 'new_card' | 'combo' | 'speed' | 'difficulty' | 'streak' | 'achievement';
  source_id: string | null;
  metadata: string | null;
  created_at: string;
}

export interface XPTransactionCreate {
  user_id: string;
  amount: number;
  source: XPTransaction['source'];
  source_id?: string;
  metadata?: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
}

export interface LeagueCohort {
  id: string;
  week_start_date: string;
  league_tier: number;
  created_at: string;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'study_reminder'
  | 'streak_warning'
  | 'weekly_summary'
  | 'achievement'
  | 'cards_due';

export type NotificationChannel = 'email' | 'push';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'clicked';

export interface NotificationPreferences {
  user_id: string;

  // Email Notifications
  email_enabled: number;
  email_study_reminders: number;
  email_streak_warnings: number;
  email_weekly_summary: number;
  email_achievement_unlocks: number;

  // Push Notifications
  push_enabled: number;
  push_study_reminders: number;
  push_streak_warnings: number;
  push_cards_due: number;

  // Timing
  reminder_time: string;
  timezone: string;

  // Quiet Hours
  quiet_hours_enabled: number;
  quiet_hours_start: string;
  quiet_hours_end: string;

  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdate {
  email_enabled?: number;
  email_study_reminders?: number;
  email_streak_warnings?: number;
  email_weekly_summary?: number;
  email_achievement_unlocks?: number;
  push_enabled?: number;
  push_study_reminders?: number;
  push_streak_warnings?: number;
  push_cards_due?: number;
  reminder_time?: string;
  timezone?: string;
  quiet_hours_enabled?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name: string | null;
  user_agent: string | null;
  is_active: number;
  last_used_at: string | null;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionCreate {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name?: string;
  user_agent?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  clicked_at: string | null;
  subscription_id: string | null;
  email_message_id: string | null;
  created_at: string;
}

export interface NotificationLogCreate {
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body?: string;
  subscription_id?: string;
}

export interface NotificationSchedule {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled';
  processed_at: string | null;
  created_at: string;
}

// ============================================
// Native Push Token Types (APNs/FCM)
// ============================================

export type NativePlatform = 'ios' | 'android';

export interface NativePushToken {
  id: string;
  user_id: string;
  platform: NativePlatform;
  token: string;
  device_name: string | null;
  device_model: string | null;
  os_version: string | null;
  app_version: string | null;
  is_active: number;
  last_used_at: string | null;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface NativePushTokenCreate {
  user_id: string;
  platform: NativePlatform;
  token: string;
  device_name?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
}
