import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAdminApp } from '../../../../lib/firebase-admin';

interface JWKSKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface JWKSResponse {
  keys: JWKSKey[];
}

interface TelegramClaims {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  nonce?: string;
  id: number;
  name?: string;
  preferred_username?: string;
  picture?: string;
}

let cachedJwksPromise: Promise<JWKSKey[]> | null = null;
let jwksCacheExpiry = 0;

async function fetchJWKS(): Promise<JWKSKey[]> {
  if (Date.now() < jwksCacheExpiry && cachedJwksPromise) {
    return cachedJwksPromise;
  }
  cachedJwksPromise = fetch('https://oauth.telegram.org/.well-known/jwks.json')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch Telegram JWKS');
      return res.json() as Promise<JWKSResponse>;
    })
    .then((data) => {
      jwksCacheExpiry = Date.now() + 3600_000;
      return data.keys;
    });
  return cachedJwksPromise;
}

function base64UrlDecode(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyJwtSignature(token: string, jwks: JWKSKey[]): Promise<TelegramClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0]!)));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]!)));
  const signature = base64UrlDecode(parts[2]!);

  const key = jwks.find((k) => k.kid === header.kid);
  if (!key) throw new Error('No matching JWKS key found');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { kty: key.kty, n: key.n, e: key.e, alg: key.alg, ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature as BufferSource, data as BufferSource);
  if (!valid) throw new Error('Invalid JWT signature');

  return payload as TelegramClaims;
}

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Telegram login not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { id_token, nonce } = body;

    if (!id_token) {
      return NextResponse.json({ error: 'Missing id_token' }, { status: 400 });
    }

    const jwks = await fetchJWKS();
    const claims = await verifyJwtSignature(id_token, jwks);

    if (claims.iss !== 'https://oauth.telegram.org') {
      return NextResponse.json({ error: 'Invalid issuer' }, { status: 401 });
    }

    if (claims.aud !== clientId) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 401 });
    }

    if (!claims.sub || typeof claims.sub !== 'string') {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 401 });
    }

    if (claims.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    if (claims.iat * 1000 > Date.now() + 60000) {
      return NextResponse.json({ error: 'Token issued in the future' }, { status: 401 });
    }

    if (nonce && claims.nonce !== nonce) {
      return NextResponse.json({ error: 'Invalid nonce' }, { status: 401 });
    }

    getAdminApp();
    const telegramId = String(claims.id);

    const existingUsers = await admin.firestore()
      .collection('users')
      .where('telegramId', '==', telegramId)
      .get();

    let uid: string;

    if (!existingUsers.empty) {
      uid = existingUsers.docs[0]!.id;
    } else {
      const displayName = claims.name || claims.preferred_username || `tg_${telegramId}`;
      const userRecord = await admin.auth().createUser({
        displayName,
        photoURL: claims.picture || undefined,
      });
      uid = userRecord.uid;

      const profileData: Record<string, unknown> = {
        username: claims.preferred_username || `tg_${telegramId}`,
        name: claims.name || undefined,
        role: 'roommate',
        joinedAt: new Date().toISOString(),
        avatar: claims.picture || undefined,
        telegramId,
      };
      await admin.firestore().collection('users').doc(uid).set(profileData);
    }

    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('[Telegram Auth]', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
