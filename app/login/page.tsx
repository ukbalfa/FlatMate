'use client';
import { useI18n } from '../../context/I18nContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LoaderCircle, Mail, ArrowLeft } from 'lucide-react';
import { logError } from '../../lib/errorLogger';
import { toast } from 'sonner';
import { getPasswordStrength, PasswordStrengthLevel } from '../../lib/passwordStrength';
import OAuthButtons from './OAuthButtons';

declare global {
  interface Window {
    hcaptcha?: {
      getResponse: (widgetId?: number) => string;
      render: (element: Element | null, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    Telegram?: {
      Login: {
        init: (options: { client_id: string; redirect_uri?: string; request_access?: string[] }, callback: (data: { id_token?: string; user?: Record<string, string>; error?: string }) => void) => void;
        open: () => void;
      };
    };
  }
}

interface FieldErrors {
  email?: string;
  password?: string;
  name?: string;
}

export default function LoginPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthLevel>('weak');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [showVerifyStep, setShowVerifyStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const hcaptchaContainerRef = useRef<HTMLDivElement>(null);
  const hcaptchaWidgetId = useRef<number | null>(null);
  const [hcaptchaReady, setHcaptchaReady] = useState(false);
  const [hcaptchaError, setHcaptchaError] = useState('');

  async function createSession(user: import('firebase/auth').User): Promise<void> {
    const idToken = await user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        router.replace('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

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

    if (activeTab === 'signup' && !consentAccepted) {
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
        { client_id: clientId, redirect_uri: window.location.origin, request_access: ['write'] },
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
            if (auth.currentUser) {
              await createSession(auth.currentUser);
            }
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

  useEffect(() => {
    if (activeTab !== 'signup' || typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return;

    const loadHcaptcha = () => {
      if (window.hcaptcha) {
        setHcaptchaReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.onload = () => {
        if (window.hcaptcha) {
          setHcaptchaReady(true);
        } else {
          setHcaptchaError(t('login.errorCaptchaRequired'));
        }
      };
      script.onerror = () => {
        setHcaptchaError(t('login.errorCaptchaRequired'));
      };
      document.head.appendChild(script);
    };

    loadHcaptcha();
  }, [activeTab, t]);

  useEffect(() => {
    if (!hcaptchaReady || !hcaptchaContainerRef.current || !process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return;
    if (!window.hcaptcha) return;

    try {
      if (hcaptchaWidgetId.current !== null) {
        window.hcaptcha.reset(hcaptchaWidgetId.current);
        return;
      }

      hcaptchaWidgetId.current = window.hcaptcha.render(hcaptchaContainerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
        theme: 'dark',
        size: 'flexible',
      });
    } catch {
      setHcaptchaError(t('login.errorCaptchaRequired'));
    }
  }, [hcaptchaReady, activeTab, t]);

  useEffect(() => {
    if (activeTab !== 'signup') return;
    if (!hcaptchaReady || !window.hcaptcha || hcaptchaWidgetId.current === null) return;

    const timer = setTimeout(() => {
      try {
        window.hcaptcha!.reset(hcaptchaWidgetId.current!);
      } catch { /* ignore */ }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab, hcaptchaReady]);

  useEffect(() => {
    if (password.length > 0) {
      setPasswordStrength(getPasswordStrength(password).level);
    } else {
      setPasswordStrength('weak');
    }
  }, [password]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setTimeout(() => setRateLimitCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCooldown]);

  const ensureUserProfile = async (uid: string, extraData?: Record<string, unknown>) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        username: extraData?.email || uid,
        name: extraData?.name || undefined,
        role: 'roommate',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
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
      await createSession(firebaseUser);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code;
      if (code === 'auth/account-exists-with-different-credential') {
        setError(t('login.errorGoogleExists'));
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed popup — do nothing
      } else if (code === 'auth/popup-blocked') {
        setError(t('login.errorPopupBlocked'));
      } else {
        logError(err, `Login.googleSignIn:${code || 'unknown'}`);
        setError(`${t('login.errorGoogleFailed')} (${code || 'unknown'})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
      await createSession(userCredential.user);
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
      setError(t('login.errorConsentRequired'));
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
        if (hcaptchaError) {
          setError(t('login.errorCaptchaRequired'));
          setIsLoading(false);
          return;
        }
        const captchaToken = window.hcaptcha?.getResponse(hcaptchaWidgetId.current ?? undefined);
        if (!captchaToken) {
          setError(t('login.errorCaptchaRequired'));
          setIsLoading(false);
          return;
        }
        const captchaResponse = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaToken }),
        });
        const captchaData = await captchaResponse.json();
        if (!captchaData.success) {
          setError(t('login.errorCaptchaFailed'));
          setIsLoading(false);
          return;
        }
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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setFieldErrors({ email: t('login.errorValidEmail') });
      emailRef.current?.focus();
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent — check your inbox');
    } catch (err) {
      logError(err, 'Login.forgotPassword');
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    setHcaptchaError('');
    hcaptchaWidgetId.current = null;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: 'signin' | 'signup') => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleTabChange(tab === 'signin' ? 'signup' : 'signin');
    }
  };

  const inputClass = 'w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-[10px] px-3.5 text-sm text-heading placeholder:text-body-muted focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page relative overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-accent-honey to-accent-lime" />

      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.03] hidden sm:block" />

      {/* Geometric shapes */}
      <div className="absolute w-[300px] h-[300px] border border-accent/[0.06] rounded-full -top-20 -right-20 hidden sm:block" />
      <div className="absolute w-[200px] h-[200px] border border-accent-lime/[0.04] rotate-45 -bottom-10 -left-10 hidden sm:block" />

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="absolute top-6 left-6 z-10"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-body-muted hover:text-heading transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[380px] mx-4 relative z-10"
      >
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <div className="text-base font-semibold text-heading tracking-tight">FlatMate</div>
              <div className="text-[11px] text-body-muted">Shared living, simplified</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Authentication method"
            className="flex items-center gap-0.5 p-[3px] bg-white/[0.04] border border-white/[0.06] rounded-[10px] mb-6"
          >
            <button
              role="tab"
              id="tab-signin"
              aria-selected={activeTab === 'signin'}
              aria-controls="panel-auth"
              onClick={() => handleTabChange('signin')}
              onKeyDown={(e) => handleTabKeyDown(e, 'signin')}
              className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-accent to-accent-honey text-white'
                  : 'text-body-muted hover:text-body'
              }`}
            >
              {t('login.signInTab')}
            </button>
            <button
              role="tab"
              id="tab-signup"
              aria-selected={activeTab === 'signup'}
              aria-controls="panel-auth"
              onClick={() => handleTabChange('signup')}
              onKeyDown={(e) => handleTabKeyDown(e, 'signup')}
              className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-accent to-accent-honey text-white'
                  : 'text-body-muted hover:text-body'
              }`}
            >
              {t('login.createAccountTab')}
            </button>
          </div>

          {/* Heading */}
          <h2 className="text-[22px] font-semibold text-heading tracking-tight mb-1">
            {activeTab === 'signin' ? t('login.welcomeBack') : t('login.createAccountTitle')}
          </h2>
          <p className="text-[13px] text-body-muted mb-6">
            {activeTab === 'signin' ? t('login.signInToAccount') : t('login.createAccountSubtitle')}
          </p>

          {/* OAuth buttons */}
          <OAuthButtons
            onGoogleSignIn={handleGoogleSignIn}
            onTelegramClick={handleTelegramClick}
            disabled={isLoading}
          />

          {/* Email form */}
          {!showVerifyStep && (
          <form
            id="panel-auth"
            role="tabpanel"
            aria-labelledby={activeTab === 'signin' ? 'tab-signin' : 'tab-signup'}
            onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp}
            className="space-y-3"
            noValidate
          >
            {/* Name field (signup only) */}
            {activeTab === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-[13px] text-body mb-1.5">
                  {t('login.fullName')}
                </label>
                <input
                  ref={nameRef}
                  id="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} ${fieldErrors.name ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}`}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'error-name' : undefined}
                />
                {fieldErrors.name && (
                  <p id="error-name" role="alert" className="text-red-400 text-[12px] mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-[13px] text-body mb-1.5">
                {t('login.emailAddress')}
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} ${fieldErrors.email ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'error-email' : undefined}
              />
              {fieldErrors.email && (
                <p id="error-email" role="alert" className="text-red-400 text-[12px] mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-[13px] text-body mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10 ${fieldErrors.password ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'error-password' : undefined}
                  autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-body-muted hover:text-body transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="error-password" role="alert" className="text-red-400 text-[12px] mt-1">
                  {fieldErrors.password}
                </p>
              )}
              {activeTab === 'signup' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength === 'weak' ? 'bg-red-500' :
                          passwordStrength === 'fair' ? (level <= 1 ? 'bg-orange-500' : 'bg-white/[0.06]') :
                          passwordStrength === 'good' ? (level <= 2 ? 'bg-yellow-500' : 'bg-white/[0.06]') :
                          'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-body-muted">
                    {t(`login.passwordStrength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`)}
                  </p>
                </div>
              )}
              {/* Password hint (signup) / Forgot link (signin) */}
              {activeTab === 'signup' && !fieldErrors.password && (
                <p className="text-[12px] text-body-muted mt-1">
                  {t('login.passwordMinLength') || 'Min 8 characters'}
                </p>
              )}
              {activeTab === 'signin' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12px] text-accent hover:underline mt-1"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Privacy consent (signup only) */}
            {activeTab === 'signup' && (
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="privacyConsent"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/[0.08] text-accent focus:ring-accent/30"
                />
                <label htmlFor="privacyConsent" className="text-[12px] text-body leading-relaxed">
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

            {/* hCaptcha widget (signup only) */}
            {activeTab === 'signup' && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
              <div>
                <div
                  ref={hcaptchaContainerRef}
                  className="h-captcha min-h-[78px]"
                />
                {hcaptchaError && (
                  <p className="text-red-400 text-[12px] mt-2 text-center">{hcaptchaError}</p>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || (activeTab === 'signup' && (!consentAccepted || rateLimitCooldown > 0)) || (activeTab === 'signin' && rateLimitCooldown > 0)}
              className="w-full h-[42px] bg-gradient-to-r from-accent to-accent-honey text-white text-[14px] font-medium rounded-[10px] shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {rateLimitCooldown > 0
                ? t('login.errorRateLimited', { seconds: rateLimitCooldown })
                : activeTab === 'signin'
                  ? t('login.signIn')
                  : t('login.createAccount')
              }
            </button>

            {/* Global error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="text-red-400 text-[12px] text-center"
              >
                {error}
              </motion.div>
            )}
          </form>
          )}

          {/* Verification step UI */}
          {showVerifyStep && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 ring-1 ring-accent/20">
                <Mail className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-heading mb-1.5">
                {t('login.verifyEmailTitle')}
              </h3>
              <p className="text-[13px] text-body-muted mb-5">
                {t('login.verifyEmailSubtitle', { email: pendingEmail })}
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isLoading || resendCooldown > 0}
                className="w-full h-[42px] bg-gradient-to-r from-accent to-accent-honey text-white text-[14px] font-medium rounded-[10px] shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
              >
                {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {resendCooldown > 0
                  ? t('login.verifyEmailResendCooldown', { seconds: resendCooldown })
                  : t('login.verifyEmailResend')
                }
              </button>
              <button
                onClick={() => handleTabChange('signin')}
                className="text-[13px] text-accent hover:underline"
              >
                {t('login.verifyEmailBackToSignIn')}
              </button>
            </motion.div>
          )}

          {/* Footer link */}
          <div className="mt-6 text-center">
            <span className="text-[13px] text-body-muted">
              {activeTab === 'signin' ? t('login.noAccountYet') : t('login.alreadyHaveAccount')}{' '}
              <button
                onClick={() => handleTabChange(activeTab === 'signin' ? 'signup' : 'signin')}
                className="text-accent hover:underline font-medium"
              >
                {activeTab === 'signin' ? t('login.switchToSignUp') : t('login.switchToSignIn')}
              </button>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
