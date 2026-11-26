/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_RPCS, DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import {
    clearPreparedMockTestsCache,
    resolveEffectiveSeriesEntitlement,
    resolveMockTestAccess,
    type UserCourseEntitlementItem,
} from '../api/mockTestsApi';
import { extractShiftBadgeInfo } from '../utils/shiftMetadata';
import { EXAM_INTEGRITY_DECLARATION } from '../config/examOnboardingRegistry';
import { MockTestListCard } from '../components/MockTestListCard';
import { EduquityExamShell } from '../components/cbt/EduquityExamShell';
import { PurchasedCoursesPage } from '../pages/PurchasedCoursesPage';
import { TestDetailPage } from '../pages/TestDetailPage';
import { PreparedMockResultPage } from '../pages/PreparedMockResultPage';

const {
    fromMock,
    rpcMock,
    getCacheEntryMock,
    setCacheEntryMock,
    mockUser,
    mockProfileRef,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    mockUser: {
        id: 'student-v384-1',
        email: 'student384@example.com',
        user_metadata: { full_name: 'Ananya Verma' },
    },
    mockProfileRef: {
        current: {
            id: 'student-v384-1',
            full_name: 'Ananya Verma',
            email: 'student384@example.com',
            target_exam: 'SSC CGL',
            student_id: 'MIND-100084',
            avatar_url: null,
        } as any,
    },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
    },
}));

vi.mock('@/features/auth', () => ({
    useAuth: () => ({
        user: mockUser,
        profile: mockProfileRef.current,
        roles: ['student'],
        isAdmin: false,
        loading: false,
    }),
}));

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => false,
    },
}));

vi.mock('@capacitor/clipboard', () => ({
    Clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@capacitor/share', () => ({
    Share: {
        share: vi.fn().mockResolvedValue(undefined),
    },
}));

const LocationDisplay: React.FC = () => {
    const loc = useLocation();
    return (
        <div data-testid="location-display">
            {loc.pathname}
            {loc.state ? `|${JSON.stringify(loc.state)}` : ''}
        </div>
    );
};

const getByPath = (row: any, col: string): any => {
    if (!row || typeof row !== 'object') return undefined;
    if (!col.includes('.')) return row[col];
    return col
        .split('.')
        .reduce<any>((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), row);
};

const createChain = (rows: any[], singleMode = false) => {
    const filters: Array<(row: any) => boolean> = [];
    let isSingle = singleMode;

    const execute = () => {
        const filtered = rows.filter((row) => filters.every((fn) => fn(row)));
        if (isSingle) {
            const first = filtered[0] ?? null;
            return Promise.resolve({
                data: first,
                error: first ? null : { code: 'PGRST116', message: '0 rows' },
            });
        }
        return Promise.resolve({ data: filtered, error: null });
    };

    const chain: any = {
        eq: vi.fn((col: string, val: any) => {
            filters.push((row) => getByPath(row, col) === val);
            return chain;
        }),
        neq: vi.fn((col: string, val: any) => {
            filters.push((row) => getByPath(row, col) !== val);
            return chain;
        }),
        in: vi.fn((col: string, vals: any[]) => {
            filters.push((row) => Array.isArray(vals) && vals.includes(getByPath(row, col)));
            return chain;
        }),
        is: vi.fn((col: string, val: any) => {
            if (val === null) {
                filters.push((row) => getByPath(row, col) == null);
            }
            return chain;
        }),
        or: vi.fn(() => chain),
        lt: vi.fn(() => chain),
        lte: vi.fn(() => chain),
        gt: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn(() => {
            isSingle = true;
            return execute();
        }),
        single: vi.fn(() => {
            isSingle = true;
            return execute();
        }),
        then: (resolve: any, reject: any) => execute().then(resolve, reject),
    };
    return chain;
};

interface MockTables {
    series?: any[];
    tests?: any[];
    questions?: any[];
    attempts?: any[];
    payments?: any[];
    entitlements?: any[];
    appUiConfig?: any[];
}

const setupSupabaseTables = (tables: MockTables) => {
    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.SERIES) return { select: vi.fn(() => createChain(tables.series ?? [])) };
        if (table === DB_TABLES.MOCK.TESTS) return { select: vi.fn(() => createChain(tables.tests ?? [])) };
        if (table === DB_TABLES.BANK.QUESTIONS) return { select: vi.fn(() => createChain(tables.questions ?? [])) };
        if (table === DB_TABLES.MOCK.ATTEMPTS) return { select: vi.fn(() => createChain(tables.attempts ?? [])) };
        if (table === DB_TABLES.BILLING.PAYMENTS) return { select: vi.fn(() => createChain(tables.payments ?? [])) };
        if (table === DB_TABLES.BILLING.ENTITLEMENTS) return { select: vi.fn(() => createChain(tables.entitlements ?? [])) };
        if (table === 'app_ui_config') return { select: vi.fn(() => createChain(tables.appUiConfig ?? [])) };
        return { select: vi.fn(() => createChain([])) };
    });
};

describe('v1.0.384 Bundles, Shift Badges, 2-Step Onboarding, Eduquity Legend & 3-Tab Result Hub', () => {
    beforeEach(() => {
        cleanup();
        localStorage.clear();
        clearPreparedMockTestsCache();
        vi.clearAllMocks();
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
        rpcMock.mockResolvedValue({ data: [], error: null });
    });

    afterEach(() => {
        cleanup();
    });

    it('unlocks child series via bundle entitlement and surfaces <14d Renew Access CTA on PurchasedCoursesPage', async () => {
        const nowMs = Date.parse('2026-11-26T00:00:00Z');
        const bundleEntitlement: UserCourseEntitlementItem = {
            id: 'ent-bundle-1',
            user_id: mockUser.id,
            student_id_snapshot: 'MIND-100084',
            series_id: 'ser-bundle-master',
            course_type: 'bundle',
            included_series_ids: ['ser-child-ssc', 'ser-child-bpsc'],
            target_route: '/mcqs/test-series/series/ser-bundle-master',
            payment_id: 'pay-bundle-1',
            status: 'active',
            starts_at: '2026-01-01T00:00:00Z',
            valid_until: '2027-01-01T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        };

        // 1. resolveEffectiveSeriesEntitlement unlocks included child series, not unrelated ones
        expect(resolveEffectiveSeriesEntitlement('ser-child-ssc', [bundleEntitlement], nowMs)?.id).toBe(
            'ent-bundle-1'
        );
        expect(resolveEffectiveSeriesEntitlement('ser-child-bpsc', [bundleEntitlement], nowMs)?.id).toBe(
            'ent-bundle-1'
        );
        expect(resolveEffectiveSeriesEntitlement('ser-unrelated', [bundleEntitlement], nowMs)).toBeNull();

        // 2. resolveMockTestAccess unlocks paid tests inside child series via bundle entitlement
        const childSeries = {
            id: 'ser-child-ssc',
            is_premium: true,
            price_inr: 399,
            validity_days: 365,
            free_demo_count: 0,
        };
        const paidTest = {
            id: 'test-child-paid',
            series_id: 'ser-child-ssc',
            display_order: 2,
            is_free_demo: false,
            is_published: true,
        };
        expect(
            resolveMockTestAccess({
                test: paidTest,
                series: childSeries,
                entitlements: [bundleEntitlement],
                orderedSeriesTests: [paidTest],
                nowMs,
            })
        ).toMatchObject({ unlocked: true, reason: 'entitled', hasActiveEntitlement: true });

        // 3. PurchasedCoursesPage renders Renew Access button when <= 14d remaining & opens renewal checkout
        const expiringSoon = new Date(Date.now() + 5 * 86_400_000).toISOString();
        setupSupabaseTables({
            payments: [
                {
                    id: 'pay-exp-5d',
                    user_id: mockUser.id,
                    order_code: 'ORD-261126-REN1',
                    amount: 599,
                    currency: 'INR',
                    status: 'paid',
                    plan_purchased: 'All-in-One Govt Bundle',
                    series_id: 'ser-bundle-master',
                    course_type: 'bundle',
                    target_route: '/mcqs/test-series/series/ser-bundle-master',
                    validity_days: 365,
                    valid_until: expiringSoon,
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR555666',
                    student_id_snapshot: 'MIND-100084',
                    created_at: '2026-11-20T10:00:00Z',
                },
            ],
            entitlements: [
                {
                    id: 'ent-exp-5d',
                    user_id: mockUser.id,
                    student_id_snapshot: 'MIND-100084',
                    series_id: 'ser-bundle-master',
                    series_name: 'All-in-One Govt Bundle',
                    course_type: 'bundle',
                    included_series_ids: ['ser-child-ssc'],
                    target_route: '/mcqs/test-series/series/ser-bundle-master',
                    payment_id: 'pay-exp-5d',
                    status: 'active',
                    starts_at: '2025-12-01T00:00:00Z',
                    valid_until: expiringSoon,
                    created_at: '2025-12-01T00:00:00Z',
                    updated_at: '2025-12-01T00:00:00Z',
                },
            ],
            series: [
                {
                    id: 'ser-bundle-master',
                    name: 'All-in-One Govt Bundle',
                    price_inr: 599,
                    mrp_inr: 1199,
                    validity_days: 365,
                    is_premium: true,
                    is_published: true,
                    course_type: 'bundle',
                },
            ],
        });

        render(
            <MemoryRouter initialEntries={[ROUTES.PURCHASED]}>
                <PurchasedCoursesPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('renew-access-btn-pay-exp-5d')).toBeTruthy();
        });
        expect(screen.getByText('Bundle')).toBeTruthy();
        expect(screen.getByText(/5 days remaining/i)).toBeTruthy();

        const renewBtn = screen.getByTestId('renew-access-btn-pay-exp-5d');
        expect(renewBtn.className).toContain('min-h-[44px]');
        fireEvent.click(renewBtn);

        await waitFor(() => {
            expect(screen.getByTestId('course-checkout-dialog')).toBeTruthy();
            expect(screen.getByText('Renew Course Access')).toBeTruthy();
        });
    });

    it('extracts Morning/Afternoon/Evening shift badges and renders decluttered <MockTestListCard /> with dynamic CTAs', () => {
        expect(
            extractShiftBadgeInfo({
                shift_slot: 'morning',
                shift_timing: '09:00 AM - 10:00 AM',
                name: 'SSC CGL 12 Sep 2024 Shift 1',
            })
        ).toMatchObject({
            slot: 'morning',
            slotLabel: 'Morning',
            shiftLabel: 'Shift 1',
            timing: '09:00 AM - 10:00 AM',
        });

        expect(
            extractShiftBadgeInfo({
                name: 'SSC CGL 14 Sep 2024 Shift 2 (01:30 PM - 02:30 PM)',
            })
        ).toMatchObject({
            slot: 'afternoon',
            slotLabel: 'Afternoon',
            shiftLabel: 'Shift 2',
            timing: '01:30 PM - 02:30 PM',
        });

        expect(
            extractShiftBadgeInfo({
                shift_slot: 'evening',
                shift_timing: '05:00 PM - 06:00 PM',
                name: 'SSC CGL Shift 3',
            })
        ).toMatchObject({
            slot: 'evening',
            slotLabel: 'Evening',
            timing: '05:00 PM - 06:00 PM',
        });

        const onUnlock = vi.fn();
        const unlockedAccess = {
            unlocked: true,
            reason: 'free_series' as const,
            isPaidSeries: false,
            isFreeDemo: false,
            hasActiveEntitlement: false,
            priceInr: 0,
            mrpInr: null,
            validityDays: 365,
            validUntil: null,
            freeDemoCount: 1,
        };
        const lockedAccess = {
            ...unlockedAccess,
            unlocked: false,
            reason: 'locked_paid' as const,
            isPaidSeries: true,
            priceInr: 399,
        };

        render(
            <MemoryRouter>
                <div>
                    <MockTestListCard
                        test={{
                            id: 't-start',
                            name: 'SSC CGL Shift 1 Paper',
                            test_type: 'PYQ',
                            shift_slot: 'morning',
                            shift_timing: '09:00 AM - 10:00 AM',
                            duration_minutes: 60,
                            total_marks: 200,
                            negative_marks: 0.5,
                            question_ids: ['q1', 'q2'],
                        }}
                        index={0}
                        access={unlockedAccess}
                        returnTo="/mcqs/test-series"
                    />
                    <MockTestListCard
                        test={{
                            id: 't-resume',
                            name: 'SSC CGL Shift 2 Paper',
                            test_type: 'PYQ',
                            shift_slot: 'afternoon',
                            shift_timing: '01:30 PM - 02:30 PM',
                            duration_minutes: 60,
                            total_marks: 200,
                            question_ids: ['q1'],
                        }}
                        index={1}
                        access={unlockedAccess}
                        isInProgress
                        inProgressAttemptId="att-ip-2"
                        returnTo="/mcqs/test-series"
                    />
                    <MockTestListCard
                        test={{
                            id: 't-result',
                            name: 'SSC CGL Shift 3 Paper',
                            test_type: 'MOCK',
                            shift_slot: 'evening',
                            shift_timing: '05:00 PM - 06:00 PM',
                            duration_minutes: 60,
                            total_marks: 200,
                            question_ids: ['q1'],
                        }}
                        index={2}
                        access={unlockedAccess}
                        completedAttemptId="att-done-3"
                        bestScore={176}
                        returnTo="/mcqs/test-series"
                    />
                    <MockTestListCard
                        test={{
                            id: 't-locked',
                            name: 'SSC CGL Locked Paper',
                            test_type: 'MOCK',
                            duration_minutes: 60,
                            total_marks: 200,
                            question_ids: ['q1'],
                        }}
                        index={3}
                        access={lockedAccess}
                        returnTo="/mcqs/test-series"
                        onUnlock={onUnlock}
                    />
                </div>
            </MemoryRouter>
        );

        expect(screen.getByText('#01')).toBeTruthy();
        expect(screen.getByTestId('mock-test-shift-badge-t-start').textContent).toContain(
            'Morning • 09:00 AM - 10:00 AM'
        );
        expect(screen.getByTestId('mock-test-shift-badge-t-resume').textContent).toContain(
            'Afternoon • 01:30 PM - 02:30 PM'
        );
        expect(screen.getByTestId('mock-test-shift-badge-t-result').textContent).toContain(
            'Evening • 05:00 PM - 06:00 PM'
        );

        expect(screen.getByRole('button', { name: /Start Test.*SSC CGL Shift 1 Paper/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Resume Test.*SSC CGL Shift 2 Paper/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /View Result.*SSC CGL Shift 3 Paper/i })).toBeTruthy();

        const unlockBtn = screen.getByRole('button', { name: /Unlock.*SSC CGL Locked Paper/i });
        fireEvent.click(unlockBtn);
        expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it('walks SSC CGL Step 0 Pattern Popup -> Step 1 -> Step 2 (Eduquity legend, All the Best!, language, declaration gate) and BPSC direct Step 1 -> Step 2', async () => {
        setupSupabaseTables({
            tests: [
                {
                    id: 'test-ssc-onboard',
                    series_id: 'ser-ssc-free',
                    name: 'SSC CGL 2024 Tier 1 Shift 1',
                    test_type: 'PYQ',
                    shift_slot: 'morning',
                    shift_timing: '09:00 AM - 10:00 AM',
                    duration_minutes: 60,
                    total_marks: 200,
                    passing_marks: 130,
                    negative_marks: 0.5,
                    question_ids: ['q1', 'q2'],
                    is_published: true,
                    mock_series: {
                        id: 'ser-ssc-free',
                        name: 'SSC CGL PYQ Pack',
                        is_premium: false,
                        price_inr: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
                {
                    id: 'test-bpsc-onboard',
                    series_id: 'ser-bpsc-free',
                    name: '71st BPSC Prelims Mock 1',
                    test_type: 'MOCK',
                    duration_minutes: 120,
                    total_marks: 150,
                    passing_marks: 95,
                    negative_marks: 0.33,
                    question_ids: ['q1'],
                    is_published: true,
                    mock_series: {
                        id: 'ser-bpsc-free',
                        name: 'BPSC Prelims Series',
                        is_premium: false,
                        price_inr: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
                    },
                },
            ],
            attempts: [],
            entitlements: [],
        });

        // 1. SSC CGL flow: Step 0 pattern dialog auto-opens -> select Eduquity -> Step 1 -> Step 2 -> /exam/:testId
        const { unmount } = render(
            <MemoryRouter initialEntries={['/mcqs/test-series/test/test-ssc-onboard']}>
                <Routes>
                    <Route path="/mcqs/test-series/test/:testId" element={<TestDetailPage />} />
                    <Route path="/exam/:testId" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('ssc-cgl-cbt-skin-dialog')).toBeTruthy();
        });
        expect(screen.getByText('New Pattern (Eduquity)')).toBeTruthy();
        expect(screen.getByText('Old Pattern (TCS iON)')).toBeTruthy();

        fireEvent.click(screen.getByTestId('cbt-skin-option-ssc_cgl_eduquity'));
        fireEvent.click(screen.getByTestId('confirm-cbt-pattern-btn'));

        await waitFor(() => {
            expect(screen.queryByTestId('ssc-cgl-cbt-skin-dialog')).toBeNull();
        });
        expect(screen.getByTestId('test-detail-shift-badge').textContent).toContain('Morning');
        expect(screen.getByTestId('test-detail-student-id').textContent).toBe('MIND-100084');

        // Advance Step 1 -> Step 2
        fireEvent.click(screen.getByTestId('onboarding-next-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('onboarding-step-2')).toBeTruthy();
        });

        const step2 = screen.getByTestId('onboarding-step-2');
        expect(within(step2).getByText('All the Best!')).toBeTruthy();
        expect(within(step2).getByText(/Select Test Language/i)).toBeTruthy();
        expect(within(step2).getByText(EXAM_INTEGRITY_DECLARATION)).toBeTruthy();
        // Eduquity legend colors present
        expect(step2.innerHTML).toContain('bg-emerald-600');
        expect(step2.innerHTML).toContain('bg-rose-600');
        expect(step2.innerHTML).toContain('bg-blue-600');
        expect(step2.innerHTML).toContain('bg-slate-200');

        const ctaBtn = screen.getByTestId('test-detail-primary-cta') as HTMLButtonElement;
        expect(ctaBtn.disabled).toBe(true);

        // Select language only -> still disabled until declaration checked
        fireEvent.click(screen.getByTestId('onboarding-lang-hi'));
        expect(ctaBtn.disabled).toBe(true);

        fireEvent.click(screen.getByTestId('onboarding-declaration-checkbox'));
        expect(ctaBtn.disabled).toBe(false);

        fireEvent.click(ctaBtn);
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toContain('/exam/test-ssc-onboard|');
            expect(screen.getByTestId('location-display').textContent).toContain('"initialLanguage":"hi"');
            expect(screen.getByTestId('location-display').textContent).toContain('"cbtSkin":"ssc_cgl_eduquity"');
        });
        unmount();

        // 2. BPSC flow: skips Step 0 popup, goes directly Step 1 -> Step 2
        render(
            <MemoryRouter initialEntries={['/mcqs/test-series/test/test-bpsc-onboard']}>
                <Routes>
                    <Route path="/mcqs/test-series/test/:testId" element={<TestDetailPage />} />
                    <Route path="/exam/:testId" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '71st BPSC Prelims Mock 1' })).toBeTruthy();
        });
        expect(screen.queryByTestId('ssc-cgl-cbt-skin-dialog')).toBeNull();
        fireEvent.click(screen.getByTestId('onboarding-next-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('onboarding-step-2')).toBeTruthy();
        });
        expect(screen.getByText(/BPSC \/ Standard CBT Interface/i)).toBeTruthy();
    });

    it('renders EduquityExamShell Green/Red/Blue/Gray palette tiles and Mark for Review / Unmark Review toggle', () => {
        const questions: any[] = [
            { id: 'q1', question_text: 'Q1', options: ['A', 'B', 'C', 'D'], subject: 'Quant' },
            { id: 'q2', question_text: 'Q2', options: ['A', 'B', 'C', 'D'], subject: 'Quant' },
            { id: 'q3', question_text: 'Q3', options: ['A', 'B', 'C', 'D'], subject: 'Quant' },
            { id: 'q4', question_text: 'Q4', options: ['A', 'B', 'C', 'D'], subject: 'Quant' },
            { id: 'q5', question_text: 'Q5', options: ['A', 'B', 'C', 'D'], subject: 'Quant' },
        ];
        const onToggleMarkForReview = vi.fn();

        const baseProps = {
            test: { id: 't-edu', name: 'SSC CGL Eduquity Mock', total_marks: 10, negative_marks: 0.5 },
            questions,
            activeQuestion: questions[0],
            currentIndex: 0,
            attemptState: {
                attemptId: 'att-edu-1',
                testId: 't-edu',
                userId: mockUser.id,
                status: 'in_progress' as const,
                startedAt: '2026-11-26T00:00:00Z',
                updatedAt: '2026-11-26T00:00:00Z',
                totalDurationSeconds: 1800,
                remainingSeconds: 1800,
                elapsedSeconds: 0,
                currentIndex: 0,
                answers: { q1: 'A', q5: 'B' },
                markedForReview: ['q3', 'q5'],
                visitedQuestionIds: ['q1', 'q2', 'q3', 'q5'],
                timeSpentByQuestion: {},
                remotePersisted: true,
            },
            selectedAnswer: 'A',
            activePaletteStatus: 'answered' as const,
            paletteCounts: {
                answered: 1,
                notAnswered: 1,
                markedForReview: 1,
                answeredAndMarked: 1,
                notVisited: 1,
            },
            paletteFilter: 'all' as const,
            filteredPaletteItems: [
                { question: questions[0], index: 0, status: 'answered' as const },
                { question: questions[1], index: 1, status: 'not_answered' as const },
                { question: questions[2], index: 2, status: 'marked_for_review' as const },
                { question: questions[3], index: 3, status: 'not_visited' as const },
                { question: questions[4], index: 4, status: 'answered_and_marked' as const },
            ],
            setPaletteFilter: vi.fn(),
            sections: [
                {
                    id: 'sec-1',
                    name: 'Quant',
                    startIndex: 0,
                    indices: [0, 1, 2, 3, 4],
                    totalCount: 5,
                    answeredCount: 2,
                    markedCount: 1,
                    answeredAndMarkedCount: 1,
                    notAnsweredCount: 1,
                    notVisitedCount: 1,
                },
            ],
            languageMode: 'en' as const,
            onCycleLanguage: vi.fn(),
            setLanguageMode: vi.fn(),
            hasHindiContent: false,
            zoomScale: 1,
            setZoomScale: vi.fn(),
            studentName: 'Ananya Verma',
            studentId: 'MIND-100084',
            isOfflineMode: false,
            isSubmitting: false,
            isPaletteDrawerOpen: false,
            setIsPaletteDrawerOpen: vi.fn(),
            isExitDialogOpen: false,
            setIsExitDialogOpen: vi.fn(),
            isSubmitDialogOpen: false,
            setIsSubmitDialogOpen: vi.fn(),
            formatCountdown: () => '30:00',
            onSelectOption: vi.fn(),
            onToggleMarkForReview,
            onClearResponse: vi.fn(),
            onSaveAndNext: vi.fn(),
            onPrevious: vi.fn(),
            onJumpToIndex: vi.fn(),
            onConfirmPauseAndExit: vi.fn(),
            onConfirmSubmit: vi.fn(),
        };

        const { rerender } = render(<EduquityExamShell {...baseProps} isCurrentMarked={false} />);

        const q1Btn = screen.getByRole('button', { name: /Question 1, Answered/i });
        const q2Btn = screen.getByRole('button', { name: /Question 2, Not Answered/i });
        const q3Btn = screen.getByRole('button', { name: /Question 3, Marked for Review/i });
        const q4Btn = screen.getByRole('button', { name: /Question 4, Not Visited/i });
        const q5Btn = screen.getByRole('button', { name: /Question 5, Answered & Marked/i });

        expect(q1Btn.className).toContain('bg-emerald-600');
        expect(q2Btn.className).toContain('bg-rose-600');
        expect(q3Btn.className).toContain('bg-blue-600');
        expect(q4Btn.className).toContain('bg-slate-200');
        expect(q5Btn.className).toContain('bg-blue-600');
        expect(q5Btn.className).toContain('border-emerald-400');

        const markBtn = screen.getByTestId('cbt-mark-review-btn');
        expect(markBtn.textContent).toContain('Mark for Review');
        fireEvent.click(markBtn);
        expect(onToggleMarkForReview).toHaveBeenCalledTimes(1);

        rerender(<EduquityExamShell {...baseProps} isCurrentMarked={true} />);
        expect(screen.getByTestId('cbt-mark-review-btn').textContent).toContain('Unmark Review');
    });

    it('renders PreparedMockResultPage 3-tab Result Hub (Analysis | Solutions | Leaderboard) with TestLeaderboardCard exclusively in Leaderboard tab', async () => {
        const q1Id = '33333333-3333-4333-8333-333333333331';
        setupSupabaseTables({
            tests: [
                {
                    id: 'test-res-1',
                    series_id: 'ser-res-1',
                    name: 'SSC CGL Result Hub Test',
                    duration_minutes: 60,
                    total_marks: 4,
                    passing_marks: 2,
                    negative_marks: 0.5,
                    question_ids: [q1Id],
                    is_published: true,
                    mock_series: {
                        id: 'ser-res-1',
                        name: 'SSC CGL Series',
                        is_published: true,
                        mock_categories: {
                            id: 'cat-ssc',
                            name: 'SSC CGL',
                            is_active: true,
                        },
                    },
                },
            ],
            attempts: [
                {
                    id: 'att-res-1',
                    test_id: 'test-res-1',
                    user_id: mockUser.id,
                    start_time: '2026-11-26T08:00:00Z',
                    end_time: '2026-11-26T08:30:00Z',
                    time_taken_seconds: 1800,
                    score: 4,
                    accuracy: 100,
                    status: 'completed',
                    answers: { [q1Id]: 'Delhi' },
                    created_at: '2026-11-26T08:00:00Z',
                },
            ],
            questions: [
                {
                    id: q1Id,
                    v1_id: q1Id,
                    subject: 'General Awareness',
                    question: 'Capital of India?',
                    options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
                    correct_answer: 'Delhi',
                    explanation: { summary: 'New Delhi is the capital of India.' },
                },
            ],
        });

        rpcMock.mockImplementation((fnName: string) => {
            if (fnName === DB_RPCS.MOCK_LEADERBOARD) {
                return Promise.resolve({
                    data: [
                        {
                            rank: 1,
                            user_id: mockUser.id,
                            display_name: 'Ananya Verma',
                            score: 4,
                            accuracy: 100,
                            time_taken_seconds: 1800,
                            is_current_user: true,
                        },
                    ],
                    error: null,
                });
            }
            return Promise.resolve({ data: [], error: null });
        });

        render(
            <MemoryRouter initialEntries={['/mcqs/test-series/test/test-res-1/result/att-res-1']}>
                <Routes>
                    <Route
                        path="/mcqs/test-series/test/:testId/result/:attemptId"
                        element={<PreparedMockResultPage />}
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: 'SSC CGL Result Hub Test' })).toBeTruthy();
        });

        const tablist = screen.getByRole('tablist', { name: 'Result sections' });
        const analysisTab = within(tablist).getByRole('tab', { name: 'Analysis' });
        const solutionsTab = within(tablist).getByRole('tab', { name: 'Solutions' });
        const leaderboardTab = within(tablist).getByRole('tab', { name: 'Leaderboard' });

        // Tab 1 (Analysis) active by default, TestLeaderboardCard NOT mounted
        expect(analysisTab.getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('Subject-Wise Performance')).toBeTruthy();
        expect(screen.queryByRole('heading', { level: 2, name: 'Leaderboard' })).toBeNull();
        expect(rpcMock).not.toHaveBeenCalledWith(DB_RPCS.MOCK_LEADERBOARD, expect.anything());

        // Tab 2 (Solutions) -> 1-by-1 question & explanation, TestLeaderboardCard NOT mounted
        fireEvent.click(solutionsTab);
        await waitFor(() => {
            expect(solutionsTab.getAttribute('aria-selected')).toBe('true');
            expect(screen.getByText('Capital of India?')).toBeTruthy();
        });
        expect(screen.queryByRole('heading', { level: 2, name: 'Leaderboard' })).toBeNull();

        // Tab 3 (Leaderboard) -> exclusively renders TestLeaderboardCard
        fireEvent.click(leaderboardTab);
        await waitFor(() => {
            expect(leaderboardTab.getAttribute('aria-selected')).toBe('true');
            expect(screen.getByRole('heading', { level: 2, name: 'Leaderboard' })).toBeTruthy();
            expect(screen.getAllByText('Ananya Verma').length).toBeGreaterThan(0);
        });
        expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.MOCK_LEADERBOARD, {
            p_test_id: 'test-res-1',
            p_limit: 50,
        });
    });
});
