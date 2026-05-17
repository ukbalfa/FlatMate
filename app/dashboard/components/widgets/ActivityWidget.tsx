'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, Bell, Receipt, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { formatTimeAgo } from '@/lib/utils';
import type { ActivityItem } from '@/lib/types';

interface ActivityWidgetProps {
  activityFeed: ActivityItem[];
  t: (key: string, params?: Record<string, unknown>) => string;
}

export default function ActivityWidget({ activityFeed, t }: ActivityWidgetProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 font-space-grotesk">
          <Activity className="w-6 h-6 text-accent" />
          {t('dashboard.recentActivity')}
        </h2>
        <Link href="/dashboard/expenses"
          className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 font-dm-mono uppercase tracking-widest"
        >
          {t('dashboard.viewAllExpenses')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {activityFeed.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title={t('dashboard.noActivity')} description={t('dashboard.noActivityDesc')} />
      ) : (
        <div className="space-y-4">
          {activityFeed.map((activity, index) => (
            <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-2xl transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                activity.type === 'expense' ? 'bg-accent/20 text-accent border border-accent/30'
                : activity.type === 'task' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {activity.type === 'expense' ? <Receipt className="w-6 h-6" />
                : activity.type === 'task' ? <CheckSquare className="w-6 h-6" />
                : <Sparkles className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold font-space-grotesk truncate">{activity.title}</p>
                <p className="text-white/50 text-sm font-dm-sans truncate mt-0.5">{activity.description}</p>
              </div>
              <span className="text-xs text-white/30 font-dm-mono flex-shrink-0">{formatTimeAgo(activity.timestamp)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
