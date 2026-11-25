import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Scale } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CANONICAL_EXAMS, getCanonicalExamById } from '@/features/dashboard/constants/examRegistry';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { triggerHaptic } from '@/lib/haptics';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    getCachedPreparedMockTestsSnapshot,
} from '../api/mockTestsApi';

interface PreparedMockTestsShortcutCardProps {
    source: 'dashboard' | 'mcqs' | 'mock_tests';
    returnTo?: string;
    className?: string;
}

export const PreparedMockTestsShortcutCard: React.FC<PreparedMockTestsShortcutCardProps> = ({
    source,
    returnTo,
    className = '',
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeExamId = useExamContextStore((s) => s.activeExamId);
    const [cacheEpoch, setCacheEpoch] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const bump = () => setCacheEpoch((prev) => prev + 1);
        const handleStorage = (e: StorageEvent) => {
            if (e.key === MOCK_CACHE_VERSION_KEY) {
                bump();
            }
        };

        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, bump);
        window.addEventListener('storage', handleStorage);

        let channel: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel('mindflow-mock-cache');
                channel.onmessage = () => bump();
            } catch {
                channel = null;
            }
        }

        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, bump);
            window.removeEventListener('storage', handleStorage);
            if (channel) {
                channel.close();
            }
        };
    }, []);

    const activeExam = useMemo(
        () => getCanonicalExamById(activeExamId) || getCanonicalExamById('bpsc') || CANONICAL_EXAMS[0],
        [activeExamId]
    );

    const activeSnapshot = useMemo(
        () => getCachedPreparedMockTestsSnapshot(activeExam.id),
        [activeExam.id, cacheEpoch]
    );

    const targetReturnTo = returnTo || location.pathname || ROUTES.DASHBOARD;
    const activeCount = activeSnapshot?.tests.length ?? 0;

    const handleExploreSeries = () => {
        triggerHaptic('light');
        navigate(ROUTES.TEST_SERIES.ROOT, { state: { returnTo: targetReturnTo, source } });
    };

    return (
        <section
            aria-label="Mock Test Series"
            className={`relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-4 sm:p-5 scroll-mb-28 ${className}`}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-amber-500/5 to-transparent pointer-events-none"
            />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 shadow-xs">
                        {activeExam.id === 'bpsc' ? (
                            <Scale className="w-5 h-5" aria-hidden="true" />
                        ) : (
                            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                Mock Test Series
                            </h2>
                            {activeCount > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                    {activeCount} Live {activeExam.shortCode}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 [text-wrap:pretty]">
                            Official timed mock exams and previous year series curated by MindFlow.
                        </p>
                    </div>
                </div>

                <div className="flex items-center shrink-0">
                    <button
                        type="button"
                        onClick={handleExploreSeries}
                        className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <span>Explore Mock Test Series</span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    );
};
