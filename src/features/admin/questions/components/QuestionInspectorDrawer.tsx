import React, { useId, useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  HelpCircle,
  Copy,
  Check,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  QuestionRecord,
  saveQuestion,
  softDeleteQuestion,
} from '../services/adminQuestionsService';
import { useNotification } from '@/stores/useNotificationStore';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  BilingualMode,
  BilingualModeToggle,
  QuestionBilingualPreview,
  normalizeQuestionOptions,
  parseQuestionExplanation,
} from './QuestionBilingualPreview';

interface QuestionInspectorDrawerProps {
  question: QuestionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion?: QuestionRecord) => void;
  availableSubjects?: string[];
  initialEditMode?: boolean;
}

interface EditableQuestionState {
  subject: string;
  difficulty: string;
  question: string;
  question_hi: string;
  options: string[];
  options_hi: string[];
  correct: string;
  explanationMode: 'visual' | 'json';
  explanationFields: {
    fact: string;
    summary: string;
    analysis_correct: string;
    analysis_incorrect: string;
    conclusion: string;
  };
  explanationJson: string;
}

const buildEditableState = (question: QuestionRecord): EditableQuestionState => {
  const normalizedOpts = normalizeQuestionOptions(question.options, question.options_hi);
  const enOptions =
    normalizedOpts.length > 0 ? normalizedOpts.map((o) => o.enText) : ['', '', '', ''];
  const hiOptions =
    normalizedOpts.length > 0 ? normalizedOpts.map((o) => o.hiText || '') : ['', '', '', ''];
  const parsedExpl = parseQuestionExplanation(question.explanation);

  return {
    subject: question.subject || 'General',
    difficulty: question.difficulty || 'Medium',
    question: question.question || '',
    question_hi: question.question_hi || '',
    options: enOptions,
    options_hi: hiOptions,
    correct: question.correct || '',
    explanationMode: 'visual',
    explanationFields: {
      fact: String(parsedExpl.fact ?? ''),
      summary: String(parsedExpl.summary ?? ''),
      analysis_correct: String(parsedExpl.analysis_correct ?? ''),
      analysis_incorrect: String(parsedExpl.analysis_incorrect ?? ''),
      conclusion: String(parsedExpl.conclusion ?? ''),
    },
    explanationJson: JSON.stringify(parsedExpl, null, 2),
  };
};

export const QuestionInspectorDrawer: React.FC<QuestionInspectorDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
  availableSubjects = [],
  initialEditMode = false,
}) => {
  const titleId = useId();
  const { showToast } = useNotification();

  const [isEditing, setIsEditing] = useState(Boolean(initialEditMode));
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [bilingualMode, setBilingualMode] = useState<BilingualMode>('both');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [formState, setFormState] = useState<EditableQuestionState | null>(null);
  const initialSnapshotRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (question && isOpen) {
      const next = buildEditableState(question);
      setFormState(next);
      initialSnapshotRef.current = JSON.stringify(next);
      setIsEditing(Boolean(initialEditMode));
      setShowDeleteConfirm(false);
      setShowDiscardConfirm(false);
    }
  }, [question, isOpen, initialEditMode]);

  const isDirty = useMemo(() => {
    if (!isEditing || !formState) return false;
    return JSON.stringify(formState) !== initialSnapshotRef.current;
  }, [isEditing, formState]);

  const subjectChoices = useMemo(() => {
    const set = new Set<string>(availableSubjects.filter(Boolean));
    if (question?.subject) set.add(question.subject);
    if (formState?.subject) set.add(formState.subject);
    ['History', 'Geography', 'Polity', 'Economics', 'General Science', 'Current Affairs'].forEach(
      (s) => set.add(s)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableSubjects, question?.subject, formState?.subject]);

  if (!question || !formState) return null;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(question.id);
      if (isMountedRef.current) {
        setCopiedId(true);
        setTimeout(() => {
          if (isMountedRef.current) setCopiedId(false);
        }, 2000);
      }
    } catch {
      showToast({
        title: 'Copy Failed',
        message: 'Could not copy question UUID to clipboard.',
        variant: 'error',
      });
    }
  };

  const handleRequestClose = () => {
    if (isSaving) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const handleCancelEdit = () => {
    const reset = buildEditableState(question);
    setFormState(reset);
    initialSnapshotRef.current = JSON.stringify(reset);
    setIsEditing(false);
  };

  const handleExplanationModeChange = (nextMode: 'visual' | 'json') => {
    if (nextMode === formState.explanationMode) return;
    if (nextMode === 'json') {
      const existingBase = parseQuestionExplanation(question.explanation);
      const merged = {
        ...existingBase,
        ...(formState.explanationFields.fact.trim()
          ? { fact: formState.explanationFields.fact.trim() }
          : { fact: undefined }),
        ...(formState.explanationFields.summary.trim()
          ? { summary: formState.explanationFields.summary.trim() }
          : { summary: undefined }),
        ...(formState.explanationFields.analysis_correct.trim()
          ? { analysis_correct: formState.explanationFields.analysis_correct.trim() }
          : { analysis_correct: undefined }),
        ...(formState.explanationFields.analysis_incorrect.trim()
          ? { analysis_incorrect: formState.explanationFields.analysis_incorrect.trim() }
          : { analysis_incorrect: undefined }),
        ...(formState.explanationFields.conclusion.trim()
          ? { conclusion: formState.explanationFields.conclusion.trim() }
          : { conclusion: undefined }),
      };
      const cleaned = Object.fromEntries(
        Object.entries(merged).filter(([, val]) => val !== undefined && val !== '')
      );
      setFormState({
        ...formState,
        explanationMode: 'json',
        explanationJson: JSON.stringify(cleaned, null, 2),
      });
      return;
    }

    try {
      const parsed = formState.explanationJson.trim()
        ? JSON.parse(formState.explanationJson)
        : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Explanation JSON must be an object.');
      }
      setFormState({
        ...formState,
        explanationMode: 'visual',
        explanationFields: {
          fact: String(parsed.fact ?? ''),
          summary: String(parsed.summary ?? ''),
          analysis_correct: String(parsed.analysis_correct ?? ''),
          analysis_incorrect: String(parsed.analysis_incorrect ?? ''),
          conclusion: String(parsed.conclusion ?? ''),
        },
      });
    } catch (err: any) {
      showToast({
        title: 'Invalid Explanation JSON',
        message: err?.message || 'Fix the JSON syntax before switching back to Visual mode.',
        variant: 'error',
      });
    }
  };

  const handleSave = async () => {
    if (!formState.question.trim()) {
      showToast({
        title: 'Question Required',
        message: 'English question statement cannot be empty.',
        variant: 'error',
      });
      return;
    }

    let nextExplanation: Record<string, any> = {};
    if (formState.explanationMode === 'json') {
      try {
        const parsed = formState.explanationJson.trim()
          ? JSON.parse(formState.explanationJson)
          : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Explanation JSON must be a valid object.');
        }
        nextExplanation = parsed;
      } catch (err: any) {
        showToast({
          title: 'Invalid Explanation JSON',
          message: err?.message || 'Please fix the explanation JSON syntax before saving.',
          variant: 'error',
        });
        return;
      }
    } else {
      const base = parseQuestionExplanation(question.explanation);
      const next: Record<string, any> = { ...base };
      const keys = [
        'fact',
        'summary',
        'analysis_correct',
        'analysis_incorrect',
        'conclusion',
      ] as const;
      for (const k of keys) {
        const trimmedVal = formState.explanationFields[k].trim();
        if (trimmedVal) next[k] = trimmedVal;
        else delete next[k];
      }
      nextExplanation = next;
    }

    const cleanEnOptions = formState.options.map((o) => o.trim()).filter(Boolean);
    const cleanHiOptions = formState.options_hi
      .slice(0, formState.options.length)
      .map((o) => o.trim());
    const hasHindiOpts = cleanHiOptions.some(Boolean);

    setIsSaving(true);
    try {
      const updatedRecord = await saveQuestion({
        id: question.id,
        subject: formState.subject.trim() || question.subject,
        difficulty: formState.difficulty,
        question: formState.question.trim(),
        question_hi: formState.question_hi.trim() || undefined,
        options: cleanEnOptions,
        options_hi: hasHindiOpts ? cleanHiOptions : undefined,
        correct: formState.correct.trim(),
        explanation: nextExplanation,
      });

      if (!isMountedRef.current) return;
      showToast({
        title: 'Question Saved',
        message: 'Question updated and downstream caches synced.',
        variant: 'success',
      });
      setIsEditing(false);
      onQuestionUpdated(updatedRecord);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      showToast({
        title: 'Save Failed',
        message: err?.message || 'Could not save question.',
        variant: 'error',
      });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const confirmSoftDelete = async () => {
    setIsSaving(true);
    try {
      await softDeleteQuestion(question.id);
      if (!isMountedRef.current) return;
      setShowDeleteConfirm(false);
      showToast({
        title: 'Question Deleted',
        message: 'Question soft-deleted and removed from downstream caches.',
        variant: 'success',
      });
      onClose();
      onQuestionUpdated();
    } catch (err: any) {
      if (!isMountedRef.current) return;
      showToast({
        title: 'Delete Failed',
        message: err?.message || 'Could not delete question.',
        variant: 'error',
      });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const updateOptionAt = (idx: number, lang: 'en' | 'hi', value: string) => {
    if (lang === 'en') {
      const prevOpt = formState.options[idx] ?? '';
      const nextOpts = [...formState.options];
      nextOpts[idx] = value;
      const shouldSyncCorrect =
        formState.correct.trim() !== '' && formState.correct.trim() === prevOpt.trim();
      setFormState({
        ...formState,
        options: nextOpts,
        correct: shouldSyncCorrect ? value : formState.correct,
      });
    } else {
      const nextHi = [...formState.options_hi];
      while (nextHi.length < formState.options.length) nextHi.push('');
      nextHi[idx] = value;
      setFormState({ ...formState, options_hi: nextHi });
    }
  };

  const addOptionRow = () => {
    if (formState.options.length >= 6) return;
    setFormState({
      ...formState,
      options: [...formState.options, ''],
      options_hi: [...formState.options_hi, ''],
    });
  };

  const removeOptionRow = (idx: number) => {
    if (formState.options.length <= 2) return;
    const removedVal = formState.options[idx]?.trim() ?? '';
    const nextEn = formState.options.filter((_, i) => i !== idx);
    const nextHi = formState.options_hi.filter((_, i) => i !== idx);
    setFormState({
      ...formState,
      options: nextEn,
      options_hi: nextHi,
      correct: formState.correct.trim() === removedVal ? '' : formState.correct,
    });
  };

  return (
    <>
      <NativeDialog
        isOpen={isOpen}
        onClose={handleRequestClose}
        variant="drawer-right"
        isDirty={isDirty}
        onDirtyCloseAttempt={() => setShowDiscardConfirm(true)}
        ariaLabelledBy={titleId}
        className="max-w-2xl"
        panelClassName="relative w-full h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70 pt-[calc(1rem_+_env(safe-area-inset-top))]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span
                  id={titleId}
                  className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate"
                >
                  {question.subject || 'Question Inspector'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase shrink-0">
                  {question.difficulty || 'Medium'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                aria-label="Copy question UUID"
                className="min-h-[44px] -my-2 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 w-fit transition-all active:scale-95"
              >
                <span className="truncate max-w-[180px] sm:max-w-[260px]">
                  ID: {question.v1_id || question.id}
                </span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all active:scale-95"
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                <span>Edit</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95 disabled:opacity-50"
              aria-label="Soft delete question"
              title="Soft Delete"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close question inspector"
              className="min-w-[44px] min-h-[44px] -mr-1 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Language Mode Toggle (View Mode) */}
        {!isEditing && <BilingualModeToggle mode={bilingualMode} onChange={setBilingualMode} />}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(2rem_+_env(safe-area-inset-bottom))] space-y-6">
          {!isEditing ? (
            <QuestionBilingualPreview question={question} bilingualMode={bilingualMode} />
          ) : (
            <div className="space-y-6">
              {/* Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="inspector-subject"
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5"
                  >
                    Subject
                  </label>
                  <select
                    id="inspector-subject"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjectChoices.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="inspector-difficulty"
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5"
                  >
                    Difficulty
                  </label>
                  <select
                    id="inspector-difficulty"
                    value={formState.difficulty}
                    onChange={(e) => setFormState({ ...formState, difficulty: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Stems */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="inspector-question-en"
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5"
                  >
                    English Question Text (Supports Markdown &amp; KaTeX `$...$`)
                  </label>
                  <textarea
                    id="inspector-question-en"
                    rows={3}
                    value={formState.question}
                    onChange={(e) => setFormState({ ...formState, question: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inspector-question-hi"
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5"
                  >
                    Hindi Translation Text
                  </label>
                  <textarea
                    id="inspector-question-hi"
                    rows={3}
                    value={formState.question_hi}
                    onChange={(e) => setFormState({ ...formState, question_hi: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-hindi"
                  />
                </div>
              </div>

              {/* Options + Correct Answer Selector */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Bilingual Options &amp; Correct Answer
                  </span>
                  {formState.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formState.options.map((enOpt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelectedCorrect =
                      enOpt.trim() !== '' &&
                      (formState.correct.trim() === enOpt.trim() ||
                        formState.correct.trim().toLowerCase() === letter.toLowerCase() ||
                        formState.correct.trim().toLowerCase() === `option ${letter.toLowerCase()}`);

                    return (
                      <div
                        key={`opt-edit-${idx}`}
                        className={`p-3 rounded-xl border space-y-2 ${
                          isSelectedCorrect
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFormState({ ...formState, correct: enOpt.trim() || letter })
                            }
                            aria-pressed={isSelectedCorrect}
                            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 ${
                              isSelectedCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              Option {letter} {isSelectedCorrect ? '(Correct)' : '— Set Correct'}
                            </span>
                          </button>

                          {formState.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOptionRow(idx)}
                              aria-label={`Remove option ${letter}`}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            aria-label={`Option ${letter} English`}
                            placeholder={`Option ${letter} (English)`}
                            value={enOpt}
                            onChange={(e) => updateOptionAt(idx, 'en', e.target.value)}
                            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            aria-label={`Option ${letter} Hindi`}
                            placeholder={`Option ${letter} (Hindi, optional)`}
                            value={formState.options_hi[idx] ?? ''}
                            onChange={(e) => updateOptionAt(idx, 'hi', e.target.value)}
                            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-hindi"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Editor */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Detailed Explanation
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => handleExplanationModeChange('visual')}
                      aria-pressed={formState.explanationMode === 'visual'}
                      className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        formState.explanationMode === 'visual'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Structured Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExplanationModeChange('json')}
                      aria-pressed={formState.explanationMode === 'json'}
                      className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        formState.explanationMode === 'json'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                {formState.explanationMode === 'visual' ? (
                  <div className="space-y-3">
                    {(
                      [
                        ['fact', 'Core Fact'],
                        ['summary', 'Summary'],
                        ['analysis_correct', 'Why Correct'],
                        ['analysis_incorrect', 'Why Others Are Incorrect'],
                        ['conclusion', 'Conclusion'],
                      ] as const
                    ).map(([fieldKey, label]) => (
                      <div key={fieldKey}>
                        <label
                          htmlFor={`inspector-expl-${fieldKey}`}
                          className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1"
                        >
                          {label}
                        </label>
                        <textarea
                          id={`inspector-expl-${fieldKey}`}
                          rows={2}
                          value={formState.explanationFields[fieldKey]}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              explanationFields: {
                                ...formState.explanationFields,
                                [fieldKey]: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="inspector-explanation-json"
                      className="text-[11px] font-bold text-slate-500 block mb-1"
                    >
                      Explanation JSON
                    </label>
                    <textarea
                      id="inspector-explanation-json"
                      rows={8}
                      value={formState.explanationJson}
                      onChange={(e) =>
                        setFormState({ ...formState, explanationJson: e.target.value })
                      }
                      className="w-full font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </NativeDialog>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmSoftDelete}
        title="Soft Delete Question?"
        message="This question will be safely archived (`deleted_at` set) and purged from Question Builder and prepared mock caches. Any existing mock tests referencing it will prompt admins to prune."
        confirmText="Soft Delete"
        confirmStyle="danger"
        isLoading={isSaving}
      />

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          setIsEditing(false);
          onClose();
        }}
        title="Discard Question Edits?"
        message="You have unsaved edits to this question. Discard your changes and close the inspector?"
        confirmText="Discard & Close"
        confirmStyle="warning"
      />
    </>
  );
};
