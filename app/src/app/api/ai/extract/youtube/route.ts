/**
 * YouTube Content Extraction API Route
 *
 * POST /api/ai/extract/youtube - Extract transcript from a YouTube video
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  extractYouTubeTranscript,
  extractYouTubeVideoId,
  truncateTranscript,
} from '@/lib/ai/extractors/youtube';

interface ExtractRequest {
  url: string;
  max_length?: number;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = (await request.json()) as ExtractRequest;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(body.url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
        { status: 400 }
      );
    }

    console.log(`[Extract YouTube] Extracting transcript for video: ${videoId}`);

    const result = await extractYouTubeTranscript(body.url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract transcript' },
        { status: 422 }
      );
    }

    // Truncate if needed
    const maxLength = body.max_length || 15000;
    const content = truncateTranscript(result.transcript || '', maxLength);
    const wasTruncated = content.length < (result.transcript?.length || 0);

    console.log(`[Extract YouTube] Successfully extracted ${content.length} characters from video ${videoId}`);

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      content,
      originalLength: result.transcript?.length || 0,
      truncated: wasTruncated,
      duration: result.duration,
    });

  } catch (error) {
    return handleApiError('POST /api/ai/extract/youtube', error, 'Failed to extract YouTube transcript');
  }
});
