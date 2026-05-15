'use client';

import { useI18n } from '../../context/I18nContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
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
            {t('legal.privacy.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
            {t('legal.privacy.lastUpdated')}: {lastUpdated}
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.intro')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.dataWeCollect')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.privacy.dataWeCollectDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>{t('legal.privacy.data.account')}</li>
                <li>{t('legal.privacy.data.preferences')}</li>
                <li>{t('legal.privacy.data.expenses')}</li>
                <li>{t('legal.privacy.data.tasks')}</li>
                <li>{t('legal.privacy.data.usage')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.howWeUse')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.privacy.howWeUseDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>{t('legal.privacy.use.provide')}</li>
                <li>{t('legal.privacy.use.communicate')}</li>
                <li>{t('legal.privacy.use.analyze')}</li>
                <li>{t('legal.privacy.use.comply')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.legalBasis')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.legalBasisDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.dataSharing')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.privacy.dataSharingDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>{t('legal.privacy.sharing.firebase')}</li>
                <li>{t('legal.privacy.sharing.flatMembers')}</li>
                <li>{t('legal.privacy.sharing.thirdParty')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.retention')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.retentionDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.yourRights')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.privacy.yourRightsDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>{t('legal.privacy.rights.access')}</li>
                <li>{t('legal.privacy.rights.correct')}</li>
                <li>{t('legal.privacy.rights.delete')}</li>
                <li>{t('legal.privacy.rights.withdraw')}</li>
                <li>{t('legal.privacy.rights.complain')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.security')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.securityDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.crossBorder')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.crossBorderDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.children')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('legal.privacy.childrenDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-sora">
                {t('legal.privacy.contact')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('legal.privacy.contactDesc')}
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>FlatMate</strong><br />
                  {language === 'uz' ? 'Toshkent, O\'zbekiston' : language === 'ru' ? 'Ташкент, Узбекистан' : 'Tashkent, Uzbekistan'}<br />
                  support@flatmate.app
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm">
                {t('legal.privacy.complaints')}
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/terms" 
              className="text-accent hover:underline"
            >
              {t('legal.terms.title')} →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}