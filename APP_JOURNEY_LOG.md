
## [v1.0.333] - 2026-11-08
### Added
- **Admin GK Quiz Image Support**: Added `explanation_image_url` to `questions` and implemented Cloudinary image uploads for quiz explanations, mirroring the idiomatic setup. This includes a new React Query hook (`useQuestionImage`) for optimistic updates, robust admin components (`AdminQuestionImage`), and updated display bindings throughout the application (e.g. `QuizExplanation`, `MistakeQuestionCard`, `QuestionSolutionCard`). Included an explicit RLS `UPDATE` policy for admins on `questions` in migration `20261108134030_add_explanation_image_url.sql`.
- **Migration Applied:** The migration `20261108134030_add_explanation_image_url.sql` has been successfully executed and applied directly to the live Supabase project `sjcfagpjstbfxuiwhlps` using the Supabase MCP integration.
