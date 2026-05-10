'use client';

import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { Zap } from 'lucide-react';

export function Footer() {
  const { t } = useI18n();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    company: [
      { label: 'About', href: '#' },
      { label: 'Support', href: '#' },
    ],
    legal: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  };

  return (
    <footer className="relative pt-20 pb-8 px-4 md:px-8 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-citrus flex items-center justify-center text-white font-bold text-sm">
                F
              </div>
              <span className="font-bold text-lg tracking-tight text-white">flatmate</span>
            </Link>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              Co-living without the chaos. Split bills, track chores, and keep your household
              running smoothly.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            {t('landing.footer.copyright', { year: new Date().getFullYear() }) ||
              `${new Date().getFullYear()} FlatMate. All rights reserved.`}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/20">
            <Zap className="w-3 h-3 text-[#F97316]/40" />
            Built for modern co-living
          </div>
        </div>
      </div>

      {/* Decorative brand wordmark — SVG full-bleed */}
      <div
        style={{
          width: '100vw',
          marginLeft: '50%',
          transform: 'translateX(-50%)',
          overflow: 'hidden',
          lineHeight: 0,
          paddingTop: '4rem',
          pointerEvents: 'none',
          userSelect: 'none',
          color: '#fff',
        }}
      >
        <svg
          width="100%"
          viewBox="0 0 1000 160"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <text
            x="500"
            y="140"
            textAnchor="middle"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fontFamily="'Cormorant Garamond', serif"
            fontWeight="700"
            fontSize="160"
            fill="currentColor"
            opacity="0.07"
            letterSpacing="-2"
          >
            flatmate
          </text>
        </svg>
      </div>
    </footer>
  );
}
