import { NextRequest, NextResponse } from 'next/server';
import { ConsentLogEntry } from '@/lib/types';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const holderAddress = searchParams.get('holderAddress');

  try {
    const logs = await prisma.consentLog.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(holderAddress ? { holderAddress } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: ConsentLogEntry[] = logs.map((l) => ({
      id: l.id,
      recipient: l.recipient,
      purpose: l.purpose,
      credentialTitle: l.credentialTitle,
      disclosedClaims: JSON.parse(l.disclosedClaims),
      redactedClaims: JSON.parse(l.redactedClaims),
      timestamp: l.createdAt.toISOString(),
      expiresAt: l.expiresAt.toISOString(),
      status: l.status as ConsentLogEntry['status'],
    }));

    return NextResponse.json({ success: true, total: results.length, logs: results });
  } catch (error: any) {
    console.error('[ConsentLog GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'create', presentationId, consentEntry } = body;

    if (action === 'create' && consentEntry) {
      const entry = consentEntry as ConsentLogEntry;
      const created = await prisma.consentLog.create({
        data: {
          id: entry.id,
          holderAddress: body.holderAddress || '',
          recipient: entry.recipient,
          purpose: entry.purpose,
          credentialTitle: entry.credentialTitle,
          disclosedClaims: JSON.stringify(entry.disclosedClaims),
          redactedClaims: JSON.stringify(entry.redactedClaims),
          status: entry.status || 'active',
          expiresAt: new Date(entry.expiresAt),
        },
      });

      return NextResponse.json({ success: true, entry: created });
    }

    if (action === 'revoke' && presentationId) {
      await prisma.consentLog.update({
        where: { id: presentationId },
        data: { status: 'revoked' },
      });
      return NextResponse.json({ success: true, message: `Consent revoked for ${presentationId}` });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[ConsentLog POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
