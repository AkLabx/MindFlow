import os
import re

hubs = [
    ('src/features/vocab/idioms/IdiomsHub.tsx', 'Idioms', '/vocab/idioms/config', '/vocab/idioms/library', 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10', r'<div className="flex-1 flex flex-col space-y-12 pb-12">.*?(?=</div>\s*</div>\s*</div>)'),
    ('src/features/vocab/ows/OWSHub.tsx', 'OWS', '/vocab/ows/config', '/vocab/ows/library', 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', r'<div className="flex-1 flex flex-col space-y-12 pb-12">.*?(?=</div>\s*</div>\s*</div>)'),
    ('src/features/vocab/synonyms/SynonymsHub.tsx', 'Synonyms', '/vocab/synonyms/config', '/vocab/synonyms/library', 'text-purple-500 bg-purple-50 dark:bg-purple-500/10', r'<div className="flex-1 flex flex-col space-y-12 pb-12 mt-4">.*?(?=</div>\s*</div>\s*</div>\s*</div>)')
]

for file_path, domain, cfg_route, lib_route, color, pattern in hubs:
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Imports
    content = content.replace("import { motion } from 'framer-motion';",
        "import { motion } from 'framer-motion';\n"
        "import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';\n"
        "import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';\n"
        "import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';")

    # 2. Add Variables inside component body.
    # Find `const { loadingId, handleNavigation } = useNavSpinner();`
    var_block = f"""
    const swipeStats = useFlashcardStore(state => state.swipeStats);
    const remaining = 500 - (swipeStats.mastered + swipeStats.review);
    const quickActions = [
        {{ id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('{cfg_route}')), colorClass: '{color}' }},
        {{ id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('{lib_route}')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' }},
        {{ id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' }},
        {{ id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }}
    ];
"""
    content = content.replace("const { loadingId, handleNavigation } = useNavSpinner();", "const { loadingId, handleNavigation } = useNavSpinner();\n" + var_block)

    # 3. Replace the UI Block
    ui_block = f"""
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                    <ContinueLearningBanner
                        domainName="{domain}"
                        reviewCount={{swipeStats.review > 0 ? swipeStats.review : 18}}
                        onClick={{() => handleNavigation('continue', () => navigate('{cfg_route}'))}}
                    />
                    <DomainStatsRow
                        mastered={{swipeStats.mastered}}
                        reviewQueue={{swipeStats.review > 0 ? swipeStats.review : 18}}
                        remaining={{remaining}}
                    />
                    <QuickActionsGrid actions={{quickActions}} />
                </div>
"""
    content = re.sub(pattern, ui_block.strip(), content, flags=re.DOTALL)

    # Clean padding
    content = content.replace('p-2 sm:p-4', 'p-0')
    content = content.replace('p-4 sm:p-6 lg:p-8', 'p-0')

    with open(file_path, 'w') as f:
        f.write(content)

print("Clean Patch Complete")
