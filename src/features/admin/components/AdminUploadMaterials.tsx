import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminUploadMaterials
 * Redirects seamlessly to the unified Study Materials Command Center with the upload tab active.
 */
export const AdminUploadMaterials: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/admin/materials?tab=upload', { replace: true });
    }, [navigate]);

    return null;
};
