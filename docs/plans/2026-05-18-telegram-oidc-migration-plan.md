# Telegram Login OIDC Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deprecated Telegram Login Widget with Telegram's new OIDC-based login flow using JWT verification.

**Architecture:** Client loads `telegram-login.js` SDK, opens Telegram popup, receives an `id_token` (JWT). Server verifies the JWT against Telegram's JWKS, finds/creates the user in Firebase Auth + Firestore, and returns a Firebase custom token for sign-in.

**Tech Stack:** Next.js 16 App Router, Firebase Auth v12, Telegram OIDC, JWKS verification, Framer Motion, Tailwind v4

---

### Task 1: Rewrite Telegram Server Route with JWT/JWKS Verification

**Files:**
- Modify: `app/api/auth/telegram/route.ts`

- [ ] **Step 1: Replace the entire route.ts content**

```typescript
// app/api/auth/telegram/route.ts
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
  id: number;
  name?: string;
  preferred_username?: string;
  picture?: string;
}

async function fetchJWKS(): Promise<JWKSKey[]> {
  const res = await fetch('https://oauth.telegram.org/.well-known/jwks.json', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Failed to fetch Telegram JWKS');
  const data: JWKSResponse = await res.json();
  return data.keys;
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
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, data);
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
    const { id_token } = body;

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

    if (claims.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
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
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build 2>&1 | grep -E "error|Error|✓"
```
Expected: No errors, build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/telegram/route.ts
git commit -m "feat: replace Telegram hash verification with OIDC JWT/JWKS verification"
```

---

### Task 2: Rewrite Telegram Client Flow in Login Page

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Update the Window interface declaration**

Replace the existing `declare global` block:

```typescript
declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string>) => void;
    hcaptcha?: {
      getResponse: () => string;
      render: (element: Element | null, params: Record<string, unknown>) => void;
      reset: () => void;
    };
    Telegram?: {
      Login: {
        init: (options: { client_id: string; request_access?: string[] }, callback: (data: { id_token?: string; user?: Record<string, string>; error?: string }) => void) => void;
      };
    };
  }
}
```

- [ ] **Step 2: Replace handleTelegramClick with new OIDC flow**

Replace the entire `handleTelegramClick` function and the `handleTelegramAuth` function and its useEffect:

Remove these blocks entirely:
- `handleTelegramAuth` (lines ~73-94)
- `useEffect` that sets `window.onTelegramAuth` (lines ~96-99)
- `handleTelegramClick` (lines ~185-214)

Add this new function in their place (before `clearErrors`):

```typescript
const telegramScriptLoaded = useRef(false);

const loadTelegramSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.Login) {
      resolve();
      return;
    }
    if (telegramScriptLoaded.current) {
      const check = setInterval(() => {
        if (window.Telegram?.Login) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('Telegram SDK load timeout')); }, 10000);
      return;
    }
    telegramScriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-login.js';
    script.async = true;
    script.onload = () => {
      if (window.Telegram?.Login) {
        resolve();
      } else {
        reject(new Error('Telegram SDK failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Telegram SDK'));
    document.head.appendChild(script);
  });
};

const handleTelegramClick = async () => {
  const clientId = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID;
  if (!clientId) {
    setError(t('login.telegramNotConfigured'));
    return;
  }

  if (!consentAccepted) {
    setError(t('login.errorConsentRequired'));
    return;
  }

  if (checkRateLimit()) {
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    await loadTelegramSDK();

    window.Telegram!.Login.init(
      { client_id: parseInt(clientId, 10), request_access: ['write'] },
      async (data) => {
        if (data.error) {
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
          return;
        }

        if (!data.id_token) {
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
          return;
        }

        try {
          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: data.id_token }),
          });
          const result = await res.json();
          if (!res.ok) {
            setError(result.error || t('login.telegramAuthFailed'));
            setIsLoading(false);
            return;
          }
          await signInWithCustomToken(auth, result.token);
          clearRateLimit();
        } catch (err) {
          recordFailedAttempt();
          logError(err, 'Login.telegramAuth');
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
        }
      },
    );

    window.Telegram!.Login.open();
  } catch (err) {
    logError(err, 'Login.telegramLoad');
    setError(t('login.errorPopupBlocked'));
    setIsLoading(false);
  }
};
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build 2>&1 | grep -E "error|Error|✓"
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: replace legacy Telegram widget with Telegram.Login OIDC SDK"
```

---

### Task 3: Add NEXT_PUBLIC_TELEGRAM_CLIENT_ID to .env.local

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add the new env var**

Add this line to `.env.local` (after the existing Telegram or Firebase vars):

```
NEXT_PUBLIC_TELEGRAM_CLIENT_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_TELEGRAM_CLIENT_ID placeholder to .env.local"
```

---

### Task 4: Run Full Verification

**Files:**
- All modified files

- [ ] **Step 1: Run lint**

```bash
npm run lint
```
Expected: No errors

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: Successful build

- [ ] **Step 3: Run tests**

```bash
npm run test
```
Expected: All tests pass

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add .
git commit -m "fix: address lint/build issues"
```
