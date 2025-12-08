/**
 * API Client
 *
 * Centralized fetch wrapper that automatically includes credentials
 * (both cookies and Bearer token) and handles common response patterns.
 * Automatically refreshes expired tokens and retries failed requests.
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'credentials'> {
  skipAuth?: boolean; // Skip adding auth header (for public endpoints)
  skipRetry?: boolean; // Skip automatic retry on 401 (internal use)
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'studek_access_token',
  REFRESH_TOKEN: 'studek_refresh_token',
};

// Track if a refresh is in progress to prevent multiple simultaneous refreshes
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Refresh the access token using the refresh token
 * Uses a singleton promise to prevent multiple simultaneous refresh requests
 */
async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // Create the refresh promise
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed - clear tokens
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem('studek_user');
        return null;
      }

      const data = await response.json();

      // Store new tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      // Clear the promise so future requests can try again
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an API request with credentials automatically included
 */
export async function api<T = unknown>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, skipRetry, ...fetchOptions } = options;

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

  // Handle 401 Unauthorized - try to refresh token and retry
  if (response.status === 401 && !skipAuth && !skipRetry) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the request with the new token
      const retryHeaders = { ...mergedHeaders, Authorization: `Bearer ${newToken}` };
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers: retryHeaders,
      });

      if (retryResponse.ok) {
        const contentType = retryResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return {} as T;
        }
        return retryResponse.json();
      }

      // Retry also failed
      let errorData: ApiError;
      try {
        errorData = await retryResponse.json();
      } catch {
        errorData = { error: retryResponse.statusText || 'Request failed' };
      }
      throw new ApiClientError(
        errorData.error || 'Request failed',
        retryResponse.status,
        errorData.code,
        errorData.details
      );
    }
  }

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
