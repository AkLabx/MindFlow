import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Eye,
} from 'lucide-react';
import {
  QuestionRecord,
  fetchQuestions,
  bulkSoftDeleteQuestions,
  fetchDistinctSubjects,
} from '../services/adminQuestionsService';
import { QuestionInspectorDrawer } from '../components/QuestionInspectorDrawer';
import { UniversalContentImporter } from '../../components/UniversalContentImporter';
import { useNotification } from '@/stores/useNotificationStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { stripHtmlToSnippet } from '../../test-series/api/adminTestSeriesApi';

export const AdminQuestionsPage: React.FC = () => {
  const { showToast } = useNotification();

  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Selection & Drawers
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectQuestion, setInspectQuestion] = useState<QuestionRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [isImporterOpen, setIsImporterOpen] = useState(searchParams.get('action') === 'import');

  const requestSeqRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load distinct subjects once
  useEffect(() => {
    fetchDistinctSubjects().then((subjs) => {
      if (isMountedRef.current) setAvailableSubjects(subjs);
    });
  }, []);

  const loadQuestions = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    try {
      const data = await fetchQuestions({
        search,
        subject,
        difficulty,
        page,
        pageSize,
      });
      if (!isMountedRef.current || seq !== requestSeqRef.current) return;
      setQuestions(data.questions);
      setTotalCount(data.total);
      setTotalPages(Math.max(1, data.totalPages));
    } catch (err: any) {
      if (!isMountedRef.current || seq !== requestSeqRef.current) return;
      console.error('Failed to load questions:', err);
      showToast({
        title: 'Error',
        message: err?.message || 'Could not load questions bank.',
        variant: 'error',
      });
    } finally {
      if (isMountedRef.current && seq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [search, subject, difficulty, page, pageSize, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuestions();
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadQuestions, search]);

  // Selection helpers
  const handleSelectAllVisible = () => {
    if (selectedIds.length === questions.length && questions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0 || isBulkDeleting) return;
    setIsBulkDeleting(true);
    try {
      await bulkSoftDeleteQuestions(selectedIds);
      if (!isMountedRef.current) return;
      showToast({
        title: 'Questions Deleted',
        message: `Soft-deleted ${selectedIds.length} question(s) and synced caches.`,
        variant: 'success',
      });
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      loadQuestions();
    } catch (err: any) {
      if (!isMountedRef.current) return;
      showToast({
        title: 'Delete Failed',
        message: err?.message || 'Could not delete questions.',
        variant: 'error',
      });
    } finally {
      if (isMountedRef.current) {
        setIsBulkDeleting(false);
      }
    }
  };

  const handleInspect = (question: QuestionRecord) => {
    setInspectQuestion(question);
    setIsInspectorOpen(true);
  };

  const renderDifficultyBadge = (diff?: string) => (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
        diff === 'Easy'
          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
          : diff === 'Hard'
          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
      }`}
    >
      {diff || 'Medium'}
    </span>
  );

  return (
    <div className="space-y-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] scroll-mb-28">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Master Question Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalCount > 0 ? totalCount.toLocaleString() : 'Curated'} bilingual English &amp; Hindi questions synced across mocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Universal Importer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            aria-label="Search questions by English or Hindi text or ID"
            placeholder="Search questions by English/Hindi text or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            aria-label="Filter by subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by difficulty"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            type="button"
            onClick={loadQuestions}
            disabled={isLoading}
            aria-label="Refresh questions"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all active:scale-95"
            title="Refresh questions"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>{selectedIds.length} question(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline rounded-xl transition-all active:scale-95"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Native Card List (< md) */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            {selectedIds.length === questions.length && questions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            <span>
              {selectedIds.length === questions.length && questions.length > 0
                ? 'Unselect All'
                : 'Select All Visible'}
            </span>
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {page}/{totalPages}
          </span>
        </div>

        {isLoading && questions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" aria-hidden="true" />
              <span>Loading questions...</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No questions found matching criteria.
          </div>
        ) : (
          questions.map((q) => {
            const isSelected = selectedIds.includes(q.id);
            const enSnippet = stripHtmlToSnippet(q.question, 160);
            const hiSnippet = q.question_hi ? stripHtmlToSnippet(q.question_hi, 120) : '';
            return (
              <div
                key={`mobile-q-${q.id}`}
                className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-3 transition-colors ${
                  isSelected
                    ? 'border-indigo-400 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(q.id)}
                      aria-label={isSelected ? 'Deselect question' : 'Select question'}
                      className="min-w-[44px] min-h-[44px] -ml-2 -mt-1 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {q.subject || 'General'}
                        </span>
                        {renderDifficultyBadge(q.difficulty)}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {[q.examName, q.examYear, q.topic].filter(Boolean).join(' · ') || 'Question Bank'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                    {enSnippet || '—'}
                  </p>
                  {hiSnippet && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-hindi line-clamp-1">
                      {hiSnippet}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    Ans: {q.correct || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInspect(q)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    <span>Inspect &amp; Edit</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop High-Density Table (md+) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th className="py-3.5 px-4 w-12">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    aria-label="Select all visible questions"
                    className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all active:scale-95"
                  >
                    {selectedIds.length === questions.length && questions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Subject &amp; Context</th>
                <th className="py-3.5 px-4">Question Text (EN / HI)</th>
                <th className="py-3.5 px-4">Correct Answer</th>
                <th className="py-3.5 px-4">Difficulty</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {isLoading && questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" aria-hidden="true" />
                      Loading questions...
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No questions found matching criteria.
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  const enSnippet = stripHtmlToSnippet(q.question, 160);
                  const hiSnippet = q.question_hi ? stripHtmlToSnippet(q.question_hi, 120) : '';
                  return (
                    <tr
                      key={q.id}
                      onClick={() => handleInspect(q)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(q.id)}
                          aria-label={isSelected ? 'Deselect question' : 'Select question'}
                          className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                          ) : (
                            <Square
                              className="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[140px]">
                          {q.subject || 'General'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                          {q.topic || '—'}
                        </span>
                        {q.examName && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">
                            {q.examName} {q.examYear ? `(${q.examYear})` : ''}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <p className="line-clamp-2 font-medium text-slate-800 dark:text-slate-200">
                          {enSnippet || '—'}
                        </p>
                        {hiSnippet && (
                          <p className="line-clamp-1 text-[11px] text-slate-500 font-hindi mt-0.5">
                            {hiSnippet}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate max-w-[140px]">
                          {q.correct}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">{renderDifficultyBadge(q.difficulty)}</td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleInspect(q)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all active:scale-95 text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar (Shared Mobile + Desktop) */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Showing {questions.length} of {totalCount.toLocaleString()} questions (Page {page} of {totalPages})
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="min-h-[44px] flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="min-h-[44px] flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 transition-all active:scale-95"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Flyout Inspector Drawer */}
      <QuestionInspectorDrawer
        question={inspectQuestion}
        isOpen={isInspectorOpen}
        availableSubjects={availableSubjects}
        onClose={() => {
          setIsInspectorOpen(false);
          setInspectQuestion(null);
        }}
        onQuestionUpdated={(updatedQuestion) => {
          if (updatedQuestion) {
            setInspectQuestion(updatedQuestion);
          }
          loadQuestions();
        }}
      />

      {/* Bulk Soft Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Soft Delete Selected Questions?"
        message={`Are you sure you want to archive ${selectedIds.length} selected question(s)? Downstream mock caches and filters will refresh automatically.`}
        confirmText={`Delete ${selectedIds.length}`}
        confirmStyle="danger"
        isLoading={isBulkDeleting}
      />

      {/* Universal Content Importer Modal */}
      <UniversalContentImporter
        initialType="questions"
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={loadQuestions}
      />
    </div>
  );
};
export default AdminQuestionsPage;
