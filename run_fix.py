import re

def rewrite_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        for search, replace in replacements:
            content = re.sub(search, replace, content)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

rewrite_file('src/features/notifications/hooks/usePushNotifications.ts', [
    (r'const authArray = new Uint8Array\(auth\);', r'const authArray = Array.from(new Uint8Array(auth));'),
    (r'const p256dhArray = new Uint8Array\(p256dh\);', r'const p256dhArray = Array.from(new Uint8Array(p256dh));')
])

rewrite_file('src/features/ows/components/OWSSession.tsx', [
    (r'const count = counts\[status\];', r'const count = counts[status as keyof typeof counts];')
])

rewrite_file('src/features/quiz/components/QuizConfig.tsx', [
    (r'counts=\{filterCounts\.readStatus \|\| \{\}\}', r'counts={filterCounts.readStatus || {}}'),
    (r'counts=\{filterCounts\.readStatus\}', r'counts={filterCounts.readStatus || {}}'),
    (r'const current = prev\.readStatus \|\| \[\];', r'const current = prev.readStatus || [];')
])

rewrite_file('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    (r'return count > 0;', r'return (count || 0) > 0;')
])

rewrite_file('src/features/quiz/hooks/useOptimizedFilterCounts.ts', [
    (r'selected\.includes\(', r'(selected || []).includes(')
])

rewrite_file('src/features/quiz/hooks/useQuestionIndex.ts', [
    (r'selectedValues\.length > 0', r'(selectedValues || []).length > 0'),
    (r'selectedValues\.includes\(', r'(selectedValues || []).includes(')
])

rewrite_file('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    (r'import\(\'\.\./utils/pdfGenerator\'\)\.then\(m => m\.generateSynonymsPDF\)', r'import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any)')
])

rewrite_file('src/features/synonyms/utils/pdfGenerator.ts', [
    (r'Array\.isArray\(words\) \? words\.join', r'Array.isArray(words || []) ? (words || []).join')
])

rewrite_file('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    (r'counts=\{filterCounts\.readStatus \|\| \{\}\}', r'counts={filterCounts.readStatus || {}}'),
    (r'counts=\{filterCounts\.readStatus\}', r'counts={filterCounts.readStatus || {}}'),
    (r'const current = prev\.readStatus \|\| \[\];', r'const current = prev.readStatus || [];')
])

rewrite_file('src/routes/AppRoutes.tsx', [
    (r'const OWS_FILTERS_KEY = "mindflow_ows_filters";', r'const OWS_FILTERS_KEY = "mindflow_ows_filters";\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };'),
    (r'initialFilters=\{savedFilters \? JSON\.parse\(savedFilters\) : undefined\}', r'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    (r'isOws=\{\(location\.state as any\)\?\.isOws\}', r'isOws={!!(location.state as any)?.isOws}')
])
