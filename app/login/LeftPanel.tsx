'use client';

import { motion } from 'framer-motion';
import { useI18n } from '../../context/I18nContext';

interface LeftPanelProps {
  activeTab: 'signin' | 'signup';
}

const steps = [
  { number: 1, label: 'Create Account' },
  { number: 2, label: 'Join Your Flat' },
  { number: 3, label: 'Start Living' },
];

export default function LeftPanel({ activeTab }: LeftPanelProps) {
  const { t } = useI18n();

  return (
    <div className="hidden lg:flex relative w-full overflow-hidden bg-gradient-to-br from-[#022c22] via-[#064e3b] to-black">
      {/* Floating shape 1 */}
      <motion.div
        className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#10b981]/20 blur-[120px]"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating shape 2 */}
      <motion.div
        className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-[#059669]/15 blur-[100px]"
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 70, -40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating shape 3 */}
      <motion.div
        className="absolute top-[40%] left-[30%] w-[250px] h-[250px] rounded-full bg-[#34d399]/10 blur-[80px]"
        animate={{
          x: [0, 50, -70, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.25, 0.85, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating shape 4 - accent */}
      <motion.div
        className="absolute top-[15%] right-[20%] w-[180px] h-[180px] rounded-full bg-[#fbbf24]/8 blur-[60px]"
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 1.1, 1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-[url('/dot-grid.svg')] opacity-[0.03]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between w-full p-12">
        {/* Top section - branding */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/20">
              F
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">FlatMate</span>
          </div>

          {/* Main heading */}
          <div className="space-y-2 max-w-sm">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Get Started<br />with Us
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              {t('login.manageApartmentTogether')}
            </p>
          </div>
        </div>

        {/* Bottom section - stepper */}
        <div className="space-y-4">
          <div className="flex gap-3">
            {steps.map((step, i) => {
              const isActive = activeTab === 'signup'
                ? i === 0
                : i === 1;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`flex-1 rounded-xl p-4 transition-all duration-300 ${
                    isActive
                      ? 'bg-white shadow-lg shadow-white/10'
                      : 'bg-white/5 backdrop-blur-sm border border-white/10'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white/10 text-zinc-400'
                  }`}>
                    {step.number}
                  </div>
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-black' : 'text-zinc-500'
                  }`}>
                    {t(`login.step${step.number}`, { fallback: step.label })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
