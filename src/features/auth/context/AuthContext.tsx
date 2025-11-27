import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import defaultAvatar from '../../../assets/default-avatar.svg';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- ROBUST PWA AUTH FIX: STORAGE EVENT LISTENER ---
    // This listener runs in the main PWA window.
    const handleStorageChange = (event: StorageEvent) => {
      // The Supabase client library writes the session to localStorage. We listen for that.
      // The key is formatted like 'sb-PROJECT_REF-auth-token'.
      if (event.key?.includes('auth-token') && event.newValue) {
        // When the auth token appears in storage, it means the auth popup was successful.
        // We force a reload of this main PWA window to apply the new session
        // and correctly re-render the PWA in its standalone mode.
        console.log('Auth token changed in storage, reloading PWA...');
        window.location.reload();
      }
    };
    // We listen to the 'storage' event on the window object.
    window.addEventListener('storage', handleStorageChange);
    // --- END PWA AUTH FIX ---

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // This logic now runs in TWO contexts: the main PWA and the auth popup.

      // In the auth popup, after Google redirect, the event is SIGNED_IN.
      // Its ONLY job is to close itself. The 'storage' event will notify the main PWA.
      // `window.opener` is a reliable way to check if the window is a popup.
      if (event === 'SIGNED_IN' && window.opener) {
        window.close();
        return;
      }

      // In the main PWA, this listener updates the state as normal on initial load and subsequent changes.
      setSession(session);
      if (session?.user) {
        let finalUser = session.user;
        if (session.user.app_metadata.provider === 'google' && !session.user.user_metadata.avatar_url) {
          const { data, error } = await supabase.auth.updateUser({
            data: { avatar_url: defaultAvatar }
          });
          if (data.user) finalUser = data.user;
          if (error) console.error('Error updating user metadata:', error);
        }
        setUser(finalUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
      // --- PWA AUTH FIX: CLEANUP ---
      window.removeEventListener('storage', handleStorageChange);
      // --- END PWA AUTH FIX ---
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
