/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';

const {
    getSessionMock,
    signOutMock,
    onAuthStateChangeMock,
    fromMock,
    rpcMock,
} = vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    signOutMock: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChangeMock: vi.fn(),
    fromMock: vi.fn(),
    rpcMock: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: getSessionMock,
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signOut: signOutMock,
            onAuthStateChange: onAuthStateChangeMock,
        },
        from: fromMock,
        rpc: rpcMock,
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({}),
        })),
        removeChannel: vi.fn(),
    },
}));

vi.mock('@/lib/syncService', () => ({
    syncService: {
        syncOnLogin: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        clearAllUserData: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/features/quiz/stores/useQuizSessionStore', () => ({
    useQuizSessionStore: {
        getState: () => ({ resetStore: vi.fn() }),
    },
}));

vi.mock('@/features/quiz/stores/useAnalyticsStore', () => ({
    useAnalyticsStore: { getState: () => ({ resetAnalytics: vi.fn() }) },
}));
vi.mock('@/features/quiz/stores/useFlashcardStore', () => ({
    useFlashcardStore: { getState: () => ({ resetSession: vi.fn() }) },
}));
vi.mock('@/features/quiz/stores/useSyncStore', () => ({
    useSyncStore: { getState: () => ({ resetStore: vi.fn() }) },
}));
vi.mock('@/features/quiz/stores/useBookmarkStore', () => ({
    useBookmarkStore: { getState: () => ({ resetStore: vi.fn() }) },
}));
vi.mock('@/features/community/stores/useSocialStore', () => ({
    useSocialStore: { getState: () => ({ resetStore: vi.fn() }) },
}));
vi.mock('@/features/vocab/stores/useDeckSessionStore', () => ({
    useDeckSessionStore: { getState: () => ({ resetStore: vi.fn() }) },
}));

const Probe: React.FC<{ onContext?: (ctx: ReturnType<typeof useAuth>) => void }> = ({ onContext }) => {
    const ctx = useAuth();
    onContext?.(ctx);
    return (
        <div>
            <span data-testid="probe-user">{ctx.user?.id ?? 'none'}</span>
            <span data-testid="probe-student-id">{ctx.profile?.student_id ?? 'Pending Sync'}</span>
        </div>
    );
};

describe('AuthContext profile SWR cache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        onAuthStateChangeMock.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('hydrates cached student_id offline from user-scoped localStorage and clears it on signOut', async () => {
        const userA = {
            id: 'user-a-100',
            email: 'a@mindflow.app',
            user_metadata: { full_name: 'Student A' },
        };

        getSessionMock.mockResolvedValue({
            data: { session: { user: userA, access_token: 'tok-a' } },
            error: null,
        });

        fromMock.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: {
                                    id: userA.id,
                                    student_id: 'MF-100003',
                                    full_name: 'Student A',
                                    status: 'active',
                                    delete_requested_at: null,
                                },
                                error: null,
                            }),
                        })),
                    })),
                };
            }
            return {
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    })),
                })),
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        eq: vi.fn().mockResolvedValue({ error: null }),
                    })),
                })),
            };
        });

        const qc1 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        let latestCtx: ReturnType<typeof useAuth> | null = null;

        const { unmount } = render(
            <QueryClientProvider client={qc1}>
                <AuthProvider>
                    <Probe onContext={(c) => { latestCtx = c; }} />
                </AuthProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('probe-student-id').textContent).toBe('MF-100003');
        });
        expect(localStorage.getItem('mindflow_cached_user_profile_v1')).toContain('MF-100003');
        unmount();

        // Simulate remount while offline: profiles + session tracker reject with ERR_INTERNET_DISCONNECTED
        fromMock.mockImplementation(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED')),
                })),
            })),
            upsert: vi.fn().mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED')),
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                })),
            })),
        }));

        const qc2 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={qc2}>
                <AuthProvider>
                    <Probe onContext={(c) => { latestCtx = c; }} />
                </AuthProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('probe-student-id').textContent).toBe('MF-100003');
        });

        await act(async () => {
            await latestCtx?.signOut();
        });

        await waitFor(() => {
            expect(screen.getByTestId('probe-student-id').textContent).toBe('Pending Sync');
        });
        expect(localStorage.getItem('mindflow_cached_user_profile_v1')).toBeNull();
    });

    it('isolates cached profile strictly by userId on account switch', async () => {
        localStorage.setItem(
            'mindflow_cached_user_profile_v1',
            JSON.stringify({
                userId: 'user-a-100',
                profile: { id: 'user-a-100', student_id: 'MF-100003' },
                updatedAt: Date.now(),
            })
        );
        localStorage.setItem('mindflow_last_auth_user_id', 'user-a-100');

        const userB = {
            id: 'user-b-200',
            email: 'b@mindflow.app',
            user_metadata: { full_name: 'Student B' },
        };
        getSessionMock.mockResolvedValue({
            data: { session: { user: userB, access_token: 'tok-b' } },
            error: null,
        });
        fromMock.mockImplementation(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockRejectedValue(new Error('offline')),
                })),
            })),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                })),
            })),
        }));

        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={qc}>
                <AuthProvider>
                    <Probe />
                </AuthProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('probe-user').textContent).toBe('user-b-200');
        });
        expect(screen.getByTestId('probe-student-id').textContent).toBe('Pending Sync');
        expect(localStorage.getItem('mindflow_cached_user_profile_v1')).toBeNull();
    });
});
