'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Task } from '../../../../lib/types';

interface TaskEditModalProps {
  task: Task;
  users: { username: string; name?: string }[];
  onSave: (updated: Task) => void;
  onClose: () => void;
}

export function TaskEditModal({ task, users, onSave, onClose }: TaskEditModalProps) {
  const [text, setText] = useState(task.text);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task.priority || "medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !dueDate || !assignedTo) return;
    setSubmitting(true);
    try {
      onSave({
        ...task,
        text,
        dueDate,
        assignedTo,
        priority,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-white">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-1">Task</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-1">Assign to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                required
              >
                <option value="">Select</option>
                {users.map((u) => (
                  <option key={u.username} value={u.username} className="bg-white dark:bg-gray-700">
                    {u.name || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
              >
                <option value="low" className="bg-white dark:bg-gray-700">Low</option>
                <option value="medium" className="bg-white dark:bg-gray-700">Medium</option>
                <option value="high" className="bg-white dark:bg-gray-700">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-[#0a0a0a] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#F97316] text-white font-medium hover:bg-[#e06610] transition disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
