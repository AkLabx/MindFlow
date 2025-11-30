
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Save
} from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { fetchQuestionMetadata, fetchQuestionsByIds } from '../services/questionService';
import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { cn } from '../../../utils/cn';
import { useDependentFilters } from '../../../hooks/useDependentFilters';
import { useFilterCounts } from '../../../hooks/useFilterCounts';
import { db } from '../../../lib/db';
import { APP_CONFIG } from '../../../constants/config';
import { initialState } from '../stores/quizReducer';

// UI Components
import { FilterGroup } from './ui/FilterGroup';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';
import { SegmentedControl } from './ui/SegmentedControl';
import { QuickStartButtons } from './ui/QuickStartButtons';
import { ActiveFiltersBar } from './ui/ActiveFiltersBar';

interface QuizConfigProps {
  onStart: (questions: Question[], filters?: InitialFilters, mode?: QuizMode) => void;
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
  const [mode, setMode] = useState<QuizMode>('learning');
  const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
  const [quizName, setQuizName] = useState('');

  // State for Data Fetching
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showEmptyError, setShowEmptyError] = useState(false);

  // 0. Fetch Metadata on Mount
  const loadMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      setMetadata(data);

      if (data.length === 0) {
        console.warn("No questions fetched from database.");
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to load question bank. Please check your internet connection.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // 1. Build Classification Map
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

  // 2. Hooks Integration
  const { availableTopics, availableSubTopics } = useDependentFilters({
    selectedFilters: filters,
    setSelectedFilters: setFilters,
    classificationMap
  });

  const filterCounts = useFilterCounts({
    allQuestions: metadata,
    selectedFilters: filters
  });

  // 3. Derived Lists for Dropdowns
  const allSubjects = useMemo(() => Array.from(classificationMap.keys()).sort(), [classificationMap]);
  const allExamNames = useMemo(() => Array.from(new Set(metadata.map(q => q.sourceInfo.examName))).sort(), [metadata]);
  const allExamYears = useMemo(() => Array.from(new Set(metadata.map(q => String(q.sourceInfo.examYear)))).sort(), [metadata]);
  const allExamShifts = useMemo(() => Array.from(new Set(metadata.map(q => q.sourceInfo.examDateShift || ''))).filter(Boolean).sort(), [metadata]);
  const allTags = useMemo(() => Array.from(new Set(metadata.flatMap(q => q.tags))).sort(), [metadata]);

  // 4. Final Filtered Metadata Calculation
  const filteredMetadata = useMemo(() => {
    return metadata.filter(q => {
      if (filters.subject.length > 0 && !filters.subject.includes(q.classification.subject)) return false;
      if (filters.topic.length > 0 && !filters.topic.includes(q.classification.topic)) return false;
      if (filters.subTopic.length > 0 && !filters.subTopic.includes(q.classification.subTopic || '')) return false;
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(q.properties.difficulty)) return false;
      if (filters.questionType.length > 0 && !filters.questionType.includes(q.properties.questionType)) return false;
      if (filters.examName.length > 0 && !filters.examName.includes(q.sourceInfo.examName)) return false;
      if (filters.examYear.length > 0 && !filters.examYear.includes(String(q.sourceInfo.examYear))) return false;
      if (filters.examDateShift.length > 0 && !filters.examDateShift.includes(q.sourceInfo.examDateShift || '')) return false;
      if (filters.tags.length > 0 && !filters.tags.some(t => q.tags.includes(t))) return false;
      return true;
    });
  }, [filters, metadata]);

  // Clear error when filters change
  useEffect(() => {
    if (filteredMetadata.length > 0) {
      setShowEmptyError(false);
    }
  }, [filteredMetadata.length]);

  // --- Handlers ---

  const createQuizWithQuestions = async (questionSubset: Question[], activeFilters: InitialFilters) => {
    try {
      setIsStartingQuiz(true);
      const ids = questionSubset.map(q => q.id);

      const fullQuestions = await fetchQuestionsByIds(ids);

      const quizId = crypto.randomUUID();

      // Create SavedQuiz object
      const newQuiz: SavedQuiz = {
        id: quizId,
        name: quizName || `Quiz ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now(),
        filters: activeFilters,
        mode: mode,
        questions: fullQuestions,
        state: {
          ...initialState,
          status: 'quiz',
          mode: mode,
          activeQuestions: fullQuestions,
          filters: activeFilters,
          quizId: quizId,
          quizTimeRemaining: mode === 'mock'
            ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, fullQuestions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
            : 0,
          remainingTimes: mode === 'learning'
            ? fullQuestions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
            : {}
        }
      };

      await db.saveQuiz(newQuiz);
      navigate('/quiz/saved');

    } catch (err) {
      console.error("Failed to create quiz:", err);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleCreate = () => {
    if (filteredMetadata.length === 0) {
      setShowEmptyError(true);
      // Auto hide message after 4 seconds
      setTimeout(() => setShowEmptyError(false), 4000);
      return;
    }
    createQuizWithQuestions(filteredMetadata, filters);
  };

  const handleQuickStart = (type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => {
    let quickFilters = emptyFilters;
    if (type !== 'Mix') {
      quickFilters = { ...emptyFilters, difficulty: [type] };
    }

    const subset = type === 'Mix'
      ? metadata
      : metadata.filter(q => q.properties.difficulty === type);

    const shuffled = [...subset].sort(() => 0.5 - Math.random()).slice(0, 25);

    if (shuffled.length === 0) {
      alert(`No questions found for difficulty: ${type}`);
      return;
    }

    // For quick start, we can auto-generate a name
    const quickName = `Quick ${type} Quiz`;
    // We need to temporarily set the name or pass it? 
    // Since createQuizWithQuestions uses state quizName, we should probably pass it or set it.
    // But setState is async. Let's modify createQuizWithQuestions to accept name optionally.
    // For now, let's just let it fallback to default timestamp name if quizName is empty.
    createQuizWithQuestions(shuffled, quickFilters);
  };

  const handleFilterChange = (key: keyof InitialFilters, selected: string[]) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  };

  const removeFilter = (key: keyof InitialFilters, value?: string) => {
    if (value) {
      setFilters(prev => ({ ...prev, [key]: prev[key].filter(item => item !== value) }));
    } else {
      setFilters(prev => ({ ...prev, [key]: [] }));
    }
  };

  const handleSegmentToggle = (key: keyof InitialFilters, option: string) => {
    setFilters(prev => {
      const current = prev[key];
      const isSelected = current.includes(option);
      return {
        ...prev,
        [key]: isSelected ? current.filter(i => i !== option) : [...current, option]
      };
    });
  };

  // --- Loading State ---
  if (isLoadingMetadata) {
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 bg-white md:rounded-3xl w-full max-w-6xl mx-auto md:border border-gray-200 shadow-sm animate-fade-in p-8">
        <div className="relative">
          <div className="p-4 bg-indigo-50 rounded-full">
            <Database className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2 max-w-xs w-full">
          <h2 className="text-xl font-bold text-gray-800">Syncing Question Bank</h2>
          <p className="text-gray-500 text-sm">
            {progress.total > 0
              ? `Indexed ${progress.current.toLocaleString()} of ${progress.total.toLocaleString()} items`
              : 'Connecting to Database...'}
          </p>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-xs text-gray-400 font-medium text-right mt-1">{percentage}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-white md:rounded-3xl w-full max-w-6xl mx-auto md:border border-gray-200 shadow-sm p-8 text-center animate-fade-in">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Connection Error</h2>
        <p className="text-gray-500 max-w-md">{error}</p>
        <div className="flex gap-4 mt-4">
          <Button variant="outline" onClick={onBack}>Go Back</Button>
          <Button onClick={loadMetadata}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm border border-gray-200 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">

      {/* Overlay for "Starting Quiz" */}
      {isStartingQuiz && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-indigo-900">Creating Your Quiz</h3>
          <p className="text-gray-500">Saving questions to database...</p>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 cursor-pointer hover:text-indigo-600 w-fit" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">HOME</span>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-1">Create New Quiz</h1>
          <p className="text-sm md:text-base text-gray-500">Select from <span className="font-bold text-indigo-600">{metadata.length.toLocaleString()}</span> available questions.</p>
        </div>
      </div>

      {/* Scrollable Config Content */}
      <div className="p-6 space-y-6 bg-gray-50/50 flex-1 overflow-y-auto">

        {/* Mode Selection - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('learning')}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all border-2 group",
              mode === 'learning'
                ? "bg-white border-indigo-600 shadow-lg"
                : "bg-white border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
            )}
          >
            {mode === 'learning' && (
              <div className="absolute top-3 right-3 bg-indigo-600 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={cn(
              "p-3 rounded-full mb-3",
              mode === 'learning' ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
            )}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-gray-900">Learning Mode</div>
            <div className="text-xs text-gray-500 mt-1">Instant feedback & Explanations</div>
          </button>

          <button
            onClick={() => setMode('mock')}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all border-2 group",
              mode === 'mock'
                ? "bg-white border-indigo-600 shadow-lg"
                : "bg-white border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
            )}
          >
            {mode === 'mock' && (
              <div className="absolute top-3 right-3 bg-indigo-600 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={cn(
              "p-3 rounded-full mb-3",
              mode === 'mock' ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
            )}>
              <Timer className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-gray-900">Mock Mode</div>
            <div className="text-xs text-gray-500 mt-1">Exam Sim (30s/Q), No hints</div>
          </button>
        </div>

        {/* Quick Start Component */}
        <QuickStartButtons onQuickStart={handleQuickStart} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Column 1: Classification */}
          <FilterGroup title="Classification" icon={<Layers className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Subject"
              tooltip="Filter questions by broad academic discipline"
              options={allSubjects}
              selectedOptions={filters.subject}
              onSelectionChange={(sel) => handleFilterChange('subject', sel)}
              placeholder="Select Subjects"
              counts={filterCounts.subject}
            />
            <MultiSelectDropdown
              label="Topic"
              tooltip="Filter by specific topics within the selected subjects"
              options={availableTopics}
              selectedOptions={filters.topic}
              onSelectionChange={(sel) => handleFilterChange('topic', sel)}
              placeholder={availableTopics.length > 0 ? "Select Topics" : "Select Subject First"}
              disabled={availableTopics.length === 0}
              counts={filterCounts.topic}
            />
            <MultiSelectDropdown
              label="Sub-Topic"
              tooltip="Filter by granular sub-topics for precise practice"
              options={availableSubTopics}
              selectedOptions={filters.subTopic}
              onSelectionChange={(sel) => handleFilterChange('subTopic', sel)}
              placeholder={availableSubTopics.length > 0 ? "Select Sub-Topics" : "Select Topic First"}
              disabled={availableSubTopics.length === 0}
              counts={filterCounts.subTopic}
            />
          </FilterGroup>

          {/* Column 2: Properties */}
          <FilterGroup title="Properties" icon={<Settings className="w-5 h-5" />}>
            <SegmentedControl
              label="Difficulty"
              tooltip="Choose question complexity level"
              options={['Easy', 'Medium', 'Hard']}
              selectedOptions={filters.difficulty}
              onOptionToggle={(opt) => handleSegmentToggle('difficulty', opt)}
              counts={filterCounts.difficulty}
            />
            <SegmentedControl
              label="Question Type"
              tooltip="Filter by question format (e.g., Multiple Choice)"
              options={['MCQ']}
              selectedOptions={filters.questionType}
              onOptionToggle={(opt) => handleSegmentToggle('questionType', opt)}
              counts={filterCounts.questionType}
            />
          </FilterGroup>

          {/* Column 3: Source */}
          <FilterGroup title="Source" icon={<FileText className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Exam Name"
              tooltip="Filter by specific competitive exam source"
              options={allExamNames}
              selectedOptions={filters.examName}
              onSelectionChange={(sel) => handleFilterChange('examName', sel)}
              placeholder="Select Exams"
              counts={filterCounts.examName}
            />
            <MultiSelectDropdown
              label="Exam Year"
              tooltip="Filter questions by the year they appeared"
              options={allExamYears}
              selectedOptions={filters.examYear}
              onSelectionChange={(sel) => handleFilterChange('examYear', sel)}
              placeholder="Select Years"
              counts={filterCounts.examYear}
            />
            <MultiSelectDropdown
              label="Exam Shift"
              tooltip="Filter by specific exam date or shift"
              options={allExamShifts}
              selectedOptions={filters.examDateShift}
              onSelectionChange={(sel) => handleFilterChange('examDateShift', sel)}
              placeholder="Select Shifts"
              counts={filterCounts.examDateShift}
            />
          </FilterGroup>

          {/* Column 4: Tags */}
          <FilterGroup title="Tags" icon={<Tag className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Search Tags"
              tooltip="Filter using specific keywords or concepts"
              options={allTags}
              selectedOptions={filters.tags}
              onSelectionChange={(sel) => handleFilterChange('tags', sel)}
              placeholder="Filter by Tags"
              counts={filterCounts.tags}
            />
          </FilterGroup>
        </div>

        {/* Active Filters Component */}
        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4">
          {/* Quiz Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Name (Optional)</label>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g. Biology Mock Test 1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <Button variant="outline" onClick={() => setFilters(emptyFilters)} className="flex items-center gap-2 w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>

            <div className="relative w-full sm:w-auto">
              {showEmptyError && (
                <div className="absolute bottom-full mb-3 right-0 sm:left-auto sm:right-0 w-full sm:w-64 bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm border border-red-100 animate-in fade-in slide-in-from-bottom-2 text-center sm:text-right z-10">
                  No questions match your criteria. <br /> Please adjust filters.
                  <div className="absolute top-full right-8 sm:right-12 border-4 border-transparent border-t-red-100"></div>
                </div>
              )}
              <Button
                size="lg"
                onClick={handleCreate}
                disabled={isStartingQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 w-full sm:w-auto px-8 py-3 text-base flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isStartingQuiz ? 'Creating...' : `Create Quiz (${filteredMetadata.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
