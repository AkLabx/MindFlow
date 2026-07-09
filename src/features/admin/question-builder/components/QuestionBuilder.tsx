import React, { useState, useEffect } from 'react';
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

    // Initialize Filter Options
    useEffect(() => {
        fetchFilterOptions().then(setFilterOptions).catch(console.error);
    }, []);

    // Initialize Selected Questions based on provided IDs
    useEffect(() => {
        const init = async () => {
            if (initialQuestionIds.length > 0) {
                try {
                    const validIds = initialQuestionIds; // Assuming they're already valid if they come from DB
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

    const handleToggleSelect = (id: string, checked: boolean) => {
        setSelectedQuestions(prev => {
            let newSelection;
            if (checked) {
                // To support adding, we need the question object.
                // Wait, QuestionResultCard fires this. But it only passes ID.
                // Oh! We need the whole object. Let's change onToggleSelect to take the Question object.
            }
            return prev;
        });
    };

    const handleToggleSelectObj = (question: QuestionLightweight, checked: boolean) => {
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
    };

    const handleRemove = (id: string) => {
        setSelectedQuestions(prev => {
            const newArr = prev.filter(q => q.id !== id);
            onChange(newArr.map(q => q.id));
            return newArr;
        });
    };

    const handleRemoveAll = () => {
        setSelectedQuestions([]);
        onChange([]);
    };

    const handleAdvancedImport = async (text: string) => {
        setIsImporting(true);
        try {
            const matches = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig) || [];
            if (!matches.length) {
                toast.error('No valid UUIDs found');
                return;
            }

            // Deduplicate incoming
            const uniqueMatches = Array.from(new Set(matches));

            // Validate against DB
            const { valid, invalid } = await validateQuestionIds(uniqueMatches);

            if (invalid.length > 0) {
                toast.error(`Found ${invalid.length} invalid/missing IDs. Proceeding with valid ones.`);
            }

            if (valid.length === 0) {
                toast.error('No valid questions to import');
                return;
            }

            // Filter out already selected
            const currentIds = new Set(selectedQuestions.map(q => q.id));
            const newValidIds = valid.filter(id => !currentIds.has(id));

            if (newValidIds.length === 0) {
                toast.success('All valid questions are already selected.');
                return;
            }

            // Fetch metadata
            const importedQs = await fetchQuestionsByUUIDs(newValidIds);

            setSelectedQuestions(prev => {
                const newArr = [...prev, ...importedQs];
                onChange(newArr.map(q => q.id));
                return newArr;
            });

            toast.success(`Imported ${importedQs.length} new questions.`);
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
        <div className="flex flex-col lg:flex-row h-[600px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-sm">

            {/* Left Panel: Search */}
            <div className="flex-1 min-w-0 lg:w-3/5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 h-[400px] lg:h-full">
                <QuestionSearchPanel
                    filterOptions={filterOptions}
                    selectedIds={selectedQuestions.map(q => q.id)}
                    onToggleSelect={(id, checked) => {
                        // We need the question object here. But QuestionResultCard only gives ID right now.
                        // Wait, I will fix QuestionSearchPanel to pass the object.
                    }}
                    onPreview={setPreviewId}
                    // Passing object instead via new prop (we'll fix SearchPanel right now)
                    onSelectObj={handleToggleSelectObj}
                />
            </div>

            {/* Right Panel: Selected */}
            <div className="flex-1 lg:w-2/5 h-[400px] lg:h-full border-t lg:border-t-0 border-slate-200 dark:border-slate-700">
                <SelectedQuestionsPanel
                    selectedQuestions={selectedQuestions}
                    onRemove={handleRemove}
                    onRemoveAll={handleRemoveAll}
                    onAdvancedImport={handleAdvancedImport}
                    isImporting={isImporting}
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
