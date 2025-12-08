/**
 * GET /api/sessions - Get user's study session history
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getDatabase } from '@/lib/db';

interface SessionData {
  id: string;
  deck_id: string;
  deck_name: string;
  started_at: string;
  ended_at: string | null;
  cards_reviewed: number;
  cards_correct: number;
  total_duration_ms: number;
  xp_earned: number;
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get recent study sessions with deck names
    const sessions = db.prepare(`
      SELECT
        ss.id,
        ss.deck_id,
        d.name as deck_name,
        ss.started_at,
        ss.ended_at,
        ss.cards_reviewed,
        ss.cards_correct,
        ss.total_duration_ms,
        COALESCE(
          (SELECT SUM(amount) FROM xp_transactions WHERE source_id = ss.id AND source = 'session'),
          0
        ) as xp_earned
      FROM study_sessions ss
      LEFT JOIN decks d ON d.id = ss.deck_id
      WHERE ss.user_id = ?
        AND ss.ended_at IS NOT NULL
      ORDER BY ss.started_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as SessionData[];

    // Get total count for pagination
    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM study_sessions
      WHERE user_id = ?
        AND ended_at IS NOT NULL
    `).get(userId) as { total: number };

    // Get daily session counts for the past 30 days
    const dailyActivity = db.prepare(`
      SELECT
        date(started_at) as date,
        COUNT(*) as sessions,
        SUM(cards_reviewed) as cards,
        SUM(total_duration_ms) as duration_ms,
        AVG(CASE WHEN cards_reviewed > 0
          THEN CAST(cards_correct AS FLOAT) / cards_reviewed * 100
          ELSE 0 END) as avg_accuracy
      FROM study_sessions
      WHERE user_id = ?
        AND started_at >= date('now', '-30 days')
        AND ended_at IS NOT NULL
      GROUP BY date(started_at)
      ORDER BY date DESC
    `).all(userId) as Array<{
      date: string;
      sessions: number;
      cards: number;
      duration_ms: number;
      avg_accuracy: number;
    }>;

    // Calculate session streaks and patterns
    const sessionStats = db.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(cards_reviewed) as total_cards,
        SUM(cards_correct) as total_correct,
        SUM(total_duration_ms) as total_time_ms,
        AVG(cards_reviewed) as avg_cards_per_session,
        AVG(total_duration_ms) as avg_duration_ms,
        MAX(cards_reviewed) as best_session_cards
      FROM study_sessions
      WHERE user_id = ?
        AND ended_at IS NOT NULL
    `).get(userId) as {
      total_sessions: number;
      total_cards: number;
      total_correct: number;
      total_time_ms: number;
      avg_cards_per_session: number;
      avg_duration_ms: number;
      best_session_cards: number;
    };

    // Get best performing deck
    const bestDeck = db.prepare(`
      SELECT
        d.id,
        d.name,
        COUNT(*) as session_count,
        AVG(CASE WHEN ss.cards_reviewed > 0
          THEN CAST(ss.cards_correct AS FLOAT) / ss.cards_reviewed * 100
          ELSE 0 END) as accuracy
      FROM study_sessions ss
      JOIN decks d ON d.id = ss.deck_id
      WHERE ss.user_id = ?
        AND ss.ended_at IS NOT NULL
        AND ss.cards_reviewed >= 5
      GROUP BY d.id
      ORDER BY accuracy DESC
      LIMIT 1
    `).get(userId) as { id: string; name: string; session_count: number; accuracy: number } | undefined;

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deckId: session.deck_id,
      deckName: session.deck_name || 'Unknown Deck',
      startedAt: session.started_at,
      endedAt: session.ended_at,
      cardsReviewed: session.cards_reviewed,
      cardsCorrect: session.cards_correct,
      accuracy: session.cards_reviewed > 0
        ? Math.round((session.cards_correct / session.cards_reviewed) * 100)
        : 0,
      durationMs: session.total_duration_ms,
      xpEarned: session.xp_earned,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        total: countResult.total,
        limit,
        offset,
        hasMore: offset + sessions.length < countResult.total,
      },
      dailyActivity: dailyActivity.map(day => ({
        date: day.date,
        sessions: day.sessions,
        cards: day.cards,
        durationMinutes: Math.round(day.duration_ms / 60000),
        accuracy: Math.round(day.avg_accuracy),
      })),
      stats: {
        totalSessions: sessionStats.total_sessions || 0,
        totalCards: sessionStats.total_cards || 0,
        totalCorrect: sessionStats.total_correct || 0,
        totalTimeMs: sessionStats.total_time_ms || 0,
        avgCardsPerSession: Math.round(sessionStats.avg_cards_per_session || 0),
        avgDurationMinutes: Math.round((sessionStats.avg_duration_ms || 0) / 60000),
        bestSessionCards: sessionStats.best_session_cards || 0,
        overallAccuracy: sessionStats.total_cards > 0
          ? Math.round((sessionStats.total_correct / sessionStats.total_cards) * 100)
          : 0,
      },
      bestDeck: bestDeck ? {
        id: bestDeck.id,
        name: bestDeck.name,
        sessionCount: bestDeck.session_count,
        accuracy: Math.round(bestDeck.accuracy),
      } : null,
    });
  } catch (error) {
    return handleApiError('GET /api/sessions', error, 'Failed to fetch session history');
  }
});
