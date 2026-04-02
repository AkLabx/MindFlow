import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { BrainCircuit, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Props for the AuthPage component.
 */
interface AuthPageProps {
  /** Callback function to navigate back to the previous screen. */
  onBack: () => void;
}

/**
 * Authentication page component handling both Sign In and Sign Up flows.
 *
 * Supports:
 * - Email/Password authentication.
 * - Google OAuth sign-in.
 * - Form validation (matching passwords, required fields).
 * - Toggling between Login and Registration modes.
 *
 * @param {AuthPageProps} props - The component props.
 * @returns {JSX.Element} The rendered authentication page.
 */
const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  /**
   * Validates the form inputs before submission.
   * @returns {boolean} True if the form is valid, false otherwise.
   */
  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return false;
    }
    if (isSignUp) {
      if (!fullName) {
        setError("Full name is required.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (!ageConfirmed || !privacyConfirmed) {
        setError("Please confirm age and privacy policy to sign up.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  /**
   * Handles the form submission for Sign In or Sign Up.
   * @param {React.FormEvent} e - The form event.
   */
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isSignUp) {
        localStorage.setItem('mindflow_is_signup', 'true');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates the Google OAuth sign-in flow.
   * Handles redirection URL based on the environment (prod vs dev).
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Correctly configure the redirect URL for GitHub Pages production or local dev
      const redirectURL = import.meta.env.PROD
        ? 'https://aklabx.github.io/MindFlow/?'
        : 'http://localhost:3000';

      if (isSignUp) {
        localStorage.setItem('mindflow_is_signup', 'true');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectURL,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-text-main antialiased relative w-full flex flex-col animate-fade-in py-4 flex-1 px-4 sm:px-6 lg:px-8">

        <button
         onClick={onBack}
         className="self-start mb-4 z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30"
         title="Back to Dashboard"
       >
         <ArrowLeft className="w-5 h-5" />
       </button>
       <div className="flex-1 flex items-center justify-center pb-8 relative z-10 w-full">
       <div className="w-full max-w-md">
         <div className="relative group rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden">
           {/* Glow Background Layer */}
           <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
           <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

           {/* Interactive Inner Shadow / Border */}
           <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300"></div>

           <div className="relative z-20 bg-transparent p-6 md:p-10">
           <div className="flex justify-center items-center gap-2 mb-6 md:mb-8">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <BrainCircuit className="h-6 w-6 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">MindFlow</span>
           </div>
           <div className="flex border-b border-border-color mb-6 md:mb-8 text-center">
             <button onClick={() => setIsSignUp(false)} className={`w-1/2 pb-3 font-bold ${!isSignUp ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-text-secondary hover:text-text-main transition-colors'}`}>Sign In</button>
             <button onClick={() => setIsSignUp(true)} className={`w-1/2 pb-3 font-semibold ${isSignUp ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-text-secondary hover:text-text-main transition-colors'}`}>Sign Up</button>
           </div>
           <form onSubmit={handleAuthAction} className="space-y-4 md:space-y-6">
             {isSignUp && (
               <div>
                 <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="fullName">Full Name</label>
                 <input
                   id="fullName"
                   name="fullName"
                   type="text"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="John Doe"
                   className="block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-border-color rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                 />
               </div>
             )}
             <div>
               <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="email">Email</label>
               <input
                 id="email"
                 name="email"
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com"
                 className="block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-border-color rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
               />
             </div>
             <div>
               <div className="flex justify-between items-baseline mb-2">
                 <label className="block text-sm font-semibold text-text-main" htmlFor="password">Password</label>
                 {!isSignUp && <a href="#!" onClick={() => alert('Forgot password functionality to be implemented')} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Forgot Password?</a>}
               </div>
               <div className="relative">
                 <input
                   id="password"
                   name="password"
                   type={showPassword ? 'text' : 'password'}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="block w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-border-color rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-main">
                   {showPassword ? (
                     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" /></svg>
                   ) : (
                     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd"></path></svg>
                   )}
                 </button>
               </div>
             </div>
             {isSignUp && (
               <div>
                 <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="confirmPassword">Confirm Password</label>
                 <input
                   id="confirmPassword"
                   name="confirmPassword"
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   placeholder="••••••••"
                   className="block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-border-color rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                 />
               </div>
             )}

             {isSignUp && (
               <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2">
                 <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                   To create an account, please confirm the following:
                 </p>
                 <div className="space-y-3">
                   <label className="flex items-start gap-3 cursor-pointer group">
                     <div className="flex items-center h-5 mt-0.5">
                       <input
                         type="checkbox"
                         checked={ageConfirmed}
                         onChange={(e) => setAgeConfirmed(e.target.checked)}
                         className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                       />
                     </div>
                     <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                       I am 18 years of age or older.
                     </span>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer group">
                     <div className="flex items-center h-5 mt-0.5">
                       <input
                         type="checkbox"
                         checked={privacyConfirmed}
                         onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                         className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                       />
                     </div>
                     <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                       I agree to the{" "}
                       <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                         Privacy Policy
                       </a>.
                     </span>
                   </label>
                 </div>
               </div>
             )}
             {error && <p className="text-sm text-red-500 text-center">{error}</p>}
             {message && <p className="text-sm text-green-500 text-center">{message}</p>}
             <div>
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full group relative flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white transition-all duration-300 shadow-lg disabled:opacity-50 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-300 z-0 pointer-events-none"></div>
                 {loading ? (
                   <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                 ) : (
                   <>
                     <span className="relative z-10">{isSignUp ? 'Sign Up' : 'Sign In'}</span>
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
           </form>
           <div className="relative my-5 md:my-6">
             <div aria-hidden="true" className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-color"></div></div>
             <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800/0 text-text-secondary">Or</span></div>
           </div>
           <div>
             <button
               type="button"
               onClick={handleGoogleSignIn}
               disabled={loading}
               className="w-full group relative flex justify-center items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-xl border border-white/40 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white transition-all duration-300 shadow-sm disabled:opacity-50 overflow-hidden"
             >
               {loading ? (
                 <Loader2 className="w-5 h-5 animate-spin relative z-10" />
               ) : (
                 <>
                   <motion.div
                     initial={{ rotate: 0 }}
                     whileHover={{ rotate: 10, scale: 1.1 }}
                     transition={{ type: "spring", stiffness: 300 }}
                     className="relative z-10 flex items-center justify-center bg-white p-1 rounded-full shadow-sm"
                   >
                     <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path></svg>
                   </motion.div>
                   <span className="relative z-10 font-bold">Continue with Google</span>
                 </>
               )}
             </button>
           </div>
           <div className="mt-6 text-center text-sm text-text-secondary">
             Are you Admin?{" "}
             <button
               type="button"
               onClick={() => {
                 setEmail("admin@mindflow.com");
                 setPassword("");
               }}
               className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
             >
               Click here
             </button>
           </div>
           <div className="mt-2 text-center text-sm text-text-secondary">
             Are you guest user?{" "}
             <button
               type="button"
               onClick={() => {
                 setEmail("mindflow@user.com");
                 setPassword("Test@1234");
               }}
               className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
             >
               Click here
             </button>
           </div>
         </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default AuthPage;
