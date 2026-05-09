'use client';

import { motion } from 'framer-motion';
import { ANIMATION } from '@/constants/animations';
import { ReactNode } from 'react';

export interface FeatureCardProps {
  index: number;
  title: string;
  desc: string;
  icon: ReactNode;
  className?: string;
  content?: ReactNode;
}

export function FeatureCard({ index, title, desc, icon, className, content }: FeatureCardProps) {
  return (
    <motion.div
      {...ANIMATION.fadeUp(0.1 * index)}
      className={`relative p-6 rounded-[2rem] border border-white/10 ${className}`}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
          {icon}
        </div>
        <h3 className="text-2xl font-space-grotesk font-bold text-white mb-3" id={`feature-${index}`}>
          {title}
        </h3>
        <p className="text-white/80 font-dm-sans leading-relaxed text-sm max-w-[80%]">
          {desc}
        </p>
      </div>
      {content}
    </motion.div>
  );
}