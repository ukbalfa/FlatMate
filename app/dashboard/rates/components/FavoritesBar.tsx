"use client";

import { Star } from "lucide-react";

interface FavoritesBarProps {
  favorites: string[];
  onToggle: (pair: string) => void;
}

export const FavoritesBar = ({ favorites, onToggle }: FavoritesBarProps) => {
  const defaultPairs = ["USD/UZS", "EUR/UZS", "RUB/UZS", "KRW/UZS"];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {defaultPairs.map((pair) => (
        <button
          key={pair}
          onClick={() => onToggle(pair)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
            favorites.includes(pair)
              ? "bg-gold-900/50 text-gold-400 border border-gold-400"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <Star size={14} fill={favorites.includes(pair) ? "#FFD700" : "none"} />
          {pair}
        </button>
      ))}
    </div>
  );
};