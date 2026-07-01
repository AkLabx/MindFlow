import { lazy } from 'react';
import React from 'react';
import { BookOpen, FileText, Languages, SpellCheck, Target } from 'lucide-react';
import { TabConfig } from '../../../components/common/CentralizedTabbedPage';
import { GrammarComingSoon } from '../components/placeholders/GrammarComingSoon';
import { MockComingSoon } from '../components/placeholders/MockComingSoon';

// Lazy load the full page modules to ensure code splitting
const LazyIdiomsPage = lazy(() => import('../../vocab/idioms/IdiomsHub').then(m => ({ default: m.IdiomsHub })));
const LazyOWSPage = lazy(() => import('../../vocab/ows/OWSHub').then(m => ({ default: m.OWSHub })));
const LazySynonymsPage = lazy(() => import('../../vocab/synonyms/SynonymsHub').then(m => ({ default: m.SynonymsHub })));

export const ENGLISH_TABS: Record<string, TabConfig> = {
    vocabidiom: {
        key: 'vocabidiom',
        label: "Idioms",
        component: LazyIdiomsPage,
        icon: React.createElement(BookOpen, { className: "w-5 h-5" }),
        legacyRoutes: ["/vocab/idioms"]
    },
    vocabows: {
        key: 'vocabows',
        label: "OWS",
        component: LazyOWSPage,
        icon: React.createElement(FileText, { className: "w-5 h-5" }),
        legacyRoutes: ["/vocab/ows"]
    },
    vocabsynonyms: {
        key: 'vocabsynonyms',
        label: "Synonyms",
        component: LazySynonymsPage,
        icon: React.createElement(Languages, { className: "w-5 h-5" }),
        legacyRoutes: ["/vocab/synonyms"]
    },
    enggrammar: {
        key: 'enggrammar',
        label: "Grammar",
        component: GrammarComingSoon,
        icon: React.createElement(SpellCheck, { className: "w-5 h-5" })
    },
    engmock: {
        key: 'engmock',
        label: "Mock Test",
        component: MockComingSoon,
        icon: React.createElement(Target, { className: "w-5 h-5" })
    }
};
