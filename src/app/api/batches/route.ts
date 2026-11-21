import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { BatchRecord, RevocationRecord } from '@/types';

// ── POST /api/batches  → save an anchored batch
export async function POST(request: NextRequest) {
  try {
    const batch: BatchRecord = await request.json();

    await prisma.batch.upsert({
      where: { batchId: batch.batchId },
      update: {
        txHash: batch.txHash,
        ipfsUri: batch.ipfsUri || '',
      },
      create: {
        batchId: batch.batchId,
        merkleRoot: batch.merkleRoot,
        issuerAddress: batch.issuerAddress,
        issuerName: batch.issuerName,
        credentialType: batch.credentialType,
        totalCredentials: batch.totalCredentials,
        txHash: batch.txHash,
        ipfsUri: batch.ipfsUri || '',
        timestamp: new Date(batch.timestamp),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── GET /api/batches  → list all batches
export async function GET() {
  const batches = await prisma.batch.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ success: true, batches });
}
