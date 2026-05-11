'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Expense } from '../../../../lib/types';

interface ExpenseEditModalProps {
  expense: Expense;
  onSave: (updated: Expense) => void;
  onClose: () => void;
}

export function ExpenseEditModal({ expense, onSave, onClose }: ExpenseEditModalProps) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description || '');
  const [date, setDate] = useState(expense.date);
  const [note, setNote] = useState(expense.note || '');
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = ['Rent', 'Groceries', 'Utilities', 'Internet', 'Misc'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    setSubmitting(true);
    try {
      onSave({
        ...expense,
        amount: Number(amount),
        category,
        description,
        date,
        note,
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
        className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">Amount (UZS)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1a1a2e]">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Notes</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div className="text-sm text-white/60">
            Paid by: <span className="text-white font-medium">{expense.paidBy}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-400 text-gray-900 font-medium hover:bg-amber-300 transition disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
