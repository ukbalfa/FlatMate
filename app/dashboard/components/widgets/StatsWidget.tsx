'use client';
import { motion } from 'framer-motion';
import { Wallet, CheckSquare, Sparkles, Users, type LucideIcon } from 'lucide-react';

interface StatItem {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  trend?: string | null;
  alert?: boolean;
}

interface StatsWidgetProps {
  stats: StatItem[];
  loading?: boolean;
}

export default function StatsWidget({ stats, loading }: StatsWidgetProps) {
  if (loading) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-white/30 transition-all backdrop-blur-xl relative overflow-hidden group"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color.replace('bg-', 'bg-').replace('-500', '-500/20')} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`} />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-white/50 text-sm font-dm-mono uppercase tracking-widest">{stat.title}</p>
              <p className="text-3xl font-bold text-white mt-2 font-space-grotesk">{stat.value}</p>
              <p className={`text-sm mt-2 font-dm-sans ${stat.alert ? 'text-red-400' : 'text-white/40'}`}>{stat.subtitle}</p>
              {stat.trend && <p className="text-xs text-[#ccff00] mt-1 font-dm-mono">{stat.trend}</p>}
            </div>
            <div className={`${stat.color.replace('bg-', 'bg-').replace('-500', '-500')} p-3 rounded-2xl shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
