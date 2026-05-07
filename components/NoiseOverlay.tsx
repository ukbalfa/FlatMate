'use client';

import { cn } from '../lib/utils';

interface NoiseOverlayProps {
  opacity?: number;
  className?: string;
}

export default function NoiseOverlay({ opacity = 0.015, className }: NoiseOverlayProps) {
  return (
    <div
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        backgroundImage: `url("/noise.svg")`,
        opacity,
      }}
    />
  );
}