'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0] dark:bg-[#1C1000] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="text-7xl font-bold text-[#F97316] mb-4">404</div>
        <h1 className="text-2xl font-semibold text-[#1C1400] dark:text-[#FFF5DC] mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-[#9A7C4A] dark:text-gray-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white dark:bg-white/10 text-[#1C1400] dark:text-white border border-[#F0D89A] dark:border-white/10 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#FFF0CC] dark:hover:bg-white/15 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#EA6D0E] transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}