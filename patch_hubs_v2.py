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

    # Add imports
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../../features/english/components/workspace';\nimport { BookOpen, FolderOpen, Plus, Download } from 'lucide-react';\nimport { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';")

    # Inject variables after handleNavigation
    vars_to_inject = f"""
    const swipeStats = useFlashcardStore(state => state.swipeStats);
    const remaining = 500 - (swipeStats.mastered + swipeStats.review);

    const quickActions = [
        {{ id: 'smart', label: 'Smart Flashcards', icon: <BookOpen className="w-5 h-5" />, onClick: () => handleNavigation('smart', () => navigate('{config_route}')), colorClass: '{color_class}' }},
        {{ id: 'library', label: 'Saved Decks', icon: <FolderOpen className="w-5 h-5" />, onClick: () => handleNavigation('library', () => navigate('{lib_route}')), colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' }},
        {{ id: 'create', label: 'Create Deck', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/tools/flashcard-maker'), colorClass: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' }},
        {{ id: 'import', label: 'Import Deck', icon: <Download className="w-5 h-5" />, onClick: () => navigate('/admin/upload'), colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }}
    ];
"""
    content = content.replace("const { loadingId, handleNavigation } = useNavSpinner();", f"const {{ loadingId, handleNavigation }} = useNavSpinner();\n{vars_to_inject}")

    # For Idioms/OWS, there's a `<div className="flex-1 flex flex-col space-y-12 pb-12">`
    # Let's replace the whole `div.relative.z-10` children except the wrapper.

    workspace_ui = f"""
                <div className="flex flex-col gap-1 w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 pb-6">
                    <ContinueLearningBanner
                        domainName="{domain_name}"
                        reviewCount={{swipeStats.review > 0 ? swipeStats.review : 18}}
                        onClick={{() => handleNavigation('continue', () => navigate('{config_route}'))}}
                    />
                    <DomainStatsRow
                        mastered={{swipeStats.mastered}}
                        reviewQueue={{swipeStats.review > 0 ? swipeStats.review : 18}}
                        remaining={{remaining}}
                    />
                    <QuickActionsGrid actions={{quickActions}} />
                </div>
"""

    # We find `<div className="flex-1 flex flex-col space-y-12 pb-12">` and replace its entire block up to its closing tag (for Idioms/OWS)
    if "IdiomsHub" in file_path or "OWSHub" in file_path:
        content = re.sub(
            r'<div className="flex-1 flex flex-col space-y-12 pb-12">.*?(?=</div>\s*</div>\s*</div>)',
            workspace_ui.strip(),
            content,
            flags=re.DOTALL
        )
    elif "SynonymsHub" in file_path:
        # SynonymsHub has `<div className="flex-1 flex flex-col space-y-12 pb-12 mt-4">`
        content = re.sub(
            r'<div className="flex-1 flex flex-col space-y-12 pb-12 mt-4">.*?(?=</div>\s*</div>\s*</div>\s*</div>)',
            workspace_ui.strip(),
            content,
            flags=re.DOTALL
        )

    content = content.replace('p-2 sm:p-4', 'p-0')
    content = content.replace('p-4 sm:p-6 lg:p-8', 'p-0')

    with open(file_path, 'w') as f:
        f.write(content)

print("Hubs repatched carefully.")
