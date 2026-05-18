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
    <div className="hidden lg:flex fixed inset-0 pointer-events-none overflow-hidden">
      {/* Animated blob 1 */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated blob 2 */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-accent-honey/15 blur-3xl"
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 60, -30, 0],
          scale: [1, 1.1, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated blob 3 */}
      <motion.div
        className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full bg-accent-lime/10 blur-3xl"
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid opacity-30" />

      {/* Branding content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-accent animate-pulse-orange" />
            <h1 className="text-3xl font-bold gradient-citrus-text">FlatMate</h1>
          </div>

          {/* Tagline */}
          <p className="text-xl text-heading/70 mb-10 leading-relaxed">
            {t('login.manageApartmentTogether')}
          </p>

          {/* Value props */}
          <div className="space-y-4 mb-10">
            {bullets.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-accent/20">
                  <Check className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-base text-body leading-relaxed">{b}</span>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border backdrop-blur-sm"
          >
            <div className="flex -space-x-2.5">
              {['S', 'J', 'E', 'M'].map((initial, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-bg-page bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent ring-1 ring-accent/20"
                  style={{ zIndex: 4 - i }}
                >
                  {initial}
                </div>
              ))}
            </div>
            <div className="text-sm text-body">
              <span className="text-heading font-semibold">5,000+</span> roommates using FlatMate
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
