"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface BudgetTrackerProps {
  category: string;
  spent: number;
  limit: number;
  color: string;
}

export const BudgetTracker = ({ category, spent, limit, color }: BudgetTrackerProps) => {
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOverBudget = percentage > 90;

  return (
    <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 w-40 text-center">
      <h4 className="font-inter font-medium text-white mb-2">
        {category}
      </h4>
      <div className="w-32 h-32 mx-auto relative">
        <CircularProgressbar
          value={percentage}
          text={`${Math.round(percentage)}%`}
          styles={buildStyles({
            pathColor: isOverBudget ? "#EF4444" : color,
            trailColor: "#374151",
            textColor: "#E0E0E0",
            textSize: "12px",
          })}
        />
        {isOverBudget && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-white mt-2">
        <span className="font-mono font-bold text-amber-400">
          {spent.toLocaleString()}
        </span>
        <span className="text-gray-400"> / {limit.toLocaleString()}</span>
      </p>
    </div>
  );
};