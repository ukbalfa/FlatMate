'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Task } from '../types';

export function useTasks(flatId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('flatId', '==', flatId),
      orderBy('dueDate', 'desc'),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
        setLoading(false);
      },
      (err) => {
        logError(err, 'useTasks');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId]);

  return { tasks, loading, error };
}
