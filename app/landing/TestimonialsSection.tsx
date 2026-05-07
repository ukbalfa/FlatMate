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
    <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-bg-section to-bg-gradient-end dark:from-dark-bg-section dark:to-dark-bg-card">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Main Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-bg-card dark:bg-dark-bg-card rounded-3xl border border-border dark:border-dark-border p-10 mb-12 relative overflow-hidden shadow-glow hover:shadow-glow-strong transition-shadow duration-300"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-accent to-accent-honey" />
          <StarRating />
          <blockquote className="text-2xl sm:text-3xl my-6 leading-relaxed italic font-sora font-bold text-heading dark:text-dark-heading">
            &ldquo;{t('landing.testimonials.quote1')}&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center">
              <span className="text-white font-sora font-bold text-lg">{TESTIMONIALS[0]?.avatar || 'U'}</span>
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

        {/* Additional Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {TESTIMONIALS.slice(1).map((testimonial, index) => (
            <motion.div
              key={testimonial.authorKey}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-bg-card dark:bg-dark-bg-card border border-border dark:border-dark-border rounded-2xl p-6 shadow-md hover:shadow-glow transition-shadow duration-300"
            >
              <StarRating size="sm" />
              <p className="my-4 text-sm leading-relaxed font-dm-sans text-body-light dark:text-dark-body">
                {t(testimonial.quoteKey)}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-honey flex items-center justify-center">
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

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="mb-6 font-dm-sans font-medium text-muted dark:text-dark-muted text-sm">
            {t('landing.trustedBy')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {TRUSTED_BY.map((institution) => (
              <div
                key={institution.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-section dark:bg-dark-bg-section border border-border dark:border-dark-border hover:border-accent dark:hover:border-accent transition-colors"
              >
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image
                    src={institution.logo}
                    alt=""
                    role="presentation"
                    width={24}
                    height={24}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="font-sora font-bold text-sm text-accent-dark dark:text-accent-honey whitespace-nowrap">
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
