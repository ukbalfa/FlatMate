"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RateChartProps {
  data: Array<{ date: string; rate: number }>;
}

export const RateChart = ({ data }: RateChartProps) => (
  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 h-64 w-full">
    <h3 className="text-sm font-medium text-gray-300 mb-2">
      Historical Rates (Last 7 Days)
    </h3>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#008080" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="#A0A0A0"
          tick={{ fontSize: 10 }}
        />
        <YAxis
          stroke="#A0A0A0"
          tick={{ fontSize: 10 }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: "rgba(10, 10, 18, 0.9)",
            border: "none",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#E0E0E0" }}
          itemStyle={{ color: "#E0E0E0" }}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="#FFD700"
          fill="url(#chartGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);