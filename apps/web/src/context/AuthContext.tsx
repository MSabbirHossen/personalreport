import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from '../config/firebase.js';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  roles: string[];
  orgId?: string;
  profile?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncBackendUser = async (token: string) => {
    localStorage.setItem('auth_token', token);
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
  };

  useEffect(() => {
    if (!auth) {
      // Firebase not configured yet — check local token or set initial dev user if token exists
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        api.getMe()
          .then((res) => setUser(res.user))
          .catch(() => {
            if (import.meta.env.DEV) {
              setUser({
                id: 'mock_user_123',
                name: 'মো. সাব্বির হোসেন',
                email: 'sabbir@report-bps.org',
                roles: ['student'],
                orgId: 'org_default',
              });
            } else {
              setUser(null);
            }
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    // Real Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await syncBackendUser(idToken);
        } catch (err) {
          console.error('Error getting Firebase token:', err);
          setUser(null);
        }
      } else {
        const localToken = localStorage.getItem('auth_token');
        if (import.meta.env.DEV && localToken === 'mock-token') {
          // Keep demo login if in demo mode
          try {
            const res = await api.getMe();
            setUser(res.user);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured yet.');
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const token = await result.user.getIdToken();
    await syncBackendUser(token);
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase Google Auth is not configured yet.');
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    await syncBackendUser(token);
  };

  const loginDemo = async () => {
    if (!import.meta.env.DEV) {
      console.warn('Demo login is strictly disabled in production.');
      return;
    }
    localStorage.setItem('auth_token', 'mock-token');
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      setUser({
        id: 'mock_user_123',
        name: 'মো. সাব্বির হোসেন',
        email: 'student@report-bps.org',
        roles: ['student'],
        orgId: 'org_default',
      });
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const res = await api.getMe();
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        loginWithGoogle,
        loginDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
