'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { CleaningTask } from '../types';

export function useCleaningTasks(flatId: string | undefined, weekStart: string) {
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'cleaning'),
      where('flatId', '==', flatId),
      where('weekStart', '==', weekStart),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCleaningTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CleaningTask)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useCleaningTasks');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId, weekStart]);

  return { cleaningTasks, loading, error };
}
