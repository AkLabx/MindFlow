export interface SscSubjectConfig {
  id: string;
  label: string;
  dbKey: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  gradient: string;
  borderClass: string;
  hoverBorder: string;
}

export const SSC_SUBJECTS: SscSubjectConfig[] = [
  {
    id: 'History',
    label: 'History',
    dbKey: 'History',
    icon: 'Landmark',
    colorClass: 'bg-amber-50 text-amber-600 border-amber-100',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    textClass: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    borderClass: 'border-amber-200/90 dark:border-amber-800/60',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
  {
    id: 'Polity',
    label: 'Polity',
    dbKey: 'Polity',
    icon: 'Scale',
    colorClass: 'bg-blue-50 text-blue-600 border-blue-100',
    bgClass: 'bg-blue-50 dark:bg-blue-950/50',
    textClass: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    borderClass: 'border-blue-200/90 dark:border-blue-800/60',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    id: 'Geography',
    label: 'Geography',
    dbKey: 'Geography',
    icon: 'Globe2',
    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderClass: 'border-emerald-200/90 dark:border-emerald-800/60',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  {
    id: 'Economy',
    label: 'Economy',
    dbKey: 'Economics',
    icon: 'TrendingUp',
    colorClass: 'bg-purple-50 text-purple-600 border-purple-100',
    bgClass: 'bg-purple-50 dark:bg-purple-950/50',
    textClass: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
    borderClass: 'border-purple-200/90 dark:border-purple-800/60',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
  },
  {
    id: 'Physics',
    label: 'Physics',
    dbKey: 'Physics',
    icon: 'Atom',
    colorClass: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/50',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    borderClass: 'border-cyan-200/90 dark:border-cyan-800/60',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-600',
  },
  {
    id: 'Chemistry',
    label: 'Chemistry',
    dbKey: 'Chemistry',
    icon: 'FlaskConical',
    colorClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
    textClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    gradient: 'from-fuchsia-500/10 via-pink-500/5 to-transparent',
    borderClass: 'border-fuchsia-200/90 dark:border-fuchsia-800/60',
    hoverBorder: 'hover:border-fuchsia-400 dark:hover:border-fuchsia-600',
  },
  {
    id: 'Biology',
    label: 'Biology',
    dbKey: 'Biology',
    icon: 'Dna',
    colorClass: 'bg-green-50 text-green-600 border-green-100',
    bgClass: 'bg-green-50 dark:bg-green-950/50',
    textClass: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500/10 via-emerald-500/5 to-transparent',
    borderClass: 'border-green-200/90 dark:border-green-800/60',
    hoverBorder: 'hover:border-green-400 dark:hover:border-green-600',
  },
  {
    id: 'Static GK',
    label: 'Static GK',
    dbKey: 'Static GK',
    icon: 'Award',
    colorClass: 'bg-rose-50 text-rose-600 border-rose-100',
    bgClass: 'bg-rose-50 dark:bg-rose-950/50',
    textClass: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
    borderClass: 'border-rose-200/90 dark:border-rose-800/60',
    hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-600',
  },
];

export interface QuickActionConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  bgClass: string;
  textClass: string;
  action: string;
  gradient: string;
  borderClass: string;
  hoverBorder: string;
}

export const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: 'daily-pyq',
    title: 'Daily PYQ Drill',
    subtitle: '25 Qs • 15 Mins',
    icon: 'Zap',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/50',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    action: 'mock',
    gradient: 'from-indigo-600/10 via-violet-600/5 to-transparent',
    borderClass: 'border-indigo-200/90 dark:border-indigo-800/60',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-600',
  },
  {
    id: 'custom-quiz',
    title: 'Custom Quiz',
    subtitle: 'Filter by Topic',
    icon: 'SlidersHorizontal',
    bgClass: 'bg-blue-50 dark:bg-blue-950/50',
    textClass: 'text-blue-600 dark:text-blue-400',
    action: 'custom',
    gradient: 'from-blue-600/10 via-sky-600/5 to-transparent',
    borderClass: 'border-blue-200/90 dark:border-blue-800/60',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    id: 'mistake-notebook',
    title: 'Mistake Notebook',
    subtitle: 'Error Revision Drill',
    icon: 'RotateCcw',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    textClass: 'text-amber-600 dark:text-amber-400',
    action: 'mistake-notebook',
    gradient: 'from-amber-600/10 via-orange-600/5 to-transparent',
    borderClass: 'border-amber-200/90 dark:border-amber-800/60',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
];

export interface ImportantForSscConfig {
  id: string;
  title: string;
  subjectLabel: string;
  subjectBg: string;
  tag: string;
  qs: string;
  filter: Record<string, any>;
  gradient: string;
  borderClass: string;
}

export const IMPORTANT_FOR_SSC: ImportantForSscConfig[] = [
  {
    id: 'art-amendments',
    title: 'Articles & Amendments',
    subjectLabel: 'Polity',
    subjectBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    tag: '🔥 Must Do',
    qs: '120+ PYQs',
    filter: { subject: ['Polity'], topic: ['Constitution', 'Articles & Amendments'] },
    gradient: 'from-blue-600/10 via-indigo-600/5 to-transparent',
    borderClass: 'border-blue-200/90 dark:border-blue-800/60',
  },
  {
    id: 'folk-dances',
    title: 'Folk Dances & Festivals',
    subjectLabel: 'Static GK',
    subjectBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
    tag: '⭐ Top Asked',
    qs: '180+ PYQs',
    filter: { subject: ['Static GK'], topic: ['Art & Culture', 'Dance & Festivals'] },
    gradient: 'from-rose-600/10 via-red-600/5 to-transparent',
    borderClass: 'border-rose-200/90 dark:border-rose-800/60',
  },
  {
    id: 'national-movement',
    title: 'Gandhian Era & Movement',
    subjectLabel: 'History',
    subjectBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    tag: '🔥 High Weight',
    qs: '150+ PYQs',
    filter: { subject: ['History'], topic: ['Modern History'] },
    gradient: 'from-amber-600/10 via-orange-600/5 to-transparent',
    borderClass: 'border-amber-200/90 dark:border-amber-800/60',
  },
  {
    id: 'five-year-plans',
    title: 'Five-Year Plans & Census',
    subjectLabel: 'Economy',
    subjectBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    tag: '📈 Trending',
    qs: '95+ PYQs',
    filter: { subject: ['Economics'], topic: ['Five Year Plans', 'Census'] },
    gradient: 'from-purple-600/10 via-violet-600/5 to-transparent',
    borderClass: 'border-purple-200/90 dark:border-purple-800/60',
  },
  {
    id: 'rivers',
    title: 'Indian River Systems & Passes',
    subjectLabel: 'Geography',
    subjectBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    tag: '🌍 Core GK',
    qs: '110+ PYQs',
    filter: { subject: ['Geography'], topic: ['Indian Geography', 'Rivers'] },
    gradient: 'from-emerald-600/10 via-teal-600/5 to-transparent',
    borderClass: 'border-emerald-200/90 dark:border-emerald-800/60',
  },
  {
    id: 'vitamins',
    title: 'Vitamins, Diseases & Body',
    subjectLabel: 'Science',
    subjectBg: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300',
    tag: '🧬 Bio Special',
    qs: '140+ PYQs',
    filter: { subject: ['Science', 'Biology'], topic: ['Human Body & Diseases'] },
    gradient: 'from-cyan-600/10 via-blue-600/5 to-transparent',
    borderClass: 'border-cyan-200/90 dark:border-cyan-800/60',
  },
];
