'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen flex items-center justify-center bg-bg-page relative overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-accent-honey to-accent-lime" />

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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[380px] mx-4 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <div className="text-base font-semibold text-heading tracking-tight">FlatMate</div>
              <div className="text-[11px] text-body-muted">Shared living, simplified</div>
            </div>
          </div>

          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 ring-1 ring-accent/20">
            <Mail className="w-7 h-7 text-accent" />
          </div>

          <h1 className="text-lg font-semibold text-heading mb-1.5">
            {t('login.verifyEmailTitle')}
          </h1>

          <p className="text-[13px] text-body-muted mb-6">
            {t('login.verifyEmailSubtitle', { email })}
          </p>

          <button
            onClick={handleResend}
            disabled={isLoading || resendCooldown > 0}
            className="w-full h-[42px] bg-gradient-to-r from-accent to-accent-honey text-white text-[14px] font-medium rounded-[10px] shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
          >
            {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {resendCooldown > 0
              ? t('login.verifyEmailResendCooldown', { seconds: resendCooldown })
              : t('login.verifyEmailResend')
            }
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-[13px] text-body-muted hover:text-heading transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('login.verifyEmailBackToSignIn')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
