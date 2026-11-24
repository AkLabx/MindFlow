import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Award, Trophy, WifiOff } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import {
    TestLeaderboardEntry,
    fetchTestLeaderboard,
    getCachedTestLeaderboardSnapshot,
    readTestLeaderboardIndexedDBCache,
} from '../api/mockTestsApi';

interface TestLeaderboardCardProps {
    tests: Array<{ id: string; name: string; total_marks?: number | null }>;
    defaultTestId?: string | null;
    fixedTestId?: string | null;
    limit?: number;
    refreshKey?: string | number;
    className?: string;
}

const formatLeaderboardDuration = (seconds: number | null): string => {
    if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';
    const whole = Math.round(seconds);
    const hrs = Math.floor(whole / 3600);
    const mins = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    return `${secs}s`;
};

const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) {
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/60';
    }
    if (rank === 2) {
        return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
    }
    if (rank === 3) {
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/60';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

export const TestLeaderboardCard: React.FC<TestLeaderboardCardProps> = ({
    tests,
    defaultTestId = null,
    fixedTestId = null,
    limit = 20,
    refreshKey,
    className = '',
}) => {
    const headingId = useId();
    const selectId = useId();

    const userSelectedRef = useRef<boolean>(false);
    const [selectedTestId, setSelectedTestId] = useState<string>(
        () => fixedTestId ?? defaultTestId ?? tests[0]?.id ?? ''
    );

    const activeTestId = fixedTestId ?? selectedTestId;

    useEffect(() => {
        if (fixedTestId) {
            setSelectedTestId(fixedTestId);
            return;
        }
        const availableIds = new Set(tests.map((t) => t.id));
        if (!userSelectedRef.current || !availableIds.has(selectedTestId)) {
            const preferred =
                defaultTestId && availableIds.has(defaultTestId)
                    ? defaultTestId
                    : tests[0]?.id ?? '';
            if (preferred !== selectedTestId) {
                setSelectedTestId(preferred);
            }
        }
    }, [fixedTestId, defaultTestId, tests, selectedTestId]);

    const [entries, setEntries] = useState<TestLeaderboardEntry[]>(() =>
        activeTestId ? getCachedTestLeaderboardSnapshot(activeTestId) ?? [] : []
    );
    const [loading, setLoading] = useState<boolean>(() =>
        Boolean(activeTestId && getCachedTestLeaderboardSnapshot(activeTestId) === null)
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const requestSeqRef = useRef<number>(0);
    const isMountedRef = useRef<boolean>(true);
    const hasEntriesRef = useRef<boolean>(entries.length > 0);
    hasEntriesRef.current = entries.length > 0;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadLeaderboard = useCallback(
        async (isManualRetry = false) => {
            const targetId = String(activeTestId ?? '').trim();
            const seq = ++requestSeqRef.current;

            if (!targetId) {
                setEntries([]);
                hasEntriesRef.current = false;
                setLoading(false);
                setErrorMessage(null);
                return;
            }

            const syncSnapshot = getCachedTestLeaderboardSnapshot(targetId);
            if (syncSnapshot !== null && !isManualRetry) {
                setEntries(syncSnapshot);
                hasEntriesRef.current = syncSnapshot.length > 0;
                setLoading(false);
            } else if (!hasEntriesRef.current) {
                setLoading(true);
            }

            setErrorMessage(null);

            try {
                if (syncSnapshot === null) {
                    const idbSnapshot = await readTestLeaderboardIndexedDBCache(targetId);
                    if (!isMountedRef.current || requestSeqRef.current !== seq) return;
                    if (idbSnapshot !== null) {
                        setEntries(idbSnapshot);
                        hasEntriesRef.current = idbSnapshot.length > 0;
                        setLoading(false);
                    }
                }

                const fresh = await fetchTestLeaderboard(targetId, limit);
                if (!isMountedRef.current || requestSeqRef.current !== seq) return;
                setEntries(fresh);
                hasEntriesRef.current = fresh.length > 0;
                setErrorMessage(null);
            } catch (err: any) {
                if (!isMountedRef.current || requestSeqRef.current !== seq) return;
                setErrorMessage(err?.message || 'Unable to refresh leaderboard right now.');
            } finally {
                if (isMountedRef.current && requestSeqRef.current === seq) {
                    setLoading(false);
                }
            }
        },
        [activeTestId, limit]
    );

    useEffect(() => {
        hasEntriesRef.current = Boolean(
            activeTestId && (getCachedTestLeaderboardSnapshot(activeTestId)?.length ?? 0) > 0
        );
        void loadLeaderboard(false);
    }, [activeTestId, limit, refreshKey, loadLeaderboard]);

    const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        userSelectedRef.current = true;
        setSelectedTestId(e.target.value);
    };

    const handleRetry = () => {
        triggerHaptic('light');
        void loadLeaderboard(true);
    };

    const selectedTest = tests.find((t) => t.id === activeTestId);
    const selectedTestTotalMarks = Number(selectedTest?.total_marks ?? 0);

    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60 ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <Trophy
                        className="w-5 h-5 text-amber-500 shrink-0"
                        aria-hidden="true"
                    />
                    <h2
                        id={headingId}
                        className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight"
                    >
                        Leaderboard
                    </h2>
                </div>
                {entries.length > 0 && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        Top {entries.length}
                    </span>
                )}
            </div>

            {!fixedTestId && tests.length > 1 && (
                <div className="mb-4">
                    <label
                        htmlFor={selectId}
                        className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5"
                    >
                        Test Rankings
                    </label>
                    <select
                        id={selectId}
                        value={activeTestId}
                        onChange={handleTestChange}
                        className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {tests.map((testItem) => (
                            <option key={testItem.id} value={testItem.id}>
                                {testItem.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {errorMessage && entries.length > 0 && (
                <div
                    role="status"
                    className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5"
                >
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200 min-w-0">
                        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Offline cached rankings shown.</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold active:scale-95 transition-all touch-manipulation cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading && entries.length === 0 ? (
                <div className="space-y-2.5" aria-busy="true">
                    {[0, 1, 2].map((idx) => (
                        <div
                            key={idx}
                            className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
                        />
                    ))}
                </div>
            ) : errorMessage && entries.length === 0 ? (
                <div className="rounded-2xl border border-rose-200/80 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/30 p-5 text-center space-y-3">
                    <WifiOff
                        className="w-6 h-6 mx-auto text-rose-500 dark:text-rose-400"
                        aria-hidden="true"
                    />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {errorMessage}
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold active:scale-95 transition-all touch-manipulation cursor-pointer inline-flex items-center justify-center"
                    >
                        Retry
                    </button>
                </div>
            ) : entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center space-y-2">
                    <Award
                        className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600"
                        aria-hidden="true"
                    />
                    <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                        Be the first to complete this test!
                    </p>
                </div>
            ) : (
                <div className="mf-leaderboard-container">
                    {/* Mobile / narrow sidebar stacked cards */}
                    <div className="mf-leaderboard-mobile">
                        {entries.map((entry) => {
                            const formattedAcc = Number.isFinite(entry.accuracy)
                                ? entry.accuracy.toFixed(1)
                                : '0.0';
                            return (
                                <div
                                    key={`${entry.user_id}-${entry.rank}`}
                                    aria-current={entry.is_current_user ? 'true' : undefined}
                                    className={`rounded-xl p-3 border transition-colors ${
                                        entry.is_current_user
                                            ? 'border-indigo-300 dark:border-indigo-500/70 bg-indigo-50/80 dark:bg-indigo-950/40'
                                            : 'border-slate-200/70 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className={`inline-flex items-center justify-center min-w-[30px] px-2 py-0.5 rounded-md border text-xs font-black shrink-0 ${getRankBadgeClass(
                                                    entry.rank
                                                )}`}
                                            >
                                                #{entry.rank}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {entry.display_name}
                                            </span>
                                            {entry.is_current_user && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shrink-0">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <span>
                                            Score:{' '}
                                            <strong className="text-slate-900 dark:text-white">
                                                {entry.score}
                                                {selectedTestTotalMarks > 0
                                                    ? `/${selectedTestTotalMarks}`
                                                    : ''}
                                            </strong>
                                        </span>
                                        <span>
                                            Acc:{' '}
                                            <strong className="text-slate-900 dark:text-white">
                                                {formattedAcc}%
                                            </strong>
                                        </span>
                                        <span>{formatLeaderboardDuration(entry.time_taken_seconds)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop / wide container table */}
                    <div className="mf-leaderboard-desktop">
                        <div
                            tabIndex={0}
                            role="region"
                            aria-labelledby={headingId}
                            className="overflow-auto max-h-[380px] rounded-xl border border-slate-200/80 dark:border-slate-700/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <table className="w-full text-left border-collapse text-sm">
                                <caption className="sr-only">Test leaderboard rankings</caption>
                                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th scope="col" className="px-3.5 py-2.5">
                                            Rank
                                        </th>
                                        <th scope="col" className="px-3.5 py-2.5">
                                            Aspirant
                                        </th>
                                        <th scope="col" className="px-3.5 py-2.5">
                                            Score
                                        </th>
                                        <th scope="col" className="px-3.5 py-2.5">
                                            Accuracy
                                        </th>
                                        <th scope="col" className="px-3.5 py-2.5">
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {entries.map((entry) => {
                                        const formattedAcc = Number.isFinite(entry.accuracy)
                                            ? entry.accuracy.toFixed(1)
                                            : '0.0';
                                        return (
                                            <tr
                                                key={`${entry.user_id}-${entry.rank}`}
                                                aria-current={
                                                    entry.is_current_user ? 'true' : undefined
                                                }
                                                className={
                                                    entry.is_current_user
                                                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold'
                                                        : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }
                                            >
                                                <td className="px-3.5 py-3 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center min-w-[30px] px-2 py-0.5 rounded-md border text-xs font-black ${getRankBadgeClass(
                                                            entry.rank
                                                        )}`}
                                                    >
                                                        #{entry.rank}
                                                    </span>
                                                </td>
                                                <td className="px-3.5 py-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-bold text-slate-900 dark:text-white truncate">
                                                            {entry.display_name}
                                                        </span>
                                                        {entry.is_current_user && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                                    {entry.score}
                                                    {selectedTestTotalMarks > 0
                                                        ? `/${selectedTestTotalMarks}`
                                                        : ''}
                                                </td>
                                                <td className="px-3.5 py-3 whitespace-nowrap text-slate-700 dark:text-slate-200 font-semibold">
                                                    {formattedAcc}%
                                                </td>
                                                <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                                                    {formatLeaderboardDuration(
                                                        entry.time_taken_seconds
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
