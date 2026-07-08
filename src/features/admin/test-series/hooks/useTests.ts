import { useState, useEffect, useCallback } from 'react';
import { fetchTests, createTest, updateTest, deleteTest } from '../api/adminTestSeriesApi';
import toast from 'react-hot-toast';

export const useTests = (seriesId?: string) => {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTests(seriesId);
            setTests(data || []);
        } catch (error) {
            console.error('Error loading tests:', error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    }, [seriesId]);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

    const addTest = async (payload: any) => {
        try {
            const newTest = await createTest(payload);
            setTests(prev => [...prev, newTest].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
            toast.success('Test created');
            return newTest;
        } catch (error: any) {
            console.error('Create error:', error);
            toast.error(error.message || 'Failed to create test');
            throw error;
        }
    };

    const editTest = async (id: string, payload: any) => {
        try {
            const updated = await updateTest(id, payload);
            setTests(prev => prev.map(t => t.id === id ? updated : t).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
            toast.success('Test updated');
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Failed to update test');
            throw error;
        }
    };

    const removeTest = async (id: string) => {
        try {
            await deleteTest(id);
            setTests(prev => prev.filter(t => t.id !== id));
            toast.success('Test deleted');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete test');
            throw error;
        }
    };

    return { tests, loading, addTest, editTest, removeTest, refresh: loadTests };
};
