/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_TABLES } from '@/config/dbTables';
import { ROUTES, getPreparedMockTestsRoute } from '@/config/routes';
import { useExamContextStore } from '@/stores/useExamContextStore';
import {
    clearPreparedMockTestsCache,
    doesTextMatchCanonicalExam,
    fetchPreparedMockTestsByExam,
    getCachedPreparedMockTestsSnapshot,
    isFullLengthMockTest,
    readPreparedMockTestsIndexedDBCache,
    resolveCanonicalExamSlug,
} from '../api/mockTestsApi';
import { ExamPreparedMockTestsPage } from '../pages/ExamPreparedMockTestsPage';
import { PreparedMockTestsShortcutCard } from '../components/PreparedMockTestsShortcutCard';

const { fromMock, getCacheEntryMock, setCacheEntryMock, mockUser } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    mockUser: { id: 'student-user-1', email: 'aspirant@example.com' },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
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
        profile: null,
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

interface MockTablesData {
    categories: any[];
    series: any[];
    tests: any[];
    attempts: any[];
    failCatalog?: boolean;
}

const setupSupabaseTables = (data: MockTablesData) => {
    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.CATEGORIES) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (data.failCatalog) {
                                return Promise.resolve({
                                    data: null,
                                    error: new Error('Network unreachable'),
                                }).then(resolve, reject);
                            }
                            return Promise.resolve({
                                data: data.categories.filter((c) => c.is_active !== false),
                                error: null,
                            }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.SERIES) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (data.failCatalog) {
                                return Promise.resolve({
                                    data: null,
                                    error: new Error('Network unreachable'),
                                }).then(resolve, reject);
                            }
                            const visibleSeries = data.series.filter((s) => {
                                const cat = data.categories.find((c) => c.id === s.category_id);
                                return s.is_published !== false && (!cat || cat.is_active !== false);
                            });
                            return Promise.resolve({ data: visibleSeries, error: null }).then(
                                resolve,
                                reject
                            );
                        },
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (data.failCatalog) {
                                return Promise.resolve({
                                    data: null,
                                    error: new Error('Network unreachable'),
                                }).then(resolve, reject);
                            }
                            const visibleTests = data.tests.filter((t) => {
                                const s = data.series.find((sr) => sr.id === t.series_id);
                                const cat = s
                                    ? data.categories.find((c) => c.id === s.category_id)
                                    : null;
                                return (
                                    t.is_published !== false &&
                                    s?.is_published !== false &&
                                    (!cat || cat.is_active !== false)
                                );
                            });
                            return Promise.resolve({ data: visibleTests, error: null }).then(
                                resolve,
                                reject
                            );
                        },
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        then: (resolve: any, reject: any) =>
                            Promise.resolve({ data: data.attempts, error: null }).then(
                                resolve,
                                reject
                            ),
                    };
                    return chain;
                }),
            };
        }

        return {
            select: vi.fn(() => ({
                then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
            })),
        };
    });
};

const NOW_MS = Date.parse('2026-11-22T12:00:00Z');

const buildFixtureData = (): MockTablesData => ({
    categories: [
        { id: 'cat-bpsc', name: 'BPSC', is_active: true, display_order: 1 },
        { id: 'cat-ssc', name: 'SSC CGL', is_active: true, display_order: 2 },
        { id: 'cat-inactive', name: 'BPSC Archived', is_active: false, display_order: 3 },
    ],
    series: [
        {
            id: 'ser-bpsc-prelims',
            category_id: 'cat-bpsc',
            name: '70th BPSC Prelims Full Series',
            slug: '70th-bpsc-prelims',
            description: 'Official pattern GS full-length & sectional papers.',
            is_premium: false,
            is_published: true,
            mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
        },
        {
            id: 'ser-bpsc-tre',
            category_id: 'cat-bpsc',
            name: 'BPSC TRE 3.0 Pro Pack',
            slug: 'bpsc-tre3-pro',
            description: 'Subject-wise teacher recruitment mocks.',
            is_premium: true,
            is_published: true,
            mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
        },
        {
            id: 'ser-ssc',
            category_id: 'cat-ssc',
            name: 'SSC CGL Tier 1',
            slug: 'ssc-cgl-tier-1',
            is_premium: false,
            is_published: true,
            mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
        },
    ],
    tests: [
        {
            id: 'test-bpsc-flt-1',
            series_id: 'ser-bpsc-prelims',
            name: 'BPSC 70th Prelims Full-Length Mock #1',
            duration_minutes: 120,
            total_marks: 150,
            passing_marks: 95,
            negative_marks: 0.33,
            question_ids: new Array(150).fill('q-id'),
            is_published: true,
            display_order: 1,
            release_date: '2026-11-20T00:00:00Z',
            expiry_date: '2026-12-30T00:00:00Z',
            mock_series: {
                id: 'ser-bpsc-prelims',
                category_id: 'cat-bpsc',
                name: '70th BPSC Prelims Full Series',
                is_premium: false,
                is_published: true,
                mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
            },
        },
        {
            id: 'test-bpsc-tre-sec',
            series_id: 'ser-bpsc-tre',
            name: 'BPSC TRE3 Bihar History Sectional',
            duration_minutes: 45,
            total_marks: 50,
            passing_marks: 30,
            negative_marks: 0,
            question_ids: new Array(50).fill('q-id'),
            is_published: true,
            display_order: 2,
            release_date: null,
            expiry_date: null,
            mock_series: {
                id: 'ser-bpsc-tre',
                category_id: 'cat-bpsc',
                name: 'BPSC TRE 3.0 Pro Pack',
                is_premium: true,
                is_published: true,
                mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
            },
        },
        {
            id: 'test-bpsc-expired',
            series_id: 'ser-bpsc-prelims',
            name: 'Expired BPSC Mock',
            duration_minutes: 120,
            total_marks: 150,
            negative_marks: 0.33,
            question_ids: ['q1'],
            is_published: true,
            release_date: '2026-10-01T00:00:00Z',
            expiry_date: '2026-11-21T00:00:00Z',
            mock_series: {
                id: 'ser-bpsc-prelims',
                category_id: 'cat-bpsc',
                name: '70th BPSC Prelims Full Series',
                is_premium: false,
                is_published: true,
                mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
            },
        },
        {
            id: 'test-bpsc-future',
            series_id: 'ser-bpsc-prelims',
            name: 'Upcoming BPSC Mock',
            duration_minutes: 120,
            total_marks: 150,
            negative_marks: 0.33,
            question_ids: ['q1'],
            is_published: true,
            release_date: '2026-11-25T00:00:00Z',
            expiry_date: null,
            mock_series: {
                id: 'ser-bpsc-prelims',
                category_id: 'cat-bpsc',
                name: '70th BPSC Prelims Full Series',
                is_premium: false,
                is_published: true,
                mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
            },
        },
        {
            id: 'test-ssc-1',
            series_id: 'ser-ssc',
            name: 'SSC CGL Tier 1 Mock #1',
            duration_minutes: 60,
            total_marks: 200,
            negative_marks: 0.5,
            question_ids: new Array(100).fill('q-id'),
            is_published: true,
            mock_series: {
                id: 'ser-ssc',
                category_id: 'cat-ssc',
                name: 'SSC CGL Tier 1',
                is_premium: false,
                is_published: true,
                mock_categories: { id: 'cat-ssc', name: 'SSC CGL', is_active: true },
            },
        },
    ],
    attempts: [{ test_id: 'test-bpsc-tre-sec', status: 'completed' }],
});

describe('v1.0.371 Dedicated BPSC Prepared Mock Tests & Canonical Routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        clearPreparedMockTestsCache();
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
        useExamContextStore.setState({ activeExamId: 'ssc_cgl', pinnedExamIds: ['ssc_cgl', 'bpsc'] });
    });

    afterEach(() => {
        cleanup();
    });

    it('resolves canonical exam slugs, aliases, and route helpers without false-matching BPSSC', () => {
        const bpsc = resolveCanonicalExamSlug('bpsc')!;
        const ssc = resolveCanonicalExamSlug('ssc-cgl')!;

        expect(bpsc.id).toBe('bpsc');
        expect(ssc.id).toBe('ssc_cgl');
        expect(getPreparedMockTestsRoute('bpsc')).toBe(ROUTES.TEST_SERIES.BPSC);
        expect(getPreparedMockTestsRoute('ssc_cgl')).toBe('/mcqs/test-series/exam/ssc_cgl');
        expect(ROUTES.TEST_SERIES.EXAM(':examSlug')).toBe('/mcqs/test-series/exam/:examSlug');

        expect(doesTextMatchCanonicalExam(bpsc, 'BPSC TRE3')).toBe(true);
        expect(doesTextMatchCanonicalExam(bpsc, '70th BPSC Prelims Full Series')).toBe(true);
        expect(doesTextMatchCanonicalExam(bpsc, 'Bihar PSC Special')).toBe(true);
        expect(doesTextMatchCanonicalExam(bpsc, 'BPSSC Bihar SI')).toBe(false);
        expect(doesTextMatchCanonicalExam(bpsc, 'SSC CGL Tier 1')).toBe(false);

        expect(isFullLengthMockTest({ name: 'Mock 1', duration_minutes: 120, question_ids: [] })).toBe(true);
        expect(isFullLengthMockTest({ name: 'Sectional GS', duration_minutes: 45, question_ids: ['1'] })).toBe(false);
    });

    it('fetches BPSC prepared mock tests from DB_TABLES.MOCK, enforces schedule windows, and hydrates 0ms cache', async () => {
        const fixture = buildFixtureData();
        setupSupabaseTables(fixture);

        const res = await fetchPreparedMockTestsByExam('bpsc', {
            userId: mockUser.id,
            nowMs: NOW_MS,
        });

        expect(res.source).toBe('network');
        expect(res.exam.id).toBe('bpsc');
        expect(res.series.map((s) => s.id)).toEqual(['ser-bpsc-prelims', 'ser-bpsc-tre']);
        expect(res.tests.map((t) => t.id)).toEqual(['test-bpsc-flt-1', 'test-bpsc-tre-sec']);

        const flt = res.tests[0];
        expect(flt.is_full_length).toBe(true);
        expect(flt.is_free).toBe(true);
        expect(flt.is_attempted).toBe(false);
        expect(flt.negative_marks).toBe(0.33);
        expect(flt.question_count).toBe(150);

        const sectional = res.tests[1];
        expect(sectional.is_full_length).toBe(false);
        expect(sectional.is_free).toBe(false);
        expect(sectional.is_attempted).toBe(true);

        // Synchronous 0ms cache snapshot returns active tests and automatically drops expired ones
        const cachedValid = getCachedPreparedMockTestsSnapshot('bpsc', {
            userId: mockUser.id,
            nowMs: NOW_MS,
        });
        expect(cachedValid?.source).toBe('cache');
        expect(cachedValid?.tests.map((t) => t.id)).toEqual(['test-bpsc-flt-1', 'test-bpsc-tre-sec']);

        const afterExpiryMs = Date.parse('2027-01-01T00:00:00Z');
        const cachedAfterExpiry = getCachedPreparedMockTestsSnapshot('bpsc', {
            userId: mockUser.id,
            nowMs: afterExpiryMs,
        });
        expect(cachedAfterExpiry?.tests.map((t) => t.id)).toEqual(['test-bpsc-tre-sec']);
    });

    it('hydrates from MindFlowDB IndexedDB fallback when localStorage snapshot is absent', async () => {
        const fixture = buildFixtureData();
        getCacheEntryMock.mockImplementation(async (key: string) => {
            if (key === 'prepared_mock_catalog_v1') {
                return {
                    key,
                    data: {
                        categories: fixture.categories,
                        series: fixture.series,
                        tests: fixture.tests,
                        fetchedAt: NOW_MS,
                    },
                    updatedAt: NOW_MS,
                };
            }
            if (key === `mock_attempts_v1_${mockUser.id}`) {
                return {
                    key,
                    data: { ids: ['test-bpsc-tre-sec'], fetchedAt: NOW_MS },
                    updatedAt: NOW_MS,
                };
            }
            return null;
        });

        const hydrated = await readPreparedMockTestsIndexedDBCache('bpsc', {
            userId: mockUser.id,
            nowMs: NOW_MS,
        });

        expect(hydrated).not.toBeNull();
        expect(hydrated?.tests.map((t) => t.id)).toEqual(['test-bpsc-flt-1', 'test-bpsc-tre-sec']);
        expect(hydrated?.tests[1].is_attempted).toBe(true);
    });

    it('renders ExamPreparedMockTestsPage with 44px touch targets, filter chips, preserved exam context, and logical back return', async () => {
        const fixture = buildFixtureData();
        setupSupabaseTables(fixture);

        useExamContextStore.setState({ activeExamId: 'bpsc' });

        render(
            <MemoryRouter
                initialEntries={[
                    { pathname: ROUTES.TEST_SERIES.BPSC, state: { returnTo: ROUTES.DASHBOARD } },
                ]}
            >
                <Routes>
                    <Route
                        path={ROUTES.TEST_SERIES.BPSC}
                        element={<ExamPreparedMockTestsPage />}
                    />
                    <Route path={ROUTES.DASHBOARD} element={<LocationDisplay />} />
                    <Route path={ROUTES.TEST_SERIES.ROOT} element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })
            ).toBeTruthy();
        });

        // Verify specs
        expect(screen.getByText('120 mins')).toBeTruthy();
        expect(screen.getByText('150 Qs')).toBeTruthy();
        expect(screen.getByText('150 Marks')).toBeTruthy();
        expect(screen.getByText('-0.33 Neg')).toBeTruthy();
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC TRE3 Bihar History Sectional' })).toBeTruthy();

        // Filter chip: Full-Length
        const filterGroup = screen.getByRole('group', { name: 'Mock test category filters' });
        const fullLengthChip = within(filterGroup).getByRole('button', { name: /Full-Length/i });
        fireEvent.click(fullLengthChip);
        expect(fullLengthChip.getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })).toBeTruthy();
        expect(screen.queryByRole('heading', { level: 3, name: 'BPSC TRE3 Bihar History Sectional' })).toBeNull();

        // Filter chip: Attempted
        const attemptedChip = within(filterGroup).getByRole('button', { name: /Attempted/i });
        fireEvent.click(attemptedChip);
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC TRE3 Bihar History Sectional' })).toBeTruthy();
        expect(
            screen.queryByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })
        ).toBeNull();

        // Search mismatch -> Reset Filters preserves useExamContextStore activeExamId (DEC-0003)
        const searchBox = screen.getByPlaceholderText('Search BPSC tests...');
        fireEvent.change(searchBox, { target: { value: 'nonexistent-query' } });
        expect(screen.getByText('No Matching Mock Tests')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
        expect(useExamContextStore.getState().activeExamId).toBe('bpsc');
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })).toBeTruthy();

        // Every button must have explicit type="button" and >=44px touch sizing
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        for (const btn of buttons) {
            expect(btn.getAttribute('type')).toBe('button');
            expect(btn.className).toMatch(/min-h-\[44px\]|py-3/);
        }

        // Logical <ArrowLeft /> back navigates to returnTo (/dashboard) without navigate(-1)
        fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toContain('/dashboard');
        });
    });

    it('hydrates 0ms from local cache even when background network fails, showing offline warning banner', async () => {
        const fixture = buildFixtureData();
        setupSupabaseTables(fixture);
        const realNow = Date.now();
        const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(realNow - 10 * 60 * 1000);
        try {
            await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, nowMs: NOW_MS });
        } finally {
            dateNowSpy.mockRestore();
        }

        // Subsequent visit while offline
        setupSupabaseTables({ ...fixture, failCatalog: true });

        render(
            <MemoryRouter initialEntries={[ROUTES.TEST_SERIES.BPSC]}>
                <Routes>
                    <Route path={ROUTES.TEST_SERIES.BPSC} element={<ExamPreparedMockTestsPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Immediately visible synchronously from cache without waiting
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText(/Showing offline cached tests/i)).toBeTruthy();
        });
    });

    it('renders actionable offline error state when catalog fails with empty cache and recovers on Retry Sync', async () => {
        const fixture = buildFixtureData();
        setupSupabaseTables({ ...fixture, failCatalog: true });

        render(
            <MemoryRouter initialEntries={[ROUTES.TEST_SERIES.BPSC]}>
                <Routes>
                    <Route path={ROUTES.TEST_SERIES.BPSC} element={<ExamPreparedMockTestsPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Could Not Load Mock Tests')).toBeTruthy();
        });

        setupSupabaseTables(fixture);
        fireEvent.click(screen.getByRole('button', { name: /Retry Sync/i }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 3, name: 'BPSC 70th Prelims Full-Length Mock #1' })).toBeTruthy();
        });
    });

    it('renders context-aware shortcut cards driven by useExamContextStore activeExamId', async () => {
        useExamContextStore.setState({ activeExamId: 'ssc_cgl' });

        render(
            <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
                <Routes>
                    <Route
                        path={ROUTES.DASHBOARD}
                        element={<PreparedMockTestsShortcutCard source="dashboard" returnTo={ROUTES.DASHBOARD} />}
                    />
                    <Route path={ROUTES.TEST_SERIES.BPSC} element={<LocationDisplay />} />
                    <Route path="/mcqs/test-series/exam/:examSlug" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('SSC CGL Prepared Mock Tests')).toBeTruthy();
        const bpscBtn = screen.getByRole('button', { name: /BPSC Mocks/i });
        expect(bpscBtn.className).toContain('min-h-[44px]');

        fireEvent.click(bpscBtn);
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toContain('/mcqs/test-series/bpsc');
        });
    });
});
