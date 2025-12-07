/**
 * GET /api/leaderboard - Get league leaderboard
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  getUserStats,
  getLeaderboard,
  getUserRank,
} from '@/lib/db/services/gamification';
import { getLeagueTier, LEAGUE_TIERS } from '@/lib/gamification';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;
    const { searchParams } = new URL(request.url);
    const tier = parseInt(searchParams.get('tier') || '0', 10);

    const stats = getUserStats(userId);
    const currentTier = tier || stats.league_tier;
    const tierInfo = getLeagueTier(currentTier);

    // Get leaderboard for the tier
    const leaderboard = getLeaderboard(currentTier, 30);

    // Get user's rank
    const userRank = getUserRank(userId);

    // Find user in leaderboard
    const userEntry = leaderboard.find(e => e.user_id === userId);
    const userPosition = userEntry
      ? leaderboard.indexOf(userEntry) + 1
      : userRank.rank;

    return NextResponse.json({
      tier: {
        id: tierInfo.id,
        name: tierInfo.name,
        icon: tierInfo.icon,
        color: tierInfo.color,
        promotionZone: tierInfo.promotionZone,
        demotionZone: tierInfo.demotionZone,
      },
      allTiers: LEAGUE_TIERS.map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
      })),
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        name: entry.user_name || 'Anonymous',
        weeklyXP: entry.weekly_xp,
        isCurrentUser: entry.user_id === userId,
        inPromotionZone: index + 1 <= tierInfo.promotionZone,
        inDemotionZone: tierInfo.demotionZone > 0 &&
          index + 1 > leaderboard.length - tierInfo.demotionZone,
      })),
      user: {
        rank: userPosition,
        weeklyXP: stats.weekly_xp,
        inPromotionZone: userPosition <= tierInfo.promotionZone,
        inDemotionZone: tierInfo.demotionZone > 0 &&
          userPosition > userRank.total - tierInfo.demotionZone,
        xpToPromotion: userPosition <= tierInfo.promotionZone
          ? 0
          : leaderboard[tierInfo.promotionZone - 1]?.weekly_xp - stats.weekly_xp || 0,
        xpAboveDemotion: tierInfo.demotionZone > 0
          ? stats.weekly_xp - (leaderboard[leaderboard.length - tierInfo.demotionZone]?.weekly_xp || 0)
          : stats.weekly_xp,
      },
    });
  } catch (error) {
    return handleApiError('GET /api/leaderboard', error, 'Failed to fetch leaderboard');
  }
});
