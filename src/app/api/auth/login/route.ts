import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/user-store';
import { signSessionPayload, serializeSessionCookie, SessionPayload } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const authResult = authenticateUser(email, password);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const sessionPayload: SessionPayload = {
      email: authResult.user.email,
      name: authResult.user.name,
      role: authResult.user.role,
      domain: authResult.user.domain,
      organizationName: authResult.user.organizationName,
      portalPath: authResult.user.portalPath,
      iat: now,
      exp: now + 7 * 24 * 3600, // 7 days
    };

    const token = signSessionPayload(sessionPayload);
    const cookieHeader = serializeSessionCookie(token);

    const res = NextResponse.json({
      success: true,
      user: {
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
        domain: authResult.user.domain,
        organizationName: authResult.user.organizationName,
        portalPath: authResult.user.portalPath,
      },
      portalPath: authResult.user.portalPath,
    });

    res.headers.set('Set-Cookie', cookieHeader);
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal authentication server error.' },
      { status: 500 }
    );
  }
}
