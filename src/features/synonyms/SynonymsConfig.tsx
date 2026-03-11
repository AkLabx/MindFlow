import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SynonymWord } from '../quiz/types';
import { quizEngine } from '../quiz/engine';
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
                const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();
                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
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
        onStart(sortedData, { mode: 'learning' });
    };

    if (isDataLoading) {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 space-y-4 max-w-5xl mx-auto w-full">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse mb-8"></div>
                <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse mt-8 mb-4"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse mt-8 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 items-center justify-center">
                 <div className="text-6xl mb-4" role="img" aria-hidden="true">⚠️</div>
                 <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Failed to load vocabulary</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">There was a problem loading the synonym data. Please check your connection and try again.</p>
                 <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Go Back
                </button>
            </div>
        )
    }

    if (!isDataLoading && sortedData.length === 0) {
        return (
             <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 items-center justify-center">
                 <div className="text-6xl mb-4" role="img" aria-hidden="true">s📭</div>
                 <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">No Vocabulary Available</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">We couldn't find any words for you to learn at the moment. Please try again later.</p>
                 <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Go Back
                </button>
            </div>
        )
    }


    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                <button
                    onClick={onBack}
                    aria-label="Go back"
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    ← Back
                </button>
                <h1 className="text-xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Synonyms Master
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-5xl mx-auto p-4 md:p-8">

                    {/* Daily Challenge */}
                    <button
                        onClick={() => navigate('/synonyms/quiz?mode=speed')}
                        className="w-full text-left bg-sky-50 dark:bg-sky-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-sky-100 dark:border-sky-900/40 border-b-4 border-b-sky-200 dark:border-b-sky-700 hover:border-sky-300 dark:hover:border-sky-500 mb-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl" role="img" aria-hidden="true">
                                🎯
                            </div>
                            <div className="flex-1 pr-2 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daily 20 Words Challenge</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Master 20 important words every day.</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-sky-200 dark:bg-sky-900/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500 w-[0%]" />
                                    </div>
                                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">0 / 20</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-sm flex-shrink-0 group-hover:bg-sky-700 transition-colors hidden sm:block">
                            Start
                        </div>
                    </button>

                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Phase 1: Foundation</h3>
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {/* Phase 1: Guided Learning */}
                        <button
                            onClick={() => navigate('/synonyms/phase1')}
                            className="w-full text-left bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-amber-100 dark:border-amber-900/40 border-b-4 border-b-amber-200 dark:border-b-amber-700 hover:border-amber-300 dark:hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl" role="img" aria-hidden="true">
                                    📖
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Guided Word Exploration</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        Discover words with deep meanings, Hindi translations, and audio pronunciation. Perfect for building a strong foundation.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Phase 2: Learn & Master</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

                        {/* Mode 1: Swipe Flashcards */}
                        <button
                            onClick={handleStartLearning}
                            className="w-full text-left bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-blue-100 dark:border-blue-900/40 border-b-4 border-b-blue-200 dark:border-b-blue-700 hover:border-blue-300 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl" role="img" aria-hidden="true">
                                    🃏
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Smart Flashcards</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        Swipe through High-Frequency words first. Tap to reveal meanings and Mark as Mastered.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Mode 2: Cluster List */}
                        <button
                            onClick={() => {
                                onStart(sortedData, { mode: 'list' });
                                navigate('/synonyms/list');
                            }}
                            className="w-full text-left bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl" role="img" aria-hidden="true">
                                    📋
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Word Families (List)</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        View words grouped by meaning. See which words are hot (🔥) and review your Mastery spectrum.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Phase 3 Placeholder */}
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 mt-8">Phase 3: Gamified Practice</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Game 1: The Imposter Trap */}
                        <button
                            onClick={() => navigate('/synonyms/quiz?mode=imposter')}
                            className="w-full text-left bg-violet-50 dark:bg-violet-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-violet-100 dark:border-violet-900/40 border-b-4 border-b-violet-200 dark:border-b-violet-700 hover:border-violet-300 dark:hover:border-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl" role="img" aria-hidden="true">
                                    🕵️‍♂️
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">The Imposter Trap</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        Spot the Antonym hiding among Synonyms before the 10-second timer runs out.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Game 2: Tap & Connect */}
                        <button
                            onClick={() => navigate('/synonyms/quiz?mode=connect')}
                            className="w-full text-left bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl" role="img" aria-hidden="true">
                                    🔗
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tap & Connect</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        Match the main word with its synonym in a fast-paced dual-column challenge.
                                    </p>
                                </div>
                            </div>
                        </button>


                        {/* Game 3: Speed Mode */}
                        <button
                            onClick={() => navigate('/synonyms/quiz?mode=speed')}
                            className="w-full text-left bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-indigo-100 dark:border-indigo-900/40 border-b-4 border-b-indigo-200 dark:border-b-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-500 md:col-span-2 lg:col-span-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-3xl relative" role="img" aria-hidden="true">
                                    ⚡
                                    <span className="absolute -top-2 -right-2 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                </div>
                                <div className="flex-1 pr-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                        Lightning Review
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700">Quick</span>
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        Swipe through words with a 5-second timer. Perfect for rapid revision.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
