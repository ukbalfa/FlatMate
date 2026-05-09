"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";

interface ConverterFormProps {
  currencies: string[];
  onConvert: (from: string, to: string, amount: number) => void;
}

export const ConverterForm = ({ currencies, onConvert }: ConverterFormProps) => {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("UZS");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const handleConvert = () => {
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && amountNum > 0) {
      onConvert(fromCurrency, toCurrency, amountNum);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Mock conversion for demo
  useEffect(() => {
    if (amount) {
      const mockRate = 12500; // USD to UZS mock rate
      setResult(parseFloat(amount) * mockRate);
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-display text-white mb-4">Currency Converter</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.00"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-gold-400"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency} className="bg-[#0A0A12]">
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="w-full py-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition"
        >
          <ArrowUpDown size={16} className="text-gray-300" />
          <span className="text-gray-300 text-sm">Swap Currencies</span>
        </button>

        <div>
          <label className="text-sm text-gray-300 block mb-1">To</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result ? result.toFixed(2) : ""}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency} className="bg-[#0A0A12]">
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleConvert}
          className="w-full py-2 bg-gold-400 text-[#0A0A12] rounded-lg font-medium hover:bg-gold-300 transition mt-4"
        >
          Convert
        </button>
      </div>
    </div>
  );
};