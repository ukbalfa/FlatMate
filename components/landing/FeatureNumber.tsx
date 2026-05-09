'use client';

import { ReactNode } from 'react';

export function FeatureNumber({ number }: { number: string }) {
  return (
    <div className="absolute right-0 bottom-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
      <div className="text-[8rem] leading-none font-space-grotesk font-black text-[#F97316]/20">
        {number}
      </div>
    </div>
  );
}