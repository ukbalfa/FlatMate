import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, SESSION_COOKIE } from './lib/session';

const PROTECTED_PREFIX = '/dashboard';
const LOGIN_PATH = '/login';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? await decryptSession(sessionCookie) : null;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isLoginPage = pathname === LOGIN_PATH;

  if (isProtected && !session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && session) {
    const next = request.nextUrl.searchParams.get('next');
    const target = next && next.startsWith('/dashboard') ? next : PROTECTED_PREFIX;
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
