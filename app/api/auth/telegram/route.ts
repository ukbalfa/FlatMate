import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import crypto from 'crypto';
import { getAdminApp } from '../../../../lib/firebase-admin';

function verifyTelegramHash(data: Record<string, string | undefined>, botToken: string): boolean {
  const { hash, ...fields } = data;
  const sorted = Object.keys(fields)
    .filter((k) => fields[k] != null)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(sorted).digest('hex');
  return computed === hash;
}

export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;

    if (!id || !hash || !auth_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (isNaN(Number(auth_date))) {
      return NextResponse.json({ error: 'Invalid auth_date' }, { status: 400 });
    }

    if (Number(auth_date) > Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'Auth date is in the future' }, { status: 400 });
    }

    // Replay protection: auth_date must be within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(auth_date) > 300) {
      return NextResponse.json({ error: 'Auth data expired' }, { status: 400 });
    }

    if (!verifyTelegramHash({ id, first_name, last_name, username, photo_url, auth_date, hash }, botToken)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    getAdminApp();
    const telegramId = String(id);

    // Check if user already exists by searching Firestore for telegramId
    const existingUsers = await admin.firestore()
      .collection('users')
      .where('telegramId', '==', telegramId)
      .get();

    let uid: string;

    if (!existingUsers.empty) {
      uid = existingUsers.docs[0]!.id;
    } else {
      // Create a new Firebase Auth user
      const displayName = [first_name, last_name].filter(Boolean).join(' ');
      const userRecord = await admin.auth().createUser({
        displayName: displayName || username || `tg_${telegramId}`,
        photoURL: photo_url || undefined,
      });
      uid = userRecord.uid;

      // Create Firestore profile
      const profileData: Record<string, unknown> = {
        username: username || `tg_${telegramId}`,
        name: displayName || undefined,
        role: 'roommate',
        joinedAt: new Date().toISOString(),
        avatar: photo_url || undefined,
        telegramId,
      };
      await admin.firestore().collection('users').doc(uid).set(profileData);
    }

    // Mint custom token
    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({
      token: customToken,
      telegramProfile: { id, first_name, last_name, username, photo_url },
    });
  } catch (error) {
    console.error('[Telegram Auth]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
