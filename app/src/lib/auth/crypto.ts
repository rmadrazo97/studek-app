/**
 * Cryptographic utilities for authentication
 * Uses Node.js built-in crypto module for password hashing and JWT
 */

import crypto from 'crypto';
import { AUTH_CONSTANTS, TokenPayload, AuthError } from './types';

// ============================================
// Password Hashing (using scrypt)
// ============================================

const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost parameter
  r: 8,     // Block size parameter
  p: 1,     // Parallelization parameter
  keyLen: 64,
};

/**
 * Hash a password using scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');

    crypto.scrypt(
      password,
      salt,
      SCRYPT_PARAMS.keyLen,
      { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p },
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');

    if (!salt || !key) {
      resolve(false);
      return;
    }

    crypto.scrypt(
      password,
      salt,
      SCRYPT_PARAMS.keyLen,
      { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p },
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
      }
    );
  });
}

// ============================================
// JWT Implementation (using HMAC-SHA256)
// ============================================

/**
 * Get JWT secret from environment or generate a random one
 * In production, this should always be set via environment variable
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  console.log('[Crypto] getJwtSecret called');
  console.log('[Crypto] JWT_SECRET env present:', !!secret);
  console.log('[Crypto] JWT_SECRET preview:', secret ? `${secret.substring(0, 10)}...` : 'not set');

  if (!secret) {
    console.warn('[Crypto] JWT_SECRET not set, using a random secret. This will invalidate all tokens on restart!');
    // In development, we could generate a random secret, but it's better to warn
    return crypto.randomBytes(32).toString('hex');
  }
  return secret;
}

// Cache the secret for consistency within a process
let cachedSecret: string | null = null;

function getSecret(): string {
  if (!cachedSecret) {
    cachedSecret = getJwtSecret();
  }
  return cachedSecret;
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + padding, 'base64').toString('utf-8');
}

/**
 * Create a JWT token
 */
export function createToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn: number): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: AUTH_CONSTANTS.JWT_ALGORITHM,
    typ: 'JWT',
  };

  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest();

  const signatureEncoded = base64UrlEncode(signature);

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload {
  console.log('[Crypto] verifyToken called');

  const secret = getSecret();
  console.log('[Crypto] Secret obtained, length:', secret.length);

  const parts = token.split('.');
  console.log('[Crypto] Token parts count:', parts.length);

  if (parts.length !== 3) {
    console.log('[Crypto] Invalid token format - expected 3 parts');
    throw new AuthError('Invalid token format', 'INVALID_TOKEN');
  }

  const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
  console.log('[Crypto] Header length:', headerEncoded.length);
  console.log('[Crypto] Payload length:', payloadEncoded.length);
  console.log('[Crypto] Signature length:', signatureEncoded.length);

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest();

  const actualSignature = Buffer.from(
    signatureEncoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (signatureEncoded.length % 4)) % 4),
    'base64'
  );

  console.log('[Crypto] Expected signature length:', expectedSignature.length);
  console.log('[Crypto] Actual signature length:', actualSignature.length);

  if (expectedSignature.length !== actualSignature.length) {
    console.log('[Crypto] Signature length mismatch');
    throw new AuthError('Invalid token signature', 'INVALID_TOKEN');
  }

  if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    console.log('[Crypto] Signature verification FAILED');
    throw new AuthError('Invalid token signature', 'INVALID_TOKEN');
  }

  console.log('[Crypto] Signature verification SUCCESS');

  // Decode payload
  const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as TokenPayload;
  console.log('[Crypto] Decoded payload userId:', payload.userId);
  console.log('[Crypto] Decoded payload email:', payload.email);
  console.log('[Crypto] Decoded payload exp:', payload.exp);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  console.log('[Crypto] Current time:', now);
  console.log('[Crypto] Token expires:', payload.exp);
  console.log('[Crypto] Token expired:', payload.exp < now);

  if (payload.exp < now) {
    console.log('[Crypto] Token is EXPIRED');
    throw new AuthError('Token expired', 'TOKEN_EXPIRED');
  }

  console.log('[Crypto] Token is VALID');
  return payload;
}

/**
 * Generate a random token (for refresh tokens)
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
