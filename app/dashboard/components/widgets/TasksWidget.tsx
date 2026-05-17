'use client';
import Link from 'next/link';
import { Clock, CheckSquare } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import type { Task } from '@/lib/types';

interface TasksWidgetProps {
  myTasks: Task[];
  t: (key: string, params?: Record<string, unknown>) => string;
}

export default function TasksWidget({ myTasks, t }: TasksWidgetProps) {
  const overdueTasks = myTasks.filter((t) => new Date(t.dueDate) < new Date(new Date().toISOString().slice(0, 10)));
  const overdueCount = overdueTasks.length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-space-grotesk">
          <Clock className="w-5 h-5 text-blue-400" />
          {t('dashboard.myTasks')}
        </h2>
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold font-dm-mono">
          {myTasks.length} {t('dashboard.pending')}
        </span>
      </div>

      {myTasks.length === 0 ? (
        <EmptyState icon={<CheckSquare className="w-8 h-8" />} title={t('dashboard.allCaughtUp')} description={t('dashboard.noPendingTasks')} />
      ) : (
        <div className="space-y-3 relative z-10">
          {myTasks.slice(0, 5).map((task) => {
            const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntil < 0;
            const isToday = daysUntil === 0;
            return (
              <Link key={task.id} href="/dashboard/tasks"
                className="block p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <p className="text-white text-sm font-bold font-dm-sans line-clamp-2">{task.text}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-dm-mono ${
                    isOverdue ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isToday ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {isOverdue ? `${Math.abs(daysUntil)} ${t('dashboard.overdue')}`
                    : isToday ? t('dashboard.today')
                    : `${daysUntil} ${t('dashboard.days')}`}
                  </span>
                  <span className="text-xs text-white/30 font-dm-mono">{task.dueDate}</span>
                </div>
              </Link>
            );
          })}
          {myTasks.length > 5 && (
            <Link href="/dashboard/tasks"
              className="block text-center text-sm font-bold text-blue-400 hover:text-blue-300 py-3 mt-2 font-dm-sans"
            >
              {t('dashboard.viewMore')} {myTasks.length - 5} {t('dashboard.more')} {t('dashboard.tasks')} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
