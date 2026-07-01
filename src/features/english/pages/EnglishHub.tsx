import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralizedTabbedPage } from '../../../components/common/CentralizedTabbedPage';
import { ENGLISH_TABS } from '../constants/EnglishTabs';
import { useQuizContext } from '../../../features/quiz';

export const EnglishHub: React.FC = () => {
    const navigate = useNavigate();
    const { enterHome } = useQuizContext();

    const handleBack = useCallback(() => {
        enterHome();
        navigate('/dashboard');
    }, [enterHome, navigate]);

    const handleTabChange = useCallback((tabKey: string) => {
        // Analytics hook placeholder
        // trackEnglishTabVisit(tabKey);
        console.log(`[Analytics] Tab visited: ${tabKey}`);
    }, []);

    return (
        <CentralizedTabbedPage
            tabs={ENGLISH_TABS}
            defaultTab="vocabidiom"
            baseRoute="/english"
            onTabChange={handleTabChange}
            hideHero={true}
            stickyTabs={true}
            autoHideFooter={true}
            onBack={handleBack}
            backLabel="Back to Dashboard"
        />
    );
};
