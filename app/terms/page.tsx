'use client';

import { useI18n } from '../../context/I18nContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TermsPage() {
  const { t, language } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const lastUpdated = language === 'uz' ? '2026-yil 16-may' : language === 'ru' ? '16 мая 2026 г.' : 'May 16, 2026';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-accent mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {language === 'uz' ? 'Bosh sahifaga' : language === 'ru' ? 'На главную' : 'Back to home'}
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-sora">
            {t('legal.terms.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
            {t('legal.terms.lastUpdated')}: {lastUpdated}
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.acceptance')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.acceptanceDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.eligibility')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.eligibilityDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.account')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.accountDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.service')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.serviceDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.acceptableUse')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.terms.acceptableUseDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>{t('legal.terms.use.illegal')}</li>
                <li>{t('legal.terms.use.abuse')}</li>
                <li>{t('legal.terms.use.violate')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.intellectual')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.intellectualDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.termination')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.terminationDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.disclaimer')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.disclaimerDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.liability')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.liabilityDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.indemnification')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.indemnificationDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.governingLaw')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.governingLawDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.dispute')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.disputeDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.terms.changes')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.terms.changesDesc')}
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/privacy" 
              className="text-accent hover:underline"
            >
              ← {t('legal.privacy.title')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}