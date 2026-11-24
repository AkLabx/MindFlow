import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuestionPreview, QuestionPreviewRecord } from '../api/questionBuilderApi';
import { RightDrawer } from '../../test-series/components/RightDrawer';
import { Loader2, AlertCircle, AlertTriangle, RefreshCw, Edit2 } from 'lucide-react';
import {
  BilingualMode,
  BilingualModeToggle,
  QuestionBilingualPreview,
} from '../../questions/components/QuestionBilingualPreview';
import { QuestionInspectorDrawer } from '../../questions/components/QuestionInspectorDrawer';
import { QuestionRecord } from '../../questions/services/adminQuestionsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | null;
  onQuestionUpdated?: (updatedQuestion?: QuestionRecord) => void;
}

export const QuestionPreviewDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  questionId,
  onQuestionUpdated,
}) => {
  const [question, setQuestion] = useState<QuestionPreviewRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bilingualMode, setBilingualMode] = useState<BilingualMode>('both');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const requestSeqRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPreview = useCallback(async () => {
    if (!questionId || !isOpen) return;
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setError('');
    try {
      const q = await fetchQuestionPreview(questionId);
      if (!isMountedRef.current || seq !== requestSeqRef.current) return;
      if (!q) {
        setQuestion(null);
        setError('This question was not found in the Question Bank.');
        return;
      }
      setQuestion(q);
    } catch (err: any) {
      if (!isMountedRef.current || seq !== requestSeqRef.current) return;
      setError(err?.message || 'Failed to load preview');
    } finally {
      if (isMountedRef.current && seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [questionId, isOpen]);

  useEffect(() => {
    if (isOpen && questionId) {
      loadPreview();
    } else if (!isOpen) {
      setIsInspectorOpen(false);
    }
  }, [isOpen, questionId, loadPreview]);

  const handleInspectorUpdated = (updated?: QuestionRecord) => {
    if (updated) {
      setQuestion(updated as unknown as QuestionPreviewRecord);
      setIsInspectorOpen(false);
    } else {
      loadPreview();
    }
    onQuestionUpdated?.(updated);
  };

  return (
    <>
      <RightDrawer isOpen={isOpen} onClose={onClose} title="Question Preview" width="lg">
        {loading && !question ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" aria-hidden="true" />
            <p className="text-slate-500 text-sm">Loading complete question data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-6">
            <AlertCircle className="w-8 h-8 text-rose-500" aria-hidden="true" />
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={loadPreview}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        ) : question ? (
          <div className="-m-6 flex flex-col min-h-full">
            {/* Soft-deleted diagnostic warning */}
            {question.deleted_at && (
              <div
                role="alert"
                className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Soft-Deleted Question</p>
                  <p className="mt-0.5">
                    This question was archived ({new Date(question.deleted_at).toLocaleString()}). Students cannot view it in live mocks — prune it from any test referencing it.
                  </p>
                </div>
              </div>
            )}

            {/* Meta + Quick Actions Bar */}
            <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-mono">
                  {question.v1_id || question.id}
                </span>
                {question.subject && (
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md font-semibold">
                    {question.subject}
                  </span>
                )}
                {(question as any).difficulty && (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md font-semibold">
                    {(question as any).difficulty}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={loadPreview}
                  disabled={loading}
                  aria-label="Refresh question preview"
                  className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(true)}
                  className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Bilingual Mode Toggle */}
            <BilingualModeToggle mode={bilingualMode} onChange={setBilingualMode} />

            {/* Shared KaTeX & Bilingual Body */}
            <div className="p-4 sm:p-6 pb-[calc(3rem_+_env(safe-area-inset-bottom))]">
              <QuestionBilingualPreview question={question} bilingualMode={bilingualMode} />
            </div>
          </div>
        ) : null}
      </RightDrawer>

      <QuestionInspectorDrawer
        question={question as unknown as QuestionRecord | null}
        isOpen={isInspectorOpen}
        initialEditMode={true}
        onClose={() => setIsInspectorOpen(false)}
        onQuestionUpdated={handleInspectorUpdated}
      />
    </>
  );
};
