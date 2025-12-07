/**
 * OpenAI Transcription Hook
 *
 * Records audio using MediaRecorder and transcribes using OpenAI's
 * gpt-4o-transcribe model for high-quality speech-to-text.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, ApiClientError } from '@/lib/api/client';

// ============================================
// Types
// ============================================

export interface UseOpenAITranscriptionOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export interface UseOpenAITranscriptionReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  isAvailable: boolean | null;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
}

interface TranscriptionResponse {
  text: string;
  success: boolean;
}

interface AvailabilityResponse {
  available: boolean;
  model: string;
}

// ============================================
// Hook
// ============================================

export function useOpenAITranscription(
  options: UseOpenAITranscriptionOptions = {}
): UseOpenAITranscriptionReturn {
  const {
    language = 'en',
    onTranscript,
    onError,
    onRecordingStart,
    onRecordingStop,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaRecorder is supported
  const isSupported = typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!window.MediaRecorder;

  // Check if OpenAI transcription is available on mount
  useEffect(() => {
    if (!isSupported) {
      setIsAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      try {
        const response = await apiClient.get<AvailabilityResponse>('/api/ai/transcribe');
        setIsAvailable(response.available);
      } catch {
        // If we can't reach the API, assume it's not available
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      onError?.('Audio recording is not supported in this browser');
      return;
    }

    if (isAvailable === false) {
      setError('AI transcription is not available');
      onError?.('AI transcription is not available');
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Determine the best supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        onError?.('Recording error occurred');
        setIsRecording(false);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setIsRecording(false);
        onRecordingStop?.();

        // Process the recorded audio
        if (audioChunksRef.current.length > 0) {
          await transcribeAudio();
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      onRecordingStart?.();

      console.log('[OpenAITranscription] Recording started with mimeType:', mimeType);

    } catch (err) {
      console.error('[OpenAITranscription] Error starting recording:', err);

      let errorMessage = 'Failed to start recording';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your microphone.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Microphone is busy or unavailable.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [isSupported, isAvailable, onError, onRecordingStart, onRecordingStop]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[OpenAITranscription] Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const transcribeAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Combine audio chunks into a single blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: audioChunksRef.current[0].type || 'audio/webm'
      });

      console.log('[OpenAITranscription] Transcribing audio:', {
        size: audioBlob.size,
        type: audioBlob.type,
      });

      // Check minimum size (OpenAI needs at least some audio)
      if (audioBlob.size < 1000) {
        setError('Recording too short. Please record longer.');
        onError?.('Recording too short. Please record longer.');
        setIsTranscribing(false);
        return;
      }

      // Create form data with the audio file
      const formData = new FormData();

      // Determine file extension based on mime type
      let extension = 'webm';
      if (audioBlob.type.includes('mp4')) extension = 'mp4';
      else if (audioBlob.type.includes('ogg')) extension = 'ogg';
      else if (audioBlob.type.includes('wav')) extension = 'wav';

      formData.append('audio', audioBlob, `recording.${extension}`);
      formData.append('language', language);

      // Get the auth token
      const token = localStorage.getItem('studek_access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send to API (can't use apiClient for FormData)
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json() as TranscriptionResponse;

      if (data.success && data.text) {
        const transcribedText = data.text.trim();
        setTranscript(prev => {
          const newTranscript = prev ? prev + ' ' + transcribedText : transcribedText;
          return newTranscript;
        });
        onTranscript?.(transcribedText);
        console.log('[OpenAITranscription] Transcription successful:', transcribedText.substring(0, 100) + '...');
      }

    } catch (err) {
      console.error('[OpenAITranscription] Transcription error:', err);

      let errorMessage = 'Failed to transcribe audio';
      if (err instanceof ApiClientError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  }, [language, onTranscript, onError]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    audioChunksRef.current = [];
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSupported,
    isAvailable,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}
