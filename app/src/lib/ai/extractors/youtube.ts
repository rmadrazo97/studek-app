/**
 * YouTube Content Extractor
 *
 * Extracts transcripts from YouTube videos for AI deck generation.
 */

import { YoutubeTranscript } from 'youtube-transcript';

export interface YouTubeTranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface YouTubeExtractionResult {
  success: boolean;
  videoId: string;
  title?: string;
  transcript?: string;
  segments?: YouTubeTranscriptSegment[];
  error?: string;
  duration?: number;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch transcript from a YouTube video
 */
export async function extractYouTubeTranscript(
  urlOrId: string
): Promise<YouTubeExtractionResult> {
  const videoId = extractYouTubeVideoId(urlOrId);

  if (!videoId) {
    return {
      success: false,
      videoId: urlOrId,
      error: 'Invalid YouTube URL or video ID. Please provide a valid YouTube link.',
    };
  }

  try {
    const transcriptSegments = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptSegments || transcriptSegments.length === 0) {
      return {
        success: false,
        videoId,
        error: 'No transcript available for this video. The video may not have captions enabled.',
      };
    }

    // Convert to our format and combine into full transcript
    const segments: YouTubeTranscriptSegment[] = transcriptSegments.map(segment => ({
      text: segment.text,
      offset: segment.offset,
      duration: segment.duration,
    }));

    // Clean up and combine transcript text
    const fullTranscript = segments
      .map(s => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Calculate total duration
    const lastSegment = segments[segments.length - 1];
    const totalDuration = lastSegment ? lastSegment.offset + lastSegment.duration : 0;

    return {
      success: true,
      videoId,
      transcript: fullTranscript,
      segments,
      duration: totalDuration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle common errors with user-friendly messages
    if (errorMessage.includes('Could not find') || errorMessage.includes('No transcript')) {
      return {
        success: false,
        videoId,
        error: 'Transcript not available. This video may not have captions, or they may be disabled.',
      };
    }

    if (errorMessage.includes('Video unavailable') || errorMessage.includes('Private video')) {
      return {
        success: false,
        videoId,
        error: 'This video is unavailable or private. Please use a public video.',
      };
    }

    return {
      success: false,
      videoId,
      error: `Failed to extract transcript: ${errorMessage}`,
    };
  }
}

/**
 * Truncate transcript to a maximum character length while preserving complete sentences
 */
export function truncateTranscript(transcript: string, maxLength: number = 15000): string {
  if (transcript.length <= maxLength) {
    return transcript;
  }

  // Find a good breaking point (end of sentence) near the max length
  const truncated = transcript.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');

  const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (breakPoint > maxLength * 0.8) {
    return truncated.substring(0, breakPoint + 1);
  }

  return truncated + '...';
}
