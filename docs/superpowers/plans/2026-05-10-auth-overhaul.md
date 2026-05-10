# Auth Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth and Telegram Login Widget, remove dev admin toggle, add flat connection flow (create/join/skip).

**Architecture:**
- Google uses Firebase's built-in `GoogleAuthProvider` with `signInWithPopup`. Telegram uses a custom flow: Login Widget callback → `POST /api/auth/telegram` (hash verification via HMAC-SHA256) → Firebase custom auth token → `signInWithCustomToken`. First-time logins auto-create Firestore profiles. After login, if user has no `flatId`, a skippable modal offers Create/Join/Skip.
- AuthContext handles profile fetch; profile creation happens in the login page after sign-in. A new `FlatConnectionModal` renders in the dashboard layout when `flatId` is missing.
- Firestore gains a `flats/` collection keyed by 6-char invite codes (which double as `flatId` values).

**Tech Stack:** Next.js 16 App Router, Firebase Auth (email/Google), Firebase Admin SDK (custom tokens), Telegram Login Widget, firestore.rules

---

## File Map

### Files to Create
| File | Responsibility |
|------|---------------|
| `app/api/auth/telegram/route.ts` | POST handler: verify Telegram hash via HMAC-SHA256, check auth_date replay window, create/lookup Firebase user by Telegram ID, mint custom auth token |
| `app/components/FlatConnectionModal.tsx` | Skippable modal with "Create Flat" and "Join Flat" tabs, generates/validates 6-char invite codes, writes to `flats/` collection |

### Files to Modify
| File | What changes |
|------|-------------|
| `app/login/page.tsx` | Redesign layout to Option A (stacked buttons), add Google + Telegram buttons, remove dev admin toggle, handle first-time profile creation |
| `context/AuthContext.tsx` | Add `showFlatModal` state and `setShowFlatModal` to context so dashboard and other pages can control the flat connection flow |
| `app/dashboard/layout.tsx` | Import and render `FlatConnectionModal` when `userProfile?.flatId` is null; pass `showFlatModal` from AuthContext |
| `app/dashboard/page.tsx` | Add flatless banner at top when `!userProfile?.flatId` with "Set up your flat" button |
| `app/dashboard/roommates/page.tsx` | Show the flat's invite code for admin to copy/share |
| `firestore.rules` | Add `flats/{code}` collection: anyone authenticated can create; any authenticated user can read if they know the code |
| `lib/types.ts` | Add `FlatDoc` type for the `flats/` collection documents |

### No Changes Needed
- `lib/firebase.ts` — already exports `auth`, `db`. No new client SDK imports needed.
- `lib/errorLogger.ts` — already works for all error logging.

---

## Task Breakdown

### Task 1: Add `FlatDoc` type and extend AuthContext

**Files:**
- Modify: `lib/types.ts` (add `FlatDoc`)
- Modify: `context/AuthContext.tsx` (add `showFlatModal` + `setShowFlatModal`)

---

- [ ] **Step 1: Add `FlatDoc` interface to types**

```typescript
// lib/types.ts — add after existing Flat interface

export interface FlatDoc {
  createdBy: string;
  createdAt: string;
  members: string[];
}
```

- [ ] **Step 2: Extend AuthContext with flat modal control**

```typescript
// context/AuthContext.tsx — update AuthContextType
interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  showFlatModal: boolean;
  setShowFlatModal: (show: boolean) => void;
}

// Update default context value
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  showFlatModal: false,
  setShowFlatModal: () => {},
});

// In AuthProvider component, add state:
const [showFlatModal, setShowFlatModal] = useState(false);

// Update Provider value to include:
<AuthContext.Provider value={{ user, userProfile, loading, showFlatModal, setShowFlatModal }}>
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts context/AuthContext.tsx
git commit -m "feat: add FlatDoc type and flatModal state to AuthContext"
```

---

### Task 2: Create Telegram API Route

**Files:**
- Create: `app/api/auth/telegram/route.ts`

This endpoint receives Telegram Login Widget callback data, verifies the hash, and returns a Firebase custom auth token.

- [ ] **Step 1: Create the API route**

```typescript
// app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import crypto from 'crypto';

function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials not configured');
    }
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin.app();
}

function verifyTelegramHash(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...fields } = data;
  const sorted = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(sorted).digest('hex');
  return computed === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;

    if (!id || !hash || !auth_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Replay protection: auth_date must be within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(auth_date) > 300) {
      return NextResponse.json({ error: 'Auth data expired' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 500 });
    }

    if (!verifyTelegramHash({ id, first_name, last_name, username, photo_url, auth_date, hash }, botToken)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    const app = getAdminApp();
    const telegramId = String(id);

    // Check if user already exists by searching Firestore for telegramId
    const existingUsers = await admin.firestore()
      .collection('users')
      .where('telegramId', '==', telegramId)
      .get();

    let uid: string;

    if (!existingUsers.empty) {
      uid = existingUsers.docs[0].id;
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/telegram/route.ts
git commit -m "feat: add Telegram auth API route with hash verification"
```

---

### Task 3: Redesign Login Page — Layout, Google, Telegram, Remove Dev Toggle

**Files:**
- Modify: `app/login/page.tsx`

This is the largest task. The entire login page is redesigned to Option A layout: Google button → Telegram button → divider → email form. Dev toggle removed. Google popup and Telegram widget integrated. First-time profile creation handled.

- [ ] **Step 1: Rewrite login page**

```typescript
'use client';
import { useI18n } from '../../context/I18nContext';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, limit as fsLimit, query } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff } from 'lucide-react';
import { logError } from '../../lib/errorLogger';

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string>) => void;
  }
}

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        router.replace('/dashboard');
      }
      setTimeout(() => setPageReady(true), 50);
    });
    return () => unsubscribe();
  }, [router]);

  // Handle Telegram callback
  const handleTelegramAuth = useCallback(async (tgUser: Record<string, string>) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Telegram authentication failed');
        return;
      }
      await signInWithCustomToken(auth, data.token);
      // AuthContext's onAuthStateChanged will pick up the session
    } catch (err) {
      logError(err, 'Login.telegramAuth');
      setError('Telegram authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Expose Telegram callback globally (Telegram Widget calls this)
  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;
    return () => { delete window.onTelegramAuth; };
  }, [handleTelegramAuth]);

  const ensureUserProfile = async (uid: string, extraData?: Record<string, unknown>) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        username: extraData?.email || uid,
        name: extraData?.name || undefined,
        role: 'roommate',
        joinedAt: new Date().toISOString(),
        avatar: extraData?.avatar || undefined,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      await ensureUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        avatar: firebaseUser.photoURL,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = (err as Error).message;
      if (code === 'auth/account-exists-with-different-credential') {
        setError('An account with this email already exists. Sign in with email/password instead, then link Google in settings.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed popup — do nothing
      } else {
        logError(err, 'Login.googleSignIn');
        setError(msg || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramClick = () => {
    // The Telegram Login Widget script auto-opens a popup
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      setError('Telegram login not configured');
      return;
    }
    // Trigger Telegram widget by programmatically creating the script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    document.body.appendChild(script);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(username)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        setError('User profile not found');
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      const code = (err as { code?: string }).code;
      let message = 'An error occurred';
      switch (code) {
        case 'auth/user-not-found': message = 'No account found with this email'; break;
        case 'auth/wrong-password': message = 'Incorrect password'; break;
        case 'auth/invalid-email': message = 'Invalid email address'; break;
        case 'auth/invalid-credential': message = 'Invalid email or password'; break;
        default: message = (err as Error).message || 'An error occurred';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const bullets = [
    'Track rent and shared expenses',
    'Rotating cleaning schedules',
    'Live USD/UZS exchange rates',
  ];

  return (
    <div className={`min-h-screen flex transition-opacity duration-500 bg-white ${pageReady ? 'opacity-100' : 'opacity-0'}`}>
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col items-center justify-between w-1/2 px-16 py-12 bg-[#f9fafb] dark:bg-gray-900">
        <div></div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-left max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</h1>
          </div>
          <p className="text-lg text-[#6b7280] dark:text-gray-400 mb-8">Manage your apartment together.</p>
          <div className="space-y-3">
            {bullets.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F97316]/10 dark:bg-[#F97316]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#F97316]" />
                </div>
                <span className="text-sm text-[#6b7280] dark:text-gray-400">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="text-xs text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} FlatMate · Tashkent 🇺🇿</div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-12 bg-white dark:bg-gray-800">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <span className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100 mb-2">Welcome back</h2>
            <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-8">Sign in to your account</p>

            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-60 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            {/* Telegram Button */}
            <button
              onClick={handleTelegramClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#0088cc] hover:bg-[#0077b5] rounded-lg px-4 py-3 text-white font-medium transition disabled:opacity-60 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Continue with Telegram
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-xs text-[#6b7280] dark:text-gray-400">or sign in with email</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g., admin@flatmate.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60"
              >
                Sign in
              </button>
              {error && <div className="text-red-500 dark:text-red-400 text-sm text-center mt-2">{error}</div>}
            </form>

            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
              Credentials are provided by your admin
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: redesign login page with Google, Telegram, email auth"
```

---

### Task 4: Create FlatConnectionModal

**Files:**
- Create: `app/components/FlatConnectionModal.tsx`

- [ ] **Step 1: Write the modal component**

```typescript
// app/components/FlatConnectionModal.tsx
'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { X, Users, Key, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '../lib/errorLogger';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function FlatConnectionModal() {
  const { userProfile, setShowFlatModal } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const code = generateInviteCode();
      // Ensure code is unique
      const existing = await getDoc(doc(db, 'flats', code));
      if (existing.exists()) {
        // Collision — try again
        return handleCreate();
      }
      await setDoc(doc(db, 'flats', code), {
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        members: [userProfile.uid],
      });
      // Update current user's flatId
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      setGeneratedCode(code);
      toast.success('Flat created! Share the code with your roommates.');
    } catch (error) {
      logError(error, 'FlatConnection.create');
      toast.error('Failed to create flat');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userProfile?.uid) return;
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      toast.error('Enter a valid 6-character code');
      return;
    }
    setLoading(true);
    try {
      const flatDoc = await getDoc(doc(db, 'flats', code));
      if (!flatDoc.exists()) {
        toast.error('Flat not found. Check the code with your roommate.');
        return;
      }
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      toast.success('You joined the flat!');
      setShowFlatModal(false);
    } catch (error) {
      logError(error, 'FlatConnection.join');
      toast.error('Failed to join flat');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClose = () => {
    setShowFlatModal(false);
  };

  if (generatedCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Flat Created!</h2>
          <p className="text-gray-400 mb-6">Share this code with your roommates so they can join:</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-amber-400">{generatedCode}</span>
            <button onClick={handleCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Set Up Your Flat</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'create' ? 'bg-amber-400 text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Create Flat
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'join' ? 'bg-amber-400 text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            Join Flat
          </button>
        </div>

        {tab === 'create' ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              Create a new flat and get a code to share with your roommates.
            </p>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Flat'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Enter the 6-character code your roommate shared with you.
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g., A3X9K2"
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-amber-400 outline-none mb-4"
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join Flat'}
            </button>
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-4 transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/FlatConnectionModal.tsx
git commit -m "feat: add FlatConnectionModal for create/join/skip flat flow"
```

---

### Task 5: Render FlatConnectionModal in Dashboard Layout

**Files:**
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Import and render modal when flatId is missing**

Import `FlatConnectionModal` at the top. Inside the layout component, after the auth guard check passes (user is authenticated), add:

```typescript
// Near the top of DashboardLayout, after other useEffects:
useEffect(() => {
  if (!loading && user && !userProfile?.flatId) {
    setShowFlatModal(true);
  }
}, [loading, user, userProfile?.flatId, setShowFlatModal]);
```

And inside the returned JSX, before the closing `</div>` of the layout wrapper:

```tsx
{showFlatModal && <FlatConnectionModal />}
```

Full diff for the layout:

```typescript
// Add imports
import FlatConnectionModal from '../components/FlatConnectionModal';

// In DashboardLayout component, add state or use from context:
const { user, userProfile, loading, showFlatModal } = useAuth();

// Add useEffect after the existing authTimeout effect:
useEffect(() => {
  if (!loading && user && !userProfile?.flatId) {
    setShowFlatModal(true);
  }
}, [loading, user, userProfile?.flatId, setShowFlatModal]);
```

Wait — the layout uses `useAuth()` which now returns `showFlatModal` and `setShowFlatModal`. But we imported `{ useAuth }` at line 21 already. We just need to destructure the new values.

In the JSX, add `{showFlatModal && <FlatConnectionModal />}` at the end of the layout wrapper div's children but still inside the `<div className="flex min-h-screen ...">`.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: show FlatConnectionModal when user has no flatId"
```

---

### Task 6: Add Flatless Banner to Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add flatless banner at top of dashboard**

Import `{ useAuth }` (already imported). After the opening `<div>` of the page content, add:

```tsx
{!userProfile?.flatId && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between"
  >
    <div>
      <p className="text-amber-400 font-medium">You&apos;re not in a flat yet</p>
      <p className="text-gray-400 text-sm">Set up your flat to start tracking expenses and chores with your roommates.</p>
    </div>
    <button
      onClick={() => setShowFlatModal(true)}
      className="bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-300 transition text-sm whitespace-nowrap"
    >
      Set up your flat
    </button>
  </motion.div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add flatless banner to dashboard home"
```

---

### Task 7: Show Invite Code in Roommates Page

**Files:**
- Modify: `app/dashboard/roommates/page.tsx`

- [ ] **Step 1: Add invite code section for admin**

Near the top of the roommates page (below the header, above the roommate cards), when `userProfile?.flatId` exists and user is admin:

```tsx
{userProfile?.flatId && isAdmin && (
  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
    <div>
      <p className="text-white font-medium">Flat Invite Code</p>
      <p className="text-gray-400 text-sm">Share this code with new roommates so they can join your flat.</p>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xl font-mono font-bold tracking-widest text-amber-400">{userProfile.flatId}</span>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(userProfile.flatId!);
          toast.success('Code copied!');
        }}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
      >
        <Copy className="w-4 h-4 text-white" />
      </button>
    </div>
  </div>
)}
```

Need to import `Copy` from lucide-react and `useAuth` (already imported).

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/roommates/page.tsx
git commit -m "feat: show flat invite code in roommates page"
```

---

### Task 8: Update Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add rules for `flats/` collection**

After the notifications match block, add:

```javascript
    // Flats: anyone authenticated can create a flat, anyone can read a flat by code
    match /flats/{code} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add firestore rules for flats collection"
```

---

### Task 9: Add Telegram Env Vars to README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add Telegram env vars to the Environment Variables section**

In the README, after the Firebase Admin block, add:

```markdown
# Telegram (required for Telegram login)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token
```

And update the Firebase Auth section to add a note: above `FIREBASE_PROJECT_ID`, add:

```markdown
# Note: Enable "Sign-in method > Google" in Firebase Console for Google login
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Telegram env vars to README"
```

---

## Self-Review Checklist

- **Spec coverage:** Every requirement from the spec is covered:
  - Google login: Task 3 (login page)
  - Telegram login widget: Task 2 (API route) + Task 3 (login page)
  - Email/password: Task 3 (existing flow preserved)
  - Account linking: Task 3 (Google conflict error message)
  - Flat connection modal: Task 4 + Task 5
  - Flatless banner: Task 6
  - Invite code in roommates: Task 7
  - Firestore rules: Task 8
  - Remove dev toggle: Task 3
- **Types consistent:** `FlatDoc` type added in Task 1 is used implicitly in Task 4 (setDoc writes match the shape). Types match.
- **Dependency order:** Task 1 (types/context) → Task 2 (API) → Task 3 (login page) → Task 4 (modal) → Task 5 (layout) → Task 6 (banner) → Task 7 (roommates) → Task 8 (rules) → Task 9 (env vars). Each task builds on previous ones correctly.
- **Env vars needed:** `TELEGRAM_BOT_TOKEN` (server), `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` (client) — added in Task 9.
