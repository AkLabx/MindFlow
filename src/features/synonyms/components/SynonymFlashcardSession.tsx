import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Flag, Eye, EyeOff, RotateCcw, Layers } from 'lucide-react';
import { SynonymWord, InitialFilters } from '../../quiz/types';

interface SynonymFlashcardSessionProps {
    data: SynonymWord[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onExit: () => void;
    onFinish: () => void;
    filters: InitialFilters;
    onJump: (index: number) => void;
}

export const SynonymFlashcardSession: React.FC<SynonymFlashcardSessionProps> = ({
    data,
    currentIndex,
    onNext,
    onPrev,
    onExit,
    onFinish,
    filters,
    onJump
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const word = data[currentIndex];

    if (!data || data.length === 0 || !word) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-4">
                <p>No synonyms loaded.</p>
                <button onClick={onExit} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
            </div>
        );
    }

    const handleNext = () => {
        setIsFlipped(false);
        if (currentIndex < data.length - 1) onNext();
        else onFinish();
    };

    const handlePrev = () => {
        setIsFlipped(false);
        if (currentIndex > 0) onPrev();
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden select-none">
            {/* Header */}
            <header className="px-4 py-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onExit}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                        aria-label="Exit Session"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {filters.subject} &bull; {filters.subTopic}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {currentIndex + 1} of {data.length}
                        </span>
                    </div>
                </div>
            </header>

            {/* Flashcard Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 perspective-1000 relative w-full max-w-2xl mx-auto">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200 dark:bg-gray-800">
                    <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 ease-out"
                        style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
                    />
                </div>

                {/* Flip Card Container */}
                <div
                    className={`relative w-full aspect-[4/3] max-h-[60vh] transition-all duration-500 transform-style-3d cursor-pointer group`}
                    style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front Face */}
                    <div className="absolute inset-0 backface-hidden w-full h-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col p-6 sm:p-10 justify-center items-center text-center hover:shadow-2xl transition-shadow">
                        <div className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 block">
                            Tap to reveal meaning
                        </span>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4">
                            {word.word}
                        </h2>
                        <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-bold tracking-wide border border-emerald-200 dark:border-emerald-800/50">
                            {word.pos}
                        </span>
                    </div>

                    {/* Back Face */}
                    <div
                        className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl shadow-xl border border-emerald-100 dark:border-gray-700 p-6 sm:p-10 flex flex-col justify-between"
                        style={{ transform: 'rotateX(180deg)' }}
                    >
                        <div className="overflow-y-auto custom-scrollbar pr-2 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{word.word}</h3>
                                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    {word.meaning}
                                </p>
                                {word.hindiMeaning && (
                                    <p className="text-md text-emerald-700 dark:text-emerald-400 mt-2 font-medium bg-white/50 dark:bg-gray-900/50 p-3 rounded-xl inline-block border border-emerald-100 dark:border-gray-700">
                                        {word.hindiMeaning}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center">
                                        <Layers className="w-3 h-3 mr-1" /> Synonyms
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {word.synonyms.map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm font-medium border border-emerald-200/50 dark:border-emerald-800/30">
                                                {s.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center">
                                        <EyeOff className="w-3 h-3 mr-1" /> Antonyms
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {word.antonyms.map((a, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-rose-100/50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 rounded-lg text-sm font-medium border border-rose-200/50 dark:border-rose-800/30">
                                                {a.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Navigation Controls */}
            <footer className="p-4 pb-8 sm:pb-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-10 relative">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        <ChevronLeft className="w-5 h-5" /> Prev
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {currentIndex === data.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </footer>

            {/* Global styles for 3D flip (if not already in CSS) */}
            <style dangerouslySetInnerHTML={{__html: `
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
            `}} />
        </div>
    );
};
