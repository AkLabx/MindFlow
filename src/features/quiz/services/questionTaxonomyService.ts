import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { DB_RPCS } from '../../../config/dbTables';

/**
 * Single Source of Truth (SSOT) for MindFlow Question Taxonomy & V1 Prefix Mapping.
 *
 * Syncs with PostgreSQL `public.question_taxonomy` via the `get_question_taxonomy_tree` RPC
 * using Stale-While-Revalidate (SWR) `localStorage` caching (`0ms` cold startup render),
 * mirroring `examCatalogService.ts`.
 */
export interface QuestionTaxonomyEntry {
  subject: string;
  topic: string;
  sub_topic: string;
  v1_prefix: string;
  sort_order: number;
}

export const CANONICAL_SUBJECTS = [
  'History',
  'Geography',
  'Economics',
  'Polity',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer',
  'Static GK',
  'Ecology & Environment',
  'Current Affairs',
  'Mathematics',
  'Reasoning',
] as const;

export type CanonicalSubject = (typeof CANONICAL_SUBJECTS)[number];

export const CANONICAL_SUBJECT_PREFIXES: Record<CanonicalSubject, string> = {
  History: 'HIS',
  Geography: 'GEO',
  Economics: 'ECO',
  Polity: 'POL',
  Physics: 'PHY',
  Chemistry: 'CHE',
  Biology: 'BIO',
  Computer: 'COM',
  'Static GK': 'SGK',
  'Ecology & Environment': 'ENV',
  'Current Affairs': 'CUR',
  Mathematics: 'MAT',
  Reasoning: 'LR',
};

export const LEGACY_SUBJECT_ALIASES: Record<string, CanonicalSubject> = {
  history: 'History',
  geography: 'Geography',
  economics: 'Economics',
  economy: 'Economics',
  polity: 'Polity',
  'indian polity': 'Polity',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  'general science': 'Biology',
  science: 'Biology',
  computer: 'Computer',
  computers: 'Computer',
  'computer awareness': 'Computer',
  'static gk': 'Static GK',
  'general knowledge': 'Static GK',
  'ecology & environment': 'Ecology & Environment',
  'environment & ecology': 'Ecology & Environment',
  environment: 'Ecology & Environment',
  'current affairs': 'Current Affairs',
  mathematics: 'Mathematics',
  math: 'Mathematics',
  maths: 'Mathematics',
  quantitative: 'Mathematics',
  'quantitative aptitude': 'Mathematics',
  reasoning: 'Reasoning',
  'logical reasoning': 'Reasoning',
  'general intelligence & reasoning': 'Reasoning',
};

const TAXONOMY_GROUPS: ReadonlyArray<{
  subject: CanonicalSubject;
  baseOrder: number;
  topics: ReadonlyArray<{ topic: string; subTopics: readonly string[] }>;
}> = [
  {
    subject: 'History',
    baseOrder: 100,
    topics: [
      {
        topic: 'Ancient History',
        subTopics: [
          'Prehistoric Period',
          'Indus Valley Civilization',
          'Vedic Period',
          'Mahajanapadas & Magadha Empire',
          'Religious Movements (Buddhism & Jainism)',
          'Foreign Invasions (Persian & Greek)',
          'Mauryan Empire',
          'Post-Mauryan Period',
          'Gupta Empire',
          'Post-Gupta Period',
          'South Indian Dynasties',
        ],
      },
      {
        topic: 'Medieval History',
        subTopics: [
          'Early Medieval India',
          'The Delhi Sultanate',
          'The Vijayanagara & Bahmani Kingdoms',
          'Art & Architecture (Sultanate & Mughal Period)',
          'Bhakti & Sufi Movements',
          'The Mughal Empire',
          'The Maratha Empire',
        ],
      },
      {
        topic: 'Modern History',
        subTopics: [
          'Advent of Europeans',
          'British Conquest of India',
          'Important Battles & Treaties',
          'Economic Impact of British Rule',
          'Socio-Religious Reform Movements',
          'The Revolt of 1857',
          'Tribal & Peasant Uprisings',
          'Press & Literature in British India',
          'Indian National Movement (Phase 1: 1885-1905)',
          'Indian National Movement (Phase 2: 1905-1919)',
          'Indian National Movement (Gandhian Era 1919-1947)',
          'Governor-Generals & Viceroys',
          'Constitutional Development in British India',
        ],
      },
      {
        topic: 'World History',
        subTopics: [
          'Renaissance',
          'Reformation',
          'Industrial Revolution',
          'American Revolution',
          'French Revolution',
          'World War I',
          'Russian Revolution',
          'World War II',
        ],
      },
      {
        topic: 'Bihar History',
        subTopics: [
          'Ancient & Medieval Bihar',
          'Modern History of Bihar & Freedom Movement',
          'Formation of Bihar Province & 1857 in Bihar',
        ],
      },
    ],
  },
  {
    subject: 'Geography',
    baseOrder: 200,
    topics: [
      {
        topic: 'Physical Geography',
        subTopics: [
          'Universe & Solar System',
          "Earth's Interior & Rocks",
          'Geomorphic Processes',
          'Atmosphere',
          'Oceanography',
        ],
      },
      {
        topic: 'World Geography',
        subTopics: [
          'Continents',
          'Major Landforms',
          'Major Rivers & Lakes',
          'World Population & Tribes',
          'World Agriculture & Minerals',
        ],
      },
      {
        topic: 'Indian Geography',
        subTopics: [
          'Physical Features of India',
          'River Systems of India',
          'Climate of India',
          'Soils of India',
          'Natural Vegetation & Wildlife',
          'Major Passes, Glaciers & Plateaus',
          'Agriculture in India',
          'Mineral & Energy Resources',
          'Industries in India',
          'Transport & Communication',
          'Census & Demographics (2011)',
          'Indian States & UTs (Capitals, Borders)',
        ],
      },
      {
        topic: 'Bihar Geography',
        subTopics: [
          'Physiography, Climate & Soils of Bihar',
          'Drainage System & Irrigation of Bihar',
          'Mineral Resources, Agriculture & Census of Bihar',
        ],
      },
    ],
  },
  {
    subject: 'Economics',
    baseOrder: 300,
    topics: [
      {
        topic: 'Macroeconomics',
        subTopics: [
          'National Income (GDP, GNP, NNP)',
          'Money & Banking (RBI, Monetary Policy)',
          'Inflation',
          'Public Finance (Budget, Fiscal Policy, Taxation)',
        ],
      },
      {
        topic: 'Microeconomics',
        subTopics: ['Basics of Demand & Supply', 'Market Structures'],
      },
      {
        topic: 'Indian Economy',
        subTopics: [
          'Sectors of the Economy',
          'Economic Planning (Five-Year Plans, NITI Aayog)',
          'Indian Economic Reforms (LPG Reforms 1991)',
          'Taxation in India (Direct/Indirect Taxes, GST)',
          'Poverty, Inequality & Unemployment',
          'Government Schemes & Policies',
          'Agriculture & Food Security',
          'Industrial Policy',
          'Financial Markets (Money & Capital Market)',
          'International Trade & Balance of Payments',
        ],
      },
      {
        topic: 'Banking & Finance',
        subTopics: [
          'RBI & its Functions',
          'Types of Banks & Banking Sector Reforms',
          'Financial Institutions (SEBI, IRDAI, NABARD)',
          'International Financial Bodies (IMF, World Bank, WTO)',
        ],
      },
      {
        topic: 'Bihar Economy',
        subTopics: [
          'Bihar Economic Survey & Budget',
          'Bihar Agriculture, Industries & Welfare Schemes',
        ],
      },
    ],
  },
  {
    subject: 'Polity',
    baseOrder: 400,
    topics: [
      {
        topic: 'Constitutional Framework',
        subTopics: [
          'Making of the Constitution',
          'Salient Features',
          'Preamble',
          'Union & its Territory (Art 1-4)',
          'Citizenship (Art 5-11)',
        ],
      },
      {
        topic: 'Fundamental Rights & Duties',
        subTopics: [
          'Fundamental Rights (Art 12-35)',
          'Directive Principles of State Policy (DPSP - Art 36-51)',
          'Fundamental Duties (Art 51A)',
        ],
      },
      {
        topic: 'Union Government',
        subTopics: [
          'The President & Vice-President',
          'Prime Minister & Council of Ministers',
          'Parliament (Lok Sabha, Rajya Sabha, Bills, Sessions, Parliamentary Committees)',
          'The Judiciary (Supreme Court)',
        ],
      },
      {
        topic: 'State Government',
        subTopics: [
          'Governor',
          'Chief Minister & State Council of Ministers',
          'State Legislature',
          'High Courts & Subordinate Courts',
        ],
      },
      {
        topic: 'Local Government & Special Areas',
        subTopics: [
          'Panchayati Raj (73rd Amendment)',
          'Municipalities (74th Amendment)',
          'Union Territories',
          'Scheduled & Tribal Areas',
        ],
      },
      {
        topic: 'Constitutional & Non-Constitutional Bodies',
        subTopics: [
          'Election Commission',
          'UPSC, SPSC',
          'Finance Commission',
          'CAG',
          'NCSC, NCST, NCBC',
          'NITI Aayog, NHRC, CVC, CBI',
        ],
      },
      {
        topic: 'Constitutional Dynamics & Evolution',
        subTopics: [
          'Amendment of the Constitution (Major Amendments like 42nd, 44th, 73rd, 101st etc.)',
          'Schedules of the Constitution',
          'Parts of the Constitution',
          'Landmark Supreme Court Judgements',
          'Important Acts (Pre & Post Independence - e.g., GoI Act 1935, RTI Act 2005)',
        ],
      },
      {
        topic: 'Miscellaneous',
        subTopics: ['Emergency Provisions', 'Official Language'],
      },
      {
        topic: 'Bihar Polity & Governance',
        subTopics: ['Bihar Legislature, Executive & Panchayati Raj'],
      },
    ],
  },
  {
    subject: 'Physics',
    baseOrder: 500,
    topics: [
      {
        topic: 'Mechanics',
        subTopics: [
          'Units & Measurements',
          'Motion',
          'Laws of Motion',
          'Work, Energy & Power',
          'Gravitation',
        ],
      },
      {
        topic: 'Properties of Matter',
        subTopics: ['Elasticity', 'Surface Tension', 'Viscosity', 'Fluid Dynamics'],
      },
      {
        topic: 'Heat & Thermodynamics',
        subTopics: ['Heat & Temperature', 'Heat Transfer', 'Laws of Thermodynamics'],
      },
      {
        topic: 'Waves & Optics',
        subTopics: [
          'Oscillations & Waves',
          'Sound',
          'Light (Reflection, Refraction, Interference, Diffraction)',
          'Optical Instruments',
        ],
      },
      {
        topic: 'Electromagnetism',
        subTopics: [
          'Electrostatics',
          'Current Electricity',
          'Magnetism',
          'Electromagnetic Induction & AC',
        ],
      },
      {
        topic: 'Modern Physics',
        subTopics: ['Dual Nature of Matter', 'Atoms & Nuclei', 'Semiconductor Electronics'],
      },
      {
        topic: 'Applied Physics',
        subTopics: ['Scientific Instruments & their Uses', 'Inventions & Discoveries'],
      },
    ],
  },
  {
    subject: 'Chemistry',
    baseOrder: 600,
    topics: [
      {
        topic: 'Physical Chemistry',
        subTopics: [
          'Matter & its States',
          'Atomic Structure',
          'Chemical Bonding',
          'Thermodynamics',
          'Solutions',
          'Equilibrium',
          'Redox Reactions',
        ],
      },
      {
        topic: 'Inorganic Chemistry',
        subTopics: [
          'Periodic Classification',
          'Metals & Non-metals',
          'Metallurgy',
          'Important Compounds (Acids, Bases, Salts)',
        ],
      },
      {
        topic: 'Organic Chemistry',
        subTopics: ['Basics of Organic Chemistry', 'Hydrocarbons', 'Functional Groups'],
      },
      {
        topic: 'Applied Chemistry',
        subTopics: [
          'Polymers',
          'Biomolecules',
          'Important Ores & Alloys',
          'Cement, Glass & Fertilizers',
          'Chemistry in Everyday Life (Soaps, Drugs)',
        ],
      },
    ],
  },
  {
    subject: 'Biology',
    baseOrder: 700,
    topics: [
      {
        topic: 'Cell Biology & Genetics',
        subTopics: ['The Cell and its Organelles', 'Cell Division', 'Genetics & Evolution'],
      },
      {
        topic: 'Human Physiology',
        subTopics: [
          'Digestive System',
          'Respiratory System',
          'Circulatory System',
          'Excretory System',
          'Nervous System',
          'Endocrine System (Hormones)',
          'Skeletal & Muscular System',
        ],
      },
      {
        topic: 'Health, Nutrition & Diseases',
        subTopics: [
          'Human Diseases (Communicable & Non-communicable)',
          'Vitamins & Minerals',
          'Vaccines & Immunology',
        ],
      },
      {
        topic: 'Plant Biology',
        subTopics: [
          'Plant Kingdom Classification',
          'Plant Morphology',
          'Photosynthesis',
          'Plant Hormones',
        ],
      },
      { topic: 'Animal Biology', subTopics: ['Animal Kingdom Classification'] },
      { topic: 'Biotechnology & Applications', subTopics: ['Biotechnology & Applications'] },
    ],
  },
  {
    subject: 'Computer',
    baseOrder: 800,
    topics: [
      {
        topic: 'Computer Fundamentals',
        subTopics: [
          'History & Generations',
          'Hardware (CPU, Memory, I/O)',
          'Software (OS, Application Software)',
          'Number System',
          'Computer Architecture & Logic Gates',
        ],
      },
      {
        topic: 'Microsoft Office Suite',
        subTopics: [
          'MS Word',
          'MS Excel',
          'MS PowerPoint',
          'Shortcut Keys & File Extensions',
        ],
      },
      {
        topic: 'Networking & Internet',
        subTopics: [
          'Computer Networks (LAN, MAN, WAN)',
          'Internet & Services',
          'Cybersecurity',
          'OSI Model & Network Protocols',
        ],
      },
      {
        topic: 'Database Management',
        subTopics: ['Basic Concepts of DBMS', 'Data Models, Keys & SQL Basics'],
      },
      {
        topic: 'Emerging Technologies & Miscellaneous',
        subTopics: ['Emerging Tech (AI, Cloud, IoT, Web3)', 'Important Computer Abbreviations'],
      },
    ],
  },
  {
    subject: 'Static GK',
    baseOrder: 900,
    topics: [
      {
        topic: 'India at a Glance',
        subTopics: [
          'First in India (Male/Female)',
          'Superlatives',
          'Important Days & Dates',
          'Books & Authors (Indian)',
        ],
      },
      {
        topic: 'Arts & Culture',
        subTopics: [
          'Indian Dances (Classical & Folk)',
          'Music',
          'Festivals',
          'UNESCO World Heritage Sites in India',
        ],
      },
      {
        topic: 'World at a Glance',
        subTopics: [
          'Countries (Capitals, Currencies, Parliaments)',
          'International Organizations & Headquarters',
          'World Superlatives',
        ],
      },
      {
        topic: 'Awards, Honors & Sports',
        subTopics: [
          'National Awards (Bharat Ratna, Padma Awards)',
          'International Awards (Nobel Prize)',
          'Sports Awards & Trophies',
          'Sports Terminology',
        ],
      },
      {
        topic: 'Defence & Security',
        subTopics: ['Indian Armed Forces', 'Defence Exercises'],
      },
      {
        topic: 'National & International Insignia',
        subTopics: [
          'National Symbols of India',
          'Indian Government Organizations (ISRO, DRDO, BARC)',
          'Neighbouring Countries (Capitals, Currencies, Sports)',
        ],
      },
      {
        topic: 'Miscellaneous GK',
        subTopics: [
          'Nicknames of Places & Personalities',
          'Famous Slogans',
          'First in India & World (Updated)',
        ],
      },
      {
        topic: 'Bihar Static GK',
        subTopics: [
          'State Symbols, Arts, Culture & Heritage of Bihar',
          'Eminent Personalities & Institutions of Bihar',
        ],
      },
    ],
  },
  {
    subject: 'Ecology & Environment',
    baseOrder: 1000,
    topics: [
      {
        topic: 'Ecology & Ecosystem',
        subTopics: ['Basic Concepts', 'Food Chain & Web', 'Ecological Pyramids'],
      },
      {
        topic: 'Biodiversity & Conservation',
        subTopics: [
          'Biodiversity Hotspots',
          'Conservation Methods (In-situ, Ex-situ)',
          'National Parks',
          'Wildlife Sanctuaries',
          'Biosphere Reserves',
        ],
      },
      {
        topic: 'Environmental Issues & Conventions',
        subTopics: [
          'Pollution (Air, Water, Soil)',
          'Climate Change & Global Warming',
          'Ozone Depletion',
          'International Conventions (Ramsar, Kyoto, Paris Agreement)',
        ],
      },
      {
        topic: 'Bihar Ecology & Conservation',
        subTopics: ['National Parks, Wildlife & Ramsar Sites of Bihar'],
      },
    ],
  },
  {
    subject: 'Current Affairs',
    baseOrder: 1100,
    topics: [
      {
        topic: 'National Affairs',
        subTopics: [
          'Government Schemes & Policies',
          'Bills, Acts & Judgements',
          'Defence & Security',
          'Summits & Conferences',
          'State-Specific News',
          'Reports & Indices',
          'National Infrastructure & Logistics',
        ],
      },
      {
        topic: 'International Affairs',
        subTopics: [
          "India's Bilateral Relations",
          'International Summits & Organisations',
          'International Reports & Indices',
          'Major World Events',
        ],
      },
      {
        topic: 'Economy & Banking',
        subTopics: [
          'RBI & Monetary Policy',
          'Budget & Economic Survey',
          'Banking & Financial News',
          'Business & Corporate News',
        ],
      },
      {
        topic: 'Science & Technology',
        subTopics: [
          'Space & ISRO',
          'Defence Technology',
          'Health, Medicine & Biotech',
          'IT, Telecom & Digital Initiatives',
        ],
      },
      {
        topic: 'Defence & Security',
        subTopics: ['Defence Exercises', 'Defence Technology & Procurement'],
      },
      {
        topic: 'Sports',
        subTopics: [
          'Cricket',
          'Football',
          'Tennis',
          'Olympics & Major Games',
          'National & International Tournaments',
          'Sports Awards & Personalities',
        ],
      },
      {
        topic: 'Awards & Honours',
        subTopics: [
          'National Awards (Padma, Gallantry etc.)',
          'International Awards (Nobel, Booker etc.)',
          'Film & Music Awards',
          'Literary Awards',
        ],
      },
      {
        topic: 'Persons in News',
        subTopics: ['Appointments', 'Obituaries', 'Personalities & Achievements'],
      },
      {
        topic: 'Miscellaneous Current Affairs',
        subTopics: [
          'Important Days & Themes',
          'Books & Authors (Recent)',
          'Environment & Ecology News',
          'Art & Culture in News',
        ],
      },
      {
        topic: 'Bihar Current Affairs',
        subTopics: [
          'Bihar Schemes, Budget & Governance News',
          'Bihar Awards, Sports & Appointments in News',
        ],
      },
    ],
  },
  {
    subject: 'Mathematics',
    baseOrder: 1200,
    topics: [
      {
        topic: 'Number System',
        subTopics: [
          'Divisibility, Remainders & Unit Digit',
          'LCM & HCF',
          'Simplification, Surds & Indices',
        ],
      },
      {
        topic: 'Arithmetic',
        subTopics: [
          'Percentage',
          'Profit, Loss & Discount',
          'Simple & Compound Interest',
          'Ratio, Proportion & Partnership',
          'Average, Mixture & Alligation',
          'Time & Work, Pipes & Cisterns',
          'Time, Speed & Distance (Trains & Boats)',
        ],
      },
      {
        topic: 'Algebra',
        subTopics: [
          'Algebraic Identities & Polynomials',
          'Linear & Quadratic Equations',
          'Progressions & Series (AP, GP)',
        ],
      },
      {
        topic: 'Geometry & Mensuration',
        subTopics: [
          'Lines, Angles & Triangles',
          'Circles & Polygons',
          '2D Area & Perimeter',
          '3D Surface Area & Volume',
        ],
      },
      {
        topic: 'Trigonometry & Coordinate Geometry',
        subTopics: ['Trigonometric Ratios & Identities', 'Heights & Distances', 'Coordinate Geometry'],
      },
      {
        topic: 'Data Interpretation & Statistics',
        subTopics: ['Tables, Bar, Line & Pie Charts', 'Mean, Median, Mode & Standard Deviation'],
      },
      {
        topic: 'Higher & Applied Maths',
        subTopics: [
          'Permutation, Combination & Probability',
          'Set Theory, Logarithms & Calculus',
          'Clocks & Calendars (Quantitative)',
        ],
      },
    ],
  },
  {
    subject: 'Reasoning',
    baseOrder: 1300,
    topics: [
      {
        topic: 'Verbal Reasoning',
        subTopics: [
          'Analogy & Classification (Odd One Out)',
          'Number, Letter & Alpha-Numeric Series',
          'Coding-Decoding',
          'Blood Relations',
          'Direction Sense & Distance',
          'Ordering, Ranking & Dictionary Order',
        ],
      },
      {
        topic: 'Analytical & Logical Reasoning',
        subTopics: [
          'Syllogism & Venn Diagrams',
          'Seating Arrangement & Puzzles',
          'Statement, Assumptions & Conclusions',
          'Mathematical Operations & Missing Numbers',
          'Clocks & Calendars (Logical)',
          'Data Sufficiency',
        ],
      },
      {
        topic: 'Non-Verbal & Visual Reasoning',
        subTopics: [
          'Mirror & Water Images',
          'Paper Folding, Cutting & Embedded Figures',
          'Cubes, Dice & Figure Counting',
        ],
      },
    ],
  },
];

export const FALLBACK_TAXONOMY_TREE: readonly QuestionTaxonomyEntry[] = (() => {
  const flat: QuestionTaxonomyEntry[] = [];
  for (const group of TAXONOMY_GROUPS) {
    let offset = 1;
    const prefix = CANONICAL_SUBJECT_PREFIXES[group.subject];
    for (const topicNode of group.topics) {
      for (const subTopic of topicNode.subTopics) {
        flat.push({
          subject: group.subject,
          topic: topicNode.topic,
          sub_topic: subTopic,
          v1_prefix: prefix,
          sort_order: group.baseOrder + offset++,
        });
      }
    }
  }
  return flat;
})();

const CACHE_KEY = 'mindflow_question_taxonomy_ssot_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryTaxonomy: QuestionTaxonomyEntry[] | null = null;
let inFlightPromise: Promise<QuestionTaxonomyEntry[]> | null = null;

interface CachedPayload {
  updatedAt: number;
  entries: QuestionTaxonomyEntry[];
}

function readLocalCache(): CachedPayload | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed || !Array.isArray(parsed.entries) || parsed.entries.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(entries: QuestionTaxonomyEntry[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const payload: CachedPayload = { updatedAt: Date.now(), entries };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Non-fatal quota / private browsing errors
  }
}

export function getCachedQuestionTaxonomy(): readonly QuestionTaxonomyEntry[] {
  if (memoryTaxonomy && memoryTaxonomy.length > 0) {
    return memoryTaxonomy;
  }
  const disk = readLocalCache();
  if (disk) {
    memoryTaxonomy = disk.entries;
    return disk.entries;
  }
  return FALLBACK_TAXONOMY_TREE;
}

export async function fetchQuestionTaxonomy(
  forceRefresh = false
): Promise<QuestionTaxonomyEntry[]> {
  if (!forceRefresh && memoryTaxonomy && memoryTaxonomy.length > 0) {
    const disk = readLocalCache();
    if (disk && Date.now() - disk.updatedAt < CACHE_TTL_MS) {
      return memoryTaxonomy;
    }
  }

  if (!forceRefresh) {
    const disk = readLocalCache();
    if (disk && Date.now() - disk.updatedAt < CACHE_TTL_MS) {
      memoryTaxonomy = disk.entries;
      return disk.entries;
    }
  }

  if (inFlightPromise && !forceRefresh) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const { data, error } = await supabase.rpc(DB_RPCS.GET_QUESTION_TAXONOMY_TREE);
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const sanitized = (data as QuestionTaxonomyEntry[]).filter(
          (row) => row.subject && row.topic && row.sub_topic
        );
        if (sanitized.length > 0) {
          memoryTaxonomy = sanitized;
          writeLocalCache(sanitized);
          return sanitized;
        }
      }
      return [...getCachedQuestionTaxonomy()];
    } catch {
      return [...getCachedQuestionTaxonomy()];
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export function isCanonicalSubject(value: string | null | undefined): value is CanonicalSubject {
  if (!value) return false;
  return (CANONICAL_SUBJECTS as readonly string[]).includes(value.trim());
}

export function resolveCanonicalSubject(raw: string | null | undefined): CanonicalSubject | '' {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (isCanonicalSubject(trimmed)) return trimmed;
  return LEGACY_SUBJECT_ALIASES[trimmed.toLowerCase()] ?? '';
}

export function getCanonicalSubjects(
  entries: readonly QuestionTaxonomyEntry[] = getCachedQuestionTaxonomy()
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of entries) {
    if (!seen.has(row.subject)) {
      seen.add(row.subject);
      ordered.push(row.subject);
    }
  }
  return ordered.length > 0 ? ordered : [...CANONICAL_SUBJECTS];
}

export function getTopicsForSubject(
  subject: string | null | undefined,
  entries: readonly QuestionTaxonomyEntry[] = getCachedQuestionTaxonomy()
): string[] {
  if (!subject) return [];
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const row of entries) {
    if (row.subject === subject && !seen.has(row.topic)) {
      seen.add(row.topic);
      topics.push(row.topic);
    }
  }
  return topics;
}

export function getSubTopicsForTopic(
  subject: string | null | undefined,
  topic: string | null | undefined,
  entries: readonly QuestionTaxonomyEntry[] = getCachedQuestionTaxonomy()
): string[] {
  if (!subject || !topic) return [];
  const seen = new Set<string>();
  const subTopics: string[] = [];
  for (const row of entries) {
    if (row.subject === subject && row.topic === topic && !seen.has(row.sub_topic)) {
      seen.add(row.sub_topic);
      subTopics.push(row.sub_topic);
    }
  }
  return subTopics;
}

export function isValidTaxonomyTuple(
  subject: string | null | undefined,
  topic: string | null | undefined,
  subTopic: string | null | undefined,
  entries: readonly QuestionTaxonomyEntry[] = getCachedQuestionTaxonomy()
): boolean {
  if (!subject || !topic || !subTopic) return false;
  const s = subject.trim();
  const t = topic.trim();
  const st = subTopic.trim();
  return entries.some((row) => row.subject === s && row.topic === t && row.sub_topic === st);
}

/**
 * React hook exposing live SWR taxonomy SSOT + helper selectors for Admin forms & importers.
 */
export function useQuestionTaxonomy() {
  const [tree, setTree] = useState<readonly QuestionTaxonomyEntry[]>(() =>
    getCachedQuestionTaxonomy()
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void fetchQuestionTaxonomy(false).then((fresh) => {
      if (mounted && fresh.length > 0) {
        setTree(fresh);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const fresh = await fetchQuestionTaxonomy(true);
      setTree(fresh);
      return fresh;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tree,
    subjects: getCanonicalSubjects(tree),
    isLoading,
    refresh,
  };
}
