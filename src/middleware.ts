import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, AUTH_COOKIE_NAME } from '@/lib/session';

/**
 * Server-Side Edge Middleware for Strict Role-Based Portal & API Protection
 *
 * Rules:
 * - /university, /issuer: ONLY role 'issuer'
 * - /student, /student-wallet, /api/student: ONLY role 'student'
 * - /verify, /reviewer, /recruiter: ONLY role 'reviewer'
 *
 * Direct URL access to unauthorized portals is blocked with 403 / redirect to /unauthorized.
 * Preserves redirect target with query parameters on unauthenticated requests.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isIssuerPath = pathname.startsWith('/university') || pathname.startsWith('/issuer');
  const isStudentPath = pathname.startsWith('/student') || pathname.startsWith('/student-wallet');
  const isReviewerPath = pathname.startsWith('/verify') || pathname.startsWith('/reviewer') || pathname.startsWith('/recruiter');
  const isStudentApiPath = pathname.startsWith('/api/student');

  // If not a protected portal or API path, let it pass
  if (!isIssuerPath && !isStudentPath && !isReviewerPath && !isStudentApiPath) {
    return NextResponse.next();
  }

  // 1. Read and verify signed session cookie
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  // Protected API Routes: Return JSON 401/403
  if (isStudentApiPath) {
    if (!session) {
      return NextResponse.json(
        { success: false, error: '401 Unauthorized: Session required.' },
        { status: 401 }
      );
    }
    if (session.role !== 'student') {
      return NextResponse.json(
        {
          success: false,
          error: `403 Forbidden: Student authorization required. Authenticated as ${session.role}.`,
        },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 2. Unauthenticated user attempting to access protected portal
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    // Preserve full target path with query params (e.g. ?id=... or ?uid=...)
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const { role, portalPath } = session;

  // 3. Strict Role-Based Route Enforcement
  if (isIssuerPath) {
    if (role !== 'issuer') {
      const unauthUrl = new URL('/unauthorized', req.url);
      unauthUrl.searchParams.set('attempted', pathname);
      unauthUrl.searchParams.set('userRole', role);
      unauthUrl.searchParams.set('authorizedPortal', portalPath);
      return NextResponse.redirect(unauthUrl);
    }
    // Handle alias /issuer -> redirect to canonical /university
    if (pathname.startsWith('/issuer')) {
      return NextResponse.redirect(new URL('/university', req.url));
    }
    return NextResponse.next();
  }

  if (isStudentPath) {
    if (role !== 'student') {
      const unauthUrl = new URL('/unauthorized', req.url);
      unauthUrl.searchParams.set('attempted', pathname);
      unauthUrl.searchParams.set('userRole', role);
      unauthUrl.searchParams.set('authorizedPortal', portalPath);
      return NextResponse.redirect(unauthUrl);
    }
    // Handle alias /student-wallet -> redirect to canonical /student
    if (pathname.startsWith('/student-wallet')) {
      return NextResponse.redirect(new URL('/student', req.url));
    }
    return NextResponse.next();
  }

  if (isReviewerPath) {
    if (role !== 'reviewer') {
      const unauthUrl = new URL('/unauthorized', req.url);
      unauthUrl.searchParams.set('attempted', pathname);
      unauthUrl.searchParams.set('userRole', role);
      unauthUrl.searchParams.set('authorizedPortal', portalPath);
      return NextResponse.redirect(unauthUrl);
    }
    // Handle alias /reviewer -> redirect to canonical /verify (preserving search params)
    if (pathname.startsWith('/reviewer')) {
      return NextResponse.redirect(new URL(`/verify${search}`, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/university/:path*',
    '/issuer/:path*',
    '/student/:path*',
    '/student-wallet/:path*',
    '/verify/:path*',
    '/reviewer/:path*',
    '/recruiter/:path*',
    '/api/student/:path*',
  ],
};
