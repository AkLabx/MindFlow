import re

def rewrite_exact(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        for search, replace in replacements:
            content = content.replace(search, replace)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# OWSSession
rewrite_exact('src/features/ows/components/OWSSession.tsx', [
    ('prev[lastAction.status]', 'prev[lastAction.status as keyof typeof prev]')
])

# QuizConfig
rewrite_exact('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];'),
    ('filterCounts.readStatus', '(filterCounts.readStatus || {})'),
    ('counts={filterCounts.deckMode || {}}', 'counts={filterCounts.deckMode || {}}'),
    ('counts={filterCounts.deckMode}', 'counts={filterCounts.deckMode || {}}')
])

# ActiveFiltersBar
rewrite_exact('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    ('const count = filterCounts[key as keyof FilterCounts]?.[val] || 0;', 'const count = (filterCounts[key as keyof FilterCounts] || {})[val] || 0;')
])

# useOptimizedFilterCounts
rewrite_exact('src/features/quiz/hooks/useOptimizedFilterCounts.ts', [
    ('if (selected.includes(item[key]))', 'if ((selected || []).includes(item[key]))'),
    ('if (selected.includes(val))', 'if ((selected || []).includes(val))')
])

# useQuestionIndex
rewrite_exact('src/features/quiz/hooks/useQuestionIndex.ts', [
    ('if (selectedValues.length > 0 && !selectedValues.includes', 'if ((selectedValues || []).length > 0 && !(selectedValues || []).includes'),
    ('if (selectedValues.length > 0', 'if ((selectedValues || []).length > 0'),
    ('!selectedValues.includes(', '!(selectedValues || []).includes(')
])

# SynonymNavigationPanel
rewrite_exact('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF)', 'import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any)')
])

# synonym pdfGenerator
rewrite_exact('src/features/synonyms/utils/pdfGenerator.ts', [
    ('Array.isArray(words) ? words.join(', 'Array.isArray(words || []) ? (words || []).join(')
])

# QuizPdfPptGenerator
rewrite_exact('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    ('filterCounts.readStatus', '(filterCounts.readStatus || {})')
])

# AppRoutes
rewrite_exact('src/routes/AppRoutes.tsx', [
    ('initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}', 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    ('isOws={(location.state as any)?.isOws}', 'isOws={!!(location.state as any)?.isOws}')
])
