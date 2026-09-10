import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { getStoredToken, setStoredToken, removeStoredToken, apiRequest } from '../lib/api.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyExistingToken() {
      const stored = getStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setToken(stored);
          } else {
            removeStoredToken();
            setToken(null);
          }
        } else {
          removeStoredToken();
          setToken(null);
        }
      } catch (err) {
        console.warn('Failed to verify token:', err);
        removeStoredToken();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    verifyExistingToken();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Google login verification failed');
      }
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    try {
      firebaseSignOut(auth);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
