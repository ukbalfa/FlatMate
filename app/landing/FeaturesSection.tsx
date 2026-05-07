'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DollarSign, Receipt, Sparkles, TrendingUp, CheckSquare, Users } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import NoiseOverlay from '../../components/NoiseOverlay';

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
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="group relative bg-bg-card dark:bg-dark-bg-card border border-border dark:border-dark-border rounded-3xl p-7 hover:border-accent/50 dark:hover:border-accent/40 hover:shadow-glow transition-all duration-300 cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 3 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center shadow-lg">
          <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>
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

  return (
    <section id="features" className="relative py-24 px-6 lg:px-8 bg-bg-page dark:bg-dark-bg-page">
      <NoiseOverlay opacity={0.015} />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-sora font-bold text-xs text-accent tracking-[0.1em] uppercase">
            {t('landing.features.sectionLabel')}
          </span>
          <h2 className="text-4xl sm:text-5xl mt-4 mb-4 text-heading dark:text-dark-heading font-sora font-extrabold">
            {t('landing.features.title')}
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-accent to-accent-honey rounded-full mx-auto mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.titleKey} feature={feature} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
