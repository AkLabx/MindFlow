import React, { useEffect, useId, useMemo, useState } from 'react';
import { NativeDialog } from '@/components/ui/NativeDialog';
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
import {
  ExamCatalogEntry,
  fetchExamCatalog,
  getCachedExamCatalog,
  resolveCanonicalExamName,
} from '@/features/quiz/services/examCatalogService';
import {
  CANONICAL_SUBJECTS,
  FALLBACK_TAXONOMY_TREE,
  QuestionTaxonomyEntry,
  getSubTopicsForTopic,
  getTopicsForSubject,
  isValidTaxonomyTuple,
  resolveCanonicalSubject,
  useQuestionTaxonomy,
} from '@/features/quiz/services/questionTaxonomyService';
import {
  parseExplanationPayload,
  validateExplanation5Keys,
} from '@/features/quiz/utils/explanationParser';
import { invalidateQuestionBankCaches } from '@/features/admin/questions/services/questionBankCache';

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

export interface NormalizedQuestionValidationResult {
  payload?: Record<string, any>;
  track: 'TRACK_B_ENRICHED' | 'TRACK_A_PENDING';
  errors: string[];
}

/**
 * Normalizes and validates a question upload row against MindFlow's 13-Subject SSOT,
 * `exam_catalog` SSOT, GFM table integrity, and Explanation v3.0 5-key rules.
 */
export function normalizeQuestionPayload(
  row: any,
  selectedQuestionSource: 'PYQ' | 'EXPERT' = 'PYQ',
  options?: {
    taxonomyTree?: readonly QuestionTaxonomyEntry[];
    examCatalog?: readonly ExamCatalogEntry[];
  }
): Record<string, any> {
  return evaluateQuestionImportRow(row, selectedQuestionSource, options).payload || {};
}

export function evaluateQuestionImportRow(
  row: any,
  selectedQuestionSource: 'PYQ' | 'EXPERT' = 'PYQ',
  opts?: {
    taxonomyTree?: readonly QuestionTaxonomyEntry[];
    examCatalog?: readonly ExamCatalogEntry[];
  }
): NormalizedQuestionValidationResult {
  const taxonomyTree = opts?.taxonomyTree ?? FALLBACK_TAXONOMY_TREE;
  const catalog = opts?.examCatalog ?? getCachedExamCatalog();
  const errors: string[] = [];

  if (!row || typeof row !== 'object') {
    return { track: 'TRACK_A_PENDING', errors: ['Row must be a JSON object.'] };
  }

  const rawSubject = row.classification?.subject || row.subject || '';
  const resolvedSubject = resolveCanonicalSubject(rawSubject);
  if (!resolvedSubject) {
    errors.push(
      `Invalid or missing subject "${rawSubject}". Must match one of the 13 canonical subjects.`
    );
  }

  const topic = String(row.classification?.topic ?? row.topic ?? '').trim() || null;
  const subTopic = String(row.classification?.subTopic ?? row.subTopic ?? '').trim() || null;
  const taxonomyValid = resolvedSubject
    ? isValidTaxonomyTuple(resolvedSubject, topic, subTopic, taxonomyTree)
    : false;

  if (resolvedSubject && (topic || subTopic) && !taxonomyValid) {
    errors.push(
      `Invalid taxonomy tuple (${resolvedSubject}, ${topic || 'missing'}, ${subTopic || 'missing'}). Must match public.question_taxonomy.`
    );
  }

  const rawExamName = String(row.sourceInfo?.examName ?? row.examName ?? '').trim();
  const resolvedExamName = rawExamName
    ? resolveCanonicalExamName(rawExamName)
    : selectedQuestionSource === 'EXPERT'
      ? 'OTHER'
      : '';
  const examInCatalog = Boolean(
    resolvedExamName &&
      (catalog.some((e) => e.exam_name === resolvedExamName) || resolvedExamName === 'OTHER')
  );
  if (!resolvedExamName || !examInCatalog) {
    errors.push(
      rawExamName
        ? `Unrecognized examName "${rawExamName}". Must map to public.exam_catalog.`
        : 'Missing required field: examName / sourceInfo.examName.'
    );
  }

  const rawYear = row.sourceInfo?.examYear ?? row.examYear;
  let examYear: number | null =
    rawYear !== undefined && rawYear !== null && String(rawYear).trim() !== ''
      ? parseInt(String(rawYear), 10)
      : selectedQuestionSource === 'EXPERT'
        ? new Date().getFullYear()
        : null;
  if (examYear === null || Number.isNaN(examYear) || examYear < 1990 || examYear > 2100) {
    errors.push('Missing or invalid examYear (expected 4-digit year 1990-2100).');
    examYear = null;
  }

  if (!row.question || typeof row.question !== 'string' || !row.question.trim()) {
    errors.push('Missing required field: question');
  }
  if (!Array.isArray(row.options) || row.options.length < 2) {
    errors.push('Missing or invalid options array (minimum 2 options required)');
  }
  if (!row.correct || typeof row.correct !== 'string') {
    errors.push('Missing required field: correct');
  } else if (Array.isArray(row.options) && !row.options.includes(row.correct)) {
    errors.push(`Correct answer "${row.correct}" must match one of the options.`);
  }

  const hasQuestionHi = typeof row.question_hi === 'string' && row.question_hi.trim().length > 0;
  const hasOptionsHi =
    Array.isArray(row.options_hi) &&
    Array.isArray(row.options) &&
    row.options_hi.length === row.options.length &&
    row.options_hi.every((opt: unknown) => typeof opt === 'string' && opt.trim().length > 0);
  if (
    typeof row.question === 'string' &&
    /\|\s*:?---/.test(row.question) &&
    hasQuestionHi &&
    !String(row.question_hi).includes('|')
  ) {
    errors.push('question_hi flattened GFM matching table pipes (`| ... |`).');
  }
  const hasBilingual = Boolean(hasQuestionHi && hasOptionsHi);

  const rawExplObj =
    row.explanation && typeof row.explanation === 'object' && !Array.isArray(row.explanation)
      ? row.explanation
      : null;
  if (rawExplObj && 'key_takeaway' in rawExplObj) {
    errors.push('Legacy explanation key "key_takeaway" is forbidden in v3.0; use "conclusion".');
  }

  const parsedExplanation = parseExplanationPayload(row.explanation);
  const explValidation = validateExplanation5Keys(parsedExplanation);
  const explicitStatus = typeof row.status === 'string' ? row.status.trim() : '';

  if ((explicitStatus === 'ENRICHED' || explicitStatus === 'APPROVED') && !explValidation.valid) {
    errors.push(
      `Status "${explicitStatus}" requires all 5 v3.0 explanation keys (missing: ${explValidation.missingKeys.join(', ')}).`
    );
  }
  if ((explicitStatus === 'ENRICHED' || explicitStatus === 'APPROVED') && !taxonomyValid) {
    errors.push(`Status "${explicitStatus}" requires a complete canonical (subject, topic, subTopic) tuple.`);
  }

  const isTrackBReady = Boolean(taxonomyValid && hasBilingual && explValidation.valid);
  const resolvedStatus = explicitStatus || (isTrackBReady ? 'ENRICHED' : 'PENDING_REVIEW');

  const examDateShift = row.sourceInfo?.examDateShift || row.examDateShift || null;
  const difficulty = row.properties?.difficulty || row.difficulty || 'Medium';
  const questionType = row.properties?.questionType || row.questionType || 'MCQ';

  const payload: Record<string, any> = {
    subject: resolvedSubject || rawSubject,
    topic,
    subTopic,
    examName: resolvedExamName || null,
    examYear,
    examDateShift,
    difficulty,
    questionType,
    question_source: row.question_source === 'EXPERT' || row.question_source === 'PYQ' ? row.question_source : selectedQuestionSource,
    question: row.question,
    question_hi: row.question_hi || null,
    options: row.options,
    options_hi: row.options_hi || null,
    correct: row.correct,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : resolvedSubject ? [resolvedSubject] : [],
    explanation: resolvedStatus === 'ENRICHED' || resolvedStatus === 'APPROVED'
      ? explValidation.normalized
      : parsedExplanation,
    enrichment_progress: {
      classification: taxonomyValid,
      translation: hasBilingual,
      explanation: explValidation.valid,
    },
    status: resolvedStatus,
  };

  if (row.id && typeof row.id === 'string' && UUID_REGEX.test(row.id)) {
    payload.id = row.id;
  }
  if (row.v1_id && typeof row.v1_id === 'string' && V1_ID_REGEX.test(row.v1_id)) {
    payload.v1_id = row.v1_id;
  } else if (row.id && typeof row.id === 'string' && V1_ID_REGEX.test(row.id)) {
    payload.v1_id = row.id;
  }

  return {
    payload,
    track: resolvedStatus === 'ENRICHED' ? 'TRACK_B_ENRICHED' : 'TRACK_A_PENDING',
    errors,
  };
}

export const UniversalContentImporter: React.FC<UniversalContentImporterProps> = ({
  initialType = 'questions',
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const titleId = useId();
  const showToast = useNotificationStore((state) => state.showToast);
  const { tree: taxonomyTree, subjects: taxonomySubjects } = useQuestionTaxonomy();
  const [examCatalog, setExamCatalog] = useState<readonly ExamCatalogEntry[]>(() =>
    getCachedExamCatalog()
  );

  useEffect(() => {
    if (!isOpen) return;
    void fetchExamCatalog(false).then((entries) => {
      if (entries.length > 0) setExamCatalog(entries);
    });
  }, [isOpen]);

  const [contentType, setContentType] = useState<ContentTargetType>(initialType);
  const [mode, setMode] = useState<ImportMode>('bulk');
  const [selectedQuestionSource, setSelectedQuestionSource] = useState<'PYQ' | 'EXPERT'>('PYQ');

  // Bulk State
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; error: string }[]>([]);
  const [trackSummary, setTrackSummary] = useState<{ trackB: number; trackA: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const defaultTopics = useMemo(
    () => getTopicsForSubject(CANONICAL_SUBJECTS[0], taxonomyTree),
    [taxonomyTree]
  );
  const defaultSubTopics = useMemo(
    () => getSubTopicsForTopic(CANONICAL_SUBJECTS[0], defaultTopics[0] || '', taxonomyTree),
    [defaultTopics, taxonomyTree]
  );

  // Single Item Form State
  const [singleForm, setSingleForm] = useState<Record<string, any>>({
    subject: CANONICAL_SUBJECTS[0],
    topic: defaultTopics[0] || 'Ancient History',
    subTopic: defaultSubTopics[0] || 'Prehistoric Period',
    examName: examCatalog[0]?.exam_name || 'SSC CGL PRE',
    examYear: String(new Date().getFullYear()),
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
            sourceInfo: {
              examName: 'BPSC CCE PRE',
              examYear: 2023,
              examDateShift: '69th CCE Prelims (30-09-2023)',
            },
            classification: {
              subject: 'History',
              topic: 'Ancient History',
              subTopic: 'Mauryan Empire',
            },
            properties: {
              difficulty: 'Medium',
              questionType: 'MCQ',
            },
            question_source: 'PYQ',
            question: 'Who was the founder of the Maurya Empire?',
            question_hi: 'मौर्य साम्राज्य के संस्थापक कौन थे?',
            options: ['Chandragupta Maurya', 'Ashoka', 'Bindusara', 'Harsha'],
            options_hi: ['चन्द्रगुप्त मौर्य', 'अशोक', 'बिन्दुसार', 'हर्ष'],
            correct: 'Chandragupta Maurya',
            tags: ['Mauryan Empire', 'Chandragupta Maurya', 'Chanakya', '322 BCE'],
            explanation: {
              summary:
                'Correct Answer: Chandragupta Maurya\n\nसही उत्तर: चन्द्रगुप्त मौर्य\n\nChandragupta Maurya founded the Maurya Empire in 322 BCE with the guidance of Chanakya.\n\nचन्द्रगुप्त मौर्य ने 322 ईसा पूर्व में चाणक्य के मार्गदर्शन में मौर्य साम्राज्य की स्थापना की थी।',
              analysis_correct:
                '✅ **Why this is correct**\n\n- Overthrew Dhana Nanda of the Nanda Dynasty in Magadha around 322 BCE.\n\n✅ **यह सही क्यों है**\n\n- लगभग 322 ईसा पूर्व में मगध के नंद वंश के अंतिम शासक धनानंद को पराजित कर शासन स्थापित किया।',
              analysis_incorrect:
                '❌ **Why other options are incorrect**\n\n- **Bindusara** was Chandragupta’s son; **Ashoka** was his grandson; **Harsha** ruled North India in the 7th century CE.\n\n❌ **अन्य विकल्प गलत क्यों हैं**\n\n- **बिन्दुसार** चन्द्रगुप्त के पुत्र थे; **अशोक** उनके पौत्र थे; **हर्ष** 7वीं शताब्दी ईस्वी के शासक थे।',
              conclusion:
                '📝 **Concluding Note**\n\nMauryan Founder: Chandragupta Maurya (322 BCE), Guru: Chanakya / Kautilya.\n\n📝 **निष्कर्ष**\n\nमौर्य वंश के संस्थापक: चन्द्रगुप्त मौर्य (322 ईसा पूर्व), गुरु: चाणक्य / कौटिल्य।',
              fact:
                '💡 **Interesting Fact / रोचक तथ्य**\n\n🤯 **Surprising Fact & 📜 Anecdote:** Greek writers referred to Chandragupta Maurya as Sandrocottus.\n\nयूनानी लेखकों ने चन्द्रगुप्त मौर्य को सैंड्रोकोट्टस कहा है।\n\n---\n\n🏛 **Lesser-known Info:** He defeated Seleucus I Nicator around 305 BCE.\n\nउन्होंने 305 ईसा पूर्व में सेल्युकस प्रथम निकेटर को पराजित किया।\n\n---\n\n🔍 **Misconception Clarified:** Arthashastra was authored by Chanakya, not Chandragupta.\n\nअर्थशास्त्र की रचना चाणक्य ने की थी, चन्द्रगुप्त ने नहीं।\n\n---\n\n🎯 **Repeated PYQ Insight:** William Jones identified Sandrocottus with Chandragupta Maurya.\n\nविलियम जोन्स ने सैंड्रोकोट्टस की पहचान चन्द्रगुप्त मौर्य से की।\n\n---\n\n🌍 **Interesting Connection:** Megasthenes authored Indica while posted as Seleucus’s ambassador in Pataliputra.\n\nमेगस्थनीज ने पाटलिपुत्र में सेल्युकस के राजदूत के रूप में इंडिका की रचना की।'
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
      let trackB = 0;
      let trackA = 0;

      data.forEach((row, idx) => {
        const rowNum = idx + 1;
        if (contentType === 'questions') {
          const evalRes = evaluateQuestionImportRow(row, selectedQuestionSource, {
            taxonomyTree,
            examCatalog,
          });
          for (const msg of evalRes.errors) {
            errors.push({ row: rowNum, error: msg });
          }
          if (evalRes.errors.length === 0) {
            if (evalRes.track === 'TRACK_B_ENRICHED') trackB++;
            else trackA++;
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
      setTrackSummary(contentType === 'questions' ? { trackB, trackA } : null);

      if (errors.length === 0) {
        const autoSeqCount = contentType === 'questions'
          ? data.filter(r => !r.v1_id && (!r.id || !V1_ID_REGEX.test(r.id))).length
          : 0;
        const note = autoSeqCount > 0 ? ` (${autoSeqCount} items will auto-receive sequential v1_ids)` : '';
        const routeNote = contentType === 'questions'
          ? ` [Track B ENRICHED: ${trackB}, Track A PENDING_REVIEW: ${trackA}]`
          : '';
        showToast({ title: 'Validation Passed', message: `All ${data.length} records valid!${routeNote}${note}`, variant: 'success' });
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
        const chunk =
          contentType === 'questions'
            ? rawChunk.map((row) =>
                normalizeQuestionPayload(row, selectedQuestionSource, {
                  taxonomyTree,
                  examCatalog,
                })
              )
            : rawChunk;
        const { error } = await supabase.from(contentType).insert(chunk);
        if (error) throw error;
        committed += chunk.length;
        setImportProgress({ current: committed, total });
      }

      if (contentType === 'questions') {
        await invalidateQuestionBankCaches({ action: 'save' });
      }

      showToast({ title: 'Import Complete', message: `Successfully inserted ${total} items into ${contentType}!`, variant: 'success' });
      setRawText('');
      setParsedRows([]);
      setTrackSummary(null);
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
        if (!singleForm.question?.trim() || !singleForm.correct?.trim()) {
          throw new Error('Please fill in the question and correct answer.');
        }
        const evalRes = evaluateQuestionImportRow(
          {
            subject: singleForm.subject,
            topic: singleForm.topic,
            subTopic: singleForm.subTopic,
            examName: singleForm.examName,
            examYear: singleForm.examYear,
            difficulty: singleForm.difficulty,
            question: singleForm.question,
            question_hi: singleForm.question_hi || null,
            options: singleForm.options,
            correct: singleForm.correct,
            tags: [singleForm.subject, singleForm.topic].filter(Boolean),
            explanation: {},
            status: 'PENDING_REVIEW',
          },
          selectedQuestionSource,
          { taxonomyTree, examCatalog }
        );
        if (evalRes.errors.length > 0 || !evalRes.payload) {
          throw new Error(evalRes.errors[0] || 'Invalid question taxonomy or exam metadata.');
        }
        payload = evalRes.payload;
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
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className="max-w-3xl"
      panelClassName="relative w-full max-h-[90dvh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
    >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                    Universal Content Studio & Importer
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add single items or bulk upload JSON datasets directly into database tables.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close importer"
                className="p-2 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              {contentType === 'questions' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Question Source
                  </span>
                  <div
                    role="group"
                    aria-label="Question Source"
                    className="inline-flex flex-wrap items-center gap-1.5"
                  >
                    {(
                      [
                        { value: 'PYQ', label: 'Previous Year Question (PYQ)' },
                        { value: 'EXPERT', label: 'Expert Curated (EXPERT)' },
                      ] as const
                    ).map((opt) => {
                      const active = selectedQuestionSource === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedQuestionSource(opt.value)}
                          className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation ${
                            active
                              ? opt.value === 'PYQ'
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ {parsedRows.length} valid rows ready
                        </span>
                        {trackSummary && (
                          <>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                              Track B ENRICHED: {trackSummary.trackB}
                            </span>
                            {trackSummary.trackA > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                Track A PENDING_REVIEW: {trackSummary.trackA}
                              </span>
                            )}
                          </>
                        )}
                      </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Subject</label>
                          <select
                            value={singleForm.subject}
                            onChange={(e) => {
                              const nextSubject = e.target.value;
                              const nextTopics = getTopicsForSubject(nextSubject, taxonomyTree);
                              const nextTopic = nextTopics[0] || '';
                              const nextSubs = getSubTopicsForTopic(nextSubject, nextTopic, taxonomyTree);
                              setSingleForm({
                                ...singleForm,
                                subject: nextSubject,
                                topic: nextTopic,
                                subTopic: nextSubs[0] || '',
                              });
                            }}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            {taxonomySubjects.map((subj) => (
                              <option key={subj} value={subj}>
                                {subj}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Difficulty</label>
                          <select
                            value={singleForm.difficulty}
                            onChange={(e) => setSingleForm({ ...singleForm, difficulty: e.target.value })}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Topic</label>
                          <select
                            value={singleForm.topic}
                            onChange={(e) => {
                              const nextTopic = e.target.value;
                              const nextSubs = getSubTopicsForTopic(
                                singleForm.subject,
                                nextTopic,
                                taxonomyTree
                              );
                              setSingleForm({
                                ...singleForm,
                                topic: nextTopic,
                                subTopic: nextSubs[0] || '',
                              });
                            }}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            {getTopicsForSubject(singleForm.subject, taxonomyTree).map((top) => (
                              <option key={top} value={top}>
                                {top}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Subtopic</label>
                          <select
                            value={singleForm.subTopic}
                            onChange={(e) => setSingleForm({ ...singleForm, subTopic: e.target.value })}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            {getSubTopicsForTopic(
                              singleForm.subject,
                              singleForm.topic,
                              taxonomyTree
                            ).map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Exam Name</label>
                          <select
                            value={singleForm.examName}
                            onChange={(e) => setSingleForm({ ...singleForm, examName: e.target.value })}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          >
                            {examCatalog.map((entry) => (
                              <option key={entry.exam_name} value={entry.exam_name}>
                                {entry.exam_name} — {entry.display_label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Exam Year</label>
                          <input
                            type="number"
                            min={1990}
                            max={2100}
                            value={singleForm.examYear}
                            onChange={(e) => setSingleForm({ ...singleForm, examYear: e.target.value })}
                            className="w-full min-h-[44px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          />
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
    </NativeDialog>
  );
};
