import React, { useState } from 'react';
import { ChevronLeft, Home, Trash2, Mail, CheckCircle2, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';

export const PublicDeletionRequest: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setErrorMessage('Please enter a valid registered email address.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Send a passwordless magic-link verification straight to the user's inbox
            // pointing directly to the self-service deletion confirmation screen.
            const redirectUrl = `${window.location.origin}${window.location.pathname}#${ROUTES.SETTINGS.DELETE_ACCOUNT}`;
            const { error } = await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: redirectUrl,
                },
            });

            if (error) {
                // Gracefully avoid exposing account enumeration while informing about OTP limits
                if (error.message?.toLowerCase().includes('signups not allowed')) {
                    setSubmitted(true);
                    return;
                }
                throw error;
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error('[PublicDeletionRequest] OTP verification error:', err);
            setErrorMessage(
                err?.message || 'Unable to process deletion request right now. Please try again or contact support@mindflow.com.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Account Deletion Request</h1>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="min-h-[44px] px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    aria-label="Back to Home"
                >
                    <Home className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Home</span>
                </button>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                            <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MindFlow Data Erasure</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Public Deletion Portal (DPDP Act 2023 &amp; Google Play Policy)
                            </p>
                        </div>
                    </div>

                    {submitted ? (
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-center space-y-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verification Link Sent</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                If an account exists for <strong>{email}</strong>, we have dispatched a secure single-use verification link to that inbox.
                                Click the link inside your email to confirm and immediately schedule permanent deletion of your MindFlow account and data.
                            </p>
                            <div className="pt-2">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-6 py-3 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
                                    <p className="font-semibold">What gets deleted?</p>
                                    <p>
                                        Requesting deletion removes your profile, authentication credentials, quiz history, saved bookmarks, mistake notebook entries, and community interactions after a 7-day grace period.
                                    </p>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="deletion-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Registered Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        id="deletion-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="deletion-reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Reason for Deletion <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    id="deletion-reason"
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Help us improve MindFlow..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/15 transition-all disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Sending Verification Link...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        <span>Send Account Deletion Verification</span>
                                    </>
                                )}
                            </button>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                <p>
                                    Already signed in or prefer password login?{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate(ROUTES.SETTINGS.DELETE_ACCOUNT)}
                                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                                    >
                                        Sign In &amp; Delete Directly
                                    </button>
                                </p>
                                <p>
                                    Need manual assistance? Contact our Grievance Officer at{' '}
                                    <a href="mailto:support@mindflow.com?subject=Account%20Deletion%20Request" className="text-indigo-600 dark:text-indigo-400 underline">
                                        support@mindflow.com
                                    </a>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
