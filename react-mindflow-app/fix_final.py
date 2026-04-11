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

rewrite_exact('src/features/notifications/hooks/usePushNotifications.ts', [
    ('String.fromCharCode.apply(null, new Uint8Array(subscription.getKey(\'p256dh\') as ArrayBuffer))', 'String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey(\'p256dh\') as ArrayBuffer)))'),
    ('String.fromCharCode.apply(null, new Uint8Array(subscription.getKey(\'auth\') as ArrayBuffer))', 'String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey(\'auth\') as ArrayBuffer)))')
])

rewrite_exact('src/features/ows/components/OWSSession.tsx', [
    ('const count = counts[status];', 'const count = counts[status as keyof typeof counts];')
])

rewrite_exact('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

rewrite_exact('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    ('return count > 0;', 'return (count || 0) > 0;')
])

rewrite_exact('src/features/quiz/hooks/useOptimizedFilterCounts.ts', [
    ('selected.includes(', '(selected || []).includes(')
])

rewrite_exact('src/features/quiz/hooks/useQuestionIndex.ts', [
    ('selectedValues.length > 0', '(selectedValues || []).length > 0'),
    ('selectedValues.includes(', '(selectedValues || []).includes(')
])

rewrite_exact('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any));')
])

rewrite_exact('src/features/synonyms/utils/pdfGenerator.ts', [
    ('Array.isArray(words) ? words.join', 'Array.isArray(words || []) ? (words || []).join')
])

rewrite_exact('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

rewrite_exact('src/routes/AppRoutes.tsx', [
    ('const OWS_FILTERS_KEY = "mindflow_ows_filters";', 'const OWS_FILTERS_KEY = "mindflow_ows_filters";\\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };'),
    ('initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}', 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    ('isOws={(location.state as any)?.isOws}', 'isOws={!!(location.state as any)?.isOws}')
])
