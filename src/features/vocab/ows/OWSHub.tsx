import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';
import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';

interface OWSHubProps {
    onBack?: () => void;
}

export const OWSHub: React.FC<OWSHubProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const swipeStats = useFlashcardStore(state => state.swipeStats);

    const remaining = 500 - (swipeStats.mastered + swipeStats.review);

    const quickActions = [
        { id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('/vocab/ows/config')), colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
        { id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('/vocab/ows/library')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
        { id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
        { id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }
    ];

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden relative p-0">
            <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto">
                    <ContinueLearningBanner
                        domainName="OWS"
                        reviewCount={swipeStats.review > 0 ? swipeStats.review : 18}
                        onClick={() => handleNavigation('continue', () => navigate('/vocab/ows/config'))}
                    />
                    <DomainStatsRow
                        mastered={swipeStats.mastered}
                        reviewQueue={swipeStats.review > 0 ? swipeStats.review : 18}
                        remaining={remaining}
                    />
                    <QuickActionsGrid actions={quickActions} />
                </div>
            </div>
        </div>
    );
};
