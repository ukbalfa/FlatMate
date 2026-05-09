'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DollarSign, Receipt, Sparkles, TrendingUp, CheckSquare, Users } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const FEATURES = [
  { icon: DollarSign, titleKey: 'landing.feature.rentTracking.title', descriptionKey: 'landing.feature.rentTracking.description' },
  { icon: Receipt, titleKey: 'landing.feature.expenseSplitting.title', descriptionKey: 'landing.feature.expenseSplitting.description' },
  { icon: Sparkles, titleKey: 'landing.feature.cleaningSchedule.title', descriptionKey: 'landing.feature.cleaningSchedule.description' },
  { icon: TrendingUp, titleKey: 'landing.feature.exchangeRates.title', descriptionKey: 'landing.feature.exchangeRates.description' },
  { icon: CheckSquare, titleKey: 'landing.feature.taskManager.title', descriptionKey: 'landing.feature.taskManager.description' },
  { icon: Users, titleKey: 'landing.feature.roommateProfiles.title', descriptionKey: 'landing.feature.roommateProfiles.description' },
];

function FeatureCard({ feature, index, t }: { feature: typeof FEATURES[0]; index: number; t: (key: string) => string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-dark-bg-card border border-border/50 dark:border-dark-border/50 rounded-2xl p-6 hover:border-accent/30 dark:hover:border-accent/20 hover:shadow-lg transition-all duration-300"
    >
      <div className="mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
          <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-heading dark:text-dark-heading mb-2 font-sora">
        {t(feature.titleKey)}
      </h3>
      <p className="text-sm text-body-light dark:text-dark-body leading-relaxed font-dm-sans">
        {t(feature.descriptionKey)}
      </p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-20 px-6 lg:px-8 bg-bg-page dark:bg-dark-bg-page">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="font-sora font-bold text-xs text-accent tracking-[0.15em] uppercase">
            {t('landing.features.sectionLabel')}
          </span>
          <h2 className="text-3xl sm:text-4xl mt-4 mb-4 text-heading dark:text-dark-heading font-sora font-extrabold">
            {t('landing.features.title')}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-accent to-accent-honey rounded-full mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.titleKey} feature={feature} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}