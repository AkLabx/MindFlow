
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
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
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
