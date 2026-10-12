# Dead Code & Dependency Analysis

This report is based on static analysis tooling (`knip`, `madge`) run against the current codebase.

## Circular Dependencies
**Result:** No circular dependencies found across the `src/` directory. The FSD architecture (strict barrel imports and domain isolation) is holding up perfectly.

## Unused Files & Obsolete Folders
The following files were flagged as unused entry points (not imported by any active route or barrel file):

- `src/archive/legacy-landing-page/LandingPage.tsx`
- `src/components/common/InstallPwaModal.tsx`
- `src/components/ui/DownloadOptionsModal.tsx`
- `src/features/about/components/index.ts`
- `src/features/about/index.ts`
- `src/features/admin/enrichment/hooks/useQueueControls.ts`
- `src/features/admin/enrichment/hooks/useWordLineage.ts`
- `src/features/ai/chat/index.ts`
- `src/features/ai/Icons.tsx`
- `src/features/ai/talk/audio-player.ts`
- `src/features/ai/talk/audio-recorder.ts`
- `src/features/auth/utils/cropImage.ts`
- `src/features/flashcards/components/index.ts`
- `src/features/flashcards/index.ts`
- `src/features/flashcards/utils/pdfGenerator.ts`
- `src/features/intro/index.ts`
- `src/features/quiz/components/archive/AnimatedCounter.tsx`
- `src/features/quiz/components/archive/DonutChart.tsx`
- `src/features/quiz/components/archive/QuizResult.tsx`
- `src/features/quiz/data/questions.ts`
- `src/features/quiz/data/validate_synonyms_data.js`
- `src/features/quiz/engine/TestEngineController.ts`
- `src/features/quiz/hooks/useMockTimer.ts`
- `benchmark.ts`
- `chat-ai-bundle.ts`
- `check.js`
- `deploy_functions.js`
- `live-proxy-server/src/index.js`
- `providers/AppProvider.tsx`

*(Note: No files were deleted. This report simply identifies them for future pruning or refactoring.)*

## Recommendations
- **Archive Cleanup:** Safely delete the `src/archive/` and `src/features/quiz/components/archive/` folders as they represent old, unused code.
- **AI Audio Removal:** The AI Talk feature seems deprecated or incomplete (`audio-player.ts`, `audio-recorder.ts`). Clean up if the feature is no longer planned.
- **Index Cleanup:** Empty or unused `index.ts` barrel files in `about`, `ai/chat`, and `flashcards` should be removed if those modules have been deprecated or absorbed into other domains.
