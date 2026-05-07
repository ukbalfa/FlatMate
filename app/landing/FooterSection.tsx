'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '../../context/I18nContext';

export default function FooterSection() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 px-6 lg:px-8 bg-heading dark:bg-dark-footer overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white font-dm-sans">{t('landing.footer.product')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-sm transition-colors hover:text-accent-honey font-dm-sans text-[#D4C4A0] dark:text-[#A89270]">
                  {t('landing.footer.dashboard')}
                </Link>
              </li>
              <li>
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm transition-colors hover:text-accent-honey font-dm-sans text-[#D4C4A0] dark:text-[#A89270]">
                  {t('landing.footer.features')}
                </button>
              </li>
              <li>
                <span className="text-sm font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
                  {t('landing.footer.pricing')}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white font-dm-sans">{t('landing.footer.resources')}</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
                  {t('landing.footer.blog')}
                </span>
              </li>
              <li>
                <span className="text-sm font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
                  {t('landing.footer.support')}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white font-dm-sans">{t('landing.footer.community')}</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
                  {t('landing.footer.telegram')}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white font-dm-sans">{t('landing.footer.about')}</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="font-bold text-base text-white font-sora">FlatMate</span>
              <span className="px-2 py-0.5 rounded-md bg-accent/20 border border-accent/30">
                <span className="font-dm-mono text-[10px] font-semibold text-accent-honey">v0.1.1</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed font-dm-sans text-[#D4C4A0] dark:text-[#A89270]">
              {t('landing.footer.tagline')}
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-dark-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-dm-mono text-[#D4C4A0] dark:text-[#A89270]">
            © {currentYear} FlatMate · Made with ❤️ in Tashkent, Uzbekistan 🇺🇿
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
              {t('landing.footer.privacy')}
            </span>
            <span className="text-xs font-dm-sans text-[#D4C4A0] dark:text-[#A89270] cursor-not-allowed opacity-60">
              {t('landing.footer.terms')}
            </span>
          </div>
        </div>
      </div>
      {/* Watermark */}
      <div className="w-full overflow-hidden leading-none pt-8 relative z-0">
        <span className="block text-[clamp(80px,17vw,220px)] font-bold tracking-tighter uppercase text-white/[0.04] whitespace-nowrap select-none pointer-events-none font-space-grotesk leading-[0.85]">
          FLATMATE
        </span>
      </div>
    </footer>
  );
}
