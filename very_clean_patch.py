import os
import re

def process_file(file_path, domain, cfg_route, lib_route, color):
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Imports
    if "import { ContinueLearningBanner" not in content:
        content = content.replace("import { motion } from 'framer-motion';",
            "import { motion } from 'framer-motion';\n"
            "import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';\n"
            "import { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';\n"
            "import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';")

    # 2. Extract out the `handleNavigation` block to replace accurately without duplication
    # We will search for `const { loadingId, handleNavigation } = useNavSpinner();`
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
    if "const swipeStats =" not in content:
        content = content.replace("const { loadingId, handleNavigation } = useNavSpinner();", "const { loadingId, handleNavigation } = useNavSpinner();\n" + var_block)

    # 3. Carefully replace the UI Block
    ui_block = f"""
            <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto">
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
            </div>
"""

    # Identify the section to replace: from `<div className="relative z-10 ...` to its matching closing div before the end of the return statement
    # Idioms and OWS share similar structure
    if "IdiomsHub" in file_path or "OWSHub" in file_path:
        content = re.sub(
            r'<div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">.*?(?=</div\s*>\s*</div\s*>\s*\);)',
            ui_block.strip() + "\n",
            content,
            flags=re.DOTALL
        )
    elif "SynonymsHub" in file_path:
        # Synonyms has slightly different nested divs
        content = re.sub(
            r'<div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">.*?(?=</div\s*>\s*</div\s*>\s*\);)',
            ui_block.strip() + "\n",
            content,
            flags=re.DOTALL
        )

    # 4. Clean padding on the root container of the component
    content = re.sub(r'className="flex flex-col h-full(.*?) p-2 sm:p-4"', r'className="flex flex-col h-full\1 p-0"', content)

    with open(file_path, 'w') as f:
        f.write(content)

process_file('src/features/vocab/idioms/IdiomsHub.tsx', 'Idioms', '/vocab/idioms/config', '/vocab/idioms/library', 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10')
process_file('src/features/vocab/ows/OWSHub.tsx', 'OWS', '/vocab/ows/config', '/vocab/ows/library', 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10')
process_file('src/features/vocab/synonyms/SynonymsHub.tsx', 'Synonyms', '/vocab/synonyms/config', '/vocab/synonyms/library', 'text-purple-500 bg-purple-50 dark:bg-purple-500/10')

print("Very Clean Patch Complete")
