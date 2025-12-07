/**
 * GET /api/dashboard - Get dashboard data for authenticated user
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getRecentlyVisitedDecks,
  getRecentlyCreatedDecks,
  getDecksWithDueCards,
  getDeckCount,
} from '@/lib/db/services';
import { getDatabase } from '@/lib/db';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const db = getDatabase();

    // Get recently visited decks
    const recentlyVisited = getRecentlyVisitedDecks(userId, 6);

    // Get recently created decks
    const recentlyCreated = getRecentlyCreatedDecks(userId, 6);

    // Get decks with due cards
    const dueDecks = getDecksWithDueCards(userId);

    // Get total stats
    const deckCount = getDeckCount(userId);

    // Get total card count
    const cardStats = db.prepare(`
      SELECT
        COUNT(c.id) as total_cards,
        COUNT(CASE WHEN cf.due <= datetime('now') THEN 1 END) as due_cards,
        COUNT(CASE WHEN cf.state = 'new' THEN 1 END) as new_cards
      FROM cards c
      JOIN decks d ON d.id = c.deck_id
      LEFT JOIN card_fsrs cf ON cf.card_id = c.id
      WHERE d.user_id = ?
    `).get(userId) as { total_cards: number; due_cards: number; new_cards: number };

    // Get study streak (days with at least one review)
    const streakData = db.prepare(`
      SELECT DATE(reviewed_at) as review_date
      FROM review_logs
      WHERE user_id = ?
      GROUP BY DATE(reviewed_at)
      ORDER BY review_date DESC
      LIMIT 30
    `).all(userId) as Array<{ review_date: string }>;

    // Calculate current streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streakData.length > 0) {
      const firstDate = streakData[0].review_date;
      if (firstDate === today || firstDate === yesterday) {
        streak = 1;
        for (let i = 1; i < streakData.length; i++) {
          const prevDate = new Date(streakData[i - 1].review_date);
          const currDate = new Date(streakData[i].review_date);
          const diff = (prevDate.getTime() - currDate.getTime()) / 86400000;
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      recentlyVisited,
      recentlyCreated,
      dueDecks,
      stats: {
        deckCount,
        totalCards: cardStats.total_cards,
        dueCards: cardStats.due_cards,
        newCards: cardStats.new_cards,
        streak,
      },
    });
  } catch (error) {
    return handleApiError('GET /api/dashboard', error, 'Failed to fetch dashboard data');
  }
});
