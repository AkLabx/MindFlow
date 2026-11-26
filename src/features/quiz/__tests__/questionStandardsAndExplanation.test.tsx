/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  CANONICAL_SUBJECTS,
  CANONICAL_SUBJECT_PREFIXES,
  FALLBACK_TAXONOMY_TREE,
  getSubTopicsForTopic,
  getTopicsForSubject,
  isValidTaxonomyTuple,
  resolveCanonicalSubject,
} from '../services/questionTaxonomyService';
import { resolveCanonicalExamName } from '../services/examCatalogService';
import {
  EXPLANATION_CANONICAL_KEYS,
  parseExplanationPayload,
  splitBilingualMarkdown,
  validateExplanation5Keys,
} from '../utils/explanationParser';
import { QuizExplanation } from '../components/QuizExplanation';
import { MistakeQuestionCard } from '../../mistakes/components/MistakeQuestionCard';
import { evaluateQuestionImportRow } from '../../admin/components/UniversalContentImporter';
import type { UserQuestionMasteryRecord } from '../../mistakes/types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock('../services/masteryService', () => ({
  masteryService: {
    updateStickyNote: vi.fn().mockResolvedValue(true),
    markAsMastered: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../components/AdminQuestionImage', () => ({
  AdminQuestionImage: () => null,
}));

vi.mock('../components/AiExplanationButton', () => ({
  AiExplanationButton: () => <button type="button">Mock AI Tutor</button>,
}));

const V3_SAMPLE_EXPLANATION = {
  summary:
    'Correct Answer: Raj Kumar Shukla\n\nसही उत्तर: राज कुमार शुक्ल\n\nHe urged Gandhi at the 1916 Lucknow session.\n\nउन्होंने 1916 के लखनऊ अधिवेशन में गांधीजी से आग्रह किया।',
  analysis_correct:
    '✅ **Why this is correct**\n\n- Invited Gandhi to inspect Tinkathia abuses in Champaran.\n\n✅ **यह सही क्यों है**\n\n- चंपारण में तिनकठिया प्रणाली के विरोध के लिए गांधीजी को आमंत्रित किया।',
  analysis_incorrect:
    '❌ **Why other options are incorrect**\n\n- **Rajendra Prasad:** Joined later in Patna.\n\n❌ **अन्य विकल्प गलत क्यों हैं**\n\n- **राजेंद्र प्रसाद:** बाद में पटना में शामिल हुए।',
  conclusion:
    '📝 **Concluding Note**\n\nRemember **1916 Lucknow -> Raj Kumar Shukla -> 1917 Champaran**.\n\n📝 **निष्कर्ष**\n\nयाद रखें: **1916 लखनऊ -> राज कुमार शुक्ल -> 1917 चंपारण**।',
  fact:
    '💡 **Interesting Fact / रोचक तथ्य**\n\n🤯 **Surprising Fact & 📜 Anecdote:** Tinkathia meant $3/20$ of a bigha.\n\nतिनकठिया का अर्थ प्रति बीघा $3/20$ भाग था।\n\n---\n\n🎯 **Repeated PYQ Insight:** Repeated across 67th and 69th BPSC Prelims.\n\n67वीं और 69वीं BPSC प्रारंभिक परीक्षा में बार-बार पूछा गया।',
};

describe('Question Taxonomy SSOT (13 Subjects & 321 Tuples)', () => {
  it('exposes all 13 canonical subjects and exact DB v1 prefixes without legacy catch-alls', () => {
    expect(CANONICAL_SUBJECTS).toHaveLength(13);
    expect(CANONICAL_SUBJECTS).toContain('Mathematics');
    expect(CANONICAL_SUBJECTS).toContain('Reasoning');
    expect(CANONICAL_SUBJECTS).not.toContain('General');
    expect(CANONICAL_SUBJECTS).not.toContain('General Science');
    expect(CANONICAL_SUBJECTS).not.toContain('Bihar Special');

    expect(CANONICAL_SUBJECT_PREFIXES.Chemistry).toBe('CHE');
    expect(CANONICAL_SUBJECT_PREFIXES.Computer).toBe('COM');
    expect(CANONICAL_SUBJECT_PREFIXES['Current Affairs']).toBe('CUR');
    expect(CANONICAL_SUBJECT_PREFIXES['Static GK']).toBe('SGK');
    expect(CANONICAL_SUBJECT_PREFIXES.Mathematics).toBe('MAT');
    expect(CANONICAL_SUBJECT_PREFIXES.Reasoning).toBe('LR');
  });

  it('contains all 321 fallback tuples including dedicated Bihar-Special topics', () => {
    expect(FALLBACK_TAXONOMY_TREE).toHaveLength(321);
    expect(getTopicsForSubject('History')).toContain('Bihar History');
    expect(getTopicsForSubject('Geography')).toContain('Bihar Geography');
    expect(getTopicsForSubject('Polity')).toContain('Bihar Polity & Governance');
    expect(getTopicsForSubject('Economics')).toContain('Bihar Economy');
    expect(getTopicsForSubject('Static GK')).toContain('Bihar Static GK');
    expect(getTopicsForSubject('Ecology & Environment')).toContain('Bihar Ecology & Conservation');
    expect(getTopicsForSubject('Current Affairs')).toContain('Bihar Current Affairs');

    expect(
      getSubTopicsForTopic('History', 'Bihar History')
    ).toContain('Modern History of Bihar & Freedom Movement');
    expect(
      isValidTaxonomyTuple('Mathematics', 'Arithmetic', 'Simple & Compound Interest')
    ).toBe(true);
    expect(isValidTaxonomyTuple('History', 'Physics', 'Mechanics')).toBe(false);
  });

  it('resolves legacy subject aliases and exam catalog aliases', () => {
    expect(resolveCanonicalSubject('General Science')).toBe('Biology');
    expect(resolveCanonicalSubject('Math')).toBe('Mathematics');
    expect(resolveCanonicalSubject('Logical Reasoning')).toBe('Reasoning');
    expect(resolveCanonicalSubject('Unlisted Domain')).toBe('');

    expect(resolveCanonicalExamName('BPSC CSE PRE')).toBe('BPSC CCE PRE');
    expect(resolveCanonicalExamName('BPSC TRE1')).toBe('BPSC TRE 1.0');
    expect(resolveCanonicalExamName('SSC CGL TIER 1')).toBe('SSC CGL PRE');
  });
});

describe('Explanation v3.0 Parser, Language Filter & Unified Renderers', () => {
  beforeEach(() => {
    cleanup();
  });

  it('validates canonical 5 keys, migrates legacy key_takeaway on read, and rejects key_takeaway in v3 checks', () => {
    expect(EXPLANATION_CANONICAL_KEYS).toEqual([
      'summary',
      'analysis_correct',
      'analysis_incorrect',
      'conclusion',
      'fact',
    ]);

    const migratedRead = parseExplanationPayload(
      JSON.stringify({
        summary: 'S',
        analysis_correct: 'AC',
        analysis_incorrect: 'AI',
        key_takeaway: 'Legacy Takeaway',
        fact: 'F',
      })
    );
    expect(migratedRead.conclusion).toBe('Legacy Takeaway');

    const v3Bad = validateExplanation5Keys({
      ...V3_SAMPLE_EXPLANATION,
      key_takeaway: 'Old field',
    });
    expect(v3Bad.valid).toBe(false);
    expect(v3Bad.legacyKeys).toContain('key_takeaway');

    const v3Good = validateExplanation5Keys(V3_SAMPLE_EXPLANATION);
    expect(v3Good.valid).toBe(true);
    expect(v3Good.missingKeys).toHaveLength(0);
  });

  it('splits bilingual Markdown cleanly by languageMode while keeping GFM table structure', () => {
    const tableBlock =
      '| List-I | List-II |\n| :--- | :--- |\n| A. Act | 1. 1918 |\n\nयह सारणी सही मिलान दर्शाती है।';
    const enOnly = splitBilingualMarkdown(tableBlock, 'english');
    expect(enOnly).toContain('| List-I | List-II |');
    expect(enOnly).not.toContain('यह सारणी');

    const hiOnly = splitBilingualMarkdown(V3_SAMPLE_EXPLANATION.summary, 'hindi');
    expect(hiOnly).toContain('सही उत्तर: राज कुमार शुक्ल');
    expect(hiOnly).not.toContain('Correct Answer: Raj Kumar Shukla');
  });

  it('renders all 5 canonical sections in QuizExplanation across bilingual, english, and hindi modes', () => {
    const { rerender } = render(
      <QuizExplanation explanation={V3_SAMPLE_EXPLANATION} languageMode="bilingual" />
    );

    expect(screen.getByText(/Correct Answer: Raj Kumar Shukla/i)).toBeTruthy();
    expect(screen.getByText(/सही उत्तर: राज कुमार शुक्ल/i)).toBeTruthy();
    expect(screen.getByText(/Key Takeaway/i)).toBeTruthy();
    expect(screen.getByText(/Did you know\?/i)).toBeTruthy();
    expect(screen.getByText(/Repeated across 67th and 69th BPSC Prelims/i)).toBeTruthy();

    rerender(<QuizExplanation explanation={V3_SAMPLE_EXPLANATION} languageMode="english" />);
    expect(screen.queryByText(/सही उत्तर: राज कुमार शुक्ल/i)).toBeNull();
    expect(screen.getByText(/Invited Gandhi to inspect Tinkathia/i)).toBeTruthy();

    rerender(<QuizExplanation explanation={V3_SAMPLE_EXPLANATION} languageMode="hindi" />);
    expect(screen.getByText(/चंपारण में तिनकठिया प्रणाली के विरोध के लिए/i)).toBeTruthy();
  });

  it('renders unified 5-key QuizExplanation inside MistakeQuestionCard instead of plain text truncation', () => {
    const mistakeRecord: UserQuestionMasteryRecord = {
      id: 'm1',
      user_id: 'u1',
      question_id: 'q-champaran',
      subject: 'History',
      topic: 'Bihar History',
      sub_topic: 'Modern History of Bihar & Freedom Movement',
      difficulty: 'Medium',
      times_attempted: 3,
      times_correct: 1,
      times_incorrect: 2,
      times_skipped: 0,
      consecutive_correct: 0,
      consecutive_incorrect: 2,
      last_status: 'incorrect',
      vulnerability_index: 65,
      mastery_tier: 'REPEATED_ERROR',
      first_attempted_at: '2026-11-26T09:00:00Z',
      last_attempted_at: '2026-11-26T10:00:00Z',
      next_review_due_at: '2026-11-27T10:00:00Z',
      question: {
        id: 'q-champaran',
        v1_id: 'HIS9999',
        subject: 'History',
        topic: 'Bihar History',
        subTopic: 'Modern History of Bihar & Freedom Movement',
        examName: 'BPSC CCE PRE',
        examYear: 2023,
        sourceInfo: {
          examName: 'BPSC CCE PRE',
          examYear: 2023,
        },
        classification: {
          subject: 'History',
          topic: 'Bihar History',
          subTopic: 'Modern History of Bihar & Freedom Movement',
        },
        properties: {
          difficulty: 'Medium',
          questionType: 'MCQ',
        },
        question: 'Who invited Mahatma Gandhi to Champaran in 1917?',
        question_hi: '1917 में महात्मा गांधी को चंपारण आने का निमंत्रण किसने दिया था?',
        options: ['Rajendra Prasad', 'Raj Kumar Shukla', 'Brajkishore Prasad', 'Mazharul Haque'],
        options_hi: ['राजेंद्र प्रसाद', 'राज कुमार शुक्ल', 'ब्रजकिशोर प्रसाद', 'मजहरुल हक'],
        correct: 'Raj Kumar Shukla',
        tags: ['Champaran'],
        explanation: V3_SAMPLE_EXPLANATION,
      },
    };

    render(<MistakeQuestionCard record={mistakeRecord} displayIndex={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Official Explanation & Key Concepts/i }));

    expect(screen.getByText(/Invited Gandhi to inspect Tinkathia/i)).toBeTruthy();
    expect(screen.getByText(/1916 Lucknow -> Raj Kumar Shukla/i)).toBeTruthy();
    expect(screen.getByText(/Repeated across 67th and 69th BPSC Prelims/i)).toBeTruthy();
  });
});

describe('UniversalContentImporter Smart Dual-Path Taxonomy & Validation', () => {
  it('classifies complete pre-enriched Track B payloads as ENRICHED with canonical exam alias mapping', () => {
    const res = evaluateQuestionImportRow(
      {
        sourceInfo: { examName: 'BPSC CSE PRE', examYear: 2023 },
        classification: {
          subject: 'History',
          topic: 'Bihar History',
          subTopic: 'Modern History of Bihar & Freedom Movement',
        },
        question: 'Who invited Gandhi to Champaran?',
        question_hi: 'गांधीजी को चंपारण किसने आमंत्रित किया?',
        options: ['Rajendra Prasad', 'Raj Kumar Shukla', 'A', 'B'],
        options_hi: ['राजेंद्र प्रसाद', 'राज कुमार शुक्ल', 'अ', 'ब'],
        correct: 'Raj Kumar Shukla',
        explanation: V3_SAMPLE_EXPLANATION,
      },
      'PYQ'
    );

    expect(res.errors).toEqual([]);
    expect(res.track).toBe('TRACK_B_ENRICHED');
    expect(res.payload?.status).toBe('ENRICHED');
    expect(res.payload?.examName).toBe('BPSC CCE PRE');
    expect(res.payload?.enrichment_progress).toEqual({
      classification: true,
      translation: true,
      explanation: true,
    });
  });

  it('stages valid raw/partial rows safely into Track A PENDING_REVIEW', () => {
    const res = evaluateQuestionImportRow(
      {
        examName: 'SSC CGL TIER 1',
        examYear: 2025,
        subject: 'Polity',
        topic: 'Constitutional Framework',
        subTopic: 'Preamble',
        question: 'How many times has the Preamble been amended?',
        options: ['Once', 'Twice', 'Thrice', 'Never'],
        correct: 'Once',
      },
      'PYQ'
    );

    expect(res.errors).toEqual([]);
    expect(res.track).toBe('TRACK_A_PENDING');
    expect(res.payload?.status).toBe('PENDING_REVIEW');
    expect(res.payload?.examName).toBe('SSC CGL PRE');
    expect(res.payload?.enrichment_progress).toEqual({
      classification: true,
      translation: false,
      explanation: false,
    });
  });

  it('rejects non-canonical taxonomy tuples, legacy key_takeaway, and flattened GFM table translations', () => {
    const res = evaluateQuestionImportRow(
      {
        examName: 'SSC CGL PRE',
        examYear: 2025,
        subject: 'History',
        topic: 'Nonexistent Topic',
        subTopic: 'Fake SubTopic',
        question: 'Match:\n\n| List I | List II |\n| :--- | :--- |\n| A | 1 |',
        question_hi: 'बिना टेबल के अनुवाद',
        options: ['A-1', 'A-2'],
        options_hi: ['A-1', 'A-2'],
        correct: 'A-1',
        explanation: {
          ...V3_SAMPLE_EXPLANATION,
          key_takeaway: 'Forbidden key',
        },
      },
      'PYQ'
    );

    expect(res.errors.length).toBeGreaterThanOrEqual(3);
    expect(res.errors.some((e) => e.includes('Invalid taxonomy tuple'))).toBe(true);
    expect(res.errors.some((e) => e.includes('GFM matching table pipes'))).toBe(true);
    expect(res.errors.some((e) => e.includes('key_takeaway'))).toBe(true);
  });
});
