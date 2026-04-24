'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isOnline: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOnline: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
        error
      } = await supabase.auth.getUser();

      if (error) {
        // If it's a network error (Failed to fetch), don't log out
        if (error.message?.includes('FetchError') || error.message?.includes('Failed to fetch')) {
          console.log('Network error detected, maintaining current session');
          return;
        }
        setUser(null);
        return;
      }

      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
           // If we can't fetch profile due to network, don't clear user yet
           if (profileError.message?.includes('Failed to fetch')) return;
           setUser(null);
        } else {
           setUser(profile);
        }
      } else {
        setUser(null);
      }
    } catch (err: any) {
      // Catch blocks for network errors
      if (err.message?.includes('Failed to fetch')) {
        console.log('Caught network error in AuthProvider');
        return;
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Listen for auth state changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, isOnline, refreshUser: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
