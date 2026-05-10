'use client';
import { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  colorClass?: string;
}

export function Avatar({ src, name, size = 8, className = '', colorClass = 'bg-[#F97316]' }: AvatarProps) {
  const [error, setError] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  if (!src || error) {
    return (
      <div
        className={`${colorClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
        style={{ width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.5}px` }}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}
