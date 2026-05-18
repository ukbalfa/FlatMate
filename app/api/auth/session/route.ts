import { NextRequest, NextResponse } from 'next/server';
import {
  encryptSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from '../../../../lib/session';
import { getAdminApp } from '../../../../lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    getAdminApp();
    const { idToken } = await request.json() as { idToken: string };
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const flatId = decoded.flatId as string | undefined;

    const sessionToken = await encryptSession({ uid: decoded.uid, flatId });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[session POST]', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
