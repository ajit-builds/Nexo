import { ethers } from 'ethers';
import { AppRole } from './domain-registry';

const SESSION_SECRET = process.env.SESSION_SECRET || 'nexo-super-secret-hmac-key-2026-production';
export const AUTH_COOKIE_NAME = 'nexo_auth_token';

export interface SessionPayload {
  email: string;
  name: string;
  role: AppRole;
  domain: string;
  organizationName: string;
  portalPath: string;
  iat: number;
  exp: number;
}

function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64url').toString('utf-8');
  }
  let base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Constant-time comparison between two strings to prevent timing attacks.
 * Pure JS: fully compatible with Edge Runtime, Node.js, and browser environments.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Compute cryptographic HMAC-SHA256 signature using ethers (Edge runtime compatible)
 */
export function computeHmacSignature(dataB64: string, secret: string = SESSION_SECRET): string {
  const hmacHex = ethers.computeHmac('sha256', ethers.toUtf8Bytes(secret), ethers.toUtf8Bytes(dataB64));
  return hmacHex.startsWith('0x') ? hmacHex.slice(2) : hmacHex;
}

/**
 * Constant-time signature verification to prevent timing attacks
 */
export function verifyHmacSignature(dataB64: string, signature: string, secret: string = SESSION_SECRET): boolean {
  if (!signature || typeof signature !== 'string') return false;

  const expectedSig = computeHmacSignature(dataB64, secret);
  if (constantTimeEqual(signature, expectedSig)) {
    return true;
  }

  // Legacy fallback for tokens generated with previous sha256 concatenation
  const legacySig = ethers.sha256(ethers.toUtf8Bytes(`${dataB64}.${secret}`)).slice(2);
  return constantTimeEqual(signature, legacySig);
}

/**
 * Sign session payload using HMAC-SHA256
 */
export function signSessionPayload(payload: SessionPayload): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = toBase64Url(jsonStr);
  const signature = computeHmacSignature(dataB64);
  return `${dataB64}.${signature}`;
}

/**
 * Verify signed session token. Returns null if invalid, tampered or expired.
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataB64, signature] = parts;
  if (!verifyHmacSignature(dataB64, signature)) {
    return null;
  }

  try {
    const jsonStr = fromBase64Url(dataB64);
    const payload: SessionPayload = JSON.parse(jsonStr);

    // Validate payload fields
    if (!payload.email || !payload.role) {
      return null;
    }

    // Check expiration (7 days)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie serializer for setting secure HTTP-only session cookie
 */
export function serializeSessionCookie(token: string, maxAgeSeconds: number = 7 * 24 * 3600): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isProd ? '; Secure' : ''}`;
}

/**
 * Cookie serializer for clearing the session cookie
 */
export function serializeLogoutCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
