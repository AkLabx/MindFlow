import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import defaultAvatar from '../../../assets/default-avatar.svg';

/**
 * Interface for the Auth Context value.
 */
interface AuthContextType {
  /** The current Supabase session, or null if not authenticated. */
  session: Session | null;
  /** The current authenticated user object, or null. */
  user: User | null;
  /** True if the initial session check is still in progress. */
  loading: boolean;
  /** Function to sign out the current user. */
  signOut: () => Promise<void>;
  /** Function to manually refresh user data from the server. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for Supabase Authentication.
 *
 * Manages the authentication lifecycle, including:
 * - Initial session recovery.
 * - Listening for auth state changes (sign in, sign out).
 * - Handling PWA-specific authentication flow where auth might happen in a popup or separate window.
 * - Ensuring the user has a default avatar if one is missing (e.g., for Google auth).
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} The AuthContext Provider.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- ROBUST PWA AUTH FIX: STORAGE EVENT LISTENER ---
    // This listener runs in the main PWA window to detect successful login in a secondary window/popup.
    const handleStorageChange = (event: StorageEvent) => {
      // The Supabase client library writes the session to localStorage. We listen for that.
      // The key contains 'auth-token'.
      if (event.key?.includes('auth-token') && event.newValue) {
        // When the auth token appears in storage, it means the auth popup was successful.
        // We force a reload of this main PWA window to apply the new session.
        console.log('Auth token changed in storage, reloading PWA...');
        window.location.reload();
      }
    };
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
      // This logic runs in both the main app and the auth popup.

      // If we are in the auth popup (opened by Google OAuth), close it after successful sign-in.
      if (event === 'SIGNED_IN' && window.opener) {
        window.close();
        return;
      }

      // Normal state update for the main application window
      setSession(session);
      if (session?.user) {
        let finalUser = session.user;
        // Fix for Google auth sometimes missing avatar_url in user_metadata
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
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /** Signs out the current user. */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /** Refreshes the user object from Supabase. */
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

/**
 * Custom hook to access the authentication context.
 *
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
