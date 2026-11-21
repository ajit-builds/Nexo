import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/user-store';
import { signSessionPayload, serializeSessionCookie, SessionPayload } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const regResult = registerUser(email, password, name);
    if (!regResult.success) {
      return NextResponse.json(
        { success: false, error: regResult.error },
        { status: regResult.status }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const sessionPayload: SessionPayload = {
      email: regResult.user.email,
      name: regResult.user.name,
      role: regResult.user.role,
      domain: regResult.user.domain,
      organizationName: regResult.user.organizationName,
      portalPath: regResult.user.portalPath,
      iat: now,
      exp: now + 7 * 24 * 3600,
    };

    const token = signSessionPayload(sessionPayload);
    const cookieHeader = serializeSessionCookie(token);

    const res = NextResponse.json({
      success: true,
      user: {
        email: regResult.user.email,
        name: regResult.user.name,
        role: regResult.user.role,
        domain: regResult.user.domain,
        organizationName: regResult.user.organizationName,
        portalPath: regResult.user.portalPath,
      },
      portalPath: regResult.user.portalPath,
    });

    res.headers.set('Set-Cookie', cookieHeader);
    return res;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal registration server error.' },
      { status: 500 }
    );
  }
}
