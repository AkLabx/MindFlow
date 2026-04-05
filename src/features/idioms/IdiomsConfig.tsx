import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Target, FileText, Settings, Calendar, Type, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { InitialFilters } from '../quiz/types';
import { Idiom } from '../../types/models';
import { MultiSelectDropdown } from '../quiz/components/ui/MultiSelectDropdown';
import { SegmentedControl } from '../quiz/components/ui/SegmentedControl';
import { ActiveFiltersBar } from '../quiz/components/ui/ActiveFiltersBar';
import { cn } from '../../utils/cn';
import { SynapticLoader } from '../../components/ui/SynapticLoader';
import { fetchIdiomMetadata, getFilteredIdioms } from './utils/supabaseIdioms';
import { useIdiomQuestionIndex, useIdiomFilterCounts, IdiomMetadata } from './hooks/useIdiomFilterCounts';

interface IdiomsConfigProps {
    onStart: (data: Idiom[], filters?: InitialFilters) => void;
    onBack: () => void;
}

const emptyFilters: InitialFilters = {
    subject: [],
    topic: [],
    subTopic: [],
    difficulty: [],
    questionType: [],
    examName: [],
    examYear: [],
    examDateShift: [],
    tags: [],
    readStatus: []
};

export const IdiomsConfig: React.FC<IdiomsConfigProps> = ({ onStart, onBack }) => {
    const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const [metadata, setMetadata] = useState<IdiomMetadata[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initConfig = async () => {
            try {
                const meta = await fetchIdiomMetadata();
                setMetadata(meta);
            } catch (e) {
                console.error("Error initializing Idiom configs", e);
            } finally {
                setIsInitializing(false);
            }
        };
        initConfig();
    }, []);

    const index = useIdiomQuestionIndex(metadata);
    const { counts: filterCounts, totalMatchingCount, finalMatchingIds } = useIdiomFilterCounts({
        metadata,
        selectedFilters: filters,
        selectedAlphabet: selectedLetter,
        index
    });

    const availableExamNames = Object.keys(index.examName || {}).sort();
    const availableExamYears = Object.keys(index.examYear || {}).sort();

    const handleFilterChange = (key: keyof InitialFilters, selected: string[]) => {
        setFilters(prev => ({ ...prev, [key]: selected }));
    };

    const handleRemoveFilter = (key: keyof InitialFilters, value?: string) => {
        if (value) {
            setFilters(prev => ({ ...prev, [key]: (prev[key] as string[]).filter(item => item !== value) }));
        } else {
            setFilters(prev => ({ ...prev, [key]: [] }));
        }
    };

    const handleStart = async () => {
        setIsFetchingData(true);
        try {
            if (finalMatchingIds.length === 0) {
                 alert("No Idioms found matching current filters.");
                 return;
            }
            const data = await getFilteredIdioms(filters, selectedLetter);
            if (data.length > 0) {
                onStart(data, filters);
            } else {
                alert("No Idioms found matching current filters.");
            }
        } catch (error) {
            console.error("Error fetching full Idiom data:", error);
            alert("Failed to load Idiom data. Please try again.");
        } finally {
            setIsFetchingData(false);
        }
    };

    if (isInitializing) {
        return <SynapticLoader />;
    }

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4 mb-6 z-10 sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md pb-4 pt-2 -mt-2">
                <button
                    onClick={onBack}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="w-7 h-7 text-indigo-500" /> Idioms Config
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Filter English Idioms & Phrases</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative z-10 animate-fade-in w-full max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alphabetical Filter */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-sm uppercase tracking-wider">
                            <Type className="w-4 h-4" /> Alphabetical Order
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setSelectedLetter(null)}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                    !selectedLetter
                                        ? "bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-200"
                                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                                )}
                            >
                                ALL
                            </button>
                            {alphabet.map(letter => {
                                const isSelected = selectedLetter === letter;
                                const count = filterCounts.alphabet?.[letter] || 0;
                                const isDisabled = count === 0 && !isSelected;
                                return (
                                    <button
                                        key={letter}
                                        disabled={isDisabled}
                                        onClick={() => setSelectedLetter(isSelected ? null : letter)}
                                        className={cn(
                                            "w-9 h-9 flex flex-col items-center justify-center rounded-lg transition-all border",
                                            isSelected
                                                ? "bg-indigo-500 text-white border-indigo-500 shadow-md transform scale-110"
                                                : isDisabled
                                                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700",
                                        )}
                                    >
                                        <span className="text-xs font-bold">{letter}</span>
                                        {count > 0 && !isSelected && <span className="text-[8px] opacity-60 -mt-1">{count}</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Source Name Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-sm uppercase tracking-wider">
                            <FileText className="w-4 h-4" /> Source Material
                        </div>
                        <MultiSelectDropdown
                            label="Source Name"
                            options={availableExamNames}
                            selectedOptions={filters.examName}
                            onSelectionChange={(sel) => handleFilterChange('examName', sel)}
                            placeholder="Select Source (e.g. Blackbook)"
                            counts={filterCounts.examName}
                        />
                    </div>

                    {/* Exam Year Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-sm uppercase tracking-wider">
                            <Calendar className="w-4 h-4" /> Exam Year
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableExamYears.map(year => {
                                const isSelected = filters.examYear.includes(year);
                                const count = filterCounts.examYear?.[year] || 0;
                                const isDisabled = count === 0 && !isSelected;
                                return (
                                    <button
                                        key={year}
                                        disabled={isDisabled}
                                        onClick={() => setFilters(prev => {
                                            const current = prev.examYear;
                                            return { ...prev, examYear: current.includes(year) ? current.filter(y => y !== year) : [...current, year] };
                                        })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border select-none",
                                            isSelected
                                                ? "bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-300"
                                                : isDisabled
                                                ? "bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:border-slate-600"
                                        )}
                                    >
                                        <span>{year}</span>
                                        {count > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Read Status Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-sm uppercase tracking-wider">
                            <CheckCircle className="w-4 h-4" /> Read Status
                        </div>
                        <SegmentedControl
                            options={['read', 'unread']}
                            selectedOptions={filters.readStatus || []}
                            onOptionToggle={(opt) => setFilters(prev => {
                                const current = prev.readStatus || [];
                                return { ...prev, readStatus: current.includes(opt as any) ? current.filter(i => i !== opt) : [...current, opt as any] };
                            })}
                            counts={{}}
                        />
                        <p className="text-xs text-slate-400 mt-2">Read status is locally tracked and not filtered by server currently.</p>
                    </div>

                    {/* Difficulty Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-sm uppercase tracking-wider">
                            <Settings className="w-4 h-4" /> Difficulty Level
                        </div>
                        <SegmentedControl
                            options={['Easy', 'Medium', 'Hard']}
                            selectedOptions={filters.difficulty}
                            onOptionToggle={(opt) => handleFilterChange('difficulty', filters.difficulty.includes(opt) ? filters.difficulty.filter(i => i !== opt) : [...filters.difficulty, opt])}
                            counts={filterCounts.difficulty}
                        />
                    </div>
                </div>

                <div className="mt-8 sticky bottom-4 z-10">
                    <div className="bg-white dark:bg-slate-800 backdrop-blur-md border border-indigo-200 shadow-xl rounded-2xl p-4">
                        <div className="mb-4">
                            <ActiveFiltersBar filters={filters} onRemoveFilter={handleRemoveFilter} onClearAll={() => setFilters(emptyFilters)} />
                        </div>
                        <Button
                            fullWidth
                            size="lg"
                            onClick={handleStart}
                            disabled={totalMatchingCount === 0 || isFetchingData}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200"
                        >
                            {isFetchingData ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Flashcards ({totalMatchingCount})
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
