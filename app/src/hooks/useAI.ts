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
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
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
   * Generate a new deck from a prompt
   */
  const generateDeck = useCallback(async (
    prompt: string,
    options?: {
      save?: boolean;
      isPublic?: boolean;
    }
  ): Promise<GenerateResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = {
        prompt,
        deck_id: null,
        options: {
          save: options?.save ?? true,
          is_public: options?.isPublic ?? false,
        },
      };

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
    }
  ): Promise<GenerateResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await apiClient.post<GenerateResult>('/api/ai/generate', {
        prompt,
        deck_id: deckId,
        options: {
          save: options?.save ?? true,
        },
      });

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
  }, []);

  return {
    // State
    isGenerating,
    error,
    result,
    status,
    // Actions
    checkStatus,
    generateDeck,
    addCards,
    preview,
    reset,
  };
}
