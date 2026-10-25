import React, { useState } from 'react';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, WifiOff } from 'lucide-react';
import { triggerAppRecovery } from '../../lib/recovery/RecoveryManager';
import { IntentPolicy } from '../../lib/navigation/policies/IntentPolicy';
import { PlatformPolicy } from '../../lib/navigation/policies/PlatformPolicy';
import { ROUTES } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export const RecoveryBanner: React.FC = () => {
    const { status } = useRecoveryStore();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const location = useLocation();
    const { signOut } = useAuth();

    // Do not show banner or overlay on guest routes
    const isGuestRoute = ['/', '/login', '/signup', '/onboarding', '/privacy-policy', '/about/terms-of-use'].includes(location.pathname);
    if (isGuestRoute) {
        // If we land on a guest route with a FAILED state (e.g., navigated away manually), reset it
        if (status !== 'HEALTHY') {
            setTimeout(() => {
                if (useRecoveryStore.getState().status !== 'HEALTHY') {
                    useRecoveryStore.getState().resetStatus();
                }
            }, 0);
        }
        return null;
    }

    // Do not show banner for these quiet states
    if (status === 'HEALTHY' || status === 'HIDDEN' || status === 'RESUMED') {
        return null;
    }

    // Last Resort Full Screen Overlay
    if (status === 'FAILED') {
        // Derive isSessionExpired explicitly from the real auth state / error log
        const lastTelemetry = useRecoveryStore.getState().telemetry.slice(-1)[0];
        const lastError = lastTelemetry?.error;
        const lastErrorCode = lastTelemetry?.errorCode;

        // Match specific Supabase auth conditions for dead sessions
        // Explicitly check for definitive session death codes, rather than generic missing auth messages
        // that could happen when a guest naturally has no session.
        const isSessionExpired = lastErrorCode === 'invalid_grant' ||
                                 lastErrorCode === 'refresh_token_not_found' ||
                                 lastErrorCode === 'refresh_token_already_used' ||
                                 lastErrorCode === 'session_expired' ||
                                 lastErrorCode === 'session_not_found';

        return (
            <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-slate-800 dark:text-slate-200">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <WifiOff className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {isSessionExpired ? 'Session Expired' : 'Connection Lost'}
                        </h2>
                        <p className="opacity-70">
                            {isSessionExpired
                                ? 'Your session has expired. Please sign in again to continue.'
                                : 'We\'re having trouble reconnecting to MindFlow. Please check your internet connection.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        {!isSessionExpired && (
                            <button
                                onClick={() => triggerAppRecovery('Manual Retry')}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Try Again
                            </button>
                        )}
                        {!isSessionExpired && (
                            <button
                                onClick={() => {
                                    useRecoveryStore.getState().resetStatus();
                                    // Use dashboard as the home route for authenticated users
                                    window.location.hash = '#' + ROUTES.DASHBOARD;
                                }}
                                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                            >
                                Go to Home
                            </button>
                        )}

                        {isSessionExpired && (
                            <button
                                disabled={isSigningOut}
                                onClick={async () => {
                                    setIsSigningOut(true);

                                    // Navigate using HashRouter mechanism to preserve offline DB state
                                    // and set intent so they return here after logging back in
                                    IntentPolicy.saveIntent(window.location);

                                    useRecoveryStore.getState().resetStatus();

                                    try {
                                        await signOut(); // This properly triggers SIGNED_OUT and cleans IndexedDB
                                    } catch (err) {
                                        console.error('Error during fallback sign out:', err);
                                    }

                                    window.location.hash = '#' + PlatformPolicy.getGuestEntryRoute();
                                    // No need to manually reload, AuthContext will handle state transition
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
                            >
                                {isSigningOut ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Signing out...</span>
                                    </>
                                ) : (
                                    'Sign In Again'
                                )}
                            </button>
                        )}
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
