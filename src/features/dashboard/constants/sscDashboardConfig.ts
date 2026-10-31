export const SSC_SUBJECTS = [
  { id: 'History', label: 'History', dbKey: 'History', icon: 'Landmark', colorClass: 'bg-amber-50 text-amber-600 border-amber-100', bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
  { id: 'Polity', label: 'Polity', dbKey: 'Polity', icon: 'Scale', colorClass: 'bg-blue-50 text-blue-600 border-blue-100', bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
  { id: 'Geography', label: 'Geography', dbKey: 'Geography', icon: 'Globe2', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
  { id: 'Economy', label: 'Economy', dbKey: 'Economics', icon: 'TrendingUp', colorClass: 'bg-purple-50 text-purple-600 border-purple-100', bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
  { id: 'Physics', label: 'Physics', dbKey: 'Physics', icon: 'Atom', colorClass: 'bg-violet-50 text-violet-600 border-violet-100', bgClass: 'bg-violet-50', textClass: 'text-violet-600' },
  { id: 'Chemistry', label: 'Chemistry', dbKey: 'Chemistry', icon: 'FlaskConical', colorClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100', bgClass: 'bg-fuchsia-50', textClass: 'text-fuchsia-600' },
  { id: 'Biology', label: 'Biology', dbKey: 'Biology', icon: 'Dna', colorClass: 'bg-green-50 text-green-600 border-green-100', bgClass: 'bg-green-50', textClass: 'text-green-600' },
  { id: 'Static GK', label: 'Static GK', dbKey: 'Static GK', icon: 'Award', colorClass: 'bg-rose-50 text-rose-600 border-rose-100', bgClass: 'bg-rose-50', textClass: 'text-rose-600' },
];

export const QUICK_ACTIONS = [
  { id: 'daily-pyq', title: 'Daily PYQ Drill', subtitle: '25 Qs • 15 Mins', icon: 'Zap', bgClass: 'bg-indigo-50', textClass: 'text-indigo-600', action: 'mock' },
  { id: 'custom-quiz', title: 'Custom Quiz', subtitle: 'Filter by Topic', icon: 'SlidersHorizontal', bgClass: 'bg-blue-50', textClass: 'text-blue-600', action: 'custom' },
  { id: 'english', title: 'English & Vocab', subtitle: 'Synonyms, OWS', icon: 'BookMarked', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', action: 'english' },
  { id: 'weak-topics', title: 'Weak Areas', subtitle: 'Targeted Practice', icon: 'Target', bgClass: 'bg-rose-50', textClass: 'text-rose-600', action: 'weak-topics' },
];

export const IMPORTANT_FOR_SSC = [
  { id: 'art-amendments', title: 'Articles & Amendments', subjectLabel: 'Polity', subjectBg: 'bg-blue-50 text-blue-600', tag: '🔥 Must Do', qs: '120+ PYQs', filter: { subject: ['Polity'], topic: ['Constitution', 'Articles & Amendments'] } },
  { id: 'folk-dances', title: 'Folk Dances & Festivals', subjectLabel: 'Static GK', subjectBg: 'bg-rose-50 text-rose-600', tag: '⭐ Top Asked', qs: '180+ PYQs', filter: { subject: ['Static GK'], topic: ['Art & Culture', 'Dance & Festivals'] } },
  { id: 'national-movement', title: 'Gandhian Era & Movement', subjectLabel: 'History', subjectBg: 'bg-amber-50 text-amber-600', tag: '🔥 High Weight', qs: '150+ PYQs', filter: { subject: ['History'], topic: ['Modern History'] } },
  { id: 'five-year-plans', title: 'Five-Year Plans & Census', subjectLabel: 'Economy', subjectBg: 'bg-purple-50 text-purple-600', tag: '📈 Trending', qs: '95+ PYQs', filter: { subject: ['Economics'], topic: ['Five Year Plans', 'Census'] } },
  { id: 'rivers', title: 'Indian River Systems & Passes', subjectLabel: 'Geography', subjectBg: 'bg-emerald-50 text-emerald-600', tag: '🌍 Core GK', qs: '110+ PYQs', filter: { subject: ['Geography'], topic: ['Indian Geography', 'Rivers'] } },
  { id: 'vitamins', title: 'Vitamins, Diseases & Body', subjectLabel: 'Science', subjectBg: 'bg-cyan-50 text-cyan-600', tag: '🧬 Bio Special', qs: '140+ PYQs', filter: { subject: ['Science', 'Biology'], topic: ['Human Body & Diseases'] } },
];
