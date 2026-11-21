import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { QuestionLightweight, FilterOptions } from '../types/questionBuilder.types';
import { fetchFilterOptions, fetchQuestionsByUUIDs, getCachedFilterOptions } from '../api/questionBuilderApi';
import { QuestionSearchPanel } from './QuestionSearchPanel';
import { SelectedQuestionsPanel } from './SelectedQuestionsPanel';
import { QuestionPreviewDrawer } from './QuestionPreviewDrawer';
import { validateQuestionIds } from '../../test-series/api/adminTestSeriesApi';
import { useNotification } from '@/stores/useNotificationStore';

const EMPTY_FILTER_OPTIONS: FilterOptions = {
    subjects: [],
    difficulties: [],
    examNames: [],
    examYears: [],
    topics: [],
};

interface Props {
    initialQuestionIds: string[];
    onChange: (questionIds: string[]) => void;
}

export const QuestionBuilder: React.FC<Props> = ({ initialQuestionIds, onChange }) => {
    const { showToast } = useNotification();

    const [filterOptions, setFilterOptions] = useState<FilterOptions>(
        () => getCachedFilterOptions() ?? EMPTY_FILTER_OPTIONS
    );

    const [selectedQuestions, setSelectedQuestions] = useState<QuestionLightweight[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [mobileTab, setMobileTab] = useState<'search' | 'selected'>('search');

    // Undo history for single-level undo
    const [undoHistory, setUndoHistory] = useState<QuestionLightweight[] | null>(null);

    const selectedQuestionsRef = useRef<QuestionLightweight[]>([]);
    const lastSyncedIdsKeyRef = useRef<string | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Initialize Filter Options (SWR background refresh)
    useEffect(() => {
        let cancelled = false;
        fetchFilterOptions()
            .then(opts => {
                if (!cancelled) setFilterOptions(opts);
            })
            .catch(console.error);
        return () => {
            cancelled = true;
        };
    }, []);

    const commitSelection = useCallback(
        (nextSelected: QuestionLightweight[], options?: { saveHistory?: boolean }) => {
            if (options?.saveHistory) {
                setUndoHistory(selectedQuestionsRef.current);
            }
            const nextIds = nextSelected.map(q => q.id);
            selectedQuestionsRef.current = nextSelected;
            lastSyncedIdsKeyRef.current = nextIds.join(',');
            setSelectedQuestions(nextSelected);
            onChangeRef.current(nextIds);
        },
        []
    );

    // Initialize Selected Questions based on provided IDs (deduped against echoed onChange updates)
    const initialIdsKey = initialQuestionIds.join(',');
    useEffect(() => {
        if (initialIdsKey === lastSyncedIdsKeyRef.current) {
            setLoadingInitial(false);
            return;
        }

        if (initialQuestionIds.length === 0) {
            selectedQuestionsRef.current = [];
            lastSyncedIdsKeyRef.current = '';
            setSelectedQuestions([]);
            setLoadingInitial(false);
            return;
        }

        const existingById = new Map(selectedQuestionsRef.current.map(q => [q.id, q]));
        const missingIds = Array.from(new Set(initialQuestionIds.filter(id => !existingById.has(id))));

        if (missingIds.length === 0) {
            const orderedQs = initialQuestionIds
                .map(id => existingById.get(id))
                .filter((q): q is QuestionLightweight => Boolean(q));
            selectedQuestionsRef.current = orderedQs;
            lastSyncedIdsKeyRef.current = initialIdsKey;
            setSelectedQuestions(orderedQs);
            setLoadingInitial(false);
            return;
        }

        let cancelled = false;
        const init = async () => {
            try {
                const qData = await fetchQuestionsByUUIDs(missingIds);
                if (cancelled) return;

                const mergedMap = new Map(existingById);
                qData.forEach(q => mergedMap.set(q.id, q));

                const orderedQs = initialQuestionIds
                    .map(id => mergedMap.get(id))
                    .filter((q): q is QuestionLightweight => Boolean(q));

                selectedQuestionsRef.current = orderedQs;
                lastSyncedIdsKeyRef.current = initialIdsKey;
                setSelectedQuestions(orderedQs);
            } catch (e) {
                if (!cancelled) {
                    console.error('Failed to init questions', e);
                }
            } finally {
                if (!cancelled) {
                    setLoadingInitial(false);
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialIdsKey]);

    const handleUndo = useCallback(() => {
        if (undoHistory) {
            commitSelection(undoHistory);
            setUndoHistory(null); // single-level undo consumed
            showToast({
                title: 'Undone',
                message: 'Action undone',
                variant: 'info',
            });
        }
    }, [undoHistory, commitSelection, showToast]);

    // Used by QuestionSearchPanel for individual clicks
    const handleToggleSelectObj = useCallback(
        (question: QuestionLightweight, checked: boolean) => {
            const current = selectedQuestionsRef.current;
            if (checked) {
                if (current.some(q => q.id === question.id)) return;
                commitSelection([...current, question]);
            } else {
                const next = current.filter(q => q.id !== question.id);
                if (next.length === current.length) return;
                commitSelection(next);
            }
        },
        [commitSelection]
    );

    // Used by QuestionSearchPanel for bulk adds
    const handleAddMultiple = useCallback(
        (questions: QuestionLightweight[]) => {
            if (!questions.length) return;
            const current = selectedQuestionsRef.current;
            const existingIds = new Set(current.map(q => q.id));
            const newQuestions = questions.filter(q => !existingIds.has(q.id));

            if (newQuestions.length === 0) {
                showToast({
                    title: 'Already Selected',
                    message: 'All selected questions are already in the list.',
                    variant: 'info',
                });
                return;
            }

            commitSelection([...current, ...newQuestions], { saveHistory: true });
            showToast({
                title: 'Questions Added',
                message: `Added ${newQuestions.length} questions.`,
                variant: 'success',
            });
        },
        [commitSelection, showToast]
    );

    const handleRemove = useCallback(
        (id: string) => {
            const current = selectedQuestionsRef.current;
            const next = current.filter(q => q.id !== id);
            if (next.length === current.length) return;
            commitSelection(next, { saveHistory: true });
        },
        [commitSelection]
    );

    const handleRemoveMultiple = useCallback(
        (ids: string[]) => {
            if (!ids.length) return;
            const idSet = new Set(ids);
            const current = selectedQuestionsRef.current;
            const next = current.filter(q => !idSet.has(q.id));
            const removedCount = current.length - next.length;
            if (removedCount === 0) return;

            commitSelection(next, { saveHistory: true });
            showToast({
                title: 'Questions Removed',
                message: `Removed ${removedCount} questions.`,
                variant: 'success',
            });
        },
        [commitSelection, showToast]
    );

    const handleRemoveAll = useCallback(() => {
        if (selectedQuestionsRef.current.length === 0) return;
        commitSelection([], { saveHistory: true });
        showToast({
            title: 'Cleared',
            message: 'Cleared all questions.',
            variant: 'info',
        });
    }, [commitSelection, showToast]);

    const handleReorder = useCallback(
        (newOrder: QuestionLightweight[]) => {
            // Do not save history for every drag tick, rely on DND end
            commitSelection(newOrder);
        },
        [commitSelection]
    );

    const handleBulkSort = useCallback(
        (newOrder: QuestionLightweight[]) => {
            commitSelection(newOrder, { saveHistory: true });
            showToast({
                title: 'Sorted',
                message: 'Questions sorted.',
                variant: 'success',
            });
        },
        [commitSelection, showToast]
    );

    const handleAdvancedImport = useCallback(
        async (text: string) => {
            setIsImporting(true);
            try {
                const matches =
                    text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
                if (!matches.length) {
                    showToast({
                        title: 'Import Failed',
                        message: 'No valid UUIDs found',
                        variant: 'error',
                    });
                    return;
                }

                const uniqueMatches = Array.from(new Set(matches));
                const { valid, invalid } = await validateQuestionIds(uniqueMatches);

                if (invalid.length > 0) {
                    showToast({
                        title: 'Invalid IDs',
                        message: `Found ${invalid.length} invalid/missing IDs.`,
                        variant: 'error',
                    });
                }

                if (valid.length === 0) {
                    showToast({
                        title: 'Import Failed',
                        message: 'No valid questions to import',
                        variant: 'error',
                    });
                    return;
                }

                const current = selectedQuestionsRef.current;
                const currentIds = new Set(current.map(q => q.id));
                const newValidIds = valid.filter(id => !currentIds.has(id));
                const duplicateCount = valid.length - newValidIds.length;

                if (newValidIds.length === 0) {
                    showToast({
                        title: 'Already Selected',
                        message: 'All valid questions are already selected.',
                        variant: 'info',
                    });
                    return;
                }

                const importedQs = await fetchQuestionsByUUIDs(newValidIds);
                const latestCurrent = selectedQuestionsRef.current;
                const latestIds = new Set(latestCurrent.map(q => q.id));
                const dedupedImported = importedQs.filter(q => !latestIds.has(q.id));

                commitSelection([...latestCurrent, ...dedupedImported], { saveHistory: true });

                let msg = `Imported ${dedupedImported.length} new questions.`;
                if (duplicateCount > 0) msg += ` Skipped ${duplicateCount} duplicates.`;
                showToast({
                    title: 'Import Complete',
                    message: msg,
                    variant: 'success',
                });
            } catch (error: any) {
                showToast({
                    title: 'Import Failed',
                    message: error?.message || 'Import failed',
                    variant: 'error',
                });
            } finally {
                setIsImporting(false);
            }
        },
        [commitSelection, showToast]
    );

    const selectedIds = useMemo(() => selectedQuestions.map(q => q.id), [selectedQuestions]);

    if (loadingInitial && selectedQuestionsRef.current.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-500">Loading initial configuration...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-[580px] lg:h-[680px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-sm relative">
            {/* Mobile Native-Style 2-Tab Switcher */}
            <div
                role="tablist"
                aria-label="Question Builder Panels"
                className="lg:hidden flex p-1.5 gap-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={mobileTab === 'search'}
                    onClick={() => setMobileTab('search')}
                    className={`flex-1 min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                        mobileTab === 'search'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    Search Bank
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mobileTab === 'selected'}
                    onClick={() => setMobileTab('selected')}
                    className={`flex-1 min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                        mobileTab === 'selected'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    Selected ({selectedQuestions.length})
                </button>
            </div>

            {/* Left Panel: Search */}
            <div
                className={`flex-1 min-w-0 lg:w-1/2 xl:w-7/12 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 h-[560px] lg:h-full relative z-10 flex-col ${
                    mobileTab === 'search' ? 'flex' : 'hidden lg:flex'
                }`}
            >
                <QuestionSearchPanel
                    filterOptions={filterOptions}
                    selectedIds={selectedIds}
                    onPreview={setPreviewId}
                    onSelectObj={handleToggleSelectObj}
                    onAddMultiple={handleAddMultiple}
                />
            </div>

            {/* Right Panel: Selected */}
            <div
                className={`flex-1 lg:w-1/2 xl:w-5/12 h-[560px] lg:h-full border-t lg:border-t-0 border-slate-200 dark:border-slate-700 relative z-10 flex-col ${
                    mobileTab === 'selected' ? 'flex' : 'hidden lg:flex'
                }`}
            >
                <SelectedQuestionsPanel
                    selectedQuestions={selectedQuestions}
                    onRemove={handleRemove}
                    onRemoveMultiple={handleRemoveMultiple}
                    onRemoveAll={handleRemoveAll}
                    onReorder={handleReorder}
                    onBulkSort={handleBulkSort}
                    onAdvancedImport={handleAdvancedImport}
                    isImporting={isImporting}
                    onUndo={handleUndo}
                    canUndo={!!undoHistory}
                />
            </div>

            <QuestionPreviewDrawer
                isOpen={!!previewId}
                onClose={() => setPreviewId(null)}
                questionId={previewId}
            />
        </div>
    );
};
