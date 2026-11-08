import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminUploadIdioms (Legacy route wrapper)
 * Redirects seamlessly to the unified Vocabulary Matrix with Idioms Universal Importer open.
 */
export const AdminUploadIdioms: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/admin/vocab?tab=idiom&action=import', { replace: true });
    }, [navigate]);

    return null;
};
