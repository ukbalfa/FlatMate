'use client';
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logError } from '../../lib/errorLogger';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Spinner } from './Spinner';

interface RentSettings {
  rentDueDay: number;
  rentPaidThisMonth: boolean;
  lastPaidMonth: string;
}

export default function RentCountdown() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<RentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!userProfile?.flatId) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'settings', userProfile.flatId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as RentSettings;
        setSettings({
          rentDueDay: data.rentDueDay ?? 1,
          rentPaidThisMonth: data.rentPaidThisMonth ?? false,
          lastPaidMonth: data.lastPaidMonth ?? '',
        });
      } else {
        setSettings({
          rentDueDay: 1,
          rentPaidThisMonth: false,
          lastPaidMonth: '',
        });
      }
    } catch (error) {
      logError(error, 'RentCountdown.loadSettings');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.flatId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const resetIfNewMonth = useCallback(async () => {
    if (!userProfile?.flatId || !settings) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (settings.lastPaidMonth !== currentMonthKey && settings.rentPaidThisMonth) {
      try {
        const docRef = doc(db, 'settings', userProfile.flatId);
        await updateDoc(docRef, {
          rentPaidThisMonth: false,
          lastPaidMonth: currentMonthKey,
        });
        setSettings((prev) =>
          prev
            ? { ...prev, rentPaidThisMonth: false, lastPaidMonth: currentMonthKey }
            : null
        );
      } catch (error) {
        logError(error, 'RentCountdown.reset');
      }
    }
  }, [userProfile?.flatId, settings]);

  useEffect(() => {
    resetIfNewMonth();
  }, [resetIfNewMonth]);

  const markAsPaid = async () => {
    if (!userProfile?.flatId || userProfile.role !== 'admin') return;
    setMarkingPaid(true);
    try {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const docRef = doc(db, 'settings', userProfile.flatId);
      await updateDoc(docRef, {
        rentPaidThisMonth: true,
        lastPaidMonth: currentMonthKey,
      });
      setSettings((prev) =>
        prev ? { ...prev, rentPaidThisMonth: true, lastPaidMonth: currentMonthKey } : null
      );
      toast.success(t('rent.toast.markedPaid'));
    } catch (error) {
      logError(error, 'RentCountdown.markAsPaid');
      toast.error(t('rent.toast.markPaidFailed'));
    } finally {
      setMarkingPaid(false);
    }
  };

  const getDaysUntilDue = (): number => {
    if (!settings) return 0;
    const now = new Date();
    const today = now.getDate();
    const dueDay = settings.rentDueDay;

    if (today < dueDay) {
      return dueDay - today;
    } else if (today === dueDay) {
      return 0;
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      return Math.ceil(
        (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  };

  if (!userProfile?.flatId) {
    return null;
  }

  if (loading || !settings) {
    return (
      <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-[#FFF0CC] dark:bg-[#3D2E00] rounded w-1/3 mb-3" />
          <div className="h-8 bg-[#FFF0CC] dark:bg-[#3D2E00] rounded w-1/2 mb-2" />
          <div className="h-4 bg-[#FFF0CC] dark:bg-[#3D2E00] rounded w-2/3" />
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntilDue();
  const isPaid = settings.rentPaidThisMonth;
  const isDueToday = daysUntil === 0 && !isPaid;
  const isAdmin = userProfile.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 border ${
        isPaid
          ? 'bg-green-900/20 border-green-500/30'
          : isDueToday
          ? 'bg-amber-900/20 border-amber-500/30'
          : 'bg-white dark:bg-[#2A1E00] border-[#F0D89A] dark:border-[#3D2E00]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar
            className={`w-5 h-5 ${
              isPaid ? 'text-green-400' : isDueToday ? 'text-amber-400' : 'text-[#F97316]'
            }`}
          />
          <h2 className="text-lg font-semibold text-[#1C1400] dark:text-[#FFF5DC]">{t('rent.title')}</h2>
        </div>
        {isAdmin && !isPaid && (
          <button
            onClick={markAsPaid}
            disabled={markingPaid}
            className="flex items-center gap-2 bg-green-600 text-white text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-green-500 transition-colors disabled:opacity-60"
          >
            {markingPaid ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {t('rent.markAsPaid')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isPaid ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{t('rent.status.paid')}</p>
              <p className="text-sm text-[#9A7C4A] dark:text-gray-400">
                {t('rent.status.paidOn')} {settings.lastPaidMonth}
              </p>
            </div>
          </div>
        ) : isDueToday ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{t('rent.status.dueToday')}</p>
              <p className="text-sm text-[#9A7C4A] dark:text-gray-400">
                {t('rent.dueDay')} {settings.rentDueDay}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F97316]/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#F97316]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1C1400] dark:text-[#FFF5DC]">
                {daysUntil} {daysUntil === 1 ? t('rent.day') : t('rent.days')}
              </p>
              <p className="text-sm text-[#9A7C4A] dark:text-gray-400">
                {t('rent.status.untilRent')} {settings.rentDueDay}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
