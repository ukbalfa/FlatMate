'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const TESTIMONIALS = [
  { quoteKey: 'landing.testimonials.quote1', authorKey: 'landing.testimonials.author1', roleKey: 'landing.testimonials.role1', avatar: 'U' },
  { quoteKey: 'landing.testimonials.quote2', authorKey: 'landing.testimonials.author2', roleKey: 'landing.testimonials.role2', avatar: 'J' },
  { quoteKey: 'landing.testimonials.quote3', authorKey: 'landing.testimonials.author3', roleKey: 'landing.testimonials.role3', avatar: 'D' },
];

const TRUSTED_BY = [
  { name: 'TIIAME', logo: 'https://tiiame.uz/favicon.ico' },
  { name: 'TSUE', logo: 'https://tsue.uz/favicon.ico' },
  { name: 'TSTU', logo: 'https://tstu.uz/favicon.ico' },
];

function StarRating({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${dims} fill-accent text-accent`} />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-20 px-6 lg:px-8 bg-gradient-to-br from-bg-section to-bg-gradient-end dark:from-dark-bg-section dark:to-dark-bg-card">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-dark-bg-card rounded-2xl border border-border dark:border-dark-border p-8 mb-8 shadow-lg"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-accent-honey rounded-l-2xl" />
          <StarRating />
          <blockquote className="text-xl sm:text-2xl my-5 leading-relaxed font-sora font-bold text-heading dark:text-dark-heading">
            &ldquo;{t('landing.testimonials.quote1')}&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center">
              <span className="text-white font-sora font-bold text-lg">{TESTIMONIALS[0]?.avatar}</span>
            </div>
            <div>
              <p className="font-dm-sans font-semibold text-heading dark:text-dark-heading">
                {t('landing.testimonials.author1')}
              </p>
              <div className="font-dm-sans text-muted dark:text-dark-muted text-sm">
                {t('landing.testimonials.role1')}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {TESTIMONIALS.slice(1).map((testimonial, index) => (
            <motion.div
              key={testimonial.authorKey}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-white/80 dark:bg-dark-bg-card/80 border border-border/50 dark:border-dark-border/50 rounded-xl p-5"
            >
              <StarRating size="sm" />
              <p className="my-3 text-sm leading-relaxed font-dm-sans text-body-light dark:text-dark-body">
                {t(testimonial.quoteKey)}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center">
                  <span className="text-white font-sora text-xs font-bold">
                    {t(testimonial.authorKey).charAt(0)}
                  </span>
                </div>
                <div>
                  <cite className="font-dm-sans font-semibold text-sm text-heading dark:text-dark-heading not-italic">
                    {t(testimonial.authorKey)}
                  </cite>
                  <p className="text-xs font-dm-sans text-muted dark:text-dark-muted">
                    {t(testimonial.roleKey)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="mb-5 font-dm-sans font-medium text-muted dark:text-dark-muted text-sm">
            {t('landing.trustedBy')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUSTED_BY.map((institution) => (
              <div
                key={institution.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 dark:bg-dark-bg-card/60 border border-border/50 dark:border-dark-border/50"
              >
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src={institution.logo}
                    alt=""
                    role="presentation"
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="font-sora font-bold text-sm text-accent-dark dark:text-accent-honey">
                  {institution.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}