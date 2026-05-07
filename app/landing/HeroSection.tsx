'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const FloatingCard = ({
  children,
  className = '',
  delay = 0,
  yTransform,
  opacityTransform,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yTransform?: MotionValue<number>;
  opacityTransform?: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{ y: yTransform, opacity: opacityTransform }}
      className={`absolute z-20 hidden lg:block ${className}`}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 3 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white dark:bg-dark-bg-card border border-border dark:border-dark-border rounded-2xl p-4 shadow-lg backdrop-blur-sm/50"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default function HeroSection() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      {/* Background with gradient and patterns */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-bg-page dark:from-dark-bg-page via-bg-section dark:via-dark-bg-section to-bg-gradient-end dark:to-dark-bg-card" />
      {/* Dot grid pattern */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.15] bg-dot-grid" />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative blobs */}
      <div className="citrus-blob w-[400px] h-[400px] bg-accent opacity-15 blur-[80px] top-[-100px] right-[5%]" />
      <div className="citrus-blob w-[300px] h-[300px] bg-accent-honey opacity-20 blur-[60px] bottom-[5%] left-[10%]" />

      {/* Floating UI Elements */}
      <FloatingCard className="top-[22%] left-[8%]" delay={0} yTransform={y1} opacityTransform={opacity}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent-honey/20 flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <div className="text-xs font-dm-sans text-muted">{t('landing.hero.rentDue')}</div>
            <div className="text-base font-bold gradient-citrus-text font-sora">250,000 UZS</div>
          </div>
          <span className="ml-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full font-sora bg-accent-lime">
            {t('landing.hero.paid')}
          </span>
        </div>
      </FloatingCard>

      <FloatingCard className="top-[28%] right-[10%]" delay={0.5} yTransform={y2} opacityTransform={opacity}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent-honey/20 flex items-center justify-center">
            <span className="text-lg">🧹</span>
          </div>
          <div>
            <div className="text-xs font-dm-sans text-muted">{t('landing.hero.kitchenMonday')}</div>
            <div className="text-base font-bold text-heading dark:text-dark-heading font-sora">
              {t('landing.hero.jasursTurn')}
            </div>
          </div>
          <span className="ml-2 relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
          </span>
        </div>
      </FloatingCard>

      <FloatingCard className="bottom-[25%] left-[12%]" delay={1} yTransform={y1} opacityTransform={opacity}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent-honey/20 flex items-center justify-center">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <div className="text-xs font-dm-sans text-muted">{t('landing.hero.usdUzs')}</div>
            <div className="text-base font-bold gradient-citrus-text font-sora">12,850</div>
          </div>
          <span className="ml-2 text-[10px] font-bold gradient-lime-text px-2 py-0.5 rounded-full font-sora">
            {t('landing.hero.plusPercent')}
          </span>
        </div>
      </FloatingCard>

      {/* Hero Content */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 bg-bg-section dark:bg-dark-bg-section border border-border dark:border-dark-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-sora font-bold text-xs text-accent-dark">{t('landing.badge')}</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl sm:text-6xl lg:text-7xl mb-6 leading-[1.1] text-heading dark:text-dark-heading font-sora font-extrabold tracking-tight"
        >
          {t('landing.hero.titlePart1')}
          <br />
          <span className="gradient-citrus-text">{t('landing.hero.titlePart2')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-dm-sans text-body dark:text-dark-body"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/login"
            className="group gradient-citrus text-white px-8 py-4 text-base font-bold rounded-2xl flex items-center gap-2 hover:shadow-[0_0_32px_rgba(249,115,22,0.25)] hover:scale-105 transition-all font-sora"
          >
            {t('landing.hero.getStarted')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={scrollToFeatures}
            className="bg-white dark:bg-dark-bg-card border border-border dark:border-dark-border text-heading dark:text-dark-heading px-8 py-4 text-base font-semibold rounded-2xl flex items-center gap-2 hover:border-accent dark:hover:border-accent transition-all font-dm-sans"
          >
            {t('landing.hero.seeFeatures')}
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-xs font-dm-mono text-muted"
        >
          {t('landing.hero.location')}
        </motion.div>
      </div>
    </section>
  );
}
