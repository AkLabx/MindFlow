import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionLightweight, FilterOptions } from '../types/questionBuilder.types';
import { fetchFilterOptions, fetchQuestionsByUUIDs } from '../api/questionBuilderApi';
import { QuestionSearchPanel } from './QuestionSearchPanel';
import { SelectedQuestionsPanel } from './SelectedQuestionsPanel';
import { QuestionPreviewDrawer } from './QuestionPreviewDrawer';
import { validateQuestionIds } from '../../test-series/api/adminTestSeriesApi';
import toast from 'react-hot-toast';

interface Props {
    initialQuestionIds: string[];
    onChange: (questionIds: string[]) => void;
}

export const QuestionBuilder: React.FC<Props> = ({ initialQuestionIds, onChange }) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        subjects: [], difficulties: [], examNames: [], examYears: [], topics: []
    });

    const [selectedQuestions, setSelectedQuestions] = useState<QuestionLightweight[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Undo history for single-level undo
    const [undoHistory, setUndoHistory] = useState<QuestionLightweight[] | null>(null);

    // Initialize Filter Options
    useEffect(() => {
        fetchFilterOptions().then(setFilterOptions).catch(console.error);
    }, []);

    // Initialize Selected Questions based on provided IDs
    useEffect(() => {
        const init = async () => {
            if (initialQuestionIds.length > 0) {
                try {
                    const validIds = initialQuestionIds;
                    const qData = await fetchQuestionsByUUIDs(validIds);

                    // Maintain original order
                    const orderedQs = validIds
                        .map(id => qData.find(q => q.id === id))
                        .filter(Boolean) as QuestionLightweight[];

                    setSelectedQuestions(orderedQs);
                } catch (e) {
                    console.error('Failed to init questions', e);
                }
            }
            setLoadingInitial(false);
        };
        init();
    }, [initialQuestionIds]);

    const saveHistory = useCallback(() => {
        setUndoHistory([...selectedQuestions]);
    }, [selectedQuestions]);

    const handleUndo = useCallback(() => {
        if (undoHistory) {
            setSelectedQuestions(undoHistory);
            onChange(undoHistory.map(q => q.id));
            setUndoHistory(null); // single-level undo consumed
            toast.success('Action undone');
        }
    }, [undoHistory, onChange]);

    // Used by QuestionSearchPanel for individual clicks
    const handleToggleSelectObj = useCallback((question: QuestionLightweight, checked: boolean) => {
        setSelectedQuestions(prev => {
            let newArr;
            if (checked) {
                if (prev.some(q => q.id === question.id)) return prev;
                newArr = [...prev, question];
            } else {
                newArr = prev.filter(q => q.id !== question.id);
            }
            onChange(newArr.map(q => q.id));
            return newArr;
        });
    }, [onChange]);

    // Used by QuestionSearchPanel for bulk adds
    const handleAddMultiple = useCallback((questions: QuestionLightweight[]) => {
        if (!questions.length) return;
        saveHistory();

        setSelectedQuestions(prev => {
            const existingIds = new Set(prev.map(q => q.id));
            const newQuestions = questions.filter(q => !existingIds.has(q.id));

            if (newQuestions.length === 0) {
                toast.success('All selected questions are already in the list.');
                return prev;
            }

            const newArr = [...prev, ...newQuestions];
            onChange(newArr.map(q => q.id));
            toast.success(`Added ${newQuestions.length} questions.`);
            return newArr;
        });
    }, [onChange, saveHistory]);

    const handleRemove = useCallback((id: string) => {
        saveHistory();
        setSelectedQuestions(prev => {
            const newArr = prev.filter(q => q.id !== id);
            onChange(newArr.map(q => q.id));
            return newArr;
        });
    }, [onChange, saveHistory]);

    const handleRemoveMultiple = useCallback((ids: string[]) => {
        if (!ids.length) return;
        saveHistory();
        setSelectedQuestions(prev => {
            const idSet = new Set(ids);
            const newArr = prev.filter(q => !idSet.has(q.id));
            onChange(newArr.map(q => q.id));
            toast.success(`Removed ${ids.length} questions.`);
            return newArr;
        });
    }, [onChange, saveHistory]);

    const handleRemoveAll = useCallback(() => {
        if (selectedQuestions.length === 0) return;
        saveHistory();
        setSelectedQuestions([]);
        onChange([]);
        toast.success('Cleared all questions.');
    }, [selectedQuestions.length, onChange, saveHistory]);

    const handleReorder = useCallback((newOrder: QuestionLightweight[]) => {
        // Do not save history for every drag tick, rely on DND end
        setSelectedQuestions(newOrder);
        onChange(newOrder.map(q => q.id));
    }, [onChange]);

    const handleBulkSort = useCallback((newOrder: QuestionLightweight[]) => {
        saveHistory();
        setSelectedQuestions(newOrder);
        onChange(newOrder.map(q => q.id));
        toast.success('Questions sorted.');
    }, [onChange, saveHistory]);

    const handleAdvancedImport = async (text: string) => {
        setIsImporting(true);
        try {
            const matches = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig) || [];
            if (!matches.length) {
                toast.error('No valid UUIDs found');
                return;
            }

            const uniqueMatches = Array.from(new Set(matches));
            const { valid, invalid } = await validateQuestionIds(uniqueMatches);

            if (invalid.length > 0) {
                toast.error(`Found ${invalid.length} invalid/missing IDs.`);
            }

            if (valid.length === 0) {
                toast.error('No valid questions to import');
                return;
            }

            const currentIds = new Set(selectedQuestions.map(q => q.id));
            const newValidIds = valid.filter(id => !currentIds.has(id));
            const duplicateCount = valid.length - newValidIds.length;

            if (newValidIds.length === 0) {
                toast.success('All valid questions are already selected.');
                return;
            }

            const importedQs = await fetchQuestionsByUUIDs(newValidIds);

            saveHistory();

            setSelectedQuestions(prev => {
                const newArr = [...prev, ...importedQs];
                onChange(newArr.map(q => q.id));
                return newArr;
            });

            let msg = `Imported ${importedQs.length} new questions.`;
            if (duplicateCount > 0) msg += ` Skipped ${duplicateCount} duplicates.`;
            toast.success(msg);
        } catch (error: any) {
            toast.error(error.message || 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    if (loadingInitial) {
        return <div className="h-64 flex items-center justify-center text-slate-500">Loading initial configuration...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row h-[600px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-sm relative">

            {/* Left Panel: Search */}
            <div className="flex-1 min-w-0 lg:w-1/2 xl:w-7/12 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 h-[400px] lg:h-full relative z-10 flex flex-col">
                <QuestionSearchPanel
                    filterOptions={filterOptions}
                    selectedIds={selectedQuestions.map(q => q.id)}
                    onPreview={setPreviewId}
                    onSelectObj={handleToggleSelectObj}
                    onAddMultiple={handleAddMultiple}
                />
            </div>

            {/* Right Panel: Selected */}
            <div className="flex-1 lg:w-1/2 xl:w-5/12 h-[400px] lg:h-full border-t lg:border-t-0 border-slate-200 dark:border-slate-700 relative z-10 flex flex-col">
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
