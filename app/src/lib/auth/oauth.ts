/**
 * OAuth Service
 *
 * Handles OAuth authentication with Google and GitHub providers.
 */

import { executeRaw, runRaw } from '../db';
import { generateId, now } from '../db/crud';
import { createUser, getUserByEmail } from '../db/services/users';
import { assignRoleToUserByName } from './rbac';
import { getSafeUser } from './auth';
import { createToken, generateRandomToken, hashToken } from './crypto';
import { AUTH_CONSTANTS, DEFAULT_ROLES, AuthError } from './types';
import type { AuthResponse, SafeUser } from './types';

// ============================================
// Types
// ============================================

export type OAuthProvider = 'google' | 'github';

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_account_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

// ============================================
// OAuth Configuration
// ============================================

function getOAuthConfig(provider: OAuthProvider) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studek.com';

  switch (provider) {
    case 'google':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        redirectUri: `${baseUrl}/api/auth/callback/google`,
        scopes: ['email', 'profile'],
      };
    case 'github':
      return {
        clientId: process.env.GH_CLIENT_ID || '',
        clientSecret: process.env.GH_CLIENT_SECRET || '',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        emailsUrl: 'https://api.github.com/user/emails',
        redirectUri: `${baseUrl}/api/auth/callback/github`,
        scopes: ['user:email'],
      };
  }
}

// ============================================
// OAuth State Management
// ============================================

const oauthStates = new Map<string, { provider: OAuthProvider; createdAt: number }>();

// Clean up old states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a state parameter for OAuth flow
 */
export function generateOAuthState(provider: OAuthProvider): string {
  const state = generateRandomToken();
  oauthStates.set(state, { provider, createdAt: Date.now() });
  return state;
}

/**
 * Verify and consume a state parameter
 */
export function verifyOAuthState(state: string): OAuthProvider | null {
  const data = oauthStates.get(state);
  if (!data) return null;

  // Check if state is expired (10 minutes)
  if (Date.now() - data.createdAt > 10 * 60 * 1000) {
    oauthStates.delete(state);
    return null;
  }

  oauthStates.delete(state);
  return data.provider;
}

// ============================================
// OAuth URLs
// ============================================

/**
 * Get the OAuth authorization URL for a provider
 */
export function getOAuthAuthorizationUrl(provider: OAuthProvider): string {
  const config = getOAuthConfig(provider);
  const state = generateOAuthState(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    response_type: 'code',
    scope: config.scopes.join(' '),
  });

  // Google-specific parameters
  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

// ============================================
// Token Exchange
// ============================================

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string
): Promise<OAuthTokens> {
  const config = getOAuthConfig(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[OAuth] Token exchange failed for ${provider}:`, error);
    throw new AuthError('Failed to authenticate with provider', 'INVALID_CREDENTIALS', 400);
  }

  return response.json();
}

// ============================================
// User Info
// ============================================

/**
 * Get user info from OAuth provider
 */
export async function getOAuthUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthUserInfo> {
  const config = getOAuthConfig(provider);

  const response = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new AuthError('Failed to get user info from provider', 'INVALID_CREDENTIALS', 400);
  }

  const data = await response.json();

  if (provider === 'google') {
    return {
      id: data.id,
      email: data.email,
      name: data.name || null,
      avatar_url: data.picture || null,
    };
  }

  if (provider === 'github') {
    // GitHub might not return email in the main response
    let email = data.email;

    if (!email && config.emailsUrl) {
      // Fetch emails separately
      const emailsResponse = await fetch(config.emailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        // Find primary email or first verified email
        const primaryEmail = emails.find(
          (e: { primary: boolean; verified: boolean; email: string }) =>
            e.primary && e.verified
        );
        const verifiedEmail = emails.find(
          (e: { verified: boolean; email: string }) => e.verified
        );
        email = primaryEmail?.email || verifiedEmail?.email || null;
      }
    }

    if (!email) {
      throw new AuthError(
        'Unable to get email from GitHub. Please ensure your email is public or grant email access.',
        'INVALID_CREDENTIALS',
        400
      );
    }

    return {
      id: String(data.id),
      email,
      name: data.name || data.login || null,
      avatar_url: data.avatar_url || null,
    };
  }

  throw new AuthError('Unknown OAuth provider', 'INVALID_CREDENTIALS', 400);
}

// ============================================
// OAuth Account Management
// ============================================

/**
 * Find OAuth account by provider and account ID
 */
export function findOAuthAccount(
  provider: OAuthProvider,
  providerAccountId: string
): OAuthAccount | null {
  const results = executeRaw<OAuthAccount>(
    `SELECT * FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?`,
    [provider, providerAccountId]
  );
  return results.length > 0 ? results[0] : null;
}

/**
 * Find OAuth accounts for a user
 */
export function findOAuthAccountsByUserId(userId: string): OAuthAccount[] {
  return executeRaw<OAuthAccount>(
    `SELECT * FROM oauth_accounts WHERE user_id = ?`,
    [userId]
  );
}

/**
 * Create OAuth account
 */
export function createOAuthAccount(data: {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
}): OAuthAccount {
  const id = generateId();
  const tokenExpiresAt = data.expiresIn
    ? new Date(Date.now() + data.expiresIn * 1000).toISOString()
    : null;

  runRaw(
    `INSERT INTO oauth_accounts (
      id, user_id, provider, provider_account_id, email, name, avatar_url,
      access_token, refresh_token, token_expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.provider,
      data.providerAccountId,
      data.email,
      data.name,
      data.avatarUrl,
      data.accessToken,
      data.refreshToken,
      tokenExpiresAt,
      now(),
      now(),
    ]
  );

  return findOAuthAccount(data.provider, data.providerAccountId)!;
}

/**
 * Update OAuth account tokens
 */
export function updateOAuthAccountTokens(
  id: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number | null
): void {
  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  runRaw(
    `UPDATE oauth_accounts SET
      access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = ?
    WHERE id = ?`,
    [accessToken, refreshToken, tokenExpiresAt, now(), id]
  );
}

// ============================================
// OAuth Login/Signup Flow
// ============================================

/**
 * Generate tokens for a user (helper)
 */
async function generateTokens(
  userId: string,
  email: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { getUserRoleNames } = await import('./rbac');
  const roles = getUserRoleNames(userId);

  // Generate access token
  const accessToken = createToken(
    { userId, email, roles, type: 'access' },
    AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY
  );

  // Generate refresh token
  const refreshTokenValue = generateRandomToken();
  const refreshTokenHash = hashToken(refreshTokenValue);

  // Store refresh token in database
  const expiresAt = new Date(
    Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000
  ).toISOString();

  runRaw(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [generateId(), userId, refreshTokenHash, expiresAt, now()]
  );

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * Handle OAuth callback - login or signup user
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string
): Promise<AuthResponse> {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(provider, code);

  // Get user info from provider
  const userInfo = await getOAuthUserInfo(provider, tokens.access_token);

  // Check if OAuth account exists
  let oauthAccount = findOAuthAccount(provider, userInfo.id);

  if (oauthAccount) {
    // Existing OAuth account - update tokens and login
    updateOAuthAccountTokens(
      oauthAccount.id,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_in || null
    );

    // Generate auth tokens
    const safeUser = getSafeUser(oauthAccount.user_id);
    if (!safeUser) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }

    const authTokens = await generateTokens(oauthAccount.user_id, safeUser.email);

    return {
      user: safeUser,
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
    };
  }

  // Check if user exists with this email
  const existingUser = getUserByEmail(userInfo.email.toLowerCase());

  if (existingUser) {
    // Link OAuth account to existing user
    oauthAccount = createOAuthAccount({
      userId: existingUser.id,
      provider,
      providerAccountId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.avatar_url,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresIn: tokens.expires_in || null,
    });

    // Update user avatar if not set
    if (!existingUser.avatar_url && userInfo.avatar_url) {
      runRaw(`UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?`, [
        userInfo.avatar_url,
        now(),
        existingUser.id,
      ]);
    }

    // Verify email if not already verified (OAuth provider has verified it)
    if (existingUser.email_verified !== 1) {
      runRaw(
        `UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires_at = NULL, updated_at = ? WHERE id = ?`,
        [now(), existingUser.id]
      );
    }

    const safeUser = getSafeUser(existingUser.id)!;
    const authTokens = await generateTokens(existingUser.id, safeUser.email);

    return {
      user: safeUser,
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
    };
  }

  // Create new user
  const newUser = createUser({
    email: userInfo.email.toLowerCase(),
    password_hash: '', // No password for OAuth users
    name: userInfo.name,
    avatar_url: userInfo.avatar_url,
    email_verified: 1, // OAuth email is verified by provider
  });

  // Assign default user role
  assignRoleToUserByName(newUser.id, DEFAULT_ROLES.USER);

  // Create OAuth account
  createOAuthAccount({
    userId: newUser.id,
    provider,
    providerAccountId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatarUrl: userInfo.avatar_url,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresIn: tokens.expires_in || null,
  });

  const safeUser = getSafeUser(newUser.id)!;
  const authTokens = await generateTokens(newUser.id, safeUser.email);

  return {
    user: safeUser,
    accessToken: authTokens.accessToken,
    refreshToken: authTokens.refreshToken,
  };
}

/**
 * Check if user has a password (for OAuth-only accounts)
 */
export function userHasPassword(userId: string): boolean {
  const result = executeRaw<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [userId]
  );

  if (result.length === 0) return false;
  return result[0].password_hash !== '' && result[0].password_hash !== null;
}
