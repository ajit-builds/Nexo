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

function computeSignature(dataB64: string): string {
  const combined = `${dataB64}.${SESSION_SECRET}`;
  const hashHex = ethers.sha256(ethers.toUtf8Bytes(combined)); // 0x...
  return hashHex.slice(2);
}

/**
 * Sign session payload using universal SHA-256 with secret key
 */
export function signSessionPayload(payload: SessionPayload): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = toBase64Url(jsonStr);
  const signature = computeSignature(dataB64);
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
  const expectedSig = computeSignature(dataB64);

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const jsonStr = fromBase64Url(dataB64);
    const payload: SessionPayload = JSON.parse(jsonStr);

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
