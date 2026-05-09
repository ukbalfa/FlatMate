'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { usePrefersReducedMotion } from '../../lib/motion';
import PrimaryButton from '../../components/ui/PrimaryButton';

const FloatingCard = ({
  children,
  className = '',
  delay = 0,
  yTransform,
  reduceMotion = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yTransform?: MotionValue<number>;
  reduceMotion?: boolean;
}) => (
  <motion.div
    style={{ y: reduceMotion ? 0 : yTransform }}
    className={`absolute z-20 hidden lg:block ${className}`}
    animate={reduceMotion ? {} : { y: [0, -10, 0] }}
    transition={reduceMotion ? {} : { duration: 4 + delay * 0.3, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    <div className="bg-white/95 dark:bg-dark-bg-card/95 backdrop-blur-sm border border-border/60 dark:border-dark-border/60 rounded-2xl p-4 shadow-lg">
      {children}
    </div>
  </motion.div>
);

export default function HeroSection() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const reduceMotion = usePrefersReducedMotion();

  const y1 = useTransform(scrollY, [0, 600], [0, 100]);
  const y2 = useTransform(scrollY, [0, 600], [0, -60]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-bg-page dark:from-dark-bg-page via-bg-section dark:via-dark-bg-section to-bg-gradient-end dark:to-dark-bg-card" />
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.1] bg-dot-grid" />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent-honey/5 translate-y-1/3 -translate-x-1/3" />

      <FloatingCard className="top-[20%] left-[6%]" delay={0} yTransform={y1} reduceMotion={reduceMotion}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <div className="text-xs font-dm-sans text-muted">{t('landing.hero.rentDue')}</div>
            <div className="text-base font-bold gradient-citrus-text font-sora">250,000 UZS</div>
          </div>
          <span className="ml-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full font-sora bg-accent-lime">
            {t('landing.hero.paid')}
          </span>
        </div>
      </FloatingCard>

      <FloatingCard className="top-[28%] right-[8%]" delay={0.5} yTransform={y2} reduceMotion={reduceMotion}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-lime/20 to-accent/20 flex items-center justify-center">
            <span className="text-lg">🧹</span>
          </div>
          <div>
            <div className="text-xs font-dm-sans text-muted">{t('landing.hero.kitchenMonday')}</div>
            <div className="text-sm font-bold text-heading dark:text-dark-heading font-sora">
              {t('landing.hero.jasursTurn')}
            </div>
          </div>
        </div>
      </FloatingCard>

      <div className="relative z-30 w-full max-w-5xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-dark-bg-card/80 border border-border/60 dark:border-dark-border/60 rounded-full px-4 py-1.5 mb-8">
              <span className={`w-2 h-2 rounded-full bg-accent${reduceMotion ? ' block' : ' animate-pulse'}`} />
              <span className="font-sora font-bold text-xs text-accent-dark">{t('landing.badge')}</span>
            </div>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6 text-4xl sm:text-5xl lg:text-6xl text-heading dark:text-dark-heading font-sora font-extrabold tracking-tight leading-tight"
          >
            {t('landing.hero.titlePart1')}
            <br />
            <span className="gradient-citrus-text">{t('landing.hero.titlePart2')}</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-10 text-lg text-body-light dark:text-dark-body font-dm-sans leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <PrimaryButton href="/signup">
              {t('landing.hero.getStarted')}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </PrimaryButton>
            <button
              onClick={scrollToFeatures}
              className="bg-white dark:bg-dark-bg-card border border-border dark:border-dark-border text-heading dark:text-dark-heading px-6 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 hover:border-accent dark:hover:border-accent transition-all font-dm-sans"
            >
              {t('landing.hero.seeFeatures')}
              <ChevronDown className={`w-4 h-4${reduceMotion ? ' hidden' : ' animate-bounce'}`} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 text-xs font-dm-mono text-muted"
          >
            {t('landing.hero.location')}
          </motion.div>
        </div>
      </div>
    </section>
  );
}