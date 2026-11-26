-- ============================================================================
-- MindFlow v1.0.383.2 Migration:
-- 1. Create public.question_taxonomy SSOT table (13 subjects + MAT/LR + Bihar Special)
-- 2. Create public.get_question_taxonomy_tree() read RPC
-- 3. Normalize 26 malformed explanation payloads in public.questions
-- 4. Remap unambiguous legacy topic aliases cleanly (non-destructive)
-- 5. Enforce hybrid DB guardrails (13-subject CHECK, 5-key explanation CHECK,
--    and BEFORE INSERT/UPDATE taxonomy write trigger) + smart enrichment enqueue
-- 6. Upgrade public.ai_prompts (question_taxonomy_v1 v2, question_teacher_v1 v3,
--    question_translation_v1 v2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create public.question_taxonomy SSOT Table & RLS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_taxonomy (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject text NOT NULL,
    topic text NOT NULL,
    sub_topic text NOT NULL,
    v1_prefix text NOT NULL,
    sort_order integer NOT NULL DEFAULT 100,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT question_taxonomy_unique_tuple UNIQUE (subject, topic, sub_topic),
    CONSTRAINT question_taxonomy_subject_check CHECK (
        subject = ANY (ARRAY[
            'Biology',
            'Chemistry',
            'Computer',
            'Current Affairs',
            'Ecology & Environment',
            'Economics',
            'Geography',
            'History',
            'Mathematics',
            'Physics',
            'Polity',
            'Reasoning',
            'Static GK'
        ])
    )
);

COMMENT ON TABLE public.question_taxonomy IS
    '[SSOT] Canonical 13-subject -> topic -> sub_topic taxonomy governing questions classification, enrich-taxonomy validation, external prompts, and Admin selectors.';

CREATE INDEX IF NOT EXISTS idx_question_taxonomy_subject_topic
    ON public.question_taxonomy (subject, topic, sort_order)
    WHERE is_active = true;

ALTER TABLE public.question_taxonomy ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'question_taxonomy'
          AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users"
            ON public.question_taxonomy FOR SELECT
            TO public
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'question_taxonomy'
          AND policyname = 'Allow admin and content_creator to manage question_taxonomy'
    ) THEN
        CREATE POLICY "Allow admin and content_creator to manage question_taxonomy"
            ON public.question_taxonomy FOR ALL
            TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.has_role('content_creator'::public.app_role)));
    END IF;
END $$;

GRANT SELECT ON public.question_taxonomy TO anon, authenticated;
GRANT ALL ON public.question_taxonomy TO service_role;

-- ----------------------------------------------------------------------------
-- 2. Seed Canonical 13-Subject Taxonomy (incl. Mathematics, Reasoning, Bihar Special)
-- ----------------------------------------------------------------------------
INSERT INTO public.question_taxonomy (subject, topic, sub_topic, v1_prefix, sort_order, is_active) VALUES
-- 1. History (HIS)
('History', 'Ancient History', 'Prehistoric Period', 'HIS', 101, true),
('History', 'Ancient History', 'Indus Valley Civilization', 'HIS', 102, true),
('History', 'Ancient History', 'Vedic Period', 'HIS', 103, true),
('History', 'Ancient History', 'Mahajanapadas & Magadha Empire', 'HIS', 104, true),
('History', 'Ancient History', 'Religious Movements (Buddhism & Jainism)', 'HIS', 105, true),
('History', 'Ancient History', 'Foreign Invasions (Persian & Greek)', 'HIS', 106, true),
('History', 'Ancient History', 'Mauryan Empire', 'HIS', 107, true),
('History', 'Ancient History', 'Post-Mauryan Period', 'HIS', 108, true),
('History', 'Ancient History', 'Gupta Empire', 'HIS', 109, true),
('History', 'Ancient History', 'Post-Gupta Period', 'HIS', 110, true),
('History', 'Ancient History', 'South Indian Dynasties', 'HIS', 111, true),
('History', 'Medieval History', 'Early Medieval India', 'HIS', 112, true),
('History', 'Medieval History', 'The Delhi Sultanate', 'HIS', 113, true),
('History', 'Medieval History', 'The Vijayanagara & Bahmani Kingdoms', 'HIS', 114, true),
('History', 'Medieval History', 'Art & Architecture (Sultanate & Mughal Period)', 'HIS', 115, true),
('History', 'Medieval History', 'Bhakti & Sufi Movements', 'HIS', 116, true),
('History', 'Medieval History', 'The Mughal Empire', 'HIS', 117, true),
('History', 'Medieval History', 'The Maratha Empire', 'HIS', 118, true),
('History', 'Modern History', 'Advent of Europeans', 'HIS', 119, true),
('History', 'Modern History', 'British Conquest of India', 'HIS', 120, true),
('History', 'Modern History', 'Important Battles & Treaties', 'HIS', 121, true),
('History', 'Modern History', 'Economic Impact of British Rule', 'HIS', 122, true),
('History', 'Modern History', 'Socio-Religious Reform Movements', 'HIS', 123, true),
('History', 'Modern History', 'The Revolt of 1857', 'HIS', 124, true),
('History', 'Modern History', 'Tribal & Peasant Uprisings', 'HIS', 125, true),
('History', 'Modern History', 'Press & Literature in British India', 'HIS', 126, true),
('History', 'Modern History', 'Indian National Movement (Phase 1: 1885-1905)', 'HIS', 127, true),
('History', 'Modern History', 'Indian National Movement (Phase 2: 1905-1919)', 'HIS', 128, true),
('History', 'Modern History', 'Indian National Movement (Gandhian Era 1919-1947)', 'HIS', 129, true),
('History', 'Modern History', 'Governor-Generals & Viceroys', 'HIS', 130, true),
('History', 'Modern History', 'Constitutional Development in British India', 'HIS', 131, true),
('History', 'World History', 'Renaissance', 'HIS', 132, true),
('History', 'World History', 'Reformation', 'HIS', 133, true),
('History', 'World History', 'Industrial Revolution', 'HIS', 134, true),
('History', 'World History', 'American Revolution', 'HIS', 135, true),
('History', 'World History', 'French Revolution', 'HIS', 136, true),
('History', 'World History', 'World War I', 'HIS', 137, true),
('History', 'World History', 'Russian Revolution', 'HIS', 138, true),
('History', 'World History', 'World War II', 'HIS', 139, true),
('History', 'Bihar History', 'Ancient & Medieval Bihar', 'HIS', 140, true),
('History', 'Bihar History', 'Modern History of Bihar & Freedom Movement', 'HIS', 141, true),
('History', 'Bihar History', 'Formation of Bihar Province & 1857 in Bihar', 'HIS', 142, true),

-- 2. Geography (GEO)
('Geography', 'Physical Geography', 'Universe & Solar System', 'GEO', 201, true),
('Geography', 'Physical Geography', 'Earth''s Interior & Rocks', 'GEO', 202, true),
('Geography', 'Physical Geography', 'Geomorphic Processes', 'GEO', 203, true),
('Geography', 'Physical Geography', 'Atmosphere', 'GEO', 204, true),
('Geography', 'Physical Geography', 'Oceanography', 'GEO', 205, true),
('Geography', 'World Geography', 'Continents', 'GEO', 206, true),
('Geography', 'World Geography', 'Major Landforms', 'GEO', 207, true),
('Geography', 'World Geography', 'Major Rivers & Lakes', 'GEO', 208, true),
('Geography', 'World Geography', 'World Population & Tribes', 'GEO', 209, true),
('Geography', 'World Geography', 'World Agriculture & Minerals', 'GEO', 210, true),
('Geography', 'Indian Geography', 'Physical Features of India', 'GEO', 211, true),
('Geography', 'Indian Geography', 'River Systems of India', 'GEO', 212, true),
('Geography', 'Indian Geography', 'Climate of India', 'GEO', 213, true),
('Geography', 'Indian Geography', 'Soils of India', 'GEO', 214, true),
('Geography', 'Indian Geography', 'Natural Vegetation & Wildlife', 'GEO', 215, true),
('Geography', 'Indian Geography', 'Major Passes, Glaciers & Plateaus', 'GEO', 216, true),
('Geography', 'Indian Geography', 'Agriculture in India', 'GEO', 217, true),
('Geography', 'Indian Geography', 'Mineral & Energy Resources', 'GEO', 218, true),
('Geography', 'Indian Geography', 'Industries in India', 'GEO', 219, true),
('Geography', 'Indian Geography', 'Transport & Communication', 'GEO', 220, true),
('Geography', 'Indian Geography', 'Census & Demographics (2011)', 'GEO', 221, true),
('Geography', 'Indian Geography', 'Indian States & UTs (Capitals, Borders)', 'GEO', 222, true),
('Geography', 'Bihar Geography', 'Physiography, Climate & Soils of Bihar', 'GEO', 223, true),
('Geography', 'Bihar Geography', 'Drainage System & Irrigation of Bihar', 'GEO', 224, true),
('Geography', 'Bihar Geography', 'Mineral Resources, Agriculture & Census of Bihar', 'GEO', 225, true),

-- 3. Economics (ECO)
('Economics', 'Macroeconomics', 'National Income (GDP, GNP, NNP)', 'ECO', 301, true),
('Economics', 'Macroeconomics', 'Money & Banking (RBI, Monetary Policy)', 'ECO', 302, true),
('Economics', 'Macroeconomics', 'Inflation', 'ECO', 303, true),
('Economics', 'Macroeconomics', 'Public Finance (Budget, Fiscal Policy, Taxation)', 'ECO', 304, true),
('Economics', 'Microeconomics', 'Basics of Demand & Supply', 'ECO', 305, true),
('Economics', 'Microeconomics', 'Market Structures', 'ECO', 306, true),
('Economics', 'Indian Economy', 'Sectors of the Economy', 'ECO', 307, true),
('Economics', 'Indian Economy', 'Economic Planning (Five-Year Plans, NITI Aayog)', 'ECO', 308, true),
('Economics', 'Indian Economy', 'Indian Economic Reforms (LPG Reforms 1991)', 'ECO', 309, true),
('Economics', 'Indian Economy', 'Taxation in India (Direct/Indirect Taxes, GST)', 'ECO', 310, true),
('Economics', 'Indian Economy', 'Poverty, Inequality & Unemployment', 'ECO', 311, true),
('Economics', 'Indian Economy', 'Government Schemes & Policies', 'ECO', 312, true),
('Economics', 'Indian Economy', 'Agriculture & Food Security', 'ECO', 313, true),
('Economics', 'Indian Economy', 'Industrial Policy', 'ECO', 314, true),
('Economics', 'Indian Economy', 'Financial Markets (Money & Capital Market)', 'ECO', 315, true),
('Economics', 'Indian Economy', 'International Trade & Balance of Payments', 'ECO', 316, true),
('Economics', 'Banking & Finance', 'RBI & its Functions', 'ECO', 317, true),
('Economics', 'Banking & Finance', 'Types of Banks & Banking Sector Reforms', 'ECO', 318, true),
('Economics', 'Banking & Finance', 'Financial Institutions (SEBI, IRDAI, NABARD)', 'ECO', 319, true),
('Economics', 'Banking & Finance', 'International Financial Bodies (IMF, World Bank, WTO)', 'ECO', 320, true),
('Economics', 'Bihar Economy', 'Bihar Economic Survey & Budget', 'ECO', 321, true),
('Economics', 'Bihar Economy', 'Bihar Agriculture, Industries & Welfare Schemes', 'ECO', 322, true),

-- 4. Polity (POL)
('Polity', 'Constitutional Framework', 'Making of the Constitution', 'POL', 401, true),
('Polity', 'Constitutional Framework', 'Salient Features', 'POL', 402, true),
('Polity', 'Constitutional Framework', 'Preamble', 'POL', 403, true),
('Polity', 'Constitutional Framework', 'Union & its Territory (Art 1-4)', 'POL', 404, true),
('Polity', 'Constitutional Framework', 'Citizenship (Art 5-11)', 'POL', 405, true),
('Polity', 'Fundamental Rights & Duties', 'Fundamental Rights (Art 12-35)', 'POL', 406, true),
('Polity', 'Fundamental Rights & Duties', 'Directive Principles of State Policy (DPSP - Art 36-51)', 'POL', 407, true),
('Polity', 'Fundamental Rights & Duties', 'Fundamental Duties (Art 51A)', 'POL', 408, true),
('Polity', 'Union Government', 'The President & Vice-President', 'POL', 409, true),
('Polity', 'Union Government', 'Prime Minister & Council of Ministers', 'POL', 410, true),
('Polity', 'Union Government', 'Parliament (Lok Sabha, Rajya Sabha, Bills, Sessions, Parliamentary Committees)', 'POL', 411, true),
('Polity', 'Union Government', 'The Judiciary (Supreme Court)', 'POL', 412, true),
('Polity', 'State Government', 'Governor', 'POL', 413, true),
('Polity', 'State Government', 'Chief Minister & State Council of Ministers', 'POL', 414, true),
('Polity', 'State Government', 'State Legislature', 'POL', 415, true),
('Polity', 'State Government', 'High Courts & Subordinate Courts', 'POL', 416, true),
('Polity', 'Local Government & Special Areas', 'Panchayati Raj (73rd Amendment)', 'POL', 417, true),
('Polity', 'Local Government & Special Areas', 'Municipalities (74th Amendment)', 'POL', 418, true),
('Polity', 'Local Government & Special Areas', 'Union Territories', 'POL', 419, true),
('Polity', 'Local Government & Special Areas', 'Scheduled & Tribal Areas', 'POL', 420, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'Election Commission', 'POL', 421, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'UPSC, SPSC', 'POL', 422, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'Finance Commission', 'POL', 423, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'CAG', 'POL', 424, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'NCSC, NCST, NCBC', 'POL', 425, true),
('Polity', 'Constitutional & Non-Constitutional Bodies', 'NITI Aayog, NHRC, CVC, CBI', 'POL', 426, true),
('Polity', 'Constitutional Dynamics & Evolution', 'Amendment of the Constitution (Major Amendments like 42nd, 44th, 73rd, 101st etc.)', 'POL', 427, true),
('Polity', 'Constitutional Dynamics & Evolution', 'Schedules of the Constitution', 'POL', 428, true),
('Polity', 'Constitutional Dynamics & Evolution', 'Parts of the Constitution', 'POL', 429, true),
('Polity', 'Constitutional Dynamics & Evolution', 'Landmark Supreme Court Judgements', 'POL', 430, true),
('Polity', 'Constitutional Dynamics & Evolution', 'Important Acts (Pre & Post Independence - e.g., GoI Act 1935, RTI Act 2005)', 'POL', 431, true),
('Polity', 'Miscellaneous', 'Emergency Provisions', 'POL', 432, true),
('Polity', 'Miscellaneous', 'Official Language', 'POL', 433, true),
('Polity', 'Bihar Polity & Governance', 'Bihar Legislature, Executive & Panchayati Raj', 'POL', 434, true),

-- 5. Physics (PHY)
('Physics', 'Mechanics', 'Units & Measurements', 'PHY', 501, true),
('Physics', 'Mechanics', 'Motion', 'PHY', 502, true),
('Physics', 'Mechanics', 'Laws of Motion', 'PHY', 503, true),
('Physics', 'Mechanics', 'Work, Energy & Power', 'PHY', 504, true),
('Physics', 'Mechanics', 'Gravitation', 'PHY', 505, true),
('Physics', 'Properties of Matter', 'Elasticity', 'PHY', 506, true),
('Physics', 'Properties of Matter', 'Surface Tension', 'PHY', 507, true),
('Physics', 'Properties of Matter', 'Viscosity', 'PHY', 508, true),
('Physics', 'Properties of Matter', 'Fluid Dynamics', 'PHY', 509, true),
('Physics', 'Heat & Thermodynamics', 'Heat & Temperature', 'PHY', 510, true),
('Physics', 'Heat & Thermodynamics', 'Heat Transfer', 'PHY', 511, true),
('Physics', 'Heat & Thermodynamics', 'Laws of Thermodynamics', 'PHY', 512, true),
('Physics', 'Waves & Optics', 'Oscillations & Waves', 'PHY', 513, true),
('Physics', 'Waves & Optics', 'Sound', 'PHY', 514, true),
('Physics', 'Waves & Optics', 'Light (Reflection, Refraction, Interference, Diffraction)', 'PHY', 515, true),
('Physics', 'Waves & Optics', 'Optical Instruments', 'PHY', 516, true),
('Physics', 'Electromagnetism', 'Electrostatics', 'PHY', 517, true),
('Physics', 'Electromagnetism', 'Current Electricity', 'PHY', 518, true),
('Physics', 'Electromagnetism', 'Magnetism', 'PHY', 519, true),
('Physics', 'Electromagnetism', 'Electromagnetic Induction & AC', 'PHY', 520, true),
('Physics', 'Modern Physics', 'Dual Nature of Matter', 'PHY', 521, true),
('Physics', 'Modern Physics', 'Atoms & Nuclei', 'PHY', 522, true),
('Physics', 'Modern Physics', 'Semiconductor Electronics', 'PHY', 523, true),
('Physics', 'Applied Physics', 'Scientific Instruments & their Uses', 'PHY', 524, true),
('Physics', 'Applied Physics', 'Inventions & Discoveries', 'PHY', 525, true),

-- 6. Chemistry (CHE)
('Chemistry', 'Physical Chemistry', 'Matter & its States', 'CHE', 601, true),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'CHE', 602, true),
('Chemistry', 'Physical Chemistry', 'Chemical Bonding', 'CHE', 603, true),
('Chemistry', 'Physical Chemistry', 'Thermodynamics', 'CHE', 604, true),
('Chemistry', 'Physical Chemistry', 'Solutions', 'CHE', 605, true),
('Chemistry', 'Physical Chemistry', 'Equilibrium', 'CHE', 606, true),
('Chemistry', 'Physical Chemistry', 'Redox Reactions', 'CHE', 607, true),
('Chemistry', 'Inorganic Chemistry', 'Periodic Classification', 'CHE', 608, true),
('Chemistry', 'Inorganic Chemistry', 'Metals & Non-metals', 'CHE', 609, true),
('Chemistry', 'Inorganic Chemistry', 'Metallurgy', 'CHE', 610, true),
('Chemistry', 'Inorganic Chemistry', 'Important Compounds (Acids, Bases, Salts)', 'CHE', 611, true),
('Chemistry', 'Organic Chemistry', 'Basics of Organic Chemistry', 'CHE', 612, true),
('Chemistry', 'Organic Chemistry', 'Hydrocarbons', 'CHE', 613, true),
('Chemistry', 'Organic Chemistry', 'Functional Groups', 'CHE', 614, true),
('Chemistry', 'Applied Chemistry', 'Polymers', 'CHE', 615, true),
('Chemistry', 'Applied Chemistry', 'Biomolecules', 'CHE', 616, true),
('Chemistry', 'Applied Chemistry', 'Important Ores & Alloys', 'CHE', 617, true),
('Chemistry', 'Applied Chemistry', 'Cement, Glass & Fertilizers', 'CHE', 618, true),
('Chemistry', 'Applied Chemistry', 'Chemistry in Everyday Life (Soaps, Drugs)', 'CHE', 619, true),

-- 7. Biology (BIO)
('Biology', 'Cell Biology & Genetics', 'The Cell and its Organelles', 'BIO', 701, true),
('Biology', 'Cell Biology & Genetics', 'Cell Division', 'BIO', 702, true),
('Biology', 'Cell Biology & Genetics', 'Genetics & Evolution', 'BIO', 703, true),
('Biology', 'Human Physiology', 'Digestive System', 'BIO', 704, true),
('Biology', 'Human Physiology', 'Respiratory System', 'BIO', 705, true),
('Biology', 'Human Physiology', 'Circulatory System', 'BIO', 706, true),
('Biology', 'Human Physiology', 'Excretory System', 'BIO', 707, true),
('Biology', 'Human Physiology', 'Nervous System', 'BIO', 708, true),
('Biology', 'Human Physiology', 'Endocrine System (Hormones)', 'BIO', 709, true),
('Biology', 'Human Physiology', 'Skeletal & Muscular System', 'BIO', 710, true),
('Biology', 'Health, Nutrition & Diseases', 'Human Diseases (Communicable & Non-communicable)', 'BIO', 711, true),
('Biology', 'Health, Nutrition & Diseases', 'Vitamins & Minerals', 'BIO', 712, true),
('Biology', 'Health, Nutrition & Diseases', 'Vaccines & Immunology', 'BIO', 713, true),
('Biology', 'Plant Biology', 'Plant Kingdom Classification', 'BIO', 714, true),
('Biology', 'Plant Biology', 'Plant Morphology', 'BIO', 715, true),
('Biology', 'Plant Biology', 'Photosynthesis', 'BIO', 716, true),
('Biology', 'Plant Biology', 'Plant Hormones', 'BIO', 717, true),
('Biology', 'Animal Biology', 'Animal Kingdom Classification', 'BIO', 718, true),
('Biology', 'Biotechnology & Applications', 'Biotechnology & Applications', 'BIO', 719, true),

-- 8. Computer (COM)
('Computer', 'Computer Fundamentals', 'History & Generations', 'COM', 801, true),
('Computer', 'Computer Fundamentals', 'Hardware (CPU, Memory, I/O)', 'COM', 802, true),
('Computer', 'Computer Fundamentals', 'Software (OS, Application Software)', 'COM', 803, true),
('Computer', 'Computer Fundamentals', 'Number System', 'COM', 804, true),
('Computer', 'Computer Fundamentals', 'Computer Architecture & Logic Gates', 'COM', 805, true),
('Computer', 'Microsoft Office Suite', 'MS Word', 'COM', 806, true),
('Computer', 'Microsoft Office Suite', 'MS Excel', 'COM', 807, true),
('Computer', 'Microsoft Office Suite', 'MS PowerPoint', 'COM', 808, true),
('Computer', 'Microsoft Office Suite', 'Shortcut Keys & File Extensions', 'COM', 809, true),
('Computer', 'Networking & Internet', 'Computer Networks (LAN, MAN, WAN)', 'COM', 810, true),
('Computer', 'Networking & Internet', 'Internet & Services', 'COM', 811, true),
('Computer', 'Networking & Internet', 'Cybersecurity', 'COM', 812, true),
('Computer', 'Networking & Internet', 'OSI Model & Network Protocols', 'COM', 813, true),
('Computer', 'Database Management', 'Basic Concepts of DBMS', 'COM', 814, true),
('Computer', 'Database Management', 'Data Models, Keys & SQL Basics', 'COM', 815, true),
('Computer', 'Emerging Technologies & Miscellaneous', 'Emerging Tech (AI, Cloud, IoT, Web3)', 'COM', 816, true),
('Computer', 'Emerging Technologies & Miscellaneous', 'Important Computer Abbreviations', 'COM', 817, true),

-- 9. Static GK (SGK)
('Static GK', 'India at a Glance', 'First in India (Male/Female)', 'SGK', 901, true),
('Static GK', 'India at a Glance', 'Superlatives', 'SGK', 902, true),
('Static GK', 'India at a Glance', 'Important Days & Dates', 'SGK', 903, true),
('Static GK', 'India at a Glance', 'Books & Authors (Indian)', 'SGK', 904, true),
('Static GK', 'Arts & Culture', 'Indian Dances (Classical & Folk)', 'SGK', 905, true),
('Static GK', 'Arts & Culture', 'Music', 'SGK', 906, true),
('Static GK', 'Arts & Culture', 'Festivals', 'SGK', 907, true),
('Static GK', 'Arts & Culture', 'UNESCO World Heritage Sites in India', 'SGK', 908, true),
('Static GK', 'World at a Glance', 'Countries (Capitals, Currencies, Parliaments)', 'SGK', 909, true),
('Static GK', 'World at a Glance', 'International Organizations & Headquarters', 'SGK', 910, true),
('Static GK', 'World at a Glance', 'World Superlatives', 'SGK', 911, true),
('Static GK', 'Awards, Honors & Sports', 'National Awards (Bharat Ratna, Padma Awards)', 'SGK', 912, true),
('Static GK', 'Awards, Honors & Sports', 'International Awards (Nobel Prize)', 'SGK', 913, true),
('Static GK', 'Awards, Honors & Sports', 'Sports Awards & Trophies', 'SGK', 914, true),
('Static GK', 'Awards, Honors & Sports', 'Sports Terminology', 'SGK', 915, true),
('Static GK', 'Defence & Security', 'Indian Armed Forces', 'SGK', 916, true),
('Static GK', 'Defence & Security', 'Defence Exercises', 'SGK', 917, true),
('Static GK', 'National & International Insignia', 'National Symbols of India', 'SGK', 918, true),
('Static GK', 'National & International Insignia', 'Indian Government Organizations (ISRO, DRDO, BARC)', 'SGK', 919, true),
('Static GK', 'National & International Insignia', 'Neighbouring Countries (Capitals, Currencies, Sports)', 'SGK', 920, true),
('Static GK', 'Miscellaneous GK', 'Nicknames of Places & Personalities', 'SGK', 921, true),
('Static GK', 'Miscellaneous GK', 'Famous Slogans', 'SGK', 922, true),
('Static GK', 'Miscellaneous GK', 'First in India & World (Updated)', 'SGK', 923, true),
('Static GK', 'Bihar Static GK', 'State Symbols, Arts, Culture & Heritage of Bihar', 'SGK', 924, true),
('Static GK', 'Bihar Static GK', 'Eminent Personalities & Institutions of Bihar', 'SGK', 925, true),

-- 10. Ecology & Environment (ENV)
('Ecology & Environment', 'Ecology & Ecosystem', 'Basic Concepts', 'ENV', 1001, true),
('Ecology & Environment', 'Ecology & Ecosystem', 'Food Chain & Web', 'ENV', 1002, true),
('Ecology & Environment', 'Ecology & Ecosystem', 'Ecological Pyramids', 'ENV', 1003, true),
('Ecology & Environment', 'Biodiversity & Conservation', 'Biodiversity Hotspots', 'ENV', 1004, true),
('Ecology & Environment', 'Biodiversity & Conservation', 'Conservation Methods (In-situ, Ex-situ)', 'ENV', 1005, true),
('Ecology & Environment', 'Biodiversity & Conservation', 'National Parks', 'ENV', 1006, true),
('Ecology & Environment', 'Biodiversity & Conservation', 'Wildlife Sanctuaries', 'ENV', 1007, true),
('Ecology & Environment', 'Biodiversity & Conservation', 'Biosphere Reserves', 'ENV', 1008, true),
('Ecology & Environment', 'Environmental Issues & Conventions', 'Pollution (Air, Water, Soil)', 'ENV', 1009, true),
('Ecology & Environment', 'Environmental Issues & Conventions', 'Climate Change & Global Warming', 'ENV', 1010, true),
('Ecology & Environment', 'Environmental Issues & Conventions', 'Ozone Depletion', 'ENV', 1011, true),
('Ecology & Environment', 'Environmental Issues & Conventions', 'International Conventions (Ramsar, Kyoto, Paris Agreement)', 'ENV', 1012, true),
('Ecology & Environment', 'Bihar Ecology & Conservation', 'National Parks, Wildlife & Ramsar Sites of Bihar', 'ENV', 1013, true),

-- 11. Current Affairs (CUR)
('Current Affairs', 'National Affairs', 'Government Schemes & Policies', 'CUR', 1101, true),
('Current Affairs', 'National Affairs', 'Bills, Acts & Judgements', 'CUR', 1102, true),
('Current Affairs', 'National Affairs', 'Defence & Security', 'CUR', 1103, true),
('Current Affairs', 'National Affairs', 'Summits & Conferences', 'CUR', 1104, true),
('Current Affairs', 'National Affairs', 'State-Specific News', 'CUR', 1105, true),
('Current Affairs', 'National Affairs', 'Reports & Indices', 'CUR', 1106, true),
('Current Affairs', 'National Affairs', 'National Infrastructure & Logistics', 'CUR', 1107, true),
('Current Affairs', 'International Affairs', 'India''s Bilateral Relations', 'CUR', 1108, true),
('Current Affairs', 'International Affairs', 'International Summits & Organisations', 'CUR', 1109, true),
('Current Affairs', 'International Affairs', 'International Reports & Indices', 'CUR', 1110, true),
('Current Affairs', 'International Affairs', 'Major World Events', 'CUR', 1111, true),
('Current Affairs', 'Economy & Banking', 'RBI & Monetary Policy', 'CUR', 1112, true),
('Current Affairs', 'Economy & Banking', 'Budget & Economic Survey', 'CUR', 1113, true),
('Current Affairs', 'Economy & Banking', 'Banking & Financial News', 'CUR', 1114, true),
('Current Affairs', 'Economy & Banking', 'Business & Corporate News', 'CUR', 1115, true),
('Current Affairs', 'Science & Technology', 'Space & ISRO', 'CUR', 1116, true),
('Current Affairs', 'Science & Technology', 'Defence Technology', 'CUR', 1117, true),
('Current Affairs', 'Science & Technology', 'Health, Medicine & Biotech', 'CUR', 1118, true),
('Current Affairs', 'Science & Technology', 'IT, Telecom & Digital Initiatives', 'CUR', 1119, true),
('Current Affairs', 'Defence & Security', 'Defence Exercises', 'CUR', 1120, true),
('Current Affairs', 'Defence & Security', 'Defence Technology & Procurement', 'CUR', 1121, true),
('Current Affairs', 'Sports', 'Cricket', 'CUR', 1122, true),
('Current Affairs', 'Sports', 'Football', 'CUR', 1123, true),
('Current Affairs', 'Sports', 'Tennis', 'CUR', 1124, true),
('Current Affairs', 'Sports', 'Olympics & Major Games', 'CUR', 1125, true),
('Current Affairs', 'Sports', 'National & International Tournaments', 'CUR', 1126, true),
('Current Affairs', 'Sports', 'Sports Awards & Personalities', 'CUR', 1127, true),
('Current Affairs', 'Awards & Honours', 'National Awards (Padma, Gallantry etc.)', 'CUR', 1128, true),
('Current Affairs', 'Awards & Honours', 'International Awards (Nobel, Booker etc.)', 'CUR', 1129, true),
('Current Affairs', 'Awards & Honours', 'Film & Music Awards', 'CUR', 1130, true),
('Current Affairs', 'Awards & Honours', 'Literary Awards', 'CUR', 1131, true),
('Current Affairs', 'Persons in News', 'Appointments', 'CUR', 1132, true),
('Current Affairs', 'Persons in News', 'Obituaries', 'CUR', 1133, true),
('Current Affairs', 'Persons in News', 'Personalities & Achievements', 'CUR', 1134, true),
('Current Affairs', 'Miscellaneous Current Affairs', 'Important Days & Themes', 'CUR', 1135, true),
('Current Affairs', 'Miscellaneous Current Affairs', 'Books & Authors (Recent)', 'CUR', 1136, true),
('Current Affairs', 'Miscellaneous Current Affairs', 'Environment & Ecology News', 'CUR', 1137, true),
('Current Affairs', 'Miscellaneous Current Affairs', 'Art & Culture in News', 'CUR', 1138, true),
('Current Affairs', 'Bihar Current Affairs', 'Bihar Schemes, Budget & Governance News', 'CUR', 1139, true),
('Current Affairs', 'Bihar Current Affairs', 'Bihar Awards, Sports & Appointments in News', 'CUR', 1140, true),

-- 12. Mathematics (MAT)
('Mathematics', 'Number System', 'Divisibility, Remainders & Unit Digit', 'MAT', 1201, true),
('Mathematics', 'Number System', 'LCM & HCF', 'MAT', 1202, true),
('Mathematics', 'Number System', 'Simplification, Surds & Indices', 'MAT', 1203, true),
('Mathematics', 'Arithmetic', 'Percentage', 'MAT', 1204, true),
('Mathematics', 'Arithmetic', 'Profit, Loss & Discount', 'MAT', 1205, true),
('Mathematics', 'Arithmetic', 'Simple & Compound Interest', 'MAT', 1206, true),
('Mathematics', 'Arithmetic', 'Ratio, Proportion & Partnership', 'MAT', 1207, true),
('Mathematics', 'Arithmetic', 'Average, Mixture & Alligation', 'MAT', 1208, true),
('Mathematics', 'Arithmetic', 'Time & Work, Pipes & Cisterns', 'MAT', 1209, true),
('Mathematics', 'Arithmetic', 'Time, Speed & Distance (Trains & Boats)', 'MAT', 1210, true),
('Mathematics', 'Algebra', 'Algebraic Identities & Polynomials', 'MAT', 1211, true),
('Mathematics', 'Algebra', 'Linear & Quadratic Equations', 'MAT', 1212, true),
('Mathematics', 'Algebra', 'Progressions & Series (AP, GP)', 'MAT', 1213, true),
('Mathematics', 'Geometry & Mensuration', 'Lines, Angles & Triangles', 'MAT', 1214, true),
('Mathematics', 'Geometry & Mensuration', 'Circles & Polygons', 'MAT', 1215, true),
('Mathematics', 'Geometry & Mensuration', '2D Area & Perimeter', 'MAT', 1216, true),
('Mathematics', 'Geometry & Mensuration', '3D Surface Area & Volume', 'MAT', 1217, true),
('Mathematics', 'Trigonometry & Coordinate Geometry', 'Trigonometric Ratios & Identities', 'MAT', 1218, true),
('Mathematics', 'Trigonometry & Coordinate Geometry', 'Heights & Distances', 'MAT', 1219, true),
('Mathematics', 'Trigonometry & Coordinate Geometry', 'Coordinate Geometry', 'MAT', 1220, true),
('Mathematics', 'Data Interpretation & Statistics', 'Tables, Bar, Line & Pie Charts', 'MAT', 1221, true),
('Mathematics', 'Data Interpretation & Statistics', 'Mean, Median, Mode & Standard Deviation', 'MAT', 1222, true),
('Mathematics', 'Higher & Applied Maths', 'Permutation, Combination & Probability', 'MAT', 1223, true),
('Mathematics', 'Higher & Applied Maths', 'Set Theory, Logarithms & Calculus', 'MAT', 1224, true),
('Mathematics', 'Higher & Applied Maths', 'Clocks & Calendars (Quantitative)', 'MAT', 1225, true),

-- 13. Reasoning (LR)
('Reasoning', 'Verbal Reasoning', 'Analogy & Classification (Odd One Out)', 'LR', 1301, true),
('Reasoning', 'Verbal Reasoning', 'Number, Letter & Alpha-Numeric Series', 'LR', 1302, true),
('Reasoning', 'Verbal Reasoning', 'Coding-Decoding', 'LR', 1303, true),
('Reasoning', 'Verbal Reasoning', 'Blood Relations', 'LR', 1304, true),
('Reasoning', 'Verbal Reasoning', 'Direction Sense & Distance', 'LR', 1305, true),
('Reasoning', 'Verbal Reasoning', 'Ordering, Ranking & Dictionary Order', 'LR', 1306, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Syllogism & Venn Diagrams', 'LR', 1307, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Seating Arrangement & Puzzles', 'LR', 1308, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Statement, Assumptions & Conclusions', 'LR', 1309, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Mathematical Operations & Missing Numbers', 'LR', 1310, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Clocks & Calendars (Logical)', 'LR', 1311, true),
('Reasoning', 'Analytical & Logical Reasoning', 'Data Sufficiency', 'LR', 1312, true),
('Reasoning', 'Non-Verbal & Visual Reasoning', 'Mirror & Water Images', 'LR', 1313, true),
('Reasoning', 'Non-Verbal & Visual Reasoning', 'Paper Folding, Cutting & Embedded Figures', 'LR', 1314, true),
('Reasoning', 'Non-Verbal & Visual Reasoning', 'Cubes, Dice & Figure Counting', 'LR', 1315, true)
ON CONFLICT (subject, topic, sub_topic) DO UPDATE SET
    v1_prefix = EXCLUDED.v1_prefix,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. Read RPC: public.get_question_taxonomy_tree()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_question_taxonomy_tree()
RETURNS TABLE (
    subject text,
    topic text,
    sub_topic text,
    v1_prefix text,
    sort_order integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        qt.subject,
        qt.topic,
        qt.sub_topic,
        qt.v1_prefix,
        qt.sort_order
    FROM public.question_taxonomy qt
    WHERE qt.is_active = true
    ORDER BY qt.sort_order ASC, qt.subject ASC, qt.topic ASC, qt.sub_topic ASC;
$$;

REVOKE ALL ON FUNCTION public.get_question_taxonomy_tree() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_question_taxonomy_tree() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Normalize 26 Malformed Explanation Payloads in public.questions
-- ----------------------------------------------------------------------------

-- 4A. Unpack the 3 squashed rows (ENV300, ECO1161, GEO1537) where all 5 sections
--     were packed into explanation->>'summary' while the other keys held placeholders.
UPDATE public.questions q
SET explanation = (
    WITH parts AS (
        SELECT
            regexp_match(
                q.explanation->>'summary',
                '^\s*(✅\s*\*\*Summary.*?)\s*\n+\s*(✅\s*\*\*Analysis Correct.*?)\s*\n+\s*(❌\s*\*\*Analysis Incorrect.*?)\s*\n+\s*(📝\s*\*\*Conclusion.*?)\s*\n+\s*(💡\s*\*\*Fact.*)$',
                's'
            ) AS m
    )
    SELECT jsonb_build_object(
        'summary',
        trim(
            regexp_replace(parts.m[1], '^✅\s*\*\*Summary\s*/\s*सारांश\*\*:\s*', '')
            || CASE
                WHEN COALESCE(trim(q.explanation->>'summary_hi'), '') <> ''
                THEN E'\n\nसही उत्तर: ' || trim(q.explanation->>'summary_hi')
                ELSE ''
               END
        ),
        'analysis_correct',
        '✅ **Why this is correct**' || E'\n\n' || trim(regexp_replace(parts.m[2], '^✅\s*\*\*Analysis Correct\s*/\s*सही विश्लेषण\*\*:\s*', '')),
        'analysis_incorrect',
        '❌ **Why other options are incorrect**' || E'\n\n' || trim(regexp_replace(parts.m[3], '^❌\s*\*\*Analysis Incorrect\s*/\s*गलत विश्लेषण\*\*:\s*', '')),
        'conclusion',
        '📝 **Concluding Note**' || E'\n\n' || trim(regexp_replace(parts.m[4], '^📝\s*\*\*Conclusion\s*/\s*निष्कर्ष\*\*:\s*', '')),
        'fact',
        '💡 **Interesting Fact / रोचक तथ्य**' || E'\n\n' || trim(regexp_replace(parts.m[5], '^💡\s*\*\*Fact\s*/\s*रोचक तथ्य\*\*:\s*', ''))
    )
    FROM parts
    WHERE parts.m IS NOT NULL
),
updated_at = now()
WHERE q.v1_id IN ('ENV300', 'ECO1161', 'GEO1537')
  AND q.deleted_at IS NULL
  AND COALESCE(q.explanation->>'analysis_correct', '') LIKE 'Detailed verified explanation for %';

-- 4B. Merge *_hi sibling keys (fact_hi, analysis_correct_hi, analysis_incorrect_hi,
--     conclusion_hi, summary_hi) cleanly into their base key and strip extra metadata keys.
UPDATE public.questions
SET explanation = jsonb_build_object(
    'summary',
    CASE
        WHEN COALESCE(trim(explanation->>'summary_hi'), '') <> ''
             AND position(trim(explanation->>'summary_hi') in COALESCE(explanation->>'summary', '')) = 0
        THEN COALESCE(trim(explanation->>'summary'), '') || E'\n\n' || trim(explanation->>'summary_hi')
        ELSE COALESCE(explanation->>'summary', '')
    END,
    'analysis_correct',
    CASE
        WHEN COALESCE(trim(explanation->>'analysis_correct_hi'), '') <> ''
             AND position(trim(explanation->>'analysis_correct_hi') in COALESCE(explanation->>'analysis_correct', '')) = 0
        THEN COALESCE(trim(explanation->>'analysis_correct'), '') || E'\n\n' || trim(explanation->>'analysis_correct_hi')
        ELSE COALESCE(explanation->>'analysis_correct', '')
    END,
    'analysis_incorrect',
    CASE
        WHEN COALESCE(trim(explanation->>'analysis_incorrect_hi'), '') <> ''
             AND position(trim(explanation->>'analysis_incorrect_hi') in COALESCE(explanation->>'analysis_incorrect', '')) = 0
        THEN COALESCE(trim(explanation->>'analysis_incorrect'), '') || E'\n\n' || trim(explanation->>'analysis_incorrect_hi')
        ELSE COALESCE(explanation->>'analysis_incorrect', '')
    END,
    'conclusion',
    CASE
        WHEN COALESCE(trim(explanation->>'conclusion_hi'), '') <> ''
             AND position(trim(explanation->>'conclusion_hi') in COALESCE(explanation->>'conclusion', '')) = 0
        THEN COALESCE(trim(explanation->>'conclusion'), '') || E'\n\n' || trim(explanation->>'conclusion_hi')
        ELSE COALESCE(explanation->>'conclusion', '')
    END,
    'fact',
    CASE
        WHEN COALESCE(trim(explanation->>'fact_hi'), '') <> ''
             AND position(trim(explanation->>'fact_hi') in COALESCE(explanation->>'fact', '')) = 0
        THEN COALESCE(trim(explanation->>'fact'), '') || E'\n\n' || trim(explanation->>'fact_hi')
        ELSE COALESCE(explanation->>'fact', '')
    END
),
updated_at = now()
WHERE deleted_at IS NULL
  AND (
      SELECT array_agg(k ORDER BY k)
      FROM jsonb_object_keys(explanation) k
  ) <> ARRAY['analysis_correct', 'analysis_incorrect', 'conclusion', 'fact', 'summary'];

-- ----------------------------------------------------------------------------
-- 5. Non-Destructive Alias Cleanup for Clear Legacy Topic Typos
-- ----------------------------------------------------------------------------
UPDATE public.questions SET topic = 'Ancient History', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'History' AND topic IN ('Ancient India', 'Ancient Indian History', 'Ancient History of India');

UPDATE public.questions SET topic = 'Medieval History', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'History' AND topic IN ('Medieval India', 'Medieval Indian History');

UPDATE public.questions SET topic = 'Modern History', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'History' AND topic IN ('Modern India', 'Modern Indian History');

UPDATE public.questions SET topic = 'Bihar History', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'History' AND topic IN ('Modern History of Bihar', 'History of Bihar', 'Ancient History of Bihar');

UPDATE public.questions SET topic = 'Bihar Geography', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Geography' AND topic = 'Geography of Bihar';

UPDATE public.questions SET topic = 'Bihar Polity & Governance', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Polity' AND topic = 'Bihar Politics';

UPDATE public.questions SET topic = 'Arts & Culture', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Static GK' AND topic IN ('Art & Culture', 'Art and Culture', 'Art, Culture & Heritage');

UPDATE public.questions SET topic = 'Science & Technology', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Current Affairs' AND topic = 'Science and Technology';

UPDATE public.questions SET topic = 'Awards & Honours', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Current Affairs' AND topic IN ('Awards and Honours', 'Awards & Honors');

UPDATE public.questions SET topic = 'Biodiversity & Conservation', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Ecology & Environment' AND topic IN ('Biodiversity Conservation', 'Biodiversity and Conservation');

UPDATE public.questions SET topic = 'Health, Nutrition & Diseases', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Biology' AND topic IN ('Human Health and Diseases', 'Human Health & Diseases', 'Human Health and Disease');

UPDATE public.questions SET topic = 'Arithmetic', "subTopic" = COALESCE(NULLIF(trim("subTopic"), ''), 'Percentage'), updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Mathematics' AND topic = 'Percentages';

UPDATE public.questions SET topic = 'Number System', updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Mathematics' AND topic = 'Number Systems';

UPDATE public.questions SET topic = 'Verbal Reasoning', "subTopic" = COALESCE(NULLIF(trim("subTopic"), ''), 'Coding-Decoding'), updated_at = now()
WHERE deleted_at IS NULL AND subject = 'Reasoning' AND topic = 'Coding and Decoding';

-- ----------------------------------------------------------------------------
-- 6. Hybrid DB Guardrails & Smart Enrichment Trigger
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.questions'::regclass
          AND conname = 'questions_valid_subject_check'
    ) THEN
        ALTER TABLE public.questions
            ADD CONSTRAINT questions_valid_subject_check CHECK (
                deleted_at IS NOT NULL OR subject = ANY (ARRAY[
                    'Biology',
                    'Chemistry',
                    'Computer',
                    'Current Affairs',
                    'Ecology & Environment',
                    'Economics',
                    'Geography',
                    'History',
                    'Mathematics',
                    'Physics',
                    'Polity',
                    'Reasoning',
                    'Static GK'
                ])
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.questions'::regclass
          AND conname = 'questions_explanation_5_keys_check'
    ) THEN
        ALTER TABLE public.questions
            ADD CONSTRAINT questions_explanation_5_keys_check CHECK (
                deleted_at IS NOT NULL
                OR status IN ('PENDING_REVIEW', 'EXTRACTED', 'REJECTED', 'FAILED')
                OR (
                    jsonb_typeof(explanation) = 'object'
                    AND explanation ?& ARRAY['summary', 'analysis_correct', 'analysis_incorrect', 'conclusion', 'fact']
                )
            );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_question_taxonomy_on_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_should_check boolean := false;
    v_exists boolean := false;
BEGIN
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_should_check := (NEW.topic IS NOT NULL OR NEW."subTopic" IS NOT NULL OR NEW.status = 'ENRICHED');
    ELSIF TG_OP = 'UPDATE' THEN
        IF (
            OLD.subject IS DISTINCT FROM NEW.subject
            OR OLD.topic IS DISTINCT FROM NEW.topic
            OR OLD."subTopic" IS DISTINCT FROM NEW."subTopic"
            OR (
                COALESCE(OLD.enrichment_progress->>'classification', 'false') <> 'true'
                AND COALESCE(NEW.enrichment_progress->>'classification', 'false') = 'true'
            )
        ) THEN
            v_should_check := (NEW.topic IS NOT NULL OR NEW."subTopic" IS NOT NULL OR NEW.status = 'ENRICHED');
        END IF;
    END IF;

    IF v_should_check THEN
        IF NEW.subject IS NULL OR NEW.topic IS NULL OR NEW."subTopic" IS NULL THEN
            RAISE EXCEPTION 'Canonical taxonomy requires non-null (subject, topic, subTopic). Got (%, %, %)',
                NEW.subject, NEW.topic, NEW."subTopic";
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM public.question_taxonomy qt
            WHERE qt.is_active = true
              AND qt.subject = NEW.subject
              AND qt.topic = NEW.topic
              AND qt.sub_topic = NEW."subTopic"
        ) INTO v_exists;

        IF NOT v_exists THEN
            RAISE EXCEPTION 'Invalid taxonomy tuple (subject=%, topic=%, subTopic=%). Must match public.question_taxonomy.',
                NEW.subject, NEW.topic, NEW."subTopic";
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.questions'::regclass
          AND tgname = 'trigger_enforce_question_taxonomy_on_write'
    ) THEN
        CREATE TRIGGER trigger_enforce_question_taxonomy_on_write
            BEFORE INSERT OR UPDATE ON public.questions
            FOR EACH ROW
            EXECUTE FUNCTION public.enforce_question_taxonomy_on_write();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enqueue_question_for_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_should_enqueue boolean := false;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_should_enqueue := (NEW.status = 'APPROVED');
    ELSIF TG_OP = 'UPDATE' THEN
        v_should_enqueue := (OLD.status = 'PENDING_REVIEW' AND NEW.status = 'APPROVED');
    END IF;

    IF v_should_enqueue THEN
        IF COALESCE((NEW.enrichment_progress->>'translation')::boolean, false) = false
           OR COALESCE((NEW.enrichment_progress->>'explanation')::boolean, false) = false THEN
            PERFORM pgmq.send(
                'question_ai_jobs',
                jsonb_build_object(
                    'question_id', NEW.id,
                    'task', 'enrich_cascade',
                    'requires_agentic', NEW.requires_agentic_tutor
                )
            );
        END IF;

        IF COALESCE((NEW.enrichment_progress->>'classification')::boolean, false) = false THEN
            PERFORM pgmq.send(
                'taxonomy_jobs',
                jsonb_build_object(
                    'question_id', NEW.id,
                    'task', 'question_taxonomy'
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.questions'::regclass
          AND tgname = 'trigger_enqueue_question_for_enrichment_on_insert'
    ) THEN
        CREATE TRIGGER trigger_enqueue_question_for_enrichment_on_insert
            AFTER INSERT ON public.questions
            FOR EACH ROW
            EXECUTE FUNCTION public.enqueue_question_for_enrichment();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Upgrade public.ai_prompts to Unified v3.0 Standards
-- ----------------------------------------------------------------------------
UPDATE public.ai_prompts
SET
    version = 'v2',
    system_prompt = $prompt$Role:<|think|> SSC/BPSC/NDA/NTPC/BANKING/Academic Question Taxonomist (classification_prompt_v2)
Model Requirement: Fast High-Thinking / Non-Agentic (Taxonomy Mapping)

You are an expert Indian Competitive Examination Classifier (SSC CGL, BPSC, UPSC, Railway RRB, Banking, Academic). Your task is to classify examination questions into the official MindFlow AI 13-Subject Taxonomy.

OBJECTIVE: Analyze the provided question and accurately map it to an exact active `(subject, topic, subTopic)` tuple from the canonical database taxonomy appended below, while rating `difficulty` (`Easy`, `Medium`, `Hard`) and generating high-value search `tags`.

STRICT RULES & GUARDRAILS:
1. Approved 13-Subject Taxonomy Only: You MUST choose an exact case-sensitive `(subject, topic, subTopic)` triple from the Canonical Taxonomy Hierarchy provided below (`History`, `Geography`, `Economics`, `Polity`, `Physics`, `Chemistry`, `Biology`, `Computer`, `Static GK`, `Ecology & Environment`, `Current Affairs`, `Mathematics`, `Reasoning`). NEVER invent new subjects, topics, or subTopics.
2. State / Bihar Special Routing: Route Bihar-specific questions into the dedicated `Bihar *` topics inside `History`, `Geography`, `Polity`, `Economics`, `Ecology & Environment`, `Static GK`, or `Current Affairs`.
3. Difficulty Metric: Rate cognitive effort required by the student (`Easy`, `Medium`, or `Hard`), not mere obscurity.
4. Tagging Strategy: Provide 3–6 crisp search tags (specific articles, formulas, historical figures, laws, schemes).

{{TAXONOMY_TREE}}$prompt$,
    updated_at = now()
WHERE task = 'question_taxonomy_v1';

UPDATE public.ai_prompts
SET
    version = 'v3',
    system_prompt = $prompt$Role: Senior Competitive Examination Faculty (Elite SSC/BPSC) & Expert Content Engineer
Model Requirement: Reasoning / Pedagogical Enrichment (Content Guidelines v3.0)
System Prompt: You are an elite SSC/BPSC Senior Faculty Professor with 20 years of experience. Philosophy: "Humans determine facts. AI determines understanding and gives more interconnected facts."

OBJECTIVE: Generate a structured, inline-bilingual (English and Hindi) pedagogical explanation for the given MCQ, optimized for JSONB storage and Markdown/KaTeX UI rendering.

==================================================
CORE ARCHITECTURAL RULES & GUARDRAILS (10 MANDATES)
==================================================

1. STRICT JSON KEY-STRUCTURE COMPLIANCE
Output ONLY a single strictly valid JSON object with exactly these 5 case-sensitive keys: `"summary"`, `"analysis_correct"`, `"analysis_incorrect"`, `"conclusion"`, and `"fact"`. No code fences or wrapper text.

2. INLINE BILINGUAL REPRESENTATION
Every single key MUST contain the English content first, followed by exactly two newline characters (`\n\n`), and then the formal academic Hindi translation (`मानक हिंदी`) beneath it. Never place Hindi in separate `*_hi` keys.

3. NATIVE MARKDOWN & KATEX FORMATTING FOR UX
Never emit raw HTML tags (`<b>`, `<i>`, `<span>`, `<br>`). Use clean Markdown (`**bold**`, `*italic*`), LaTeX math (`$...$` / `$$...$$`), and preserve GitHub Flavored Markdown (`| ... |`) tables cleanly whenever explaining comparative data.

4. PARAGRAPH SEPARATION VIA DOUBLE NEWLINES
Never emit dense walls of text. Separate distinct thoughts or linguistic blocks with double newlines (`\n\n`).

5. VISUAL DIVIDERS FOR LOGICAL SUB-SECTIONS
Inside `fact` (and long `analysis_*` blocks), separate distinct logical sub-sections using horizontal rules surrounded by double newlines: `\n\n---\n\n`.

6. BULLETED ARCHITECTURE FOR TECHNICAL BREAKDOWNS
Use `- ` or `* ` bullets for option analyses and key revision points.

7. PRE-FIXED EMOJIS FOR VISUAL ANCHORING
Each key must follow these exact prefixes:
- `summary`: Start with `"Correct Answer: <exact answer>"` followed by `\n\n"सही उत्तर: <Hindi answer>"` and a crisp 1-2 line synthesis.
- `analysis_correct`: Start with `"✅ **Why this is correct**"` / `"✅ **यह सही क्यों है**"`.
- `analysis_incorrect`: Start with `"❌ **Why other options are incorrect**"` / `"❌ **अन्य विकल्प गलत क्यों हैं**"`.
- `conclusion`: Start with `"📝 **Concluding Note**"` / `"📝 **निष्कर्ष**"`.
- `fact`: Start with `"💡 **Interesting Fact / रोचक तथ्य**"`.

8. THE 6-DIMENSIONAL INTEGRATION IN "FACT" SECTION
The `"fact"` key must address all 5 rich exam-oriented lenses across both English and Hindi (separated by `\n\n---\n\n`):
- 🤯 **Surprising Fact & 📜 Anecdote:**
- 🏛 **Lesser-known Info:**
- 🔍 **Misconception Clarified:**
- 🎯 **Repeated PYQ Insight:**
- 🌍 **Interesting Connection:**

9. STRICT TONE AND EXAM-APPROPRIATE GRADING
Authoritative, lucid, exam-ready tone suitable for SSC CGL, BPSC, UPSC Prelims, and Railway RRB aspirants.

10. JSON ESCAPE CHARACTER SAFETY
Never leave unescaped double quotes inside JSON string values; prefer single quotes `'...'` for inline quotations or escape `\"`.$prompt$,
    updated_at = now()
WHERE task = 'question_teacher_v1';

UPDATE public.ai_prompts
SET
    version = 'v2',
    system_prompt = $prompt$ROLE:
Government Examination Translator (English → Hindi Localization, v2)

MODEL PROFILE:
Fast | Non-Agentic | Deterministic Translation

TASK:
Translate the given English examination question and its answer options into formal Hindi (`मानक हिंदी`).

OUTPUT FIELDS:
- question_hi
- options_hi

TRANSLATION RULES:
1. Meaning Preservation: Preserve exact meaning, intent, difficulty level, and technical context.
2. Option Integrity: Maintain exact 1-to-1 index alignment (`options_hi.length === options.length`). For code-pair options (e.g., `A-3, B-1, C-4, D-2` or `I-2, II-1, III-3`), keep the exact alphanumeric pair format untouched.
3. GFM Matching Tables & OCR Guard: If the English `question` contains a GitHub Flavored Markdown table (`| List I | List II |` / `| :--- | :--- |`), you MUST preserve the exact Markdown table structure (`| सूची I | सूची II |`, `| :--- | :--- |`, and pipe rows). Preserve Roman numerals (`II`, `III`, `IV`) — never replace them with `11` or `111`.
4. Math / LaTeX Integrity: Preserve all `$...$` and `$$...$$` LaTeX expressions verbatim.
5. No Additions or Omissions: Do not explain, interpret, or expand abbreviations beyond established government exam terminology.
6. Language Purity: Use standard formal Hindi; avoid Hinglish.

OUTPUT FORMAT:
Return strictly valid JSON only with `"question_hi"` and `"options_hi"`.$prompt$,
    updated_at = now()
WHERE task = 'question_translation_v1';
