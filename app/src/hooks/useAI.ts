/**
 * AI Generation Hook
 *
 * React hook for AI-powered deck and card generation.
 */

import { useState, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api/client';

// ============================================
// Types
// ============================================

export type SourceType = 'text' | 'youtube' | 'pdf' | 'url';

export interface SourceInput {
  type: Exclude<SourceType, 'text'>;
  content: string;
  title?: string;
  url?: string;
}

export interface GeneratedCard {
  id?: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface GeneratedDeck {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export interface GenerateResult {
  success: boolean;
  action: 'create_deck' | 'add_cards';
  deck?: GeneratedDeck;
  cards: GeneratedCard[];
  message: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ExtractionResult {
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
  // YouTube specific
  videoId?: string;
  duration?: number;
  // PDF specific
  filename?: string;
  pageCount?: number;
  // URL specific
  url?: string;
  description?: string;
  wordCount?: number;
  // Common
  originalLength?: number;
  truncated?: boolean;
}

export interface AIStatus {
  configured: boolean;
  model: string;
}

export interface UseAIOptions {
  onSuccess?: (result: GenerateResult) => void;
  onError?: (error: Error) => void;
}

// ============================================
// Hook
// ============================================

export function useAI(options: UseAIOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [extractionError, setExtractionError] = useState<Error | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [extractedContent, setExtractedContent] = useState<ExtractionResult | null>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);

  /**
   * Check if AI is configured
   */
  const checkStatus = useCallback(async (): Promise<AIStatus> => {
    try {
      const data = await apiClient.get<AIStatus>('/api/ai/generate');
      setStatus(data);
      return data;
    } catch {
      const status = { configured: false, model: 'unknown' };
      setStatus(status);
      return status;
    }
  }, []);

  /**
   * Extract content from YouTube video
   */
  const extractYouTube = useCallback(async (url: string): Promise<ExtractionResult | null> => {
    setIsExtracting(true);
    setExtractionError(null);
    setExtractedContent(null);

    try {
      const data = await apiClient.post<ExtractionResult>('/api/ai/extract/youtube', { url });
      setExtractedContent(data);
      return data;
    } catch (err) {
      const error = err instanceof ApiClientError ? err : err instanceof Error ? err : new Error('Failed to extract YouTube content');
      setExtractionError(error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Extract content from PDF file
   */
  const extractPDF = useCallback(async (file: File): Promise<ExtractionResult | null> => {
    setIsExtracting(true);
    setExtractionError(null);
    setExtractedContent(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/extract/pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json() as ExtractionResult;
      setExtractedContent(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to extract PDF content');
      setExtractionError(error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Extract content from URL
   */
  const extractURL = useCallback(async (url: string): Promise<ExtractionResult | null> => {
    setIsExtracting(true);
    setExtractionError(null);
    setExtractedContent(null);

    try {
      const data = await apiClient.post<ExtractionResult>('/api/ai/extract/url', { url });
      setExtractedContent(data);
      return data;
    } catch (err) {
      const error = err instanceof ApiClientError ? err : err instanceof Error ? err : new Error('Failed to extract URL content');
      setExtractionError(error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Generate a new deck from a prompt or source
   */
  const generateDeck = useCallback(async (
    prompt: string,
    options?: {
      save?: boolean;
      isPublic?: boolean;
      source?: SourceInput;
      focusPrompt?: string;
    }
  ): Promise<GenerateResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const requestBody: Record<string, unknown> = {
        deck_id: null,
        options: {
          save: options?.save ?? true,
          is_public: options?.isPublic ?? false,
        },
      };

      // Include prompt if provided
      if (prompt) {
        requestBody.prompt = prompt;
      }

      // Include source if provided
      if (options?.source) {
        requestBody.source = options.source;
      }

      // Include focus prompt if provided
      if (options?.focusPrompt) {
        requestBody.focus_prompt = options.focusPrompt;
      }

      const data = await apiClient.post<GenerateResult>('/api/ai/generate', requestBody);
      setResult(data);
      options?.save !== false && window.location.reload(); // Refresh to show new deck
      return data;

    } catch (err) {
      const error = err instanceof ApiClientError ? err : err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Add cards to an existing deck
   */
  const addCards = useCallback(async (
    deckId: string,
    prompt: string,
    options?: {
      save?: boolean;
      source?: SourceInput;
      focusPrompt?: string;
    }
  ): Promise<GenerateResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const requestBody: Record<string, unknown> = {
        deck_id: deckId,
        options: {
          save: options?.save ?? true,
        },
      };

      // Include prompt if provided
      if (prompt) {
        requestBody.prompt = prompt;
      }

      // Include source if provided
      if (options?.source) {
        requestBody.source = options.source;
      }

      // Include focus prompt if provided
      if (options?.focusPrompt) {
        requestBody.focus_prompt = options.focusPrompt;
      }

      const data = await apiClient.post<GenerateResult>('/api/ai/generate', requestBody);
      setResult(data);
      return data;

    } catch (err) {
      const error = err instanceof ApiClientError ? err : err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Preview generation without saving
   */
  const preview = useCallback(async (
    prompt: string,
    deckId?: string
  ): Promise<GenerateResult | null> => {
    if (deckId) {
      return addCards(deckId, prompt, { save: false });
    }
    return generateDeck(prompt, { save: false });
  }, [addCards, generateDeck]);

  /**
   * Clear current result and error
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setExtractedContent(null);
    setExtractionError(null);
  }, []);

  /**
   * Clear extracted content only
   */
  const clearExtraction = useCallback(() => {
    setExtractedContent(null);
    setExtractionError(null);
  }, []);

  return {
    // State
    isGenerating,
    isExtracting,
    error,
    extractionError,
    result,
    extractedContent,
    status,
    // Actions
    checkStatus,
    generateDeck,
    addCards,
    preview,
    reset,
    // Extraction actions
    extractYouTube,
    extractPDF,
    extractURL,
    clearExtraction,
  };
}
