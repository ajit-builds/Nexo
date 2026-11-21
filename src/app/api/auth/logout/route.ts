import { NextResponse } from 'next/server';
import { serializeLogoutCookie } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  res.headers.set('Set-Cookie', serializeLogoutCookie());
  return res;
}
