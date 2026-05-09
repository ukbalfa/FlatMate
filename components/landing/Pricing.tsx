'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { Check, Zap } from 'lucide-react';

interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaStyle: string;
  popular?: boolean;
}

export function Pricing() {
  const { t } = useI18n();

  const plans: Plan[] = [
    {
      name: t('landing.footer.dashboard') || 'Flat',
      description: t('expenses.subtitle') || 'For small households just getting started.',
      price: '$0',
      period: '/mo',
      features: [
        'Unlimited expenses',
        'Up to 5 roommates',
        'Basic expense splitting',
        'Cleaning schedule',
        'Real-time balances',
      ],
      cta: t('landing.hero.getStarted') || 'Get Started',
      ctaStyle:
        'px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/10 hover:bg-white/5 transition-all text-center block w-full',
    },
    {
      name: t('landing.footer.features') || 'Mansion',
      description: t('landing.footer.tagline') || 'For households that want it all.',
      price: '$4',
      period: '/mo',
      features: [
        'Everything in Flat',
        'Unlimited roommates',
        'Advanced analytics',
        'Priority support',
        'Custom notifications',
        'Export to CSV/Excel',
      ],
      cta: t('landing.hero.getStarted') || 'Upgrade to Pro',
      ctaStyle:
        'px-6 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] transition-all text-center block w-full',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-medium text-[#F97316] uppercase tracking-[0.15em] mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Free for most households. Upgrade when you need more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border ${
                plan.popular
                  ? 'border-[#F97316]/30 bg-gradient-to-b from-[#F97316]/[0.03] to-transparent'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-xs font-medium text-[#F97316]">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/40">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-white/40 text-lg">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-white/60">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.popular ? 'bg-[#F97316]/10' : 'bg-white/5'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${plan.popular ? 'text-[#F97316]' : 'text-white/40'}`}
                      />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/login" className={plan.ctaStyle}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
