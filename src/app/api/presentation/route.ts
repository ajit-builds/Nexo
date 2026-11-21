import { NextRequest, NextResponse } from 'next/server';
import { VerificationPresentationPayload } from '@/lib/types';

// In-memory store for active presentations
const presentationsStore = new Map<string, VerificationPresentationPayload>();

export async function POST(request: NextRequest) {
  try {
    const payload: VerificationPresentationPayload = await request.json();

    if (!payload.presentationId || !payload.disclosedClaims) {
      return NextResponse.json(
        { success: false, error: 'Invalid presentation payload' },
        { status: 400 }
      );
    }

    // Save to presentation store
    presentationsStore.set(payload.presentationId, payload);

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const verificationUrl = `${origin}/verify?id=${payload.presentationId}`;

    return NextResponse.json({
      success: true,
      presentationId: payload.presentationId,
      verificationUrl,
      expiresAt: payload.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing presentation ID' }, { status: 400 });
  }

  const presentation = presentationsStore.get(id);

  if (!presentation) {
    return NextResponse.json(
      { success: false, error: 'Presentation expired or not found' },
      { status: 404 }
    );
  }

  const isExpired = new Date(presentation.expiresAt).getTime() < Date.now();

  return NextResponse.json({
    success: true,
    presentation,
    isExpired,
  });
}
