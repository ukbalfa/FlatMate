'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Roommate } from '../types';

export function useRoommates(flatId: string | undefined) {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users'),
            where('flatId', '==', flatId),
            orderBy('createdAt', 'desc'),
          ),
        );
        if (!mounted) return;
        setRoommates(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate)));
      } catch (err) {
        if (!mounted) return;
        logError(err, 'useRoommates');
        setError(err instanceof Error ? err : new Error('Failed to load roommates'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [flatId]);

  return { roommates, loading, error };
}
