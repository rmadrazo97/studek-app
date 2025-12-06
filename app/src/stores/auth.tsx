"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ============================================
// Types
// ============================================

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiError {
  error: string;
  code?: string;
}

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: "studek_access_token",
  REFRESH_TOKEN: "studek_refresh_token",
  USER: "studek_user",
} as const;

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load stored auth state on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setState({
            user: JSON.parse(storedUser),
            accessToken: storedToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        // Clear corrupted storage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredAuth();
  }, []);

  // Store auth data
  const storeAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

    setState({
      user: data.user,
      accessToken: data.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  // Clear auth data
  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiError).error || "Login failed");
      }

      storeAuth(data as AuthResponse);
    },
    [storeAuth]
  );

  // Register
  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiError).error || "Registration failed");
      }

      storeAuth(data as AuthResponse);
    },
    [storeAuth]
  );

  // Logout
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout API errors
      }
    }

    clearAuth();
  }, [clearAuth]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!storedRefreshToken) {
      clearAuth();
      return;
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      // Update tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      setState((prev) => ({
        ...prev,
        accessToken: data.accessToken,
      }));
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Refresh token every 14 minutes (token expires in 15)
    const interval = setInterval(
      () => {
        refreshToken();
      },
      14 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the stored access token (for use outside of React components)
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Create an authenticated fetch function
 */
export function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();

    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin") || hasRole(user, "superadmin");
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(user: User | null): boolean {
  return hasRole(user, "superadmin");
}
