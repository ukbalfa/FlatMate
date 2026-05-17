'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: t('landing.nav.features') || 'Features' },
    { href: '#how-it-works', label: t('landing.hero.seeFeatures') || 'How it works' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg'
          : 'bg-transparent border border-transparent'
      }`}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full bg-gradient-citrus flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-300">
          F
        </div>
        <span className="font-bold text-lg tracking-tight text-white">
          flatmate
        </span>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="hidden md:block">
        <Link
          href="/login"
          className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] transition-shadow duration-300"
        >
          {t('landing.nav.signIn') || 'Get Started'}
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2 text-white/70 hover:text-white"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 mx-4 p-4 rounded-2xl bg-[#0A0A0A]/95 border border-white/10 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-[#F97316] to-[#FBBF24]"
              >
                {t('landing.nav.signIn') || 'Get Started'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
