'use client';
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardWidgetProps {
  id: string;
  children: ReactNode;
  editing: boolean;
  onRemove?: () => void;
}

export default function DashboardWidget({ id, children, editing, onRemove }: DashboardWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="relative"
    >
      {children}
      {editing && (
        <div className="absolute inset-0 rounded-[2rem] ring-2 ring-accent/40 ring-inset pointer-events-none z-10" />
      )}
      {editing && (
        <button
          {...attributes} {...listeners}
          className="absolute top-3 left-3 z-20 p-1.5 rounded-lg bg-accent text-white cursor-grab active:cursor-grabbing hover:bg-accent-hover transition-colors"
          aria-label="Drag widget"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {editing && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
          aria-label="Remove widget"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
