'use client';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import type { WidgetId } from '@/lib/hooks/useDashboardWidgets';

const LABELS: Record<WidgetId, string> = {
  stats: 'Stats Grid',
  quickActions: 'Quick Actions',
  activity: 'Activity Feed',
  rentCountdown: 'Rent Countdown',
  tasks: 'My Tasks',
  cleaning: 'Cleaning Schedule',
  monthlySummary: 'Monthly Summary',
};

interface AddWidgetPanelProps {
  hiddenWidgets: WidgetId[];
  onAdd: (id: WidgetId) => void;
  open: boolean;
  onClose: () => void;
}

export default function AddWidgetPanel({ hiddenWidgets, onAdd, open, onClose }: AddWidgetPanelProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-80 max-w-[90vw] bg-[#0A0A0A] border-l border-white/10 h-full overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-space-grotesk">Add Widget</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {hiddenWidgets.length === 0 ? (
          <p className="text-white/40 text-sm font-dm-sans">
            All widgets are already on your dashboard.
          </p>
        ) : (
          <div className="space-y-2">
            {hiddenWidgets.map((id) => (
              <button
                key={id}
                onClick={() => onAdd(id)}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-left group"
              >
                <span className="flex-1 text-sm font-bold text-white font-dm-sans">
                  {LABELS[id]}
                </span>
                <Plus className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
