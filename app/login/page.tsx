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
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LoaderCircle, Mail, ArrowLeft } from 'lucide-react';
import { logError } from '../../lib/errorLogger';
import { toast } from 'sonner';
import { getPasswordStrength, PasswordStrengthLevel } from '../../lib/passwordStrength';
import OAuthButtons from './OAuthButtons';
import LeftPanel from './LeftPanel';

declare global {
  interface Window {
    hcaptcha?: {
      getResponse: (widgetId?: number) => string;
      render: (element: Element | null, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    Telegram?: {
      Login: {
        init: (
          options: {
            client_id: string;
            request_access?: string[];
            lang?: string;
            nonce?: string;
          },
          callback: (data: {
            id_token?: string;
            user?: { id: number; name?: string; preferred_username?: string; picture?: string };
            error?: string;
          }) => void,
        ) => void;
        open: () => void;
      };
    };
  }
}

interface FieldErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export default function LoginPage() {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
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
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || 'Session creation failed');
    }
  }

  async function verifyCaptcha(): Promise<boolean> {
    if (activeTab !== 'signup' || !process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
      return true;
    }
    const captchaToken = window.hcaptcha?.getResponse(hcaptchaWidgetId.current ?? undefined);
    if (!captchaToken) {
      setError(t('login.errorCaptchaRequired'));
      return false;
    }
    const captchaResponse = await fetch('/api/auth/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken }),
    });
    const captchaData = await captchaResponse.json();
    if (!captchaData.success) {
      setError(t('login.errorCaptchaFailed'));
      resetHcaptchaWidget();
      return false;
    }
    return true;
  }

  function resetHcaptchaWidget() {
    if (window.hcaptcha && hcaptchaWidgetId.current !== null) {
      try {
        window.hcaptcha.reset(hcaptchaWidgetId.current);
      } catch { /* ignore */ }
    }
    setHcaptchaError('');
    const token = window.hcaptcha?.getResponse(hcaptchaWidgetId.current ?? undefined);
    if (token) {
      try {
        window.hcaptcha?.reset(hcaptchaWidgetId.current ?? undefined);
      } catch { /* ignore */ }
    }
  }

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

  // Pre-load Telegram SDK script on mount (no init — that happens on click)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID) return;
    if (typeof window === 'undefined') return;
    loadTelegramSDK().catch(() => { /* silent — will retry on click */ });
  }, []);

  const handleTelegramClick = () => {
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

    // Synchronous captcha check — must not await or gesture context is lost
    if (activeTab === 'signup' && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
      const captchaToken = window.hcaptcha?.getResponse(hcaptchaWidgetId.current ?? undefined);
      if (!captchaToken) {
        setError(t('login.errorCaptchaRequired'));
        return;
      }
    }

    const nonce = crypto.randomUUID();
    try {
      sessionStorage.setItem('telegram_nonce', nonce);
    } catch { /* sessionStorage may be unavailable */ }

    setIsLoading(true);
    setError('');

    // If SDK not yet loaded, load it now then init+open
    if (!window.Telegram?.Login) {
      loadTelegramSDK()
        .then(() => {
          if (!window.Telegram?.Login) {
            setError(t('login.telegramSdkFailed'));
            setIsLoading(false);
            return;
          }
          initAndOpenTelegram(clientId, nonce);
        })
        .catch((err: unknown) => {
          logError(err, 'Login.telegramLoad');
          setError(t('login.telegramSdkFailed'));
          setIsLoading(false);
        });
      return;
    }

    // SDK already loaded — init and open synchronously (preserves user gesture)
    initAndOpenTelegram(clientId, nonce);
  };

  const initAndOpenTelegram = (clientId: string, nonce?: string) => {
    const savedNonce = nonce || (() => {
      try { return sessionStorage.getItem('telegram_nonce'); } catch { return null; }
    })();

    window.Telegram!.Login.init(
      {
        client_id: clientId,
        request_access: ['write'],
        lang: language,
        ...(savedNonce ? { nonce: savedNonce } : {}),
      },
      async (data) => {
        try { sessionStorage.removeItem('telegram_nonce'); } catch { /* ignore */ }

        if (data.error) {
          if (data.error === 'USER_CANCELLED') {
            setIsLoading(false);
            return;
          }
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
          return;
        }

        if (!data.id_token) {
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
          return;
        }

        // Server-verify captcha after Telegram auth succeeds
        if (activeTab === 'signup' && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
          const captchaToken = window.hcaptcha?.getResponse(hcaptchaWidgetId.current ?? undefined);
          if (!captchaToken) {
            setError(t('login.errorCaptchaRequired'));
            resetHcaptchaWidget();
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
            resetHcaptchaWidget();
            setIsLoading(false);
            return;
          }
        }

        try {
          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_token: data.id_token,
              ...(savedNonce ? { nonce: savedNonce } : {}),
            }),
          });
          const result = await res.json();
          if (!res.ok) {
            setError(result.error || t('login.telegramAuthFailed'));
            setIsLoading(false);
            return;
          }
          await signInWithCustomToken(auth, result.token);
          try {
            if (auth.currentUser) {
              await createSession(auth.currentUser);
            }
            clearRateLimit();
            router.push('/dashboard');
          } catch (sessionErr) {
            logError(sessionErr, 'Login.telegramCreateSession');
            setError(t('login.errorGeneric'));
            setIsLoading(false);
          } finally {
            setIsLoading(false);
          }
        } catch (err) {
          recordFailedAttempt();
          logError(err, 'Login.telegramAuth');
          setError(t('login.telegramAuthFailed'));
          setIsLoading(false);
        }
      },
    );

    window.Telegram!.Login.open();
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
    if (activeTab === 'signup' && !consentAccepted) {
      setError(t('login.errorConsentRequired'));
      return;
    }

    if (!(await verifyCaptcha())) {
      return;
    }

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
      try {
        await createSession(firebaseUser);
        router.push('/dashboard');
      } catch (sessionErr) {
        await signOut(auth);
        setError((sessionErr as Error).message || t('login.errorGeneric'));
      }
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
        await signOut(auth);
        setError(t('login.errorEmailNotVerified'));
        recordFailedAttempt();
        return;
      }
      await ensureUserProfile(userCredential.user.uid, {
        email,
        name: userCredential.user.displayName || undefined,
      });
      try {
        await createSession(userCredential.user);
        clearRateLimit();
        router.push('/dashboard');
      } catch (sessionErr) {
        await signOut(auth);
        setError((sessionErr as Error).message || t('login.errorGeneric'));
      }
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
    if (!firstName.trim()) {
      errors.firstName = t('common.fillAllFields');
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
      await signOut(auth);
      await ensureUserProfile(userCredential.user.uid, {
        email,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      toast.success(t('login.signUpSuccess'));
      setPendingEmail(email);
      setShowVerifyStep(true);
    } catch (err) {
      resetHcaptchaWidget();
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
    setFirstName('');
    setLastName('');
    setConsentAccepted(false);
    setPasswordStrength('weak');
    setShowVerifyStep(false);
    setPendingEmail('');
    setHcaptchaError('');
    if (window.hcaptcha && hcaptchaWidgetId.current !== null) {
      try {
        window.hcaptcha.reset(hcaptchaWidgetId.current);
      } catch { /* ignore */ }
    }
    hcaptchaWidgetId.current = null;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: 'signin' | 'signup') => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleTabChange(tab === 'signin' ? 'signup' : 'signin');
    }
  };

  const inputClass = 'w-full h-12 bg-[#18181b] border border-[#27272a] rounded-[10px] px-4 text-sm text-white placeholder:text-[#71717a] focus:ring-2 focus:ring-white/20 focus:border-white/40 outline-none transition-all';

  return (
    <div className="min-h-screen flex bg-[#000000] relative overflow-hidden">
      {/* Left Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative">
        <LeftPanel activeTab={activeTab} />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <div className="text-base font-semibold text-white tracking-tight">FlatMate</div>
              <div className="text-[11px] text-zinc-500">Shared living, simplified</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Authentication method"
            className="flex items-center gap-0.5 p-[3px] bg-[#18181b] border border-[#27272a] rounded-[10px] mb-8"
          >
            <button
              role="tab"
              id="tab-signin"
              aria-selected={activeTab === 'signin'}
              aria-controls="panel-auth"
              onClick={() => handleTabChange('signin')}
              onKeyDown={(e) => handleTabKeyDown(e, 'signin')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'signin'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
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
              className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t('login.createAccountTab')}
            </button>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">
            {activeTab === 'signin' ? t('login.welcomeBack') : t('login.createAccountTitle')}
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
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
            className="space-y-4"
            noValidate
          >
            {/* Name fields (signup only) */}
            {activeTab === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-[13px] text-zinc-400 mb-1.5">
                    First Name
                  </label>
                  <input
                    ref={firstNameRef}
                    id="firstName"
                    type="text"
                    placeholder="eg. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${inputClass} ${fieldErrors.firstName ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}`}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? 'error-firstname' : undefined}
                  />
                  {fieldErrors.firstName && (
                    <p id="error-firstname" role="alert" className="text-red-400 text-[12px] mt-1">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-[13px] text-zinc-400 mb-1.5">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="eg. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-[13px] text-zinc-400 mb-1.5">
                Email
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
              <label htmlFor="password" className="block text-[13px] text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12 ${fieldErrors.password ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'error-password' : undefined}
                  autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
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
                          passwordStrength === 'weak' ? (level <= 1 ? 'bg-red-500' : 'bg-[#27272a]') :
                          passwordStrength === 'fair' ? (level <= 1 ? 'bg-orange-500' : 'bg-[#27272a]') :
                          passwordStrength === 'good' ? (level <= 2 ? 'bg-yellow-500' : 'bg-[#27272a]') :
                          'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {t(`login.passwordStrength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`)}
                  </p>
                </div>
              )}
              {activeTab === 'signup' && !fieldErrors.password && (
                <p className="text-[12px] text-zinc-500 mt-1">
                  {t('login.passwordMinLength') || 'Min 8 characters'}
                </p>
              )}
              {activeTab === 'signin' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12px] text-white hover:underline mt-1"
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
                  className="mt-0.5 w-4 h-4 rounded border-[#27272a] bg-[#18181b] text-white focus:ring-white/20"
                />
                <label htmlFor="privacyConsent" className="text-[12px] text-zinc-400 leading-relaxed">
                  {t('login.privacyConsent')}{' '}
                  <Link href="/privacy" className="text-white hover:underline">
                    {t('login.privacyPolicy')}
                  </Link>
                  {' '}{t('login.and')}{' '}
                  <Link href="/terms" className="text-white hover:underline">
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
                  className="min-h-[78px]"
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
              className="w-full h-[44px] bg-white text-black text-[14px] font-semibold rounded-[10px] shadow-[0_4px_16px_rgba(255,255,255,0.1)] disabled:opacity-60 flex items-center justify-center gap-2 mt-6 hover:bg-white/90 active:scale-[0.98] transition-all"
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
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 ring-1 ring-white/10">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">
                {t('login.verifyEmailTitle')}
              </h3>
              <p className="text-[13px] text-zinc-500 mb-5">
                {t('login.verifyEmailSubtitle', { email: pendingEmail })}
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isLoading || resendCooldown > 0}
                className="w-full h-[44px] bg-white text-black text-[14px] font-semibold rounded-[10px] shadow-[0_4px_16px_rgba(255,255,255,0.1)] disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
              >
                {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {resendCooldown > 0
                  ? t('login.verifyEmailResendCooldown', { seconds: resendCooldown })
                  : t('login.verifyEmailResend')
                }
              </button>
              <button
                onClick={() => handleTabChange('signin')}
                className="text-[13px] text-white hover:underline"
              >
                {t('login.verifyEmailBackToSignIn')}
              </button>
            </motion.div>
          )}

          {/* Footer link */}
          <div className="mt-8 text-center">
            <span className="text-[13px] text-zinc-500">
              {activeTab === 'signin' ? t('login.noAccountYet') : t('login.alreadyHaveAccount')}{' '}
              <button
                onClick={() => handleTabChange(activeTab === 'signin' ? 'signup' : 'signin')}
                className="text-white hover:underline font-medium"
              >
                {activeTab === 'signin' ? t('login.switchToSignUp') : t('login.switchToSignIn')}
              </button>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
