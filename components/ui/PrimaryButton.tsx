'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ href, children, className, ...props }, ref) => {
    const baseClasses = 'gradient-citrus text-white px-8 py-4 text-base font-bold rounded-2xl flex items-center gap-2 transition-all hover:shadow-[0_0_32px_rgba(249,115,22,0.25)] hover:scale-105 font-sora';

    if (href) {
      return (
        <Link href={href} className={cn(baseClasses, className)}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={cn(baseClasses, className)} {...props}>
        {children}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;