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
import { Eye, EyeOff, LoaderCircle, Mail } from 'lucide-react';
import { logError } from '../../lib/errorLogger';
import { toast } from 'sonner';
import { getPasswordStrength, PasswordStrengthLevel } from '../../lib/passwordStrength';
import LeftPanel from './LeftPanel';
import OAuthButtons from './OAuthButtons';

declare global {
  interface Window {
    hcaptcha?: {
      getResponse: () => string;
      render: (element: Element | null, params: Record<string, unknown>) => void;
      reset: () => void;
    };
    Telegram?: {
      Login: {
        init: (options: { client_id: string; request_access?: string[] }, callback: (data: { id_token?: string; user?: Record<string, string>; error?: string }) => void) => void;
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
        { client_id: clientId, request_access: ['write'] },
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

  useEffect(() => {
    if (activeTab !== 'signup' || typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return;
    if (window.hcaptcha) return;
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.onload = () => {
      if (window.hcaptcha) {
        window.hcaptcha.render(document.querySelector('.h-captcha'), {
          sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
          theme: 'dark',
        });
      }
    };
    document.body.appendChild(script);
  }, [activeTab]);

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
        const captchaToken = window.hcaptcha?.getResponse();
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
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: 'signin' | 'signup') => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleTabChange(tab === 'signin' ? 'signup' : 'signin');
    }
  };

  const inputClass = 'w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex bg-white"
    >
      <LeftPanel />

      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-12 bg-white dark:bg-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</span>
          </div>

          <div>
            {/* Accessible tab switcher */}
            <div
              role="tablist"
              aria-label="Authentication method"
              className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6"
            >
              <button
                role="tab"
                id="tab-signin"
                aria-selected={activeTab === 'signin'}
                aria-controls="panel-auth"
                onClick={() => handleTabChange('signin')}
                onKeyDown={(e) => handleTabKeyDown(e, 'signin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signin'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100'
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
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100'
                }`}
              >
                {t('login.createAccountTab')}
              </button>
            </div>

            <h2 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100 mb-2">
              {activeTab === 'signin' ? t('login.welcomeBack') : t('login.createAccountTitle')}
            </h2>
            <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-8">
              {activeTab === 'signin' ? t('login.signInToAccount') : t('login.createAccountSubtitle')}
            </p>

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
              {/* Name field (signup only) */}
              {activeTab === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">
                    {t('login.fullName')}
                  </label>
                  <input
                    ref={nameRef}
                    id="name"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'error-name' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="error-name" role="alert" className="text-red-500 dark:text-red-400 text-xs mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">
                  {t('login.emailAddress')}
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'error-email' : undefined}
                />
                {fieldErrors.email && (
                  <p id="error-email" role="alert" className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">
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
                    className={`${inputClass} pr-12 ${fieldErrors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'error-password' : undefined}
                    autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="error-password" role="alert" className="text-red-500 dark:text-red-400 text-xs mt-1">
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
                {/* Password hint (signup) / Forgot link (signin) */}
                {activeTab === 'signup' && !fieldErrors.password && (
                  <p className="text-xs text-[#9ca3af] dark:text-gray-500 mt-1">
                    {t('login.passwordMinLength') || 'Min 8 characters'}
                  </p>
                )}
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-accent hover:underline mt-1"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Privacy consent (signup only) */}
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

              {/* hCaptcha widget (signup only) */}
              {activeTab === 'signup' && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
                <div className="mb-4">
                  <div
                    className="h-captcha"
                    data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                  />
                </div>
              )}

              {/* Submit button */}
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

              {/* Global error */}
              {error && (
                <div role="alert" className="text-red-500 dark:text-red-400 text-sm text-center mt-2">
                  {error}
                </div>
              )}
            </form>
            )}

            {/* Verification step UI */}
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

            {/* Tab toggle */}
            <div className="mt-4 text-center">
              <span className="text-xs text-[#6b7280] dark:text-gray-400">
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
    </motion.div>
  );
}
