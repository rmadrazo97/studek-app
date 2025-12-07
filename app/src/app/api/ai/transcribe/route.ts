/**
 * Audio Transcription API
 *
 * Uses OpenAI's gpt-4o-transcribe model for high-quality speech-to-text.
 */

import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

// Check if AI is configured
const isConfigured = !!process.env.OPENAI_APIKEY;

export async function POST(req: Request) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: 'AI transcription not configured', code: 'AI_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get the audio file from form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided', code: 'MISSING_AUDIO' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB as per OpenAI limits)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] Processing audio: ${audioFile.name}, size: ${audioFile.size}, type: ${audioFile.type}`);

    // Call OpenAI transcription API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-transcribe',
      response_format: 'text',
      language: language || undefined,
      prompt: 'The following is a description of flashcards or educational content the user wants to create.',
    });

    console.log(`[Transcribe] Successfully transcribed audio`);

    return NextResponse.json({
      text: transcription,
      success: true,
    });

  } catch (error) {
    console.error('[Transcribe] Error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: error.message || 'OpenAI API error',
          code: 'OPENAI_ERROR'
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio', code: 'TRANSCRIPTION_FAILED' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if transcription is available
export async function GET() {
  return NextResponse.json({
    available: isConfigured,
    model: 'gpt-4o-transcribe',
  });
}
