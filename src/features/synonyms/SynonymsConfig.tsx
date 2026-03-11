import React, { useState, useEffect } from 'react';
import { SynonymWord } from '../quiz/types';
import rawSynonymsData from '../quiz/data/processed_synonyms.json';

interface SynonymsConfigProps {
    onBack: () => void;
    onStart: (data: SynonymWord[], filters: any) => void;
}

export const SynonymsConfig: React.FC<SynonymsConfigProps> = ({ onBack, onStart }) => {
    const [data, setData] = useState<SynonymWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load and sort data
        const load = async () => {
            try {
                // In a real scenario, this might be a fetch or complex parse
                const parsed = rawSynonymsData as unknown as SynonymWord[];

                // Sort by importance_score descending (Heatmap Hot first)
                parsed.sort((a, b) => b.importance_score - a.importance_score);

                setData(parsed);
            } catch(e) {
                console.error("Failed to load synonyms data", e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleStartLearning = () => {
        onStart(data, { mode: 'learning' });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Vocabulary Engine...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Synonyms Master
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">


                {/* Daily Challenge */}
                <div
                    onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                    className="bg-sky-50 dark:bg-sky-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-sky-100 dark:border-sky-900/40 border-b-4 border-b-sky-200 dark:border-b-sky-700 hover:border-sky-300 dark:hover:border-sky-500 mb-8"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                            🎯
                        </div>
                        <div className="flex-1 pr-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daily 20 Words Challenge</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Master 20 important words every day.</p>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2 bg-sky-200 dark:bg-sky-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 w-[0%]" />
                                </div>
                                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">0 / 20</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-sm flex-shrink-0 group-hover:bg-sky-700 transition-colors">
                        Start
                    </div>
                </div>

                {/* Stats / Welcome Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 mb-8">
                    <h2 className="text-2xl font-bold mb-2">The Intelligent Engine</h2>
                    <p className="text-blue-100 opacity-90 mb-4 text-sm leading-relaxed">
                        Master {data.length}+ words using our Semantic Clustering engine. Learn one word, and we'll automatically track its entire family to save you time.
                    </p>
                    <div className="flex gap-4 text-sm font-medium">
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            📚 {data.length} Words
                        </div>
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            🔥 Heatmap Sorted
                        </div>
                    </div>
                </div>

                                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Phase 1: Foundation</h3>
                <div className="grid grid-cols-1 gap-4 mb-8">
                    {/* Phase 1: Guided Learning */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/phase1'}
                        className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-amber-100 dark:border-amber-900/40 border-b-4 border-b-amber-200 dark:border-b-amber-700 hover:border-amber-300 dark:hover:border-amber-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl">
                                📖
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Guided Word Exploration</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Discover words with deep meanings, Hindi translations, and audio pronunciation. Perfect for building a strong foundation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Phase 2: Learn & Master</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

                    {/* Mode 1: Swipe Flashcards */}
                    <div
                        onClick={handleStartLearning}
                        className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-blue-100 dark:border-blue-900/40 border-b-4 border-b-blue-200 dark:border-b-blue-700 hover:border-blue-300 dark:hover:border-blue-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl">
                                🃏
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Smart Flashcards</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Swipe through High-Frequency words first. Tap to reveal meanings and Mark as Mastered.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mode 2: Cluster List */}
                    <div
                        onClick={() => {
                            onStart(data, { mode: 'list' });
                            window.location.hash = '#/synonyms/list';
                        }}
                        className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl">
                                📋
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Word Families (List)</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    View words grouped by meaning. See which words are hot (🔥) and review your Mastery spectrum.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase 3 Placeholder */}
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 mt-8">Phase 3: Gamified Practice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Game 1: The Imposter Trap */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=imposter'}
                        className="bg-violet-50 dark:bg-violet-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-violet-100 dark:border-violet-900/40 border-b-4 border-b-violet-200 dark:border-b-violet-700 hover:border-violet-300 dark:hover:border-violet-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl">
                                🕵️‍♂️
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">The Imposter Trap</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Spot the Antonym hiding among Synonyms before the 10-second timer runs out.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Game 2: Tap & Connect */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=connect'}
                        className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl">
                                🔗
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tap & Connect</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Match the main word with its synonym in a fast-paced dual-column challenge.
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* Game 3: Speed Mode */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                        className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-indigo-100 dark:border-indigo-900/40 border-b-4 border-b-indigo-200 dark:border-b-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-500 md:col-span-2 lg:col-span-1"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl relative">
                                ⚡
                                <span className="absolute -top-2 -right-2 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    Lightning Review
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700">Quick</span>
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Swipe through words with a 5-second timer. Perfect for rapid revision.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
