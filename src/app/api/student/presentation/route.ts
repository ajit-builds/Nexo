import { NextRequest, NextResponse } from 'next/server';
import { 
  issueSDJWTCredential, 
  createSDJWTPresentation, 
  verifySDJWTPresentation 
} from '@/lib/backend/sd-jwt';
import { 
  checkOnChainIssuerTrust, 
  checkOnChainMerkleRoot, 
  checkOnChainRevocation 
} from '@/lib/backend/relayer';
import { VerificationPresentationPayload } from '@/lib/types';
import { ethers } from 'ethers';

// Store presentations in-memory
const presentationsMap = new Map<string, VerificationPresentationPayload>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      credential, 
      keysToDisclose, 
      holderAddress, 
      holderPrivateKey, 
      purpose = 'Employment Verification', 
      validityMinutes = 60 
    } = body;

    if (!credential || !keysToDisclose) {
      return NextResponse.json(
        { success: false, error: 'Missing credential or keysToDisclose' },
        { status: 400 }
      );
    }

    // 1. Issue authentic SD-JWT on backend using @sd-jwt/core
    const allClaimKeys = Object.keys(credential.claims);
    const issuedSdJwt = await issueSDJWTCredential(
      credential.claims,
      allClaimKeys,
      credential.issuerAddress
    );

    // 2. Holder applies selective disclosure to release ONLY chosen claims
    const { presentationToken, disclosedClaims, redactedKeys } = await createSDJWTPresentation(
      issuedSdJwt,
      keysToDisclose,
      holderPrivateKey
    );

    // 3. Assemble standard W3C-aligned presentation payload
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString();
    const nonce = ethers.hexlify(ethers.randomBytes(8));
    const presentationId = 'pres_' + ethers.keccak256(ethers.toUtf8Bytes(`${credential.id}:${now.toISOString()}:${nonce}`)).slice(2, 14);

    const payload: VerificationPresentationPayload = {
      version: '1.0',
      presentationId,
      credentialId: credential.id,
      credentialType: credential.type,
      issuerName: credential.issuerName,
      issuerAddress: credential.issuerAddress,
      batchId: credential.batchId,
      merkleProof: credential.merkleProof || [],
      merkleRoot: credential.merkleRoot,
      credentialHash: credential.credentialHash,
      disclosedClaims,
      redactedKeys,
      holderAddress: holderAddress || ethers.ZeroAddress,
      purpose,
      issuedAt: now.toISOString(),
      expiresAt,
      nonce,
    };

    // Save to presentation map
    presentationsMap.set(presentationId, payload);

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const verificationUrl = `${origin}/verify?id=${presentationId}&data=${encodedPayload}`;

    return NextResponse.json({
      success: true,
      presentationId,
      presentationToken,
      payload,
      verificationUrl,
      disclosedCount: Object.keys(disclosedClaims).length,
      redactedCount: redactedKeys.length,
    });
  } catch (error: any) {
    console.error('Presentation backend creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing presentation ID' }, { status: 400 });
  }

  const payload = presentationsMap.get(id);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Presentation expired or not found' }, { status: 404 });
  }

  // Real on-chain verification pipeline
  const isExpired = new Date(payload.expiresAt).getTime() < Date.now();
  const trustCheck = await checkOnChainIssuerTrust(payload.issuerAddress);
  const anchorCheck = await checkOnChainMerkleRoot(payload.merkleRoot);
  const revocationCheck = await checkOnChainRevocation(payload.credentialHash);

  const isFullyVerified = !isExpired && trustCheck.isTrusted && anchorCheck.isAnchored && !revocationCheck.isRevoked;

  return NextResponse.json({
    success: true,
    presentation: payload,
    verification: {
      isFullyVerified,
      isExpired,
      trustRegistry: {
        isTrusted: trustCheck.isTrusted,
        issuerName: trustCheck.name || payload.issuerName,
      },
      merkleAnchor: {
        isAnchored: anchorCheck.isAnchored,
        batchId: anchorCheck.batchId || payload.batchId,
      },
      revocation: {
        isRevoked: revocationCheck.isRevoked,
        reason: revocationCheck.reason || null,
      },
    },
  });
}
