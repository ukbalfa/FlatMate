import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '../../../../lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    getAdminApp();
    const { idToken, flatId } = await request.json() as { idToken: string; flatId: string };

    if (!idToken || !flatId) {
      return NextResponse.json({ error: 'Missing idToken or flatId' }, { status: 400 });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    await admin.auth().setCustomUserClaims(decoded.uid, { flatId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[set-flat-claim]', error);
    return NextResponse.json({ error: 'Failed to set claim' }, { status: 500 });
  }
}
