export type OnboardingStepId =
  | 'hero'
  | 'name'
  | 'exam_wheel'
  | 'wake_crew'
  | 'crew_carousel'
  | 'first_task'
  | 'connect_tools'
  | 'morning_nudge'
  | 'finale';

export const ALL_ONBOARDING_STEP_IDS: OnboardingStepId[] = [
  'hero',
  'name',
  'exam_wheel',
  'wake_crew',
  'crew_carousel',
  'first_task',
  'connect_tools',
  'morning_nudge',
  'finale',
];

export type CrewCompanionId = 'pyqo' | 'velo' | 'doci' | 'gkia' | 'lexi' | 'mocky';

export interface CrewCompanionConfig {
  id: CrewCompanionId;
  name: string;
  glyph: 'g' | 'o' | 'p' | 'q' | 'd' | 'b';
  colorHex: string;
  pastelBg: string;
  roleBadge: string;
  description: string;
  bestAt: string;
  worksIn: string;
  liveStatus: string;
  hurdleTitle: string;
  sleepingText: string;
  awakeText: string;
}

export interface StarterActionConfig {
  id: string;
  crewId: CrewCompanionId | 'milo';
  crewHandle: string;
  label: string;
  route: string;
}

export interface OnboardingHeroConfig {
  headline: string;
  subtitle: string;
  ctaText: string;
  guideName: string;
  greetings: [string, string];
}

export interface OnboardingConfig {
  enabledSteps: Record<OnboardingStepId, boolean>;
  hero: OnboardingHeroConfig;
  prompts: Record<OnboardingStepId, string>;
  crew: CrewCompanionConfig[];
  starterActions: StarterActionConfig[];
}

/**
 * Exact 6 Letter Companions from the reference video (Gigi 'g', Olo 'o', Pip 'p', Quinn 'q', Dex 'd', Bo 'b'),
 * mapped to pragmatic, everyday Indian competitive exam needs (Testbook PYQs, Parmar GK/GS, BlackBook Vocab, Mocks).
 */
export const DEFAULT_CREW_COMPANIONS: CrewCompanionConfig[] = [
  {
    id: 'pyqo',
    name: 'Gigi',
    glyph: 'g',
    colorHex: '#ff7b1c',
    pastelBg: '#fdece2',
    roleBadge: 'PYQ PAPERS',
    description:
      'Collects shift-wise Previous Year Questions and highlights the most repeated exam questions for you.',
    bestAt: 'Repeated PYQs',
    worksIn: 'Shift Papers • Quizzes',
    liveStatus: 'Currently sorting latest shift papers',
    hurdleTitle: 'Previous Year Questions (PYQs)',
    sleepingText: 'Gigi is napping',
    awakeText: 'Gigi is awake',
  },
  {
    id: 'velo',
    name: 'Olo',
    glyph: 'o',
    colorHex: '#ffc71f',
    pastelBg: '#fef6db',
    roleBadge: 'GK & GS NOTES',
    description:
      'Turns lengthy Polity, History, Science, and Static GK topics into crisp one-liner revision points.',
    bestAt: 'Static GK & GS',
    worksIn: 'Subject Hub • Notes',
    liveStatus: 'Currently preparing high-yield GK hooks',
    hurdleTitle: 'GK, GS & Current Affairs',
    sleepingText: 'Olo is napping',
    awakeText: 'Olo is awake',
  },
  {
    id: 'doci',
    name: 'Pip',
    glyph: 'p',
    colorHex: '#ff4d94',
    pastelBg: '#fde8f1',
    roleBadge: 'DAILY TARGET',
    description:
      'Plans your daily study target around what matters and guards your morning revision streak.',
    bestAt: 'Your daily plan',
    worksIn: 'Daily Target • Streak',
    liveStatus: 'Currently guarding your focus time',
    hurdleTitle: 'Planning my daily study routine',
    sleepingText: 'Pip is napping',
    awakeText: 'Pip is awake',
  },
  {
    id: 'gkia',
    name: 'Quinn',
    glyph: 'q',
    colorHex: '#0dcaf0',
    pastelBg: '#e3f8fc',
    roleBadge: 'ENGLISH VOCAB',
    description:
      'Drills BlackBook-style One Word Substitutions (OWS), Idioms, and Synonyms so you never forget them.',
    bestAt: 'OWS & Idioms',
    worksIn: 'English Hub • Flashcards',
    liveStatus: 'Currently loading 200+ repeated words',
    hurdleTitle: 'English Vocab (OWS, Idioms & Synonyms)',
    sleepingText: 'Quinn is napping',
    awakeText: 'Quinn is awake',
  },
  {
    id: 'lexi',
    name: 'Dex',
    glyph: 'd',
    colorHex: '#19b36b',
    pastelBg: '#e3f9ee',
    roleBadge: 'MOCK & SPEED',
    description:
      'Tracks your speed, accuracy, and time per question in full and sectional mock tests.',
    bestAt: 'Speed & Accuracy',
    worksIn: 'Timed Mock Tests',
    liveStatus: 'Currently calibrating exam timer',
    hurdleTitle: 'Speed & accuracy in Mock Tests',
    sleepingText: 'Dex is napping',
    awakeText: 'Dex is awake',
  },
  {
    id: 'mocky',
    name: 'Bo',
    glyph: 'b',
    colorHex: '#7950f2',
    pastelBg: '#eee8fd',
    roleBadge: 'MISTAKE BOOK',
    description:
      'Saves every wrong attempt automatically into your Mistake Notebook for quick pre-exam revision.',
    bestAt: 'Stopping -ve Marks',
    worksIn: 'Mistake Notebook',
    liveStatus: 'Currently watching for silly mistakes',
    hurdleTitle: 'Revising my wrong questions',
    sleepingText: 'Bo is napping',
    awakeText: 'Bo is awake',
  },
];

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  enabledSteps: {
    hero: true,
    name: true,
    exam_wheel: true,
    wake_crew: true,
    crew_carousel: true,
    first_task: true,
    connect_tools: true,
    morning_nudge: true,
    finale: true,
  },
  hero: {
    headline: 'Your exam prep, with a tiny crew.',
    subtitle:
      'Meet the Letters: friendly study bots that drill PYQs, revise GK & Vocab, and track mock speed right alongside you.',
    ctaText: 'Meet the crew',
    guideName: 'Ada',
    greetings: ["Hi! I'm Ada.", 'Need a hand?'],
  },
  prompts: {
    hero: "Hi! I'm Ada.",
    name: 'Hi! First things first, what should we call you?',
    exam_wheel: 'Lovely to meet you, {name}! Tell me about your target exam.',
    wake_crew: 'What eats up your study week?',
    crew_carousel: "Here's your crew. Swipe to meet everyone.",
    first_task: 'Go on, give Gigi a quick one. No setup needed.',
    connect_tools: 'Plug us into your study tools. Everything stays synced offline.',
    morning_nudge: 'Calendar is in. Pip is thrilled!',
    finale: "You're all set, {name}!",
  },
  crew: DEFAULT_CREW_COMPANIONS,
  starterActions: [
    {
      id: 'starter_pyq',
      crewId: 'pyqo',
      crewHandle: '@Gigi',
      label: 'start a 10-question PYQ practice',
      route: '/quiz/config',
    },
    {
      id: 'starter_gk',
      crewId: 'velo',
      crewHandle: '@Olo',
      label: 'revise high-yield GK & GS topics',
      route: '/dashboard',
    },
    {
      id: 'starter_vocab',
      crewId: 'doci',
      crewHandle: '@Pip',
      label: 'practice BlackBook Vocab (OWS & Idioms)',
      route: '/english',
    },
  ],
};

/**
 * Deep-merges a partial remote or cached OnboardingConfig with DEFAULT_ONBOARDING_CONFIG.
 */
export function mergeOnboardingConfig(
  raw?: Partial<OnboardingConfig> | null
): OnboardingConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_ONBOARDING_CONFIG;
  }

  const mergedEnabledSteps: Record<OnboardingStepId, boolean> = {
    ...DEFAULT_ONBOARDING_CONFIG.enabledSteps,
    ...(raw.enabledSteps || {}),
    hero: true,
    exam_wheel: true,
    finale: true,
  };

  const rawGreetings = Array.isArray(raw.hero?.greetings) ? raw.hero!.greetings : [];
  const mergedHero: OnboardingHeroConfig = {
    ...DEFAULT_ONBOARDING_CONFIG.hero,
    ...(raw.hero || {}),
    greetings: [
      typeof rawGreetings[0] === 'string' && rawGreetings[0].trim()
        ? rawGreetings[0]
        : DEFAULT_ONBOARDING_CONFIG.hero.greetings[0],
      typeof rawGreetings[1] === 'string' && rawGreetings[1].trim()
        ? rawGreetings[1]
        : DEFAULT_ONBOARDING_CONFIG.hero.greetings[1],
    ],
  };

  const mergedPrompts: Record<OnboardingStepId, string> = {
    ...DEFAULT_ONBOARDING_CONFIG.prompts,
    ...(raw.prompts || {}),
  };

  const rawCrewList = Array.isArray(raw.crew) ? raw.crew : [];
  const mergedCrew: CrewCompanionConfig[] = DEFAULT_CREW_COMPANIONS.map((defaultMember) => {
    const match = rawCrewList.find((c) => c && c.id === defaultMember.id);
    if (!match) return defaultMember;
    return {
      ...defaultMember,
      ...match,
      id: defaultMember.id,
      glyph: defaultMember.glyph,
      colorHex: match.colorHex || defaultMember.colorHex,
      pastelBg: match.pastelBg || defaultMember.pastelBg,
    };
  });

  const rawStarters = Array.isArray(raw.starterActions) ? raw.starterActions : [];
  const mergedStarters: StarterActionConfig[] =
    rawStarters.length === 3
      ? rawStarters.map((item, idx) => ({
          ...DEFAULT_ONBOARDING_CONFIG.starterActions[idx],
          ...item,
        }))
      : DEFAULT_ONBOARDING_CONFIG.starterActions;

  return {
    enabledSteps: mergedEnabledSteps,
    hero: mergedHero,
    prompts: mergedPrompts,
    crew: mergedCrew,
    starterActions: mergedStarters,
  };
}

/**
 * Safely interpolates {name} and {exam} tokens inside conversational prompts.
 */
export function interpolatePrompt(
  template: string,
  vars: { name?: string; exam?: string }
): string {
  const safeName = vars.name?.trim() ? vars.name.trim().split(/\s+/)[0] : 'Friend';
  const safeExam = vars.exam?.trim() || 'your exam';
  return (template || '')
    .replace(/\{name\}/gi, safeName)
    .replace(/\{exam\}/gi, safeExam);
}
