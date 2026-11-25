import type { Question } from '@/types/models';
import type {
    PreparedMockActiveAttemptState,
    PreparedMockPaletteStatus,
} from '../../api/mockTestsApi';

export type CbtInterfaceSkin = 'bpsc_default' | 'ssc_cgl_tcs_ion' | 'ssc_cgl_eduquity';
export type SscCglCbtSkin = 'ssc_cgl_tcs_ion' | 'ssc_cgl_eduquity';
export type LanguageViewMode = 'bilingual' | 'en' | 'hi';
export type PaletteFilterMode = 'all' | 'unanswered' | 'marked';

export interface PaletteCountsSummary {
    answered: number;
    notAnswered: number;
    markedForReview: number;
    answeredAndMarked: number;
    notVisited: number;
}

export interface PaletteFilterItem {
    question: Question;
    index: number;
    status: PreparedMockPaletteStatus;
}

export interface CbtSectionSummary {
    id: string;
    name: string;
    startIndex: number;
    indices: number[];
    totalCount: number;
    answeredCount: number;
    markedCount: number;
    answeredAndMarkedCount: number;
    notAnsweredCount: number;
    notVisitedCount: number;
}

export interface ExamRunnerSkinProps {
    test: any;
    questions: Question[];
    attemptState: PreparedMockActiveAttemptState;
    currentIndex: number;
    activeQuestion: Question;
    selectedAnswer: string | undefined;
    isCurrentMarked: boolean;
    activePaletteStatus: PreparedMockPaletteStatus;
    paletteCounts: PaletteCountsSummary;
    filteredPaletteItems: PaletteFilterItem[];
    paletteFilter: PaletteFilterMode;
    setPaletteFilter: (filter: PaletteFilterMode) => void;
    sections: CbtSectionSummary[];
    languageMode: LanguageViewMode;
    onCycleLanguage: () => void;
    setLanguageMode: (mode: LanguageViewMode) => void;
    hasHindiContent: boolean;
    zoomScale: number;
    setZoomScale: (updater: number | ((prev: number) => number)) => void;
    studentName: string;
    studentId: string | null;
    isOfflineMode: boolean;
    isSubmitting: boolean;
    isPaletteDrawerOpen: boolean;
    setIsPaletteDrawerOpen: (open: boolean) => void;
    isExitDialogOpen: boolean;
    setIsExitDialogOpen: (open: boolean) => void;
    isSubmitDialogOpen: boolean;
    setIsSubmitDialogOpen: (open: boolean) => void;
    formatCountdown: (totalSeconds: number) => string;
    onSelectOption: (optionValue: string) => void;
    onToggleMarkForReview: () => void;
    onClearResponse: () => void;
    onSaveAndNext: () => void;
    onPrevious: () => void;
    onJumpToIndex: (index: number) => void;
    onConfirmPauseAndExit: () => void;
    onConfirmSubmit: (autoSubmitted?: boolean) => void;
}

export const SSC_CGL_CBT_SKIN_STORAGE_KEY = 'mindflow_ssc_cgl_cbt_skin_v1';

export const isSscCglContext = (test: any): boolean => {
    if (!test || typeof test !== 'object') return false;
    const seriesObj = test.mock_series ?? test.test_series ?? {};
    const catObj = seriesObj.mock_categories ?? seriesObj.exam_categories ?? {};
    const haystack = [
        test.name,
        test.series_name,
        test.category_name,
        seriesObj.name,
        seriesObj.slug,
        catObj.name,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return /\bssc\b[\s_-]*cgl\b/.test(haystack) || haystack.includes('ssc cgl');
};

export const getPreferredSscCglSkin = (): SscCglCbtSkin => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(SSC_CGL_CBT_SKIN_STORAGE_KEY);
            if (raw === 'ssc_cgl_eduquity') return 'ssc_cgl_eduquity';
        }
    } catch {
        // Ignore storage errors
    }
    return 'ssc_cgl_tcs_ion';
};

export const setPreferredSscCglSkin = (skin: SscCglCbtSkin): void => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(SSC_CGL_CBT_SKIN_STORAGE_KEY, skin);
        }
    } catch {
        // Ignore storage errors
    }
};

export const resolveExamCbtSkin = (params: {
    test: any;
    requestedSkin?: unknown;
}): CbtInterfaceSkin => {
    if (!isSscCglContext(params.test)) {
        return 'bpsc_default';
    }
    if (params.requestedSkin === 'ssc_cgl_eduquity' || params.requestedSkin === 'ssc_cgl_tcs_ion') {
        return params.requestedSkin;
    }
    return getPreferredSscCglSkin();
};

export const getPaletteStatusBadgeLabel = (status: PreparedMockPaletteStatus): string => {
    switch (status) {
        case 'answered':
            return 'Answered';
        case 'answered_and_marked':
            return 'Answered & Marked';
        case 'marked_for_review':
            return 'Marked for Review';
        case 'not_answered':
            return 'Not Answered';
        default:
            return 'Not Visited';
    }
};

export const buildCbtSections = (
    questions: Question[],
    attemptState: PreparedMockActiveAttemptState,
    resolveStatus: (questionId: string, state: PreparedMockActiveAttemptState) => PreparedMockPaletteStatus
): CbtSectionSummary[] => {
    const order: string[] = [];
    const byName = new Map<string, number[]>();

    questions.forEach((q, idx) => {
        const rawLabel =
            String(
                (q as any)?.subject ??
                    (q as any)?.subjectName ??
                    (q as any)?.section ??
                    ''
            ).trim() || 'General Assessment';
        if (!byName.has(rawLabel)) {
            order.push(rawLabel);
            byName.set(rawLabel, []);
        }
        byName.get(rawLabel)!.push(idx);
    });

    return order.map((name, sIdx) => {
        const indices = byName.get(name) || [];
        let answeredCount = 0;
        let markedCount = 0;
        let answeredAndMarkedCount = 0;
        let notAnsweredCount = 0;
        let notVisitedCount = 0;

        for (const qIdx of indices) {
            const st = resolveStatus(questions[qIdx].id, attemptState);
            if (st === 'answered') answeredCount += 1;
            else if (st === 'marked_for_review') markedCount += 1;
            else if (st === 'answered_and_marked') answeredAndMarkedCount += 1;
            else if (st === 'not_answered') notAnsweredCount += 1;
            else notVisitedCount += 1;
        }

        return {
            id: `section-${sIdx}`,
            name,
            startIndex: indices[0] ?? 0,
            indices,
            totalCount: indices.length,
            answeredCount,
            markedCount,
            answeredAndMarkedCount,
            notAnsweredCount,
            notVisitedCount,
        };
    });
};
