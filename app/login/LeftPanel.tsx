'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function LeftPanel() {
  const { t } = useI18n();

  const bullets = [
    t('login.bulletTrackExpenses'),
    t('login.bulletCleaningSchedules'),
    t('login.bulletExchangeRates'),
  ];

  return (
    <div className="hidden lg:flex flex-col items-center justify-between w-1/2 px-16 py-12 bg-[#f9fafb] dark:bg-gray-900">
      <div></div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-left max-w-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full bg-[#F97316]" />
          <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</h1>
        </div>
        <p className="text-lg text-[#6b7280] dark:text-gray-400 mb-8">
          {t('login.manageApartmentTogether')}
        </p>

        {/* Value props */}
        <div className="space-y-3 mb-8">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#F97316]/10 dark:bg-[#F97316]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-[#F97316]" />
              </div>
              <span className="text-sm text-[#6b7280] dark:text-gray-400">{b}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex -space-x-2">
            {['S', 'J', 'E', 'M'].map((initial, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-[#F97316]/10 flex items-center justify-center text-[9px] font-bold text-[#F97316]"
                style={{ zIndex: 4 - i }}
              >
                {initial}
              </div>
            ))}
          </div>
          <div className="text-xs text-[#6b7280] dark:text-gray-400">
            <span className="text-[#0a0a0a] dark:text-gray-200 font-semibold">5,000+</span> roommates using FlatMate
          </div>
        </div>
      </motion.div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        &copy; {new Date().getFullYear()} FlatMate &middot; Tashkent
      </div>
    </div>
  );
}
