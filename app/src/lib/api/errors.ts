/**
 * API Error Handling Utilities
 *
 * Provides consistent error logging and response formatting for API routes.
 */

import { NextResponse } from 'next/server';

/**
 * Log an API error with full details including stack trace
 */
export function logApiError(endpoint: string, error: unknown): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errStack = error instanceof Error ? error.stack : undefined;

  console.error(`[API] ${endpoint} error: ${errMsg}`);
  if (errStack) {
    console.error(errStack);
  }
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  error: unknown,
  status: number = 500
): NextResponse {
  const details = error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    { error: message, details },
    { status }
  );
}

/**
 * Handle an API error with logging and response
 */
export function handleApiError(
  endpoint: string,
  error: unknown,
  message: string = 'Internal server error',
  status: number = 500
): NextResponse {
  logApiError(endpoint, error);
  return errorResponse(message, error, status);
}
