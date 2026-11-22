export const CANONICAL_EXAM_PREFIX = 'canonical:' as const;

export interface QuestionLightweight {
    id: string;
    v1_id: string;
    question: string;
    subject: string | null;
    topic?: string | null;
    subTopic?: string | null;
    difficulty: string | null;
    examName: string | null;
    examYear: number | null;
    examDateShift?: string | null;
    questionType: string | null;
    tags: string[];
    explanation?: any; // Just for warning validation
    options?: any; // Just for warning validation
    correct?: string; // Just for warning validation
}

export interface QuestionFilterParams {
    search?: string;
    subject?: string;
    difficulty?: string;
    /** Accepts `'canonical:<examId>'` (e.g., `'canonical:bpsc'`) or a raw DB `examName`. */
    examName?: string;
    examYear?: number;
    topic?: string;
    subTopic?: string;
    examDateShift?: string;
}

export interface FilterOptions {
    subjects: string[];
    difficulties: string[];
    examNames: string[];
    examYears: number[];
    topics: string[];
    subTopics: string[];
    examDateShifts: string[];
}
