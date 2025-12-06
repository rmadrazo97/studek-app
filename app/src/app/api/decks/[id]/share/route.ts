/**
 * GET /api/decks/[id]/share - Get share info for a deck
 * POST /api/decks/[id]/share - Create a share link or share with user
 * DELETE /api/decks/[id]/share - Remove a share
 */

import { NextResponse } from 'next/server';
import {
  withAuth,
  type AuthenticatedRequest,
  forbiddenResponse,
} from '@/lib/auth/middleware';
import {
  getDeckById,
  getShareLinksForDeck,
  getDeckSharesWithUsers,
  createShareLink,
  shareDeckWithUser,
  deleteShareLink,
  removeDeckShare,
  deactivateShareLink,
  getUserByEmail,
} from '@/lib/db/services';
import type { DeckShareLinkCreate, SharePermission } from '@/lib/db/types';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/decks/[id]/share
 * Get all share info (links and user shares) for a deck
 */
export const GET = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: deckId } = await context.params;
      const userId = request.auth.userId;

      // Get the deck and verify ownership
      const deck = getDeckById(deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      if (deck.user_id !== userId) {
        return forbiddenResponse('Only the deck owner can view share settings');
      }

      // Get share links and user shares
      const shareLinks = getShareLinksForDeck(deckId);
      const userShares = getDeckSharesWithUsers(deckId);

      return NextResponse.json({
        links: shareLinks,
        users: userShares.map((s) => ({
          id: s.share.id,
          user_id: s.user.id,
          email: s.user.email,
          name: s.user.name,
          permission: s.share.permission,
          created_at: s.share.created_at,
        })),
        is_public: deck.is_public,
      });
    } catch (error) {
      console.error('[API] GET /api/decks/[id]/share error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share info' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/decks/[id]/share
 * Create a share link or share with a specific user
 */
export const POST = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: deckId } = await context.params;
      const userId = request.auth.userId;

      // Get the deck and verify ownership
      const deck = getDeckById(deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      if (deck.user_id !== userId) {
        return forbiddenResponse('Only the deck owner can share this deck');
      }

      const body = await request.json();

      // Determine share type
      if (body.type === 'link') {
        // Create a share link
        const linkData: DeckShareLinkCreate = {
          deck_id: deckId,
          permission: body.permission || 'read',
          expires_at: body.expires_at,
          max_uses: body.max_uses,
        };

        const link = createShareLink(linkData);

        // Generate full URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/shared/${link.code}`;

        return NextResponse.json({
          ...link,
          url: shareUrl,
        }, { status: 201 });
      } else if (body.type === 'user') {
        // Share with a specific user
        if (!body.email || typeof body.email !== 'string') {
          return NextResponse.json(
            { error: 'User email is required' },
            { status: 400 }
          );
        }

        // Find the user by email
        const targetUser = getUserByEmail(body.email.trim().toLowerCase());
        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found with that email' },
            { status: 404 }
          );
        }

        // Can't share with yourself
        if (targetUser.id === userId) {
          return NextResponse.json(
            { error: 'Cannot share deck with yourself' },
            { status: 400 }
          );
        }

        const permission: SharePermission = body.permission || 'read';

        const share = shareDeckWithUser({
          deck_id: deckId,
          shared_with_user_id: targetUser.id,
          permission,
        });

        return NextResponse.json({
          id: share.id,
          user_id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          permission: share.permission,
          created_at: share.created_at,
        }, { status: 201 });
      } else {
        return NextResponse.json(
          { error: 'Invalid share type. Use "link" or "user".' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('[API] POST /api/decks/[id]/share error:', error);

      // Handle unique constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        return NextResponse.json(
          { error: 'Deck is already shared with this user' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/decks/[id]/share
 * Remove a share link or user share
 */
export const DELETE = withAuth(
  async (request: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: deckId } = await context.params;
      const userId = request.auth.userId;
      const { searchParams } = new URL(request.url);

      // Get the deck and verify ownership
      const deck = getDeckById(deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      if (deck.user_id !== userId) {
        return forbiddenResponse('Only the deck owner can manage shares');
      }

      const shareId = searchParams.get('shareId');
      const linkId = searchParams.get('linkId');

      if (linkId) {
        // Deactivate the share link (soft delete)
        const deactivated = deactivateShareLink(linkId);
        if (!deactivated) {
          return NextResponse.json(
            { error: 'Share link not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true });
      } else if (shareId) {
        // Remove user share
        const removed = removeDeckShare(shareId);
        if (!removed) {
          return NextResponse.json(
            { error: 'Share not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Specify shareId or linkId to remove' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('[API] DELETE /api/decks/[id]/share error:', error);
      return NextResponse.json(
        { error: 'Failed to remove share' },
        { status: 500 }
      );
    }
  }
);
