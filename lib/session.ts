import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'fm_session';
const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET environment variable must be set and at least 32 characters long',
  );
}
const SESSION_SECRET = new TextEncoder().encode(rawSecret);
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

export { SESSION_COOKIE, SESSION_DURATION_SECONDS };

export interface SessionPayload {
  uid: string;
  flatId?: string;
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(SESSION_SECRET);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
