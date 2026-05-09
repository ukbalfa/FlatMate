"use client";

import { useState, useEffect } from "react";
import { ExchangeRateCard } from "./components/ExchangeRateCard";
import { SourceToggle } from "./components/SourceToggle";
import { FavoritesBar } from "./components/FavoritesBar";
import { RateChart } from "./components/RateChart";
import { ConverterForm } from "./components/ConverterForm";

const CURRENCIES = ["USD", "EUR", "RUB", "KRW", "UZS"];

// Mock data for historical rates
const mockHistoricalData = Array.from({ length: 7 }, (_, i) => ({
  date: `May ${i + 1}`,
  rate: 12500 + Math.random() * 200,
}));

export default function RatesPage() {
  const [source, setSource] = useState("market");
  const [favorites, setFavorites] = useState<string[]>(["USD/UZS"]);
  const [rates, setRates] = useState<Record<string, number>>({
    USD: 12500,
    EUR: 13500,
    RUB: 140,
    KRW: 9.5,
  });

  // Mock API fetch based on source
  useEffect(() => {
    const fetchRates = async () => {
      // In a real app, fetch from different APIs based on source
      console.log(`Fetching ${source} rates...`);
      // Simulate API delay
      const timer = setTimeout(() => {
        setRates({
          USD: 12500 + Math.random() * 100,
          EUR: 13500 + Math.random() * 100,
          RUB: 140 + Math.random() * 5,
          KRW: 9.5 + Math.random() * 0.5,
        });
      }, 800);
      return () => clearTimeout(timer);
    };
    fetchRates();
  }, [source]);

  const handleConvert = (from: string, to: string, amount: number) => {
    console.log(`Converting ${amount} ${from} to ${to}`);
    // In a real app, perform the conversion and update state
  };

  const toggleFavorite = (pair: string) => {
    setFavorites((prev) =>
      prev.includes(pair)
        ? prev.filter((p) => p !== pair)
        : [...prev, pair]
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-display text-white mb-2">Exchange Rates</h1>
        <p className="text-gray-400 mb-8">Real-time currency conversion</p>

        <SourceToggle value={source} onChange={setSource} />

        <FavoritesBar favorites={favorites} onToggle={toggleFavorite} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(rates).map(([currency, rate]) => (
            <ExchangeRateCard
              key={currency}
              from={currency}
              to="UZS"
              rate={rate}
              source={source}
              isFavorite={favorites.includes(`${currency}/UZS`)}
              onToggleFavorite={() => toggleFavorite(`${currency}/UZS`)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RateChart data={mockHistoricalData} />
          <ConverterForm currencies={CURRENCIES} onConvert={handleConvert} />
        </div>
      </div>
    </div>
  );
}