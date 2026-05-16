"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Avatar } from "../../../components/Avatar";
import type { SplitMember } from "../../../../lib/types";

interface SplitExpenseModalProps {
  roommates: SplitMember[];
  onSplit: (splitWith: SplitMember[], amount: number) => void;
  onClose: () => void;
  totalAmount: number;
}

export const SplitExpenseModal = (
  { roommates, onSplit, onClose, totalAmount }:
  SplitExpenseModalProps
) => {
  const [selectedRoommates, setSelectedRoommates] = useState<SplitMember[]>([]);
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const toggleRoommate = (roommate: SplitMember) => {
    setSelectedRoommates((prev) =>
      prev.some((r) => r.id === roommate.id)
        ? prev.filter((r) => r.id !== roommate.id)
        : [...prev, roommate]
    );
  };

  const handleSplit = () => {
    if (splitMethod === "equal") {
      const amountPerPerson = totalAmount / (selectedRoommates.length + 1);
      onSplit(selectedRoommates, amountPerPerson);
    } else {
      const totalCustom = Object.values(customAmounts).reduce((sum, val) => sum + val, 0);
      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        setValidationError("Custom amounts must sum to the total expense");
        return;
      }
      onSplit(selectedRoommates, 0);
    }
    onClose();
  };

  const updateCustomAmount = (id: string, value: number) => {
    setCustomAmounts((prev) => ({ ...prev, [id]: value }));
    setValidationError("");
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="split-modal-title">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 id="split-modal-title" className="font-display text-xl text-white">Split Expense</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-white/80 mb-2">Total: {totalAmount.toLocaleString()} UZS</p>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSplitMethod("equal")}
              className={`px-3 py-1 rounded-full text-sm min-h-[44px] ${splitMethod === "equal" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
            >
              Equal Split
            </button>
            <button
              type="button"
              onClick={() => setSplitMethod("custom")}
              className={`px-3 py-1 rounded-full text-sm min-h-[44px] ${splitMethod === "custom" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
            >
              Custom Amounts
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {roommates.map((roommate) => {
              const isSelected = selectedRoommates.some((r) => r.id === roommate.id);
              return (
                <button
                  key={roommate.id}
                  type="button"
                  onClick={() => toggleRoommate(roommate)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer w-full text-left min-h-[44px] ${
                    isSelected ? "bg-white/10" : ""
                  }`}
                  role="checkbox"
                  aria-checked={isSelected}
                >
                  <Avatar src={roommate.avatar} name={roommate.name} size={2.5} />
                  <div className="flex-1">
                    <p className="text-white font-medium">{roommate.name}</p>
                    {splitMethod === "custom" && isSelected && (
                      <input
                        type="number"
                        value={customAmounts[roommate.id] || ""}
                        onChange={(e) => updateCustomAmount(roommate.id, Number(e.target.value))}
                        placeholder="Amount"
                        className="mt-1 w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                        aria-label={`Custom amount for ${roommate.name}`}
                      />
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#F97316]" />
                  )}
                </button>
              );
            })}
          </div>

          {validationError && (
            <p className="text-red-400 text-sm mt-2" role="alert">{validationError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSplit}
            className="px-4 py-2 bg-amber-400 text-gray-900 rounded-lg font-medium hover:bg-amber-300 transition min-h-[44px]"
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
};