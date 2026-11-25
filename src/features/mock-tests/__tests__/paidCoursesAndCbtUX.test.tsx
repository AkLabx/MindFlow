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
    resolveMockTestAccess,
    type UserCourseEntitlementItem,
} from '../api/mockTestsApi';
import { PurchasedCoursesPage } from '../pages/PurchasedCoursesPage';
import { TestsListPage } from '../pages/TestsListPage';
import { TestDetailPage } from '../pages/TestDetailPage';
import { PreparedMockExamPage } from '../pages/PreparedMockExamPage';
import ProfilePage from '@/features/auth/components/ProfilePage';
import { AdminFinancialsPage } from '@/features/admin/financials/pages/AdminFinancialsPage';

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
});
