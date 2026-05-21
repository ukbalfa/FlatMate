'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Settlement, Expense, Roommate } from '../types';

interface SettlementsData {
  settlements: Settlement[];
  expenses: Expense[];
  users: Roommate[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function getNextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) return month;
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, '0')}`;
}

export function useSettlements(flatId: string | undefined, month: string): SettlementsData {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const nextMonth = getNextMonth(month);
        const [usersSnap, expensesSnap, settlementsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'users'),
              where('flatId', '==', flatId),
              orderBy('createdAt', 'desc'),
            ),
          ),
          getDocs(
            query(
              collection(db, 'expenses'),
              where('flatId', '==', flatId),
              where('date', '>=', `${month}-01`),
              where('date', '<', `${nextMonth}-01`),
              orderBy('date', 'desc'),
              limit(200),
            ),
          ),
          getDocs(
            query(
              collection(db, 'settlements'),
              where('flatId', '==', flatId),
              where('date', '>=', `${month}-01`),
              where('date', '<', `${nextMonth}-01`),
              orderBy('date', 'desc'),
              limit(100),
            ),
          ),
        ]);

        if (!mounted) return;
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate)));
        setExpenses(expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
        setSettlements(settlementsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement)));
      } catch (err) {
        if (!mounted) return;
        logError(err, 'useSettlements');
        setError(err instanceof Error ? err : new Error('Failed to load settlements'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [flatId, month, tick]);

  return { settlements, expenses, users, loading, error, refetch };
}
