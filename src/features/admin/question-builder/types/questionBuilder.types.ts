export interface QuestionLightweight {
    id: string;
    v1_id: string;
    question: string;
    subject: string | null;
    difficulty: string | null;
    examName: string | null;
    examYear: number | null;
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
    examName?: string;
    examYear?: number;
    topic?: string;
}

export interface FilterOptions {
    subjects: string[];
    difficulties: string[];
    examNames: string[];
    examYears: number[];
    topics: string[];
}
