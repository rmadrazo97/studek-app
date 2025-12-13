/**
 * URL/Web Content Extractor
 *
 * Extracts text content from web pages for AI deck generation.
 */

import * as cheerio from 'cheerio';

export interface URLExtractionResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  description?: string;
  error?: string;
  wordCount?: number;
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Fetch and extract content from a URL
 */
export async function extractURLContent(url: string): Promise<URLExtractionResult> {
  if (!isValidURL(url)) {
    return {
      success: false,
      url,
      error: 'Invalid URL format. Please provide a valid http or https URL.',
    };
  }

  try {
    // Fetch the page with appropriate headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudekBot/1.0; +https://studek.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          url,
          error: 'Access denied. The website does not allow automated access.',
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          url,
          error: 'Page not found. Please check the URL and try again.',
        };
      }
      return {
        success: false,
        url,
        error: `Failed to fetch page: HTTP ${response.status}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return {
        success: false,
        url,
        error: 'URL does not point to an HTML page. Please provide a link to a web page.',
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, header, footer, aside, [role="banner"], [role="navigation"], [role="complementary"], .sidebar, .advertisement, .ad, .ads, .comments, .social-share').remove();

    // Extract title
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  undefined;

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       undefined;

    // Extract main content
    // Try common main content selectors
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '#main',
    ];

    let mainContent = '';
    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContent = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!mainContent) {
      mainContent = $('body').text();
    }

    // Clean up the extracted text
    const cleanedContent = cleanWebText(mainContent);

    if (!cleanedContent || cleanedContent.length < 50) {
      return {
        success: false,
        url,
        error: 'Could not extract meaningful content from this page. It may be heavily dynamic or JavaScript-rendered.',
      };
    }

    const wordCount = cleanedContent.split(/\s+/).length;

    return {
      success: true,
      url,
      title: title ? cleanWebText(title) : undefined,
      description: description ? cleanWebText(description) : undefined,
      content: cleanedContent,
      wordCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        success: false,
        url,
        error: 'Request timed out. The page took too long to load.',
      };
    }

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      return {
        success: false,
        url,
        error: 'Could not reach the website. Please check the URL.',
      };
    }

    if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
      return {
        success: false,
        url,
        error: 'SSL certificate error. The website may have security issues.',
      };
    }

    return {
      success: false,
      url,
      error: `Failed to extract content: ${errorMessage}`,
    };
  }
}

/**
 * Clean up extracted web text
 */
function cleanWebText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common artifacts
    .replace(/\t/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    // Remove excessive spaces
    .replace(/  +/g, ' ')
    // Trim
    .trim();
}

/**
 * Truncate URL content to a maximum length
 */
export function truncateURLContent(content: string, maxLength: number = 15000): string {
  if (content.length <= maxLength) {
    return content;
  }

  const truncated = content.substring(0, maxLength);

  // Try to break at paragraph or sentence boundary
  const lastDoubleSpace = truncated.lastIndexOf('  ');
  const lastPeriod = truncated.lastIndexOf('. ');
  const breakPoint = Math.max(lastDoubleSpace, lastPeriod);

  if (breakPoint > maxLength * 0.8) {
    return truncated.substring(0, breakPoint + 1).trim() + '\n\n[Content truncated...]';
  }

  return truncated.trim() + '...\n\n[Content truncated...]';
}

/**
 * Extract content from multiple URLs
 */
export async function extractMultipleURLs(
  urls: string[]
): Promise<{ url: string; result: URLExtractionResult }[]> {
  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      result: await extractURLContent(url),
    }))
  );
  return results;
}
