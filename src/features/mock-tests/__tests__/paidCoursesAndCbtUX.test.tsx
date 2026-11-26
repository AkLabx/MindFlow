/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
    within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DB_RPCS, DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import {
    clearPreparedMockTestsCache,
    fetchPreparedMockTestsByExam,
    resolveMockTestAccess,
    type UserCourseEntitlementItem,
} from '../api/mockTestsApi';
import { PurchasedCoursesPage } from '../pages/PurchasedCoursesPage';
import { TestsListPage } from '../pages/TestsListPage';
import { TestDetailPage } from '../pages/TestDetailPage';
import { PreparedMockExamPage } from '../pages/PreparedMockExamPage';
import { CourseCheckoutDialog } from '../components/CourseCheckoutDialog';
import { TcsIonExamShell } from '../components/cbt/TcsIonExamShell';
import ProfilePage from '@/features/auth/components/ProfilePage';
import { AdminFinancialsPage } from '@/features/admin/financials/pages/AdminFinancialsPage';
import { SeriesDrawer } from '@/features/admin/test-series/components/SeriesDrawer';
import { SwipeableTabViewport } from '@/components/ui/SwipeableTabViewport';

const {
    fromMock,
    rpcMock,
    getCacheEntryMock,
    setCacheEntryMock,
    getActiveSessionMock,
    saveActiveSessionMock,
    clearActiveSessionMock,
    getAllSavedQuizzesMock,
    clipboardWriteTextMock,
    capacitorClipboardWriteMock,
    isNativePlatformMock,
    mockUser,
    mockProfileRef,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    getActiveSessionMock: vi.fn(),
    saveActiveSessionMock: vi.fn(),
    clearActiveSessionMock: vi.fn(),
    getAllSavedQuizzesMock: vi.fn(),
    clipboardWriteTextMock: vi.fn().mockResolvedValue(undefined),
    capacitorClipboardWriteMock: vi.fn().mockResolvedValue(undefined),
    isNativePlatformMock: vi.fn(() => false),
    mockUser: {
        id: 'student-v383-1',
        email: 'student383@example.com',
        user_metadata: { full_name: 'Aarav Kumar' },
    },
    mockProfileRef: {
        current: {
            id: 'student-v383-1',
            full_name: 'Aarav Kumar',
            email: 'student383@example.com',
            target_exam: 'SSC CGL',
            student_id: 'MF-100042',
            avatar_url: null,
        } as any,
    },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
            })),
        },
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
        getActiveSession: getActiveSessionMock,
        saveActiveSession: saveActiveSessionMock,
        clearActiveSession: clearActiveSessionMock,
        getAllSavedQuizzes: getAllSavedQuizzesMock,
    },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: isNativePlatformMock,
    },
}));

vi.mock('@capacitor/clipboard', () => ({
    Clipboard: {
        write: capacitorClipboardWriteMock,
    },
}));

vi.mock('@capacitor/share', () => ({
    Share: {
        share: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/features/auth', () => ({
    useAuth: () => ({
        user: mockUser,
        profile: mockProfileRef.current,
        roles: ['user'],
        isAdmin: false,
        loading: false,
        refreshProfile: vi.fn().mockResolvedValue(undefined),
        refreshUser: vi.fn().mockResolvedValue(undefined),
        signOut: vi.fn().mockResolvedValue(undefined),
    }),
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        profile: mockProfileRef.current,
        roles: ['user'],
        isAdmin: false,
        loading: false,
        refreshProfile: vi.fn().mockResolvedValue(undefined),
        refreshUser: vi.fn().mockResolvedValue(undefined),
        signOut: vi.fn().mockResolvedValue(undefined),
    }),
}));

vi.mock('@/features/auth/hooks/useProfileStats', () => ({
    useProfileStats: () => ({
        stats: {
            averageScore: 78,
            quizzesCompleted: 4,
            correctAnswers: 32,
            totalTimeSpentFormatted: '45m',
            weakTopics: ['Polity'],
            recentAccuracy: 80,
        },
        loading: false,
    }),
}));

vi.mock('@/features/quiz/hooks/useQuestionMetadata', () => ({
    useQuestionMetadata: () => ({
        metadata: [],
        loading: false,
    }),
}));

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

const LocationDisplay: React.FC = () => {
    const loc = useLocation();
    return (
        <div data-testid="location-display">
            {loc.pathname}
            {loc.search}
        </div>
    );
};

interface MockTablesState {
    categories?: any[];
    series?: any[];
    tests?: any[];
    questions?: any[];
    attempts?: any[];
    payments?: any[];
    entitlements?: any[];
    profiles?: any[];
    appUiConfig?: any[];
    onQuestionsFetched?: () => void;
}

const getByPath = (row: any, col: string): any => {
    if (!row || typeof row !== 'object') return undefined;
    if (!col.includes('.')) return row[col];
    return col.split('.').reduce<any>((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), row);
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
        or: vi.fn(() => chain),
        is: vi.fn(() => chain),
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

const setupSupabaseTables = (state: MockTablesState) => {
    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.CATEGORIES) {
            return { select: vi.fn(() => createChain(state.categories ?? [])) };
        }
        if (table === DB_TABLES.MOCK.SERIES) {
            return { select: vi.fn(() => createChain(state.series ?? [])) };
        }
        if (table === DB_TABLES.MOCK.TESTS) {
            return { select: vi.fn(() => createChain(state.tests ?? [])) };
        }
        if (table === DB_TABLES.BANK.QUESTIONS) {
            return {
                select: vi.fn(() => {
                    state.onQuestionsFetched?.();
                    return createChain(state.questions ?? []);
                }),
            };
        }
        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return { select: vi.fn(() => createChain(state.attempts ?? [])) };
        }
        if (table === DB_TABLES.BILLING.PAYMENTS) {
            return { select: vi.fn(() => createChain(state.payments ?? [])) };
        }
        if (table === DB_TABLES.BILLING.ENTITLEMENTS) {
            return { select: vi.fn(() => createChain(state.entitlements ?? [])) };
        }
        if (table === 'profiles') {
            return { select: vi.fn(() => createChain(state.profiles ?? [])) };
        }
        if (table === 'app_ui_config') {
            return { select: vi.fn(() => createChain(state.appUiConfig ?? [])) };
        }
        return { select: vi.fn(() => createChain([])) };
    });
};

describe('v1.0.383 Paid Courses, Student ID, My Purchase, Inside-Series Filter & Modular CBT UX', () => {
    beforeEach(() => {
        cleanup();
        localStorage.clear();
        clearPreparedMockTestsCache();
        vi.clearAllMocks();
        isNativePlatformMock.mockReturnValue(false);
        mockProfileRef.current = {
            id: 'student-v383-1',
            full_name: 'Aarav Kumar',
            email: 'student383@example.com',
            target_exam: 'SSC CGL',
            student_id: 'MF-100042',
            avatar_url: null,
        };
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
        getActiveSessionMock.mockResolvedValue(null);
        saveActiveSessionMock.mockResolvedValue(undefined);
        clearActiveSessionMock.mockResolvedValue(undefined);
        getAllSavedQuizzesMock.mockResolvedValue([]);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: clipboardWriteTextMock },
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('enforces resolveMockTestAccess rules for free series, active vs expired entitlements, and demo tests', () => {
        const nowMs = Date.parse('2026-11-26T00:00:00Z');
        const paidSeries = {
            id: 'ser-paid-1',
            is_premium: true,
            price_inr: 299,
            mrp_inr: 599,
            validity_days: 365,
            free_demo_count: 1,
        };
        const orderedTests = [
            { id: 't-1', display_order: 1, is_free_demo: false, is_published: true },
            { id: 't-2', display_order: 2, is_free_demo: false, is_published: true },
            { id: 't-3', display_order: 3, is_free_demo: true, is_published: true },
        ];

        expect(
            resolveMockTestAccess({
                test: orderedTests[1],
                series: { id: 'ser-free', is_premium: false, price_inr: 0 },
                entitlements: [],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: true, reason: 'free_series', isPaidSeries: false });

        // free_demo_count = 1 unlocks index 0 and locks index 1
        expect(
            resolveMockTestAccess({
                test: orderedTests[0],
                series: paidSeries,
                entitlements: [],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: true, reason: 'free_demo', isFreeDemo: true });

        expect(
            resolveMockTestAccess({
                test: orderedTests[1],
                series: paidSeries,
                entitlements: [],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: false, reason: 'locked_paid', priceInr: 299 });

        // Per-test explicit is_free_demo toggle unlocks regardless of index
        expect(
            resolveMockTestAccess({
                test: orderedTests[2],
                series: paidSeries,
                entitlements: [],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: true, reason: 'free_demo' });

        // Expired entitlement remains locked
        const expiredEnt: UserCourseEntitlementItem = {
            id: 'ent-exp',
            user_id: 'student-v383-1',
            student_id_snapshot: 'MF-100042',
            series_id: 'ser-paid-1',
            course_type: 'mock_series',
            target_route: '/mcqs/test-series/series/ser-paid-1',
            payment_id: 'pay-1',
            status: 'active',
            starts_at: '2025-01-01T00:00:00Z',
            valid_until: '2026-11-25T23:59:59Z',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
        };
        expect(
            resolveMockTestAccess({
                test: orderedTests[1],
                series: paidSeries,
                entitlements: [expiredEnt],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: false, reason: 'locked_paid' });

        // Future active entitlement unlocks entire series
        const activeEnt: UserCourseEntitlementItem = {
            ...expiredEnt,
            id: 'ent-act',
            valid_until: '2027-11-26T00:00:00Z',
        };
        expect(
            resolveMockTestAccess({
                test: orderedTests[1],
                series: paidSeries,
                entitlements: [activeEnt],
                orderedSeriesTests: orderedTests,
                nowMs,
            })
        ).toMatchObject({ unlocked: true, reason: 'entitled', hasActiveEntitlement: true });
    });

    it('renders My Purchase empty state cleanly without Saved Mock Tests and navigates from newest-first receipt cards with Order ID, Purchase Date, End Date & Days Remaining', async () => {
        setupSupabaseTables({ payments: [], entitlements: [] });

        const { unmount } = render(
            <MemoryRouter initialEntries={[ROUTES.PURCHASED]}>
                <Routes>
                    <Route path={ROUTES.PURCHASED} element={<PurchasedCoursesPage />} />
                    <Route path={ROUTES.TEST_SERIES.ROOT} element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('no-purchase-empty-state')).toBeTruthy();
        });
        expect(screen.getByRole('heading', { level: 1, name: 'My Purchase' })).toBeTruthy();
        expect(screen.getByText('No purchase yet')).toBeTruthy();
        expect(screen.queryByText(/Saved Mock Tests/i)).toBeNull();
        expect(screen.getByTestId('purchase-header-student-id').textContent).toBe('MF-100042');
        unmount();

        clearPreparedMockTestsCache();
        const futureDate = new Date(Date.now() + 45 * 86_400_000).toISOString();
        setupSupabaseTables({
            payments: [
                {
                    id: 'pay-older',
                    user_id: 'student-v383-1',
                    order_code: 'MF-OLD-001',
                    amount: 199,
                    currency: 'INR',
                    status: 'pending_verification',
                    plan_purchased: 'BPSC Older Course',
                    series_id: 'ser-older',
                    course_type: 'mock_series',
                    target_route: '//evil.com',
                    validity_days: 180,
                    valid_until: null,
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR999999',
                    student_id_snapshot: 'MF-100042',
                    created_at: '2026-11-20T10:00:00Z',
                },
                {
                    id: 'pay-newer',
                    user_id: 'student-v383-1',
                    order_code: 'MF-NEW-002',
                    amount: 399,
                    currency: 'INR',
                    status: 'paid',
                    plan_purchased: 'SSC CGL Tier 1 Pro Batch',
                    series_id: 'ser-ssc-pro',
                    course_type: 'mock_series',
                    target_route: '/mcqs/test-series/series/ser-ssc-pro',
                    validity_days: 365,
                    valid_until: futureDate,
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR123456',
                    student_id_snapshot: 'MF-100042',
                    created_at: '2026-11-25T10:00:00Z',
                },
            ],
            entitlements: [
                {
                    id: 'ent-new',
                    user_id: 'student-v383-1',
                    student_id_snapshot: 'MF-100042',
                    series_id: 'ser-ssc-pro',
                    course_type: 'mock_series',
                    target_route: '/mcqs/test-series/series/ser-ssc-pro',
                    payment_id: 'pay-newer',
                    status: 'active',
                    starts_at: '2026-11-25T10:00:00Z',
                    valid_until: futureDate,
                    created_at: '2026-11-25T10:00:00Z',
                    updated_at: '2026-11-25T10:00:00Z',
                },
            ],
        });

        render(
            <MemoryRouter initialEntries={[ROUTES.PURCHASED]}>
                <Routes>
                    <Route path={ROUTES.PURCHASED} element={<PurchasedCoursesPage />} />
                    <Route path="/mcqs/test-series/series/:seriesId" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByTestId('purchase-receipt-card').length).toBe(2);
        });

        const cards = screen.getAllByTestId('purchase-receipt-card');
        expect(cards[0].textContent).toContain('SSC CGL Tier 1 Pro Batch');
        expect(cards[0].textContent).toContain('Order ID: #MF-NEW-002');
        expect(cards[0].textContent).toContain('Purchase Date:');
        expect(cards[0].textContent).toContain('End Date:');
        expect(cards[0].textContent).toContain('remaining');
        expect(cards[1].textContent).toContain('BPSC Older Course');
        expect(cards[1].textContent).toContain('Awaiting Admin Approval');

        // Open-redirect guard blocks //evil.com and falls back to safe series route
        fireEvent.click(cards[1]);
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(
                '/mcqs/test-series/series/ser-older'
            );
        });
    });

    it('displays immutable Student ID on ProfilePage and copies it cleanly with 44px+ target', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[ROUTES.PROFILE.ROOT]}>
                    <ProfilePage onNavigateToSettings={vi.fn()} />
                </MemoryRouter>
            </QueryClientProvider>
        );

        expect(screen.getByTestId('profile-student-id').textContent).toBe('MF-100042');
        const copyBtn = screen.getByTestId('copy-student-id-btn');
        expect(copyBtn.className).toContain('min-h-[44px]');
        expect(copyBtn.className).toContain('min-w-[44px]');

        fireEvent.click(copyBtn);
        await waitFor(() => {
            expect(clipboardWriteTextMock).toHaveBeenCalledWith('MF-100042');
        });
    });

    it('renders All Types | PYQ Papers | Expert Mocks filter and Free Demo / Paid Unlock modal inside TestsListPage', async () => {
        setupSupabaseTables({
            series: [
                {
                    id: 'ser-paid-ssc',
                    category_id: 'cat-ssc',
                    name: 'SSC CGL Rankers Paid Pack',
                    series_type: 'MOCK',
                    course_type: 'mock_series',
                    is_premium: true,
                    price_inr: 349,
                    mrp_inr: 699,
                    validity_days: 365,
                    free_demo_count: 1,
                    is_published: true,
                    mock_categories: { id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true },
                },
            ],
            tests: [
                {
                    id: 'test-pyq-1',
                    series_id: 'ser-paid-ssc',
                    name: 'SSC CGL 2024 Tier 1 Shift 1',
                    test_type: 'PYQ',
                    display_order: 1,
                    duration_minutes: 60,
                    total_marks: 200,
                    question_ids: ['q1', 'q2'],
                    is_published: true,
                    is_free_demo: true,
                    is_live: false,
                    created_at: '2026-11-20T00:00:00Z',
                    mock_series: {
                        id: 'ser-paid-ssc',
                        name: 'SSC CGL Rankers Paid Pack',
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
                {
                    id: 'test-exp-2',
                    series_id: 'ser-paid-ssc',
                    name: 'SSC CGL Grand Expert Mock #2',
                    test_type: 'MOCK',
                    display_order: 2,
                    duration_minutes: 60,
                    total_marks: 200,
                    question_ids: ['q1', 'q2'],
                    is_published: true,
                    is_free_demo: false,
                    is_live: true,
                    created_at: '2026-11-21T00:00:00Z',
                    mock_series: {
                        id: 'ser-paid-ssc',
                        name: 'SSC CGL Rankers Paid Pack',
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
            ],
            attempts: [],
            entitlements: [],
            payments: [],
        });

        render(
            <MemoryRouter initialEntries={['/mcqs/test-series/series/ser-paid-ssc']}>
                <Routes>
                    <Route
                        path="/mcqs/test-series/series/:seriesId"
                        element={<TestsListPage />}
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(
            () => {
                expect(
                    screen.getByRole('heading', { level: 3, name: 'SSC CGL 2024 Tier 1 Shift 1' })
                ).toBeTruthy();
                expect(
                    screen.getByRole('heading', { level: 3, name: 'SSC CGL Grand Expert Mock #2' })
                ).toBeTruthy();
            },
            { timeout: 4000 }
        );

        const filterGroup = screen.getByRole('group', { name: 'Filter series tests by source type' });
        fireEvent.click(within(filterGroup).getByRole('button', { name: 'PYQ Papers' }));
        expect(
            screen.getByRole('heading', { level: 3, name: 'SSC CGL 2024 Tier 1 Shift 1' })
        ).toBeTruthy();
        expect(
            screen.queryByRole('heading', { level: 3, name: 'SSC CGL Grand Expert Mock #2' })
        ).toBeNull();

        fireEvent.click(within(filterGroup).getByRole('button', { name: 'Expert Mocks' }));
        expect(
            screen.getByRole('heading', { level: 3, name: 'SSC CGL Grand Expert Mock #2' })
        ).toBeTruthy();
        expect(
            screen.queryByRole('heading', { level: 3, name: 'SSC CGL 2024 Tier 1 Shift 1' })
        ).toBeNull();

        fireEvent.click(within(filterGroup).getByRole('button', { name: 'All Types' }));

        const unlockBtn = screen.getByTestId('series-unlock-btn');
        fireEvent.click(unlockBtn);
        await waitFor(() => {
            expect(screen.getByTestId('course-checkout-dialog')).toBeTruthy();
            expect(screen.getAllByText('MF-100042').length).toBeGreaterThan(0);
        });
    });

    it('supports SSC CGL TCS iON vs Eduquity selector in TestDetailPage, fixed footer on BPSC & SSC shells, and blocks direct unpaid #/exam/:testId URL access', async () => {
        const questionFetchSpy = vi.fn();
        const sharedQuestionId = '11111111-1111-4111-8111-111111111111';
        const sharedQuestions = [
            {
                id: sharedQuestionId,
                v1_id: sharedQuestionId,
                question: 'Solve 2 + 2.',
                options: ['3', '4', '5', '6'],
                correct_answer: '4',
                subject: 'Quantitative Aptitude',
            },
        ];

        setupSupabaseTables({
            series: [
                {
                    id: 'ser-ssc-locked',
                    name: 'SSC CGL Elite Course',
                    is_premium: true,
                    price_inr: 499,
                    validity_days: 365,
                    free_demo_count: 0,
                    is_published: true,
                },
            ],
            tests: [
                {
                    id: 'test-ssc-demo',
                    series_id: 'ser-ssc-free',
                    name: 'SSC CGL Tier 1 Full Demo',
                    test_type: 'MOCK',
                    display_order: 1,
                    duration_minutes: 60,
                    total_marks: 200,
                    negative_marks: 0.5,
                    question_ids: [sharedQuestionId],
                    is_published: true,
                    is_free_demo: true,
                    mock_series: {
                        id: 'ser-ssc-free',
                        name: 'SSC CGL Tier 1 Series',
                        is_premium: false,
                        price_inr: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true },
                    },
                },
                {
                    id: 'test-bpsc-free',
                    series_id: 'ser-bpsc-free',
                    name: '71st BPSC Prelims Mock 1',
                    test_type: 'PYQ',
                    display_order: 1,
                    duration_minutes: 120,
                    total_marks: 150,
                    negative_marks: 0.33,
                    question_ids: [sharedQuestionId],
                    is_published: true,
                    mock_series: {
                        id: 'ser-bpsc-free',
                        name: 'BPSC Prelims PYQ',
                        is_premium: false,
                        price_inr: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-bpsc', name: 'BPSC', slug: 'bpsc', is_active: true },
                    },
                },
                {
                    id: 'test-ssc-paid-locked',
                    series_id: 'ser-ssc-locked',
                    name: 'SSC CGL Paid Test #5',
                    test_type: 'MOCK',
                    display_order: 5,
                    duration_minutes: 60,
                    total_marks: 200,
                    question_ids: [sharedQuestionId],
                    is_published: true,
                    is_free_demo: false,
                    mock_series: {
                        id: 'ser-ssc-locked',
                        name: 'SSC CGL Elite Course',
                        is_premium: true,
                        price_inr: 499,
                        validity_days: 365,
                        free_demo_count: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true },
                    },
                },
            ],
            questions: sharedQuestions,
            attempts: [],
            entitlements: [],
            onQuestionsFetched: questionFetchSpy,
        });

        // 1. TestDetailPage exposes SSC CGL TCS iON vs Eduquity pattern selector
        const { unmount: unmountDetail } = render(
            <MemoryRouter initialEntries={['/mcqs/test-series/test/test-ssc-demo']}>
                <Routes>
                    <Route path="/mcqs/test-series/test/:testId" element={<TestDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('ssc-cgl-cbt-skin-selector')).toBeTruthy();
        });
        const tcsOption = screen.getByTestId('cbt-skin-option-ssc_cgl_tcs_ion');
        const eduquityOption = screen.getByTestId('cbt-skin-option-ssc_cgl_eduquity');
        expect(tcsOption.getAttribute('aria-checked')).toBe('true');

        fireEvent.click(eduquityOption);
        expect(eduquityOption.getAttribute('aria-checked')).toBe('true');
        expect(localStorage.getItem('mindflow_ssc_cgl_cbt_skin_v1')).toBe('ssc_cgl_eduquity');
        unmountDetail();

        // 2. PreparedMockExamPage renders Eduquity shell with fixed footer
        const { unmount: unmountEdu } = render(
            <MemoryRouter initialEntries={['/exam/test-ssc-demo']}>
                <Routes>
                    <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('cbt-skin-eduquity')).toBeTruthy();
            expect(screen.getByTestId('eduquity-zoom-in-btn')).toBeTruthy();
        });
        expect(screen.getByTestId('cbt-skin-eduquity').className).toContain('overflow-x-clip');
        expect(document.querySelector('footer')?.className).toContain('fixed bottom-0');
        unmountEdu();

        // 3. Switch to TCS iON Classic
        localStorage.setItem('mindflow_ssc_cgl_cbt_skin_v1', 'ssc_cgl_tcs_ion');
        const { unmount: unmountTcs } = render(
            <MemoryRouter initialEntries={['/exam/test-ssc-demo']}>
                <Routes>
                    <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('cbt-skin-tcs-ion')).toBeTruthy();
            expect(screen.getByTestId('tcs-toggle-palette-btn')).toBeTruthy();
        });
        expect(document.querySelector('footer')?.className).toContain('fixed bottom-0');
        expect(screen.getByTestId('cbt-skin-tcs-ion').textContent).toContain('MF-100042');
        unmountTcs();

        // 4. BPSC keeps MindFlow default shell with fixed footer & Student ID badge
        const { unmount: unmountBpsc } = render(
            <MemoryRouter initialEntries={['/exam/test-bpsc-free']}>
                <Routes>
                    <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('cbt-save-next-btn')).toBeTruthy();
        });
        expect(screen.queryByTestId('cbt-skin-tcs-ion')).toBeNull();
        expect(screen.queryByTestId('cbt-skin-eduquity')).toBeNull();
        expect(document.querySelector('footer')?.className).toContain('fixed bottom-0');
        unmountBpsc();

        // 5. Direct #/exam/:lockedTestId URL blocks paid content without fetching questions
        questionFetchSpy.mockClear();
        render(
            <MemoryRouter initialEntries={['/exam/test-ssc-paid-locked']}>
                <Routes>
                    <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cbt-paid-lock-screen')).toBeTruthy();
        });
        expect(questionFetchSpy).not.toHaveBeenCalled();
        expect(screen.getByText(/Course Access Required/i)).toBeTruthy();
    });

    it('supports AdminFinancialsPage Student ID lookup, direct course activation, and pending UPI queue approval', async () => {
        setupSupabaseTables({
            series: [
                {
                    id: 'ser-admin-1',
                    name: 'SSC CGL Platinum Series',
                    price_inr: 499,
                    validity_days: 365,
                    is_premium: true,
                    is_published: true,
                    display_order: 1,
                },
            ],
            payments: [
                {
                    id: 'pay-pending-1',
                    created_at: '2026-11-25T12:00:00Z',
                    user_id: 'student-v383-1',
                    order_code: 'MF-261125-ABC123',
                    amount: 499,
                    currency: 'INR',
                    status: 'pending_verification',
                    plan_purchased: 'SSC CGL Platinum Series',
                    series_id: 'ser-admin-1',
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR77889900',
                    student_id_snapshot: 'MF-100042',
                },
            ],
            profiles: [
                {
                    id: 'student-v383-1',
                    full_name: 'Aarav Kumar',
                    email: 'student383@example.com',
                    student_id: 'MF-100042',
                },
            ],
        });

        rpcMock.mockImplementation((fnName: string, params: Record<string, any>) => {
            if (fnName === DB_RPCS.LOOKUP_STUDENT_FOR_ENROLLMENT) {
                return Promise.resolve({
                    data: {
                        found: true,
                        profile: {
                            id: 'student-v383-1',
                            student_id: params.p_student_id,
                            full_name: 'Aarav Kumar',
                            email: 'student383@example.com',
                            target_exam: 'SSC CGL',
                            created_at: '2026-01-01T00:00:00Z',
                        },
                        entitlements: [],
                    },
                    error: null,
                });
            }
            if (fnName === DB_RPCS.ADMIN_ACTIVATE_COURSE_ENTITLEMENT) {
                return Promise.resolve({
                    data: {
                        ok: true,
                        entitlement_id: 'ent-activated-1',
                        payment_id: params.p_payment_id ?? 'pay-adm-1',
                        order_code: 'MF-ADM-261126-XYZ',
                        user_id: 'student-v383-1',
                        student_id: params.p_student_id,
                        full_name: 'Aarav Kumar',
                        series_id: params.p_series_id,
                        series_name: 'SSC CGL Platinum Series',
                        target_route: `/mcqs/test-series/series/${params.p_series_id}`,
                        starts_at: '2026-11-26T00:00:00Z',
                        valid_until: '2027-11-26T00:00:00Z',
                        validity_days: params.p_validity_days ?? 365,
                    },
                    error: null,
                });
            }
            return Promise.resolve({ data: { ok: true }, error: null });
        });

        render(
            <MemoryRouter initialEntries={['/admin/financials']}>
                <AdminFinancialsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Pending UPI Verification Queue/i)).toBeTruthy();
            expect(screen.getAllByText('UTR77889900').length).toBeGreaterThan(0);
        });

        // 1. Lookup Student ID MF-100042 & Direct Activate
        const studentInput = screen.getByPlaceholderText(/Enter Student ID/i);
        fireEvent.change(studentInput, { target: { value: 'MF-100042' } });
        fireEvent.click(screen.getByRole('button', { name: /Lookup Student/i }));

        await waitFor(() => {
            expect(screen.getByText(/0 existing entitlements/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: /Activate Course Access/i }));
        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.ADMIN_ACTIVATE_COURSE_ENTITLEMENT, {
                p_student_id: 'MF-100042',
                p_series_id: 'ser-admin-1',
                p_validity_days: 365,
                p_payment_id: null,
                p_admin_note: null,
            });
        });

        // 2. Approve pending UPI request in queue
        fireEvent.click(screen.getByRole('button', { name: /Approve & Activate/i }));
        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.ADMIN_ACTIVATE_COURSE_ENTITLEMENT, {
                p_student_id: 'MF-100042',
                p_series_id: 'ser-admin-1',
                p_validity_days: null,
                p_payment_id: 'pay-pending-1',
                p_admin_note: null,
            });
        });
    });

    it('merges full series pricing metadata when fetchPreparedMockTestsByExam receives partial embedded series on tests', async () => {
        setupSupabaseTables({
            categories: [
                { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
            ],
            series: [
                {
                    id: 'ser-paid-merge',
                    category_id: 'cat-ssc',
                    name: 'SSC CGL Paid Tier-1',
                    slug: 'ssc-cgl-paid-tier-1',
                    is_premium: true,
                    is_published: true,
                    series_type: 'MOCK',
                    price_inr: 499,
                    mrp_inr: 999,
                    validity_days: 365,
                    free_demo_count: 1,
                    course_type: 'mock_series',
                    mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                },
            ],
            tests: [
                {
                    id: 'test-partial-embed-1',
                    series_id: 'ser-paid-merge',
                    name: 'SSC CGL Full Mock 1',
                    test_type: 'MOCK',
                    display_order: 1,
                    duration_minutes: 60,
                    total_marks: 200,
                    passing_marks: 120,
                    negative_marks: 0.5,
                    question_ids: ['q1'],
                    is_published: true,
                    is_free_demo: false,
                    // Intentionally omit price_inr/mrp_inr/free_demo_count to verify catalog merge
                    mock_series: {
                        id: 'ser-paid-merge',
                        category_id: 'cat-ssc',
                        name: 'SSC CGL Paid Tier-1',
                        is_premium: true,
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
            ],
        });

        const res = await fetchPreparedMockTestsByExam('ssc-cgl', {
            userId: 'student-v383-1',
            forceRefresh: true,
        });

        expect(res.series).toHaveLength(1);
        expect(res.series[0].price_inr).toBe(499);
        expect(res.series[0].mrp_inr).toBe(999);
        expect(res.series[0].free_demo_count).toBe(1);
        expect(res.tests).toHaveLength(1);
        expect(res.tests[0].series_price_inr).toBe(499);
    });

    it('isolates rejected and settled legacy receipts from other entitlements and maintains valid h1->h2 headings in My Purchase', async () => {
        setupSupabaseTables({
            payments: [
                {
                    id: 'pay-rejected-2',
                    user_id: 'student-v383-1',
                    series_id: 'ser-course-1',
                    order_code: 'MF-261126-REJ002',
                    amount: 599,
                    currency: 'INR',
                    status: 'rejected',
                    plan_purchased: 'SSC CGL Rankers Pass',
                    target_route: '/mcqs/test-series/series/ser-course-1',
                    validity_days: 365,
                    valid_until: null,
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR_REJECTED_999',
                    created_at: '2026-11-26T00:00:00Z',
                },
                {
                    id: 'pay-legacy-1',
                    user_id: 'student-v383-1',
                    series_id: null,
                    order_code: null,
                    amount: null,
                    currency: 'INR',
                    status: 'captured_by_client',
                    plan_purchased: 'spark',
                    payment_method: 'razorpay',
                    valid_until: null,
                    created_at: '2026-01-10T00:00:00Z',
                },
            ],
            entitlements: [
                {
                    id: 'ent-approved-1',
                    user_id: 'student-v383-1',
                    series_id: 'ser-course-1',
                    course_type: 'mock_series',
                    target_route: '/mcqs/test-series/series/ser-course-1',
                    payment_id: 'pay-different-approved-1',
                    status: 'active',
                    starts_at: '2026-11-01T00:00:00Z',
                    valid_until: '2027-11-01T00:00:00Z',
                    mock_series: {
                        id: 'ser-course-1',
                        name: 'SSC CGL Rankers Pass',
                        price_inr: 599,
                        validity_days: 365,
                    },
                },
            ],
        });

        render(
            <MemoryRouter initialEntries={[ROUTES.PURCHASED]}>
                <PurchasedCoursesPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/MF-261126-REJ002/i)).toBeTruthy();
        });

        // Rejected card must keep "Rejected / Inactive" and NOT display "Pending"
        expect(screen.getAllByText(/Rejected \/ Inactive/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/^Pending$/i)).toBeNull();

        // Heading outline must use h2 (level 2) after h1, never skipping to h3
        const headings = screen.getAllByRole('heading', { level: 2 });
        expect(headings.some((h) => /SSC CGL Rankers Pass/i.test(h.textContent ?? ''))).toBe(true);
    });

    it('preserves typed UTR input in CourseCheckoutDialog when app_ui_config resolves asynchronously', async () => {
        let resolveConfig!: (val: any) => void;
        const pendingConfigPromise = new Promise((resolve) => {
            resolveConfig = resolve;
        });

        fromMock.mockImplementation((table: string) => {
            if (table === DB_TABLES.BILLING.PAYMENTS) {
                return { select: vi.fn(() => createChain([])) };
            }
            if (table === 'app_ui_config') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn(() => pendingConfigPromise),
                        })),
                    })),
                };
            }
            return { select: vi.fn(() => createChain([])) };
        });

        render(
            <MemoryRouter>
                <CourseCheckoutDialog
                    isOpen={true}
                    onClose={vi.fn()}
                    userId="student-v383-1"
                    studentId="MF-100042"
                    series={{
                        id: 'ser-upi-test',
                        name: 'BPSC Test Course',
                        price_inr: 499,
                        validity_days: 365,
                    }}
                />
            </MemoryRouter>
        );

        const utrInput = screen.getByLabelText(/UPI Transaction Reference/i) as HTMLInputElement;
        fireEvent.change(utrInput, { target: { value: 'UTR_IN_PROGRESS_777' } });
        expect(utrInput.value).toBe('UTR_IN_PROGRESS_777');

        // Resolve app_ui_config UPI ID while user has already typed UTR
        resolveConfig({ data: { branding: { upi_id: 'mindflow.test@upi' } }, error: null });

        await waitFor(() => {
            expect(screen.getByText(/mindflow\.test@upi/i)).toBeTruthy();
        });
        expect((screen.getByLabelText(/UPI Transaction Reference/i) as HTMLInputElement).value).toBe(
            'UTR_IN_PROGRESS_777'
        );
    });

    it('shows active section count and treats empty-string answers as unanswered in TcsIonExamShell', () => {
        const questions: any[] = [
            {
                id: 'q-sec-a',
                question_text: 'Question A',
                options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
                subject: 'Quant',
            },
            {
                id: 'q-sec-b',
                question_text: 'Question B',
                options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
                subject: 'Reasoning',
            },
        ];

        const baseProps = {
            test: { id: 't-tcs-1', name: 'SSC CGL Test', total_marks: 4, negative_marks: 0.5 },
            questions,
            attemptState: {
                attemptId: 'att-1',
                testId: 't-tcs-1',
                userId: 'student-v383-1',
                status: 'in_progress' as const,
                startedAt: '2026-11-26T00:00:00Z',
                updatedAt: '2026-11-26T00:00:00Z',
                totalDurationSeconds: 1800,
                remainingSeconds: 1800,
                elapsedSeconds: 0,
                currentIndex: 0,
                answers: { 'q-sec-a': 'Opt 1', 'q-sec-b': '' },
                markedForReview: [],
                visitedQuestionIds: ['q-sec-a', 'q-sec-b'],
                timeSpentByQuestion: {},
                remotePersisted: true,
            },
            selectedAnswer: 'Opt 1',
            isCurrentMarked: false,
            activePaletteStatus: 'answered' as const,
            paletteCounts: {
                answered: 1,
                notAnswered: 1,
                markedForReview: 0,
                answeredAndMarked: 0,
                notVisited: 0,
            },
            paletteFilter: 'all' as const,
            filteredPaletteItems: [],
            setPaletteFilter: vi.fn(),
            sections: [
                {
                    id: 'sec-quant',
                    name: 'Quantitative Aptitude',
                    startIndex: 0,
                    indices: [0],
                    totalCount: 1,
                    answeredCount: 1,
                    markedCount: 0,
                    answeredAndMarkedCount: 0,
                    notAnsweredCount: 0,
                    notVisitedCount: 0,
                },
                {
                    id: 'sec-reas',
                    name: 'Reasoning',
                    startIndex: 1,
                    indices: [1],
                    totalCount: 1,
                    answeredCount: 0,
                    markedCount: 0,
                    answeredAndMarkedCount: 0,
                    notAnsweredCount: 1,
                    notVisitedCount: 0,
                },
            ],
            languageMode: 'en' as const,
            onCycleLanguage: vi.fn(),
            setLanguageMode: vi.fn(),
            hasHindiContent: false,
            zoomScale: 1,
            setZoomScale: vi.fn(),
            studentName: 'Aarav Kumar',
            studentId: 'MF-100042',
            isOfflineMode: false,
            isSubmitting: false,
            isPaletteDrawerOpen: true,
            setIsPaletteDrawerOpen: vi.fn(),
            isExitDialogOpen: false,
            setIsExitDialogOpen: vi.fn(),
            isSubmitDialogOpen: false,
            setIsSubmitDialogOpen: vi.fn(),
            formatCountdown: () => '30:00',
            onSelectOption: vi.fn(),
            onToggleMarkForReview: vi.fn(),
            onClearResponse: vi.fn(),
            onSaveAndNext: vi.fn(),
            onPrevious: vi.fn(),
            onJumpToIndex: vi.fn(),
            onConfirmPauseAndExit: vi.fn(),
            onConfirmSubmit: vi.fn(),
        };

        const { rerender } = render(
            <TcsIonExamShell
                {...baseProps}
                currentIndex={0}
                activeQuestion={questions[0]}
            />
        );

        // Must display active section ratio "1/1", NOT global "1/2"
        expect(screen.getAllByText('1/1').length).toBeGreaterThan(0);

        // Switch active section to Reasoning (q-sec-b has empty string answer '')
        rerender(
            <TcsIonExamShell
                {...baseProps}
                currentIndex={1}
                activeQuestion={questions[1]}
                selectedAnswer={undefined}
                activePaletteStatus="not_answered"
            />
        );

        expect(screen.getAllByText('0/1').length).toBeGreaterThan(0);
        const q2StatusBtns = screen.getAllByLabelText(/Question 2,/i);
        expect(q2StatusBtns.length).toBeGreaterThan(0);
        expect(q2StatusBtns.every((btn) => /Not Answered/i.test(btn.getAttribute('aria-label') ?? ''))).toBe(true);
    });

    it('guards dirty edits on Cancel in SeriesDrawer with Unsaved Changes confirmation', () => {
        const onClose = vi.fn();
        render(
            <SeriesDrawer
                isOpen={true}
                onClose={onClose}
                categories={[{ id: 'cat-1', name: 'SSC CGL' }]}
                onSave={vi.fn().mockResolvedValue(undefined)}
            />
        );

        const nameInput = screen.getByPlaceholderText(/e\.g\. SSC CGL 2026/i);
        fireEvent.change(nameInput, { target: { value: 'Unsaved Course Edit' } });

        fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getAllByText(/Unsaved Changes/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Discard Changes/i })).toBeTruthy();
    });

    it('shows Retry error state instead of false Series Not Found on network failure and recovers on Retry', async () => {
        const offlineSeriesId = 'ser-offline-retry-1';
        let rejectNetwork = true;

        fromMock.mockImplementation((table: string) => {
            if (rejectNetwork) {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockRejectedValue(new Error('Failed to fetch')),
                            single: vi.fn().mockRejectedValue(new Error('Failed to fetch')),
                            order: vi.fn().mockRejectedValue(new Error('Failed to fetch')),
                            then: (_res: any, rej: any) =>
                                Promise.reject(new Error('Failed to fetch')).then(_res, rej),
                        })),
                        then: (_res: any, rej: any) =>
                            Promise.reject(new Error('Failed to fetch')).then(_res, rej),
                    })),
                };
            }
            if (table === DB_TABLES.MOCK.SERIES) {
                return {
                    select: vi.fn(() =>
                        createChain([
                            {
                                id: offlineSeriesId,
                                category_id: 'cat-ssc',
                                name: 'SSC CGL Network Recovered Pack',
                                series_type: 'MOCK',
                                is_premium: false,
                                price_inr: 0,
                                is_published: true,
                                mock_categories: { id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true },
                            },
                        ])
                    ),
                };
            }
            if (table === DB_TABLES.MOCK.TESTS) {
                return {
                    select: vi.fn(() =>
                        createChain([
                            {
                                id: 'test-rec-1',
                                series_id: offlineSeriesId,
                                name: 'Recovered Shift 1 Paper',
                                test_type: 'PYQ',
                                display_order: 1,
                                duration_minutes: 60,
                                total_marks: 200,
                                question_ids: ['q1'],
                                is_published: true,
                                mock_series: {
                                    id: offlineSeriesId,
                                    name: 'SSC CGL Network Recovered Pack',
                                    is_published: true,
                                    mock_categories: {
                                        id: 'cat-ssc',
                                        name: 'SSC CGL',
                                        slug: 'ssc-cgl',
                                        is_active: true,
                                    },
                                },
                            },
                        ])
                    ),
                };
            }
            return { select: vi.fn(() => createChain([])) };
        });

        render(
            <MemoryRouter initialEntries={[`/mcqs/test-series/series/${offlineSeriesId}`]}>
                <Routes>
                    <Route path="/mcqs/test-series/series/:seriesId" element={<TestsListPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Could Not Load Test Series')).toBeTruthy();
        });
        expect(screen.queryByText('Series Not Found')).toBeNull();

        rejectNetwork = false;
        fireEvent.click(screen.getByRole('button', { name: /^Retry$/i }));

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { level: 1, name: 'SSC CGL Network Recovered Pack' })
            ).toBeTruthy();
            expect(screen.getByRole('heading', { level: 3, name: 'Recovered Shift 1 Paper' })).toBeTruthy();
        });
    });

    it('falls back to cached published series catalog when TestsListPage opens offline without bundle cache', async () => {
        const fallbackSeriesId = 'ser-catalog-fallback-1';
        localStorage.setItem(
            'mindflow_mock_series_catalog_v1',
            JSON.stringify({
                fetchedAt: Date.now(),
                categories: [{ id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true }],
                series: [
                    {
                        id: fallbackSeriesId,
                        category_id: 'cat-ssc',
                        name: 'SSC CGL Offline Catalog Fallback',
                        series_type: 'PYQ',
                        is_premium: false,
                        price_inr: 0,
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', slug: 'ssc-cgl', is_active: true },
                    },
                ],
                tests: [],
            })
        );

        fromMock.mockImplementation(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED')),
                    single: vi.fn().mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED')),
                    order: vi.fn().mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED')),
                    then: (_res: any, rej: any) =>
                        Promise.reject(new Error('net::ERR_INTERNET_DISCONNECTED')).then(_res, rej),
                })),
            })),
        }));

        render(
            <MemoryRouter initialEntries={[`/mcqs/test-series/series/${fallbackSeriesId}`]}>
                <Routes>
                    <Route path="/mcqs/test-series/series/:seriesId" element={<TestsListPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { level: 1, name: 'SSC CGL Offline Catalog Fallback' })
            ).toBeTruthy();
            expect(screen.getByText('Tests Unavailable Offline')).toBeTruthy();
        });
        expect(screen.queryByText('Series Not Found')).toBeNull();
    });

    it('never leaks cached questions on cold direct #/exam/:testId load when test metadata is uncached', async () => {
        const lockedTestId = 'test-cold-locked-1';
        const qId = '22222222-2222-4222-8222-222222222222';
        // Seed stale local question snapshot without cached test details
        localStorage.setItem(
            `mindflow_mock_questions_v1_${lockedTestId}`,
            JSON.stringify({
                fetchedAt: Date.now(),
                questionIds: [qId],
                questions: [
                    {
                        id: qId,
                        question: 'LEAKED SECRET PAID QUESTION',
                        options: ['A', 'B', 'C', 'D'],
                        correct_answer: 'A',
                    },
                ],
            })
        );

        let resolveTestFetch!: (val: any) => void;
        fromMock.mockImplementation((table: string) => {
            if (table === DB_TABLES.MOCK.TESTS) {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                eq: vi.fn(() => ({
                                    eq: vi.fn(() => ({
                                        maybeSingle: vi.fn(
                                            () =>
                                                new Promise((resolve) => {
                                                    resolveTestFetch = resolve;
                                                })
                                        ),
                                    })),
                                })),
                            })),
                        })),
                    })),
                };
            }
            return { select: vi.fn(() => createChain([])) };
        });

        render(
            <MemoryRouter initialEntries={[`/exam/${lockedTestId}`]}>
                <Routes>
                    <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Even while metadata request is in-flight, secret question text must NEVER render
        expect(screen.queryByText(/LEAKED SECRET PAID QUESTION/i)).toBeNull();

        await waitFor(() => {
            expect(typeof resolveTestFetch).toBe('function');
        });

        resolveTestFetch({
            data: {
                id: lockedTestId,
                series_id: 'ser-cold-paid',
                name: 'Paid Cold Test',
                duration_minutes: 60,
                total_marks: 100,
                question_ids: [qId],
                is_published: true,
                is_free_demo: false,
                mock_series: {
                    id: 'ser-cold-paid',
                    name: 'Paid Series',
                    is_premium: true,
                    price_inr: 499,
                    free_demo_count: 0,
                    is_published: true,
                    mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                },
            },
            error: null,
        });

        await waitFor(() => {
            expect(screen.getByTestId('cbt-paid-lock-screen')).toBeTruthy();
        });
        expect(screen.queryByText(/LEAKED SECRET PAID QUESTION/i)).toBeNull();
    });

    it('preserves SeriesDrawer unsaved edits when categories prop updates with a new array reference', () => {
        const catA = [{ id: 'cat-1', name: 'SSC CGL' }];
        const { rerender } = render(
            <SeriesDrawer
                isOpen={true}
                onClose={vi.fn()}
                categories={catA}
                onSave={vi.fn().mockResolvedValue(undefined)}
            />
        );

        const nameInput = screen.getByPlaceholderText(/e\.g\. SSC CGL 2026/i) as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'SSC CGL Mains Pro' } });
        expect(nameInput.value).toBe('SSC CGL Mains Pro');

        // Parent rerenders with a new categories array identity (e.g., background SWR refresh)
        rerender(
            <SeriesDrawer
                isOpen={true}
                onClose={vi.fn()}
                categories={[...catA]}
                onSave={vi.fn().mockResolvedValue(undefined)}
            />
        );

        expect((screen.getByPlaceholderText(/e\.g\. SSC CGL 2026/i) as HTMLInputElement).value).toBe(
            'SSC CGL Mains Pro'
        );
    });

    it('enforces 44px table copy button, native clipboard fallback, and Admin Note pass-through on AdminFinancialsPage', async () => {
        isNativePlatformMock.mockReturnValue(true);
        setupSupabaseTables({
            series: [
                {
                    id: 'ser-admin-2',
                    name: 'BPSC Test Pack',
                    price_inr: 299,
                    validity_days: 365,
                    is_premium: true,
                    is_published: true,
                },
            ],
            payments: [
                {
                    id: 'pay-copy-1',
                    created_at: '2026-11-26T00:00:00Z',
                    user_id: 'student-v383-1',
                    order_code: 'MF-COPY-01',
                    amount: 299,
                    currency: 'INR',
                    status: 'paid',
                    plan_purchased: 'BPSC Test Pack',
                    series_id: 'ser-admin-2',
                    payment_method: 'upi_manual',
                    upi_reference: 'UTR_COPY_44PX',
                    student_id_snapshot: 'MF-100042',
                },
            ],
            profiles: [
                {
                    id: 'student-v383-1',
                    full_name: 'Aarav Kumar',
                    email: 'student383@example.com',
                    student_id: 'MF-100042',
                },
            ],
        });

        rpcMock.mockImplementation((fnName: string, params: Record<string, any>) => {
            if (fnName === DB_RPCS.LOOKUP_STUDENT_FOR_ENROLLMENT) {
                return Promise.resolve({
                    data: {
                        found: true,
                        profile: {
                            id: 'student-v383-1',
                            student_id: params.p_student_id,
                            full_name: 'Aarav Kumar',
                            email: 'student383@example.com',
                            target_exam: 'BPSC',
                            created_at: '2026-01-01T00:00:00Z',
                        },
                        entitlements: [],
                    },
                    error: null,
                });
            }
            return Promise.resolve({
                data: { ok: true, series_name: 'BPSC Test Pack' },
                error: null,
            });
        });

        render(
            <MemoryRouter initialEntries={['/admin/financials']}>
                <AdminFinancialsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Copy reference UTR_COPY_44PX/i })).toBeTruthy();
        });

        const copyRefBtn = screen.getByRole('button', { name: /Copy reference UTR_COPY_44PX/i });
        expect(copyRefBtn.className).toContain('min-h-[44px]');
        expect(copyRefBtn.className).toContain('min-w-[44px]');

        fireEvent.click(copyRefBtn);
        await waitFor(() => {
            expect(capacitorClipboardWriteMock).toHaveBeenCalledWith({ string: 'UTR_COPY_44PX' });
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter Student ID/i), {
            target: { value: 'MF-100042' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Lookup Student/i }));

        await waitFor(() => {
            expect(screen.getByLabelText(/Admin Note \(Optional\)/i)).toBeTruthy();
        });
        fireEvent.change(screen.getByLabelText(/Admin Note \(Optional\)/i), {
            target: { value: 'Scholarship Grant #9' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Activate Course Access/i }));

        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.ADMIN_ACTIVATE_COURSE_ENTITLEMENT, {
                p_student_id: 'MF-100042',
                p_series_id: 'ser-admin-2',
                p_validity_days: 365,
                p_payment_id: null,
                p_admin_note: 'Scholarship Grant #9',
            });
        });
    });

    it('resets SwipeableTabViewport overflowX lock when pointerup completes outside track after pressing a nested rail', () => {
        render(
            <SwipeableTabViewport
                tabs={[
                    { id: 'all', label: 'All' },
                    { id: 'ssc', label: 'SSC' },
                ]}
                activeTabId="all"
                onTabChange={vi.fn()}
                ariaLabel="Test Tabs"
                renderPanel={(id) => (
                    <div data-h-rail="true" data-testid={`rail-${id}`}>
                        <button type="button">Card Inside Rail</button>
                    </div>
                )}
            />
        );

        const track = document.querySelector('.mf-swipe-track') as HTMLDivElement;
        const railBtn = screen.getByRole('button', { name: 'Card Inside Rail' });

        fireEvent.pointerDown(railBtn, { pointerType: 'mouse' });
        expect(track.style.overflowX).toBe('hidden');

        // Simulate pointer released outside trackRef (fires on window only)
        window.dispatchEvent(new Event('pointerup'));
        expect(track.style.overflowX).toBe('');
    });

    it('resets sourceFilter back to All Types when navigating between two series in TestsListPage', async () => {
        setupSupabaseTables({
            series: [
                {
                    id: 'ser-reset-a',
                    category_id: 'cat-ssc',
                    name: 'Series A',
                    series_type: 'MOCK',
                    is_premium: false,
                    is_published: true,
                    mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                },
                {
                    id: 'ser-reset-b',
                    category_id: 'cat-ssc',
                    name: 'Series B',
                    series_type: 'MOCK',
                    is_premium: false,
                    is_published: true,
                    mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                },
            ],
            tests: [
                {
                    id: 't-a-pyq',
                    series_id: 'ser-reset-a',
                    name: 'Series A PYQ Test',
                    test_type: 'PYQ',
                    display_order: 1,
                    duration_minutes: 60,
                    total_marks: 100,
                    question_ids: ['q1'],
                    is_published: true,
                    mock_series: {
                        id: 'ser-reset-a',
                        name: 'Series A',
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
                {
                    id: 't-b-mock',
                    series_id: 'ser-reset-b',
                    name: 'Series B Expert Mock',
                    test_type: 'MOCK',
                    display_order: 1,
                    duration_minutes: 60,
                    total_marks: 100,
                    question_ids: ['q1'],
                    is_published: true,
                    mock_series: {
                        id: 'ser-reset-b',
                        name: 'Series B',
                        is_published: true,
                        mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
                    },
                },
            ],
        });

        const { Link } = await import('react-router-dom');
        render(
            <MemoryRouter initialEntries={['/mcqs/test-series/series/ser-reset-a']}>
                <Link to="/mcqs/test-series/series/ser-reset-b">Go to Series B</Link>
                <Routes>
                    <Route path="/mcqs/test-series/series/:seriesId" element={<TestsListPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 3, name: 'Series A PYQ Test' })).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'PYQ Papers' }));
        expect(screen.getByRole('button', { name: 'PYQ Papers' }).getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(screen.getByRole('link', { name: 'Go to Series B' }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 3, name: 'Series B Expert Mock' })).toBeTruthy();
        });
        expect(screen.getByRole('button', { name: 'All Types' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.queryByText('No PYQ Papers Found')).toBeNull();
    });
});
