import { Explanation } from '../../../types/models';

/**
 * Canonical 5-key Explanation Structure (Pipeline v3.0 / `question_teacher_v1` v3).
 */
export const EXPLANATION_CANONICAL_KEYS = [
  'summary',
  'analysis_correct',
  'analysis_incorrect',
  'conclusion',
  'fact',
] as const;

export type ExplanationCanonicalKey = (typeof EXPLANATION_CANONICAL_KEYS)[number];
export type ExplanationLanguageMode = 'bilingual' | 'english' | 'hindi';

const DEVANAGARI_CHAR_REGEX = /[\u0900-\u097F]/;

/**
 * Normalizes any explanation payload into the canonical 5-key `Explanation` shape.
 * Safely unwraps stringified JSON or nested `{ explanation }` / `{ data }` wrappers,
 * and maps legacy `key_takeaway` to `conclusion` on read so older rows still display cleanly.
 */
export function parseExplanationPayload(raw: unknown): Explanation {
  if (!raw) return {};

  let value: unknown = raw;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        return { summary: trimmed };
      }
    } else {
      return { summary: trimmed };
    }
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .join('\n\n')
      .trim();
    return joined ? { summary: joined } : {};
  }

  if (typeof value !== 'object' || value === null) {
    return {};
  }

  let obj = value as Record<string, unknown>;
  // Unwrap wrapper payloads from older ingestion scripts
  if (
    typeof obj.summary !== 'string' &&
    typeof obj.analysis_correct !== 'string' &&
    typeof obj.explanation === 'object' &&
    obj.explanation !== null
  ) {
    obj = obj.explanation as Record<string, unknown>;
  } else if (
    typeof obj.summary !== 'string' &&
    typeof obj.analysis_correct !== 'string' &&
    typeof obj.data === 'object' &&
    obj.data !== null
  ) {
    obj = obj.data as Record<string, unknown>;
  }

  const pickString = (candidate: unknown): string | undefined => {
    if (typeof candidate === 'string') {
      const t = candidate.trim();
      return t.length > 0 ? t : undefined;
    }
    return undefined;
  };

  const summary = pickString(obj.summary);
  const analysis_correct = pickString(obj.analysis_correct);
  const analysis_incorrect = pickString(obj.analysis_incorrect);
  const conclusion = pickString(obj.conclusion) ?? pickString(obj.key_takeaway);
  const fact = pickString(obj.fact);

  return {
    ...(summary ? { summary } : {}),
    ...(analysis_correct ? { analysis_correct } : {}),
    ...(analysis_incorrect ? { analysis_incorrect } : {}),
    ...(conclusion ? { conclusion } : {}),
    ...(fact ? { fact } : {}),
  };
}

/**
 * Validates that an explanation object strictly provides all 5 canonical v3.0 keys
 * with non-empty trimmed strings and does not contain forbidden legacy keys (`key_takeaway`).
 */
export function validateExplanation5Keys(raw: unknown): {
  valid: boolean;
  missingKeys: ExplanationCanonicalKey[];
  legacyKeys: string[];
  normalized: Required<Record<ExplanationCanonicalKey, string>>;
} {
  const parsedObj =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const legacyKeys: string[] = [];
  if ('key_takeaway' in parsedObj) legacyKeys.push('key_takeaway');

  const normalized = {
    summary: typeof parsedObj.summary === 'string' ? parsedObj.summary.trim() : '',
    analysis_correct:
      typeof parsedObj.analysis_correct === 'string' ? parsedObj.analysis_correct.trim() : '',
    analysis_incorrect:
      typeof parsedObj.analysis_incorrect === 'string' ? parsedObj.analysis_incorrect.trim() : '',
    conclusion: typeof parsedObj.conclusion === 'string' ? parsedObj.conclusion.trim() : '',
    fact: typeof parsedObj.fact === 'string' ? parsedObj.fact.trim() : '',
  };

  const missingKeys = EXPLANATION_CANONICAL_KEYS.filter((k) => !normalized[k]);

  return {
    valid: missingKeys.length === 0 && legacyKeys.length === 0,
    missingKeys,
    legacyKeys,
    normalized,
  };
}

function isPureHindiLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[-_*#|>\s]+$/.test(trimmed)) return false;
  if (!DEVANAGARI_CHAR_REGEX.test(trimmed)) return false;
  // Strip Devanagari, common punctuation/numbers/markdown markers — check remaining Latin words
  const withoutDevanagari = trimmed
    .replace(/[\u0900-\u097F।॥]/g, '')
    .replace(/[*_`#>|\-()[\]{}.,:;!?/\\0-9\s]/g, '');
  return withoutDevanagari.length < 3;
}

function stripHindiFromInlineLine(line: string): string {
  // Strip parenthetical Hindi annotations like `(अंग्रेजी शब्द)` or `(सही उत्तर: ...)`
  let cleaned = line.replace(/\([^()]*[\u0900-\u097F]+[^()]*\)/g, '');
  // Strip trailing slash/dash separated Hindi on bilingual headings like `**Meaning / अर्थ**` -> `**Meaning**`
  cleaned = cleaned.replace(/\s*\/\s*[\u0900-\u097F][\u0900-\u097F\s,।:;-]*(?=\*\*|$)/g, '');
  // Strip any remaining inline Devanagari runs while keeping spaces tidy
  cleaned = cleaned.replace(/[\u0900-\u097F]+[\u0900-\u097F\s।॥]*/g, '');
  return cleaned
    .replace(/\(\s*\)/g, '')
    .replace(/:\s*$/g, (m) => m)
    .replace(/[ \t]{2,}/g, ' ')
    .trimEnd();
}

function extractHindiFromLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';
  if (/^---+$/.test(trimmed)) return '---';
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    // Keep GFM Markdown tables intact so structural alignment never breaks
    return trimmed;
  }
  if (!DEVANAGARI_CHAR_REGEX.test(trimmed)) {
    return trimmed;
  }
  if (isPureHindiLine(trimmed)) {
    return trimmed;
  }

  // If the line carries inline parenthetical Hindi e.g. `Term (हिंदी अर्थ)` keep parenthetical / Devanagari clauses
  const parenHindiMatches = trimmed.match(/\(([^()]*[\u0900-\u097F]+[^()]*)\)/g);
  if (parenHindiMatches && parenHindiMatches.length > 0 && /^[-*•\d.]/.test(trimmed)) {
    // Bullet line containing inline Hindi annotations — keep full bilingual context or clean Hindi segment
    const devanagariPart = trimmed.replace(/^[\s*>#-]+/, '');
    if (DEVANAGARI_CHAR_REGEX.test(devanagariPart)) {
      return trimmed;
    }
  }

  // Heading like `🤯 **Fascinating Fact / रोचक तथ्य**` -> `🤯 **रोचक तथ्य**`
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ');
    const hindiSide = parts.find((p) => DEVANAGARI_CHAR_REGEX.test(p));
    if (hindiSide) {
      const prefix = parts[0].match(/^([^\p{L}\p{N}]*(?:#+\s*)?(?:\*\*)?)/u)?.[1] ?? '';
      const hasBold = parts[0].includes('**') && !hindiSide.includes('**');
      return `${prefix}${hindiSide.replace(/^\*+/, '')}${hasBold ? '**' : ''}`.trim();
    }
  }

  return trimmed;
}

/**
 * Filters inline-bilingual Markdown explanation sections according to the active `languageMode`.
 * - `'bilingual'` returns trimmed Markdown verbatim (Teacher v3.0 default).
 * - `'english'` removes pure-Hindi lines and parenthetical Devanagari while preserving GFM tables & `---` dividers.
 * - `'hindi'` emphasizes Devanagari lines/clauses while preserving numeric/formula/table lines for readability.
 */
export function splitBilingualMarkdown(
  text: string | undefined | null,
  languageMode: ExplanationLanguageMode = 'bilingual'
): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized || languageMode === 'bilingual') {
    return normalized;
  }

  if (!DEVANAGARI_CHAR_REGEX.test(normalized)) {
    return normalized;
  }

  const lines = normalized.split('\n');

  if (languageMode === 'english') {
    const out: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (out.length > 0 && out[out.length - 1] !== '') out.push('');
        continue;
      }
      if (trimmed.startsWith('|')) {
        out.push(stripHindiFromInlineLine(line));
        continue;
      }
      if (trimmed.includes('सही उत्तर:') && !/[A-Za-z]{4,}/.test(trimmed.replace(/सही उत्तर/g, ''))) {
        continue;
      }
      if (isPureHindiLine(trimmed)) {
        continue;
      }
      const englishLine = stripHindiFromInlineLine(line);
      if (englishLine.trim()) {
        out.push(englishLine);
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() || normalized;
  }

  // 'hindi' mode: keep Devanagari paragraphs, GFM tables, horizontal dividers, and display math blocks;
  // omit pure-English prose paragraphs when Hindi paragraphs are present in the payload.
  const paragraphs = normalized.split(/\n{2,}/);
  const hasAnyHindiParagraph = paragraphs.some((p) => DEVANAGARI_CHAR_REGEX.test(p));
  if (!hasAnyHindiParagraph) {
    return normalized;
  }

  const kept: string[] = [];
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    if (/^---+$/.test(trimmedPara)) {
      if (kept.length > 0 && kept[kept.length - 1] !== '---') {
        kept.push('---');
      }
      continue;
    }
    // Preserve GFM tables & display math blocks intact
    if (trimmedPara.startsWith('|') || /^\$\$[\s\S]+\$\$$/.test(trimmedPara)) {
      kept.push(trimmedPara);
      continue;
    }
    if (DEVANAGARI_CHAR_REGEX.test(trimmedPara)) {
      const filteredLines = trimmedPara
        .split('\n')
        .map((line) => extractHindiFromLine(line))
        .filter((line, idx, arr) => {
          const t = line.trim();
          if (!t) return false;
          if (t.startsWith('|') || /^---+$/.test(t) || DEVANAGARI_CHAR_REGEX.test(t)) return true;
          // Inside a mixed paragraph, drop pure-English lines if another line has Devanagari
          return !arr.some((other, oIdx) => oIdx !== idx && DEVANAGARI_CHAR_REGEX.test(other));
        });
      if (filteredLines.length > 0) {
        kept.push(filteredLines.join('\n'));
      }
    }
  }

  // Strip trailing orphan divider
  while (kept.length > 0 && kept[kept.length - 1] === '---') {
    kept.pop();
  }

  return kept.join('\n\n').trim() || normalized;
}
