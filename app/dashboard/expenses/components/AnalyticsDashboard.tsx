"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyData {
  month: string;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsDashboardProps {
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
}

export const AnalyticsDashboard = ({ monthlyData, categoryData }: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState("6months");

  const visibleMonthlyData = timeRange === "6months" ? monthlyData.slice(-6) : monthlyData;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
      <h2 className="font-display text-xl text-white mb-6">Expense Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="backdrop-blur-md bg-white/5 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">Monthly Trends</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange("6months")}
                className={`px-3 py-1 rounded-full text-sm ${timeRange === "6months" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
              >
                6M
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 rounded-full text-sm ${timeRange === "all" ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white"}`}
              >
                All
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={visibleMonthlyData}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" />
                  <stop offset="95%" stopColor="#FFB74D" />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#A0A0A0" />
              <YAxis stroke="#A0A0A0" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1E1E1E", border: "none" }}
                labelStyle={{ color: "#E0E0E0" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="url(#trendGradient)"
                strokeWidth={3}
                dot={{ fill: "#F97316", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="backdrop-blur-md bg-white/5 rounded-lg p-4">
          <h3 className="font-medium text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" stroke="#A0A0A0" />
              <YAxis stroke="#A0A0A0" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1E1E1E", border: "none" }}
                labelStyle={{ color: "#E0E0E0" }}
              />
              {categoryData.map((category, index) => (
                <Bar
                  key={index}
                  dataKey="value"
                  fill={category.color}
                  name={category.name}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};