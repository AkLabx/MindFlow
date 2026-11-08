import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminUploadSynonyms (Legacy route wrapper)
 * Redirects seamlessly to the unified Vocabulary Matrix with Synonyms Universal Importer open.
 */
export const AdminUploadSynonyms: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/admin/vocab?tab=synonym&action=import', { replace: true });
    }, [navigate]);

    return null;
};
