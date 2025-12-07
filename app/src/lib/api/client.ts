/**
 * API Client
 *
 * Centralized fetch wrapper that automatically includes credentials
 * (both cookies and Bearer token) and handles common response patterns.
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'credentials'> {
  skipAuth?: boolean; // Skip adding auth header (for public endpoints)
}

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('studek_access_token');
}

/**
 * Make an API request with credentials automatically included
 */
export async function api<T = unknown>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  // Build headers with auth token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Bearer token if available and not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Merge with any custom headers
  const customHeaders = fetchOptions.headers as Record<string, string> | undefined;
  const mergedHeaders = { ...headers, ...customHeaders };

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Always include cookies for auth
    headers: mergedHeaders,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText || 'Request failed' };
    }

    const error = new ApiClientError(
      errorData.error || 'Request failed',
      response.status,
      errorData.code,
      errorData.details
    );
    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const apiClient = {
  get: <T = unknown>(url: string, options?: ApiRequestOptions) =>
    api<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    api<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    api<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    api<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: ApiRequestOptions) =>
    api<T>(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
