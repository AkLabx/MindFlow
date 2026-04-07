import fs from 'fs';

function replace(file, searchStr, replaceStr) {
  try {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(searchStr, replaceStr);
    fs.writeFileSync(file, text);
  } catch(e) {}
}

function replaceRegex(file, searchRegex, replaceStr) {
  try {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(searchRegex, replaceStr);
    fs.writeFileSync(file, text);
  } catch(e) {}
}

// 1. DownloadReadyModal.tsx
replaceRegex('src/components/ui/DownloadReadyModal.tsx', /if \(navigator\.share\) \{/g, 'if (typeof navigator.share !== "undefined") {');
replaceRegex('src/components/ui/DownloadReadyModal.tsx', /if \(navigator\.canShare && navigator\.canShare\(\{ files: \[file\] \}\)\) \{/g, 'if (typeof navigator.canShare !== "undefined" && navigator.canShare({ files: [file] })) {');

// 2. Navigation Panels
replaceRegex('src/features/flashcards/components/FlashcardNavigationPanel.tsx', /const generatePdf = \(await import\('\.\.\/utils\/pdfGenerator'\)\)\.generatePdf;/g, 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;');
replaceRegex('src/features/ows/components/OWSNavigationPanel.tsx', /const generatePdf = \(await import\('\.\.\/utils\/pdfGenerator'\)\)\.generatePdf;/g, 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;');
replaceRegex('src/features/synonyms/components/SynonymNavigationPanel.tsx', /const generatePdf = \(await import\('\.\.\/utils\/pdfGenerator'\)\)\.generatePdf;/g, 'const generatePdf = (await import(\'../utils/pdfGenerator\')).generatePdf as any;');

// 3. Push notifications
replaceRegex('src/features/notifications/hooks/usePushNotifications.ts', /const authArray = new Uint8Array\(auth\);/g, 'const authArray = Array.from(new Uint8Array(auth));');
replaceRegex('src/features/notifications/hooks/usePushNotifications.ts', /const p256dhArray = new Uint8Array\(p256dh\);/g, 'const p256dhArray = Array.from(new Uint8Array(p256dh));');

// 4. OWSSession
replaceRegex('src/features/ows/components/OWSSession.tsx', /const count = counts\[status\];/g, 'const count = counts[status as keyof typeof counts];');

// 5. QuizConfig and OWSConfig
replaceRegex('src/features/quiz/components/QuizConfig.tsx', /counts=\{filterCounts\.readStatus \|\| \{\}\}/g, 'counts={filterCounts.readStatus || {}}');
replaceRegex('src/features/quiz/components/QuizConfig.tsx', /counts=\{filterCounts\.readStatus\}/g, 'counts={filterCounts.readStatus || {}}');
replaceRegex('src/features/quiz/components/QuizConfig.tsx', /const current = prev\.readStatus \|\| \[\];/g, 'const current = prev.readStatus || [];');

replaceRegex('src/features/ows/OWSConfig.tsx', /deckMode: \[opt\]/g, 'deckMode: [opt as "Unseen" | "Mastered" | "Review" | "Clueless" | "Tricky"]');

// 6. ActiveFiltersBar
replaceRegex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', /return count > 0;/g, 'return (count || 0) > 0;');

// 7. useOptimizedFilterCounts
replaceRegex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', /selected\.includes/g, '(selected || []).includes');

// 8. useQuestionIndex
replaceRegex('src/features/quiz/hooks/useQuestionIndex.ts', /selectedValues\.length > 0/g, '(selectedValues || []).length > 0');
replaceRegex('src/features/quiz/hooks/useQuestionIndex.ts', /selectedValues\.includes/g, '(selectedValues || []).includes');

// 9. pdfGenerator
replaceRegex('src/features/flashcards/utils/pdfGenerator.ts', /export const generatePdf = async <T extends any>\(data: T\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');
replaceRegex('src/features/flashcards/utils/pdfGenerator.ts', /export const generatePdf = async \(data: never\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');

replaceRegex('src/features/ows/utils/pdfGenerator.ts', /export const generatePdf = async <T extends any>\(data: T\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');
replaceRegex('src/features/ows/utils/pdfGenerator.ts', /export const generatePdf = async \(data: never\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');

replaceRegex('src/features/synonyms/utils/pdfGenerator.ts', /export const generatePdf = async <T extends any>\(data: T\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');
replaceRegex('src/features/synonyms/utils/pdfGenerator.ts', /export const generatePdf = async \(data: never\[\], config: PDFGenerationConfig\): Promise<Blob> => \{/g, 'export const generatePdf = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {');
replaceRegex('src/features/synonyms/utils/pdfGenerator.ts', /Array\.isArray\(words\) \? words\.join/g, 'Array.isArray(words || []) ? (words || []).join');

// 10. QuizPdfPptGenerator
replaceRegex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', /counts=\{filterCounts\.readStatus \|\| \{\}\}/g, 'counts={filterCounts.readStatus || {}}');
replaceRegex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', /counts=\{filterCounts\.readStatus\}/g, 'counts={filterCounts.readStatus || {}}');
replaceRegex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', /const current = prev\.readStatus \|\| \[\];/g, 'const current = prev.readStatus || [];');

// 11. AppRoutes
replaceRegex('src/routes/AppRoutes.tsx', /const OWS_FILTERS_KEY = "mindflow_ows_filters";/g, 'const OWS_FILTERS_KEY = "mindflow_ows_filters";\nconst defaultOwsFilters: InitialFilters = { subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], examDateShift: [], tags: [], readStatus: [], deckMode: ["Unseen"] };');
replaceRegex('src/routes/AppRoutes.tsx', /initialFilters=\{savedFilters \? JSON\.parse\(savedFilters\) : undefined\}/g, 'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}');
replaceRegex('src/routes/AppRoutes.tsx', /isOws=\{\(location\.state as any\)\?.isOws\}/g, 'isOws={!!(location.state as any)?.isOws}');
