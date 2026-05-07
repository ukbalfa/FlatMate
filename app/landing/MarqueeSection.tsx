'use client';

import React from 'react';
import { useI18n } from '../../context/I18nContext';
import NoiseOverlay from '../../components/NoiseOverlay';

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
      <NoiseOverlay opacity={0.02} />
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
