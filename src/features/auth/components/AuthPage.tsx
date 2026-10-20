import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STARTER_DIAGNOSTIC_QUESTIONS } from '@/features/quiz/data/starterDiagnosticQuestions';
import { triggerHaptic } from '@/lib/haptics';

/**
 * Props for the AuthPage component.
 */
interface AuthPageProps {
  onBack?: () => void;
}

/**
 * Authentication page component handling Sign In flow.
// IMPORTANT:
//
// MindFlow is hosted on GitHub Pages and uses React HashRouter.
//
// OAuth callbacks must return to "#/" rather than "/?".
// Otherwise the OAuth callback hash can conflict with HashRouter,
// causing route fallback loops before the session is restored.
//
// Do not change this without testing the complete OAuth flow.
//
// See Navigation Architecture document.
 * That comment can save hours of debugging later if someone (or future you) is tempted to "simplify" the URL.
 * Supports:
 * - Email/Password authentication.
 * - Google OAuth sign-in.
 * - Form validation (matching passwords, required fields).
 *
 * @param {AuthPageProps} props - The component props.
 * @returns {JSX.Element} The rendered authentication page.
 */
const AuthPage: React.FC<AuthPageProps> = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoLanguage, setDemoLanguage] = useState<'en'|'hi'>('en');
  const [demoSelectedOption, setDemoSelectedOption] = useState<string | null>(null);
  const [demoScore, setDemoScore] = useState(0);
  const [demoFinished, setDemoFinished] = useState(false);

  const demoQuestions = [STARTER_DIAGNOSTIC_QUESTIONS[7], STARTER_DIAGNOSTIC_QUESTIONS[8], STARTER_DIAGNOSTIC_QUESTIONS[9]];
  const currentDemoQuestion = demoQuestions[demoIndex];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  /**
   * Validates the form inputs before submission.
   * @returns {boolean} True if the form is valid, false otherwise.
   */
  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return false;
    }
    setError(null);
    return true;
  };

  /**
   * Handles the form submission for Sign In.
   * @param {React.FormEvent} e - The form event.
   */
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!validateForm()) return;

    setIsEmailLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
            throw new Error("Invalid email or password. Please try again.");
        }
        throw signInError;
      }

      if (data.session) {
         triggerHaptic('success');
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      triggerHaptic('error');
      setIsEmailLoading(false);
    }
  };

  /**
   * Handles Google OAuth sign-in.
   */
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;
        triggerHaptic('success');

      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        setError(err.message || 'Google sign in failed');
        triggerHaptic('error');
        setIsGoogleLoading(false);
      }
    } else {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + window.location.pathname + '#/'
            }
          });
          if (error) throw error;

          // DO NOT set isGoogleLoading to false here.
          // The page will redirect before the promise resolves.
          // If you set it to false, the loading spinner will disappear
          // just before the redirect happens, causing a UI flicker back to the "Sign in" button.

        } catch (err: any) {
          setError(err.message || 'Google sign in failed');
          setIsGoogleLoading(false);
        }
    }
  };

  return (
    <>
    <div className="min-h-[100dvh] w-full px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
             style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
        ></div>

       <div className="w-full max-w-md relative z-10 bg-white dark:bg-slate-900/80 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl">
           <div className="flex justify-center items-center gap-2 mb-8">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <BrainCircuit className="h-8 w-8 text-white" />
             </div>
             <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">MindFlow</span>
           </div>

           <div className="text-center mb-8">
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
               <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                   New to MindFlow?{' '}
                   <button onClick={() => navigate('/signup')} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                       CREATE ACCOUNT
                   </button>
               </p>
           </div>

           {/* Primary: Google Button */}
           <div className="mb-6">
             <button
               type="button"
               onClick={handleGoogleSignIn}
               disabled={isEmailLoading || isGoogleLoading}
               className={`w-full group relative flex justify-center items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-300 shadow-sm overflow-hidden ${isEmailLoading ? 'opacity-50 cursor-not-allowed' : (isGoogleLoading ? 'cursor-wait' : '')}`}
             >
               {isGoogleLoading ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin relative z-10 text-indigo-600 dark:text-indigo-400" />
                   <span className="relative z-10 font-bold">Signing in with Google...</span>
                 </>
               ) : (
                 <>
                   <motion.div
                     initial={{ rotate: 0 }}
                     whileHover={{ rotate: 10, scale: 1.1 }}
                     transition={{ type: "spring", stiffness: 300 }}
                     className="relative z-10 flex items-center justify-center bg-transparent p-1 rounded-full"
                   >
                     <svg className="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path></svg>
                   </motion.div>
                   <span className="relative z-10 font-bold tracking-wide">Sign in with Google</span>
                 </>
               )}
             </button>
           </div>
           <div className="text-center mt-3 mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to our <a href="#/about/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>, <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a> and Cookie Use.
              </p>
           </div>


           <button
             onClick={() => setShowDemo(true)}
             className="w-full group flex justify-center items-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
           >
             <span>⚡ Try 3 Sample Questions First</span>
           </button>

           <div className="relative mb-6">
             <div aria-hidden="true" className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
             <div className="relative flex justify-center text-sm"><span className="px-4 bg-[#F5F7FF] dark:bg-slate-900 text-gray-500">Or continue with email</span></div>
           </div>

           <form onSubmit={handleAuthAction} className="space-y-4 md:space-y-6">
             <div>
               <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2" htmlFor="email">Email</label>
               <input
                 id="email"
                 name="email"
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com"
                 className="block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
               />
             </div>
             <div>
               <div className="flex justify-between items-baseline mb-2">
                 <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200" htmlFor="password">Password</label>
                 <a href="#!" onClick={() => alert('Forgot password functionality to be implemented')} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Forgot Password?</a>
               </div>
               <div className="relative">
                 <input
                   id="password"
                   name="password"
                   type={showPassword ? 'text' : 'password'}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="block w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                   {showPassword ? (
                     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" /></svg>
                   ) : (
                     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd"></path></svg>
                   )}
                 </button>
               </div>
             </div>

             {error && <p className="text-sm text-red-500 text-center">{error}</p>}
             {message && <p className="text-sm text-green-500 text-center">{message}</p>}
             <div>
               <button
                 type="submit"
                 disabled={isEmailLoading || isGoogleLoading}
                 className={`w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-300 shadow-sm overflow-hidden ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : (isEmailLoading ? 'cursor-wait' : '')}`}
               >
                 {isEmailLoading ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                     <span className="relative z-10">Signing In...</span>
                   </>
                 ) : (
                   <>
                     <span className="relative z-10">Sign In</span>
                     <motion.svg
                       className="w-5 h-5 relative z-10"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                       initial={{ x: 0 }}
                       animate={{ x: [0, 4, 0] }}
                       transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </motion.svg>
                   </>
                 )}
               </button>
             </div>

             <div className="text-center mt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    By continuing, you agree to our <a href="#/about/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>, <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a> and Cookie Use.
                </p>
             </div>
           </form>
       </div>
    </div>

      {/* 3-Question Micro-Demo Drawer */}
      <AnimatePresence>
        {showDemo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemo(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Question {demoIndex + 1} of 3
                  </span>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setDemoLanguage(demoLanguage === 'en' ? 'hi' : 'en')}
                      className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300"
                    >
                      {demoLanguage === 'en' ? 'EN' : 'हिं'}
                    </button>
                    <button onClick={() => setShowDemo(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>

                {!demoFinished ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {demoLanguage === 'en' ? currentDemoQuestion.question : (currentDemoQuestion.question_hi || currentDemoQuestion.question)}
                    </h2>

                    <div className="flex flex-col gap-3 mt-4">
                      {currentDemoQuestion.options.map((opt, idx) => {
                        const isSelected = demoSelectedOption === opt;
                        const isCorrect = opt === currentDemoQuestion.correct;
                        const displayOpt = demoLanguage === 'en' ? opt : (currentDemoQuestion.options_hi?.[idx] || opt);

                        let btnClass = "text-left px-4 py-3 rounded-xl border font-medium transition-colors ";
                        if (!demoSelectedOption) {
                          btnClass += "border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300";
                        } else {
                          if (isCorrect) {
                            btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300";
                          } else if (isSelected) {
                            btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300";
                          } else {
                            btnClass += "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={!!demoSelectedOption}
                            onClick={() => {
                              setDemoSelectedOption(opt);
                              if (isCorrect) {
                                setDemoScore(s => s + 1);
                                triggerHaptic('success');
                              } else {
                                triggerHaptic('error');
                              }
                            }}
                            className={btnClass}
                          >
                            {String.fromCharCode(65 + idx)}. {displayOpt}
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {demoSelectedOption && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50"
                        >
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Explanation</span>
                             <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                               {currentDemoQuestion.sourceInfo.examName}
                             </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {currentDemoQuestion.explanation.summary}
                          </p>
                          {currentDemoQuestion.explanation.fact && (
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium flex gap-2 items-start">
                              <span className="text-lg leading-none">💡</span>
                              {currentDemoQuestion.explanation.fact}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              if (demoIndex < 2) {
                                setDemoIndex(i => i + 1);
                                setDemoSelectedOption(null);
                              } else {
                                setDemoFinished(true);
                              }
                            }}
                            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
                          >
                            {demoIndex < 2 ? 'Next Question ->' : 'See Your Score ->'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                      You scored {demoScore}/3!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                      Save Your Score & Unlock 10,000+ PYQs
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowDemo(false);
                          handleGoogleSignIn();
                        }}
                        disabled={isGoogleLoading || isEmailLoading}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${(isGoogleLoading || isEmailLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isGoogleLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Signing in with Google...</span>
                          </>
                        ) : (
                          "Sign in with Google"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowDemo(false);
                          navigate('/signup');
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors"
                      >
                        Sign up with Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </>
 );
};

export default AuthPage;
