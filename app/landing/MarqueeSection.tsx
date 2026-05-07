'use client';

import React from 'react';
import { useI18n } from '../../context/I18nContext';

export default function MarqueeSection() {
  const { t } = useI18n();

  const items = [
    t('landing.marquee.sharedExpenses'),
    t('landing.marquee.cleaningSchedules'),
    t('landing.marquee.liveExchangeRates'),
    t('landing.marquee.taskManager'),
    t('landing.marquee.realtimeSync'),
    t('landing.marquee.roommateProfiles'),
  ];

  const content = items.map((item, i) => (
    <span key={`${item}-${i}`} className="inline-flex items-center gap-2 mx-4">
      <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
      <span>{item}</span>
    </span>
  ));

  return (
    <section className="relative py-3 bg-bg-section dark:bg-dark-bg-section border-y border-border dark:border-dark-border overflow-hidden">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="animate-marquee flex whitespace-nowrap">
        <span className="font-sora font-bold text-sm text-accent-dark dark:text-accent-honey">
          {content}
        </span>
        <span className="font-sora font-bold text-sm text-accent-dark dark:text-accent-honey">
          {content}
        </span>
      </div>
    </section>
  );
}
