'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { ArrowRight, Zap, Star, ArrowDown } from 'lucide-react';

export function CTA() {
  const { t } = useI18n();

  return (
    <section className="relative py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-8 md:p-16 rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-accent-honey/5 to-transparent" />
          <div className="absolute inset-0 bg-bg-section/80" />
          <div className="absolute inset-0 border border-white/6 rounded-3xl" />

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-accent/20 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-accent/20 rounded-br-3xl" />

          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Free for everyone
              </span>
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to live in harmony?
            </h2>
            <p className="text-white/40 max-w-md mx-auto mb-8 text-sm md:text-base">
              Join thousands of roommates who stopped fighting over bills and started enjoying their home.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="group px-8 py-4 rounded-full text-sm font-semibold text-white bg-linear-to-r from-accent to-accent-honey hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] transition-all duration-300 flex items-center gap-2"
              >
                {t('landing.hero.getStarted') || 'Get Started Free'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="group px-8 py-4 rounded-full text-sm font-semibold text-white/50 border border-white/10 hover:bg-white/5 hover:text-white transition-all duration-300 flex items-center gap-2"
              >
                Explore features
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Testimonial pull quote */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-accent-honey text-accent-honey" />
                ))}
              </div>
              <span>
                &ldquo;No more passive-aggressive sticky notes. Game changer.&rdquo; <span className="text-white/50">&mdash; James K.</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
