'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import HeroSection from './landing/HeroSection';
import MarqueeSection from './landing/MarqueeSection';
import FeaturesSection from './landing/FeaturesSection';
import TestimonialsSection from './landing/TestimonialsSection';
import FooterSection from './landing/FooterSection';
import SectionDivider from './landing/SectionDivider';

export default function LandingPage() {
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg-page dark:bg-dark-bg-page text-heading dark:text-dark-heading overflow-x-hidden" role="main">
      {/* Skip to content for accessibility */}
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Skip to features
      </a>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-bg-page/85 dark:bg-dark-bg-page/85 backdrop-blur-md border-b border-border dark:border-dark-border"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="font-sora font-bold text-lg text-heading dark:text-dark-heading">
                🏠 FlatMate
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-accent/10 to-accent-honey/10 border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                <span className="font-dm-mono text-[10px] font-semibold text-accent-dark">
                  v0.1.1
                </span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={scrollToFeatures}
                className="text-sm transition-colors hidden sm:block font-dm-sans text-muted hover:text-accent"
              >
                {t('landing.nav.features')}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-bg-section/60 dark:bg-dark-bg-section/80 border border-border dark:border-dark-border"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? (
                    <Moon className="w-4 h-4 text-accent-honey" />
                  ) : (
                    <Sun className="w-4 h-4 text-accent" />
                  )}
                </motion.div>
              </button>

              <Link
                href="/login"
                className="gradient-citrus text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] font-sora"
              >
                {t('landing.nav.signIn')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Page Sections */}
      <HeroSection />
      <MarqueeSection />
      <SectionDivider />
      <FeaturesSection />
      <TestimonialsSection />
      <FooterSection />
    </div>
  );
}
