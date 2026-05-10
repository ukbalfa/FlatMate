'use client';
import { useI18n } from '../../context/I18nContext';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff } from 'lucide-react';
import { logError } from '../../lib/errorLogger';
import { toast } from 'sonner';

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string>) => void;
  }
}

export default function LoginPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
        setError(data.error || t('login.telegramAuthFailed'));
        return;
      }
      await signInWithCustomToken(auth, data.token);
    } catch (err) {
      logError(err, 'Login.telegramAuth');
      setError(t('login.telegramAuthFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
      if (code === 'auth/account-exists-with-different-credential') {
        setError(t('login.errorGoogleExists'));
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed popup — do nothing
      } else {
        logError(err, 'Login.googleSignIn');
        setError(t('login.errorGoogleFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramClick = () => {
    setIsLoading(true);
    setError('');
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      setError(t('login.telegramNotConfigured'));
      setIsLoading(false);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    document.body.appendChild(script);

    setTimeout(() => setIsLoading(false), 30000);

    const widgetCheck = setInterval(() => {
      const iframe = document.querySelector('iframe[src*="telegram.org"]');
      if (iframe && iframe.parentElement) {
        clearInterval(widgetCheck);
        iframe.parentElement.style.height = '0';
        iframe.parentElement.style.overflow = 'hidden';
      }
    }, 200);

    setTimeout(() => clearInterval(widgetCheck), 10000);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError(t('login.errorValidEmail'));
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError(t('login.errorPasswordMinLength'));
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(userCredential.user.uid, { email });
      router.push('/dashboard');
    } catch (err) {
      const code = (err as { code?: string }).code;
      let message = t('login.errorGeneric');
      switch (code) {
        case 'auth/user-not-found': message = t('login.errorNoAccount'); break;
        case 'auth/wrong-password': message = t('login.errorWrongPassword'); break;
        case 'auth/invalid-email': message = t('login.errorInvalidEmail'); break;
        case 'auth/invalid-credential': message = t('login.errorInvalidCredential'); break;
        default: message = (err as Error).message || t('login.errorGeneric');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!name.trim()) {
      setError(t('common.fillAllFields'));
      setIsLoading(false);
      return;
    }
    if (!emailRegex.test(email)) {
      setError(t('login.errorValidEmail'));
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError(t('login.passwordMinLength'));
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(userCredential.user.uid, {
        email,
        name: name.trim(),
      });
      toast.success(t('login.signUpSuccess'));
      router.push('/dashboard');
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

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const bullets = [
    t('login.bulletTrackExpenses'),
    t('login.bulletCleaningSchedules'),
    t('login.bulletExchangeRates'),
  ];

  return (
    <div className={`min-h-screen flex transition-opacity duration-500 bg-white ${pageReady ? 'opacity-100' : 'opacity-0'}`}>
      <div className="hidden lg:flex flex-col items-center justify-between w-1/2 px-16 py-12 bg-[#f9fafb] dark:bg-gray-900">
        <div></div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-left max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</h1>
          </div>
          <p className="text-lg text-[#6b7280] dark:text-gray-400 mb-8">{t('login.manageApartmentTogether')}</p>
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
        <div className="text-xs text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} FlatMate · Tashkent</div>
      </div>

      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-12 bg-white dark:bg-gray-800">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <span className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</span>
          </div>

          <div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
              <button
                onClick={() => handleTabChange('signin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signin'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100'
                }`}
              >
                {t('login.signInTab')}
              </button>
              <button
                onClick={() => handleTabChange('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'bg-[#F97316] text-white shadow-sm'
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

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-60 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {t('login.continueWithGoogle')}
            </button>

            <button
              onClick={handleTelegramClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#0088cc] hover:bg-[#0077b5] rounded-lg px-4 py-3 text-white font-medium transition disabled:opacity-60 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              {t('login.continueWithTelegram')}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-xs text-[#6b7280] dark:text-gray-400">{t('login.orSignInWithEmail')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <form onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('login.fullName')}</label>
                  <input
                    type="text"
                    placeholder={t('login.fullName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('login.emailAddress')}</label>
                <input
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.enterPassword')}
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
                {activeTab === 'signin' ? t('login.signIn') : t('login.createAccount')}
              </button>
              {error && <div className="text-red-500 dark:text-red-400 text-sm text-center mt-2">{error}</div>}
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-[#6b7280] dark:text-gray-400">
                {activeTab === 'signin' ? t('login.noAccountYet') : t('login.alreadyHaveAccount')}{' '}
                <button
                  onClick={() => handleTabChange(activeTab === 'signin' ? 'signup' : 'signin')}
                  className="text-[#F97316] hover:underline font-medium"
                >
                  {activeTab === 'signin' ? t('login.switchToSignUp') : t('login.switchToSignIn')}
                </button>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}