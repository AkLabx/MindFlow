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

# Synonym Navigation
rewrite_exact('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any));')
])

# Synonym PdfGenerator
rewrite_exact('src/features/synonyms/utils/pdfGenerator.ts', [
    ('Array.isArray(words) ? words.join(', 'Array.isArray(words || []) ? (words || []).join(')
])

# QuizConfig
rewrite_exact('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

# ActiveFiltersBar
rewrite_exact('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    ('const count = filterCounts[key as keyof FilterCounts]?.[val] || 0;', 'const count = (filterCounts[key as keyof FilterCounts] || {})[val] || 0;')
])

# QuizPdfPptGenerator
rewrite_exact('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

# AppRoutes
rewrite_exact('src/routes/AppRoutes.tsx', [
    ('initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}', 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    ('isOws={(location.state as any)?.isOws}', 'isOws={!!(location.state as any)?.isOws}')
])
