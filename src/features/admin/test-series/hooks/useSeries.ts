import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchTestSeries,
    createTestSeries,
    updateTestSeries,
    deleteTestSeries,
} from '../api/adminTestSeriesApi';
import { useNotification } from '@/stores/useNotificationStore';

export const useSeries = (categoryId?: string) => {
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useNotification();
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadSeries = useCallback(async () => {
        if (isMountedRef.current) {
            setLoading(true);
        }
        try {
            const data = await fetchTestSeries(categoryId);
            if (isMountedRef.current) {
                setSeries(data || []);
            }
        } catch (error) {
            console.error('Error loading test series:', error);
            if (isMountedRef.current) {
                showToast({
                    variant: 'error',
                    title: 'Failed to Load Series',
                    message: 'Could not load test series.',
                });
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [categoryId, showToast]);

    useEffect(() => {
        loadSeries();
    }, [loadSeries]);

    const addSeries = useCallback(async (payload: any) => {
        try {
            const newSeries = await createTestSeries(payload);
            if (isMountedRef.current) {
                setSeries((prev) => [newSeries, ...prev]);
            }
            showToast({
                variant: 'success',
                title: 'Series Created',
                message: `"${newSeries?.name || 'Test series'}" created successfully.`,
            });
            return newSeries;
        } catch (error: any) {
            console.error('Create error:', error);
            showToast({
                variant: 'error',
                title: 'Create Failed',
                message: error?.message || 'Failed to create test series',
            });
            throw error;
        }
    }, [showToast]);

    const editSeries = useCallback(async (id: string, payload: any) => {
        try {
            const updated = await updateTestSeries(id, payload);
            if (isMountedRef.current) {
                setSeries((prev) => prev.map((s) => (s.id === id ? updated : s)));
            }
            showToast({
                variant: 'success',
                title: 'Series Updated',
                message: `"${updated?.name || 'Test series'}" updated successfully.`,
            });
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            showToast({
                variant: 'error',
                title: 'Update Failed',
                message: error?.message || 'Failed to update test series',
            });
            throw error;
        }
    }, [showToast]);

    const removeSeries = useCallback(async (id: string) => {
        try {
            await deleteTestSeries(id);
            if (isMountedRef.current) {
                setSeries((prev) => prev.filter((s) => s.id !== id));
            }
            showToast({
                variant: 'success',
                title: 'Series Deleted',
                message: 'Test series deleted permanently.',
            });
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast({
                variant: 'error',
                title: 'Delete Failed',
                message: error?.message || 'Failed to delete test series',
            });
            throw error;
        }
    }, [showToast]);

    return { series, loading, addSeries, editSeries, removeSeries, refresh: loadSeries };
};
