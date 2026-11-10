import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ROUTES } from '@/config/routes';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { triggerHaptic } from '@/lib/haptics';
import {
  ArrowLeft,
  Layers,
  Settings,
  FileText,
  Tag,
  RotateCcw,
  Loader2,
  AlertCircle,
  Database,
  BookOpen,
  Timer,
  Check,
  Save,
  Crown,
  Target
} from 'lucide-react';
import { CANONICAL_EXAMS, CanonicalExam } from '@/features/dashboard';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { Button } from '../../../components/Button/Button';
import { fetchQuestionMetadata, fetchQuestionsByIds } from '../services/questionService';
import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { useQuestionMetadata } from '../hooks/useQuestionMetadata';
import { cn } from '../../../utils/cn';
import { useDependentFilters } from '@/features/quiz';
import { db } from '../../../lib/db';
import { APP_CONFIG } from '../../../constants/config';
import { initialState } from '../stores/useQuizSessionStore';

// UI Components
import { CookingLoader } from './CookingLoader';
import { FilterGroup } from './ui/FilterGroup';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';
import { SegmentedControl } from './ui/SegmentedControl';
import { QuickStartButtons } from './ui/QuickStartButtons';
import { ActiveFiltersBar } from './ui/ActiveFiltersBar';
import { Accordion } from './ui/Accordion';
import { ScrollableCapsules } from './ui/ScrollableCapsules';
import { ExamBlueprintsHubPage } from '@/pages/ExamBlueprintsHubPage';
import { KeyboardAwareBottomBar } from '@/components/ui/KeyboardAwareBottomBar';

// Optimization Hooks
import { quizCreationService, MAX_QUIZ_QUESTIONS, DEFAULT_DRILL_QUESTION_COUNT } from '../services/quizCreationService';
import { useQuestionIndex, filterQuestionsByIndex } from '../hooks/useQuestionIndex';
import { useOptimizedFilterCounts } from '../hooks/useOptimizedFilterCounts';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { supabase } from '../../../lib/supabase';
import { syncService } from '../../../lib/syncService';
import { telemetry } from '@/lib/telemetry';
import { performanceTracker, PERF_BUDGETS } from '@/lib/performance';

interface QuizConfigProps {
  onStart: (questions: Question[], filters?: InitialFilters, mode?: QuizMode, quizName?: string) => void;
  onBack?: () => void;
}

const emptyFilters: InitialFilters = {
  subject: [],
  topic: [],
  subTopic: [],
  difficulty: [],
  questionType: [],
  examName: [],
  examYear: [],
  examDateShift: [],
  tags: [],
};

export const QuizConfig: React.FC<QuizConfigProps> = ({ onStart, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const examQueryParam = searchParams.get('exam');
  const [mode, setMode] = useState<QuizMode>((location.state as any)?.initialMode || 'learning');
  const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
  const [quizName, setQuizName] = useState('');

  // State for Data Fetching & Sync
  const { metadata, isLoading: isLoadingMetadata, error, progress, refresh: loadMetadata } = useQuestionMetadata();
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);

  const locState = location.state as any;
  const isFixedSubjectContext = locState?.fixedSubjectContext === true;
    const fixedSubject = isFixedSubjectContext ? locState?.initialFilters?.subject?.[0] : null;

  const setHideGlobalHeader = useLayoutStore((s) => s.setHideGlobalHeader);
  const setHideGlobalFooter = useLayoutStore((s) => s.setHideGlobalFooter);

  useEffect(() => {
    setHideGlobalHeader(true);
    setHideGlobalFooter(true);
    return () => {
      setHideGlobalHeader(false);
      setHideGlobalFooter(false);
    };
  }, [setHideGlobalHeader, setHideGlobalFooter]);

  const handleBack = useCallback(() => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
      return;
    }
    const st = location.state as any;
    if (st?.returnTo) {
      navigate(st.returnTo);
      return;
    }
    if (st?.from) {
      navigate(st.from);
      return;
    }
    if (isFixedSubjectContext && fixedSubject) {
      navigate(ROUTES.SUBJECT.view(fixedSubject));
      return;
    }
    navigate(ROUTES.DASHBOARD || '/dashboard');
  }, [onBack, location.state, isFixedSubjectContext, fixedSubject, navigate]);

  // Capacitor Android Hardware Back Button listener
  useEffect(() => {
    let backHandler: any;
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', () => {
        handleBack();
      }).then((handle) => {
        backHandler = handle;
      });
    }
    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [handleBack]);

  useEffect(() => {
    const locState = location.state as any;
    if (locState?.initialFilters && metadata.length > 0 && isLoadingMetadata === false) {
       setFilters(locState.initialFilters);
    } else if (examQueryParam && metadata.length > 0 && isLoadingMetadata === false) {
      const match = CANONICAL_EXAMS.find((e) => e.id === examQueryParam);
      if (match) {
        setFilters((prev) => ({
          ...prev,
          examName: match.dbExamNames,
        }));
      }
    }
  }, [location.state, examQueryParam, metadata.length, isLoadingMetadata]);

  const activeExamInfo = useMemo(() => {
    if (examQueryParam) {
      const match = CANONICAL_EXAMS.find((e) => e.id === examQueryParam);
      if (match) return match;
    }
    if (locState?.canonicalExamId) {
      const match = CANONICAL_EXAMS.find((e) => e.id === locState.canonicalExamId);
      if (match) return match;
    }
    if (filters.examName && filters.examName.length > 0) {
      const match = CANONICAL_EXAMS.find((e) =>
        e.dbExamNames.some((name) => filters.examName.includes(name))
      );
      if (match) return match;
      return {
        id: 'custom_exam',
        displayName: filters.examName.join(', '),
        shortCode: 'Exam',
        subtitle: 'Filtered by Selected Exam',
      } as any;
    }
    return null;
  }, [examQueryParam, locState?.canonicalExamId, filters.examName]);

    const handleClearExamContext = useCallback(() => {
    setFilters((prev) => ({ ...prev, examName: [] }));
  }, []);

  const tier2ActiveCount = useMemo(() => {
    return (
      filters.examYear.length +
      filters.examDateShift.length +
      filters.questionType.length +
      (activeExamInfo ? 0 : filters.examName.length)
    );
  }, [filters.examYear, filters.examDateShift, filters.questionType, filters.examName, activeExamInfo]);

  const { pinnedExamIds } = useExamContextStore();

  const pinnedExamsToAdd = useMemo(() => {
    return pinnedExamIds
      .map((id) => CANONICAL_EXAMS.find((e) => e.id === id))
      .filter((e): e is CanonicalExam => Boolean(e));
  }, [pinnedExamIds]);

  const handleToggleCombinedExam = useCallback((exam: CanonicalExam) => {
    setFilters((prev) => {
      const isIncluded = exam.dbExamNames.some((name) =>
        prev.examName.includes(name)
      );
      const nextExamNames = isIncluded
        ? prev.examName.filter((name) => !exam.dbExamNames.includes(name))
        : [...prev.examName, ...exam.dbExamNames];
      return {
        ...prev,
        examName: Array.from(new Set(nextExamNames)),
      };
    });
  }, []);



  // 1. Build Indexes (Performance Optimization)
  const questionIndex = useQuestionIndex(metadata);

  // 2. Build Classification Map for dependent dropdowns
  const classificationMap = useMemo(() => {
    const map = new Map<string, Map<string, Set<string>>>();
    metadata.forEach(q => {
      const { subject, topic, subTopic } = q.classification;
      if (!map.has(subject)) map.set(subject, new Map());
      const topicMap = map.get(subject)!;
      if (!topicMap.has(topic)) topicMap.set(topic, new Set());
      if (subTopic) topicMap.get(topic)!.add(subTopic);
    });
    return map;
  }, [metadata]);

  // 3. Hooks Integration for Filter Logic
  const { availableTopics, availableSubTopics } = useDependentFilters({
    selectedFilters: filters,
    setSelectedFilters: setFilters,
    classificationMap
  });

  // Calculate dynamic counts using Set operations
  const filterCounts = useOptimizedFilterCounts({
    allQuestions: metadata,
    selectedFilters: filters,
    index: questionIndex
  });

  // 4. Derived Lists for Dropdown Options
  const allSubjects = useMemo(() => Array.from(classificationMap.keys()).filter(Boolean).sort(), [classificationMap]);
  const allExamNames = useMemo(() => Array.from(new Set(metadata.map(q => q.examName ?? q.sourceInfo?.examName))).filter(Boolean).sort(), [metadata]);
  const examNamesAI = useMemo(() => allExamNames.filter(name => /^[a-iA-I]/.test(name)), [allExamNames]);
  const examNamesJR = useMemo(() => allExamNames.filter(name => /^[j-rJ-R]/.test(name)), [allExamNames]);
  const examNamesSZ = useMemo(() => allExamNames.filter(name => /^[s-zS-Z]/.test(name)), [allExamNames]);
  const examNamesOther = useMemo(() => allExamNames.filter(name => !/^[a-zA-Z]/.test(name)), [allExamNames]);
  const scopedMetadataForSource = useMemo(() => {
    let result = metadata;
    if (filters.examName && filters.examName.length > 0) {
      result = result.filter((q) => {
        const exam = q.examName ?? q.sourceInfo?.examName;
        return exam && filters.examName.includes(exam);
      });
    }
    if (filters.subject && filters.subject.length > 0) {
      result = result.filter((q) => {
        const sub = q.classification?.subject;
        return sub && filters.subject.includes(sub);
      });
    }
    return result;
  }, [metadata, filters.examName, filters.subject]);

  const allExamYears = useMemo(() => Array.from(new Set(scopedMetadataForSource.map(q => String(q.examYear ?? q.sourceInfo?.examYear)))).filter(Boolean).sort().reverse(), [scopedMetadataForSource]);
  const allExamShifts = useMemo(() => Array.from(new Set(scopedMetadataForSource.map(q => (q.examDateShift ?? q.sourceInfo?.examDateShift) || ''))).filter(Boolean).sort(), [scopedMetadataForSource]);
  const allTags = useMemo(() => Array.from(new Set(scopedMetadataForSource.flatMap(q => q.tags || []))).filter(Boolean).sort(), [scopedMetadataForSource]);

  // Smart Filter Pruning: Discard stale year or shift selections that have 0 questions under newly selected exam/subject
  useEffect(() => {
    if (filters.examYear.length > 0 && allExamYears.length > 0) {
      const validYears = filters.examYear.filter(y => allExamYears.includes(y));
      if (validYears.length !== filters.examYear.length) {
        setFilters(prev => ({ ...prev, examYear: validYears }));
      }
    }
  }, [allExamYears, filters.examYear]);

  useEffect(() => {
    if (filters.examDateShift.length > 0 && allExamShifts.length > 0) {
      const validShifts = filters.examDateShift.filter(s => allExamShifts.includes(s));
      if (validShifts.length !== filters.examDateShift.length) {
        setFilters(prev => ({ ...prev, examDateShift: validShifts }));
      }
    }
  }, [allExamShifts, filters.examDateShift]);

  // 5. Final Filtered Metadata Calculation using O(1) Set Intersections
  const filteredMetadata = useMemo(() => {
    return performanceTracker.measureSync(
      'filter_recalculation',
      PERF_BUDGETS.FILTER_RECALCULATION,
      () => filterQuestionsByIndex(metadata, questionIndex, filters)
    );
  }, [metadata, questionIndex, filters]);

  // Clear "No questions found" error when filters change
  useEffect(() => {
    if (filteredMetadata.length > 0) {
      setShowEmptyError(false);
    }
  }, [filteredMetadata.length]);

  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(() => {
    const locCount = (location.state as any)?.questionCount;
    return typeof locCount === 'number' && locCount > 0 ? locCount : DEFAULT_DRILL_QUESTION_COUNT;
  });

  const hasAutoStarted = React.useRef(false);
  useEffect(() => {
    const locState = location.state as any;
    if (locState?.autoStart && !hasAutoStarted.current && filteredMetadata.length > 0) {
      hasAutoStarted.current = true;
      handleCreate(locState?.questionCount);
    }
  }, [location.state, filteredMetadata.length]);

  // --- Handlers ---
    const createQuizWithQuestions = async (questionSubset: Question[], activeFilters: InitialFilters) => {
    try {
      setIsStartingQuiz(true);

      const defaultPrefix = activeExamInfo ? `${activeExamInfo.displayName} Practice` : 'Quiz';
      const finalName = quizName.trim() || `${defaultPrefix} • ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const result = await quizCreationService.createQuiz(questionSubset, activeFilters, mode, finalName);

      if (result.error) {
        useNotificationStore.getState().showToast({ variant: 'error', message: result.error });
        setIsStartingQuiz(false);
        return;
      }

      if (result.reused) {
        useNotificationStore.getState().showToast({ variant: 'success', message: 'Resuming existing quiz session' });
      }

      // Launch directly into the interactive session (Zero-Library Friction)
      navigate(`/quiz/session/${mode}/${result.quizId}`);

    } catch (err) {
      console.error("Failed to create quiz:", err);
      useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to create quiz. Please try again.' });
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleCreate = (countOverride?: number) => {
    if (filteredMetadata.length === 0) {
      setShowEmptyError(true);
      setTimeout(() => setShowEmptyError(false), 4000);
      return;
    }
    const locCount = (location.state as any)?.questionCount;
    const requestedCount = countOverride ?? locCount ?? selectedQuestionCount ?? DEFAULT_DRILL_QUESTION_COUNT;
    const targetCount = Math.min(requestedCount, filteredMetadata.length, MAX_QUIZ_QUESTIONS);

    const questionsToUse = filteredMetadata.length <= targetCount
      ? filteredMetadata
      : [...filteredMetadata].sort(() => 0.5 - Math.random()).slice(0, targetCount);

    createQuizWithQuestions(questionsToUse, filters);
  };

  const isFixedExamContext = locState?.fixedExamContext === true || Boolean(activeExamInfo);
  const currentExamNames = activeExamInfo?.dbExamNames || filters.examName;

  const handleClearFilters = useCallback(() => {
    const preservedSubject = isFixedSubjectContext && fixedSubject ? [fixedSubject] : [];
    const preservedExam = isFixedExamContext && currentExamNames && currentExamNames.length > 0 ? currentExamNames : [];
    setFilters({
      ...emptyFilters,
      subject: preservedSubject,
      examName: preservedExam,
    });
    telemetry.emit('filters_cleared', {
      preservedExamId: activeExamInfo?.id,
      clearedFields: ['topic', 'subTopic', 'difficulty', 'questionType', 'examYear', 'examDateShift', 'tags'],
    });
  }, [isFixedSubjectContext, fixedSubject, isFixedExamContext, currentExamNames, activeExamInfo]);

  const handleClearClassification = useCallback(() => {
    if (isFixedSubjectContext && fixedSubject) {
      setFilters(prev => ({ ...prev, subject: [fixedSubject], topic: [], subTopic: [] }));
    } else {
      setFilters(prev => ({ ...prev, subject: [], topic: [], subTopic: [] }));
    }
  }, [isFixedSubjectContext, fixedSubject]);

  const handleQuickStart = useCallback((type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => {
    const baseExamFilters = filters.examName && filters.examName.length > 0 ? { examName: filters.examName } : {};
    let quickFilters: InitialFilters = {
      ...emptyFilters,
      ...baseExamFilters,
    };
    if (type !== 'Mix') {
      quickFilters = { ...quickFilters, difficulty: [type] };
    }

    const candidatePool = filters.examName && filters.examName.length > 0
      ? metadata.filter((q) => {
          const exam = q.examName ?? q.sourceInfo?.examName;
          return exam && filters.examName.includes(exam);
        })
      : metadata;

    const subset = type === 'Mix'
      ? candidatePool
      : candidatePool.filter((q) => (q.properties?.difficulty) === type);

    const shuffled = [...subset].sort(() => 0.5 - Math.random()).slice(0, 25);

    if (shuffled.length === 0) {
      useNotificationStore.getState().showToast({ variant: 'error', message: `No questions found for difficulty: ${type}` });
      return;
    }

    createQuizWithQuestions(shuffled, quickFilters);
  }, [metadata, filters.examName, mode, quizName]);

  const handleFilterChange = useCallback((key: keyof InitialFilters, selected: string[]) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  }, []);

  const removeFilter = useCallback((key: keyof InitialFilters, value?: string) => {
    // Prevent removing the fixed subject
    if (isFixedSubjectContext && key === 'subject' && value === fixedSubject) {
      return;
    }

    if (value) {
      setFilters(prev => ({ ...prev, [key]: (prev[key] || []).filter((item: string) => item !== value) }));
    } else {
      setFilters(prev => ({ ...prev, [key]: [] }));
    }
  }, [isFixedSubjectContext, fixedSubject]);

  const handleSegmentToggle = useCallback((key: keyof InitialFilters, option: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const isSelected = (current as string[]).includes(option);
      return {
        ...prev,
        [key]: isSelected ? [...(current as string[])].filter(i => i !== option) : [...(current as string[]), option as any]
      };
    });
  }, []);

  // --- Loading State Render ---
  if (isLoadingMetadata) {
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">
        <CookingLoader
          progress={percentage}
          syncedItems={progress.current}
          totalItems={progress.total}
        />
      </div>
    );
  }

  // --- Error State Render ---
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 w-full p-8 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Connection Error</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={loadMetadata}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-[100dvh] w-full md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-x-hidden overscroll-contain select-none relative">

      {/* Overlay for "Starting Quiz" blocking interaction */}
      {isStartingQuiz && (
        <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Creating Your Quiz</h3>
          <p className="text-gray-500 dark:text-gray-400">Saving questions to database...</p>
        </div>
      )}

      {/* Sticky Material 3 Top App Bar */}
      <header className="sticky top-0 z-30 px-4 md:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] md:pt-6 pb-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 -ml-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 active:bg-slate-100 dark:active:bg-slate-800 transition-all rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white m-0 leading-none tracking-tight truncate">
            {isFixedSubjectContext && fixedSubject ? `${fixedSubject} Quiz` : 'Create New Quiz'}
          </h1>
        </div>
      </header>

      {/* Scrollable Config Content */}
      <div className="p-4 md:p-6 pb-44 md:space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto pt-4 md:pt-6">

        {/* Active Exam Context Banner (Exam-First Quick Access with Multi-Exam Support) */}
        {activeExamInfo && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-200/90 dark:border-indigo-800/60 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Target Exam Active
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 tabular-nums">
                      {filteredMetadata.length} Qs Available
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                    {activeExamInfo.displayName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    handleClearExamContext();
                  }}
                  className="min-h-[36px] text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer touch-manipulation"
                >
                  Clear Exam
                </button>
              </div>
            </div>

            {/* Multi-Exam Combination Pills */}
            {pinnedExamsToAdd.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Combine with:
                </span>
                {pinnedExamsToAdd.map((pinnedExam) => {
                  const isIncluded = pinnedExam.dbExamNames.some((name) =>
                    filters.examName.includes(name)
                  );
                  return (
                    <button
                      key={pinnedExam.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        handleToggleCombinedExam(pinnedExam);
                      }}
                      className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer touch-manipulation ${
                        isIncluded
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                      }`}
                    >
                      <span>{isIncluded ? '✓' : '+'}</span>
                      <span>{pinnedExam.shortCode}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Header actions (Mode & Quick Start) inline Filter Bar */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-6 relative z-20 min-w-0 pb-4 border-b border-gray-200 dark:border-gray-700 md:border-none md:pb-0">

          {/* Seamless Mode Switch */}
          <div className="flex bg-gray-200/60 dark:bg-gray-800/80 p-1 rounded-xl max-w-[320px] overflow-x-auto hide-scrollbar flex-nowrap min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMode('learning');
              }}
              className={cn(
                "shrink-0 min-h-[36px] flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer touch-manipulation",
                mode === 'learning'
                  ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span>Learning</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMode('mock');
              }}
              className={cn(
                "shrink-0 min-h-[36px] flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer touch-manipulation",
                mode === 'mock'
                  ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span>Mock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMode('god');
              }}
              className={cn(
                "min-h-[36px] flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer touch-manipulation",
                mode === 'god'
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span>God Mode</span>
            </button>
          </div>

          {/* Quick Quiz Button */}
          <div className="relative z-50">
            <QuickStartButtons onQuickStart={handleQuickStart} />
          </div>
        </div>



        {mode === 'god' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ExamBlueprintsHubPage onBack={onBack} onLaunchBlueprint={(bp: any) => navigate(`/blueprints/preview/${bp.id}`)} metadataIndex={questionIndex} />
          </div>
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-6", mode === 'god' && "hidden")}>
          <FilterGroup
            title="Classification"
            icon={<Layers className="w-5 h-5" />}
            showClearAll={filters.subject.length > 0 || filters.topic.length > 0 || filters.subTopic.length > 0}
            onClearAll={handleClearClassification}
          >
            {!isFixedSubjectContext && (
            <ScrollableCapsules
              label="Subject"
              tooltip="Filter questions by broad academic discipline"
              options={allSubjects}
              selectedOptions={filters.subject}
              onOptionToggle={(opt) => {
                const newSelection = filters.subject.includes(opt)
                  ? filters.subject.filter(item => item !== opt)
                  : [...filters.subject, opt];
                handleFilterChange('subject', newSelection);
              }}
              counts={filterCounts.subject || {}}
              hideZeroCount
              maxRows={3}
            />
            )}
            <ScrollableCapsules
              label="Topic"
              tooltip="Filter by specific topics within the selected subjects"
              options={availableTopics}
              selectedOptions={filters.topic}
              onOptionToggle={(opt) => {
                const newSelection = filters.topic.includes(opt)
                  ? filters.topic.filter(item => item !== opt)
                  : [...filters.topic, opt];
                handleFilterChange('topic', newSelection);
              }}
              counts={filterCounts.topic || {}}
              hideZeroCount
              isLoading={filters.subject.length > 0 && availableTopics.length === 0 && isLoadingMetadata}
              emptyMessage={filters.subject.length === 0 ? "Select Subject First" : "No topics available"}
              maxRows={3}
            />
            <ScrollableCapsules
              label="Sub-Topic"
              tooltip="Filter by granular sub-topics for precise practice"
              options={availableSubTopics}
              selectedOptions={filters.subTopic}
              onOptionToggle={(opt) => {
                const newSelection = filters.subTopic.includes(opt)
                  ? filters.subTopic.filter(item => item !== opt)
                  : [...filters.subTopic, opt];
                handleFilterChange('subTopic', newSelection);
              }}
              counts={filterCounts.subTopic || {}}
              hideZeroCount
              isLoading={filters.topic.length > 0 && availableSubTopics.length === 0 && isLoadingMetadata}
              emptyMessage={filters.topic.length === 0 ? "Select Topic First" : "No sub-topics available"}
              maxRows={3}
            />
          </FilterGroup>

          <FilterGroup title="Properties" icon={<Settings className="w-5 h-5" />}>
            <SegmentedControl
              label="Difficulty"
              tooltip="Choose question complexity level"
              options={['Easy', 'Medium', 'Hard']}
              selectedOptions={filters.difficulty}
              onOptionToggle={(opt) => handleSegmentToggle('difficulty', opt)}
              counts={filterCounts.difficulty || {}}
              hideZeroCount
            />
          </FilterGroup>
        </div>

        {mode !== 'god' && (
          <>
            {/* Progressive Disclosure Tier 2: PYQ & Examination Scoping */}
            <Accordion
              title="PYQ & Examination Scoping"
              subtitle="Filter by year, shift, and question format"
              activeBadge={tier2ActiveCount > 0 ? tier2ActiveCount : null}
              className="mt-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-6">
                <FilterGroup title="Source" icon={<FileText className="w-5 h-5" />}>
                  {/* Deduplicate controls: Hide raw exam selector capsules when active exam context is set */}
                  {!activeExamInfo && (
                    <>
                  {examNamesAI.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Name [A-I]"
                      tooltip="Filter questions by Exam Name starting with A to I"
                      options={examNamesAI}
                      selectedOptions={filters.examName}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examName.includes(opt)
                          ? filters.examName.filter(item => item !== opt)
                          : [...filters.examName, opt];
                        handleFilterChange('examName', newSelection);
                      }}
                      counts={filterCounts.examName || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}
                  {examNamesJR.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Name [J-R]"
                      tooltip="Filter questions by Exam Name starting with J to R"
                      options={examNamesJR}
                      selectedOptions={filters.examName}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examName.includes(opt)
                          ? filters.examName.filter(item => item !== opt)
                          : [...filters.examName, opt];
                        handleFilterChange('examName', newSelection);
                      }}
                      counts={filterCounts.examName || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}
                  {examNamesSZ.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Name [S-Z]"
                      tooltip="Filter questions by Exam Name starting with S to Z"
                      options={examNamesSZ}
                      selectedOptions={filters.examName}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examName.includes(opt)
                          ? filters.examName.filter(item => item !== opt)
                          : [...filters.examName, opt];
                        handleFilterChange('examName', newSelection);
                      }}
                      counts={filterCounts.examName || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}
                  {examNamesOther.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Name [Other]"
                      tooltip="Filter questions by Exam Name"
                      options={examNamesOther}
                      selectedOptions={filters.examName}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examName.includes(opt)
                          ? filters.examName.filter(item => item !== opt)
                          : [...filters.examName, opt];
                        handleFilterChange('examName', newSelection);
                      }}
                      counts={filterCounts.examName || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}
                    </>
                  )}

                  {allExamYears.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Year"
                      tooltip="Filter by specific exam years"
                      options={allExamYears}
                      selectedOptions={filters.examYear}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examYear.includes(opt)
                          ? filters.examYear.filter(item => item !== opt)
                          : [...filters.examYear, opt];
                        handleFilterChange('examYear', newSelection);
                      }}
                      counts={filterCounts.examYear || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}

                  {allExamShifts.length > 0 && (
                    <ScrollableCapsules
                      label="Exam Shift"
                      tooltip="Filter by specific exam shifts"
                      options={allExamShifts}
                      selectedOptions={filters.examDateShift}
                      onOptionToggle={(opt) => {
                        const newSelection = filters.examDateShift.includes(opt)
                          ? filters.examDateShift.filter(item => item !== opt)
                          : [...filters.examDateShift, opt];
                        handleFilterChange('examDateShift', newSelection);
                      }}
                      counts={filterCounts.examDateShift || {}}
                      hideZeroCount
                      maxRows={3}
                    />
                  )}
                </FilterGroup>

                <FilterGroup title="Format & Question Type" icon={<Settings className="w-5 h-5" />}>
                  <SegmentedControl
                    label="Question Type"
                    tooltip="Filter by question format (e.g., Multiple Choice)"
                    options={['MCQ']}
                    selectedOptions={filters.questionType}
                    onOptionToggle={(opt) => handleSegmentToggle('questionType', opt)}
                    counts={filterCounts.questionType || {}}
                    hideZeroCount
                  />
                </FilterGroup>
              </div>
            </Accordion>

            {/* Progressive Disclosure Tier 3: Deep Diagnostics & Tags */}
            <Accordion
              title="Deep Diagnostics & Tags"
              subtitle="Filter by PYQ tags and granular question metadata"
              activeBadge={filters.tags.length > 0 ? filters.tags.length : null}
              className="mt-4 mb-24"
            >
              <div className="max-w-xl">
                <FilterGroup title="Tags" icon={<Tag className="w-5 h-5" />}>
                  <MultiSelectDropdown
                    label="Search Tags"
                    options={allTags}
                    selectedOptions={filters.tags}
                    onSelectionChange={(sel) => handleFilterChange('tags', sel)}
                    placeholder="Filter by Tags"
                    counts={filterCounts.tags || {}}
                    hideZeroCount
                  />
                </FilterGroup>
              </div>
            </Accordion>

            {/* Active Filters Displayed above sticky footer area */}
            <div className="pb-8 mt-6 md:mt-0">
               <ActiveFiltersBar
                filters={filters}
                onRemoveFilter={removeFilter}
                onClearAll={handleClearFilters}
                lockedFilterKeys={isFixedSubjectContext ? ['subject'] : []}
              />
            </div>
          </>
        )}
      </div>

      {/* Sticky Action Footer */}
      {mode !== 'god' && (
        <KeyboardAwareBottomBar
          hasGlobalFooter={false}
          fullWidth
          className="z-[60] border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.08)] dark:shadow-none select-none"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-3 w-full">
             {/* Quiz Name Input - Compact for footer */}
             <div className="w-full sm:w-64 flex-shrink-0">
              <input
                type="text"
                inputMode="text"
                enterKeyHint="done"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="Quiz Name (Optional)"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Question Count Selector Chips (MindFlow Constitution Section 8) */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-1 bg-gray-100 dark:bg-gray-800/90 p-1 rounded-xl border border-gray-200 dark:border-gray-700/80 shrink-0">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 shrink-0">
                Questions:
              </span>
              <div className="flex items-center gap-1 flex-1 sm:flex-initial justify-end">
                {[10, 20, 25, 50, 100].map((count) => {
                  const isSelected = selectedQuestionCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedQuestionCount(count);
                      }}
                      className={cn(
                        "min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer touch-manipulation tabular-nums",
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                aria-label="Reset all filters"
                onClick={() => {
                  triggerHaptic('light');
                  handleClearFilters();
                }}
                className="flex-shrink-0 min-w-[44px] h-11 px-3 rounded-xl active:scale-95 touch-manipulation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <div className="relative w-full">
                {showEmptyError && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-2 rounded-lg shadow-md border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-bottom-2 text-center">
                    No questions match your criteria.
                  </div>
                )}
                <Button
                  size="lg"
                  onClick={() => {
                    triggerHaptic('medium');
                    handleCreate(selectedQuestionCount);
                  }}
                  disabled={isStartingQuiz}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white border-0 shadow-lg shadow-indigo-500/20 px-6 flex items-center justify-center gap-2 font-bold touch-manipulation transition-all"
                >
                  {isStartingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        Create Quiz ({Math.min(selectedQuestionCount, filteredMetadata.length, MAX_QUIZ_QUESTIONS)})
                      </span>
                      {filteredMetadata.length > selectedQuestionCount && (
                        <span className="text-[10px] opacity-80 font-normal tabular-nums">
                          / {filteredMetadata.length}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </KeyboardAwareBottomBar>
      )}
    </div>
  );
};
