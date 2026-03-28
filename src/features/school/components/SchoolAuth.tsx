import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

interface SchoolAuthProps {
  onAuthSuccess: () => void;
}

export const SchoolAuth: React.FC<SchoolAuthProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        localStorage.setItem('mindflow_is_signup', 'true');
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              target_audience: 'school'
            },
          },
        });
        if (error) throw error;
        if (data.user && data.session) {
          onAuthSuccess();
        } else {
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectURL = import.meta.env.PROD
        ? 'https://aklabx.github.io/MindFlow/?'
        : 'http://localhost:3000';

      if (isSignUp) {
        localStorage.setItem('mindflow_is_signup', 'true');
      }
      // Force redirect back to school module after OAuth
      localStorage.setItem('mindflow_auth_redirect', '/school/dashboard');
      localStorage.setItem('mindflow_target_audience_intent', 'school');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectURL,
        }
      });
      if (error) throw error;
      // Note: This triggers a redirect or popup, auth state will be handled by AuthContext
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-500/5">
        <div className="flex justify-center items-center gap-2 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">MindFlow</span>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg shadow-sm">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">School</span>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 md:mb-8 text-center">
          <button onClick={() => setIsSignUp(false)} className={`w-1/2 pb-3 font-bold transition-colors ${!isSignUp ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Sign In</button>
          <button onClick={() => setIsSignUp(true)} className={`w-1/2 pb-3 font-semibold transition-colors ${isSignUp ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4 md:space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Student Name"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd"></path></svg>
                )}
              </button>
            </div>
          </div>
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
          {message && <p className="text-sm text-emerald-500 text-center">{message}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div aria-hidden="true" className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-900 text-slate-400">Or</span></div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path></svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
