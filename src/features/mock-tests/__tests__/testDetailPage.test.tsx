/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
    clearPreparedMockTestsCache,
    fetchTestDetails,
    getSavedMockTestIds,
} from '../api/mockTestsApi';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { TestDetailPage } from '../pages/TestDetailPage';

const {
    fromMock,
    getCacheEntryMock,
    setCacheEntryMock,
    shareMock,
    clipboardWriteMock,
    mockUser,
    isNativePlatformMock,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    shareMock: vi.fn(),
    clipboardWriteMock: vi.fn(),
    mockUser: { id: 'student-test-1', email: 'aspirant@example.com' },
    isNativePlatformMock: vi.fn(() => false),
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

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: isNativePlatformMock,
    },
}));

vi.mock('@capacitor/share', () => ({
    Share: {
        share: shareMock,
    },
}));

vi.mock('@capacitor/clipboard', () => ({
    Clipboard: {
        write: clipboardWriteMock,
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

const buildMockTest = (overrides: Record<string, any> = {}) => ({
    id: 'test-bpsc-69',
    series_id: 'ser-bpsc-pyq',
    name: '69th BPSC Prelims PYQs',
    description: 'Official previous year question paper with BPSC negative marking.',
    duration_minutes: 120,
    total_marks: 150,
    passing_marks: 95,
    negative_marks: 0.33,
    question_ids: new Array(103).fill('q-id'),
    is_published: true,
    release_date: '2026-11-01T00:00:00Z',
    expiry_date: '2027-01-01T00:00:00Z',
    mock_series: {
        id: 'ser-bpsc-pyq',
        name: 'BPSC Prelims PYQ Series',
        is_premium: false,
        is_published: true,
        mock_categories: {
            id: 'cat-bpsc',
            name: 'BPSC',
            is_active: true,
        },
    },
    ...overrides,
});

interface MockSupabaseConfig {
    test?: any;
    testError?: any;
    attempts?: any[];
    attemptsError?: any;
}

const setupSupabaseMocks = (config: MockSupabaseConfig) => {
    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    const executeSingle = () => {
                        if (config.testError) {
                            return Promise.resolve({ data: null, error: config.testError });
                        }
                        if (!config.test) {
                            return Promise.resolve({
                                data: null,
                                error: null,
                            });
                        }
                        return Promise.resolve({ data: config.test, error: null });
                    };
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        single: vi.fn(executeSingle),
                        maybeSingle: vi.fn(executeSingle),
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
                        order: vi.fn(() =>
                            config.attemptsError
                                ? Promise.resolve({ data: null, error: config.attemptsError })
                                : Promise.resolve({ data: config.attempts ?? [], error: null })
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

const renderTestDetail = (
    initialEntry: string | { pathname: string; state?: any } = ROUTES.TEST_SERIES.TEST('test-bpsc-69')
) =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/mcqs/test-series/test/:testId" element={<TestDetailPage />} />
                <Route path={ROUTES.TEST_SERIES.BPSC} element={<LocationDisplay />} />
                <Route path={ROUTES.TEST_SERIES.ROOT} element={<LocationDisplay />} />
                <Route path="/mcqs/test-series/series/:seriesId" element={<LocationDisplay />} />
                <Route path="/exam/:testId" element={<LocationDisplay />} />
            </Routes>
        </MemoryRouter>
    );

describe('v1.0.372 Student TestDetailPage Bug Fixes, Attempt History & Save/Share', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        clearPreparedMockTestsCache();
        useNotificationStore.setState({ toasts: [], activePopup: null });
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
        isNativePlatformMock.mockReturnValue(false);
        shareMock.mockResolvedValue(undefined);
        clipboardWriteMock.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders exact negative_marks (-0.33 and None for 0), passing_marks, duration, questions, and total marks', async () => {
        setupSupabaseMocks({
            test: buildMockTest(),
            attempts: [],
        });

        renderTestDetail();

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();
        });

        expect(screen.getByText('120 mins')).toBeTruthy();
        expect(screen.getByText('103')).toBeTruthy();
        expect(screen.getByText('150')).toBeTruthy();
        expect(screen.getByText('95')).toBeTruthy();
        expect(screen.getByText('-0.33')).toBeTruthy();
        expect(screen.getByText(/Negative marking applies: -0.33 marks/i)).toBeTruthy();

        cleanup();
        clearPreparedMockTestsCache();
        window.localStorage.clear();

        setupSupabaseMocks({
            test: buildMockTest({ id: 'test-no-neg', negative_marks: 0, passing_marks: 0 }),
            attempts: [],
        });

        renderTestDetail(ROUTES.TEST_SERIES.TEST('test-no-neg'));

        await waitFor(() => {
            expect(screen.getByText('None')).toBeTruthy();
        });
        expect(screen.getByText('N/A')).toBeTruthy();
        expect(screen.getByText(/no negative marking/i)).toBeTruthy();
    });

    it('routes <ArrowLeft /> logically via returnTo, rejects unsafe //evil.com, falls back to series, and handles not-found without navigate(-1)', async () => {
        setupSupabaseMocks({
            test: buildMockTest(),
            attempts: [],
        });

        // 1. Valid returnTo
        renderTestDetail({
            pathname: ROUTES.TEST_SERIES.TEST('test-bpsc-69'),
            state: { returnTo: ROUTES.TEST_SERIES.BPSC },
        });
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(ROUTES.TEST_SERIES.BPSC);
        });

        cleanup();

        // 2. Rejects unsafe //evil.com and falls back to series route
        renderTestDetail({
            pathname: ROUTES.TEST_SERIES.TEST('test-bpsc-69'),
            state: { returnTo: '//evil.com' },
        });
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(
                '/mcqs/test-series/series/ser-bpsc-pyq'
            );
        });

        cleanup();
        clearPreparedMockTestsCache();
        window.localStorage.clear();

        // 3. Not-found state falls back logically to ROUTES.TEST_SERIES.ROOT
        setupSupabaseMocks({ test: null });
        renderTestDetail(ROUTES.TEST_SERIES.TEST('missing-test'));
        await waitFor(() => {
            expect(screen.getByText('Test Not Found')).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('button', { name: /Back to Mock Tests/i }));
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(ROUTES.TEST_SERIES.ROOT);
        });
    });

    it('renders real DB_TABLES.MOCK.ATTEMPTS stats, Pass/Below Cutoff badges, Show all (>5), and adaptive CTA labels', async () => {
        // Case A: 0 attempts -> Start Test
        setupSupabaseMocks({
            test: buildMockTest(),
            attempts: [],
        });
        renderTestDetail();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Start Test/i })).toBeTruthy();
        });
        expect(screen.getByText(/haven't attempted this test yet/i)).toBeTruthy();
        cleanup();
        clearPreparedMockTestsCache();
        window.localStorage.clear();

        // Case B: 6 attempts including in_progress -> Resume Attempt with resumeAttemptId + Show all toggle
        const attempts = [
            {
                id: 'att-6',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-22T09:00:00Z',
                end_time: null,
                time_taken_seconds: 620,
                score: 0,
                accuracy: 0,
                status: 'in_progress',
                created_at: '2026-11-22T09:00:00Z',
                answers: { q1: 'A' },
            },
            {
                id: 'att-5',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-21T09:00:00Z',
                end_time: '2026-11-21T10:30:00Z',
                time_taken_seconds: 5400,
                score: 112,
                accuracy: 82.5,
                status: 'completed',
                created_at: '2026-11-21T09:00:00Z',
            },
            {
                id: 'att-4',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-20T09:00:00Z',
                end_time: '2026-11-20T10:15:00Z',
                time_taken_seconds: 4500,
                score: 78,
                accuracy: 61,
                status: 'completed',
                created_at: '2026-11-20T09:00:00Z',
            },
            {
                id: 'att-3',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-19T09:00:00Z',
                end_time: '2026-11-19T10:00:00Z',
                time_taken_seconds: 3600,
                score: 96,
                accuracy: 74,
                status: 'completed',
                created_at: '2026-11-19T09:00:00Z',
            },
            {
                id: 'att-2',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-18T09:00:00Z',
                end_time: '2026-11-18T10:00:00Z',
                time_taken_seconds: 3600,
                score: 88,
                accuracy: 68,
                status: 'completed',
                created_at: '2026-11-18T09:00:00Z',
            },
            {
                id: 'att-1',
                test_id: 'test-bpsc-69',
                start_time: '2026-11-17T09:00:00Z',
                end_time: '2026-11-17T10:00:00Z',
                time_taken_seconds: 3600,
                score: 64,
                accuracy: 52,
                status: 'completed',
                created_at: '2026-11-17T09:00:00Z',
            },
        ];

        setupSupabaseMocks({ test: buildMockTest(), attempts });
        renderTestDetail();

        await waitFor(() => {
            expect(screen.getByText('112/150')).toBeTruthy();
        });
        expect(screen.getAllByText('82.5%').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Passed').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Below Cutoff').length).toBeGreaterThan(0);
        expect(screen.queryByText('Attempt #1')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Show all \(6\)/i }));
        expect(screen.getByText('Attempt #1')).toBeTruthy();

        const resumeBtn = screen.getByRole('button', { name: /Resume Attempt/i });
        fireEvent.click(resumeBtn);
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toContain(
                '/exam/test-bpsc-69|'
            );
            expect(screen.getByTestId('location-display').textContent).toContain('"resumeAttemptId":"att-6"');
        });

        cleanup();
        clearPreparedMockTestsCache();
        window.localStorage.clear();

        // Case C: Completed attempts only -> Re-attempt Test
        setupSupabaseMocks({
            test: buildMockTest(),
            attempts: [attempts[1]],
        });
        renderTestDetail();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Re-attempt Test/i })).toBeTruthy();
        });
    });

    it('hydrates in 0ms from localStorage and IDB, enforces DEC-0017 expired snapshot rejection, and shows non-blocking offline retry banner', async () => {
        // 1. Seed valid cache, then fail network -> 0ms render + offline banner + Retry recovery
        setupSupabaseMocks({ test: buildMockTest(), attempts: [] });
        await fetchTestDetails('test-bpsc-69', Date.parse('2026-11-22T12:00:00Z'));

        setupSupabaseMocks({
            testError: new Error('Network unreachable'),
            attempts: [],
        });

        renderTestDetail();
        expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText(/Showing cached mock test details while offline/i)).toBeTruthy();
        });

        setupSupabaseMocks({ test: buildMockTest(), attempts: [] });
        fireEvent.click(screen.getByRole('button', { name: /^Retry$/i }));

        await waitFor(() => {
            expect(screen.queryByText(/Showing cached mock test details while offline/i)).toBeNull();
        });

        cleanup();
        clearPreparedMockTestsCache();
        window.localStorage.clear();

        // 2. Cold localStorage -> IDB hydration + DEC-0017 expired snapshot rejection
        const expiredTest = buildMockTest({
            id: 'test-expired',
            name: 'Expired Mock Test',
            expiry_date: '2025-01-01T00:00:00Z',
        });
        const validTest = buildMockTest({
            id: 'test-idb-only',
            name: 'IDB Hydrated Mock',
        });

        getCacheEntryMock.mockImplementation(async (key: string) => {
            if (key === 'mock_test_detail_v1_test-expired') {
                return { key, data: { test: expiredTest, fetchedAt: Date.now() }, updatedAt: Date.now() };
            }
            if (key === 'mock_test_detail_v1_test-idb-only') {
                return { key, data: { test: validTest, fetchedAt: Date.now() }, updatedAt: Date.now() };
            }
            return null;
        });

        setupSupabaseMocks({ testError: new Error('Offline'), attempts: [] });
        renderTestDetail(ROUTES.TEST_SERIES.TEST('test-expired'));
        await waitFor(() => {
            expect(screen.getByText('Test Not Found')).toBeTruthy();
        });

        cleanup();
        renderTestDetail(ROUTES.TEST_SERIES.TEST('test-idb-only'));
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: 'IDB Hydrated Mock' })).toBeTruthy();
        });
    });

    it('toggles Save bookmark with aria-pressed + Popover toast and handles Share (navigator.share, silent AbortError, clipboard fallback)', async () => {
        setupSupabaseMocks({ test: buildMockTest(), attempts: [] });
        renderTestDetail();

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();
        });

        // Save toggle
        const saveBtn = screen.getByRole('button', { name: /^Save$/i });
        expect(saveBtn.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(saveBtn);
        expect(saveBtn.getAttribute('aria-pressed')).toBe('true');
        expect(saveBtn.textContent).toContain('Saved');
        expect(getSavedMockTestIds(mockUser.id)).toContain('test-bpsc-69');
        expect(useNotificationStore.getState().toasts.at(-1)?.title).toBe('Test Saved');

        fireEvent.click(saveBtn);
        expect(saveBtn.getAttribute('aria-pressed')).toBe('false');
        expect(getSavedMockTestIds(mockUser.id)).not.toContain('test-bpsc-69');

        // Share via navigator.share
        const navShareMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: navShareMock,
        });
        const shareBtn = screen.getByRole('button', { name: /^Share$/i });
        fireEvent.click(shareBtn);
        await waitFor(() => {
            expect(navShareMock).toHaveBeenCalledTimes(1);
            expect(useNotificationStore.getState().toasts.at(-1)?.title).toBe('Test Shared');
        });

        // Silent AbortError
        const toastCountBeforeAbort = useNotificationStore.getState().toasts.length;
        const abortErr = new Error('User cancelled');
        abortErr.name = 'AbortError';
        navShareMock.mockRejectedValueOnce(abortErr);
        fireEvent.click(shareBtn);
        await waitFor(() => {
            expect(navShareMock).toHaveBeenCalledTimes(2);
        });
        expect(useNotificationStore.getState().toasts.length).toBe(toastCountBeforeAbort);

        // Clipboard fallback when navigator.share is unavailable
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: undefined,
        });
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeTextMock },
        });
        fireEvent.click(shareBtn);
        await waitFor(() => {
            expect(writeTextMock).toHaveBeenCalledTimes(1);
        });
        expect(useNotificationStore.getState().toasts.at(-1)?.title).toBe('Link Copied');
    });

    it('passes accessibility/touch audit (type="button", >=44px touch targets, h1->h2 outline, BrandedThumbnail span without h2)', async () => {
        setupSupabaseMocks({ test: buildMockTest(), attempts: [] });
        const { container } = renderTestDetail();

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '69th BPSC Prelims PYQs' })).toBeTruthy();
        });

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        for (const btn of buttons) {
            expect(btn.getAttribute('type')).toBe('button');
            expect(btn.className).toMatch(/min-h-\[(44|48)px\]/);
        }

        const h1s = container.querySelectorAll('h1');
        const h2s = container.querySelectorAll('h2');
        const h3s = container.querySelectorAll('h3');
        expect(h1s.length).toBe(1);
        expect(h2s.length).toBe(2);
        expect(h3s.length).toBe(0);

        const thumb = render(<BrandedThumbnail title="BPSC Prelims" type="series" />);
        expect(thumb.container.querySelector('h2')).toBeNull();
        const decorativeSpan = thumb.container.querySelector('span[aria-hidden="true"]');
        expect(decorativeSpan?.textContent).toBe('BP');
    });
});
