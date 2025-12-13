/**
 * URL/Web Content Extraction API Route
 *
 * POST /api/ai/extract/url - Extract content from a web page
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  extractURLContent,
  truncateURLContent,
  isValidURL,
} from '@/lib/ai/extractors/url';

interface ExtractRequest {
  url: string;
  max_length?: number;
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = (await request.json()) as ExtractRequest;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidURL(body.url)) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid http or https URL.' },
        { status: 400 }
      );
    }

    console.log(`[Extract URL] Fetching content from: ${body.url}`);

    const result = await extractURLContent(body.url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract content' },
        { status: 422 }
      );
    }

    // Truncate if needed
    const maxLength = body.max_length || 15000;
    const content = truncateURLContent(result.content || '', maxLength);
    const wasTruncated = content.length < (result.content?.length || 0);

    console.log(`[Extract URL] Successfully extracted ${content.length} characters from ${body.url}`);

    return NextResponse.json({
      success: true,
      url: result.url,
      title: result.title,
      description: result.description,
      content,
      originalLength: result.content?.length || 0,
      truncated: wasTruncated,
      wordCount: result.wordCount,
    });

  } catch (error) {
    return handleApiError('POST /api/ai/extract/url', error, 'Failed to extract web content');
  }
});
