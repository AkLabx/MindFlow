import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Layers, Scale } from 'lucide-react';
import { ROUTES, getPreparedMockTestsRoute } from '@/config/routes';
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

    const bpscSnapshot = useMemo(
        () => (activeExam.id === 'bpsc' ? activeSnapshot : getCachedPreparedMockTestsSnapshot('bpsc')),
        [activeExam.id, activeSnapshot, cacheEpoch]
    );

    const targetReturnTo = returnTo || location.pathname || ROUTES.DASHBOARD;
    const primaryRoute = getPreparedMockTestsRoute(activeExam.id);
    const activeCount = activeSnapshot?.tests.length ?? 0;
    const bpscCount = bpscSnapshot?.tests.length ?? 0;

    const handleOpenPrimary = () => {
        triggerHaptic('light');
        navigate(primaryRoute, { state: { returnTo: targetReturnTo, source } });
    };

    const handleOpenBpsc = () => {
        triggerHaptic('light');
        navigate(ROUTES.TEST_SERIES.BPSC, { state: { returnTo: targetReturnTo, source } });
    };

    const handleOpenAllCategories = () => {
        triggerHaptic('light');
        navigate(ROUTES.TEST_SERIES.ROOT, { state: { returnTo: targetReturnTo, source } });
    };

    return (
        <section
            aria-label="Admin-Prepared Mock Tests"
            className={`relative overflow-hidden rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5 scroll-mb-28 ${className}`}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent pointer-events-none"
            />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-xs">
                        {activeExam.id === 'bpsc' ? (
                            <Scale className="w-5 h-5" aria-hidden="true" />
                        ) : (
                            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                Prepared Mock Series
                            </span>
                            {activeCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                    {activeCount} Live
                                </span>
                            )}
                        </div>
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug [text-wrap:balance]">
                            {activeExam.displayName} Prepared Mock Tests
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 [text-wrap:pretty]">
                            Timed official pattern papers curated in MindFlow Admin with instant offline cache.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleOpenPrimary}
                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <span>Open {activeExam.shortCode} Mocks</span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>

                    {activeExam.id !== 'bpsc' && (
                        <button
                            type="button"
                            onClick={handleOpenBpsc}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                                BPSC Mocks{bpscCount > 0 ? ` (${bpscCount})` : ''}
                            </span>
                        </button>
                    )}

                    {source !== 'mock_tests' && (
                        <button
                            type="button"
                            onClick={handleOpenAllCategories}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>All Series</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};
