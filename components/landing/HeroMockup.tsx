'use client';

import { motion } from 'framer-motion';
import { ANIMATION } from '@/constants/animations';

export function HeroMockup() {
  return (
    <motion.div
      {...ANIMATION.fadeUp(0.5, 20)}
      className="relative mt-24 w-full max-w-5xl px-4 z-20"
    >
      <div className="rounded-[2rem] border border-white/10 bg-[#121212]/80 backdrop-blur-xl p-2 sm:p-4 shadow-2xl relative overflow-hidden transform rotateX-6 shadow-[0_20px_60px_-10px_rgba(249,115,22,0.15)] will-change:transform">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F97316] to-[#FBBF24]" />
        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] aspect-[16/9] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[var(--noise-pattern)] opacity-2 mix-blend-overlay" />
          <div className="w-full h-full p-8 flex flex-col gap-6 opacity-80">
            <div className="flex justify-between items-center w-full pb-6 border-b border-white/5">
              <div className="h-6 w-32 bg-white/10 rounded-full" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[#F97316]/20 rounded-full" />
                <div className="h-8 w-8 bg-[#84CC16]/20 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 flex-1">
              <div className="col-span-2 bg-white/5 rounded-xl border border-white/5 p-6 flex flex-col justify-end">
                <div className="h-4 w-1/3 bg-white/10 rounded-full mb-3" />
                <div className="h-8 w-1/2 bg-white/20 rounded-md" />
              </div>
              <div className="col-span-1 bg-gradient-to-br from-[#F97316]/20 to-transparent rounded-xl border border-[#F97316]/10" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}