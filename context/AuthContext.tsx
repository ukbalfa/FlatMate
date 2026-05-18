'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logError } from '../lib/errorLogger';
import type { UserProfile } from '../lib/types';

const PROFILE_STORAGE_KEY = 'user';

function getCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: UserProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  showFlatModal: boolean;
  setShowFlatModal: (show: boolean) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  showFlatModal: false,
  setShowFlatModal: () => {},
  refreshUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getCachedProfile);
  const [loading, setLoading] = useState(!getCachedProfile());
  const [showFlatModal, setShowFlatModal] = useState(false);

  const refreshUserProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const profile = docSnap.exists()
        ? ({ uid: user.uid, ...docSnap.data() } as UserProfile)
        : { uid: user.uid, username: user.email || 'Unknown' };
      setUserProfile(profile);
      setCachedProfile(profile);
    } catch (error) {
      logError(error, 'AuthContext.refreshUserProfile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          const profile = docSnap.exists()
            ? ({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile)
            : { uid: firebaseUser.uid, username: firebaseUser.email || 'Unknown' };
          setUserProfile(profile);
          setCachedProfile(profile);
          if (profile.flatId) {
            try {
              const tokenResult = await firebaseUser.getIdTokenResult();
              if (!tokenResult.claims.flatId) {
                const idToken = await firebaseUser.getIdToken();
                await fetch('/api/auth/set-flat-claim', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken, flatId: profile.flatId }),
                });
                await firebaseUser.getIdToken(true);
              }
            } catch {
              // Non-critical — claim will sync on next login
            }
          }
        } catch (error) {
          logError(error, 'AuthContext');
          const fallback = { uid: firebaseUser.uid, username: firebaseUser.email || 'Unknown' };
          setUserProfile(fallback);
          setCachedProfile(fallback);
        }
      } else {
        setUserProfile(null);
        setCachedProfile(null);
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, showFlatModal, setShowFlatModal, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
