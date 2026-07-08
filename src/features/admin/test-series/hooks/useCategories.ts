import { useState, useEffect, useCallback } from 'react';
import { fetchExamCategories, createExamCategory, updateExamCategory, deleteExamCategory } from '../api/adminTestSeriesApi';
import toast from 'react-hot-toast';

export const useCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchExamCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const addCategory = async (payload: any) => {
        try {
            const newCat = await createExamCategory(payload);
            setCategories(prev => [newCat, ...prev].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
            toast.success('Category created successfully');
            return newCat;
        } catch (error: any) {
            console.error('Create error:', error);
            toast.error(error.message || 'Failed to create category');
            throw error;
        }
    };

    const editCategory = async (id: string, payload: any) => {
        try {
            const updated = await updateExamCategory(id, payload);
            setCategories(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
            toast.success('Category updated');
            return updated;
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Failed to update category');
            throw error;
        }
    };

    const removeCategory = async (id: string) => {
        try {
            await deleteExamCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete category');
            throw error;
        }
    };

    return { categories, loading, addCategory, editCategory, removeCategory, refresh: loadCategories };
};
