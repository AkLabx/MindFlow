cat << 'INNER_EOF' > src/features/vocab/idioms/IdiomsHub.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';
import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';

interface IdiomsHubProps {
    onBack?: () => void;
}

export const IdiomsHub: React.FC<IdiomsHubProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const swipeStats = useFlashcardStore(state => state.swipeStats);

    // Derived dummy remaining count for workspace feel
    const remaining = 500 - (swipeStats.mastered + swipeStats.review);

    const quickActions = [
        { id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('/vocab/idioms/config')), colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
        { id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('/vocab/idioms/library')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
        { id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
        { id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative p-0">
            <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto">
                    <ContinueLearningBanner
                        domainName="Idioms"
                        reviewCount={swipeStats.review > 0 ? swipeStats.review : 18}
                        onClick={() => handleNavigation('continue', () => navigate('/vocab/idioms/config'))}
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
INNER_EOF

cat << 'INNER_EOF' > src/features/vocab/ows/OWSHub.tsx
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative p-0">
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
INNER_EOF

cat << 'INNER_EOF' > src/features/vocab/synonyms/SynonymsHub.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';
import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';
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
        { id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('/vocab/synonyms/config')), colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
        { id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('/vocab/synonyms/library')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
        { id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
        { id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }
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
                    <QuickActionsGrid actions={quickActions} />
                </div>
            </div>
        </div>
    );
};
INNER_EOF
