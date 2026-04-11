#!/bin/bash

# 1. DownloadReadyModal
sed -i 's/if (navigator.share && blob && !forceDownload) {/if (typeof navigator.share === "function" \&\& blob \&\& !forceDownload) {/g' src/components/ui/DownloadReadyModal.tsx
sed -i "s/{(navigator.share \&\& blob \&\& !forceDownload) ? <Share className=\"w-5 h-5\" \/> : <Download className=\"w-5 h-5\" \/>}/{(typeof navigator.share === 'function' \&\& blob \&\& !forceDownload) ? <Share className=\"w-5 h-5\" \/> : <Download className=\"w-5 h-5\" \/>}/g" src/components/ui/DownloadReadyModal.tsx
sed -i "s/{(navigator.share \&\& blob \&\& !forceDownload) ? 'Open \/ Share File' : 'Save File'}/{(typeof navigator.share === 'function' \&\& blob \&\& !forceDownload) ? 'Open \/ Share File' : 'Save File'}/g" src/components/ui/DownloadReadyModal.tsx

# 2. Navigation Panels
sed -i "s/const generatePdf = (await import('\.\.\/utils\/pdfGenerator'))\.generatePdf;/const generatePdf = (await import('..\/utils\/pdfGenerator')).generatePdf as any;/g" src/features/flashcards/components/FlashcardNavigationPanel.tsx
sed -i "s/const generatePdf = (await import('\.\.\/utils\/pdfGenerator'))\.generatePdf;/const generatePdf = (await import('..\/utils\/pdfGenerator')).generatePdf as any;/g" src/features/ows/components/OWSNavigationPanel.tsx
sed -i "s/const generatePdf = (await import('\.\.\/utils\/pdfGenerator'))\.generatePdf;/const generatePdf = (await import('..\/utils\/pdfGenerator')).generatePdf as any;/g" src/features/synonyms/components/SynonymNavigationPanel.tsx

# 3. Push notifications
sed -i 's/const authArray = new Uint8Array(auth);/const authArray = Array.from(new Uint8Array(auth));/g' src/features/notifications/hooks/usePushNotifications.ts
sed -i 's/const p256dhArray = new Uint8Array(p256dh);/const p256dhArray = Array.from(new Uint8Array(p256dh));/g' src/features/notifications/hooks/usePushNotifications.ts

# 4. OWSSession
sed -i 's/const count = counts\[status\];/const count = counts\[status as keyof typeof counts\];/g' src/features/ows/components/OWSSession.tsx

# 5. QuizConfig
sed -i 's/counts={filterCounts.readStatus || {}}/counts={filterCounts.readStatus || {}}/g' src/features/quiz/components/QuizConfig.tsx
sed -i 's/counts={filterCounts.readStatus}/counts={filterCounts.readStatus || {}}/g' src/features/quiz/components/QuizConfig.tsx
sed -i 's/const current = prev.readStatus || \[\];/const current = prev.readStatus || \[\];/g' src/features/quiz/components/QuizConfig.tsx

# 6. OWSConfig deckMode
sed -i 's/deckMode: \[opt\]/deckMode: \[opt as "Unseen" | "Mastered" | "Review" | "Clueless" | "Tricky"\]/g' src/features/ows/OWSConfig.tsx

# 7. ActiveFiltersBar
sed -i 's/return count > 0;/return (count || 0) > 0;/g' src/features/quiz/components/ui/ActiveFiltersBar.tsx

# 8. Optimized filters
sed -i 's/selected.includes/(selected || \[\]).includes/g' src/features/quiz/hooks/useOptimizedFilterCounts.ts

# 9. useQuestionIndex
sed -i 's/selectedValues.length > 0/(selectedValues || \[\]).length > 0/g' src/features/quiz/hooks/useQuestionIndex.ts
sed -i 's/selectedValues.includes/(selectedValues || \[\]).includes/g' src/features/quiz/hooks/useQuestionIndex.ts

# 10. pdfGenerator
sed -i 's/export const generatePdf = async <T extends any>(data: T\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/flashcards/utils/pdfGenerator.ts
sed -i 's/export const generatePdf = async (data: never\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/flashcards/utils/pdfGenerator.ts

sed -i 's/export const generatePdf = async <T extends any>(data: T\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/ows/utils/pdfGenerator.ts
sed -i 's/export const generatePdf = async (data: never\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/ows/utils/pdfGenerator.ts

sed -i 's/export const generatePdf = async <T extends any>(data: T\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/synonyms/utils/pdfGenerator.ts
sed -i 's/export const generatePdf = async (data: never\[\], config: PDFGenerationConfig): Promise<Blob> => {/export const generatePdf = async (data: any\[\], config: PDFGenerationConfig): Promise<Blob> => {/g' src/features/synonyms/utils/pdfGenerator.ts
sed -i 's/Array.isArray(words) ? words.join/Array.isArray(words || \[\]) ? (words || \[\]).join/g' src/features/synonyms/utils/pdfGenerator.ts

# 11. QuizPdfPptGenerator
sed -i 's/counts={filterCounts.readStatus || {}}/counts={filterCounts.readStatus || {}}/g' src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx
sed -i 's/counts={filterCounts.readStatus}/counts={filterCounts.readStatus || {}}/g' src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx
sed -i 's/const current = prev.readStatus || \[\];/const current = prev.readStatus || \[\];/g' src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx

# 12. AppRoutes
sed -i 's/const OWS_FILTERS_KEY = "mindflow_ows_filters";/const OWS_FILTERS_KEY = "mindflow_ows_filters";\nconst defaultOwsFilters: InitialFilters = { subject: \[\], topic: \[\], subTopic: \[\], difficulty: \[\], questionType: \[\], examName: \[\], examYear: \[\], examDateShift: \[\], tags: \[\], readStatus: \[\], deckMode: \["Unseen"\] };/g' src/routes/AppRoutes.tsx
sed -i 's/initialFilters={savedFilters ? JSON.parse(savedFilters) : undefined}/initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}/g' src/routes/AppRoutes.tsx
sed -i 's/isOws={(location.state as any)?.isOws}/isOws={!!(location.state as any)?.isOws}/g' src/routes/AppRoutes.tsx
