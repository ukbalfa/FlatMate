# FlatMate — Architectural Improvements for OpenCode

You are working on **FlatMate**, a Next.js 16 App Router project (TypeScript, Tailwind CSS v4,
Firebase Firestore, Framer Motion). Implement the three phases below **in order**. Each phase
is independent except that Phase 2 (middleware) uses the session cookie introduced in Phase 1,
and Phase 3 (hooks) can reference the updated auth patterns. Do not start a new phase until the
previous one passes TypeScript and lint.

After every phase run:
```bash
npx tsc --noEmit   # must produce 0 errors
npx eslint .       # must produce 0 errors
npm test           # must pass all tests
```

---

# PHASE 1 — Custom claims for `flatId` (eliminate hidden Firestore reads)

## Background

Every Firestore security rule for tenant-isolated collections calls the `getUserFlatId()`
helper, which reads the `users/{uid}` document on EVERY guarded read. For a page like the
dashboard that opens 4 simultaneous `onSnapshot` listeners, this produces dozens of hidden
background reads per page load. At scale this directly inflates your Firestore bill.

The fix: store `flatId` in the user's Firebase Auth custom claims token so Firestore rules
can read `request.auth.token.flatId` for free, without any extra document reads.

---

## TASK 1.1 — Install `jose` (Edge-compatible JWT library)

Run:
```bash
npm install jose
```

This library is required for middleware JWT verification in Phase 2 as well.

---

## TASK 1.2 — Create the set-flat-claim API route

**New file:** `app/api/auth/set-flat-claim/route.ts`

This route accepts the currently authenticated user's ID token, verifies it with Firebase Admin,
then sets `flatId` as a custom claim on that user's auth record.

```ts
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
```

---

## TASK 1.3 — Create a helper to call the claim route and force token refresh

**New file:** `lib/setFlatClaim.ts`

```ts
import { User } from 'firebase/auth';

export async function setFlatClaimAndRefresh(
  user: User,
  flatId: string,
): Promise<void> {
  const idToken = await user.getIdToken();

  const res = await fetch('/api/auth/set-flat-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, flatId }),
  });

  if (!res.ok) {
    throw new Error('Failed to set flat claim');
  }

  // Force a token refresh so the new claim is available immediately
  await user.getIdToken(true);
}
```

---

## TASK 1.4 — Call the claim helper after flat creation and joining

**File:** `app/components/FlatConnectionModal.tsx`

Add import at the top:
```ts
import { setFlatClaimAndRefresh } from '../../lib/setFlatClaim';
```

In `handleCreate`, after `await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true })` and
BEFORE `await refreshUserProfile()`, add:
```ts
if (auth.currentUser) {
  await setFlatClaimAndRefresh(auth.currentUser, code);
}
```

Also add the `auth` import at the top if not already present:
```ts
import { auth } from '../../lib/firebase';
```

Do the same in `handleJoin`, after the `setDoc` call that writes `flatId` to the user document
and BEFORE `await refreshUserProfile()`:
```ts
if (auth.currentUser) {
  await setFlatClaimAndRefresh(auth.currentUser, code);
}
```

---

## TASK 1.5 — Auto-backfill the claim for existing users on login

**File:** `context/AuthContext.tsx`

In the `onAuthStateChanged` callback, after the user profile is fetched and `setUserProfile(profile)`
is called, add a background claim sync for users who have `flatId` in Firestore but not yet in
their token claims (existing users before this change was deployed):

After `setCachedProfile(profile)` inside the success branch, add:
```ts
// Backfill custom claim for existing users who have flatId but no claim yet
if (profile.flatId) {
  try {
    const tokenResult = await firebaseUser.getIdTokenResult();
    if (!tokenResult.claims.flatId) {
      const idToken = await firebaseUser.getIdToken();
      await fetch('/api/auth/set-flat-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, flatId: profile.flatId }),
      });
      await firebaseUser.getIdToken(true); // force refresh
    }
  } catch {
    // Non-critical — claim will sync on next login
  }
}
```

Add the `getIdTokenResult` usage — it's already available on the `firebaseUser` object, no
extra import needed.

---

## TASK 1.6 — Update Firestore security rules to use the custom claim

**File:** `firestore.rules`

Replace the `getUserFlatId()` helper function and all its usages with claim-based checks.

**Remove** the entire `getUserFlatId()` function:
```
function getUserFlatId() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.flatId;
}
```

**Replace** every occurrence of `getUserFlatId()` with `request.auth.token.flatId`.

Specifically, update the helper functions and rules:

```
function tenantIsolated() {
  return request.auth != null
    && (request.auth.token.flatId == resource.data.flatId)
    && (request.auth.token.flatId == request.resource.data.flatId);
}

function tenantRead() {
  return request.auth != null && request.auth.token.flatId == resource.data.flatId;
}

function tenantCreate() {
  return request.auth != null && request.auth.token.flatId == request.resource.data.flatId;
}
```

And update the `/users/{userId}` read rule:
```
allow read: if request.auth != null
  && (request.auth.uid == userId
    || isAdmin()
    || request.auth.token.flatId == resource.data.flatId);
```

Keep the `isAdmin()` function unchanged — it still reads the user document, but it is only
called in the rare `settings` write and `users` delete paths, so the cost is acceptable.

---

# PHASE 2 — Middleware-based auth redirect (instant, no 10-second wait)

## Background

Currently `app/dashboard/layout.tsx` redirects unauthenticated users client-side with a
10-second fallback timeout. Users without a session see the dashboard HTML briefly and then
wait up to 10 seconds. Middleware runs on the Edge before any page renders, so redirects are
instant and the dashboard HTML is never sent to unauthenticated users.

The mechanism: after login, a signed HTTP-only session cookie is set. Middleware reads and
verifies this cookie on every `/dashboard/*` request using `jose` (Edge-compatible).

---

## TASK 2.1 — Create the session utility

**New file:** `lib/session.ts`

```ts
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'fm_session';
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'CHANGE_ME_IN_PRODUCTION_USE_A_LONG_RANDOM_STRING',
);
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14; // 14 days

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
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
```

Add `SESSION_SECRET` to `.env.example`:
```
SESSION_SECRET=replace_with_a_64_character_random_string
```

---

## TASK 2.2 — Create the session API route

**New file:** `app/api/auth/session/route.ts`

```ts
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
```

---

## TASK 2.3 — Create middleware

**New file:** `middleware.ts` (project root, next to `package.json`)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, SESSION_COOKIE } from './lib/session';

const PROTECTED_PREFIX = '/dashboard';
const LOGIN_PATH = '/login';

export async function middleware(request: NextRequest) {
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
```

---

## TASK 2.4 — Set the session cookie after every successful login

**File:** `app/login/page.tsx`

Create a helper function near the top of the component (before the return statement):

```ts
async function createSession(user: import('firebase/auth').User): Promise<void> {
  const idToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}
```

Then call `await createSession(firebaseUser)` after every successful authentication, just
before `router.replace('/dashboard')`. This applies to all three auth paths:

1. Email/password sign-in — in the `signInWithEmailAndPassword` success handler
2. Google OAuth — in the `signInWithPopup` success handler
3. Telegram — in the `signInWithCustomToken` success handler

In each case, the pattern is:
```ts
// existing auth call
const userCredential = await signInWith...(...)
// add this line before the router.replace:
await createSession(userCredential.user)
router.replace('/dashboard')
```

---

## TASK 2.5 — Delete the session cookie on logout

**File:** `app/dashboard/layout.tsx`

In `handleLogout`, before `await signOut(auth)`, add:
```ts
await fetch('/api/auth/session', { method: 'DELETE' });
```

So the full function becomes:
```ts
const handleLogout = async () => {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(auth);
    router.replace('/login');
  } catch (error) {
    logError(error, 'Layout.logout');
  }
};
```

---

## TASK 2.6 — Remove the client-side auth timeout from dashboard layout

**File:** `app/dashboard/layout.tsx`

Now that middleware handles unauthenticated redirects instantly, the 10-second timeout
pattern is no longer needed.

Remove the `authTimeout` state variable and its effect:
```ts
// REMOVE this state:
const [authTimeout, setAuthTimeout] = useState(false);

// REMOVE this useEffect:
useEffect(() => {
  setMounted(true);
  const timer = setTimeout(() => setAuthTimeout(true), 10000);
  return () => clearTimeout(timer);
}, []);
```

Update the mounted/loading check at the bottom. Change:
```ts
if (!mounted || (loading && !authTimeout)) {
  return <LoadingScreen />;
}
```
To:
```ts
if (!mounted || loading) {
  return <LoadingScreen />;
}
```

Update the redirect effect. Change:
```ts
useEffect(() => {
  if ((!loading || authTimeout) && !user) {
    router.replace('/login');
  }
}, [loading, user, router, authTimeout]);
```
To:
```ts
useEffect(() => {
  if (!loading && !user) {
    router.replace('/login');
  }
}, [loading, user, router]);
```

Keep the `mounted` state and its effect (just `setMounted(true)`) since it prevents
hydration flash — only remove the timeout-related code.

---

## TASK 2.7 — Refresh session cookie when flatId claim is set

**File:** `lib/setFlatClaim.ts` (created in Phase 1)

After the `await user.getIdToken(true)` call (which forces a token refresh), add a session
cookie refresh so the middleware cookie also reflects the new `flatId`:

```ts
// Refresh the session cookie with the updated flatId claim
const freshToken = await user.getIdToken();
await fetch('/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: freshToken }),
});
```

This ensures that after a user joins/creates a flat, the middleware cookie immediately
includes their `flatId` and they are not unexpectedly bounced on the next request.

---

# PHASE 3 — Extract Firestore data hooks

## Background

All dashboard pages write their Firestore subscription logic directly in the component body.
This makes the logic impossible to test in isolation, and means the same patterns (loading
state, error state, `onSnapshot` cleanup, `flatId` guard) are repeated across 6+ pages.

Extract each collection into a dedicated custom hook in `lib/hooks/`.

---

## TASK 3.1 — Create `useRoommates` hook

**New file:** `lib/hooks/useRoommates.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Roommate } from '../types';

export function useRoommates(flatId: string | undefined) {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users'),
            where('flatId', '==', flatId),
            orderBy('createdAt', 'desc'),
          ),
        );
        if (!mounted) return;
        setRoommates(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate)));
      } catch (err) {
        if (!mounted) return;
        logError(err, 'useRoommates');
        setError(err instanceof Error ? err : new Error('Failed to load roommates'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [flatId]);

  return { roommates, loading, error };
}
```

---

## TASK 3.2 — Create `useExpenses` hook

**New file:** `lib/hooks/useExpenses.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Expense } from '../types';

export function useExpenses(flatId: string | undefined, limitCount = 50) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('flatId', '==', flatId),
      orderBy('date', 'desc'),
      limit(limitCount),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useExpenses');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId, limitCount]);

  return { expenses, loading, error };
}
```

---

## TASK 3.3 — Create `useTasks` hook

**New file:** `lib/hooks/useTasks.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Task } from '../types';

export function useTasks(flatId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('flatId', '==', flatId),
      orderBy('dueDate', 'desc'),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useTasks');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId]);

  return { tasks, loading, error };
}
```

---

## TASK 3.4 — Create `useCleaningTasks` hook

**New file:** `lib/hooks/useCleaningTasks.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { CleaningTask } from '../types';

export function useCleaningTasks(flatId: string | undefined, weekStart: string) {
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'cleaning'),
      where('flatId', '==', flatId),
      where('weekStart', '==', weekStart),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCleaningTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CleaningTask)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useCleaningTasks');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId, weekStart]);

  return { cleaningTasks, loading, error };
}
```

---

## TASK 3.5 — Create `useAnnouncements` hook

**New file:** `lib/hooks/useAnnouncements.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Announcement } from '../types';

interface AnnouncementWithId extends Announcement {
  id: string;
}

export function useAnnouncements(flatId: string | undefined) {
  const [announcements, setAnnouncements] = useState<AnnouncementWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'announcements'),
      where('flatId', '==', flatId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnnouncementWithId));
        const sorted = [...data].sort((a, b) => {
          if (a.isPinned === b.isPinned) return 0;
          return a.isPinned ? -1 : 1;
        });
        setAnnouncements(sorted);
        setLoading(false);
      },
      (err) => {
        logError(err, 'useAnnouncements');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId]);

  return { announcements, loading, error };
}
```

---

## TASK 3.6 — Create `useSettlements` hook

**New file:** `lib/hooks/useSettlements.ts`

```ts
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Settlement, Expense, Roommate } from '../types';

interface SettlementsData {
  settlements: Settlement[];
  expenses: Expense[];
  users: Roommate[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSettlements(flatId: string | undefined, month: string): SettlementsData {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const [usersSnap, expensesSnap, settlementsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'users'),
              where('flatId', '==', flatId),
              orderBy('createdAt', 'desc'),
            ),
          ),
          getDocs(
            query(
              collection(db, 'expenses'),
              where('flatId', '==', flatId),
              where('date', '>=', `${month}-01`),
              where('date', '<=', `${month}-31`),
              orderBy('date', 'desc'),
              limit(200),
            ),
          ),
          getDocs(
            query(
              collection(db, 'settlements'),
              where('flatId', '==', flatId),
              orderBy('createdAt', 'desc'),
              limit(100),
            ),
          ),
        ]);

        if (!mounted) return;
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate)));
        setExpenses(expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
        setSettlements(settlementsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement)));
      } catch (err) {
        if (!mounted) return;
        logError(err, 'useSettlements');
        setError(err instanceof Error ? err : new Error('Failed to load settlements'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [flatId, month, tick]);

  return { settlements, expenses, users, loading, error, refetch };
}
```

---

## TASK 3.7 — Refactor pages to use the new hooks

Update each of the following pages to replace their inline Firestore subscription logic with
the corresponding hook. The component should keep all its mutation logic (add, update, delete)
and UI rendering — only the data-fetching setup should move to the hook.

### `app/dashboard/tasks/page.tsx`

1. Add imports:
   ```ts
   import { useTasks } from '../../../lib/hooks/useTasks';
   import { useRoommates } from '../../../lib/hooks/useRoommates';
   ```

2. Replace the `tasks`, `users`, `loading` state declarations and their `useEffect` block with:
   ```ts
   const { tasks, loading } = useTasks(userProfile?.flatId);
   const { roommates: users } = useRoommates(userProfile?.flatId);
   ```

3. Remove the `useState` declarations for `tasks`, `users`, `loading` and the entire `useEffect`
   that contained `loadUsers`, `onSnapshot`, and the `mounted` guard.

4. Keep the `adding` state and all mutation handlers (`handleAdd`, `toggleDone`, `handleDelete`).

### `app/dashboard/cleaning/page.tsx`

1. Add imports:
   ```ts
   import { useCleaningTasks } from '../../../lib/hooks/useCleaningTasks';
   import { useRoommates } from '../../../lib/hooks/useRoommates';
   ```

2. Replace the `cleaning`, `users`, `loading` state declarations and their two `useEffect` blocks
   (the one that loads users and the one that sets up the `onSnapshot`) with:
   ```ts
   const { cleaningTasks: cleaning, loading } = useCleaningTasks(userProfile?.flatId, weekStart);
   const { roommates: users } = useRoommates(userProfile?.flatId);
   ```

3. Remove the now-redundant `useState` and `useEffect` blocks for these three values.

4. Keep all mutation handlers and UI rendering.

### `app/dashboard/announcements/page.tsx`

1. Add import:
   ```ts
   import { useAnnouncements } from '../../../lib/hooks/useAnnouncements';
   ```

2. Replace the `announcements` state declaration and its `useEffect` (the one with `onSnapshot`) with:
   ```ts
   const { announcements, loading } = useAnnouncements(userProfile?.flatId);
   ```

3. Remove the `useState` for `announcements` and `loading`, and the `useEffect` that contained
   the `onSnapshot` subscription and the pinned-sort logic (sorting is now done inside the hook).

4. Keep all mutation handlers (`handleAdd`, `handleDelete`, `handlePin`) and UI rendering.

### `app/dashboard/balances/page.tsx`

1. Add import:
   ```ts
   import { useSettlements } from '../../../lib/hooks/useSettlements';
   ```

2. Replace the `users`, `expenses`, `settlements`, `loading` state declarations and the
   `loadData` callback + its `useEffect` with:
   ```ts
   const {
     settlements,
     expenses,
     users,
     loading,
     refetch,
   } = useSettlements(userProfile?.flatId, selectedMonth);
   ```

3. Replace every call to `loadData()` in the component (e.g., after adding a settlement) with
   `refetch()`.

4. Remove the now-unused `useCallback` import if `loadData` was the only usage.

### `app/dashboard/page.tsx`

1. Add imports:
   ```ts
   import { useExpenses } from '@/lib/hooks/useExpenses';
   import { useTasks } from '@/lib/hooks/useTasks';
   import { useCleaningTasks } from '@/lib/hooks/useCleaningTasks';
   import { useRoommates } from '@/lib/hooks/useRoommates';
   ```

2. Replace the `expenses`, `tasks`, `cleaningTasks`, `users`, `loading` state declarations and
   the large `useEffect` that sets up all four `onSnapshot` subscriptions (the one using the
   `Set<string>` loading tracker introduced in the previous round of fixes) with:
   ```ts
   const weekStart = useMemo(() => getMonday(new Date()), []);
   const { expenses, loading: loadingExpenses } = useExpenses(userProfile?.flatId);
   const { tasks, loading: loadingTasks } = useTasks(userProfile?.flatId);
   const { cleaningTasks, loading: loadingCleaning } = useCleaningTasks(userProfile?.flatId, weekStart);
   const { roommates: users, loading: loadingUsers } = useRoommates(userProfile?.flatId);
   const loading = loadingExpenses || loadingTasks || loadingCleaning || loadingUsers;
   ```

3. Remove the four `useState` declarations and the large `useEffect` block.

4. The `weekStart` is now derived via `useMemo` instead of being computed inline inside
   `useEffect`. Make sure to update the `getMonday` call accordingly.

5. Keep `currentMonth`, the `activityFeed` memo, stats computation, and all rendering logic.

---

## FINAL VERIFICATION

After all three phases:

```bash
# TypeScript — must produce 0 errors
npx tsc --noEmit

# Lint — must produce 0 errors
npx eslint .

# Tests — must all pass
npm test
```

Additionally, manually verify:
1. Navigating to `/dashboard` while logged out redirects to `/login` instantly (no spinner wait).
2. Navigating to `/login` while logged in redirects to `/dashboard` instantly.
3. After a new user creates or joins a flat, the `flatId` appears as a custom claim in their
   Firebase Auth token (check in Firebase Console → Authentication → user → Custom claims).
4. The Firestore Emulator (or production) correctly enforces the updated `firestore.rules`
   with claim-based tenant isolation.

Do not introduce any new `// @ts-ignore` or `// eslint-disable` comments.
