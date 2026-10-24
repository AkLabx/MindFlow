import React from 'react';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerAppRecovery } from '../../lib/recovery/RecoveryManager';

export const RecoveryBanner: React.FC = () => {
    const { status } = useRecoveryStore();

    // Do not show banner for these quiet states
    if (status === 'HEALTHY' || status === 'HIDDEN' || status === 'RESUMED') {
        return null;
    }

    // Last Resort Full Screen Overlay
    if (status === 'FAILED') {
        return (
            <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-slate-800 dark:text-slate-200">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <WifiOff className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Connection Lost</h2>
                        <p className="opacity-70">
                            We're having trouble reconnecting to MindFlow. Your session may have expired or you might be offline.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={() => triggerAppRecovery('Manual Retry')}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => {
                                useRecoveryStore.getState().resetStatus();
                                window.location.href = '/';
                            }}
                            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut({ scope: 'local' });
                                window.location.href = '/';
                            }}
                            className="w-full py-3 px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Friendly Auto-Recovery Floating Banner
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9998] p-4 pointer-events-none flex justify-center"
            >
                <div className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto">
                    {status === 'RECOVERED' ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Reconnected successfully
                            </span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {status === 'CHECKING' ? 'Checking connection...' : 'Refreshing session...'}
                            </span>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
