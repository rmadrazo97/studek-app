/**
 * Content Extractors
 *
 * Utilities for extracting content from various sources (YouTube, PDF, URLs)
 * to create AI-generated flashcard decks.
 */

// YouTube extractor
export {
  extractYouTubeTranscript,
  extractYouTubeVideoId,
  truncateTranscript,
  type YouTubeTranscriptSegment,
  type YouTubeExtractionResult,
} from './youtube';

// PDF extractor
export {
  extractPDFContent,
  truncatePDFText,
  extractPDFSections,
  type PDFExtractionResult,
} from './pdf';

// URL/Web extractor
export {
  extractURLContent,
  extractMultipleURLs,
  truncateURLContent,
  isValidURL,
  type URLExtractionResult,
} from './url';

/**
 * Source types for AI deck generation
 */
export type SourceType = 'text' | 'youtube' | 'pdf' | 'url';

export interface ExtractionSource {
  type: SourceType;
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Maximum content lengths for each source type (characters)
 */
export const MAX_CONTENT_LENGTHS: Record<SourceType, number> = {
  text: 10000,
  youtube: 15000,
  pdf: 20000,
  url: 15000,
};

/**
 * Get truncation function for source type
 */
export function truncateForSourceType(content: string, sourceType: SourceType): string {
  const maxLength = MAX_CONTENT_LENGTHS[sourceType];

  if (content.length <= maxLength) {
    return content;
  }

  // Find a good breaking point
  const truncated = content.substring(0, maxLength);
  const lastSentence = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );

  if (lastSentence > maxLength * 0.8) {
    return truncated.substring(0, lastSentence + 1).trim() + '\n\n[Content truncated due to length...]';
  }

  return truncated.trim() + '...\n\n[Content truncated due to length...]';
}
