import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { RevocationRecord } from '@/types';

// ── POST /api/revocations  → save a revocation
export async function POST(request: NextRequest) {
  try {
    const record: RevocationRecord = await request.json();

    await prisma.revocation.upsert({
      where: { credentialHash: record.credentialHash },
      update: { reason: record.reason },
      create: {
        credentialHash: record.credentialHash,
        credentialId: record.credentialId,
        studentName: record.studentName,
        degree: record.degree,
        revokedBy: record.revokedBy,
        reason: record.reason,
        txHash: record.txHash,
        timestamp: new Date(record.timestamp),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── GET /api/revocations  → list all revocations
export async function GET() {
  const revocations = await prisma.revocation.findMany({ orderBy: { timestamp: 'desc' } });
  return NextResponse.json({ success: true, revocations });
}
