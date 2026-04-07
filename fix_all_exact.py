import os
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

# 1. src/features/notifications/hooks/usePushNotifications.ts
rewrite_exact('src/features/notifications/hooks/usePushNotifications.ts', [
    ('const authArray = new Uint8Array(auth);', 'const authArray = Array.from(new Uint8Array(auth));'),
    ('const p256dhArray = new Uint8Array(p256dh);', 'const p256dhArray = Array.from(new Uint8Array(p256dh));')
])

# 2. src/features/ows/components/OWSSession.tsx
rewrite_exact('src/features/ows/components/OWSSession.tsx', [
    ('const count = counts[status];', 'const count = counts[status as keyof typeof counts];')
])

# 3. src/features/quiz/components/QuizConfig.tsx
rewrite_exact('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

# 4. src/features/quiz/components/ui/ActiveFiltersBar.tsx
rewrite_exact('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    ('return count > 0;', 'return (count || 0) > 0;')
])

# 5. src/features/quiz/hooks/useOptimizedFilterCounts.ts
rewrite_exact('src/features/quiz/hooks/useOptimizedFilterCounts.ts', [
    ('selected.includes(', '(selected || []).includes(')
])

# 6. src/features/quiz/hooks/useQuestionIndex.ts
rewrite_exact('src/features/quiz/hooks/useQuestionIndex.ts', [
    ('selectedValues.length > 0', '(selectedValues || []).length > 0'),
    ('selectedValues.includes(', '(selectedValues || []).includes(')
])

# 7. src/features/synonyms/components/SynonymNavigationPanel.tsx
rewrite_exact('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any));')
])

# 8. src/features/synonyms/utils/pdfGenerator.ts
rewrite_exact('src/features/synonyms/utils/pdfGenerator.ts', [
    ('Array.isArray(words) ? words.join', 'Array.isArray(words || []) ? (words || []).join')
])

# 9. src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx
rewrite_exact('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

# 10. src/routes/AppRoutes.tsx
rewrite_exact('src/routes/AppRoutes.tsx', [
    ('const OWS_FILTERS_KEY = "mindflow_ows_filters";', 'const OWS_FILTERS_KEY = "mindflow_ows_filters";\\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };'),
    ('initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}', 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    ('isOws={(location.state as any)?.isOws}', 'isOws={!!(location.state as any)?.isOws}')
])
