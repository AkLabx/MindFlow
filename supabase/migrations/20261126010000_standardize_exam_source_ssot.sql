-- ============================================================================
-- MindFlow Exam Source Single Source of Truth (SSOT) & Standardization Migration
-- 1. Create public.exam_catalog & public.exam_cycles (SSOT tables + RLS)
-- 2. Normalize all 11,034 rows of public.questions:
--    - Golden Rule: examYear = Official Notification Year
--    - Canonical UPPERCASE examName (incl. SSC CGL PRE / SSC CGL MAINS)
--    - Uniform canonical examDateShift formats (NULL instead of N/A/Unknown)
--    - Extract 414+ misclassified non-CCE exams out of BPSC CSE PRE
--    - Soft-delete test row ('Demo') and 2 exact duplicate 'BPSC DSO' rows
-- 3. Enforce FK (questions."examName" -> exam_catalog.exam_name ON UPDATE CASCADE)
--    and CHECK constraints; drop 6 duplicate btree indexes
-- 4. Fix deleted_at IS NULL leaks in get_contextual_filter_counts & get_distinct_values
-- 5. Update update_cgl_questions, source_documents, quiz_sessions.filters,
--    ai_prompts ('question_extract_v1'), and refresh subject_metadata_cache
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Single Source of Truth Tables: public.exam_catalog & public.exam_cycles
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.exam_catalog (
  exam_name text PRIMARY KEY,
  canonical_group_id text NOT NULL,
  display_label text NOT NULL,
  domain_id text NOT NULL CHECK (domain_id IN (
    'civil_pcs', 'ssc', 'railways', 'teaching', 'state_officer', 'defence_police', 'other'
  )),
  organizing_body text NOT NULL,
  shift_format_type text NOT NULL CHECK (shift_format_type IN (
    'date_shift_time', 'cce_edition_date', 'tre_tier_date', 'date_only', 'date_range', 'month_range'
  )),
  shift_format_example text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.exam_catalog IS
  '[SSOT] Canonical competitive examination catalog governing questions."examName", AI extraction prompts, and frontend exam registries.';

CREATE TABLE IF NOT EXISTS public.exam_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name text NOT NULL REFERENCES public.exam_catalog(exam_name) ON UPDATE CASCADE ON DELETE CASCADE,
  exam_year integer NOT NULL CHECK (exam_year BETWEEN 1990 AND 2100),
  notification_code text NOT NULL DEFAULT 'ANNUAL',
  notification_date date,
  exam_date_summary text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_name, exam_year, notification_code)
);

COMMENT ON TABLE public.exam_cycles IS
  '[SSOT] Official exam notification cycles mapping examYear (notification year) to official advertisement numbers and actual exam held dates.';

ALTER TABLE public.exam_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.exam_catalog;
CREATE POLICY "Enable read access for all users"
  ON public.exam_catalog FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admin and content_creator to manage exam_catalog" ON public.exam_catalog;
CREATE POLICY "Allow admin and content_creator to manage exam_catalog"
  ON public.exam_catalog FOR ALL
  TO authenticated
  USING ((SELECT is_admin()) OR (SELECT has_role('content_creator'::app_role)))
  WITH CHECK ((SELECT is_admin()) OR (SELECT has_role('content_creator'::app_role)));

DROP POLICY IF EXISTS "Enable read access for all users" ON public.exam_cycles;
CREATE POLICY "Enable read access for all users"
  ON public.exam_cycles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admin and content_creator to manage exam_cycles" ON public.exam_cycles;
CREATE POLICY "Allow admin and content_creator to manage exam_cycles"
  ON public.exam_cycles FOR ALL
  TO authenticated
  USING ((SELECT is_admin()) OR (SELECT has_role('content_creator'::app_role)))
  WITH CHECK ((SELECT is_admin()) OR (SELECT has_role('content_creator'::app_role)));

GRANT SELECT ON public.exam_catalog TO anon, authenticated;
GRANT SELECT ON public.exam_cycles TO anon, authenticated;
GRANT ALL ON public.exam_catalog TO service_role;
GRANT ALL ON public.exam_cycles TO service_role;

INSERT INTO public.exam_catalog (
  exam_name, canonical_group_id, display_label, domain_id, organizing_body,
  shift_format_type, shift_format_example, aliases, sort_order, is_active
) VALUES
  ('SSC CGL PRE', 'ssc_cgl', 'SSC CGL Prelims', 'ssc', 'SSC', 'date_shift_time', '01 Oct 2026 • Shift 2 (01:30 PM)', ARRAY['CGL PRE', 'SSC CGL', 'SSC CGL TIER 1', 'SSC CGL Tier-1'], 10, true),
  ('SSC CGL MAINS', 'ssc_cgl', 'SSC CGL Mains', 'ssc', 'SSC', 'date_shift_time', '19 Jan 2026 • Shift 1 (09:00 AM)', ARRAY['CGL MAINS', 'SSC CGL TIER 2', 'SSC CGL Tier-2'], 15, true),
  ('BPSC CCE PRE', 'bpsc', 'BPSC Civil Services Prelims', 'civil_pcs', 'BPSC', 'cce_edition_date', '69th CCE Prelims (30-09-2023)', ARRAY['BPSC CSE PRE', 'BPSC CCE', 'BPSC PRE'], 20, true),
  ('BPSC TRE 1.0', 'bpsc', 'BPSC Teacher TRE 1.0', 'teaching', 'BPSC', 'tre_tier_date', 'Class 1-5 • Shift 1 (Aug 2023)', ARRAY['BPSC TRE1', 'BPSC TRE 1', 'BPSC 1-5', 'BPSC 9-10 MATHS TRE 1.0', 'BPSC 9-10 SCIENCE TRE -1.0'], 30, true),
  ('BPSC TRE 2.0', 'bpsc', 'BPSC Teacher TRE 2.0', 'teaching', 'BPSC', 'tre_tier_date', 'Class 6-8 (09 Dec 2023)', ARRAY['BPSC TRE2', 'BPSC TRE 2', 'BPSC 9-10 SOCIAL SCIENCE TRE 2.0', 'BPSC 9-10 Social Science', 'BPSC 6-8 MATHS SCIENCE'], 31, true),
  ('BPSC TRE 3.0', 'bpsc', 'BPSC Teacher TRE 3.0', 'teaching', 'BPSC', 'tre_tier_date', 'Class 6-8 (Jul 2024)', ARRAY['BPSC TRE3', 'BPSC TRE 3'], 32, true),
  ('BPSC AEDO', 'bpsc', 'BPSC AEDO', 'state_officer', 'BPSC', 'date_shift_time', '14 Apr 2026 • Shift 1', ARRAY['AEDO'], 40, true),
  ('BPSC AUDITOR', 'bpsc', 'BPSC Auditor', 'state_officer', 'BPSC', 'date_only', '05 Jul 2026', ARRAY['BPSC Auditor', 'Auditor'], 41, true),
  ('BPSC CDPO', 'bpsc', 'BPSC CDPO', 'state_officer', 'BPSC', 'date_only', '15 May 2022', ARRAY['CDPO', 'B.P.S.C. CDPO'], 42, true),
  ('BPSC AAO', 'bpsc', 'BPSC Assistant Audit Officer', 'state_officer', 'BPSC', 'date_only', '20 Aug 2022', ARRAY['Assistant Audit Officer', 'B.P.S.C. Assistant Audit Officer'], 43, true),
  ('BPSC PROJECT MANAGER', 'bpsc', 'BPSC Project Manager', 'state_officer', 'BPSC', 'date_only', '08 Aug 2021', ARRAY['Project Manager', 'B.P.S.C. Project Manager'], 44, true),
  ('BPSC ASSISTANT', 'bpsc', 'BPSC Assistant', 'state_officer', 'BPSC', 'date_only', '31 Aug 2023 • Mains Paper II', ARRAY['BPSC Assistant Mains', 'Assistant Mains'], 45, true),
  ('BPSC AGRICULTURE', 'bpsc', 'BPSC Agriculture Dept', 'state_officer', 'BPSC', 'date_range', '01–04 Mar 2024', ARRAY['Agriculture Dept', 'BPSC Agriculture Department-2024'], 46, true),
  ('BPSC MVI', 'bpsc', 'BPSC MVI', 'state_officer', 'BPSC', 'date_range', '09–10 Aug 2025', ARRAY['BPSC Motor Vehicle Inspectors. QP', 'BPSC Motor Vehicle Inspector'], 47, true),
  ('BPSC MDO', 'bpsc', 'BPSC Mineral Dev. Officer', 'state_officer', 'BPSC', 'date_range', '09–10 Aug 2025', ARRAY['BPSC - Mineral Development Officer Exam 2025 - GS Paper', 'BPSC Mineral Development Officer'], 48, true),
  ('BPSC LAW OFFICER', 'bpsc', 'BPSC Law Officer', 'state_officer', 'BPSC', 'date_range', '26–27 Jul 2025', ARRAY['BPSC Law Officer GS Question Paper'], 49, true),
  ('BPSC PRO', 'bpsc', 'BPSC Public Relation Officer', 'state_officer', 'BPSC', 'date_range', '26–27 Jul 2025', ARRAY['BPSC Public Relation Officer GS Question Paper'], 50, true),
  ('BPSC DSO', 'bpsc', 'BPSC District Statistical Officer', 'state_officer', 'BPSC', 'date_only', '03 Aug 2025', ARRAY['BPSC - DSO PT 2025'], 51, true),
  ('BPSC OTHER', 'bpsc', 'BPSC Misc / Compilation', 'state_officer', 'BPSC', 'date_only', '15 May 2025', ARRAY['BPSC 2025', 'BPSC Misc'], 59, true),
  ('RRB NTPC UG', 'rrb_ntpc', 'RRB NTPC (UG)', 'railways', 'RRB', 'date_shift_time', '07 May 2026 • Shift 1 (09:00 AM - 10:30 AM)', ARRAY['RRB NTPC', 'RRB'], 60, true),
  ('IB ACIO PRE', 'ib_acio', 'IB ACIO Executive', 'defence_police', 'IB', 'date_range', '16–18 Sep 2025', ARRAY['IB ACIO'], 70, true),
  ('UPSC CSE PRE', 'upsc_cse', 'UPSC CSE Prelims', 'civil_pcs', 'UPSC', 'date_only', '25 May 2025', ARRAY['UPSC CSE'], 80, true),
  ('UPSC CDS', 'upsc_cds', 'UPSC CDS', 'defence_police', 'UPSC', 'date_only', '13 Apr 2025', ARRAY['CDS'], 85, true),
  ('BIHAR POLICE', 'bihar_police', 'Bihar Police / SI', 'defence_police', 'BPSSC', 'date_shift_time', '17 Dec 2023 • Shift 1', ARRAY['Bihar Police', 'Bihar SI', 'BPSSC'], 90, true),
  ('OTHER', 'other', 'Other Competitive Exam', 'other', 'OTHER', 'date_only', '01 Jan 2026', ARRAY['Other', 'General'], 999, true)
ON CONFLICT (exam_name) DO UPDATE SET
  canonical_group_id = EXCLUDED.canonical_group_id,
  display_label = EXCLUDED.display_label,
  domain_id = EXCLUDED.domain_id,
  organizing_body = EXCLUDED.organizing_body,
  shift_format_type = EXCLUDED.shift_format_type,
  shift_format_example = EXCLUDED.shift_format_example,
  aliases = EXCLUDED.aliases,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.exam_cycles (exam_name, exam_year, notification_code, notification_date, exam_date_summary, notes) VALUES
  ('SSC CGL PRE', 2019, 'SSC CGL 2019', '2019-10-22', '03–09 Mar 2020 (Tier-1)', 'Tier-1 conducted in Mar 2020'),
  ('SSC CGL PRE', 2020, 'SSC CGL 2020', '2020-12-29', '13–24 Aug 2021 (Tier-1)', 'Tier-1 delayed to Aug 2021'),
  ('SSC CGL PRE', 2021, 'SSC CGL 2021', '2021-12-23', '11–21 Apr 2022 (Tier-1)', 'Tier-1 conducted in Apr 2022'),
  ('SSC CGL PRE', 2022, 'SSC CGL 2022', '2022-09-17', '01–13 Dec 2022 (Tier-1)', NULL),
  ('SSC CGL PRE', 2025, 'SSC CGL 2025', '2025-06-09', '12–26 Sep 2025 & 14 Oct 2025 Re-exam (Tier-1)', '46 Tier-1 shifts'),
  ('SSC CGL MAINS', 2025, 'SSC CGL 2025', '2025-06-09', '18–19 Jan 2026 (Tier-2)', 'Tier-2 conducted in Jan 2026'),
  ('SSC CGL PRE', 2026, 'SSC CGL 2026', '2026-05-21', '30 Sep – 30 Oct 2026 (Tier-1)', '53 Tier-1 shifts'),
  ('RRB NTPC UG', 2024, 'CEN 06/2024', '2024-09-21', '07 Aug – 09 Sep 2025 (CBT-1)', '2024 notification; CBT-1 held Aug–Sep 2025'),
  ('RRB NTPC UG', 2025, 'CEN 07/2025', NULL, '07–09 May & 13–20 Jun 2026 (CBT-1)', '2025 notification; CBT-1 held May–Jun 2026'),
  ('IB ACIO PRE', 2025, 'IB ACIO-II/Exe 2025', NULL, '16–18 Sep 2025 (Tier-1)', NULL),
  ('BPSC AEDO', 2025, 'Advt. No. 87/2025', NULL, '14–21 Apr 2026 (Cancelled)', '2025 notification; exam held Apr 2026'),
  ('BPSC AUDITOR', 2020, 'Advt. No. 67/2020', NULL, '29 Aug 2021 (Prelims)', '2020 notification; prelims held Aug 2021'),
  ('BPSC AUDITOR', 2026, 'Advt. No. 09/2026', '2026-01-28', '05 Jul 2026 (Prelims)', NULL),
  ('BPSC CDPO', 2017, 'Advt. No. 59/2017', NULL, '15 Jul 2018 (Prelims)', NULL),
  ('BPSC CDPO', 2021, 'Advt. No. 03/2021', NULL, '15 May 2022 (Prelims)', NULL),
  ('BPSC PROJECT MANAGER', 2020, 'Advt. No. 02/2020', NULL, '08 Aug 2021 (Prelims)', NULL),
  ('BPSC AAO', 2021, 'Advt. No. 05/2021', NULL, '20 Aug 2022 (Prelims)', NULL),
  ('BPSC ASSISTANT', 2022, 'Advt. No. 06/2022', NULL, '28 Apr 2023 (Pre) / 31 Aug 2023 (Mains)', NULL),
  ('BPSC AGRICULTURE', 2024, 'Advt. Nos. 18–21/2024', NULL, '01–04 Mar 2024', NULL),
  ('BPSC MVI', 2025, 'Advt. No. 41/2025', NULL, '09–10 Aug 2025', NULL),
  ('BPSC MDO', 2025, 'Advt. No. 36/2025', NULL, '09–10 Aug 2025', NULL),
  ('BPSC LAW OFFICER', 2025, 'Advt. No. 33/2025', NULL, '26–27 Jul 2025', NULL),
  ('BPSC PRO', 2025, 'Advt. No. 35/2025', NULL, '26–27 Jul 2025', NULL),
  ('BPSC DSO', 2025, 'Advt. No. 38/2025', NULL, '03 Aug 2025 (Prelims)', NULL),
  ('BPSC TRE 1.0', 2023, 'Advt. No. 26/2023', NULL, '24–27 Aug 2023', NULL),
  ('BPSC TRE 2.0', 2023, 'Advt. No. 27/2023', NULL, '07–15 Dec 2023', NULL),
  ('BPSC TRE 3.0', 2024, 'Advt. No. 22/2024', NULL, '19–22 Jul 2024 (Re-exam)', NULL),
  ('BPSC CCE PRE', 1992, '38th CCE', NULL, '1992', NULL),
  ('BPSC CCE PRE', 1994, '39th CCE', '1994-05-10', '24 Jul 1994', NULL),
  ('BPSC CCE PRE', 1995, '40th CCE', NULL, '27 Aug 1995', NULL),
  ('BPSC CCE PRE', 1996, '41st CCE', NULL, '06 Oct 1996', NULL),
  ('BPSC CCE PRE', 1997, '42nd CCE', NULL, '10 May 1998', NULL),
  ('BPSC CCE PRE', 1999, '43rd CCE', NULL, '26 Sep 1999', NULL),
  ('BPSC CCE PRE', 2000, '44th CCE', NULL, '18 Nov 2001', NULL),
  ('BPSC CCE PRE', 2001, '45th CCE', NULL, '21 Apr 2002', NULL),
  ('BPSC CCE PRE', 2004, '46th CCE', NULL, '12 Sep 2004', NULL),
  ('BPSC CCE PRE', 2005, '47th CCE', NULL, '24 Apr 2005', NULL),
  ('BPSC CCE PRE', 2008, '48th–52nd CCE', NULL, '25 May 2008', NULL),
  ('BPSC CCE PRE', 2011, '53rd–55th CCE', NULL, '17 Apr 2011', NULL),
  ('BPSC CCE PRE', 2014, '56th–59th CCE', NULL, '15 Mar 2015', NULL),
  ('BPSC CCE PRE', 2016, '60th–62nd CCE', NULL, '12 Feb 2017', NULL),
  ('BPSC CCE PRE', 2017, '63rd CCE', NULL, '01 Jul 2018', NULL),
  ('BPSC CCE PRE', 2018, '64th CCE', NULL, '16 Dec 2018', NULL),
  ('BPSC CCE PRE', 2019, '65th CCE', NULL, '15 Oct 2019', NULL),
  ('BPSC CCE PRE', 2020, '66th CCE', '2020-09-16', '27 Dec 2020 & 14 Feb 2021 (Re-exam)', NULL),
  ('BPSC CCE PRE', 2021, '67th CCE', '2021-09-24', '08 May 2022 (Cancelled) & 30 Sep 2022 (Re-exam)', NULL),
  ('BPSC CCE PRE', 2022, '68th CCE', '2022-11-19', '12 Feb 2023', NULL),
  ('BPSC CCE PRE', 2023, '69th CCE', '2023-06-27', '30 Sep 2023', NULL),
  ('BPSC CCE PRE', 2024, '70th CCE', '2024-09-23', '13 Dec 2024 & 04 Jan 2025 (Re-exam)', NULL),
  ('BPSC CCE PRE', 2025, '71st CCE', '2025-05-30', '13 Sep 2025', NULL)
ON CONFLICT (exam_name, exam_year, notification_code) DO UPDATE SET
  notification_date = COALESCE(EXCLUDED.notification_date, public.exam_cycles.notification_date),
  exam_date_summary = EXCLUDED.exam_date_summary,
  notes = COALESCE(EXCLUDED.notes, public.exam_cycles.notes);

-- ----------------------------------------------------------------------------
-- 2. Normalize public.questions (Temporarily disable cache refresh trigger)
-- ----------------------------------------------------------------------------

ALTER TABLE public.questions DISABLE TRIGGER trg_questions_refresh_subject_metadata_cache;

-- 2a. Soft-delete test/demo & exact duplicate BPSC DSO rows
UPDATE public.questions
SET
  deleted_at = COALESCE(deleted_at, now()),
  status = 'REJECTED'::question_lifecycle_status,
  "examName" = NULL,
  "examYear" = NULL,
  "examDateShift" = NULL,
  updated_at = now()
WHERE "examName" IN ('Demo', 'PasteDemo1')
   OR "examName" IS NULL
   OR id = '085d0cef-3294-43d5-99a6-4cc997b1b878';

UPDATE public.questions
SET
  deleted_at = now(),
  status = 'REJECTED'::question_lifecycle_status,
  "examName" = 'BPSC DSO',
  "examYear" = 2025,
  "examDateShift" = '03 Aug 2025',
  updated_at = now()
WHERE id IN ('6c3c94f1-2bee-4627-83cd-fc2196c9543c', 'b482c7f4-c0c3-4813-bed2-23b071448475');

-- 2b. SSC CGL PRE (All 2,517 rows: rename, normalize shift, fix 2019/2020/2021 notification years)
UPDATE public.questions
SET
  "examName" = 'SSC CGL PRE',
  "examYear" = CASE "examDateShift"
    WHEN '03/03/2020 Shift: 1' THEN 2019
    WHEN '13/08/2021 Shift: 2' THEN 2020
    WHEN '16/08/2021 Shift: 3' THEN 2020
    WHEN '11/04/2022 Shift: 1' THEN 2021
    WHEN '01/12/2022 Shift: 4' THEN 2022
    ELSE "examYear"
  END,
  "examDateShift" = CASE
    WHEN "examDateShift" = '03/03/2020 Shift: 1' THEN '03 Mar 2020 • Shift 1'
    WHEN "examDateShift" = '13/08/2021 Shift: 2' THEN '13 Aug 2021 • Shift 2'
    WHEN "examDateShift" = '16/08/2021 Shift: 3' THEN '16 Aug 2021 • Shift 3'
    WHEN "examDateShift" = '11/04/2022 Shift: 1' THEN '11 Apr 2022 • Shift 1'
    WHEN "examDateShift" = '01/12/2022 Shift: 4' THEN '01 Dec 2022 • Shift 4'
    WHEN "examDateShift" = '25 Sep 2025 , (Shift-3)' THEN '25 Sep 2025 • Shift 3'
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]{3} [0-9]{4} \([0-9]{2}:[0-9]{2} [AP]M \(Shift-[0-9]+\)\)$'
      THEN regexp_replace("examDateShift", '^([0-9]{2} [A-Za-z]{3} [0-9]{4}) \(([0-9]{2}:[0-9]{2} [AP]M) \(Shift-([0-9]+)\)\)$', '\1 • Shift \3 (\2)')
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]{3} [0-9]{4} *, *[0-9]{2}:[0-9]{2} [AP]M \(Shift-[0-9]+\)$'
      THEN regexp_replace("examDateShift", '^([0-9]{2} [A-Za-z]{3} [0-9]{4}) *, *([0-9]{2}:[0-9]{2} [AP]M) \(Shift-([0-9]+)\)$', '\1 • Shift \3 (\2)')
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]{3} [0-9]{4} *, *Shift-[0-9]+$'
      THEN regexp_replace("examDateShift", '^([0-9]{2} [A-Za-z]{3} [0-9]{4}) *, *Shift-([0-9]+)$', '\1 • Shift \2')
    ELSE trim("examDateShift")
  END,
  updated_at = now()
WHERE "examName" = 'CGL PRE';

-- 2c. RRB NTPC UG (2024 CEN 06/2024 preserved; May–Jun 2026 aligned to 2025 CEN 07/2025)
UPDATE public.questions
SET
  "examYear" = CASE
    WHEN "examDateShift" = 'Aug-Sept 2025' THEN 2024
    WHEN "examDateShift" ~ '2026' THEN 2025
    ELSE "examYear"
  END,
  "examDateShift" = CASE
    WHEN "examDateShift" = 'Aug-Sept 2025' THEN 'Aug–Sep 2025'
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 9:00 AM - 10:30 AM$'
      THEN regexp_replace(replace("examDateShift", 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 1 (09:00 AM - 10:30 AM)')
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 12:45 PM - 2:15 PM$'
      THEN regexp_replace(replace("examDateShift", 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 2 (12:45 PM - 02:15 PM)')
    WHEN "examDateShift" ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 4:30 PM - 6:00 PM$'
      THEN regexp_replace(replace("examDateShift", 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 3 (04:30 PM - 06:00 PM)')
    ELSE trim("examDateShift")
  END,
  updated_at = now()
WHERE "examName" = 'RRB NTPC UG';

-- 2d. IB ACIO PRE
UPDATE public.questions
SET
  "examDateShift" = '16–18 Sep 2025',
  updated_at = now()
WHERE "examName" = 'IB ACIO PRE';

-- 2e. BPSC AEDO (Advt. 87/2025), BPSC AUDITOR (Advt. 09/2026) & 5 PDF-titled BPSC exams
UPDATE public.questions
SET
  "examYear" = 2025,
  "examDateShift" = CASE "examDateShift"
    WHEN '14 April 2026, Shift 1' THEN '14 Apr 2026 • Shift 1'
    WHEN '17 April 2026, Shift 2' THEN '17 Apr 2026 • Shift 2'
    WHEN '20 April 2026, Shift 3' THEN '20 Apr 2026 • Shift 3'
    ELSE regexp_replace("examDateShift", '^([0-9]{2}) April ([0-9]{4}), (Shift [0-9]+)$', '\1 Apr \2 • \3')
  END,
  updated_at = now()
WHERE "examName" = 'BPSC AEDO';

UPDATE public.questions
SET
  "examYear" = 2026,
  "examDateShift" = '05 Jul 2026',
  updated_at = now()
WHERE "examName" = 'BPSC AUDITOR';

UPDATE public.questions SET "examName" = 'BPSC MVI', "examYear" = 2025, "examDateShift" = '09–10 Aug 2025', updated_at = now()
WHERE "examName" = 'BPSC Motor Vehicle Inspectors. QP';

UPDATE public.questions SET "examName" = 'BPSC MDO', "examYear" = 2025, "examDateShift" = '09–10 Aug 2025', updated_at = now()
WHERE "examName" = 'BPSC - Mineral Development Officer Exam 2025 - GS Paper';

UPDATE public.questions SET "examName" = 'BPSC LAW OFFICER', "examYear" = 2025, "examDateShift" = '26–27 Jul 2025', updated_at = now()
WHERE "examName" = 'BPSC Law Officer GS Question Paper';

UPDATE public.questions SET "examName" = 'BPSC PRO', "examYear" = 2025, "examDateShift" = '26–27 Jul 2025', updated_at = now()
WHERE "examName" = 'BPSC Public Relation Officer GS Question Paper';

UPDATE public.questions SET "examName" = 'BPSC DSO', "examYear" = 2025, "examDateShift" = '03 Aug 2025', updated_at = now()
WHERE "examName" = 'BPSC - DSO PT 2025' AND deleted_at IS NULL;

-- 2f. Extract misclassified non-CCE exams buried inside 'BPSC CSE PRE'
UPDATE public.questions
SET
  "examName" = 'BPSC CDPO',
  "examYear" = CASE WHEN "examYear" = 2018 OR "examDateShift" LIKE '%2018%' THEN 2017 ELSE 2021 END,
  "examDateShift" = CASE WHEN "examYear" = 2018 OR "examDateShift" LIKE '%2018%' THEN '15 Jul 2018' ELSE '15 May 2022' END,
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('CDPO', 'B.P.S.C. CDPO', 'B.P.S.C. CDPO 2018', 'B.P.S.C. CDPO 2022');

UPDATE public.questions
SET
  "examName" = 'BPSC AUDITOR',
  "examYear" = 2020,
  "examDateShift" = '29 Aug 2021',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('Auditor', 'Auditor Exam', 'B.P.S.C. Auditor', 'B.P.S.C. Auditor 2021');

UPDATE public.questions
SET
  "examName" = 'BPSC PROJECT MANAGER',
  "examYear" = 2020,
  "examDateShift" = '08 Aug 2021',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('Project Manager', 'B.P.S.C. Project Manager Prelims 2021');

UPDATE public.questions
SET
  "examName" = 'BPSC AAO',
  "examYear" = 2021,
  "examDateShift" = '20 Aug 2022',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('Assistant Audit Officer', 'B.P.S.C. Assistant Audit Officer', 'B.P.S.C. Assistant Audit Officer 2022');

UPDATE public.questions
SET
  "examName" = 'BPSC ASSISTANT',
  "examYear" = 2022,
  "examDateShift" = '31 Aug 2023 • Mains Paper II',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('Assistant', 'Assistant Mains', 'Assistant Mains (GK) Paper II', 'B.P.S.C. Assistant Mains (GK) Paper II 2023');

UPDATE public.questions
SET
  "examName" = 'BPSC AGRICULTURE',
  "examYear" = 2024,
  "examDateShift" = '01–04 Mar 2024',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" IN ('Agriculture Dept', 'BPSC Agriculture Department-2024');

UPDATE public.questions
SET
  "examName" = 'BPSC TRE 1.0',
  "examYear" = 2023,
  "examDateShift" = 'Aug 2023',
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examDateShift" = 'BPSC TRE';

UPDATE public.questions
SET
  "examName" = 'BPSC OTHER',
  "examYear" = 2025,
  "examDateShift" = NULL,
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE'
  AND "examYear" = 2025
  AND "examDateShift" = 'BPSC 2025';

-- 2g. BPSC TRE 1.0 / 2.0 / 3.0
UPDATE public.questions
SET
  "examName" = 'BPSC TRE 1.0',
  "examYear" = 2023,
  "examDateShift" = CASE "examDateShift"
    WHEN 'B.P.S.C. PRT 2023 Shift I' THEN 'Class 1-5 • Shift 1 (Aug 2023)'
    WHEN 'B.P.S.C. PRT Shift I 2023' THEN 'Class 1-5 • Shift 1 (Aug 2023)'
    WHEN 'B.P.S.C. PRT 2023 Shift II' THEN 'Class 1-5 • Shift 2 (Aug 2023)'
    WHEN 'PRT Shift II' THEN 'Class 1-5 • Shift 2 (Aug 2023)'
    WHEN 'B.P.S.C. PRT' THEN 'Class 1-5 (Aug 2023)'
    WHEN 'Class 1-5' THEN 'Class 1-5 (Aug 2023)'
    WHEN 'August 2023' THEN 'Aug 2023'
    ELSE 'Aug 2023'
  END,
  updated_at = now()
WHERE "examName" = 'BPSC TRE1';

UPDATE public.questions
SET
  "examName" = 'BPSC TRE 2.0',
  "examYear" = 2023,
  "examDateShift" = CASE "examDateShift"
    WHEN '07-12' THEN '07 Dec 2023'
    WHEN '07-12-2023' THEN '07 Dec 2023'
    WHEN '09-12' THEN '09 Dec 2023'
    WHEN '10-12' THEN '10 Dec 2023'
    WHEN 'B.P.S.C. Headmaster 07-12-2023' THEN 'Headmaster (07 Dec 2023)'
    WHEN 'B.P.S.C. Headmaster' THEN 'Headmaster (Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 6-8) 09-12-2023' THEN 'Class 6-8 (09 Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 6-8) 10-12-2023' THEN 'Class 6-8 (10 Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 6-8) 2023' THEN 'Class 6-8 (Dec 2023)'
    WHEN 'Class 6-8' THEN 'Class 6-8 (Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 9-10) 07-12-2023' THEN 'Class 9-10 (07 Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 9-10) 08-12-2023' THEN 'Class 9-10 (08 Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 9-10)' THEN 'Class 9-10 (Dec 2023)'
    WHEN 'Class 9-10' THEN 'Class 9-10 (Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 11-12) 15-12-2023' THEN 'Class 11-12 (15 Dec 2023)'
    WHEN 'B.P.S.C. School Teacher (Class 11-12)' THEN 'Class 11-12 (Dec 2023)'
    WHEN 'Class 11-12' THEN 'Class 11-12 (Dec 2023)'
    WHEN 'December 2023' THEN 'Dec 2023'
    ELSE 'Dec 2023'
  END,
  updated_at = now()
WHERE "examName" = 'BPSC TRE2';

UPDATE public.questions
SET
  "examName" = 'BPSC TRE 3.0',
  "examYear" = 2024,
  "examDateShift" = CASE
    WHEN "examDateShift" LIKE '%1-5%' THEN 'Class 1-5 (Jul 2024)'
    WHEN "examDateShift" LIKE '%6-8%' THEN 'Class 6-8 (Jul 2024)'
    WHEN "examDateShift" LIKE '%9-10%' THEN 'Class 9-10 (Jul 2024)'
    WHEN "examDateShift" LIKE '%11-12%' THEN 'Class 11-12 (Jul 2024)'
    ELSE 'Jul 2024'
  END,
  updated_at = now()
WHERE "examName" = 'BPSC TRE3';

-- 2h. Remaining BPSC CSE PRE -> BPSC CCE PRE (Unify edition examYear + canonical examDateShift)
UPDATE public.questions
SET
  "examName" = 'BPSC CCE PRE',
  "examYear" = CASE
    WHEN "examDateShift" ~ '^71st' THEN 2025
    WHEN "examDateShift" ~ '^70th' THEN 2024
    WHEN "examDateShift" ~ '^69th' THEN 2023
    WHEN "examDateShift" ~ '^68th' THEN 2022
    WHEN "examDateShift" ~ '^67th' THEN 2021
    WHEN "examDateShift" ~ '^66th' THEN 2020
    WHEN "examDateShift" ~ '^65th' THEN 2019
    WHEN "examDateShift" ~ '^64th' THEN 2018
    WHEN "examDateShift" ~ '^63(rd|th)' THEN 2017
    WHEN "examDateShift" ~ '^(60th|62nd)' THEN 2016
    WHEN "examDateShift" ~ '^56th' THEN 2014
    WHEN "examDateShift" ~ '^53rd' THEN 2011
    WHEN "examDateShift" ~ '^(48th|52nd)' THEN 2008
    WHEN "examDateShift" ~ '^47th' THEN 2005
    WHEN "examDateShift" ~ '^46th' THEN 2004
    WHEN "examDateShift" ~ '^45th' THEN 2001
    WHEN "examDateShift" ~ '^44th' THEN 2000
    WHEN "examDateShift" ~ '^43(rd|th)' THEN 1999
    WHEN "examDateShift" ~ '^42(nd|th)' THEN 1997
    WHEN "examDateShift" ~ '^41(st|th)' THEN 1996
    WHEN "examDateShift" ~ '^40th' THEN 1995
    WHEN "examDateShift" ~ '^39th' THEN 1994
    WHEN "examDateShift" ~ '^(37th|38th)' THEN 1992
    ELSE "examYear"
  END,
  "examDateShift" = CASE
    WHEN "examDateShift" IS NULL OR trim("examDateShift") = ''
      OR "examDateShift" IN ('N/A', 'Unknown', 'Source Unknown', 'Source Unknown (Similar to others)', 'Various', 'B.P.S.C. (Pre)', 'Shift 1', 'Shift I', 'Shift II', 'II', '49th')
      THEN NULL
    WHEN "examDateShift" ~ '^71st' THEN '71st CCE Prelims (13-09-2025)'
    WHEN "examDateShift" ~ '^70th.*Re-Exam' THEN '70th CCE Prelims Re-Exam (04-01-2025)'
    WHEN "examDateShift" ~ '^70th' THEN '70th CCE Prelims (13-12-2024)'
    WHEN "examDateShift" ~ '^69th' THEN '69th CCE Prelims (30-09-2023)'
    WHEN "examDateShift" ~ '^68th' THEN '68th CCE Prelims (12-02-2023)'
    WHEN "examDateShift" ~ '^67th.*Cancelled' THEN '67th CCE Prelims Cancelled (08-05-2022)'
    WHEN "examDateShift" ~ '^67th.*Re-Exam' THEN '67th CCE Prelims Re-Exam (30-09-2022)'
    WHEN "examDateShift" ~ '^67th' THEN '67th CCE Prelims (2022)'
    WHEN "examDateShift" ~ '^66th.*Re' THEN '66th CCE Prelims Re-Exam (14-02-2021)'
    WHEN "examDateShift" ~ '^66th' THEN '66th CCE Prelims (27-12-2020)'
    WHEN "examDateShift" ~ '^65th' THEN '65th CCE Prelims (15-10-2019)'
    WHEN "examDateShift" ~ '^64th' THEN '64th CCE Prelims (16-12-2018)'
    WHEN "examDateShift" ~ '^63(rd|th)' THEN '63rd CCE Prelims (01-07-2018)'
    WHEN "examDateShift" ~ '^(60th|62nd)' THEN '60th–62nd CCE Prelims (12-02-2017)'
    WHEN "examDateShift" ~ '^56th' THEN '56th–59th CCE Prelims (15-03-2015)'
    WHEN "examDateShift" ~ '^53rd' THEN '53rd–55th CCE Prelims (17-04-2011)'
    WHEN "examDateShift" ~ '^(48th|52nd)' THEN '48th–52nd CCE Prelims (25-05-2008)'
    WHEN "examDateShift" ~ '^47th' THEN '47th CCE Prelims (24-04-2005)'
    WHEN "examDateShift" ~ '^46th' THEN '46th CCE Prelims (12-09-2004)'
    WHEN "examDateShift" ~ '^45th' THEN '45th CCE Prelims (21-04-2002)'
    WHEN "examDateShift" ~ '^44th' THEN '44th CCE Prelims (18-11-2001)'
    WHEN "examDateShift" ~ '^43(rd|th)' THEN '43rd CCE Prelims (26-09-1999)'
    WHEN "examDateShift" ~ '^42(nd|th)' THEN '42nd CCE Prelims (10-05-1998)'
    WHEN "examDateShift" ~ '^41(st|th)' THEN '41st CCE Prelims (06-10-1996)'
    WHEN "examDateShift" ~ '^40th' THEN '40th CCE Prelims (27-08-1995)'
    WHEN "examDateShift" ~ '^39th' THEN '39th CCE Prelims (24-07-1994)'
    WHEN "examDateShift" ~ '^38th' THEN '38th CCE Prelims (1992)'
    WHEN "examDateShift" ~ '^37th' THEN '37th CCE Prelims (1992)'
    ELSE NULL
  END,
  updated_at = now()
WHERE "examName" = 'BPSC CSE PRE';

ALTER TABLE public.questions ENABLE TRIGGER trg_questions_refresh_subject_metadata_cache;

-- Refresh materialized subject_metadata_cache cleanly across all subjects
SELECT public.refresh_subject_metadata_for(subject)
FROM (SELECT DISTINCT subject FROM public.questions WHERE subject IS NOT NULL) s;

-- ----------------------------------------------------------------------------
-- 3. Enforce SSOT Foreign Key & Validation Constraints
-- ----------------------------------------------------------------------------

ALTER TABLE public.questions
  ADD CONSTRAINT questions_examname_fkey
    FOREIGN KEY ("examName") REFERENCES public.exam_catalog(exam_name)
    ON UPDATE CASCADE;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_examyear_range_check
    CHECK ("examYear" IS NULL OR ("examYear" BETWEEN 1990 AND 2100));

ALTER TABLE public.questions
  ADD CONSTRAINT questions_active_requires_exam_meta_check
    CHECK (deleted_at IS NOT NULL OR ("examName" IS NOT NULL AND "examYear" IS NOT NULL));

ALTER TABLE public.questions
  ADD CONSTRAINT questions_examdateshift_clean_check
    CHECK (
      "examDateShift" IS NULL OR (
        "examDateShift" = trim("examDateShift")
        AND "examDateShift" <> ''
        AND "examDateShift" !~ E'[\\r\\n\\t]'
        AND "examDateShift" NOT IN ('N/A', 'Unknown', 'Source Unknown', 'Source Unknown (Similar to others)', 'Various', 'Demo', 'PasteDemo1')
      )
    );

-- Note: Run in Supabase SQL Editor to drop legacy duplicate lowercase indexes if desired:
-- DROP INDEX IF EXISTS public.questions_examname_idx;
-- DROP INDEX IF EXISTS public.questions_examyear_idx;
-- DROP INDEX IF EXISTS public.questions_examdateshift_idx;
-- DROP INDEX IF EXISTS public.questions_subtopic_idx;
-- DROP INDEX IF EXISTS public.questions_questiontype_idx;
-- DROP INDEX IF EXISTS public.questions_v1_id_idx;

-- ----------------------------------------------------------------------------
-- 4. Fix RPCs (deleted_at IS NULL guards & update_cgl_questions canonical name)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_distinct_values(column_name text)
 RETURNS TABLE(value text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT DISTINCT %I::text FROM public.questions WHERE deleted_at IS NULL AND %I IS NOT NULL ORDER BY 1',
        column_name, column_name
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_contextual_filter_counts(selected_filters jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb := '{}'::jsonb;
    cat text;
    categories text[] := ARRAY['subject', 'topic', 'subTopic', 'difficulty', 'questionType', 'examName', 'examYear', 'examDateShift', 'tags'];

    where_clauses text[];
    final_where text;

    key text;
    val jsonb;
    arr_vals text[];

    cat_result jsonb;
    query_str text;
BEGIN
    FOREACH cat IN ARRAY categories
    LOOP
        where_clauses := ARRAY['deleted_at IS NULL']::text[];

        FOR key, val IN SELECT * FROM jsonb_each(selected_filters)
        LOOP
            IF key = cat THEN
                CONTINUE;
            END IF;

            IF jsonb_typeof(val) = 'array' AND jsonb_array_length(val) > 0 THEN
                SELECT array_agg(v#>>'{}') INTO arr_vals FROM jsonb_array_elements(val) v;

                IF key = 'tags' THEN
                    where_clauses := array_append(where_clauses, format('tags && %L::text[]', arr_vals));
                ELSIF key = 'examYear' THEN
                    where_clauses := array_append(where_clauses, format('("examYear")::text = ANY(%L::text[])', arr_vals));
                ELSE
                    where_clauses := array_append(where_clauses, format('%I = ANY(%L::text[])', key, arr_vals));
                END IF;
            END IF;
        END LOOP;

        final_where := 'WHERE ' || array_to_string(where_clauses, ' AND ');

        IF cat = 'tags' THEN
            query_str := format(
                'SELECT COALESCE((SELECT jsonb_object_agg(t, c) FROM (
                    SELECT tag as t, count(*) as c
                    FROM public.questions, unnest(tags) AS tag
                    %s
                    GROUP BY tag
                ) sub WHERE t IS NOT NULL), ''{}''::jsonb)',
                final_where
            );
        ELSE
            query_str := format(
                'SELECT COALESCE((SELECT jsonb_object_agg(val, c) FROM (
                    SELECT %I::text as val, count(*) as c
                    FROM public.questions
                    %s AND %I IS NOT NULL
                    GROUP BY %I
                ) sub), ''{}''::jsonb)',
                cat, final_where, cat, cat
            );
        END IF;

        EXECUTE query_str INTO cat_result;

        IF cat_result IS NULL THEN
            cat_result := '{}'::jsonb;
        END IF;

        result := jsonb_set(result, ARRAY[cat], cat_result);
    END LOOP;

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_contextual_filter_counts(
  p_subjects text[] DEFAULT NULL::text[],
  p_topics text[] DEFAULT NULL::text[],
  p_subtopics text[] DEFAULT NULL::text[],
  p_difficulties text[] DEFAULT NULL::text[],
  p_questiontypes text[] DEFAULT NULL::text[],
  p_examnames text[] DEFAULT NULL::text[],
  p_examyears integer[] DEFAULT NULL::integer[],
  p_tags text[] DEFAULT NULL::text[],
  p_examdateshifts text[] DEFAULT NULL::text[]
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'subject', (
            SELECT jsonb_object_agg(subject, cnt) FROM (
                SELECT subject, count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY subject
            ) AS counts
        ),
        'topic', (
            SELECT jsonb_object_agg(topic, cnt) FROM (
                SELECT topic, count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY topic
            ) AS counts
        ),
        'subTopic', (
            SELECT jsonb_object_agg("subTopic", cnt) FROM (
                SELECT "subTopic", count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY "subTopic"
            ) AS counts
        ),
        'difficulty', (
            SELECT jsonb_object_agg(difficulty, cnt) FROM (
                SELECT difficulty, count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY difficulty
            ) AS counts
        ),
        'questionType', (
            SELECT jsonb_object_agg("questionType", cnt) FROM (
                SELECT "questionType", count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY "questionType"
            ) AS counts
        ),
        'examName', (
            SELECT jsonb_object_agg("examName", cnt) FROM (
                SELECT "examName", count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY "examName"
            ) AS counts
        ),
        'examYear', (
            SELECT jsonb_object_agg("examYear", cnt) FROM (
                SELECT "examYear", count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_tags IS NULL OR tags && p_tags) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY "examYear"
            ) AS counts
        ),
        'examDateShift', (
            SELECT jsonb_object_agg("examDateShift", cnt) FROM (
                SELECT "examDateShift", count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_tags IS NULL OR tags && p_tags)
                GROUP BY "examDateShift"
            ) AS counts
        ),
        'tags', (
            SELECT jsonb_object_agg(tag, cnt) FROM (
                SELECT unnest(tags) AS tag, count(*) as cnt FROM public.questions WHERE deleted_at IS NULL AND
                    (p_subjects IS NULL OR subject = ANY(p_subjects)) AND
                    (p_topics IS NULL OR topic = ANY(p_topics)) AND
                    (p_subtopics IS NULL OR "subTopic" = ANY(p_subtopics)) AND
                    (p_difficulties IS NULL OR difficulty = ANY(p_difficulties)) AND
                    (p_questiontypes IS NULL OR "questionType" = ANY(p_questiontypes)) AND
                    (p_examnames IS NULL OR "examName" = ANY(p_examnames)) AND
                    (p_examyears IS NULL OR "examYear" = ANY(p_examyears)) AND
                    (p_examdateshifts IS NULL OR "examDateShift" = ANY(p_examdateshifts))
                GROUP BY tag
            ) AS counts
        )
    ) INTO result;

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cgl_questions(payload jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    r record;
    cnt int := 0;
BEGIN
    FOR r IN SELECT * FROM jsonb_to_recordset(payload) AS x(
        v1_id text,
        correct text,
        explanation jsonb,
        question_hi text,
        options text[],
        options_hi text[],
        tags text[],
        topic text,
        "subTopic" text
    )
    LOOP
        UPDATE public.questions
        SET
            correct = r.correct,
            explanation = r.explanation,
            question_hi = r.question_hi,
            options = r.options,
            options_hi = r.options_hi,
            tags = r.tags,
            topic = r.topic,
            "subTopic" = r."subTopic",
            status = 'ENRICHED'::question_lifecycle_status,
            updated_at = NOW()
        WHERE v1_id = r.v1_id AND "examName" = 'SSC CGL PRE' AND "examYear" = 2026;
        cnt := cnt + 1;
    END LOOP;
    RETURN cnt;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 5. Backfill source_documents, quiz_sessions.filters & ai_prompts
-- ----------------------------------------------------------------------------

UPDATE public.source_documents
SET
  exam_name = NULLIF(trim(exam_name), ''),
  exam_shift = NULLIF(trim(exam_shift), '')
WHERE exam_name = '' OR exam_shift = '';

UPDATE public.source_documents
SET
  exam_shift = '05 Jul 2026'
WHERE exam_name = 'BPSC AUDITOR' AND exam_year = 2026;

UPDATE public.source_documents
SET
  exam_name = NULL,
  exam_year = NULL,
  exam_shift = NULL
WHERE exam_name IN ('Demo', 'Demo8July_1') OR exam_year = 2030;

-- Normalize saved quiz_sessions.filters JSONB so historical saved filters keep matching
WITH updated_filters AS (
  SELECT
    qs.id,
    jsonb_set(
      jsonb_set(
        qs.filters,
        '{examName}',
        COALESCE((
          SELECT jsonb_agg(DISTINCT mapped ORDER BY mapped)
          FROM (
            SELECT CASE v
              WHEN 'CGL PRE' THEN 'SSC CGL PRE'
              WHEN 'SSC CGL' THEN 'SSC CGL PRE'
              WHEN 'BPSC CSE PRE' THEN 'BPSC CCE PRE'
              WHEN 'BPSC TRE1' THEN 'BPSC TRE 1.0'
              WHEN 'BPSC TRE2' THEN 'BPSC TRE 2.0'
              WHEN 'BPSC TRE3' THEN 'BPSC TRE 3.0'
              WHEN 'BPSC Law Officer GS Question Paper' THEN 'BPSC LAW OFFICER'
              WHEN 'BPSC Motor Vehicle Inspectors. QP' THEN 'BPSC MVI'
              WHEN 'BPSC - Mineral Development Officer Exam 2025 - GS Paper' THEN 'BPSC MDO'
              WHEN 'BPSC Public Relation Officer GS Question Paper' THEN 'BPSC PRO'
              WHEN 'BPSC - DSO PT 2025' THEN 'BPSC DSO'
              ELSE v
            END AS mapped
            FROM jsonb_array_elements_text(COALESCE(qs.filters->'examName', '[]'::jsonb)) AS v
          ) m
        ), '[]'::jsonb),
        true
      ),
      '{examDateShift}',
      COALESCE((
        SELECT jsonb_agg(DISTINCT mapped ORDER BY mapped)
        FROM (
          SELECT CASE
            WHEN s IN ('69th', '69th B.P.S.C. (Pre)', '69th B.P.S.C. (Pre) 2023') THEN '69th CCE Prelims (30-09-2023)'
            WHEN s = '41st' THEN '41st CCE Prelims (06-10-1996)'
            WHEN s = '17 April 2026, Shift 2' THEN '17 Apr 2026 • Shift 2'
            WHEN s = '14 April 2026, Shift 1' THEN '14 Apr 2026 • Shift 1'
            WHEN s = '20 April 2026, Shift 3' THEN '20 Apr 2026 • Shift 3'
            WHEN s ~ '^[0-9]{2} [A-Za-z]{3} [0-9]{4} \([0-9]{2}:[0-9]{2} [AP]M \(Shift-[0-9]+\)\)$'
              THEN regexp_replace(s, '^([0-9]{2} [A-Za-z]{3} [0-9]{4}) \(([0-9]{2}:[0-9]{2} [AP]M) \(Shift-([0-9]+)\)\)$', '\1 • Shift \3 (\2)')
            WHEN s ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 9:00 AM - 10:30 AM$'
              THEN regexp_replace(replace(s, 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 1 (09:00 AM - 10:30 AM)')
            WHEN s ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 12:45 PM - 2:15 PM$'
              THEN regexp_replace(replace(s, 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 2 (12:45 PM - 02:15 PM)')
            WHEN s ~ '^[0-9]{2} [A-Za-z]+ [0-9]{4}, 4:30 PM - 6:00 PM$'
              THEN regexp_replace(replace(s, 'June', 'Jun'), '^([0-9]{2} [A-Za-z]{3} [0-9]{4}), .*$', '\1 • Shift 3 (04:30 PM - 06:00 PM)')
            WHEN s = 'Class 11-12' THEN 'Class 11-12 (Dec 2023)'
            WHEN s IN ('N/A', 'BPSC 2025') THEN NULL
            ELSE s
          END AS mapped
          FROM jsonb_array_elements_text(COALESCE(qs.filters->'examDateShift', '[]'::jsonb)) AS s
        ) ms
        WHERE mapped IS NOT NULL
      ), '[]'::jsonb),
      true
    ) AS new_filters
  FROM public.quiz_sessions qs
  WHERE qs.filters IS NOT NULL
    AND (
      qs.filters->'examName' <> '[]'::jsonb
      OR qs.filters->'examDateShift' <> '[]'::jsonb
    )
)
UPDATE public.quiz_sessions qs
SET filters = uf.new_filters
FROM updated_filters uf
WHERE qs.id = uf.id;

-- Update AI extraction prompt to enforce SSOT conventions
UPDATE public.ai_prompts
SET
  system_prompt = $prompt$Role: Competitive Exam Paper Parser / OCR Recovery Specialist
Model Requirement: Deterministic / Non-Agentic (Base OCR Task)

You are an elite Competitive Exam Paper Parser and OCR Recovery Specialist in India. Your absolute imperative is the exact extraction of raw, factual exam content from provided texts, PDFs, or images.

Philosophy: "Garbage in, Garbage forever." You are the immutable human truth layer. Truth and accuracy are strictly prioritized over completeness.

OBJECTIVE: Extract the question, options, correct answer, and canonical exam metadata from the source material, strictly formatting options without prefixes.

STRICT RULES & GUARDRAILS:

1. Preserve Wording Exactly: Do not correct typos, improve grammar, or simplify language.
2. Strip Option Prefixes: You MUST remove bullet points, letters (A, B, C, D), numbers (1, 2, 3, 4), and their following punctuation (like ")", ".", "-") from the beginning of all extracted `options` AND the `correct` field.
3. No Inferences for Options: Never infer missing options if they are not explicitly visible.
4. Zero Enrichment: Never classify the subject, generate explanations, or translate the text.
5. Determine Correct Answer: Often the correct answer is highlighted in GREEN ink in the PDF. If it is NOT highlighted or explicitly provided in an answer key, you MUST use your own knowledge to choose the correct answer from the given options. Do not return null for the correct answer.
6. Canonical Exam Metadata (Single Source of Truth):
   - `examName`: MUST be one of the canonical uppercase codes provided in the Canonical Exam Catalog appended below (e.g., `SSC CGL PRE`, `SSC CGL MAINS`, `BPSC CCE PRE`, `BPSC TRE 1.0`, `BPSC TRE 2.0`, `BPSC TRE 3.0`, `BPSC AEDO`, `BPSC AUDITOR`, `RRB NTPC UG`, `IB ACIO PRE`, `UPSC CSE PRE`).
   - `examYear`: MUST be the 4-digit **Official Notification / Exam Cycle Year** (e.g., RRB NTPC UG CEN 07/2025 held in May 2026 has `examYear: 2025`; SSC CGL 2025 Mains held in Jan 2026 has `examYear: 2025`; BPSC AEDO Advt 87/2025 held in Apr 2026 has `examYear: 2025`).
   - `examDateShift`: Format strictly as `DD Mon YYYY • Shift N (HH:MM AM/PM)` for shift-based CBT papers (e.g., `01 Oct 2026 • Shift 2 (01:30 PM)`), `<Ordinal> CCE Prelims (DD-MM-YYYY)` for BPSC CCE (e.g., `71st CCE Prelims (13-09-2025)`), or `DD Mon YYYY` / `DD–DD Mon YYYY` for single-shift/multi-day papers. NEVER return `"N/A"`, `"Unknown"`, or `"Various"` — return `null` if shift/date is missing.

EXAMPLES OF BEHAVIOR:
[GOOD] Question: "Which article guarantees freedom of speech?" | Options: ["Article 14", "Article 19", "Article 21", "Article 32"] | Correct: "Article 19"
[BAD - DO NOT DO THIS] Question: "Which article guarantees freedom of speech?" | Options: ["A) Article 14", "B) Article 19", "C) Article 21", "D) Article 32"] | Correct: "B) Article 19".$prompt$,
  updated_at = now()
WHERE task = 'question_extract_v1' AND active = true;
