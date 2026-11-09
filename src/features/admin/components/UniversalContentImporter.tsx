import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Languages,
  Sparkles,
  HelpCircle,
  Database,
  ArrowRight,
  RefreshCw,
  X,
  Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

export type ContentTargetType = 'questions' | 'ows' | 'idiom' | 'synonym';
export type ImportMode = 'bulk' | 'single';

interface UniversalContentImporterProps {
  initialType?: ContentTargetType;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const V1_ID_REGEX = /^[A-Z]{2,4}[0-9]+$/;

function normalizeQuestionPayload(row: any) {
  const subject = row.classification?.subject || row.subject || 'General';
  const topic = row.classification?.topic || row.topic || null;
  const subTopic = row.classification?.subTopic || row.subTopic || null;
  const examName = row.sourceInfo?.examName || row.examName || null;
  const examYear = row.sourceInfo?.examYear ? parseInt(row.sourceInfo.examYear) : (row.examYear ? parseInt(row.examYear) : null);
  const examDateShift = row.sourceInfo?.examDateShift || row.examDateShift || null;
  const difficulty = row.properties?.difficulty || row.difficulty || 'Medium';
  const questionType = row.properties?.questionType || row.questionType || 'MCQ';

  const payload: Record<string, any> = {
    subject,
    topic,
    subTopic,
    examName,
    examYear,
    examDateShift,
    difficulty,
    questionType,
    question: row.question,
    question_hi: row.question_hi || null,
    options: row.options,
    options_hi: row.options_hi || null,
    correct: row.correct,
    tags: row.tags || (subject ? [subject] : ['General']),
    explanation: row.explanation || {},
    status: row.status || 'APPROVED'
  };

  // Only pass id if it is a genuine UUID to avoid Postgres syntax error
  if (row.id && typeof row.id === 'string' && UUID_REGEX.test(row.id)) {
    payload.id = row.id;
  }

  // Handle v1_id: either explicitly supplied or coded into id
  if (row.v1_id && typeof row.v1_id === 'string' && V1_ID_REGEX.test(row.v1_id)) {
    payload.v1_id = row.v1_id;
  } else if (row.id && typeof row.id === 'string' && V1_ID_REGEX.test(row.id)) {
    payload.v1_id = row.id;
  }
  // If v1_id is omitted, Postgres sequence trigger assign_question_v1_id()
  // auto-assigns the exact sequence number!

  return payload;
}

export const UniversalContentImporter: React.FC<UniversalContentImporterProps> = ({
  initialType = 'questions',
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const showToast = useNotificationStore((state) => state.showToast);

  const [contentType, setContentType] = useState<ContentTargetType>(initialType);
  const [mode, setMode] = useState<ImportMode>('bulk');

  // Bulk State
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; error: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Single Item Form State
  const [singleForm, setSingleForm] = useState<Record<string, any>>({
    subject: 'History',
    question: '',
    question_hi: '',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct: 'Option A',
    difficulty: 'Medium',
    word: '',
    pos: 'Noun',
    phrase: '',
    meaning_english: '',
    meaning_hindi: ''
  });

  // Sample templates generator
  const getSampleTemplate = (type: ContentTargetType) => {
    switch (type) {
      case 'questions':
        return [
          {
            subject: 'History',
            topic: 'Ancient India',
            difficulty: 'Medium',
            question: 'Who was the founder of the Maurya Empire?',
            question_hi: 'मौर्य साम्राज्य के संस्थापक कौन थे?',
            options: ['Chandragupta Maurya', 'Ashoka', 'Bindusara', 'Harsha'],
            options_hi: ['चन्द्रगुप्त मौर्य', 'अशोक', 'बिन्दुसार', 'हर्ष'],
            correct: 'Chandragupta Maurya',
            tags: ['History', 'Ancient', 'SSC'],
            explanation: {
              summary: 'Chandragupta Maurya founded the Maurya Empire in 322 BCE with the help of Chanakya.'
            }
          }
        ];
      case 'ows':
        return [
          {
            word: 'Philanthropist',
            pos: 'Noun',
            meaning_english: 'A person who seeks to promote the welfare of others, especially by the generous donation of money to good causes.',
            meaning_hindi: 'मानव प्रेमी / परोपकारी',
            difficulty: 'Medium',
            source_pdf: 'PYQ TCS'
          }
        ];
      case 'idiom':
        return [
          {
            phrase: 'Bite the bullet',
            meaning_english: 'To decide to do something difficult or unpleasant that one has been putting off.',
            meaning_hindi: 'मुश्किल परिस्थिति का साहसपूर्वक सामना करना',
            difficulty: 'Easy',
            source_pdf: 'PYQ TCS'
          }
        ];
      case 'synonym':
        return [
          {
            word: 'Benevolent',
            pos: 'Adjective',
            meaning: 'Well meaning and kindly',
            hindi_meaning: 'परोपकारी, दयालु',
            difficulty: 'Medium',
            importance_score: 95
          }
        ];
    }
  };

  const handleDownloadSample = () => {
    const template = getSampleTemplate(contentType);
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `sample_${contentType}_template.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast({ title: 'Template Downloaded', message: `Sample template for ${contentType} ready.`, variant: 'success' });
  };

  const handleParseAndValidate = () => {
    if (!rawText.trim()) {
      showToast({ title: 'Empty Input', message: 'Please paste or drag a JSON array into the input.', variant: 'error' });
      return;
    }

    try {
      const data = JSON.parse(rawText.trim());
      if (!Array.isArray(data)) {
        throw new Error('Input must be a valid JSON array of objects (e.g. [ { ... }, { ... } ])');
      }

      const errors: { row: number; error: string }[] = [];
      data.forEach((row, idx) => {
        const rowNum = idx + 1;
        if (contentType === 'questions') {
          if (!row.question) errors.push({ row: rowNum, error: 'Missing required field: question' });
          if (!row.options || !Array.isArray(row.options) || row.options.length < 2) {
            errors.push({ row: rowNum, error: 'Missing or invalid options array (minimum 2 options required)' });
          }
          if (!row.correct) {
            errors.push({ row: rowNum, error: 'Missing required field: correct' });
          } else if (Array.isArray(row.options) && !row.options.includes(row.correct)) {
            errors.push({ row: rowNum, error: `Correct answer "${row.correct}" must match one of the options.` });
          }
        } else if (contentType === 'ows') {
          if (!row.word) errors.push({ row: rowNum, error: 'Missing required field: word' });
          if (!row.meaning_english) errors.push({ row: rowNum, error: 'Missing required field: meaning_english' });
        } else if (contentType === 'idiom') {
          if (!row.phrase) errors.push({ row: rowNum, error: 'Missing required field: phrase' });
          if (!row.meaning_english) errors.push({ row: rowNum, error: 'Missing required field: meaning_english' });
        } else if (contentType === 'synonym') {
          if (!row.word) errors.push({ row: rowNum, error: 'Missing required field: word' });
          if (!row.meaning) errors.push({ row: rowNum, error: 'Missing required field: meaning' });
        }
      });

      setParsedRows(data);
      setValidationErrors(errors);

      if (errors.length === 0) {
        const autoSeqCount = contentType === 'questions'
          ? data.filter(r => !r.v1_id && (!r.id || !V1_ID_REGEX.test(r.id))).length
          : 0;
        const note = autoSeqCount > 0 ? ` (${autoSeqCount} items will auto-receive next sequential v1_ids from database)` : '';
        showToast({ title: 'Validation Passed', message: `All ${data.length} records are valid and ready to commit!${note}`, variant: 'success' });
      } else {
        showToast({ title: 'Validation Warning', message: `Found ${errors.length} validation errors in dataset.`, variant: 'error' });
      }
    } catch (e: any) {
      showToast({ title: 'JSON Syntax Error', message: e.message || 'Invalid JSON format.', variant: 'error' });
    }
  };

  const handleCommitBulk = async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;

    setIsProcessing(true);
    const BATCH_SIZE = 50;
    const total = parsedRows.length;
    let committed = 0;

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const rawChunk = parsedRows.slice(i, i + BATCH_SIZE);
        const chunk = contentType === 'questions' ? rawChunk.map(normalizeQuestionPayload) : rawChunk;
        const { error } = await supabase.from(contentType).insert(chunk);
        if (error) throw error;
        committed += chunk.length;
        setImportProgress({ current: committed, total });
      }

      showToast({ title: 'Import Complete', message: `Successfully inserted ${total} items into ${contentType}!`, variant: 'success' });
      setRawText('');
      setParsedRows([]);
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err: any) {
      showToast({ title: 'Bulk Commit Failed', message: err.message || 'Database error during insertion.', variant: 'error' });
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const handleSaveSingle = async () => {
    setIsProcessing(true);
    try {
      let payload: Record<string, any> = {};

      if (contentType === 'questions') {
        if (!singleForm.question || !singleForm.correct) {
          throw new Error('Please fill in the question and correct answer.');
        }
        payload = {
          subject: singleForm.subject || 'General',
          question: singleForm.question,
          question_hi: singleForm.question_hi || null,
          options: singleForm.options,
          correct: singleForm.correct,
          difficulty: singleForm.difficulty || 'Medium',
          explanation: { summary: 'Added via Admin Studio' },
          tags: [singleForm.subject || 'General']
        };
      } else if (contentType === 'ows') {
        if (!singleForm.word || !singleForm.meaning_english) {
          throw new Error('Please fill in the word and English meaning.');
        }
        payload = {
          word: singleForm.word,
          pos: singleForm.pos || 'Noun',
          meaning_english: singleForm.meaning_english,
          meaning_hindi: singleForm.meaning_hindi || null,
          difficulty: 'Medium'
        };
      } else if (contentType === 'idiom') {
        if (!singleForm.phrase || !singleForm.meaning_english) {
          throw new Error('Please fill in the idiom phrase and English meaning.');
        }
        payload = {
          phrase: singleForm.phrase,
          meaning_english: singleForm.meaning_english,
          meaning_hindi: singleForm.meaning_hindi || null,
          difficulty: 'Medium'
        };
      } else if (contentType === 'synonym') {
        if (!singleForm.word || !singleForm.meaning_english) {
          throw new Error('Please fill in the word and meaning.');
        }
        payload = {
          word: singleForm.word,
          meaning: singleForm.meaning_english,
          hindi_meaning: singleForm.meaning_hindi || null,
          difficulty: 'Medium'
        };
      }

      const { error } = await supabase.from(contentType).insert(payload);
      if (error) throw error;

      showToast({ title: 'Item Created', message: `Added new ${contentType} entry!`, variant: 'success' });
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err: any) {
      showToast({ title: 'Creation Failed', message: err.message || 'Could not insert item.', variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                    Universal Content Studio & Importer
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add single items or bulk upload JSON datasets directly into database tables.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type & Mode Selectors */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Content Type Tabs */}
              <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-700/60 p-1 font-bold">
                <button
                  onClick={() => { setContentType('questions'); setParsedRows([]); setValidationErrors([]); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    contentType === 'questions'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Questions Bank
                </button>
                <button
                  onClick={() => { setContentType('ows'); setParsedRows([]); setValidationErrors([]); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    contentType === 'ows'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  One Word (OWS)
                </button>
                <button
                  onClick={() => { setContentType('idiom'); setParsedRows([]); setValidationErrors([]); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    contentType === 'idiom'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Idioms
                </button>
                <button
                  onClick={() => { setContentType('synonym'); setParsedRows([]); setValidationErrors([]); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    contentType === 'synonym'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Synonyms
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('bulk')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mode === 'bulk'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Bulk Importer
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mode === 'single'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Single Manual Entry
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* BULK MODE */}
              {mode === 'bulk' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Paste JSON Array ({contentType.toUpperCase()})
                    </span>
                    <button
                      onClick={handleDownloadSample}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Sample Template
                    </button>
                  </div>

                  <textarea
                    rows={9}
                    placeholder={`Paste valid JSON array: [\n  {\n    "question": "Sample Question?",\n    "options": ["A", "B", "C", "D"],\n    "correct": "A"\n  }\n]`}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleParseAndValidate}
                      className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Validate JSON Schema
                    </button>

                    {parsedRows.length > 0 && validationErrors.length === 0 && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {parsedRows.length} valid rows ready to insert
                      </span>
                    )}
                  </div>

                  {/* Errors display */}
                  {validationErrors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2 text-xs text-rose-700 dark:text-rose-300">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Found {validationErrors.length} Schema Errors:
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                        {validationErrors.map((err, i) => (
                          <div key={i}>
                            Row {err.row}: {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {importProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Uploading to database...</span>
                        <span>{importProgress.current} / {importProgress.total}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-200"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SINGLE MODE */}
              {mode === 'single' && (
                <div className="space-y-4 text-xs">
                  {contentType === 'questions' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Subject</label>
                          <input
                            type="text"
                            value={singleForm.subject}
                            onChange={(e) => setSingleForm({ ...singleForm, subject: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Difficulty</label>
                          <select
                            value={singleForm.difficulty}
                            onChange={(e) => setSingleForm({ ...singleForm, difficulty: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-500 block mb-1">Question (English)</label>
                        <textarea
                          rows={2}
                          value={singleForm.question}
                          onChange={(e) => setSingleForm({ ...singleForm, question: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-500 block mb-1">Question (Hindi Translation)</label>
                        <textarea
                          rows={2}
                          value={singleForm.question_hi}
                          onChange={(e) => setSingleForm({ ...singleForm, question_hi: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-hindi"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {['Option A', 'Option B', 'Option C', 'Option D'].map((label, idx) => (
                          <div key={idx}>
                            <label className="font-bold text-slate-500 block mb-1">{label}</label>
                            <input
                              type="text"
                              value={singleForm.options[idx] || ''}
                              onChange={(e) => {
                                const newOpts = [...singleForm.options];
                                newOpts[idx] = e.target.value;
                                setSingleForm({ ...singleForm, options: newOpts });
                              }}
                              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="font-bold text-slate-500 block mb-1">Correct Option Text</label>
                        <input
                          type="text"
                          value={singleForm.correct}
                          onChange={(e) => setSingleForm({ ...singleForm, correct: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-emerald-600"
                        />
                      </div>
                    </>
                  )}

                  {contentType !== 'questions' && (
                    <>
                      <div>
                        <label className="font-bold text-slate-500 block mb-1">
                          {contentType === 'idiom' ? 'Idiom Phrase' : 'Word'}
                        </label>
                        <input
                          type="text"
                          value={contentType === 'idiom' ? singleForm.phrase : singleForm.word}
                          onChange={(e) =>
                            setSingleForm({
                              ...singleForm,
                              [contentType === 'idiom' ? 'phrase' : 'word']: e.target.value
                            })
                          }
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-500 block mb-1">English Meaning</label>
                        <textarea
                          rows={2}
                          value={singleForm.meaning_english}
                          onChange={(e) => setSingleForm({ ...singleForm, meaning_english: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-500 block mb-1">Hindi Meaning</label>
                        <textarea
                          rows={2}
                          value={singleForm.meaning_hindi}
                          onChange={(e) => setSingleForm({ ...singleForm, meaning_hindi: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>

              {mode === 'bulk' ? (
                <button
                  onClick={handleCommitBulk}
                  disabled={isProcessing || parsedRows.length === 0 || validationErrors.length > 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Commit {parsedRows.length} Records to DB</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveSingle}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
