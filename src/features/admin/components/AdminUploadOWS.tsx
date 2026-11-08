import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminUploadOWS (Legacy route wrapper)
 * Redirects seamlessly to the unified Vocabulary Matrix with OWS Universal Importer open.
 */
export const AdminUploadOWS: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/admin/vocab?tab=ows&action=import', { replace: true });
    }, [navigate]);

    return null;
};
