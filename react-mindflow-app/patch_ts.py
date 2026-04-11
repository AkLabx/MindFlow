import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()

    for search, replace in replacements:
        content = content.replace(search, replace)

    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file('src/components/ui/DownloadReadyModal.tsx', [
    ('if (navigator.share && blob && !forceDownload)', 'if (typeof navigator.share !== "undefined" && blob && !forceDownload)'),
    ('{(navigator.share && blob && !forceDownload)', '{(typeof navigator.share !== "undefined" && blob && !forceDownload)')
])

replace_in_file('src/features/flashcards/components/FlashcardNavigationPanel.tsx', [
    ('const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf;', 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;')
])

replace_in_file('src/features/ows/components/OWSNavigationPanel.tsx', [
    ('const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf;', 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;')
])

replace_in_file('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf;', 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;')
])

replace_in_file('src/features/notifications/hooks/usePushNotifications.ts', [
    ('const authArray = new Uint8Array(auth);', 'const authArray = Array.from(new Uint8Array(auth));'),
    ('const p256dhArray = new Uint8Array(p256dh);', 'const p256dhArray = Array.from(new Uint8Array(p256dh));')
])

replace_in_file('src/features/ows/components/OWSSession.tsx', [
    ('const count = counts[status];', 'const count = counts[status as keyof typeof counts];')
])

replace_in_file('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

replace_in_file('src/features/quiz/components/ui/ActiveFiltersBar.tsx', [
    ('return count > 0;', 'return (count || 0) > 0;')
])

replace_in_file('src/features/quiz/hooks/useOptimizedFilterCounts.ts', [
    ('selected.includes(', '(selected || []).includes(')
])

replace_in_file('src/features/quiz/hooks/useQuestionIndex.ts', [
    ('selectedValues.length > 0', '(selectedValues || []).length > 0'),
    ('selectedValues.includes(', '(selectedValues || []).includes(')
])

replace_in_file('src/features/flashcards/utils/pdfGenerator.ts', [
    ('export const generatePdf = async <T extends any>(data: T[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {'),
    ('export const generatePdf = async (data: never[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])

replace_in_file('src/features/ows/utils/pdfGenerator.ts', [
    ('export const generatePdf = async <T extends any>(data: T[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {'),
    ('export const generatePdf = async (data: never[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])

replace_in_file('src/features/synonyms/utils/pdfGenerator.ts', [
    ('export const generatePdf = async <T extends any>(data: T[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {'),
    ('export const generatePdf = async (data: never[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {'),
    ('Array.isArray(words) ? words.join', 'Array.isArray(words || []) ? (words || []).join')
])

replace_in_file('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', [
    ('counts={filterCounts.readStatus || {}}', 'counts={filterCounts.readStatus || {}}'),
    ('counts={filterCounts.readStatus}', 'counts={filterCounts.readStatus || {}}'),
    ('const current = prev.readStatus || [];', 'const current = prev.readStatus || [];')
])

replace_in_file('src/routes/AppRoutes.tsx', [
    ('const OWS_FILTERS_KEY = "mindflow_ows_filters";', 'const OWS_FILTERS_KEY = "mindflow_ows_filters";\\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };'),
    ('initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}', 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}'),
    ('isOws={(location.state as any)?.isOws}', 'isOws={!!(location.state as any)?.isOws}')
])
