import { NextRequest, NextResponse } from 'next/server';
import { ConsentLogEntry } from '@/lib/types';

// In-memory backend storage for DPDP consent grants
let backendConsentLogs: ConsentLogEntry[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let results = [...backendConsentLogs];
  if (status) {
    results = results.filter((r) => r.status === status);
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    logs: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'create', presentationId, consentEntry } = body;

    if (action === 'create' && consentEntry) {
      backendConsentLogs.unshift(consentEntry);
      return NextResponse.json({ success: true, entry: consentEntry });
    }

    if (action === 'revoke' && presentationId) {
      const target = backendConsentLogs.find((l) => l.id === presentationId);
      if (target) {
        target.status = 'revoked';
      }
      return NextResponse.json({ success: true, message: `Consent revoked for ${presentationId}` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
