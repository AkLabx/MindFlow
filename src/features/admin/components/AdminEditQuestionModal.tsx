import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Save,
  Loader2,
  Sparkles,
  Bot,
  Trash2,
  Plus,
  Eye,
  Code,
  FileText,
  Tag as TagIcon,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import DOMPurify from 'dompurify';
import { useUpdateQuestion } from '../hooks/useAdminUploadGK';
import { Question } from '../../quiz/types';
import { useQuizSessionStore } from '../../quiz/stores/useQuizSessionStore';
import { useNotification } from '../../../hooks/useNotification';
import { supabase } from '../../../lib/supabase';

interface AdminEditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
}

export interface AskAiExplanationData {
  correct_answer?: string;
  reasoning?: string;
  exam_facts?: string[];
  recent_news?: string;
  interesting_facts?: string[];
  fun_fact?: string;
}

export interface ExplanationData {
  summary?: string;
  analysis_correct?: string;
  analysis_incorrect?: string;
  key_takeaway?: string;
  fact?: string;
  conclusion?: string;
  [key: string]: any;
}

const purifyConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'span', 'sub', 'sup', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'blockquote'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
};

const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content || !content.trim()) {
    return <p className="text-gray-400 dark:text-gray-500 italic text-sm">No content provided.</p>;
  }
  return (
    <div className={`prose dark:prose-invert max-w-none prose-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {DOMPurify.sanitize(content, purifyConfig)}
      </ReactMarkdown>
    </div>
  );
};

export const AdminEditQuestionModal: React.FC<AdminEditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  // --- Navigation & State ---
  const [activeTab, setActiveTab] = useState<'content' | 'classification' | 'explanations'>('content');
  const [explanationSubTab, setExplanationSubTab] = useState<'static' | 'ai'>('static');
  const [explanationMode, setExplanationMode] = useState<'visual' | 'json' | 'preview'>('visual');
  const [aiMode, setAiMode] = useState<'visual' | 'json' | 'preview'>('visual');

  // --- Form Data Slices ---
  // Content Tab
  const [questionText, setQuestionText] = useState('');
  const [questionTextHi, setQuestionTextHi] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [optionsHi, setOptionsHi] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Classification Tab
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState('');
  const [examDateShift, setExamDateShift] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('MCQ');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [v1Id, setV1Id] = useState('');

  // Static Explanation
  const [staticExplanation, setStaticExplanation] = useState<ExplanationData>({});
  const [rawStaticJson, setRawStaticJson] = useState('');

  // AI Explanation
  const [aiExplanation, setAiExplanation] = useState<AskAiExplanationData | null>(null);
  const [rawAiJson, setRawAiJson] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Validation & Hooks
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const { mutate: editQuestion, isPending } = useUpdateQuestion();
  const hydrateQuestions = useQuizSessionStore((state) => state.hydrateQuestions);
  const { showToast } = useNotification();

  // --- Initialize Form Data when Question changes or Modal opens ---
  useEffect(() => {
    if (isOpen && question) {
      const qText = question.question || '';
      const qTextHi = question.question_hi || '';
      const qOptions = Array.isArray(question.options) ? [...question.options] : [];
      const qOptionsHi = Array.isArray(question.options_hi) ? [...question.options_hi] : [];
      const qCorrect = question.correct || (qOptions[0] || '');

      setQuestionText(qText);
      setQuestionTextHi(qTextHi);
      setOptions(qOptions.length > 0 ? qOptions : ['', '', '', '']);
      setOptionsHi(qOptionsHi);
      setCorrectAnswer(qCorrect);

      setSubject(question.subject || question.classification?.subject || '');
      setTopic(question.topic || question.classification?.topic || '');
      setSubTopic(question.subTopic || question.classification?.subTopic || '');
      setExamName(question.examName || question.sourceInfo?.examName || '');
      setExamYear(question.examYear ? String(question.examYear) : question.sourceInfo?.examYear ? String(question.sourceInfo.examYear) : '');
      setExamDateShift(question.examDateShift || question.sourceInfo?.examDateShift || '');
      setDifficulty(question.properties?.difficulty || 'Medium');
      setQuestionType(question.properties?.questionType || 'MCQ');
      setTags(Array.isArray(question.tags) ? [...question.tags] : []);
      setV1Id(question.v1_id || '');

      // Parse Static Explanation
      let parsedStatic: ExplanationData = {};
      const rawExp: any = question.explanation;
      if (rawExp && typeof rawExp === 'object' && !Array.isArray(rawExp)) {
        parsedStatic = { ...rawExp };
      } else if (typeof rawExp === 'string' && rawExp.trim() !== '') {
        try {
          parsedStatic = JSON.parse(rawExp);
        } catch {
          parsedStatic = { summary: rawExp };
        }
      }
      setStaticExplanation(parsedStatic);
      setRawStaticJson(JSON.stringify(parsedStatic, null, 2));

      // Parse AI Explanation (Check if truly non-empty object)
      const rawAi = question.ask_ai_explanation;
      const isAiValid = rawAi && typeof rawAi === 'object' && !Array.isArray(rawAi) && Object.keys(rawAi).length > 0;
      if (isAiValid) {
        setAiExplanation(rawAi);
        setRawAiJson(JSON.stringify(rawAi, null, 2));
      } else {
        setAiExplanation(null);
        setRawAiJson('');
      }

      setValidationErrors({});
      setActiveTab('content');
      setExplanationSubTab('static');
      setExplanationMode('visual');
      setAiMode('visual');

      // Snapshot for unsaved changes detection
      const snap = JSON.stringify({
        qText,
        qCorrect,
        qOptions,
        subject: question.subject || '',
        parsedStatic,
        isAiValid: isAiValid ? rawAi : null
      });
      setInitialSnapshot(snap);
    }
  }, [isOpen, question]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, questionText, correctAnswer, options]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  // --- Content Tab Handlers ---
  const handleOptionChange = (index: number, value: string) => {
    const prevVal = options[index];
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // If the changed option was the marked correct answer, keep correct answer synced
    if (correctAnswer === prevVal) {
      setCorrectAnswer(value);
    }
    if (validationErrors.options || validationErrors.correct) {
      setValidationErrors((prev) => ({ ...prev, options: '', correct: '' }));
    }
  };

  const handleOptionHiChange = (index: number, value: string) => {
    const newOptionsHi = [...optionsHi];
    newOptionsHi[index] = value;
    setOptionsHi(newOptionsHi);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
      if (optionsHi.length > 0) {
        setOptionsHi([...optionsHi, '']);
      }
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      showToast({ variant: 'error', message: 'A multiple-choice question must have at least 2 options.', duration: 2500 });
      return;
    }
    const removedVal = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    const newOptionsHi = optionsHi.filter((_, i) => i !== index);
    setOptions(newOptions);
    setOptionsHi(newOptionsHi);

    if (correctAnswer === removedVal) {
      setCorrectAnswer(newOptions[0] || '');
    }
  };

  // --- Classification Handlers ---
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // --- AI Explanation Actions ---
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      showToast({ variant: 'info', message: 'Connecting to AI Tutor service...', duration: 2000 });
      const { data, error } = await supabase.functions.invoke('ask-ai-tutor', {
        body: {
          questionId: question.id,
          locale: 'en'
        }
      });

      if (error) throw error;
      if (!data) throw new Error('AI service returned an empty response.');

      const newAiData: AskAiExplanationData = {
        correct_answer: data.correct_answer || correctAnswer || '',
        reasoning: data.reasoning || '',
        exam_facts: Array.isArray(data.exam_facts) ? data.exam_facts : [],
        recent_news: data.recent_news || '',
        interesting_facts: Array.isArray(data.interesting_facts) ? data.interesting_facts : [],
        fun_fact: data.fun_fact || '',
      };

      setAiExplanation(newAiData);
      setRawAiJson(JSON.stringify(newAiData, null, 2));
      setAiMode('visual');
      showToast({ variant: 'success', message: 'AI explanation successfully generated!', duration: 2500 });
    } catch (err: any) {
      showToast({ variant: 'error', message: `Generation failed: ${err.message || 'Unknown error'}`, duration: 4000 });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleClearAiCache = () => {
    if (window.confirm("Are you sure you want to clear the cached AI explanation? Click 'Save Changes' to permanently purge the cache in the database.")) {
      setAiExplanation(null);
      setRawAiJson('');
      showToast({ variant: 'info', message: 'AI explanation cleared. Save changes to commit null to database.', duration: 3000 });
    }
  };

  const handleAddExamFact = () => {
    const currentFacts = aiExplanation?.exam_facts || [];
    setAiExplanation({
      ...aiExplanation,
      exam_facts: [...currentFacts, '']
    });
  };

  const handleUpdateExamFact = (index: number, val: string) => {
    const currentFacts = [...(aiExplanation?.exam_facts || [])];
    currentFacts[index] = val;
    setAiExplanation({
      ...aiExplanation,
      exam_facts: currentFacts
    });
  };

  const handleRemoveExamFact = (index: number) => {
    const currentFacts = (aiExplanation?.exam_facts || []).filter((_, i) => i !== index);
    setAiExplanation({
      ...aiExplanation,
      exam_facts: currentFacts
    });
  };

  const handleAddInterestingFact = () => {
    const currentFacts = aiExplanation?.interesting_facts || [];
    setAiExplanation({
      ...aiExplanation,
      interesting_facts: [...currentFacts, '']
    });
  };

  const handleUpdateInterestingFact = (index: number, val: string) => {
    const currentFacts = [...(aiExplanation?.interesting_facts || [])];
    currentFacts[index] = val;
    setAiExplanation({
      ...aiExplanation,
      interesting_facts: currentFacts
    });
  };

  const handleRemoveInterestingFact = (index: number) => {
    const currentFacts = (aiExplanation?.interesting_facts || []).filter((_, i) => i !== index);
    setAiExplanation({
      ...aiExplanation,
      interesting_facts: currentFacts
    });
  };

  // --- Save / Mutation Pipeline ---
  const handleSave = () => {
    const errors: Record<string, string> = {};

    // 1. Validate Question Text
    if (!questionText.trim()) {
      errors.question = 'Question text cannot be empty.';
    }

    // 2. Validate Options
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      errors.options = 'Multiple-choice questions must have at least 2 non-empty options.';
    }

    // 3. Validate Correct Answer
    if (!cleanOptions.includes(correctAnswer.trim())) {
      errors.correct = 'The correct answer must be identical to one of the provided options.';
    }

    // 4. Validate Exam Year
    let parsedYear: number | null = null;
    if (examYear.trim()) {
      parsedYear = parseInt(examYear.trim(), 10);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        errors.examYear = 'Exam year must be a valid 4-digit year (e.g. 2024).';
      }
    }

    // 5. Validate Static Explanation
    let finalStaticExplanation: ExplanationData = {};
    if (explanationMode === 'json') {
      if (rawStaticJson.trim()) {
        try {
          const parsed = JSON.parse(rawStaticJson);
          if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
            errors.explanation = 'Static explanation JSON must be a valid object.';
          } else {
            finalStaticExplanation = parsed;
          }
        } catch (e: any) {
          errors.explanation = `Invalid Static JSON: ${e.message}`;
        }
      }
    } else {
      finalStaticExplanation = {
        ...staticExplanation
      };
    }

    // 6. Validate & Normalize AI Explanation (CRITICAL FIX FOR CACHE POISONING)
    let finalAiExplanation: AskAiExplanationData | null = null;
    if (aiMode === 'json') {
      if (rawAiJson.trim() && rawAiJson.trim() !== '{}') {
        try {
          const parsed = JSON.parse(rawAiJson);
          if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
            errors.ask_ai_explanation = 'AI explanation JSON must be a valid object.';
          } else if (Object.keys(parsed).length > 0) {
            finalAiExplanation = parsed;
          }
        } catch (e: any) {
          errors.ask_ai_explanation = `Invalid AI JSON: ${e.message}`;
        }
      }
    } else if (aiExplanation) {
      const cleanExamFacts = (aiExplanation.exam_facts || []).map((f) => f.trim()).filter(Boolean);
      const cleanInterestingFacts = (aiExplanation.interesting_facts || []).map((f) => f.trim()).filter(Boolean);

      const hasContent = Boolean(
        aiExplanation.reasoning?.trim() ||
        cleanExamFacts.length > 0 ||
        aiExplanation.recent_news?.trim() ||
        cleanInterestingFacts.length > 0 ||
        aiExplanation.fun_fact?.trim()
      );

      if (hasContent) {
        finalAiExplanation = {
          correct_answer: aiExplanation.correct_answer?.trim() || correctAnswer.trim(),
          reasoning: aiExplanation.reasoning || '',
          exam_facts: cleanExamFacts,
          recent_news: aiExplanation.recent_news?.trim() || '',
          interesting_facts: cleanInterestingFacts,
          fun_fact: aiExplanation.fun_fact?.trim() || '',
        };
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Switch to the tab containing the error
      if (errors.question || errors.options || errors.correct) {
        setActiveTab('content');
      } else if (errors.examYear) {
        setActiveTab('classification');
      } else if (errors.explanation || errors.ask_ai_explanation) {
        setActiveTab('explanations');
      }
      return;
    }

    // Construct Payload
    const payload = {
      id: question.id,
      v1_id: v1Id.trim() || null,
      question: questionText.trim(),
      question_hi: questionTextHi.trim() || null,
      options: options.map((o) => o.trim()),
      options_hi: optionsHi.length > 0 ? optionsHi.map((o) => o.trim()) : null,
      correct: correctAnswer.trim(),
      subject: subject.trim(),
      topic: topic.trim() || null,
      subTopic: subTopic.trim() || null,
      examName: examName.trim() || null,
      examYear: parsedYear,
      examDateShift: examDateShift.trim() || null,
      difficulty,
      questionType,
      tags,
      explanation: finalStaticExplanation,
      ask_ai_explanation: finalAiExplanation, // Explicitly NULL when empty, never {}
    };

    editQuestion(payload, {
      onSuccess: () => {
        // Construct updated question for local Zustand store hydration
        const updatedQuestion: Question = {
          ...question,
          ...payload,
          properties: {
            ...question.properties,
            difficulty,
            questionType,
          },
          sourceInfo: {
            ...question.sourceInfo,
            examName: payload.examName || undefined,
            examYear: payload.examYear || undefined,
            examDateShift: payload.examDateShift || undefined,
          },
          classification: {
            ...question.classification,
            subject: payload.subject,
            topic: payload.topic || undefined,
            subTopic: payload.subTopic || undefined,
          },
        };

        hydrateQuestions([updatedQuestion]);
        showToast({ variant: 'success', message: 'Question updated successfully.', duration: 2500 });
        onClose();
      },
      onError: (err: any) => {
        showToast({ variant: 'error', message: `Database update failed: ${err.message}`, duration: 3500 });
      }
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-edit-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-sm">
              ✏️
            </div>
            <div>
              <h2 id="admin-edit-title" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Edit Question Command Center
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>ID: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{question.id.slice(0, 8)}...</code></span>
                {v1Id && (
                  <span>• v1: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{v1Id}</code></span>
                )}
                <span>• {subject || 'Unassigned'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Content & Options
            {validationErrors.question || validationErrors.options || validationErrors.correct ? (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('classification')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'classification'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <TagIcon className="w-4 h-4" />
            Exam & Classification
            {validationErrors.examYear ? (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explanations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'explanations'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Explanations & AI Tutor
            {aiExplanation ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                AI Active
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Static Only
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">

          {/* ============================================================== */}
          {/* TAB 1: CONTENT & OPTIONS                                        */}
          {/* ============================================================== */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Question Text (English) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Question Statement (English) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400 font-mono">{questionText.length} chars</span>
                </div>
                <textarea
                  value={questionText}
                  onChange={(e) => {
                    setQuestionText(e.target.value);
                    if (validationErrors.question) setValidationErrors((prev) => ({ ...prev, question: '' }));
                  }}
                  rows={3}
                  className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border ${
                    validationErrors.question ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500'
                  } rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-all`}
                  placeholder="Enter the question text in English..."
                />
                {validationErrors.question && (
                  <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.question}
                  </p>
                )}
              </div>

              {/* Question Text (Hindi) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Question Statement (Hindi) <span className="text-xs font-normal text-gray-400">(Optional)</span>
                  </label>
                </div>
                <textarea
                  value={questionTextHi}
                  onChange={(e) => setQuestionTextHi(e.target.value)}
                  rows={2}
                  dir="auto"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-all"
                  placeholder="हिंदी में प्रश्न दर्ज करें..."
                />
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Answer Options & Correct Key <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click the radio button or &quot;Mark Correct&quot; to assign the answer key.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={options.length >= 6}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                </div>

                {validationErrors.options && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationErrors.options}</span>
                  </div>
                )}

                {validationErrors.correct && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationErrors.correct}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {options.map((opt, idx) => {
                    const isSelected = correctAnswer.trim() === opt.trim() && opt.trim() !== '';
                    const optLabel = String.fromCharCode(65 + idx);

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Option Alphabet Badge */}
                          <div
                            className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {optLabel}
                          </div>

                          {/* Option English Input */}
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`Option ${optLabel} (English)`}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {optionsHi.length > 0 && (
                              <input
                                type="text"
                                value={optionsHi[idx] || ''}
                                onChange={(e) => handleOptionHiChange(idx, e.target.value)}
                                placeholder={`Option ${optLabel} (Hindi)`}
                                dir="auto"
                                className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            )}
                          </div>

                          {/* Correct Radio Selector Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectAnswer(opt);
                              if (validationErrors.correct) setValidationErrors((prev) => ({ ...prev, correct: '' }));
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-gray-100 hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-gray-300 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                            <span>{isSelected ? 'Correct Key' : 'Mark Correct'}</span>
                          </button>

                          {/* Remove Option Button */}
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Delete option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EXAM & CLASSIFICATION                                   */}
          {/* ============================================================== */}
          {activeTab === 'classification' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Subject, Topic, SubTopic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. General Science"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Biology"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Subtopic
                  </label>
                  <input
                    type="text"
                    value={subTopic}
                    onChange={(e) => setSubTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Cell Structure"
                  />
                </div>
              </div>

              {/* Exam Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Exam Name
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. SSC CGL"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Exam Year
                  </label>
                  <input
                    type="number"
                    value={examYear}
                    onChange={(e) => {
                      setExamYear(e.target.value);
                      if (validationErrors.examYear) setValidationErrors((prev) => ({ ...prev, examYear: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${
                      validationErrors.examYear ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                    placeholder="e.g. 2024"
                  />
                  {validationErrors.examYear && (
                    <p className="text-red-500 text-xs">{validationErrors.examYear}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Date & Shift
                  </label>
                  <input
                    type="text"
                    value={examDateShift}
                    onChange={(e) => setExamDateShift(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 12 Sep 2024 (Shift 1)"
                  />
                </div>
              </div>

              {/* Difficulty & Question Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map((lvl) => {
                      const isSelected = difficulty === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                            isSelected
                              ? lvl === 'Easy'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : lvl === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Question Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Search & Metadata Tags
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[50px] items-center">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 shadow-2xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="bg-transparent text-xs text-gray-900 dark:text-white outline-none w-full"
                    />
                    {newTagInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-medium"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: EXPLANATIONS & AI TUTOR                                 */}
          {/* ============================================================== */}
          {activeTab === 'explanations' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Sub-tab selection: Static vs AI */}
              <div className="flex items-center justify-between p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setExplanationSubTab('static')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      explanationSubTab === 'static'
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Standard Explanation (Static)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExplanationSubTab('ai')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      explanationSubTab === 'ai'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ask AI Tutor Cache (Server-Side)
                  </button>
                </div>

                {/* Mode Selector for Active Subtab */}
                <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  {(['visual', 'preview', 'json'] as const).map((mode) => {
                    const currentMode = explanationSubTab === 'static' ? explanationMode : aiMode;
                    const setMode = explanationSubTab === 'static' ? setExplanationMode : setAiMode;
                    const isSelected = currentMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setMode(mode)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all capitalize ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        {mode === 'visual' && <FileText className="w-3 h-3" />}
                        {mode === 'preview' && <Eye className="w-3 h-3" />}
                        {mode === 'json' && <Code className="w-3 h-3" />}
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* SUB-SECTION A: STATIC EXPLANATION                          */}
              {/* ---------------------------------------------------------- */}
              {explanationSubTab === 'static' && (
                <div className="space-y-4">
                  {explanationMode === 'visual' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          Summary / Concept Overview (Markdown + Math)
                        </label>
                        <textarea
                          value={staticExplanation.summary || ''}
                          onChange={(e) => setStaticExplanation({ ...staticExplanation, summary: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="High-level overview of the concept..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Analysis of Correct Option (Markdown)
                        </label>
                        <textarea
                          value={staticExplanation.analysis_correct || ''}
                          onChange={(e) => setStaticExplanation({ ...staticExplanation, analysis_correct: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Detailed breakdown explaining why the correct choice is true..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                          Analysis of Incorrect Options (Optional)
                        </label>
                        <textarea
                          value={staticExplanation.analysis_incorrect || ''}
                          onChange={(e) => setStaticExplanation({ ...staticExplanation, analysis_incorrect: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Why the alternative options are false..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                          Key Takeaway / Exam Fact (Optional)
                        </label>
                        <input
                          type="text"
                          value={staticExplanation.key_takeaway || staticExplanation.fact || ''}
                          onChange={(e) => setStaticExplanation({ ...staticExplanation, key_takeaway: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="One-line golden rule to remember for exams..."
                        />
                      </div>
                    </div>
                  )}

                  {explanationMode === 'preview' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Student Preview (Static Explanation)</h4>
                      {staticExplanation.summary && (
                        <div>
                          <h5 className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Concept Summary</h5>
                          <MarkdownRenderer content={staticExplanation.summary} />
                        </div>
                      )}
                      {staticExplanation.analysis_correct && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                          <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1">Correct Answer Analysis</h5>
                          <MarkdownRenderer content={staticExplanation.analysis_correct} />
                        </div>
                      )}
                      {staticExplanation.analysis_incorrect && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                          <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Incorrect Options Analysis</h5>
                          <MarkdownRenderer content={staticExplanation.analysis_incorrect} />
                        </div>
                      )}
                    </div>
                  )}

                  {explanationMode === 'json' && (
                    <div className="space-y-2">
                      <textarea
                        value={rawStaticJson}
                        onChange={(e) => setRawStaticJson(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* SUB-SECTION B: ASK AI TUTOR (CACHE + GENERATION)           */}
              {/* ---------------------------------------------------------- */}
              {explanationSubTab === 'ai' && (
                <div className="space-y-5">
                  {/* AI Status Banner & Action Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">Ask AI Tutor Status:</span>
                          {aiExplanation ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cached in Database
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Not Cached (Clean Null)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          When cached, students receive 0ms instant responses without querying Gemini.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isGeneratingAi ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Querying Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{aiExplanation ? 'Re-Generate AI' : 'Generate with AI'}</span>
                          </>
                        )}
                      </button>

                      {aiExplanation && (
                        <button
                          type="button"
                          onClick={handleClearAiCache}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors"
                          title="Purge cache and revert to clean NULL"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Cache</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Mode for AI */}
                  {aiMode === 'visual' && (
                    <div className="space-y-4">
                      {!aiExplanation ? (
                        <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-3">
                          <Bot className="w-10 h-10 text-gray-400 mx-auto" />
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            No AI Explanation Cached Yet
                          </h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            Click &quot;Generate with AI&quot; above to let the multi-stage Gemini grounding pipeline draft a complete, verified explanation with PYQ facts, or create one manually below.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAiExplanation({
                                correct_answer: correctAnswer || '',
                                reasoning: '',
                                exam_facts: [''],
                                recent_news: '',
                                interesting_facts: [''],
                                fun_fact: '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create Explanation Manually
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 1. Correct Answer Field */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              Correct Answer Title
                            </label>
                            <input
                              type="text"
                              value={aiExplanation.correct_answer || ''}
                              onChange={(e) => setAiExplanation({ ...aiExplanation, correct_answer: e.target.value })}
                              className="w-full px-3 py-2 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Matches the correct option statement..."
                            />
                          </div>

                          {/* 2. Reasoning */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                Comprehensive Analysis & Reasoning (Markdown + KaTeX)
                              </label>
                              <span className="text-[11px] text-gray-400 font-mono">Supports LaTeX math ($x^2$)</span>
                            </div>
                            <textarea
                              value={aiExplanation.reasoning || ''}
                              onChange={(e) => setAiExplanation({ ...aiExplanation, reasoning: e.target.value })}
                              rows={5}
                              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                              placeholder="Detailed multi-paragraph breakdown of principles, facts, and option eliminations..."
                            />
                          </div>

                          {/* 3. Exam Special Facts (PYQs) */}
                          <div className="space-y-2 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                <span>📚</span> Exam Special Facts (PYQ Points)
                              </label>
                              <button
                                type="button"
                                onClick={handleAddExamFact}
                                className="px-2 py-0.5 text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md transition-colors"
                              >
                                + Add Point
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(aiExplanation.exam_facts || []).map((fact, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-blue-500">✓</span>
                                  <input
                                    type="text"
                                    value={fact}
                                    onChange={(e) => handleUpdateExamFact(fIdx, e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="e.g. Asked in SSC CGL 2022 Tier-1 (Shift 2)..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExamFact(fIdx)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {(!aiExplanation.exam_facts || aiExplanation.exam_facts.length === 0) && (
                                <p className="text-xs text-gray-400 italic">No PYQ points added yet.</p>
                              )}
                            </div>
                          </div>

                          {/* 4. Recent News */}
                          <div className="space-y-1 p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl">
                            <label className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                              <span>📰</span> Recent News & Current Affairs Context
                            </label>
                            <textarea
                              value={aiExplanation.recent_news || ''}
                              onChange={(e) => setAiExplanation({ ...aiExplanation, recent_news: e.target.value })}
                              rows={2}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500"
                              placeholder="Any current developments related to this topic..."
                            />
                          </div>

                          {/* 5. Interesting Facts */}
                          <div className="space-y-2 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <span>💡</span> Did You Know? (Interesting Trivia)
                              </label>
                              <button
                                type="button"
                                onClick={handleAddInterestingFact}
                                className="px-2 py-0.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-md transition-colors"
                              >
                                + Add Trivia
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(aiExplanation.interesting_facts || []).map((fact, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <input
                                    type="text"
                                    value={fact}
                                    onChange={(e) => handleUpdateInterestingFact(idx, e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="Fascinating memory aid or historical trivia..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInterestingFact(idx)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Student Live Preview for AI */}
                  {aiMode === 'preview' && (
                    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner space-y-5">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          <Sparkles className="w-4 h-4" /> Live Student View (AiExplanationModal)
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">1:1 Exact Render</span>
                      </div>

                      {aiExplanation?.correct_answer && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <span>✅</span> Correct Answer
                          </h4>
                          <div className="text-emerald-950 dark:text-emerald-100 font-bold text-base">
                            {aiExplanation.correct_answer}
                          </div>
                        </div>
                      )}

                      {aiExplanation?.reasoning && (
                        <div>
                          <h4 className="text-xs uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold mb-2 flex items-center gap-1.5">
                            <span>🧠</span> Analysis & Reasoning
                          </h4>
                          <div className="text-gray-800 dark:text-gray-100 leading-relaxed text-sm">
                            <MarkdownRenderer content={aiExplanation.reasoning} />
                          </div>
                        </div>
                      )}

                      {aiExplanation?.exam_facts && aiExplanation.exam_facts.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                          <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                            <span>📚</span> Exam Special Facts (PYQs)
                          </h4>
                          <ul className="space-y-1.5 list-none pl-0">
                            {aiExplanation.exam_facts.map((fact, i) => (
                              <li key={i} className="text-blue-900 dark:text-blue-100 text-xs flex gap-2 items-start">
                                <span className="text-blue-500 font-bold">✓</span>
                                <span className="flex-1">{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiExplanation?.recent_news && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800/30">
                          <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                            <span>📰</span> Recent News & Updates
                          </h4>
                          <p className="text-rose-900 dark:text-rose-100 text-xs leading-relaxed">
                            {aiExplanation.recent_news}
                          </p>
                        </div>
                      )}

                      {aiExplanation?.interesting_facts && aiExplanation.interesting_facts.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                            <span>💡</span> Did You Know?
                          </h4>
                          <ul className="space-y-1.5 list-none pl-0">
                            {aiExplanation.interesting_facts.map((fact, i) => (
                              <li key={i} className="text-amber-900 dark:text-amber-100 text-xs flex gap-2 items-start">
                                <span className="text-amber-500 font-bold">•</span>
                                <span className="flex-1">{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* JSON Mode for AI */}
                  {aiMode === 'json' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Raw JSON Editor (Leave empty to save as NULL)</span>
                        <span className="font-mono text-[10px]">Contract: correct_answer, reasoning, exam_facts, recent_news</span>
                      </div>
                      <textarea
                        value={rawAiJson}
                        onChange={(e) => setRawAiJson(e.target.value)}
                        rows={10}
                        placeholder='{\n  "correct_answer": "...",\n  "reasoning": "...",\n  "exam_facts": ["..."]\n}'
                        className="w-full px-3 py-2 bg-gray-900 text-indigo-400 font-mono text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {activeTab === 'content' && 'Step 1 of 3: Core Statement & Key'}
              {activeTab === 'classification' && 'Step 2 of 3: Exam Metadata'}
              {activeTab === 'explanations' && 'Step 3 of 3: Explanations & AI'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
