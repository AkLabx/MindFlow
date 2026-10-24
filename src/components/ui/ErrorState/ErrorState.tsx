import React from 'react';
import { WifiOff, RefreshCw, LogIn, Home, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { translateError } from '../../../features/community/utils/errorTranslation';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  actionText?: string;
  actionIcon?: LucideIcon;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Unable to connect to the server. Please check your network.",
  onRetry,
  actionText = "Retry",
  actionIcon: ActionIcon = RefreshCw
}) => {
  const navigate = useNavigate();

  // Translate the error to avoid showing raw technical exceptions
  const translated = translateError({ message });

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate('/');
  };

  const handleGoHome = () => {
      navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[300px] w-full p-6 text-center space-y-4"
    >
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
        <WifiOff size={40} className="opacity-80" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {translated.category === 'auth' ? 'Session Expired' :
             translated.category === 'network' ? 'Connection Error' : 'Something went wrong'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {translated.userMessage}
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-4 w-full max-w-[200px]">
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all active:scale-95 shadow-md shadow-primary-600/20"
          >
            <ActionIcon size={18} />
            <span>{actionText}</span>
          </button>

          {translated.category === 'auth' && (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-medium transition-all active:scale-95"
              >
                <LogIn size={18} />
                <span>Sign In Again</span>
              </button>
          )}

          {translated.category !== 'auth' && (
               <button
                onClick={handleGoHome}
                className="flex w-full items-center justify-center gap-2 px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-medium transition-all active:scale-95"
              >
                <Home size={18} />
                <span>Go Home</span>
              </button>
          )}
      </div>
    </motion.div>
  );
};
