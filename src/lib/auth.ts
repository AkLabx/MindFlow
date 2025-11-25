import { supabase } from './supabase';
import { type AuthError, type User, type SignInWithPasswordCredentials, type SignUpWithPasswordCredentials } from '@supabase/supabase-js';

export const signUpWithEmail = async (credentials: SignUpWithPasswordCredentials) => {
  const { error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
};

export const signInWithEmail = async (credentials: SignInWithPasswordCredentials) => {
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// TODO: Implement a listener for auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
};
