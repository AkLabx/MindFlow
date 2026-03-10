import React, { useState, useEffect } from 'react';
import { ChevronRight, Settings, BookOpen, Layers, BarChart2 } from 'lucide-react';
import { SynonymWord, InitialFilters } from '../quiz/types';

// Load the local data source
import synonymsDataRaw from '../quiz/data/processed_synonyms.json';
const synonymsData: SynonymWord[] = synonymsDataRaw as SynonymWord[];

interface SynonymsConfigProps {
    onBack: () => void;
    onStart: (data: SynonymWord[], filters: InitialFilters) => void;
}

export const SynonymsConfig: React.FC<SynonymsConfigProps> = ({ onBack, onStart }) => {
    const [difficulty, setDifficulty] = useState<string>('All');
    const [theme, setTheme] = useState<string>('All');
    const [batchSize, setBatchSize] = useState<number>(10);
    const [filterByHeatmap, setFilterByHeatmap] = useState<boolean>(false);

    // Derived unique themes
    const availableThemes = Array.from(new Set(synonymsData.map(word => word.theme).filter(Boolean)));

    const handleStart = () => {
        let filteredData = [...synonymsData];

        if (theme !== 'All') {
            filteredData = filteredData.filter(word => word.theme === theme);
        }

        if (filterByHeatmap) {
            // High frequency words (often missed/repeated)
            filteredData = filteredData.filter(word => word.lifetime_frequency > 5);
        }

        const filters: InitialFilters = {
            subject: ['English'],
            topic: ['Vocabulary'],
            subTopic: ['Synonyms & Antonyms'],
            difficulty: [difficulty],
            questionType: ['multiple_choice'],
            examName: [],
            examYear: [],
            examDateShift: [],
            tags: [] // Or flashcard equivalent
        };

        // Slice by batch size
        const batchedData = filteredData.slice(0, batchSize);

        onStart(batchedData, filters);
    };

    return (
        <div className="flex-1 flex flex-col p-4 pb-24 md:pb-8 animate-fade-in max-w-2xl mx-auto w-full">
            <header className="mb-8">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center mb-4 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                        <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Synonyms & Antonyms
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Configure your session</p>
                    </div>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-8">
                {/* Theme Filter */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                        <Layers className="w-4 h-4 mr-2" />
                        Select Theme
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setTheme('All')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${theme === 'All'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            All Themes
                        </button>
                        {availableThemes.map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${theme === t
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Batch Size Selection */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Batch Size
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[10, 20, 50].map(size => (
                            <button
                                key={size}
                                onClick={() => setBatchSize(size)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all ${batchSize === size
                                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500 shadow-sm'
                                    : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                    }`}
                            >
                                {size} Words
                            </button>
                        ))}
                    </div>
                </section>

                {/* Heatmap/Smart Focus Filter */}
                <section>
                    <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                        <div className="flex items-start">
                            <BarChart2 className="w-5 h-5 text-orange-600 dark:text-orange-500 mr-3 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Smart Focus Mode</h4>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                    Prioritize frequently repeated or highly missed words using Heatmap data.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterByHeatmap(!filterByHeatmap)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${filterByHeatmap ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filterByHeatmap ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </section>
            </div>

            <div className="mt-8">
                <button
                    onClick={handleStart}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center text-lg"
                >
                    Start Session
                    <ChevronRight className="w-6 h-6 ml-2" />
                </button>
            </div>
        </div>
    );
};
