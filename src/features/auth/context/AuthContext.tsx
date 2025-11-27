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
    // --- PWA AUTH FIX: BROADCAST CHANNEL ---
    // The main app window listens for a success message from the temporary auth tab.
    const authChannel = new BroadcastChannel('auth-channel');
    const handleAuthSuccess = (event: MessageEvent) => {
        if (event.data === 'auth-success') {
            // When the PWA receives the signal, it reloads itself,
            // correctly entering standalone mode with the new session.
            window.location.reload();
        }
    };
    authChannel.addEventListener('message', handleAuthSuccess);
    // --- END PWA AUTH FIX ---

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        // --- PWA AUTH FIX: OAUTH SIGN-IN HANDLER ---
        // This logic runs in the temporary auth window/tab after Google sign-in.
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
            // It signals the main PWA window to reload and then closes itself.
            const channel = new BroadcastChannel('auth-channel');
            channel.postMessage('auth-success');
            channel.close();
            // A small delay helps ensure the message is sent before the window closes.
            setTimeout(() => {
                window.close();
            }, 100);
            return; // Stop further execution in this temporary tab.
        }
        // --- END PWA AUTH FIX ---

        // This logic below runs in the main app window on normal startup and after the reload.
        setSession(session);

        if (session?.user) {
            let finalUser = session.user;
            // If the user signed in with Google and doesn't have an avatar, set a default one.
            if (session.user.app_metadata.provider === 'google' && !session.user.user_metadata.avatar_url) {
                const { data, error } = await supabase.auth.updateUser({
                    data: { 
                        avatar_url: defaultAvatar,
                    }
                });
                if (data.user) finalUser = data.user;
                if(error) console.error('Error updating user metadata:', error);
            }
            setUser(finalUser);
        } else {
            setUser(null);
        }
    });

    return () => {
      subscription?.unsubscribe();
      // --- PWA AUTH FIX: CLEANUP ---
      authChannel.removeEventListener('message', handleAuthSuccess);
      authChannel.close();
      // --- END PWA AUTH FIX ---
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (data.user) {
        setUser(data.user);
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }
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
