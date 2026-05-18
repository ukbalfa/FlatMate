'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../errorLogger';
import type { Announcement } from '../types';

interface AnnouncementWithId extends Announcement {
  id: string;
}

export function useAnnouncements(flatId: string | undefined) {
  const [announcements, setAnnouncements] = useState<AnnouncementWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flatId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'announcements'),
      where('flatId', '==', flatId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnnouncementWithId));
        const sorted = [...data].sort((a, b) => {
          if (a.isPinned === b.isPinned) return 0;
          return a.isPinned ? -1 : 1;
        });
        setAnnouncements(sorted);
        setLoading(false);
      },
      (err) => {
        logError(err, 'useAnnouncements');
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [flatId]);

  return { announcements, loading, error };
}
