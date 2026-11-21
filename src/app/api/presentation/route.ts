import { NextRequest, NextResponse } from 'next/server';
import { VerificationPresentationPayload } from '@/lib/types';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const payload: VerificationPresentationPayload = await request.json();

    if (!payload.presentationId || !payload.disclosedClaims) {
      return NextResponse.json(
        { success: false, error: 'Invalid presentation payload' },
        { status: 400 }
      );
    }

    // Persist to SQLite via Prisma
    await prisma.presentation.upsert({
      where: { id: payload.presentationId },
      update: {},
      create: {
        id: payload.presentationId,
        credentialId: payload.credentialId,
        credentialType: payload.credentialType,
        issuerName: payload.issuerName,
        issuerAddress: payload.issuerAddress,
        batchId: payload.batchId,
        merkleRoot: payload.merkleRoot,
        credentialHash: payload.credentialHash,
        disclosedClaims: JSON.stringify(payload.disclosedClaims),
        redactedKeys: JSON.stringify(payload.redactedKeys),
        holderAddress: payload.holderAddress,
        holderSignature: payload.holderSignature || null,
        purpose: payload.purpose,
        nonce: payload.nonce,
        issuedAt: new Date(payload.issuedAt),
        expiresAt: new Date(payload.expiresAt),
      },
    });

    // Use NEXT_PUBLIC_APP_URL so QR works cross-device (not localhost)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const verificationUrl = `${appUrl}/verify?id=${payload.presentationId}`;

    return NextResponse.json({
      success: true,
      presentationId: payload.presentationId,
      verificationUrl,
      expiresAt: payload.expiresAt,
    });
  } catch (error: any) {
    console.error('[Presentation POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing presentation ID' }, { status: 400 });
  }

  try {
    const record = await prisma.presentation.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Presentation expired or not found' },
        { status: 404 }
      );
    }

    const isExpired = record.expiresAt.getTime() < Date.now();

    // Reconstruct the payload shape the verifier expects
    const presentation: VerificationPresentationPayload = {
      version: '1.0',
      presentationId: record.id,
      credentialId: record.credentialId,
      credentialType: record.credentialType as any,
      issuerName: record.issuerName,
      issuerAddress: record.issuerAddress,
      batchId: record.batchId,
      merkleProof: [],
      merkleRoot: record.merkleRoot,
      credentialHash: record.credentialHash,
      disclosedClaims: JSON.parse(record.disclosedClaims),
      redactedKeys: JSON.parse(record.redactedKeys),
      holderAddress: record.holderAddress,
      holderSignature: record.holderSignature || undefined,
      purpose: record.purpose,
      issuedAt: record.issuedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      nonce: record.nonce,
    };

    // Log verification event
    await prisma.verification.create({
      data: {
        presentationId: id,
        verifierIp: request.headers.get('x-forwarded-for') || 'unknown',
        result: isExpired ? 'failed' : 'passed',
      },
    });

    return NextResponse.json({ success: true, presentation, isExpired });
  } catch (error: any) {
    console.error('[Presentation GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
