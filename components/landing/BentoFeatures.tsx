'use client';

import { FeatureCard } from './FeatureCard';
import { FeatureNumber } from './FeatureNumber';
import { ChorePreview } from './ChorePreview';
import { useI18n } from '@/context/I18nContext';
import { DollarSign, Sparkles, LayoutGrid, Users } from 'lucide-react';

export function BentoFeatures() {
  const { t } = useI18n();

  const features = [
    {
      title: t('landing.feature.expenseSplitting.title'),
      desc: t('landing.feature.expenseSplitting.description'),
      icon: <DollarSign className="w-6 h-6 text-[#F97316]" />,
      className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-[#1A1108] to-[#0A0A0A] border-[#F97316]/20",
      content: <FeatureNumber number="01" />
    },
    {
      title: t('landing.feature.cleaningSchedule.title'),
      desc: t('landing.feature.cleaningSchedule.description'),
      icon: <Sparkles className="w-6 h-6 text-[#84CC16]" />,
      className: "md:col-span-1 md:row-span-2 bg-gradient-to-br from-[#0F170A] to-[#0A0A0A] border-[#84CC16]/20",
      content: <ChorePreview />
    },
    {
      title: t('landing.feature.exchangeRates.title'),
      desc: t('landing.feature.exchangeRates.description'),
      icon: <LayoutGrid className="w-6 h-6 text-[#38BDF8]" />,
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-[#08131A] to-[#0A0A0A] border-[#38BDF8]/20",
      content: null
    },
    {
      title: t('landing.feature.roommateProfiles.title'),
      desc: t('landing.feature.roommateProfiles.description'),
      icon: <Users className="w-6 h-6 text-[#A78BFA]" />,
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-[#120B1A] to-[#0A0A0A] border-[#A78BFA]/20",
      content: null
    }
  ];

  return (
    <section id="features" className="py-32 px-4 md:px-8 max-w-6xl mx-auto bg-[#0A0A0A]" aria-labelledby="features-heading" role="region">
      <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-space-grotesk font-bold text-white mb-6 tracking-tight" id="features-heading" tabIndex={0}>
          {t('landing.features.title')}
        </h2>
        <p className="text-white/90 font-dm-sans max-w-xl text-lg">
          {t('landing.features.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]" role="grid" aria-labelledby="features-heading">
        {features.map((feature, i) => (
          <FeatureCard
            key={i}
            index={i}
            title={feature.title}
            desc={feature.desc}
            icon={feature.icon}
            className={feature.className}
            content={feature.content}
          />
        ))}
      </div>
    </section>
  );
}