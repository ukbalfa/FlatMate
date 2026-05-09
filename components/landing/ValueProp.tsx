'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { CheckCircle2 } from 'lucide-react';

export function ValueProp() {
  const { t } = useI18n();

  return (
    <section className="py-32 relative overflow-hidden bg-[#050505] border-y border-white/5" aria-labelledby="value-prop-heading" role="region">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
            aria-labelledby="value-prop-heading"
            role="region"
            tabIndex={0}
          >
              <h2 className="text-4xl md:text-5xl font-space-grotesk font-bold text-white leading-[1.1] tracking-tight" id="value-prop-heading" tabIndex={0}>
              {t('landing.hero.titlePart1')}
            </h2>
            <p className="text-xl text-white/90 font-dm-sans">
              {t('landing.hero.subtitle')}
            </p>

               <ul className="space-y-4" role="list" aria-label="FlatMate benefits" tabIndex={0}>
              {[
                t('landing.feature.expenseSplitting.description'),
                t('landing.feature.cleaningSchedule.description'),
                t('landing.feature.exchangeRates.description')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90 font-dm-sans" role="listitem">
                  <CheckCircle2 className="w-5 h-5 text-[#84CC16]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

               <button className="fm-btn-primary px-8 py-3 rounded-full mt-4 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#050505]" aria-label={t('landing.footer.about')} tabIndex={0}>
              {t('landing.footer.about')}
            </button>
          </motion.div>
        </div>

         <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative aspect-square md:aspect-[4/3] rounded-[2rem] border border-white/10 overflow-hidden bg-[#0A0A0A] group will-change:transform"
           role="img"
           aria-label="FlatMate collaboration illustration"
           tabIndex={0}
         >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#F97316]/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[10rem] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              🤝
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}