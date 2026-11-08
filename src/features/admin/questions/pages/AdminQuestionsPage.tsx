import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Languages,
  CheckSquare,
  Square,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  QuestionRecord,
  fetchQuestions,
  softDeleteQuestion,
  bulkSoftDeleteQuestions,
  fetchDistinctSubjects
} from '../services/adminQuestionsService';
import { QuestionInspectorDrawer } from '../components/QuestionInspectorDrawer';
import { UniversalContentImporter } from '../../components/UniversalContentImporter';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminQuestionsPage: React.FC = () => {
  const showToast = useNotificationStore((state) => state.showToast);

  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load distinct subjects once
  useEffect(() => {
    fetchDistinctSubjects().then(setAvailableSubjects);
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuestions({
        search,
        subject,
        difficulty,
        page,
        pageSize
      });
      setQuestions(data.questions);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      showToast({ title: 'Error', message: 'Could not load questions bank.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [page, subject, difficulty]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadQuestions();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Selection helpers
  const handleSelectAllVisible = () => {
    if (selectedIds.length === questions.length) {
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} questions?`)) return;

    try {
      await bulkSoftDeleteQuestions(selectedIds);
      showToast({ title: 'Questions Deleted', message: `Soft-deleted ${selectedIds.length} questions.`, variant: 'success' });
      setSelectedIds([]);
      loadQuestions();
    } catch (err: any) {
      showToast({ title: 'Delete Failed', message: err.message || 'Could not delete questions.', variant: 'error' });
    }
  };

  const handleInspect = (question: QuestionRecord) => {
    setInspectQuestion(question);
    setIsInspectorOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Master Question Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Over {totalCount > 0 ? totalCount.toLocaleString() : '10,500+'} curated questions with bilingual English & Hindi translations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Universal Importer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions by English/Hindi text or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Refresh */}
          <button
            onClick={loadQuestions}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            title="Refresh questions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedIds.length} question(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* High Density Questions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <button onClick={handleSelectAllVisible} className="p-0.5">
                    {selectedIds.length === questions.length && questions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Subject & Context</th>
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
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
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
                  return (
                    <tr
                      key={q.id}
                      onClick={() => handleInspect(q)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(q.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </td>

                      {/* Subject & Metadata */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[130px]">
                          {q.subject || 'General'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                          {q.topic || '—'}
                        </span>
                        {q.examName && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">
                            {q.examName} {q.examYear ? `(${q.examYear})` : ''}
                          </span>
                        )}
                      </td>

                      {/* Question Text */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="line-clamp-2 font-medium text-slate-800 dark:text-slate-200">
                          {q.question}
                        </p>
                        {q.question_hi && (
                          <p className="line-clamp-1 text-[11px] text-slate-500 font-hindi mt-0.5">
                            {q.question_hi}
                          </p>
                        )}
                      </td>

                      {/* Correct Option */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate max-w-[140px]">
                          {q.correct}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : q.difficulty === 'Hard'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {q.difficulty || 'Medium'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(q);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs font-bold"
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {questions.length} of {totalCount.toLocaleString()} questions (Page {page} of {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Flyout Inspector Drawer */}
      <QuestionInspectorDrawer
        question={inspectQuestion}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setInspectQuestion(null);
        }}
        onQuestionUpdated={loadQuestions}
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
