/**
 * PDF Content Extraction API Route
 *
 * POST /api/ai/extract/pdf - Extract text content from a PDF file
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  extractPDFContent,
  truncatePDFText,
} from '@/lib/ai/extractors/pdf';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const maxLength = parseInt(formData.get('max_length') as string) || 20000;

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF document' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    console.log(`[Extract PDF] Processing file: ${file.name} (${file.size} bytes)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractPDFContent(buffer, file.name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract PDF content' },
        { status: 422 }
      );
    }

    // Truncate if needed
    const content = truncatePDFText(result.text || '', maxLength);
    const wasTruncated = content.length < (result.text?.length || 0);

    console.log(`[Extract PDF] Successfully extracted ${content.length} characters from ${file.name}`);

    return NextResponse.json({
      success: true,
      filename: result.filename,
      content,
      originalLength: result.text?.length || 0,
      truncated: wasTruncated,
      pageCount: result.pageCount,
      metadata: result.metadata,
    });

  } catch (error) {
    return handleApiError('POST /api/ai/extract/pdf', error, 'Failed to extract PDF content');
  }
});
