import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const minLoadTimer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 300);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        // Clear any stale session data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        setLoading(false);
        setMinLoadingTime(false);
        return;
      }

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      // Clear any stale session data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      setLoading(false);
      setMinLoadingTime(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user && !isSigningOut) {
          setLoading(true);
          await fetchUserProfile(session.user.id);
        } else if (!session) {
          setUser(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      clearTimeout(minLoadTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching user profile:', error);
        // Don't sign out on fetch errors, just clear state
        setUser(null);
        setLoading(false);
        setMinLoadingTime(false);
        return;
      }

      if (!data) {
        console.log('Profile not found for authenticated user - signing out');
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setLoading(false);
        setMinLoadingTime(false);
        return;
      }

      setUser({
        id: data.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        role: data.role,
        profile_photo: data.profile_photo,
        profession: data.profession,
        job_status: data.job_status,
        show_status_ring: data.show_status_ring,
        created_at: data.created_at,
      });
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      // On abort or network error, just clear state
      setUser(null);
      setLoading(false);
      setMinLoadingTime(false);
    }
  };

  const signIn = async (emailOrPhone: string, password: string) => {
    // Check if input is email or phone
    const isEmail = emailOrPhone.includes('@');

    let loginEmail = emailOrPhone;

    if (!isEmail) {
      // For phone login, convert to the email format we used during signup
      const phoneDigits = emailOrPhone.replace(/[^0-9]/g, '');
      loginEmail = `user_${phoneDigits}@kuki.app`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid credentials. Please check and try again.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'employer' | 'employee') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          role,
        });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    try {
      // Set signing out flag to prevent auth state change handlers
      setIsSigningOut(true);

      // Clear local state first
      setUser(null);

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'local' });

      // Clear all local storage items related to Supabase
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear hash and force reload to clear all state
      window.location.hash = '';
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear everything anyway
      setIsSigningOut(true);
      setUser(null);

      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      window.location.hash = '';
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const isLoading = loading || minLoadingTime;

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}