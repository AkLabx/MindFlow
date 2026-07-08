import { useState, useEffect, useCallback } from 'react';
import { fetchTestSeries, createTestSeries, updateTestSeries, deleteTestSeries } from '../api/adminTestSeriesApi';
import toast from 'react-hot-toast';

export const useSeries = (categoryId?: string) => {
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSeries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTestSeries(categoryId);
            setSeries(data || []);
        } catch (error) {
            console.error('Error loading test series:', error);
            toast.error('Failed to load test series');
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        loadSeries();
    }, [loadSeries]);

    const addSeries = async (payload: any) => {
        try {
            const newSeries = await createTestSeries(payload);
            setSeries(prev => [newSeries, ...prev]);
            toast.success('Test series created');
            return newSeries;
        } catch (error: any) {
            console.error('Create error:', error);
            toast.error(error.message || 'Failed to create test series');
            throw error;
        }
    };

    const editSeries = async (id: string, payload: any) => {
        try {
            const updated = await updateTestSeries(id, payload);
            setSeries(prev => prev.map(s => s.id === id ? updated : s));
            toast.success('Test series updated');
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Failed to update test series');
            throw error;
        }
    };

    const removeSeries = async (id: string) => {
        try {
            await deleteTestSeries(id);
            setSeries(prev => prev.filter(s => s.id !== id));
            toast.success('Test series deleted');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete test series');
            throw error;
        }
    };

    return { series, loading, addSeries, editSeries, removeSeries, refresh: loadSeries };
};
