import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useQuizSessionStore } from '../features/quiz/stores/useQuizSessionStore';

/**
 * Resolves the deterministic hierarchical parent route for a given pathname
 * when Android hardware back is pressed (Constitution Section 4).
 */
export function resolveHardwareBackTarget(currentPath: string): string {
    const normalized = currentPath.length > 1 ? currentPath.replace(/\/+$/, '') : currentPath;

    // Level 3 -> Level 2: Subject Topics -> Subject Hub
    const quizSubjectTopicsMatch = normalized.match(/^\/quiz\/subject\/([^/]+)\/topics$/);
    if (quizSubjectTopicsMatch) {
        return `/quiz/subject/${quizSubjectTopicsMatch[1]}`;
    }

    const legacySubjectTopicsMatch = normalized.match(/^\/subject\/([^/]+)\/topics$/);
    if (legacySubjectTopicsMatch) {
        return `/subject/${legacySubjectTopicsMatch[1]}`;
    }

    // Level 2 -> Level 1: Vocab & Flashcard Drills -> English Hub
    if (
        normalized.startsWith('/vocab/') ||
        normalized.startsWith('/idioms') ||
        normalized.startsWith('/synonyms') ||
        normalized.startsWith('/ows') ||
        normalized.startsWith('/flashcards/')
    ) {
        return '/english';
    }

    // Test Series & MCQs Hierarchy
    if (normalized.startsWith('/mcqs/test-series/')) {
        return '/mcqs/test-series';
    }
    if (normalized.startsWith('/mcqs/')) {
        return '/mcqs';
    }

    // Community & Messaging Hierarchy
    if (/^\/community\/reels\/[^/]+\/comments$/.test(normalized)) {
        return '/community/reels';
    }
    if (normalized.startsWith('/community/post/') || normalized === '/community/search' || normalized.startsWith('/u/')) {
        return '/community';
    }
    if (normalized.startsWith('/messages/')) {
        return '/messages';
    }

    // Settings, Profile & About Hierarchy
    if (normalized.startsWith('/settings/')) {
        return '/settings';
    }
    if (normalized === '/settings') {
        return '/profile';
    }
    if (normalized.startsWith('/profile/')) {
        return '/profile';
    }
    if (normalized.startsWith('/about/')) {
        return '/about';
    }

    // Feature Sub-routes -> Feature Hub
    if (normalized.startsWith('/school/')) {
        return '/school';
    }
    if (normalized.startsWith('/tools/')) {
        return '/tools';
    }
    if (normalized.startsWith('/ai/')) {
        return '/ai';
    }

    return '/dashboard';
}

export const useHardwareBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const lastBackPress = useRef<number>(0);
    const isNavigating = useRef<boolean>(false);

    useEffect(() => {
        const handleBackButton = async () => {
            const currentTime = new Date().getTime();

            // --- 0. DEBOUNCE & LOCK ---
            if (isNavigating.current || currentTime - lastBackPress.current < 300) {
                return; // Ignore spam presses
            }
            isNavigating.current = true;

            try {
                const currentPath = location.pathname;

                // --- 1. KEYBOARD DISMISSAL ---
                if (document.activeElement &&
                    (document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA' ||
                     (document.activeElement as HTMLElement).isContentEditable)) {
                    (document.activeElement as HTMLElement).blur();
                    return;
                }

                // --- 2. FULLSCREEN EXIT ---
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                    return;
                }

                // --- 3. MODAL / DRAWER / OVERLAY PRIORITY ---
                const activeOverlays = document.querySelectorAll(
                    '[role="dialog"], .modal, .bottom-sheet, [data-headlessui-state="open"]'
                );
                if (activeOverlays.length > 0) {
                    // Try standard escape key for accessible dialogs
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
                    return;
                }

                // --- 4. CRITICAL WORKFLOW PROTECTION (Quiz, etc) ---
                // Wait for syncs to avoid corruption
                const quizStore = useQuizSessionStore.getState();
                if (quizStore.syncStatus === 'syncing') {
                    useNotificationStore.getState().showToast({
                        title: 'Syncing',
                        message: 'Please wait, saving progress...',
                        variant: 'info'
                    });
                    return;
                }

                if (currentPath.startsWith('/quiz/session/')) {
                    if (quizStore.status === 'quiz' && !quizStore.isPaused) {
                        quizStore.pauseQuiz();
                        useNotificationStore.getState().showToast({
                            title: 'Quiz Paused',
                            message: 'Quiz paused. Press back again to exit.',
                            variant: 'info'
                        });
                        return;
                    }
                }

                // --- 5. DASHBOARD SINGLE EXIT ROOT ---
                const exitRoots = ['/', '/dashboard'];

                if (exitRoots.includes(currentPath)) {
                    if (currentTime - lastBackPress.current < 2000) {
                        App.exitApp();
                    } else {
                        lastBackPress.current = currentTime;
                        useNotificationStore.getState().showToast({
                            title: 'Exit App',
                            message: 'Press back again to exit',
                            variant: 'info',
                            duration: 2000
                        });
                    }
                    return;
                }

                // --- 6. DETERMINISTIC HIERARCHICAL MAPPING ---
                const targetPath = resolveHardwareBackTarget(currentPath);

                // Record time for dashboard exit timeout logic and debounce
                lastBackPress.current = currentTime;

                // Navigate hierarchically (replace prevents infinite back stacks)
                navigate(targetPath, { replace: true });

            } finally {
                // Release lock after a short delay
                setTimeout(() => {
                    isNavigating.current = false;
                }, 100);
            }
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.then(l => l.remove());
        };
    }, [navigate, location.pathname]);
};
