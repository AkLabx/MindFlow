import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  Languages,
  Tag,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  QuestionRecord,
  saveQuestion,
  softDeleteQuestion
} from '../services/adminQuestionsService';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface QuestionInspectorDrawerProps {
  question: QuestionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: () => void;
}

export const QuestionInspectorDrawer: React.FC<QuestionInspectorDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated
}) => {
  const showToast = useNotificationStore((state) => state.showToast);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [bilingualMode, setBilingualMode] = useState<'both' | 'en' | 'hi'>('both');

  // Edit form state
  const [formData, setFormData] = useState<Partial<QuestionRecord>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        ...question,
        explanation:
          typeof question.explanation === 'object'
            ? JSON.stringify(question.explanation, null, 2)
            : question.explanation
      });
      setIsEditing(false);
    }
  }, [question]);

  if (!question) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(question.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveQuestion({
        ...formData,
        id: question.id
      });
      showToast({ title: 'Question Saved', message: 'Question updated successfully.', variant: 'success' });
      setIsEditing(false);
      onQuestionUpdated();
    } catch (err: any) {
      showToast({ title: 'Save Failed', message: err.message || 'Could not save question.', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question? It will be safely archived.')) return;

    setIsSaving(true);
    try {
      await softDeleteQuestion(question.id);
      showToast({ title: 'Question Deleted', message: 'Question has been soft-deleted.', variant: 'success' });
      onClose();
      onQuestionUpdated();
    } catch (err: any) {
      showToast({ title: 'Delete Failed', message: err.message || 'Could not delete question.', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Explanation object helper
  const explanationObj =
    typeof question.explanation === 'object'
      ? question.explanation
      : (() => {
          try {
            return JSON.parse(question.explanation as string);
          } catch {
            return { summary: String(question.explanation) };
          }
        })();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Drawer Canvas */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {question.subject || 'Question Inspector'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                      {question.difficulty || 'Medium'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-fit"
                  >
                    <span>ID: {question.v1_id || question.id}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Soft Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Language Mode Toggle */}
            <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                Bilingual View
              </span>
              <div className="flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-700/60 p-0.5 text-[11px] font-bold">
                <button
                  onClick={() => setBilingualMode('both')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    bilingualMode === 'both'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Bilingual
                </button>
                <button
                  onClick={() => setBilingualMode('en')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    bilingualMode === 'en'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setBilingualMode('hi')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    bilingualMode === 'hi'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Hindi
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Text */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Statement</h3>

                {!isEditing ? (
                  <div className="space-y-2">
                    {(bilingualMode === 'both' || bilingualMode === 'en') && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {question.question}
                      </div>
                    )}
                    {(bilingualMode === 'both' || bilingualMode === 'hi') && question.question_hi && (
                      <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-hindi">
                        {question.question_hi}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">English Question Text</label>
                      <textarea
                        rows={3}
                        value={formData.question || ''}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Hindi Translation Text</label>
                      <textarea
                        rows={3}
                        value={formData.question_hi || ''}
                        onChange={(e) => setFormData({ ...formData, question_hi: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Answer Options</h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Correct: {question.correct}
                  </span>
                </div>

                <div className="space-y-2">
                  {(question.options || []).map((opt, idx) => {
                    const isCorrect =
                      opt === question.correct ||
                      String.fromCharCode(65 + idx) === question.correct ||
                      `Option ${String.fromCharCode(65 + idx)}` === question.correct;

                    const hindiOpt = question.options_hi?.[idx];

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 font-bold text-emerald-950 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span>{opt}</span>
                            {bilingualMode !== 'en' && hindiOpt && (
                              <span className="text-[11px] opacity-75 font-normal">{hindiOpt}</span>
                            )}
                          </div>
                        </div>

                        {isCorrect && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Structured Explanation */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Explanation</h3>

                {!isEditing ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs leading-relaxed">
                    {explanationObj.fact && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">Core Fact:</strong>
                        <p className="text-slate-800 dark:text-slate-200">{explanationObj.fact}</p>
                      </div>
                    )}
                    {explanationObj.summary && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">Summary:</strong>
                        <p className="text-slate-800 dark:text-slate-200">{explanationObj.summary}</p>
                      </div>
                    )}
                    {explanationObj.analysis_correct && (
                      <div>
                        <strong className="text-emerald-600 dark:text-emerald-400 block mb-0.5">Why Correct:</strong>
                        <p className="text-slate-800 dark:text-slate-200">{explanationObj.analysis_correct}</p>
                      </div>
                    )}
                    {explanationObj.analysis_incorrect && (
                      <div>
                        <strong className="text-rose-600 dark:text-rose-400 block mb-0.5">Why Others are Incorrect:</strong>
                        <p className="text-slate-800 dark:text-slate-200">{explanationObj.analysis_incorrect}</p>
                      </div>
                    )}
                    {explanationObj.conclusion && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">Conclusion:</strong>
                        <p className="text-slate-800 dark:text-slate-200">{explanationObj.conclusion}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Explanation JSON</label>
                    <textarea
                      rows={6}
                      value={formData.explanation as string || ''}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      className="w-full font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Academic Metadata */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Exam:</strong> {question.examName || 'Standard'} ({question.examYear || 'PYQ'})</div>
                  <div><strong>Shift:</strong> {question.examDateShift || 'General'}</div>
                  <div><strong>Topic:</strong> {question.topic || '—'}</div>
                  <div><strong>Subtopic:</strong> {question.subTopic || '—'}</div>
                </div>

                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {question.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
