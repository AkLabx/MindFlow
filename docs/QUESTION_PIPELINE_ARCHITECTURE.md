# MindFlow Question Ingestion, Enrichment & Serialization Architecture (v3.0 SSOT)

## 1. Executive Summary & Philosophy

MindFlow operates a standardized **Dual-Track Bilingual Content Engine (`PIPELINE_VERSION = "3.0.0"`)** built around an authoritative PostgreSQL **13-Subject Taxonomy Single Source of Truth (`public.question_taxonomy`)**, an active **Exam Catalog SSOT (`public.exam_catalog`)**, and a **Unified 5-Key Bilingual Explanation Standard (`question_teacher_v1` v3)**.

**Core Rule:** Every MCQ entering `public.questions` — whether extracted via AI OCR (Track A), uploaded in pre-enriched bulk JSON batches (Track B), or created/edited in Admin CMS — MUST conform to:
1. Canonical `(subject, topic, subTopic)` tuple validation against `public.question_taxonomy`.
2. Canonical `examName` FK compliance against `public.exam_catalog`.
3. Validated **Explanation v3.0 JSONB** with exact 5 keys (`summary`, `analysis_correct`, `analysis_incorrect`, `conclusion`, `fact`), inline English + `\n\n` + Hindi content, and zero legacy `key_takeaway` keys.

---

## 2. The Two-Track Ingestion Architecture

### Track A: Automated Raw OCR & AI Enrichment Pipeline
1. Raw questions arrive from PDFs / OCR (`content_studio` -> `source_documents` -> `question_extract_v1` v3) as `PENDING_REVIEW` or `EXTRACTED`.
2. Upon admin approval (`APPROVED` / `ENRICHMENT_PENDING`), Postgres triggers (`enqueue_question_for_enrichment`) enqueue jobs into `pgmq`:
   - `taxonomy_jobs` -> **`enrich-taxonomy`** (`enrich-taxonomy-v5`, prompt `question_taxonomy_v1` v2): dynamically reads `public.question_taxonomy` at runtime, injects the live 321-tuple tree via `{{TAXONOMY_TREE}}`, and rejects invalid triples (`INVALID_TAXONOMY_TUPLE`).
   - `question_ai_jobs` -> **`enrich-questions`** (`enrich-questions-v23`, prompts `question_translation_v1` v2 + `question_research_v1` + `question_teacher_v1` v3): generates formal Hindi translation (preserving GFM tables) and the 5-key bilingual explanation, then transitions `status` -> `ENRICHED`.
3. Infrastructure failures (429/503/timeouts) back off exponentially via `pgmq.set_vt()`.

### Track B: Pre-Enriched Batch Upload (`docs/prompts/full_prompt_batch_1.md` v3.0)
1. Authoring teams use the standardized **v3.0 Master Prompt** in [`docs/prompts/full_prompt_batch_1.md`](./prompts/full_prompt_batch_1.md) synced 1:1 with all 13 subjects, Bihar-Special topics, `exam_catalog`, and the 10 Mandates.
2. Admins upload batches via **`UniversalContentImporter`** (`src/features/admin/components/UniversalContentImporter.tsx`), which validates:
   - Exact `(subject, topic, subTopic)` against `questionTaxonomyService.ts` (synced from `get_question_taxonomy_tree()`).
   - Canonical `examName` alias resolution via `examCatalogService.ts` (`resolveCanonicalExamName`).
   - Smart dual-path classification:
     - **Track B (`ENRICHED`)**: When bilingual fields (`question_hi`, `options_hi`), valid 5-key `explanation`, and valid taxonomy tuple are complete, rows save directly as `status: 'ENRICHED'` with `enrichment_progress: { classification: true, translation: true, explanation: true }`.
     - **Track A Queue (`PENDING_REVIEW`)**: Partial / English-only uploads may optionally be staged as `PENDING_REVIEW` for downstream AI enrichment rather than bypassing schema guards.

---

## 3. Canonical 13-Subject Taxonomy & `v1_id` Sequences

Managed by `BEFORE INSERT OR UPDATE` trigger `public.assign_question_v1_id()` and validated against `public.question_taxonomy` by `public.enforce_question_taxonomy_on_write()`:

| # | Canonical `subject` | `v1_prefix` | Postgres Sequence | Notes & Regional Specialization |
| :- | :--- | :--- | :--- | :--- |
| 1 | `History` | `HIS` | `seq_questions_his` | Includes `Bihar History` |
| 2 | `Geography` | `GEO` | `seq_questions_geo` | Includes `Bihar Geography` |
| 3 | `Economics` | `ECO` | `seq_questions_eco` | Includes `Bihar Economy` |
| 4 | `Polity` | `POL` | `seq_questions_pol` | Includes `Bihar Polity & Governance` |
| 5 | `Physics` | `PHY` | `seq_questions_phy` | Mechanics, Optics, Electromagnetism, Modern, Applied |
| 6 | `Chemistry` | `CHE` | `seq_questions_che` | Physical, Inorganic, Organic, Applied |
| 7 | `Biology` | `BIO` | `seq_questions_bio` | Cell, Human Physiology, Diseases, Plant, Animal, Biotech |
| 8 | `Computer` | `COM` | `seq_questions_com` | Fundamentals, MS Office, Networking, DBMS, Emerging Tech |
| 9 | `Static GK` | `SGK` | `seq_questions_sgk` | Includes `Bihar Static GK` |
| 10 | `Ecology & Environment` | `ENV` | `seq_questions_env` | Includes `Bihar Ecology & Conservation` |
| 11 | `Current Affairs` | `CUR` | `seq_questions_cur` | Includes `Bihar Current Affairs` |
| 12 | `Mathematics` | `MAT` | `seq_questions_mat` | Number System, Arithmetic, Algebra, Geometry, Trig, DI |
| 13 | `Reasoning` | `LR` | `seq_questions_lr` | Verbal, Analytical & Logical, Non-Verbal |

> Non-canonical labels such as `'General'`, `'General Science'`, `'General Knowledge'`, `'Math'`, or `'Logical Reasoning'` are rejected at DB `CHECK` level (`questions_valid_subject_check`) and Admin UI level.

---

## 4. GFM Matching Tables, LaTeX & Bilingual Standards

- **GFM Pipe Tables:** Matching questions ("Match List-I with List-II") MUST preserve strict Markdown pipe syntax in both `question` and `question_hi` (`| सूची-I | सूची-II |`). `enrich-questions` flags stripped tables as `TABLE_TRANSLATION_FLATTENED`.
- **OCR Guard:** Roman numerals (`I`, `II`, `III`, `IV`) must remain intact (`II`, never `11`).
- **LaTeX:** Inline `$...$` and display `$$...$$` expressions must remain untranslated inside `question_hi` and `explanation`.

---

## 5. Explanation v3.0 Contract & Unified Frontend Rendering

### Database JSONB Contract (`questions_explanation_5_keys_check`)
For active `APPROVED` / `ENRICHING` / `ENRICHED` questions, `explanation` must be a JSONB object containing all **5 required non-empty strings**:
1. `summary` — `"Correct Answer: ..."` + `\n\n` + `"सही उत्तर: ..."` + 1–2 sentence core synthesis.
2. `analysis_correct` — `"✅ **Why this is correct**"` + English reasoning + `\n\n` + `"✅ **यह सही क्यों है**"` + Hindi reasoning.
3. `analysis_incorrect` — `"❌ **Why other options are incorrect**"` + English bulleted elimination + `\n\n` + `"❌ **अन्य विकल्प गलत क्यों हैं**"` + Hindi elimination.
4. `conclusion` — `"📝 **Concluding Note**"` + exam takeaway + `\n\n` + `"📝 **निष्कर्ष**"` + Hindi takeaway *(legacy `key_takeaway` is forbidden)*.
5. `fact` — `"💡 **Interesting Fact / रोचक तथ्य**"` with 5 structured lenses separated by `\n\n---\n\n`: `🤯 **Surprising Fact & 📜 Anecdote:**`, `🏛 **Lesser-known Info:**`, `🔍 **Misconception Clarified:**`, `🎯 **Repeated PYQ Insight:**`, and `🌍 **Interesting Connection:**`.

### Unified UI Rendering (`QuizExplanation.tsx` + `explanationParser.ts`)
- `<QuizExplanation explanation={...} languageMode={'bilingual' | 'english' | 'hindi'} />` is the **sole explanation component** across Quiz Player, Learning Session, Quiz Review, Prepared Mock Test Results, Mistakes Book, and Admin Edit Modal Preview.
- `explanationParser.ts` (`parseExplanationPayload`, `splitBilingualMarkdown`, `validateExplanation5Keys`) parses structured JSON cleanly, supports language filtering across all 5 keys without stripping GFM tables or dividers, and handles legacy read-fallback safely.

---

## 6. Verification & QA Queries

```sql
-- 1. Check active questions violating 5-key v3 explanation schema
SELECT id, v1_id, status
FROM public.questions
WHERE deleted_at IS NULL
  AND status IN ('APPROVED', 'ENRICHING', 'ENRICHED')
  AND NOT (explanation ?& ARRAY['summary','analysis_correct','analysis_incorrect','conclusion','fact']);

-- 2. Check active questions using non-canonical taxonomy tuples
SELECT q.id, q.v1_id, q.subject, q.topic, q."subTopic"
FROM public.questions q
LEFT JOIN public.question_taxonomy qt
  ON qt.subject = q.subject AND qt.topic = q.topic AND qt.sub_topic = q."subTopic" AND qt.is_active = true
WHERE q.deleted_at IS NULL
  AND q.topic IS NOT NULL
  AND qt.id IS NULL;

-- 3. Check flattened matching tables or OCR Roman numeral artifacts
SELECT id, v1_id, subject
FROM public.questions
WHERE deleted_at IS NULL
  AND ((question ILIKE '%Match List%' AND question NOT LIKE '%|%')
    OR question_hi ~* 'सूची-\s*11|सूची-\s*111');
```
