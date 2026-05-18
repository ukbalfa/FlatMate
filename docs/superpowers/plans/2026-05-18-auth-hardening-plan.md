# Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the login/sign-up flow with email validation, email verification gate, password strength meter, hCaptcha, rate limiting, and privacy consent enforcement.

**Architecture:** Modify the existing login page, add a verification page, add a server-side captcha verification route, and add a password strength utility. All changes are additive — no existing behavior is removed, only enhanced.

**Tech Stack:** Next.js 16 App Router, Firebase Auth v12, hCaptcha, Framer Motion, Tailwind v4, Jest

---

### Task 1: Add Password Strength Utility + Tests

**Files:**
- Create: `lib/passwordStrength.ts`
- Test: `__tests__/passwordStrength.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/passwordStrength.test.ts
import { getPasswordStrength, PasswordStrengthLevel } from '../lib/passwordStrength';

describe('getPasswordStrength', () => {
  it('returns Weak for empty password', () => {
    const result = getPasswordStrength('');
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0);
  });

  it('returns Weak for short password', () => {
    const result = getPasswordStrength('abc');
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0);
  });

  it('returns Fair for 8+ chars only', () => {
    const result = getPasswordStrength('abcdefgh');
    expect(result.level).toBe('fair');
    expect(result.score).toBe(1);
  });

  it('returns Good for 8+ chars with digit', () => {
    const result = getPasswordStrength('abcdefg1');
    expect(result.level).toBe('good');
    expect(result.score).toBe(2);
  });

  it('returns Strong for 8+ chars with digit and special char', () => {
    const result = getPasswordStrength('abcdefg1!');
    expect(result.level).toBe('strong');
    expect(result.score).toBe(3);
  });

  it('returns Strong for 8+ chars with uppercase and special', () => {
    const result = getPasswordStrength('Abcdefg!');
    expect(result.level).toBe('strong');
    expect(result.score).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- __tests__/passwordStrength.test.ts
```
Expected: FAIL with "Cannot find module '../lib/passwordStrength'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/passwordStrength.ts
export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number; // 0-3
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) return { level: 'weak', score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;

  const levels: PasswordStrengthLevel[] = ['weak', 'fair', 'good', 'strong'];
  return { level: levels[score]!, score };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- __tests__/passwordStrength.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/passwordStrength.ts __tests__/passwordStrength.test.ts
git commit -m "feat: add password strength utility with tests"
```

---

### Task 2: Add hCaptcha Verification API Route

**Files:**
- Create: `app/api/auth/verify-captcha/route.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// app/api/auth/verify-captcha/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.HCAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'hCaptcha not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No captcha token provided' }, { status: 400 });
    }

    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, errorCodes: data['error-codes'] || [] }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/verify-captcha/route.ts
git commit -m "feat: add hCaptcha verification API route"
```

---

### Task 3: Add Translations for All Languages

**Files:**
- Modify: `context/I18nContext.tsx` — add new translation keys to `en`, `ru`, and `uz` sections

- [ ] **Step 1: Add English translations**

In the `en` section of `translations`, after the existing login keys (after `'login.and': 'and'`), add:

```typescript
'login.errorEmailNotVerified': 'Please verify your email before signing in',
'login.verifyEmailTitle': 'Check your email',
'login.verifyEmailSubtitle': 'We sent a verification link to {email}',
'login.verifyEmailResend': 'Resend verification email',
'login.verifyEmailResendCooldown': 'Resend in {seconds}s',
'login.verifyEmailBackToSignIn': 'Back to sign in',
'login.passwordStrengthWeak': 'Weak',
'login.passwordStrengthFair': 'Fair',
'login.passwordStrengthGood': 'Good',
'login.passwordStrengthStrong': 'Strong',
'login.errorCaptchaRequired': 'Please complete the captcha',
'login.errorCaptchaFailed': 'Captcha verification failed. Please try again.',
'login.errorRateLimited': 'Too many attempts. Try again in {seconds}s',
'login.passwordStrength': 'Password strength',
'login.signUpSuccess': 'Account created! Check your email to verify.',
'login.resendCooldownActive': 'Resend available in {seconds}s',
'login.emailSent': 'Verification email sent',
'login.resendFailed': 'Failed to resend verification email',
```

- [ ] **Step 2: Add Russian translations**

In the `ru` section, after the existing login keys (after `'login.and': 'и'`), add:

```typescript
'login.errorEmailNotVerified': 'Пожалуйста, подтвердите email перед входом',
'login.verifyEmailTitle': 'Проверьте вашу почту',
'login.verifyEmailSubtitle': 'Мы отправили ссылку для подтверждения на {email}',
'login.verifyEmailResend': 'Отправить письмо повторно',
'login.verifyEmailResendCooldown': 'Отправка через {seconds}с',
'login.verifyEmailBackToSignIn': 'Назад ко входу',
'login.passwordStrengthWeak': 'Слабый',
'login.passwordStrengthFair': 'Средний',
'login.passwordStrengthGood': 'Хороший',
'login.passwordStrengthStrong': 'Надёжный',
'login.errorCaptchaRequired': 'Пожалуйста, пройдите проверку captcha',
'login.errorCaptchaFailed': 'Проверка captcha не удалась. Попробуйте снова.',
'login.errorRateLimited': 'Слишком много попыток. Попробуйте через {seconds}с',
'login.passwordStrength': 'Надёжность пароля',
'login.signUpSuccess': 'Аккаунт создан! Проверьте email для подтверждения.',
'login.resendCooldownActive': 'Повторная отправка через {seconds}с',
'login.emailSent': 'Письмо с подтверждением отправлено',
'login.resendFailed': 'Не удалось отправить письмо повторно',
```

- [ ] **Step 3: Add Uzbek translations**

In the `uz` section, after the existing login keys (after `'login.switchToSignIn': "Ro'yxatdan o'tish"`), add:

```typescript
'login.errorEmailNotVerified': "Iltimos, kirishdan oldin emailingizni tasdiqlang",
'login.verifyEmailTitle': 'Emailingizni tekshiring',
'login.verifyEmailSubtitle': "Biz tasdiqlash havolasini {email} manziliga yubordik",
'login.verifyEmailResend': 'Tasdiqlash xatini qayta yuborish',
'login.verifyEmailResendCooldown': '{seconds}s dan keyin qayta yuborish',
'login.verifyEmailBackToSignIn': "Kirishga qaytish",
'login.passwordStrengthWeak': 'Zaif',
'login.passwordStrengthFair': "O'rtacha",
'login.passwordStrengthGood': 'Yaxshi',
'login.passwordStrengthStrong': 'Kuchli',
'login.errorCaptchaRequired': "Iltimos, captcha tekshiruvidan o'ting",
'login.errorCaptchaFailed': "Captcha tekshiruvi muvaffaqiyatsiz. Qayta urinib ko'ring.",
'login.errorRateLimited': "Juda ko'p urinishlar. {seconds}s dan keyin qayta urining",
'login.passwordStrength': 'Parol kuchi',
'login.signUpSuccess': "Hisob yaratildi! Tasdiqlash uchun emailingizni tekshiring.",
'login.resendCooldownActive': '{seconds}s dan keyin qayta yuborish mumkin',
'login.emailSent': 'Tasdiqlash xati yuborildi',
'login.resendFailed': "Tasdiqlash xatini qayta yuborib bo'lmadi",
```

- [ ] **Step 4: Commit**

```bash
git add context/I18nContext.tsx
git commit -m "feat: add auth hardening translations for en, ru, uz"
```

---

### Task 4: Modify Login Page — Validation, Password Strength, Consent

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Add new imports and state variables**

At the top of `LoginPage()`, add these imports:

```typescript
import { sendEmailVerification } from 'firebase/auth';
import { getPasswordStrength, PasswordStrengthLevel } from '../../lib/passwordStrength';
```

Add new state variables after the existing `useState` declarations:

```typescript
const [consentAccepted, setConsentAccepted] = useState(false);
const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthLevel>('weak');
const [resendCooldown, setResendCooldown] = useState(0);
const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
const [showVerifyStep, setShowVerifyStep] = useState(false);
const [pendingEmail, setPendingEmail] = useState('');
```

- [ ] **Step 2: Add email validation helper**

Add this function before `handleEmailSignIn`:

```typescript
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

- [ ] **Step 3: Add password strength sync**

Add a `useEffect` after the existing ones:

```typescript
useEffect(() => {
  if (password.length > 0) {
    setPasswordStrength(getPasswordStrength(password).level);
  } else {
    setPasswordStrength('weak');
  }
}, [password]);
```

- [ ] **Step 4: Add resend cooldown effect**

```typescript
useEffect(() => {
  if (resendCooldown <= 0) return;
  const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
  return () => clearTimeout(timer);
}, [resendCooldown]);
```

- [ ] **Step 5: Add rate limit cooldown effect**

```typescript
useEffect(() => {
  if (rateLimitCooldown <= 0) return;
  const timer = setTimeout(() => setRateLimitCooldown((prev) => prev - 1), 1000);
  return () => clearTimeout(timer);
}, [rateLimitCooldown]);
```

- [ ] **Step 6: Add rate limit helper functions**

Before `handleEmailSignIn`, add:

```typescript
const getRateLimitState = (): { count: number; lastAttempt: number } => {
  if (typeof window === 'undefined') return { count: 0, lastAttempt: 0 };
  try {
    const stored = sessionStorage.getItem('auth_attempts');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { count: 0, lastAttempt: 0 };
};

const recordFailedAttempt = () => {
  if (typeof window === 'undefined') return;
  const state = getRateLimitState();
  const now = Date.now();
  if (now - state.lastAttempt > 30000) {
    sessionStorage.setItem('auth_attempts', JSON.stringify({ count: 1, lastAttempt: now }));
  } else {
    sessionStorage.setItem('auth_attempts', JSON.stringify({ count: state.count + 1, lastAttempt: now }));
  }
};

const clearRateLimit = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('auth_attempts');
};

const checkRateLimit = (): boolean => {
  const state = getRateLimitState();
  const now = Date.now();
  if (state.count >= 3 && now - state.lastAttempt < 30000) {
    const remaining = Math.ceil((30000 - (now - state.lastAttempt)) / 1000);
    setRateLimitCooldown(remaining);
    return true;
  }
  if (state.count >= 3 && now - state.lastAttempt >= 30000) {
    clearRateLimit();
  }
  return false;
};
```

- [ ] **Step 7: Add resend verification function**

```typescript
const handleResendVerification = async () => {
  if (resendCooldown > 0) return;
  setIsLoading(true);
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
      toast.success(t('login.emailSent'));
      setResendCooldown(60);
    }
  } catch (err) {
    logError(err, 'Login.resendVerification');
    toast.error(t('login.resendFailed'));
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 8: Modify handleEmailSignIn**

Replace the entire `handleEmailSignIn` function:

```typescript
const handleEmailSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  clearErrors();

  if (checkRateLimit()) {
    return;
  }

  const errors: FieldErrors = {};
  if (!email.trim() || !isValidEmail(email)) {
    errors.email = t('login.errorValidEmail');
  }
  if (password.length < 8) {
    errors.password = t('login.errorPasswordMinLength');
  }
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  setIsLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      setError(t('login.errorEmailNotVerified'));
      await sendEmailVerification(userCredential.user);
      setResendCooldown(60);
      recordFailedAttempt();
      return;
    }
    await ensureUserProfile(userCredential.user.uid, { email });
    clearRateLimit();
    router.push('/dashboard');
  } catch (err) {
    recordFailedAttempt();
    const code = (err as { code?: string }).code;
    let message = t('login.errorGeneric');
    switch (code) {
      case 'auth/user-not-found': message = t('login.errorNoAccount'); break;
      case 'auth/wrong-password': message = t('login.errorWrongPassword'); break;
      case 'auth/invalid-email': message = t('login.errorInvalidEmail'); break;
      case 'auth/invalid-credential': message = t('login.errorInvalidCredential'); break;
      default: message = (err as Error).message || t('login.errorGeneric');
    }
    const rateState = getRateLimitState();
    if (rateState.count >= 3) {
      const remaining = Math.ceil((30000 - (Date.now() - rateState.lastAttempt)) / 1000);
      if (remaining > 0) setRateLimitCooldown(remaining);
    }
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 9: Modify handleEmailSignUp**

Replace the entire `handleEmailSignUp` function:

```typescript
const handleEmailSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  clearErrors();

  const errors: FieldErrors = {};
  if (!name.trim()) {
    errors.name = t('common.fillAllFields');
  }
  if (!email.trim() || !isValidEmail(email)) {
    errors.email = t('login.errorValidEmail');
  }
  if (password.length < 8) {
    errors.password = t('login.passwordMinLength');
  }
  if (!consentAccepted) {
    setError(t('login.errorCaptchaRequired'));
    return;
  }
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  setIsLoading(true);
  try {
    const captchaResponse = await fetch('/api/auth/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: (window as any).hcaptcha?.getResponse() }),
    });
    const captchaData = await captchaResponse.json();
    if (!captchaData.success) {
      setError(t('login.errorCaptchaFailed'));
      setIsLoading(false);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await ensureUserProfile(userCredential.user.uid, {
      email,
      name: name.trim(),
    });
    toast.success(t('login.signUpSuccess'));
    setPendingEmail(email);
    setShowVerifyStep(true);
  } catch (err) {
    const code = (err as { code?: string }).code;
    let message = t('login.errorGeneric');
    switch (code) {
      case 'auth/email-already-in-use': message = t('login.emailInUse'); break;
      case 'auth/invalid-email': message = t('login.invalidEmail'); break;
      case 'auth/weak-password': message = t('login.weakPassword'); break;
      default: message = (err as Error).message || t('login.errorGeneric');
    }
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 10: Update handleTabChange to reset new state**

Replace `handleTabChange`:

```typescript
const handleTabChange = (tab: 'signin' | 'signup') => {
  setActiveTab(tab);
  clearErrors();
  setEmail('');
  setPassword('');
  setName('');
  setConsentAccepted(false);
  setPasswordStrength('weak');
  setShowVerifyStep(false);
  setPendingEmail('');
};
```

- [ ] **Step 11: Add password strength bar UI**

In the JSX, after the password field's error display (after the `fieldErrors.password` block, before the password hint/forgot link section), add:

```tsx
{activeTab === 'signup' && password.length > 0 && (
  <div className="mt-2">
    <div className="flex gap-1 mb-1">
      {[1, 2, 3].map((level) => (
        <div
          key={level}
          className={`h-1 flex-1 rounded-full transition-colors ${
            passwordStrength === 'weak' ? 'bg-red-500' :
            passwordStrength === 'fair' ? (level <= 1 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600') :
            passwordStrength === 'good' ? (level <= 2 ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-600') :
            'bg-green-500'
          }`}
        />
      ))}
    </div>
    <p className="text-xs text-[#9ca3af] dark:text-gray-500">
      {t(`login.passwordStrength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`)}
    </p>
  </div>
)}
```

- [ ] **Step 12: Update privacy consent checkbox to use state**

Replace the privacy consent section:

```tsx
{activeTab === 'signup' && (
  <div className="flex items-start gap-3 mb-4">
    <input
      type="checkbox"
      id="privacyConsent"
      checked={consentAccepted}
      onChange={(e) => setConsentAccepted(e.target.checked)}
      className="mt-1 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
    />
    <label htmlFor="privacyConsent" className="text-xs text-[#6b7280] dark:text-gray-400 leading-relaxed">
      {t('login.privacyConsent')}{' '}
      <Link href="/privacy" className="text-accent hover:underline">
        {t('login.privacyPolicy')}
      </Link>
      {' '}{t('login.and')}{' '}
      <Link href="/terms" className="text-accent hover:underline">
        {t('login.termsOfService')}
      </Link>
    </label>
  </div>
)}
```

- [ ] **Step 13: Add hCaptcha widget for sign-up**

After the privacy consent block and before the submit button, add:

```tsx
{activeTab === 'signup' && (
  <div className="mb-4">
    <div
      className="h-captcha"
      data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
    />
  </div>
)}
```

Also add a `useEffect` to load the hCaptcha script when on the signup tab:

```typescript
useEffect(() => {
  if (activeTab !== 'signup' || typeof window === 'undefined') return;
  if ((window as any).hcaptcha) return;
  const script = document.createElement('script');
  script.src = 'https://js.hcaptcha.com/1/api.js';
  script.async = true;
  script.onload = () => {
    if ((window as any).hcaptcha) {
      (window as any).hcaptcha.render(document.querySelector('.h-captcha'), {
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
        theme: 'dark',
      });
    }
  };
  document.body.appendChild(script);
}, [activeTab]);
```

- [ ] **Step 14: Update submit button to disable based on new conditions**

Replace the submit button:

```tsx
<button
  type="submit"
  disabled={isLoading || (activeTab === 'signup' && (!consentAccepted || rateLimitCooldown > 0)) || (activeTab === 'signin' && rateLimitCooldown > 0)}
  className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
>
  {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
  {rateLimitCooldown > 0
    ? t('login.errorRateLimited', { seconds: rateLimitCooldown })
    : activeTab === 'signin'
      ? t('login.signIn')
      : t('login.createAccount')
  }
</button>
```

- [ ] **Step 15: Update sign-in password hint**

Change the sign-in password minimum hint (the existing one shows "Min 6" implicitly through the validation). The sign-in form now uses 8 chars. Update the `handleEmailSignIn` validation — already done in Step 8.

- [ ] **Step 16: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add email validation, password strength, captcha, rate limiting, consent enforcement"
```

---

### Task 5: Create Email Verification Page

**Files:**
- Create: `app/login/verify/page.tsx`

- [ ] **Step 1: Write the verification page**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useI18n } from '../../../context/I18nContext';
import { motion } from 'framer-motion';
import { Mail, LoaderCircle, ArrowLeft } from 'lucide-react';
import { logError } from '../../../lib/errorLogger';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email || '');
      if (user.emailVerified) {
        router.replace('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        toast.success(t('login.emailSent'));
        setResendCooldown(60);
      }
    } catch (err) {
      logError(err, 'VerifyEmail.resend');
      toast.error(t('login.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [resendCooldown, t]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <div className="w-16 h-16 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-accent" />
        </div>

        <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100 mb-2">
          {t('login.verifyEmailTitle')}
        </h1>

        <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-8">
          {t('login.verifyEmailSubtitle', { email })}
        </p>

        <button
          onClick={handleResend}
          disabled={isLoading || resendCooldown > 0}
          className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
        >
          {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
          {resendCooldown > 0
            ? t('login.verifyEmailResendCooldown', { seconds: resendCooldown })
            : t('login.verifyEmailResend')
          }
        </button>

        <button
          onClick={() => router.push('/login')}
          className="w-full flex items-center justify-center gap-2 text-sm text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('login.verifyEmailBackToSignIn')}
        </button>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/login/verify/page.tsx
git commit -m "feat: add email verification page"
```

---

### Task 6: Wire Up Verification Redirect in Login Page

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Add verification step UI**

In the JSX, after the form closing tag and before the tab toggle section, add a conditional render for the verification step. The form section should be wrapped so that when `showVerifyStep` is true, it shows a verification message instead:

Add this inside the form panel, replacing the form's submit success flow. Actually, since `handleEmailSignUp` now sets `showVerifyStep(true)` and `pendingEmail`, we need to show a verification message. Add this right after the `<form>` element closes, before the tab toggle:

```tsx
{showVerifyStep && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-8"
  >
    <div className="w-16 h-16 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-6">
      <Mail className="w-8 h-8 text-accent" />
    </div>
    <h3 className="text-xl font-bold text-[#0a0a0a] dark:text-gray-100 mb-2">
      {t('login.verifyEmailTitle')}
    </h3>
    <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-6">
      {t('login.verifyEmailSubtitle', { email: pendingEmail })}
    </p>
    <button
      onClick={handleResendVerification}
      disabled={isLoading || resendCooldown > 0}
      className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
    >
      {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {resendCooldown > 0
        ? t('login.verifyEmailResendCooldown', { seconds: resendCooldown })
        : t('login.verifyEmailResend')
      }
    </button>
    <button
      onClick={() => handleTabChange('signin')}
      className="text-sm text-accent hover:underline"
    >
      {t('login.verifyEmailBackToSignIn')}
    </button>
  </motion.div>
)}
```

- [ ] **Step 2: Conditionally hide the form when in verify step**

Wrap the entire form element with a conditional:

```tsx
{!showVerifyStep && (
  <form
    id="panel-auth"
    role="tabpanel"
    aria-labelledby={activeTab === 'signin' ? 'tab-signin' : 'tab-signup'}
    onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp}
    className="space-y-4"
    noValidate
  >
    {/* ... existing form content ... */}
  </form>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: show verification step after sign-up in login page"
```

---

### Task 7: Run Full Verification

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
Expected: All tests pass (8 files: 7 existing + 1 new)

- [ ] **Step 4: Final commit (if any lint/build fixes needed)**

```bash
git add .
git commit -m "fix: address lint/build issues"
```

---

### Environment Variables Required

After deployment, these env vars must be set:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | Client | hCaptcha site key for widget |
| `HCAPTCHA_SECRET_KEY` | Server | hCaptcha secret for verification |

Configure hCaptcha at https://dashboard.hcaptcha.com to get these keys.
