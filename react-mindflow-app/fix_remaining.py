import re

def rewrite(filepath, search, replace):
    with open(filepath, 'r') as f:
        c = f.read()
    c = c.replace(search, replace)
    with open(filepath, 'w') as f:
        f.write(c)

rewrite('src/features/notifications/hooks/usePushNotifications.ts',
        'const authArray = new Uint8Array(auth);',
        'const authArray = Array.from(new Uint8Array(auth));')
rewrite('src/features/notifications/hooks/usePushNotifications.ts',
        'const p256dhArray = new Uint8Array(p256dh);',
        'const p256dhArray = Array.from(new Uint8Array(p256dh));')

rewrite('src/features/ows/components/OWSSession.tsx',
        'const count = counts[status];',
        'const count = counts[status as keyof typeof counts];')

rewrite('src/features/quiz/components/QuizConfig.tsx',
        'counts={filterCounts.readStatus || {}}',
        'counts={filterCounts.readStatus || {}}')
rewrite('src/features/quiz/components/QuizConfig.tsx',
        'counts={filterCounts.readStatus}',
        'counts={filterCounts.readStatus || {}}')
rewrite('src/features/quiz/components/QuizConfig.tsx',
        'const current = prev.readStatus || [];',
        'const current = prev.readStatus || [];')

rewrite('src/features/quiz/components/ui/ActiveFiltersBar.tsx',
        'return count > 0;',
        'return (count || 0) > 0;')

rewrite('src/features/quiz/hooks/useOptimizedFilterCounts.ts',
        'selected.includes(',
        '(selected || []).includes(')

rewrite('src/features/quiz/hooks/useQuestionIndex.ts',
        'selectedValues.length > 0',
        '(selectedValues || []).length > 0')
rewrite('src/features/quiz/hooks/useQuestionIndex.ts',
        'selectedValues.includes(',
        '(selectedValues || []).includes(')

rewrite('src/features/synonyms/components/SynonymNavigationPanel.tsx',
        'm => m.generateSynonymsPDF',
        'm => m.generateSynonymsPDF as any')

rewrite('src/features/synonyms/utils/pdfGenerator.ts',
        'Array.isArray(words) ? words.join',
        'Array.isArray(words || []) ? (words || []).join')

rewrite('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx',
        'counts={filterCounts.readStatus || {}}',
        'counts={filterCounts.readStatus || {}}')
rewrite('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx',
        'counts={filterCounts.readStatus}',
        'counts={filterCounts.readStatus || {}}')
rewrite('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx',
        'const current = prev.readStatus || [];',
        'const current = prev.readStatus || [];')

rewrite('src/routes/AppRoutes.tsx',
        'const OWS_FILTERS_KEY = "mindflow_ows_filters";',
        'const OWS_FILTERS_KEY = "mindflow_ows_filters";\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };')
rewrite('src/routes/AppRoutes.tsx',
        'initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}',
        'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}')
rewrite('src/routes/AppRoutes.tsx',
        'isOws={(location.state as any)?.isOws}',
        'isOws={!!(location.state as any)?.isOws}')
