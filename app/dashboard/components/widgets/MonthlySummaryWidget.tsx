'use client';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface MonthlySummaryWidgetProps {
  myMonthExpenses: number;
  totalMonthExpenses: number;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export default function MonthlySummaryWidget({ myMonthExpenses, totalMonthExpenses, t }: MonthlySummaryWidgetProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 font-space-grotesk relative z-10">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        {t('dashboard.monthlyOverview')}
      </h2>
      <div className="space-y-5 relative z-10">
        <div>
          <div className="flex justify-between text-sm mb-2 font-dm-sans">
            <span className="text-white/50">{t('dashboard.yourContribution')}</span>
            <span className="text-white font-bold">
              {((myMonthExpenses / (totalMonthExpenses || 1)) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-citrus rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min((myMonthExpenses / (totalMonthExpenses || 1)) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-sm" />
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-2 font-dm-mono tracking-widest uppercase">
            {myMonthExpenses.toLocaleString()} of {totalMonthExpenses.toLocaleString()} UZS
          </p>
        </div>
        <div className="pt-5 border-t border-white/10">
          <Link href="/dashboard/expenses"
            className="flex items-center justify-between text-sm font-bold text-white/50 hover:text-white transition-colors py-2"
          >
            <span>{t('dashboard.viewAllExpenses')}</span><ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/dashboard/balances"
            className="flex items-center justify-between text-sm font-bold text-white/50 hover:text-white transition-colors py-2"
          >
            <span>{t('dashboard.checkBalances')}</span><ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
