import { ethers } from 'ethers';
import { StoredStudentWallet } from './types';

const WALLET_STORAGE_KEY = 'nexo_student_wallet';
const WALLET_SESSION_KEY = 'nexo_student_active_key';

// Helper for Web Crypto key derivation from PIN/password
async function deriveEncryptionKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert bytes to hex
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex to bytes
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Encrypt private key with user PIN using AES-GCM
 */
export async function encryptPrivateKey(privateKey: string, pin: string = '0000'): Promise<{ cipherHex: string; saltHex: string; ivHex: string }> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(pin, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(privateKey)
  );

  return {
    cipherHex: toHex(new Uint8Array(encryptedBuffer)),
    saltHex: toHex(salt),
    ivHex: toHex(iv),
  };
}

/**
 * Decrypt private key with user PIN
 */
export async function decryptPrivateKey(cipherHex: string, saltHex: string, ivHex: string, pin: string = '0000'): Promise<string> {
  const dec = new TextDecoder();
  const salt = fromHex(saltHex);
  const iv = fromHex(ivHex);
  const cipherBytes = fromHex(cipherHex);
  const key = await deriveEncryptionKey(pin, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes
  );

  return dec.decode(decryptedBuffer);
}

/**
 * Get or automatically create the student in-app wallet on device.
 * No MetaMask required. Zero friction.
 */
export async function getOrCreateStudentWallet(defaultPin: string = '1234'): Promise<{ walletData: StoredStudentWallet; decryptedPrivateKey: string; isNew: boolean }> {
  if (typeof window === 'undefined') {
    return {
      walletData: { address: '', encryptedPrivateKey: '', salt: '', createdAt: '', isPinProtected: false },
      decryptedPrivateKey: '',
      isNew: false,
    };
  }

  const existingRaw = localStorage.getItem(WALLET_STORAGE_KEY);

  if (existingRaw) {
    try {
      const stored: StoredStudentWallet & { ivHex?: string } = JSON.parse(existingRaw);
      // Attempt to load from session storage if unlocked
      const cachedKey = sessionStorage.getItem(WALLET_SESSION_KEY);
      if (cachedKey) {
        return { walletData: stored, decryptedPrivateKey: cachedKey, isNew: false };
      }

      // Try decrypt with default pin
      if (stored.ivHex && stored.salt) {
        try {
          const privateKey = await decryptPrivateKey(stored.encryptedPrivateKey, stored.salt, stored.ivHex, defaultPin);
          sessionStorage.setItem(WALLET_SESSION_KEY, privateKey);
          return { walletData: stored, decryptedPrivateKey: privateKey, isNew: false };
        } catch {
          // Locked with custom pin
          return { walletData: stored, decryptedPrivateKey: '', isNew: false };
        }
      }
    } catch (e) {
      console.warn('Corrupted student wallet storage, creating a new identity', e);
    }
  }

  // Create a brand new random Ethereum wallet
  const randomWallet = ethers.Wallet.createRandom();
  const { cipherHex, saltHex, ivHex } = await encryptPrivateKey(randomWallet.privateKey, defaultPin);

  const walletData: StoredStudentWallet & { ivHex: string } = {
    address: randomWallet.address,
    encryptedPrivateKey: cipherHex,
    salt: saltHex,
    ivHex: ivHex,
    createdAt: new Date().toISOString(),
    isPinProtected: true,
  };

  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
  sessionStorage.setItem(WALLET_SESSION_KEY, randomWallet.privateKey);

  return { walletData, decryptedPrivateKey: randomWallet.privateKey, isNew: true };
}

/**
 * Sign a presentation hash with the student's in-app private key
 */
export async function signStudentPresentation(privateKey: string, messageHashOrObject: any): Promise<string> {
  try {
    const signer = new ethers.Wallet(privateKey);
    const message = typeof messageHashOrObject === 'string'
      ? messageHashOrObject
      : JSON.stringify(messageHashOrObject);
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Failed to sign presentation:', error);
    throw error;
  }
}

/**
 * Reset student wallet (for testing/demo purposes)
 */
export function resetStudentWallet(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    sessionStorage.removeItem(WALLET_SESSION_KEY);
    localStorage.removeItem('nexo_consent_logs');
  }
}
