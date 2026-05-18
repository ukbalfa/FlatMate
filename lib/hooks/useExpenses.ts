'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Expense } from '../types';

export function useExpenses(flatId: string | undefined, limitCount = 50) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('flatId', '==', flatId),
      orderBy('date', 'desc'),
      limit(limitCount),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useExpenses');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId, limitCount]);

  return { expenses, loading, error };
}
