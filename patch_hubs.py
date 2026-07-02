import os
import re

hubs = [
    ('src/features/vocab/idioms/IdiomsHub.tsx', 'Idioms', '/vocab/idioms/config', '/vocab/idioms/library', 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'),
    ('src/features/vocab/ows/OWSHub.tsx', 'OWS', '/vocab/ows/config', '/vocab/ows/library', 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'),
    ('src/features/vocab/synonyms/SynonymsHub.tsx', 'Synonyms', '/vocab/synonyms/config', '/vocab/synonyms/library', 'text-purple-500 bg-purple-50 dark:bg-purple-500/10')
]

for file_path, domain_name, config_route, lib_route, color_class in hubs:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        continue

    with open(file_path, 'r') as f:
        content = f.read()

    # Import our new components
    import_block = """import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../english/components/workspace';
import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';
"""

    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\n" + import_block)

    # Insert useFlashcardStore call to get stats
    store_hook = """    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const swipeStats = useFlashcardStore(state => state.swipeStats);

    // Derived dummy remaining count for workspace feel
    const remaining = 500 - (swipeStats.mastered + swipeStats.review);

    const quickActions = [
        { id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('%s')), colorClass: '%s' },
        { id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('%s')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
        { id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
        { id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }
    ];
""" % (config_route, color_class, lib_route)

    content = re.sub(
        r'const navigate = useNavigate\(\);\n\s*const { loadingId, handleNavigation } = useNavSpinner\(\);',
        store_hook,
        content
    )

    # Replace the massive Core Learning UI
    replacement_ui = """            <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-1 sm:px-2 pb-6 pt-1">
                <div className="flex flex-col gap-1 w-full">
                    <ContinueLearningBanner
                        domainName="%s"
                        reviewCount={swipeStats.review > 0 ? swipeStats.review : 18}
                        onClick={() => handleNavigation('continue', () => navigate('%s'))}
                    />
                    <DomainStatsRow
                        mastered={swipeStats.mastered}
                        reviewQueue={swipeStats.review > 0 ? swipeStats.review : 18}
                        remaining={remaining}
                    />
                    <QuickActionsGrid actions={quickActions} />
                </div>
            </div>
""" % (domain_name, config_route)

    # Replace everything from <div className="relative z-10..." to the end of the second-to-last </div>
    pattern = r'<div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">.*?(?=</div>\s*</div>\s*\);)'

    content = re.sub(pattern, replacement_ui, content, flags=re.DOTALL)

    # Also clean up the padding on the root container of the hub
    content = content.replace('p-2 sm:p-4', 'p-0')

    with open(file_path, 'w') as f:
        f.write(content)

    print(f"Patched {file_path}")
