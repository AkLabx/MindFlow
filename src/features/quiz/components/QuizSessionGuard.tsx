import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ArrowLeft, WifiOff, RefreshCw } from 'lucide-react';

export const QuizSessionGuard = ({ children }: { children: React.ReactNode }) => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const state = useQuizSessionStore();
    const [isHydrating, setIsHydrating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const isSyncFailed = state.syncStatus === 'sync_failed_retrying';

    // Show full screen blocking UI if we are totally offline or sync is explicitly failing
    if (!isOnline || isSyncFailed) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 text-center">
                <WifiOff className="w-16 h-16 text-rose-500 mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {!isOnline ? 'Connection Lost' : 'Sync Failed'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
                    {!isOnline
                        ? 'Please check your internet connection. Your quiz is paused until you reconnect to prevent data loss.'
                        : 'We could not save your recent answers to the cloud. Your quiz is paused to prevent data loss.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                    <RefreshCw className="w-5 h-5" />
                    Retry Connection
                </button>
            </div>
        );
    }


    useEffect(() => {
        const hydrateQuiz = async () => {
            if (!quizId) {
                setError("Quiz ID is missing.");
                setIsHydrating(false);
                return;
            }

            // If the store is already active with this specific quiz, we can skip hydration
            if (state.quizId === quizId && state.activeQuestions && state.activeQuestions.length > 0) {
                setIsHydrating(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    setError("Please login to continue.");
                    setIsHydrating(false);
                    return;
                }

                const { data: quizData, error } = await supabase
                    .from('saved_quizzes')
                    .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
                    .eq('id', quizId)
                    .single();

                if (error || !quizData) {
                    console.error("Failed to fetch quiz for hydration:", error);
                    setError("Quiz not found or could not be loaded.");
                    setIsHydrating(false);
                    return;
                }

                // If auth uid doesn't match the owner, bounce them out (share functionality comes in the next component)
                if (quizData.user_id !== session.user.id) {
                    setError("You do not have permission to view this quiz.");
                    setIsHydrating(false);
                    return;
                }

                const bridgeData = quizData.bridge_saved_quiz_questions || [];
                bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
                const questionIds = bridgeData.map((bq: any) => bq.question_id);

                if (questionIds.length > 0) {
                    const { data: qData, error: qError } = await supabase
                        .from('questions')
                        .select('*')
                        .in('id', questionIds);

                    if (qError) {
                         console.error("Failed to fetch study materials:", qError);
                         setError("Failed to fetch quiz questions.");
                         setIsHydrating(false);
                         return;
                    }

                    const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));

                    const fullQuestions: any[] = [];
                    bridgeData.forEach((bq: any) => {
                        const q = questionsMap.get(String(bq.question_id));
                        if (q) fullQuestions.push(q);
                    });

                    // Ensure we don't load an empty array if the mapping fails entirely
                    if (fullQuestions.length === 0) {
                        console.error("Hydration failed: mapped question array is empty. DB IDs might be missing from questions.");
                        setError("Quiz questions are missing.");
                        setIsHydrating(false);
                        return;
                    }

                    const parsedState = typeof quizData.state === 'string' ? JSON.parse(quizData.state) : (quizData.state || {});

                    // Load into Zustand Store explicitly merging ID
                    state.loadSavedQuiz({
                        ...parsedState,
                        activeQuestions: fullQuestions,
                        quizId: quizId,
                        isPaused: false
                    });
                } else {
                     console.error("Hydration failed: bridge table returned 0 question IDs.");
                     setError("Quiz is empty.");
                     setIsHydrating(false);
                     return;
                }

                setIsHydrating(false);
            } catch (err) {
                console.error("Hydration error:", err);
                setError("An unexpected error occurred while loading the quiz.");
                setIsHydrating(false);
            }
        };

        hydrateQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                 <ErrorState
                    message={error}
                    actionText="Go Back to Dashboard"
                    actionIcon={ArrowLeft}
                    onRetry={() => navigate('/dashboard')}
                />
            </div>
        );
    }

    if (isHydrating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <SynapticLoader size="lg" />
                <p className="mt-4 text-gray-500">Loading your quiz session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
