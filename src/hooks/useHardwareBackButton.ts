import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useQuizSessionStore } from '../features/quiz/stores/useQuizSessionStore';
import { ROUTES } from '../config/routes';

interface QuizConfigBackState {
    returnTo?: unknown;
    from?: unknown;
    fixedSubjectContext?: unknown;
    initialFilters?: {
        subject?: unknown[];
    };
}

/**
 * Resolves the deterministic hierarchical parent route for a given pathname
 * when Android hardware back is pressed (Constitution Section 4).
 */
export function resolveHardwareBackTarget(currentPath: string, locationState?: unknown): string {
    const normalized = currentPath.length > 1 ? currentPath.replace(/\/+$/, '') : currentPath;

    if (normalized === '/quiz/config') {
        const st = locationState as QuizConfigBackState | null | undefined;
        if (typeof st?.returnTo === 'string' && st.returnTo.length > 0) {
            return st.returnTo;
        }
        if (typeof st?.from === 'string' && st.from.length > 0) {
            return st.from;
        }
        const fixedSubject =
            st?.fixedSubjectContext === true ? st?.initialFilters?.subject?.[0] : undefined;
        if (typeof fixedSubject === 'string' && fixedSubject.length > 0) {
            return ROUTES.SUBJECT.view(fixedSubject);
        }
        return ROUTES.DASHBOARD || '/dashboard';
    }

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
    const examRunnerMatch = normalized.match(/^\/exam\/([^/]+)$/);
    if (examRunnerMatch) {
        const st = locationState as { returnTo?: unknown; from?: unknown } | null | undefined;
        const candidate = st?.returnTo ?? st?.from;
        if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
            return candidate;
        }
        return ROUTES.TEST_SERIES.TEST(examRunnerMatch[1]);
    }
    if (normalized.startsWith('/admin/test-series/')) {
        return '/admin/test-series?tab=tests';
    }
    if (normalized.startsWith('/mcqs/test-series/')) {
        const st = locationState as { returnTo?: unknown; from?: unknown } | null | undefined;
        const candidate = st?.returnTo ?? st?.from;
        if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
            return candidate;
        }
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

/**
 * Dismisses the topmost open overlay in strict LIFO Top-Layer precedence:
 * 1. Open auto/hint popovers (`[popover]:popover-open`)
 * 2. Topmost native modal/non-modal `<dialog open>`
 * 3. Legacy non-native dialogs, sheets, or HeadlessUI menus
 * Returns true if an overlay handled the back press.
 */
export function dismissTopmostOverlay(doc: Document = document): boolean {
    try {
        const openPopovers = Array.from(
            doc.querySelectorAll<HTMLElement>('[popover="auto"]:popover-open, [popover=""]:popover-open')
        );
        if (openPopovers.length > 0) {
            const topmostPopover = openPopovers[openPopovers.length - 1];
            topmostPopover.hidePopover?.();
            return true;
        }
    } catch {
        // Ignore engines without :popover-open selector support
    }

    const openNativeDialogs = Array.from(
        doc.querySelectorAll<HTMLDialogElement>('dialog[open]:not([data-testid="session-paused-overlay"])')
    );
    if (openNativeDialogs.length > 0) {
        const topmostDialog = openNativeDialogs[openNativeDialogs.length - 1];
        const dialogWithRequestClose = topmostDialog as HTMLDialogElement & {
            requestClose?: () => void;
        };
        if (typeof dialogWithRequestClose.requestClose === 'function') {
            dialogWithRequestClose.requestClose();
        } else {
            const cancelEvent = new Event('cancel', { cancelable: true });
            if (topmostDialog.dispatchEvent(cancelEvent)) {
                if (typeof topmostDialog.close === 'function') {
                    topmostDialog.close();
                } else {
                    topmostDialog.removeAttribute('open');
                }
            }
        }
        return true;
    }

    const activeOverlays = doc.querySelectorAll(
        '[role="dialog"], [role="alertdialog"], .modal, .bottom-sheet, [data-headlessui-state="open"]'
    );
    if (activeOverlays.length > 0) {
        doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        return true;
    }

    return false;
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
                if (dismissTopmostOverlay(document)) {
                    return;
                }

                // --- 3.5 ROUTE-LOCAL STEP / AUTH DELEGATION ---
                if (currentPath === '/onboarding' || currentPath === '/' || currentPath === '/login') {
                    return; // Step decrement and root minimization are managed locally by OnboardingFlow / AuthPage
                }

                if (currentPath.startsWith('/exam/')) {
                    const examBackEvent = new CustomEvent('mindflow:exam-back-request', { cancelable: true });
                    if (!window.dispatchEvent(examBackEvent)) {
                        return; // Active CBT runner intercepted hardware back to show exit confirmation dialog
                    }
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
                    if (quizStore.isPaused) {
                        await quizStore.goHome();
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
                const targetPath = resolveHardwareBackTarget(currentPath, location.state);

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
    }, [navigate, location.pathname, location.state]);
};
