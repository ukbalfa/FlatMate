'use client';
import { useI18n } from '../../../context/I18nContext';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

const PAIRS = [
  { base: 'USD', quote: 'UZS' },
  { base: 'EUR', quote: 'UZS' },
  { base: 'RUB', quote: 'UZS' },
  { base: 'KRW', quote: 'UZS' },
];

const CURRENCIES = ['USD', 'EUR', 'RUB', 'KRW', 'UZS'];

interface RateData {
  rates?: Record<string, number>;
  result?: string;
  time_last_update_unix?: number;
}

function getPairRate(data: RateData | null, base: string, quote: string) {
  if (!data || !data.rates) return null;
  if (base === 'USD') return data.rates[quote];
  if (!data.rates[base]) return null;
  const quoteRate = data.rates[quote];
  const baseRate = data.rates[base];
  if (quoteRate === undefined || baseRate === undefined) return null;
  return quoteRate / baseRate;
}

const CACHE_KEY = 'cached_rates_today';
const YESTERDAY_CACHE_KEY = 'cached_rates_yesterday';

function getTodayCache(): RateData | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const cachedDate = new Date(parsed.timestamp).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    if (cachedDate !== todayDate) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export default function RatesPage() {
  const { t } = useI18n();
  const [today, setToday] = useState<RateData | null>(null);
  const [yesterday, setYesterday] = useState<RateData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('UZS');
  const [fromAmount, setFromAmount] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  const fetchFreshRates = async () => {
    let currentToday = null;
    let currentYesterday = null;
    let fetchSucceeded = false;

    try {
      const timeout = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined;
      const resToday = await fetch('https://open.er-api.com/v6/latest/USD', { signal: timeout });
      if (!resToday.ok) throw new Error(`HTTP ${resToday.status}`);
      const dataToday = await resToday.json();
      currentToday = dataToday;
      fetchSucceeded = true;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: dataToday, timestamp: Date.now() }));
      setIsOffline(false);

      if (dataToday.time_last_update_unix) {
        const lastUpdateDate = new Date(dataToday.time_last_update_unix * 1000);
        setLastUpdated(lastUpdateDate.toLocaleString());
      }
    } catch {
      setIsOffline(true);
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const dateStr = yesterdayDate.toISOString().split('T')[0];

    try {
      const timeout = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined;
      const resYesterday = await fetch(`https://open.er-api.com/v6/history/USD/${dateStr}`, { signal: timeout });
      if (!resYesterday.ok) throw new Error(`HTTP ${resYesterday.status}`);
      const dataYesterday = await resYesterday.json();
      if (dataYesterday.result === 'success') {
        currentYesterday = dataYesterday;
        localStorage.setItem(YESTERDAY_CACHE_KEY, JSON.stringify(dataYesterday));
      }
    } catch {
      const cached = localStorage.getItem(YESTERDAY_CACHE_KEY);
      if (cached) {
        try {
          currentYesterday = JSON.parse(cached);
        } catch {
          currentYesterday = null;
        }
      }
    }

    if (fetchSucceeded) {
      if (currentToday) setToday(currentToday);
      setYesterday(currentYesterday);
      setIsCached(false);
    } else {
      if (currentToday) {
        setToday(currentToday);
        setYesterday(currentYesterday);
        setIsCached(false);
      } else {
        setIsCached(true);
      }
    }
    setLoading(false);
  };

  const fetchRates = async () => {
    const cached = getTodayCache();
    if (cached) {
      setToday(cached);
      setIsCached(true);
      setLoading(false);

      if (cached.time_last_update_unix) {
        const lastUpdateDate = new Date(cached.time_last_update_unix * 1000);
        setLastUpdated(lastUpdateDate.toLocaleString());
      }

      const cachedYesterday = localStorage.getItem(YESTERDAY_CACHE_KEY);
      if (cachedYesterday) {
        try {
          setYesterday(JSON.parse(cachedYesterday));
        } catch {
          // ignore
        }
      }
    }

    fetchFreshRates();
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const toAmount = (() => {
    if (!fromAmount || !today || !today.rates) return '';
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount === 0) return '';
    const rate = getPairRate(today, fromCurrency, toCurrency);
    if (!rate) return '';
    return (amount * rate).toFixed(2);
  })();

  return (
    <div className="text-[#1C1400] dark:text-[#FFF5DC]">
      <div className="flex gap-6 items-stretch">
        <div className="flex-1">
          <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#1C1400] dark:text-[#FFF5DC]">{t('rates.title')}</h2>
                {!loading && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isCached ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'}`}>
                    {isCached ? 'Cached' : 'Live'}
                  </span>
                )}
                {isOffline && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Offline
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Updates every 10 min</span>
            </div>

            <div>
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-white/[0.05] animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-white/[0.05] rounded w-20"></div>
                      <div className="h-4 bg-gray-200 dark:bg-white/[0.05] rounded w-24"></div>
                      <div className="h-4 bg-gray-200 dark:bg-white/[0.05] rounded w-16"></div>
                    </div>
                  ))}
                </>
              ) : (
                PAIRS.map((pair, i) => {
                const rate = getPairRate(today, pair.base, pair.quote);
                const yesterdayRate = getPairRate(yesterday, pair.base, pair.quote);
                
                let changePercent = null;
                let isPositive = false;
                if (rate && yesterdayRate) {
                  changePercent = ((rate - yesterdayRate) / yesterdayRate) * 100;
                  isPositive = changePercent > 0;
                }
                
                const isLast = i === PAIRS.length - 1;

                return (
                  <div
                    key={pair.base + pair.quote}
                    className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-gray-200 dark:border-white/[0.05]' : ''}`}
                  >
                    <div className="font-medium">{pair.base}/{pair.quote}</div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {rate ? rate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    </div>
                    <div>
                      {changePercent !== null ? (
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">{t('rates.noComparison')}</span>
                      )}
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {lastUpdated && (
              <div className="mt-4 text-right">
                <span className="text-xs text-gray-400 dark:text-gray-500">Last updated: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] text-[#1C1400] dark:text-white rounded-xl p-6 overflow-hidden h-full flex flex-col justify-between">
            <h3 className="text-lg font-semibold mb-6 text-[#1C1400] dark:text-[#FFF5DC]">Currency Converter</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">{t('rates.iWantToSell')}</label>
                <div className="flex w-full items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] text-[#1C1400] dark:text-white px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] text-[#1C1400] dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option className="bg-white dark:bg-[#2A1E00]" key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleSwap}
                  className="bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#1C1400] dark:text-gray-400" />
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">{t('rates.iWillReceive')}</label>
                <div className="flex w-full items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 min-w-0 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] text-[#1C1400] dark:text-white px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] text-[#1C1400] dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option className="bg-white dark:bg-[#2A1E00]" key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
