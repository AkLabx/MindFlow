import React from 'react';
import { CheckCircle2, Languages, Tag } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export type BilingualMode = 'both' | 'en' | 'hi';

export interface NormalizedPreviewOption {
  key: string;
  enText: string;
  hiText?: string;
}

export interface QuestionPreviewData {
  id?: string;
  v1_id?: string;
  subject?: string | null;
  topic?: string | null;
  subTopic?: string | null;
  examName?: string | null;
  examYear?: number | null;
  examDateShift?: string | null;
  difficulty?: string | null;
  questionType?: string | null;
  question?: string | null;
  question_hi?: string | null;
  options?: unknown;
  options_hi?: unknown;
  correct?: string | null;
  explanation?: unknown;
  question_image_url?: string | null;
  explanation_image_url?: string | null;
  tags?: string[] | null;
}

const parseOptionArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignore malformed JSON string
      }
    }
  }
  return [];
};

const extractOptionText = (item: unknown): string => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const val = obj.value ?? obj.text ?? obj.label ?? obj.option ?? '';
    return val === null || val === undefined ? '' : String(val);
  }
  return '';
};

const extractOptionKey = (item: unknown, index: number): string => {
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    if (typeof obj.key === 'string' && obj.key.trim()) {
      return obj.key.trim();
    }
  }
  return String.fromCharCode(65 + index);
};

/**
 * Normalizes both `string[]` (DB standard) and legacy `{ key, value }[]` option arrays
 * alongside parallel `options_hi` Hindi translations.
 */
export const normalizeQuestionOptions = (
  rawOptions: unknown,
  rawOptionsHi?: unknown
): NormalizedPreviewOption[] => {
  const enArr = parseOptionArray(rawOptions);
  const hiArr = parseOptionArray(rawOptionsHi);
  const count = Math.max(enArr.length, hiArr.length);

  const normalized: NormalizedPreviewOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const enRaw = enArr[i];
    const hiRaw = hiArr[i];
    const key = extractOptionKey(enRaw ?? hiRaw, i);
    const enText = extractOptionText(enRaw);
    const hiText = extractOptionText(hiRaw).trim() || undefined;
    normalized.push({ key, enText, hiText });
  }
  return normalized;
};

/**
 * Checks whether an option matches the question's `correct` field across text, letter (`A`),
 * or legacy `'Option A'` notations.
 */
export const isPreviewOptionCorrect = (
  option: NormalizedPreviewOption,
  index: number,
  correctValue: unknown
): boolean => {
  const target = String(correctValue ?? '').trim();
  if (!target) return false;

  const targetLower = target.toLowerCase();
  const letter = String.fromCharCode(65 + index);

  if (option.enText.trim() && option.enText.trim() === target) return true;
  if (option.hiText && option.hiText.trim() === target) return true;
  if (option.key.trim().toLowerCase() === targetLower) return true;
  if (letter.toLowerCase() === targetLower) return true;
  if (`option ${letter}`.toLowerCase() === targetLower) return true;
  return false;
};

/**
 * Parses `explanation` cleanly whether stored as JSONB object, JSON string, or plain string.
 */
export const parseQuestionExplanation = (
  rawExplanation: unknown
): {
  fact?: string;
  summary?: string;
  analysis_correct?: string;
  analysis_incorrect?: string;
  conclusion?: string;
  [key: string]: any;
} => {
  if (!rawExplanation) return {};
  if (typeof rawExplanation === 'object' && !Array.isArray(rawExplanation)) {
    return rawExplanation as Record<string, any>;
  }
  if (typeof rawExplanation === 'string') {
    const trimmed = rawExplanation.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      // Treat plain text/Markdown explanation as summary
    }
    return { summary: trimmed };
  }
  return {};
};

interface BilingualModeToggleProps {
  mode: BilingualMode;
  onChange: (mode: BilingualMode) => void;
}

const LANGUAGE_MODES: Array<{ id: BilingualMode; label: string }> = [
  { id: 'both', label: 'Bilingual' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
];

export const BilingualModeToggle: React.FC<BilingualModeToggleProps> = ({ mode, onChange }) => (
  <div className="px-4 sm:px-6 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
      <Languages className="w-4 h-4 text-indigo-500" aria-hidden="true" />
      <span>Language View</span>
    </span>
    <div
      role="group"
      aria-label="Question preview language"
      className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-700/70 p-1 gap-1"
    >
      {LANGUAGE_MODES.map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              active
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);

interface QuestionBilingualPreviewProps {
  question: QuestionPreviewData;
  bilingualMode: BilingualMode;
  showMetadata?: boolean;
}

export const QuestionBilingualPreview: React.FC<QuestionBilingualPreviewProps> = ({
  question,
  bilingualMode,
  showMetadata = true,
}) => {
  const options = normalizeQuestionOptions(question.options, question.options_hi);
  const explanationObj = parseQuestionExplanation(question.explanation);
  const hasEnglishStem = Boolean(String(question.question ?? '').trim());
  const hasHindiStem = Boolean(String(question.question_hi ?? '').trim());
  const hasExplanationContent = Boolean(
    explanationObj.fact ||
      explanationObj.summary ||
      explanationObj.analysis_correct ||
      explanationObj.analysis_incorrect ||
      explanationObj.conclusion ||
      question.explanation_image_url
  );

  return (
    <div className="space-y-6">
      {/* Question Statement */}
      <section className="space-y-3" aria-label="Question Statement">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Question Statement
        </h3>

        <div className="space-y-2.5">
          {(bilingualMode === 'both' || bilingualMode === 'en') && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
              {hasEnglishStem ? (
                <MarkdownRenderer content={String(question.question)} />
              ) : (
                <p className="text-slate-400 italic text-xs">No English question text provided.</p>
              )}
            </div>
          )}

          {(bilingualMode === 'both' || bilingualMode === 'hi') &&
            (hasHindiStem ? (
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-hindi">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                  Hindi Translation
                </div>
                <MarkdownRenderer content={String(question.question_hi)} />
              </div>
            ) : bilingualMode === 'hi' ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                No Hindi translation recorded for this question yet.
              </div>
            ) : null)}

          {question.question_image_url && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-center p-2">
              <img
                src={question.question_image_url}
                alt="Question diagram"
                className="max-h-72 object-contain rounded-lg"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </section>

      {/* Answer Options */}
      {options.length > 0 && (
        <section className="space-y-3" aria-label="Answer Options">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Answer Options
            </h3>
            {question.correct && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Correct: {question.correct}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => {
              const isCorrect = isPreviewOptionCorrect(opt, idx, question.correct);
              const showEn = bilingualMode === 'both' || bilingualMode === 'en' || !opt.hiText;
              const showHi = (bilingualMode === 'both' || bilingualMode === 'hi') && Boolean(opt.hiText);

              return (
                <div
                  key={`${opt.key}-${idx}`}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-sm transition-colors ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {showEn && (
                        <div className={isCorrect ? 'font-semibold' : 'font-medium'}>
                          <MarkdownRenderer content={opt.enText || '—'} />
                        </div>
                      )}
                      {showHi && opt.hiText && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-hindi">
                          <MarkdownRenderer content={opt.hiText} />
                        </div>
                      )}
                    </div>
                  </div>

                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Correct</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Structured Explanation */}
      <section className="space-y-3" aria-label="Detailed Explanation">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Detailed Explanation
        </h3>

        {hasExplanationContent ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5 text-sm leading-relaxed">
            {explanationObj.fact && (
              <div>
                <strong className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 block mb-1">
                  Core Fact
                </strong>
                <div className="text-slate-800 dark:text-slate-200">
                  <MarkdownRenderer content={String(explanationObj.fact)} />
                </div>
              </div>
            )}
            {explanationObj.summary && (
              <div>
                <strong className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 block mb-1">
                  Summary
                </strong>
                <div className="text-slate-800 dark:text-slate-200">
                  <MarkdownRenderer content={String(explanationObj.summary)} />
                </div>
              </div>
            )}
            {explanationObj.analysis_correct && (
              <div>
                <strong className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 block mb-1">
                  Why Correct
                </strong>
                <div className="text-slate-800 dark:text-slate-200">
                  <MarkdownRenderer content={String(explanationObj.analysis_correct)} />
                </div>
              </div>
            )}
            {explanationObj.analysis_incorrect && (
              <div>
                <strong className="text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400 block mb-1">
                  Why Others Are Incorrect
                </strong>
                <div className="text-slate-800 dark:text-slate-200">
                  <MarkdownRenderer content={String(explanationObj.analysis_incorrect)} />
                </div>
              </div>
            )}
            {explanationObj.conclusion && (
              <div>
                <strong className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 block mb-1">
                  Conclusion
                </strong>
                <div className="text-slate-800 dark:text-slate-200">
                  <MarkdownRenderer content={String(explanationObj.conclusion)} />
                </div>
              </div>
            )}
            {question.explanation_image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-center p-2">
                <img
                  src={question.explanation_image_url}
                  alt="Explanation diagram"
                  className="max-h-72 object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            No detailed explanation recorded yet.
          </div>
        )}
      </section>

      {/* Academic Metadata */}
      {showMetadata && (
        <section
          aria-label="Academic Metadata"
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <strong>Exam:</strong> {question.examName || 'Standard'} ({question.examYear || 'PYQ'})
            </div>
            <div>
              <strong>Shift:</strong> {question.examDateShift || 'General'}
            </div>
            <div>
              <strong>Topic:</strong> {question.topic || '—'}
            </div>
            <div>
              <strong>Subtopic:</strong> {question.subTopic || '—'}
            </div>
          </div>

          {Array.isArray(question.tags) && question.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" aria-hidden="true" />
              {question.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
