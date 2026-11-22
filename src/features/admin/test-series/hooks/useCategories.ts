import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchExamCategories,
    createExamCategory,
    updateExamCategory,
    deleteExamCategory,
} from '../api/adminTestSeriesApi';
import { useNotification } from '@/stores/useNotificationStore';

export const useCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useNotification();
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadCategories = useCallback(async () => {
        if (isMountedRef.current) {
            setLoading(true);
        }
        try {
            const data = await fetchExamCategories();
            if (isMountedRef.current) {
                setCategories(data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            if (isMountedRef.current) {
                showToast({
                    variant: 'error',
                    title: 'Failed to Load Categories',
                    message: 'Could not load exam categories.',
                });
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [showToast]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const addCategory = useCallback(async (payload: any) => {
        try {
            const newCat = await createExamCategory(payload);
            if (isMountedRef.current) {
                setCategories((prev) =>
                    [newCat, ...prev].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                );
            }
            showToast({
                variant: 'success',
                title: 'Category Created',
                message: `"${newCat?.name || 'Category'}" created successfully.`,
            });
            return newCat;
        } catch (error: any) {
            console.error('Create error:', error);
            showToast({
                variant: 'error',
                title: 'Create Failed',
                message: error?.message || 'Failed to create category',
            });
            throw error;
        }
    }, [showToast]);

    const editCategory = useCallback(async (id: string, payload: any) => {
        try {
            const updated = await updateExamCategory(id, payload);
            if (isMountedRef.current) {
                setCategories((prev) =>
                    prev
                        .map((c) => (c.id === id ? updated : c))
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                );
            }
            showToast({
                variant: 'success',
                title: 'Category Updated',
                message: `"${updated?.name || 'Category'}" updated successfully.`,
            });
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            showToast({
                variant: 'error',
                title: 'Update Failed',
                message: error?.message || 'Failed to update category',
            });
            throw error;
        }
    }, [showToast]);

    const removeCategory = useCallback(async (id: string) => {
        try {
            await deleteExamCategory(id);
            if (isMountedRef.current) {
                setCategories((prev) => prev.filter((c) => c.id !== id));
            }
            showToast({
                variant: 'success',
                title: 'Category Deleted',
                message: 'Exam category deleted permanently.',
            });
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast({
                variant: 'error',
                title: 'Delete Failed',
                message: error?.message || 'Failed to delete category',
            });
            throw error;
        }
    }, [showToast]);

    return { categories, loading, addCategory, editCategory, removeCategory, refresh: loadCategories };
};
