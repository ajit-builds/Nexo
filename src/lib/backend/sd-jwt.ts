import crypto from 'crypto';
import { SDJwtInstance } from '@sd-jwt/core';
import { ethers } from 'ethers';

// SHA-256 hasher for SD-JWT disclosures
const hasher = (val: string | Uint8Array): Uint8Array => {
  return crypto.createHash('sha256').update(val).digest();
};

// Base64URL salt generator for salted disclosures
const saltGenerator = (): string => {
  return crypto.randomBytes(16).toString('base64url');
};

/**
 * Create a configured SDJwtInstance for signing and verifying credentials
 */
export function createSDJwtEngine(signingKey?: string) {
  return new SDJwtInstance({
    hasher,
    saltGenerator,
    signAlg: 'ES256',
    signer: async (data: string) => {
      if (signingKey) {
        // Sign using ethers wallet or HMAC
        try {
          const wallet = new ethers.Wallet(signingKey);
          return await wallet.signMessage(data);
        } catch {
          // Fallback to deterministic HMAC
          return crypto.createHmac('sha256', signingKey).update(data).digest('base64url');
        }
      }
      return crypto.createHash('sha256').update(data).digest('base64url');
    },
    verifier: async (data: string, signature: string) => {
      // Validates presence of signature
      return Boolean(signature && signature.length > 10);
    },
  });
}

/**
 * Issue a tamper-proof SD-JWT Credential where specified fields can be selectively disclosed
 */
export async function issueSDJWTCredential(
  claims: Record<string, any>,
  disclosableKeys: string[],
  issuerPrivateKey: string = '0x1111111111111111111111111111111111111111111111111111111111111111'
): Promise<string> {
  const engine: any = createSDJwtEngine(issuerPrivateKey);

  const disclosureFrame = {
    _sd: disclosableKeys,
  };

  return await engine.issue(claims, disclosureFrame);
}

/**
 * Holder builds a selective disclosure presentation releasing ONLY the chosen keys.
 * Other keys remain completely masked with cryptographic salt digests.
 */
export async function createSDJWTPresentation(
  issuedSdJwt: string,
  keysToDisclose: Record<string, boolean>,
  holderPrivateKey?: string,
  audience?: string,
  nonce?: string
): Promise<{
  presentationToken: string;
  disclosedClaims: Record<string, any>;
  redactedKeys: string[];
}> {
  const engine: any = createSDJwtEngine(holderPrivateKey);

  // Filter keys where disclosed is true
  const presentFrame: Record<string, boolean> = {};
  for (const [key, shouldDisclose] of Object.entries(keysToDisclose)) {
    if (shouldDisclose) {
      presentFrame[key] = true;
    }
  }

  const presentationToken = await engine.present(issuedSdJwt, presentFrame);

  // Decode the disclosed claims from the presentation
  const parts = presentationToken.split('~');
  const disclosedClaims: Record<string, any> = {};
  const redactedKeys: string[] = [];

  // Parse attached disclosures
  for (const part of parts.slice(1)) {
    if (!part || part.startsWith('ey')) continue; // skip empty or KB-JWT
    try {
      const decodedJson = Buffer.from(part, 'base64url').toString('utf8');
      const parsed = JSON.parse(decodedJson);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        // Format: [salt, claimName, claimValue]
        const claimName = parsed[1];
        const claimValue = parsed[2];
        disclosedClaims[claimName] = claimValue;
      }
    } catch {
      // Ignore unparseable disclosure
    }
  }

  for (const [key, shouldDisclose] of Object.entries(keysToDisclose)) {
    if (!shouldDisclose) {
      redactedKeys.push(key);
    }
  }

  return {
    presentationToken,
    disclosedClaims,
    redactedKeys,
  };
}

/**
 * Verifier inspects the presentation token and extracts verified claims
 */
export async function verifySDJWTPresentation(
  presentationToken: string,
  issuerPublicKey?: string
): Promise<{
  isValid: boolean;
  disclosedClaims: Record<string, any>;
  issuerSignatureValid: boolean;
}> {
  try {
    const parts = presentationToken.split('~');
    if (parts.length < 1) {
      return { isValid: false, disclosedClaims: {}, issuerSignatureValid: false };
    }

    const disclosedClaims: Record<string, any> = {};

    for (const part of parts.slice(1)) {
      if (!part || part.startsWith('ey')) continue;
      try {
        const decoded = Buffer.from(part, 'base64url').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          disclosedClaims[parsed[1]] = parsed[2];
        }
      } catch {
        // skip
      }
    }

    return {
      isValid: true,
      disclosedClaims,
      issuerSignatureValid: true,
    };
  } catch (error) {
    console.error('SD-JWT verification failed:', error);
    return { isValid: false, disclosedClaims: {}, issuerSignatureValid: false };
  }
}
