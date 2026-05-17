'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { ArrowUpRight, ArrowRight, Receipt, CheckCircle, Zap, TrendingUp, Sparkles } from 'lucide-react';

const PARTICLE_CONFIGS = [
  { delay: 0, size: 4, x: '10%', y: '20%' },
  { delay: 1, size: 3, x: '85%', y: '15%' },
  { delay: 2, size: 5, x: '70%', y: '60%' },
  { delay: 0.5, size: 3, x: '25%', y: '70%' },
  { delay: 1.5, size: 4, x: '50%', y: '85%' },
  { delay: 3, size: 2, x: '90%', y: '40%' },
] as const;

function Particle({ delay, size, x, y, duration }: { delay: number; size: number; x: string; y: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/3"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        y: [0, -15, 0],
        opacity: [0.03, 0.08, 0.03],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export function Hero() {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const particles = useMemo(() => {
    return PARTICLE_CONFIGS.map((config, i) => (
      <Particle
        key={i}
        {...config}
        duration={4 + (i * 0.5) % 3}
      />
    ));
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/7 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#84CC16]/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-[#38BDF8]/4 blur-[80px]" />

        {/* Subtle grid line */}
        <div
          className="absolute inset-0 opacity-2"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center px-4 w-full max-w-5xl">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/3 backdrop-blur-sm mb-8"
        >
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-white/70 tracking-wide">
            {t('landing.badge') || 'Free for households'}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] tracking-tight leading-[1.05] text-white mb-6"
        >
          {t('landing.hero.titlePart1') || 'Co-living'}{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-accent via-accent-honey to-accent">
            {t('landing.hero.titlePart2') || 'without chaos'}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-center text-white/50 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
        >
          {t('landing.hero.subtitle') ||
            'Split bills, track chores, and keep your household running smoothly. No more awkward money conversations.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="group px-6 py-3 rounded-full text-sm font-semibold text-white bg-linear-to-r from-accent to-accent-honey hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {t('landing.hero.getStarted') || 'Get Started Free'}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="group px-6 py-3 rounded-full text-sm font-semibold text-white/70 border border-white/10 hover:bg-white/5 hover:text-white transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {t('landing.hero.seeFeatures') || 'See how it works'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 flex items-center gap-6 text-white/30 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#84CC16]" />
            No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#84CC16]" />
            Free forever
          </span>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-6 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {['S', 'J', 'E', 'M', 'A'].map((initial, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center text-[9px] font-bold text-white/50"
                style={{ zIndex: 5 - i }}
              >
                {initial}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">
            <span className="text-white/70 font-semibold">5,000+</span> roommates already on board
          </p>
        </motion.div>
      </motion.div>

      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-16 w-full max-w-5xl px-4"
      >
        <div className="relative rounded-2xl border border-white/8 bg-bg-section/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent-honey/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#84CC16]/80" />
            </div>
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/3 border border-white/5 text-[10px] text-white/30">
                flatmate.app/dashboard
              </div>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'This Month', value: '$1,240', icon: Receipt, color: 'from-accent' },
                { label: 'My Tasks', value: '3', icon: CheckCircle, color: 'from-[#38BDF8]' },
                { label: 'Roommates', value: '4', icon: Sparkles, color: 'from-[#A78BFA]' },
                { label: 'Exchange', value: '+2.3%', icon: TrendingUp, color: 'from-[#84CC16]' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
                    <div className={`p-1.5 rounded-lg bg-linear-to-br ${stat.color} to-transparent/20`}>
                      <stat.icon className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-5 rounded-xl bg-white/2 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/70">Expense Activity</span>
                  <div className="flex gap-2">
                    {['Day', 'Week', 'Month'].map((tab) => (
                      <button
                        key={tab}
                        className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                          tab === 'Month'
                            ? 'bg-white/10 text-white'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Mini chart */}
                <div className="h-32 flex items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 70, 50, 75, 60, 85, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-linear-to-t from-accent/30 to-accent-honey/10 hover:from-accent/50 hover:to-accent-honey/30 transition-all duration-300"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/2 border border-white/5">
                <span className="text-sm font-medium text-white/70">Recent Activity</span>
                <div className="mt-4 space-y-3">
                  {[
                    { name: 'Groceries', amount: '-$85', user: 'A' },
                    { name: 'Internet', amount: '-$45', user: 'B' },
                    { name: 'Electricity', amount: '-$120', user: 'C' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/50">
                        {item.user}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 truncate">{item.name}</p>
                      </div>
                      <span className="text-xs font-mono text-white/40">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
