"use client";

import { motion } from "framer-motion";
import { Trash2, Repeat, Paperclip } from "lucide-react";
import { Avatar } from "../../../components/Avatar";
import type { Expense, SplitMember } from "../../../../lib/types";
import { DEFAULT_CURRENCY } from "../../../../lib/utils";

interface ExpenseCardProps {
  expense: Expense;
  onDelete: () => void;
  isAdmin: boolean;
}

export const ExpenseCard = ({ expense, onDelete, isAdmin }: ExpenseCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(249, 115, 22, 0.2)" }}
    className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-display text-lg font-semibold text-white">
          {expense.description}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-300">
            {new Date(expense.date).toLocaleDateString()}
          </span>
          {expense.isRecurring && (
            <Repeat className="w-4 h-4 text-amber-400" />
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="font-mono font-bold text-amber-400 text-xl">
          {expense.amount.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400 ml-1">{DEFAULT_CURRENCY}</span>
      </div>
    </div>

    {expense.receiptUrl && (
      <div className="mt-3 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
          src={expense.receiptUrl}
          alt={`Receipt for ${expense.description || 'expense'} on ${new Date(expense.date).toLocaleDateString()}`}
          className="w-full h-32 object-cover rounded-lg"
        />
        <Paperclip className="absolute top-2 right-2 w-5 h-5 text-white/80" />
      </div>
    )}

    {expense.splitWith && expense.splitWith.length > 0 && (
      <div className="mt-3 flex -space-x-2">
        {expense.splitWith.map((user: SplitMember) => (
          <Avatar
            key={user.id}
            src={user.avatar}
            name={user.name}
            size={2}
            className="border-2 border-white/20"
          />
        ))}
      </div>
    )}

    {isAdmin && (
      <button
        onClick={onDelete}
        className="mt-3 text-gray-400 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
        aria-label="Delete expense"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    )}
  </motion.div>
);