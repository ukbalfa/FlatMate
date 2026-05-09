"use client";

import { useState } from "react";
import { User, Users, X } from "lucide-react";

interface Roommate {
  id: string;
  name: string;
  avatar: string;
}

interface SplitExpenseModalProps {
  roommates: Roommate[];
  onSplit: (splitWith: Roommate[], amount: number) => void;
  onClose: () => void;
  totalAmount: number;
}

export const SplitExpenseModal = (
  { roommates, onSplit, onClose, totalAmount }:
  SplitExpenseModalProps
) => {
  const [selectedRoommates, setSelectedRoommates] = useState<Roommate[]>([]);
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  const toggleRoommate = (roommate: Roommate) => {
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
      if (totalCustom !== totalAmount) {
        alert("Custom amounts must sum to the total expense");
        return;
      }
      onSplit(selectedRoommates, 0); // Custom amounts handled by parent
    }
    onClose();
  };

  const updateCustomAmount = (id: string, value: number) => {
    setCustomAmounts((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl text-white">Split Expense</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-white/80 mb-2">Total: {totalAmount.toLocaleString()} UZS</p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSplitMethod("equal")}
              className={`px-3 py-1 rounded-full text-sm ${splitMethod === "equal" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
            >
              Equal Split
            </button>
            <button
              onClick={() => setSplitMethod("custom")}
              className={`px-3 py-1 rounded-full text-sm ${splitMethod === "custom" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
            >
              Custom Amounts
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {roommates.map((roommate) => (
              <div
                key={roommate.id}
                onClick={() => toggleRoommate(roommate)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                  selectedRoommates.some((r) => r.id === roommate.id) ? "bg-white/10" : ""
                }`}
              >
                <img
                  src={roommate.avatar}
                  alt={roommate.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{roommate.name}</p>
                  {splitMethod === "custom" && selectedRoommates.some((r) => r.id === roommate.id) && (
                    <input
                      type="number"
                      value={customAmounts[roommate.id] || ""}
                      onChange={(e) => updateCustomAmount(roommate.id, Number(e.target.value))}
                      placeholder="Amount"
                      className="mt-1 w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>
                {selectedRoommates.some((r) => r.id === roommate.id) && (
                  <Users className="w-4 h-4 text-amber-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            className="px-4 py-2 bg-amber-400 text-gray-900 rounded-lg font-medium hover:bg-amber-300 transition"
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
};