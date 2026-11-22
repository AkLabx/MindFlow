import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchTests,
    createTest,
    updateTest,
    deleteTest,
    cloneTest,
    validateTestForPublish,
} from '../api/adminTestSeriesApi';
import { useNotification } from '@/stores/useNotificationStore';

const sortTestsDeterministically = (items: any[]) =>
    [...items].sort((a, b) => {
        const orderDiff = (Number(a?.display_order) || 0) - (Number(b?.display_order) || 0);
        if (orderDiff !== 0) return orderDiff;
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });

export const useTests = (seriesId?: string) => {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useNotification();
    const isMountedRef = useRef(true);
    const testsRef = useRef<any[]>([]);

    testsRef.current = tests;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadTests = useCallback(async () => {
        if (isMountedRef.current) {
            setLoading(true);
        }
        try {
            const data = await fetchTests(seriesId);
            if (!isMountedRef.current) return;
            const sorted = sortTestsDeterministically(data || []);
            testsRef.current = sorted;
            setTests(sorted);
        } catch (error) {
            console.error('Error loading tests:', error);
            if (isMountedRef.current) {
                showToast({
                    variant: 'error',
                    title: 'Failed to Load Tests',
                    message: 'Could not load mock tests.',
                });
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [seriesId, showToast]);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

    const addTest = useCallback(async (payload: any) => {
        try {
            const newTest = await createTest(payload);
            if (isMountedRef.current) {
                setTests((prev) => {
                    const next = sortTestsDeterministically([...prev, newTest]);
                    testsRef.current = next;
                    return next;
                });
            }
            showToast({
                variant: 'success',
                title: 'Test Created',
                message: `"${newTest?.name || 'Mock test'}" created successfully.`,
            });
            return newTest;
        } catch (error: any) {
            console.error('Create error:', error);
            showToast({
                variant: 'error',
                title: 'Create Failed',
                message: error?.message || 'Failed to create test',
            });
            throw error;
        }
    }, [showToast]);

    const editTest = useCallback(async (id: string, payload: any) => {
        try {
            const updated = await updateTest(id, payload);
            if (isMountedRef.current) {
                setTests((prev) => {
                    const next = sortTestsDeterministically(prev.map((t) => (t.id === id ? updated : t)));
                    testsRef.current = next;
                    return next;
                });
            }
            showToast({
                variant: 'success',
                title: 'Test Updated',
                message: `"${updated?.name || 'Mock test'}" updated successfully.`,
            });
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            showToast({
                variant: 'error',
                title: 'Update Failed',
                message: error?.message || 'Failed to update test',
            });
            throw error;
        }
    }, [showToast]);

    const removeTest = useCallback(async (id: string) => {
        try {
            await deleteTest(id);
            if (isMountedRef.current) {
                setTests((prev) => {
                    const next = prev.filter((t) => t.id !== id);
                    testsRef.current = next;
                    return next;
                });
            }
            showToast({
                variant: 'success',
                title: 'Test Deleted',
                message: 'Mock test deleted permanently.',
            });
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast({
                variant: 'error',
                title: 'Delete Failed',
                message: error?.message || 'Failed to delete test',
            });
            throw error;
        }
    }, [showToast]);

    const duplicateTest = useCallback(async (sourceTest: any, options?: { silent?: boolean }) => {
        try {
            const existingNames = testsRef.current.map((t) => t?.name ?? '').filter(Boolean);
            const cloned = await cloneTest(sourceTest, existingNames);
            if (isMountedRef.current) {
                setTests((prev) => {
                    const next = sortTestsDeterministically([...prev, cloned]);
                    testsRef.current = next;
                    return next;
                });
            }
            if (!options?.silent) {
                showToast({
                    variant: 'success',
                    title: 'Test Cloned',
                    message: `"${cloned?.name || 'Mock test'}" created as Draft.`,
                });
            }
            return cloned;
        } catch (error: any) {
            console.error('Clone error:', error);
            showToast({
                variant: 'error',
                title: 'Clone Failed',
                message: error?.message || 'Failed to clone test',
            });
            throw error;
        }
    }, [showToast]);

    const toggleTestPublish = useCallback(async (
        id: string,
        nextPublished: boolean,
        options?: { silent?: boolean }
    ) => {
        try {
            if (nextPublished) {
                const existingTest = testsRef.current.find((t) => t.id === id);
                if (existingTest) {
                    const validation = validateTestForPublish(existingTest);
                    if (!validation.canPublish) {
                        throw new Error(validation.reasons[0] || 'Cannot publish incomplete mock test.');
                    }
                }
            }
            const updated = await updateTest(id, { is_published: nextPublished });
            if (isMountedRef.current) {
                setTests((prev) => {
                    const next = sortTestsDeterministically(prev.map((t) => (t.id === id ? updated : t)));
                    testsRef.current = next;
                    return next;
                });
            }
            if (!options?.silent) {
                showToast({
                    variant: 'success',
                    title: nextPublished ? 'Test Published' : 'Test Moved to Draft',
                    message: `"${updated?.name || 'Mock test'}" is now ${nextPublished ? 'published' : 'in draft'}.`,
                });
            }
            return updated;
        } catch (error: any) {
            console.error('Publish toggle error:', error);
            showToast({
                variant: 'error',
                title: 'Update Failed',
                message: error?.message || 'Failed to update publish status',
            });
            throw error;
        }
    }, [showToast]);

    return {
        tests,
        loading,
        addTest,
        editTest,
        removeTest,
        duplicateTest,
        toggleTestPublish,
        refresh: loadTests,
    };
};
