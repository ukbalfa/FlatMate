'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { DollarSign, CalendarSync, ArrowRightLeft, Users, BarChart3, Bell } from 'lucide-react';
import { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  gradient: string;
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all duration-300"
    >
      {/* Gradient glow on hover */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${feature.gradient}`}
      />
      <div className="relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color} border ${feature.borderColor}`}
        >
          {feature.icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const { t } = useI18n();

  const features: Feature[] = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: t('landing.feature.expenseSplitting.title') || 'Expense Splitting',
      description:
        t('landing.feature.expenseSplitting.description') ||
        'Split any expense with any group size. Automatic calculations and fair distribution.',
      color: 'bg-[#F97316]/10 text-[#F97316]',
      borderColor: 'border-[#F97316]/20',
      gradient: 'bg-gradient-to-br from-[#F97316]/[0.03] to-transparent',
    },
    {
      icon: <CalendarSync className="w-5 h-5" />,
      title: t('landing.feature.cleaningSchedule.title') || 'Cleaning Schedule',
      description:
        t('landing.feature.cleaningSchedule.description') ||
        'Automated chore rotation. Never fight over who cleans the bathroom again.',
      color: 'bg-[#84CC16]/10 text-[#84CC16]',
      borderColor: 'border-[#84CC16]/20',
      gradient: 'bg-gradient-to-br from-[#84CC16]/[0.03] to-transparent',
    },
    {
      icon: <ArrowRightLeft className="w-5 h-5" />,
      title: t('landing.feature.exchangeRates.title') || 'Live Exchange Rates',
      description:
        t('landing.feature.exchangeRates.description') ||
        'Real-time currency conversion. Split expenses in any currency, automatically.',
      color: 'bg-[#38BDF8]/10 text-[#38BDF8]',
      borderColor: 'border-[#38BDF8]/20',
      gradient: 'bg-gradient-to-br from-[#38BDF8]/[0.03] to-transparent',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t('landing.feature.roommateProfiles.title') || 'Roommate Profiles',
      description:
        t('landing.feature.roommateProfiles.description') ||
        'Track individual spending, tasks, and contributions per roommate.',
      color: 'bg-[#A78BFA]/10 text-[#A78BFA]',
      borderColor: 'border-[#A78BFA]/20',
      gradient: 'bg-gradient-to-br from-[#A78BFA]/[0.03] to-transparent',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Spending Analytics',
      description:
        'Visual breakdowns of where your money goes. Monthly reports and insights.',
      color: 'bg-[#FBBF24]/10 text-[#FBBF24]',
      borderColor: 'border-[#FBBF24]/20',
      gradient: 'bg-gradient-to-br from-[#FBBF24]/[0.03] to-transparent',
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Smart Reminders',
      description:
        'Automatic reminders for upcoming bills and overdue chores. Stay on track.',
      color: 'bg-[#F43F5E]/10 text-[#F43F5E]',
      borderColor: 'border-[#F43F5E]/20',
      gradient: 'bg-gradient-to-br from-[#F43F5E]/[0.03] to-transparent',
    },
  ];

  return (
    <section id="features" className="relative py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-medium text-[#F97316] uppercase tracking-[0.15em] mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm md:text-base">
            Built for modern co-living. Clean, simple, and actually useful.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
