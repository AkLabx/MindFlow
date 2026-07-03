import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';
import { BookOpen, FolderOpen, Compass, List, Target, ShieldQuestion, Link, Zap } from 'lucide-react';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';

interface SynonymsHubProps {
    onBack?: () => void;
}

export const SynonymsHub: React.FC<SynonymsHubProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const swipeStats = useFlashcardStore(state => state.swipeStats);

    const remaining = 500 - (swipeStats.mastered + swipeStats.review);

    const quickActions = [
        { id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('/vocab/synonyms/config')), colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
        { id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('/vocab/synonyms/library')), colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
        { id: 'guided', label: 'Guided Exploration', icon: <Compass className="w-5 h-5" />, onClick: () => handleNavigation('guided', () => navigate('/vocab/synonyms/phase1')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
        { id: 'families', label: 'Word Families', icon: <List className="w-5 h-5" />, onClick: () => handleNavigation('families', () => navigate('/vocab/synonyms/list')), colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' }
    ];

    const gameActions = [
        { id: 'daily', label: 'Daily Challenge', icon: <Target className="w-5 h-5" />, onClick: () => handleNavigation('daily', () => navigate('/vocab/synonyms/quiz?mode=speed')), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
        { id: 'imposter', label: 'The Imposter Trap', icon: <ShieldQuestion className="w-5 h-5" />, onClick: () => handleNavigation('imposter', () => navigate('/vocab/synonyms/quiz?mode=imposter')), colorClass: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' },
        { id: 'connect', label: 'Tap & Connect', icon: <Link className="w-5 h-5" />, onClick: () => handleNavigation('connect', () => navigate('/vocab/synonyms/quiz?mode=connect')), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
        { id: 'lightning', label: 'Lightning Review', icon: <Zap className="w-5 h-5" />, onClick: () => handleNavigation('lightning', () => navigate('/vocab/synonyms/quiz?mode=speed')), colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' }
    ];

    return (
        <div className="flex flex-col h-full p-0 transition-colors duration-300">
            <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto">
                    <ContinueLearningBanner
                        domainName="Synonyms"
                        reviewCount={swipeStats.review > 0 ? swipeStats.review : 18}
                        onClick={() => handleNavigation('continue', () => navigate('/vocab/synonyms/config'))}
                    />
                    <DomainStatsRow
                        mastered={swipeStats.mastered}
                        reviewQueue={swipeStats.review > 0 ? swipeStats.review : 18}
                        remaining={remaining}
                    />
                    <div className="mt-2">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 px-1">Learning Paths</h3>
                        <QuickActionsGrid actions={quickActions} />
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 px-1">Games & Challenges</h3>
                        <QuickActionsGrid actions={gameActions} />
                    </div>
                </div>
            </div>
        </div>
    );
};
