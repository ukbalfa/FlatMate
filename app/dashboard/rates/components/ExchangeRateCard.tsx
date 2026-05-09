"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface ExchangeRateCardProps {
  from: string;
  to: string;
  rate: number;
  source: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ExchangeRateCard = (
  { from, to, rate, source, isFavorite, onToggleFavorite }:
  ExchangeRateCardProps
) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(249, 115, 22, 0.1)" }}
    className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 relative"
  >
    <div className="absolute top-2 right-2">
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="p-1 rounded-full hover:bg-white/10"
        >
          <Star
            size={16}
            fill={isFavorite ? "#FFD700" : "none"}
            color={isFavorite ? "#FFD700" : "#A0A0A0"}
          />
        </button>
      )}
    </div>
    
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">{from}</span>
        <span className="text-gold-400">→</span>
        <span className="text-xl font-bold text-white">{to}</span>
      </div>
      <span className="text-xs text-gray-400 uppercase bg-white/10 px-2 py-0.5 rounded-full">
        {source}
      </span>
    </div>
    
    <div className="mt-3">
      <span className="text-2xl font-mono font-bold text-white">
        {rate.toFixed(4)}
      </span>
      <span className="text-sm text-gray-400 ml-1">/ {to}</span>
    </div>
  </motion.div>
);