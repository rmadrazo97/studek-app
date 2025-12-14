/**
 * PDF Content Extractor
 *
 * Extracts text content from PDF files for AI deck generation.
 */

// @ts-expect-error - pdf-parse doesn't have proper ESM types
import * as pdfParse from 'pdf-parse';
const pdf = pdfParse.default || pdfParse;

export interface PDFExtractionResult {
  success: boolean;
  filename?: string;
  text?: string;
  pageCount?: number;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

/**
 * Extract text content from a PDF buffer
 */
export async function extractPDFContent(
  buffer: Buffer,
  filename?: string
): Promise<PDFExtractionResult> {
  try {
    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        filename,
        error: 'Empty PDF file provided.',
      };
    }

    // Check for PDF magic bytes
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF')) {
      return {
        success: false,
        filename,
        error: 'Invalid PDF file. The file does not appear to be a valid PDF document.',
      };
    }

    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        filename,
        error: 'Could not extract text from PDF. The PDF may be scanned/image-based or have protected content.',
      };
    }

    // Clean up extracted text
    const cleanedText = cleanPDFText(data.text);

    return {
      success: true,
      filename,
      text: cleanedText,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title || undefined,
        author: data.info?.Author || undefined,
        subject: data.info?.Subject || undefined,
        keywords: data.info?.Keywords || undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
      return {
        success: false,
        filename,
        error: 'This PDF is password-protected. Please provide an unprotected PDF.',
      };
    }

    if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
      return {
        success: false,
        filename,
        error: 'The PDF file appears to be corrupted or invalid.',
      };
    }

    return {
      success: false,
      filename,
      error: `Failed to extract PDF content: ${errorMessage}`,
    };
  }
}

/**
 * Clean up extracted PDF text
 */
function cleanPDFText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove page numbers that stand alone (common in PDFs)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove excessive spaces
    .replace(/[ \t]+/g, ' ')
    // Clean up line breaks within paragraphs (heuristic: if line doesn't end with punctuation)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    // Final cleanup
    .trim();
}

/**
 * Truncate PDF text to a maximum character length while preserving structure
 */
export function truncatePDFText(text: string, maxLength: number = 20000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find a good breaking point (end of paragraph or sentence)
  const truncated = text.substring(0, maxLength);

  // Try to break at paragraph end
  const lastDoubleNewline = truncated.lastIndexOf('\n\n');
  if (lastDoubleNewline > maxLength * 0.8) {
    return truncated.substring(0, lastDoubleNewline) + '\n\n[Content truncated...]';
  }

  // Try to break at sentence end
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');
  const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (breakPoint > maxLength * 0.8) {
    return truncated.substring(0, breakPoint + 1) + '\n\n[Content truncated...]';
  }

  return truncated + '...\n\n[Content truncated...]';
}

/**
 * Extract sections/chapters from PDF text (best effort)
 */
export function extractPDFSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];

  // Common section header patterns
  const sectionPatterns = [
    /^(Chapter\s+\d+[:.]\s*.+)$/gim,
    /^(\d+\.\s+[A-Z].+)$/gm,
    /^((?:Introduction|Conclusion|Summary|Overview|Abstract|References|Bibliography)[:.])$/gim,
    /^((?:Section|Part)\s+\d+[:.]\s*.+)$/gim,
  ];

  // Try to find sections
  let currentSection = { title: 'Main Content', content: '' };
  const lines = text.split('\n');

  for (const line of lines) {
    let isHeader = false;

    for (const pattern of sectionPatterns) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(line)) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection, content: currentSection.content.trim() });
        }
        currentSection = { title: line.trim(), content: '' };
        isHeader = true;
        break;
      }
    }

    if (!isHeader) {
      currentSection.content += line + '\n';
    }
  }

  // Don't forget the last section
  if (currentSection.content.trim()) {
    sections.push({ ...currentSection, content: currentSection.content.trim() });
  }

  return sections.length > 0 ? sections : [{ title: 'Document Content', content: text }];
}
