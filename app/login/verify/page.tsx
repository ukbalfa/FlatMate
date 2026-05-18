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
