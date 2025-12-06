/**
 * Review Logs Service
 *
 * Provides operations for tracking study sessions and review logs.
 */

import { getDatabase, transaction } from '../index';
import { create, findById, findAll, query, generateId, now } from '../crud';
import type {
  ReviewLog,
  ReviewLogCreate,
  StudySession,
  StudySessionCreate,
  StudySessionUpdate,
  PaginationOptions,
} from '../types';

const REVIEW_LOG_TABLE = 'review_logs';
const SESSION_TABLE = 'study_sessions';

// ============================================
// Review Logs
// ============================================

/**
 * Create a review log entry
 */
export function createReviewLog(data: ReviewLogCreate): ReviewLog {
  return create<ReviewLog>(REVIEW_LOG_TABLE, data);
}

/**
 * Get review logs for a card
 */
export function getReviewLogsForCard(
  cardId: string,
  options: PaginationOptions = {}
): ReviewLog[] {
  return findAll<ReviewLog>(
    REVIEW_LOG_TABLE,
    { card_id: cardId },
    { ...options, orderBy: 'reviewed_at', order: 'DESC' }
  );
}

/**
 * Get review logs for a user within a date range
 */
export function getReviewLogsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): ReviewLog[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM ${REVIEW_LOG_TABLE}
    WHERE user_id = ?
      AND reviewed_at >= ?
      AND reviewed_at < ?
    ORDER BY reviewed_at DESC
  `;
  return db.prepare(sql).all(userId, startDate, endDate) as ReviewLog[];
}

/**
 * Get review count by date for heatmap
 */
export function getReviewCountByDate(
  userId: string,
  days = 365
): Array<{ date: string; count: number }> {
  const db = getDatabase();
  const sql = `
    SELECT
      date(reviewed_at) as date,
      COUNT(*) as count
    FROM ${REVIEW_LOG_TABLE}
    WHERE user_id = ?
      AND reviewed_at >= date('now', '-${days} days')
    GROUP BY date(reviewed_at)
    ORDER BY date ASC
  `;
  return db.prepare(sql).all(userId) as Array<{ date: string; count: number }>;
}

/**
 * Get retention rate for a user
 */
export function getRetentionRate(userId: string, days = 30): number {
  const db = getDatabase();
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
    FROM ${REVIEW_LOG_TABLE}
    WHERE user_id = ?
      AND reviewed_at >= date('now', '-${days} days')
  `;
  const result = db.prepare(sql).get(userId) as {
    total: number;
    correct: number;
  };

  if (result.total === 0) return 0;
  return (result.correct / result.total) * 100;
}

/**
 * Get average review time
 */
export function getAverageReviewTime(userId: string, days = 30): number {
  const db = getDatabase();
  const sql = `
    SELECT AVG(duration_ms) as avg_time
    FROM ${REVIEW_LOG_TABLE}
    WHERE user_id = ?
      AND reviewed_at >= date('now', '-${days} days')
  `;
  const result = db.prepare(sql).get(userId) as { avg_time: number | null };
  return result.avg_time || 0;
}

// ============================================
// Study Sessions
// ============================================

/**
 * Start a new study session
 */
export function startStudySession(data: StudySessionCreate): StudySession {
  return create<StudySession>(SESSION_TABLE, {
    ...data,
    cards_reviewed: 0,
    cards_correct: 0,
    total_duration_ms: 0,
  });
}

/**
 * Get study session by ID
 */
export function getStudySession(id: string): StudySession | null {
  return findById<StudySession>(SESSION_TABLE, id);
}

/**
 * Update study session (during or after review)
 */
export function updateStudySession(
  id: string,
  data: StudySessionUpdate
): StudySession | null {
  const db = getDatabase();
  const session = getStudySession(id);
  if (!session) return null;

  const updates: StudySessionUpdate = {
    cards_reviewed:
      data.cards_reviewed ?? session.cards_reviewed,
    cards_correct:
      data.cards_correct ?? session.cards_correct,
    total_duration_ms:
      data.total_duration_ms ?? session.total_duration_ms,
    ended_at: data.ended_at,
  };

  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const sql = `UPDATE ${SESSION_TABLE} SET ${setClause} WHERE id = ?`;
  db.prepare(sql).run(...values, id);

  return getStudySession(id);
}

/**
 * End a study session
 */
export function endStudySession(id: string): StudySession | null {
  return updateStudySession(id, { ended_at: now() });
}

/**
 * Increment session stats after a card review
 */
export function recordCardReview(
  sessionId: string,
  isCorrect: boolean,
  durationMs: number
): StudySession | null {
  const db = getDatabase();
  const sql = `
    UPDATE ${SESSION_TABLE}
    SET
      cards_reviewed = cards_reviewed + 1,
      cards_correct = cards_correct + ?,
      total_duration_ms = total_duration_ms + ?
    WHERE id = ?
  `;
  db.prepare(sql).run(isCorrect ? 1 : 0, durationMs, sessionId);
  return getStudySession(sessionId);
}

/**
 * Get recent study sessions for a user
 */
export function getRecentSessions(
  userId: string,
  limit = 10
): StudySession[] {
  return query<StudySession>(SESSION_TABLE)
    .where('user_id', userId)
    .orderBy('started_at', 'DESC')
    .limit(limit)
    .all();
}

/**
 * Get study sessions by date range
 */
export function getSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): StudySession[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM ${SESSION_TABLE}
    WHERE user_id = ?
      AND started_at >= ?
      AND started_at < ?
    ORDER BY started_at DESC
  `;
  return db.prepare(sql).all(userId, startDate, endDate) as StudySession[];
}

/**
 * Get total study time for a user
 */
export function getTotalStudyTime(userId: string, days = 30): number {
  const db = getDatabase();
  const sql = `
    SELECT SUM(total_duration_ms) as total
    FROM ${SESSION_TABLE}
    WHERE user_id = ?
      AND started_at >= date('now', '-${days} days')
  `;
  const result = db.prepare(sql).get(userId) as { total: number | null };
  return result.total || 0;
}

/**
 * Get study streak (consecutive days)
 */
export function getStudyStreak(userId: string): number {
  const db = getDatabase();

  // Get unique study dates in descending order
  const sql = `
    SELECT DISTINCT date(started_at) as study_date
    FROM ${SESSION_TABLE}
    WHERE user_id = ?
    ORDER BY study_date DESC
  `;

  const dates = db.prepare(sql).all(userId) as Array<{ study_date: string }>;

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const studyDate = new Date(dates[i].study_date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (studyDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && studyDate.getTime() === expectedDate.getTime() - 86400000) {
      // Allow gap of 1 day if today hasn't been studied yet
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get daily study statistics
 */
export function getDailyStats(
  userId: string,
  days = 7
): Array<{
  date: string;
  cards_reviewed: number;
  cards_correct: number;
  duration_ms: number;
}> {
  const db = getDatabase();
  const sql = `
    SELECT
      date(started_at) as date,
      SUM(cards_reviewed) as cards_reviewed,
      SUM(cards_correct) as cards_correct,
      SUM(total_duration_ms) as duration_ms
    FROM ${SESSION_TABLE}
    WHERE user_id = ?
      AND started_at >= date('now', '-${days} days')
    GROUP BY date(started_at)
    ORDER BY date ASC
  `;
  return db.prepare(sql).all(userId) as Array<{
    date: string;
    cards_reviewed: number;
    cards_correct: number;
    duration_ms: number;
  }>;
}
