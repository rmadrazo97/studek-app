/**
 * POST /api/import/apkg - Import an Anki deck package
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { parseAPKG } from '@/lib/apkg';
import { createDeck, createCards } from '@/lib/db/services';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { DeckCategory } from '@/lib/db/types';
import { assertDeckCreationAllowed, PlanLimitError, planLimitToResponse } from '@/lib/billing/limits';

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Media directory
const MEDIA_DIR = join(process.cwd(), 'public', 'media');

/**
 * POST /api/import/apkg
 * Import an Anki deck package file
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.auth.userId;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const categoryInput = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .apkg files are supported.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the APKG file
    let result;
    try {
      result = parseAPKG(buffer);
    } catch (parseError) {
      console.error('[API] APKG parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse APKG file. The file may be corrupted or in an unsupported format.' },
        { status: 400 }
      );
    }

    if (result.decks.length === 0) {
      return NextResponse.json(
        { error: 'No decks found in the APKG file' },
        { status: 400 }
      );
    }

    // Create media directory if needed
    if (result.totalMedia > 0 && !existsSync(MEDIA_DIR)) {
      mkdirSync(MEDIA_DIR, { recursive: true });
    }

    // Import each deck
    const importedDecks = [];
    let totalCardsImported = 0;
    let totalMediaImported = 0;

    for (const parsedDeck of result.decks) {
      // Generate a unique prefix for this import's media files
      const mediaPrefix = randomUUID().slice(0, 8);

      // Save media files
      const mediaMapping = new Map<string, string>();
      for (const [filename, buffer] of parsedDeck.mediaFiles) {
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newFilename = `${mediaPrefix}_${safeName}`;
        const filepath = join(MEDIA_DIR, newFilename);

        try {
          writeFileSync(filepath, buffer);
          mediaMapping.set(filename, `/media/${newFilename}`);
          totalMediaImported++;
        } catch (err) {
          console.error(`[API] Failed to save media file ${filename}:`, err);
        }
      }

      // Create the deck
      assertDeckCreationAllowed(userId, { isAiGenerated: false });
      const deck = createDeck({
        user_id: userId,
        name: parsedDeck.name || 'Imported Deck',
        description: parsedDeck.description || `Imported from ${file.name}`,
        parent_id: null,
        hierarchy: null,
        is_public: false,
        category: categoryInput as DeckCategory | null,
      });

      // Convert cards and update media references
      const cardsToCreate = parsedDeck.cards.map((card) => {
        let front = card.front;
        let back = card.back;

        // Update media references in content
        for (const [oldName, newPath] of mediaMapping) {
          front = front.replace(new RegExp(escapeRegex(oldName), 'g'), newPath);
          back = back.replace(new RegExp(escapeRegex(oldName), 'g'), newPath);
        }

        return {
          deck_id: deck.id,
          type: card.type as 'basic' | 'cloze',
          front,
          back,
          tags: card.tags,
          media_type: null,
          media_url: null,
        };
      });

      // Create cards in bulk
      if (cardsToCreate.length > 0) {
        createCards(cardsToCreate);
        totalCardsImported += cardsToCreate.length;
      }

      importedDecks.push({
        id: deck.id,
        name: deck.name,
        cardCount: cardsToCreate.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedDecks.length} deck(s) with ${totalCardsImported} cards`,
      decks: importedDecks,
      stats: {
        totalDecks: importedDecks.length,
        totalCards: totalCardsImported,
        totalMedia: totalMediaImported,
      },
    });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(planLimitToResponse(error), { status: error.statusCode });
    }
    console.error('[API] POST /api/import/apkg error:', error);
    return NextResponse.json(
      { error: 'Failed to import APKG file' },
      { status: 500 }
    );
  }
});

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
