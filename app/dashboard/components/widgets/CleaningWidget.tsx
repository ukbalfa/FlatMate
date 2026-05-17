'use client';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import type { CleaningTask } from '@/lib/types';

interface CleaningWidgetProps {
  myCleaning: CleaningTask[];
  t: (key: string, params?: Record<string, unknown>) => string;
}

export default function CleaningWidget({ myCleaning, t }: CleaningWidgetProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-space-grotesk">
          <Sparkles className="w-5 h-5 text-amber-400" />
          {t('dashboard.cleaning')}
        </h2>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-dm-mono">
          {myCleaning.length} {t('dashboard.tasks')}
        </span>
      </div>

      {myCleaning.length === 0 ? (
        <EmptyState icon={<Sparkles className="w-8 h-8" />} title={t('dashboard.noCleaning')} description={t('dashboard.noCleaningDesc')} />
      ) : (
        <div className="space-y-3 relative z-10">
          {myCleaning.map((task) => (
            <Link key={task.id} href="/dashboard/cleaning"
              className="block p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <p className="text-white text-sm font-bold font-dm-sans">{task.task}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-dm-mono ${
                  task.dayOfWeek === today ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10'
                }`}>
                  {task.dayOfWeek === today ? t('dashboard.today') : t('cleaning.day.' + task.dayOfWeek)}
                </span>
                <span className={`text-xs font-bold font-dm-sans ${task.done ? 'text-green-400' : 'text-white/30'}`}>
                  {task.done ? t('common.done') : t('dashboard.pending')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
