'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { logError } from '../lib/errorLogger';
import type { Notification } from '../lib/types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {},
  createNotification: async () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [notificationsState, setNotificationsState] = useState<{
    uid: string | null;
    items: Notification[];
  }>({ uid: null, items: [] });

  useEffect(() => {
    if (!userProfile?.uid) {
      return;
    }

    const uid = userProfile.uid;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotificationsState({ uid, items: data });
      },
      (error) => {
        logError(error, 'NotificationsContext.load');
      }
    );

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      logError(error, 'NotificationsContext.markAsRead');
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = activeNotifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        )
      );
    } catch (error) {
      logError(error, 'NotificationsContext.markAllAsRead');
    }
  };

  const clearAll = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userProfile?.uid)
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, 'notifications', d.id))));
    } catch (error) {
      logError(error, 'NotificationsContext.clearAll');
    }
  };

  const createNotification = async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      logError(error, 'NotificationsContext.create');
    }
  };

  const activeNotifications =
    userProfile?.uid && userProfile.uid === notificationsState.uid
      ? notificationsState.items
      : [];
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications: activeNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        createNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
