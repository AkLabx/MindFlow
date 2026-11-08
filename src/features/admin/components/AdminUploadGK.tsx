import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminUploadGK (Legacy route wrapper)
 * Redirects seamlessly to the unified Question Bank with the Universal Importer open.
 */
export const AdminUploadGK: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/admin/questions?action=import', { replace: true });
    }, [navigate]);

    return null;
};
