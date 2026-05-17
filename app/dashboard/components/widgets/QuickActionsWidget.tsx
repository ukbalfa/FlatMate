'use client';
import Link from 'next/link';
import { Receipt, CheckSquare, Wallet, TrendingUp } from 'lucide-react';

interface QuickActionsWidgetProps {
  t: (key: string, params?: Record<string, unknown>) => string;
}

export default function QuickActionsWidget({ t }: QuickActionsWidgetProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <h2 className="text-xl font-bold text-white mb-6 font-space-grotesk">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.addExpense'), href: '/dashboard/expenses', icon: Receipt, color: 'bg-accent' },
          { label: t('dashboard.addTask'), href: '/dashboard/tasks', icon: CheckSquare, color: 'bg-blue-500' },
          { label: t('dashboard.viewBalances'), href: '/dashboard/balances', icon: Wallet, color: 'bg-amber-500' },
          { label: t('dashboard.exchangeRates'), href: '/dashboard/rates', icon: TrendingUp, color: 'bg-purple-500' },
        ].map((action) => (
          <Link key={action.label} href={action.href}
            className="flex flex-col items-center gap-3 p-5 bg-black/40 rounded-2xl hover:bg-white/10 transition-all duration-300 group/action border border-white/5 hover:border-white/20 hover:scale-[1.02]"
          >
            <div className={`${action.color} p-3 rounded-xl group-hover/action:scale-110 group-hover/action:rotate-3 transition-transform duration-300 shadow-lg`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-dm-sans text-white/60 group-hover/action:text-white transition-colors text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
