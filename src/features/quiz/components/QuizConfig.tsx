import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Crown
} from 'lucide-react';
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

// Optimization Hooks
import { quizCreationService } from '../services/quizCreationService';
import { useQuestionIndex, filterQuestionsByIndex } from '../hooks/useQuestionIndex';
import { useOptimizedFilterCounts } from '../hooks/useOptimizedFilterCounts';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { supabase } from '../../../lib/supabase';
import { syncService } from '../../../lib/syncService';

interface QuizConfigProps {
  onStart: (questions: Question[], filters?: InitialFilters, mode?: QuizMode, quizName?: string) => void;
  onBack: () => void;
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

  useEffect(() => {
    const locState = location.state as any;
    if (locState?.initialFilters && metadata.length > 0 && isLoadingMetadata === false) {
       setFilters(locState.initialFilters);
    }
  }, [location.state, metadata.length, isLoadingMetadata]);



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
  const allExamYears = useMemo(() => Array.from(new Set(metadata.map(q => String(q.examYear ?? q.sourceInfo?.examYear)))).filter(Boolean).sort(), [metadata]);
  const allExamShifts = useMemo(() => Array.from(new Set(metadata.map(q => (q.examDateShift ?? q.sourceInfo?.examDateShift) || ''))).filter(Boolean).sort(), [metadata]);
  const allTags = useMemo(() => Array.from(new Set(metadata.flatMap(q => q.tags))).filter(Boolean).sort(), [metadata]);

  // 5. Final Filtered Metadata Calculation using O(1) Set Intersections
  const filteredMetadata = useMemo(() => {
    return filterQuestionsByIndex(metadata, questionIndex, filters);
  }, [metadata, questionIndex, filters]);

  // Clear "No questions found" error when filters change
  useEffect(() => {
    if (filteredMetadata.length > 0) {
      setShowEmptyError(false);
    }
  }, [filteredMetadata.length]);

  const hasAutoStarted = React.useRef(false);
  useEffect(() => {
    const locState = location.state as any;
    if (locState?.autoStart && !hasAutoStarted.current && filteredMetadata.length > 0) {
      hasAutoStarted.current = true;
      handleCreate();
    }
  }, [location.state, filteredMetadata.length]);

  // --- Handlers ---
    const createQuizWithQuestions = async (questionSubset: Question[], activeFilters: InitialFilters) => {
    try {
      setIsStartingQuiz(true);

      const finalName = quizName.trim() || `Quiz ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      const result = await quizCreationService.createQuiz(questionSubset, activeFilters, mode, finalName);

      if (result.error) {
        useNotificationStore.getState().showToast({ variant: 'error', message: result.error });
        setIsStartingQuiz(false);
        return;
      }

      if (result.reused) {
        useNotificationStore.getState().showToast({ variant: 'success', message: 'Resuming existing quiz session' });
      }

      // navigate to Saved route to fetch newly created (or reused) quiz directly from the cloud
      navigate('/quiz/library?tab=created');

    } catch (err) {
      console.error("Failed to create quiz:", err);
      useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to create quiz. Please try again.' });
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleCreate = () => {
    if (filteredMetadata.length === 0) {
      setShowEmptyError(true);
      setTimeout(() => setShowEmptyError(false), 4000);
      return;
    }
    createQuizWithQuestions(filteredMetadata, filters);
  };

  const handleClearFilters = useCallback(() => {
    if (isFixedSubjectContext && fixedSubject) {
      setFilters({ ...emptyFilters, subject: [fixedSubject] });
    } else {
      setFilters(emptyFilters);
    }
  }, [isFixedSubjectContext, fixedSubject]);

  const handleClearClassification = useCallback(() => {
    if (isFixedSubjectContext && fixedSubject) {
      setFilters(prev => ({ ...prev, subject: [fixedSubject], topic: [], subTopic: [] }));
    } else {
      setFilters(prev => ({ ...prev, subject: [], topic: [], subTopic: [] }));
    }
  }, [isFixedSubjectContext, fixedSubject]);

  const handleQuickStart = useCallback((type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => {
    let quickFilters = emptyFilters;
    if (type !== 'Mix') {
      quickFilters = { ...emptyFilters, difficulty: [type] };
    }

    const subset = type === 'Mix'
      ? metadata
      : metadata.filter(q => (q.properties?.difficulty) === type);

    const shuffled = [...subset].sort(() => 0.5 - Math.random()).slice(0, 25);

    if (shuffled.length === 0) {
      useNotificationStore.getState().showToast({ variant: 'error', message: `No questions found for difficulty: ${type}` });
      return;
    }

    createQuizWithQuestions(shuffled, quickFilters);
  }, [metadata]);

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
    <div className="bg-white dark:bg-gray-800 min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">

      {/* Overlay for "Starting Quiz" blocking interaction */}
      {isStartingQuiz && (
        <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Creating Your Quiz</h3>
          <p className="text-gray-500 dark:text-gray-400">Saving questions to database...</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 z-10 md:relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center justify-center p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white m-0 leading-none tracking-tight">
            {isFixedSubjectContext && fixedSubject ? `${fixedSubject} Quiz` : 'Create New Quiz'}
          </h1>
        </div>
      </div>

      {/* Scrollable Config Content */}
      <div className="p-4 md:p-6 pb-32 md:space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto pt-6 md:pt-6">

        {/* Header actions (Mode & Quick Start) inline Filter Bar */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-6 relative z-20 min-w-0 pb-4 border-b border-gray-200 dark:border-gray-700 md:border-none md:pb-0">

          {/* Seamless Mode Switch */}
          <div className="flex bg-gray-200/50 dark:bg-gray-800/80 p-0.5 rounded-lg max-w-[300px] overflow-x-auto hide-scrollbar flex-nowrap min-w-0">
            <button
              onClick={() => setMode('learning')}
              className={cn(
                "shrink-0 flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200",
                mode === 'learning'
                  ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span>Learning</span>
            </button>
            <button
              onClick={() => setMode('mock')}
              className={cn(
                "shrink-0 flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200",
                mode === 'mock'
                  ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span>Mock</span>
            </button>
            <button
              onClick={() => setMode('god')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200",
                mode === 'god'
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
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

        {mode !== 'god' && (
          <>
            {/* Progressive Disclosure: Advanced Filters Accordion */}
            <Accordion title="Advanced Filters">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-6">
                <FilterGroup title="Source" icon={<FileText className="w-5 h-5" />}>
                  <MultiSelectDropdown
                    label="Exam Name"
                    options={allExamNames}
                    selectedOptions={filters.examName}
                    onSelectionChange={(sel) => handleFilterChange('examName', sel)}
                    placeholder="Select Exams"
                    counts={filterCounts.examName || {}}
                    hideZeroCount
                  />
                  <MultiSelectDropdown
                    label="Exam Year"
                    options={allExamYears}
                    selectedOptions={filters.examYear}
                    onSelectionChange={(sel) => handleFilterChange('examYear', sel)}
                    placeholder="Select Years"
                    counts={filterCounts.examYear || {}}
                    hideZeroCount
                  />
                  <MultiSelectDropdown
                    label="Exam Shift"
                    options={allExamShifts}
                    selectedOptions={filters.examDateShift}
                    onSelectionChange={(sel) => handleFilterChange('examDateShift', sel)}
                    placeholder="Select Shifts"
                    counts={filterCounts.examDateShift || {}}
                    hideZeroCount
                  />
                </FilterGroup>

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
        <div className="fixed bottom-0 left-0 w-full z-[40] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 pb-safe md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
             {/* Quiz Name Input - Compact for footer */}
             <div className="w-full sm:w-64 flex-shrink-0">
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="Quiz Name (Optional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleClearFilters} className="flex-shrink-0 h-10 px-3">
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
                  onClick={handleCreate}
                  disabled={isStartingQuiz}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg px-6 flex items-center justify-center gap-2 font-semibold"
                >
                  {isStartingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Quiz ({filteredMetadata.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
