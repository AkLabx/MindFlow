import { ROUTES } from '@/config';
import { NavigationManager, RouteAccessType } from '../lib/navigation';
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QuizProvider, useQuizContext } from '@/features/quiz';
import { useFlashcardStore } from '@/features/quiz';
import { QuizLayout } from '@/features/quiz';
import { useAuth } from '@/features/auth';
import { SynapticLoader } from '../components/ui/SynapticLoader';


import { ErrorBoundary } from '../providers/ErrorBoundary';
import { OnboardingFlow } from '../features/onboarding/pages/OnboardingFlow';
import { useHardwareBackButton } from '../hooks/useHardwareBackButton';
import { useNotificationStore } from '../stores/useNotificationStore';

// Lazy Loaded Components for Code Splitting
// Groups: Main UI, Quiz Flow, Flashcard Flow, Auth Flow
const CommunityFeed = lazy(() => import('../features/community/pages/CommunityFeed').then(m => ({ default: m.CommunityFeed })));
const ChatRooms = lazy(() => import('../features/community/pages/ChatRooms').then(m => ({ default: m.ChatRooms })));
const ReelsFeed = lazy(() => import('../features/community/pages/ReelsFeed').then(m => ({ default: m.ReelsFeed })));
const ReelCommentsPage = lazy(() => import('../features/community/pages/ReelCommentsPage').then(m => ({ default: m.ReelCommentsPage })));
const CommunitySearch = lazy(() => import('../features/community/pages/CommunitySearch').then(m => ({ default: m.CommunitySearch })));
const UserProfile = lazy(() => import('../features/community/pages/UserProfile').then(m => ({ default: m.UserProfile })));
const PostPage = lazy(() => import('../features/community/pages/PostPage').then(m => ({ default: m.PostPage })));



const SchoolHomePage = lazy(() => import('../pages/SchoolHomePage').then(m => ({ default: m.SchoolHomePage })));
const SchoolDownloads = lazy(() => import('../features/school/SchoolDownloads').then(m => ({ default: m.SchoolDownloads })));
import { DashboardPage as Dashboard } from '../pages/DashboardPage';
const McqsQuizHome = lazy(() => import('../pages/McqsQuizHomePage').then(m => ({ default: m.McqsQuizHomePage })));
const EnglishHub = lazy(() => import('../features/english').then(m => ({ default: m.EnglishHub })));
const QuizConfig = lazy(() => import('../features/quiz/components/QuizConfig').then(m => ({ default: m.QuizConfig })));
const QuizLibrary = lazy(() => import('../features/quiz/components/QuizLibrary').then(m => ({ default: m.QuizLibrary })));

const PerformanceAnalytics = lazy(() => import('../features/quiz/components/PerformanceAnalytics').then(m => ({ default: m.PerformanceAnalytics })));
const BookmarksPage = lazy(() => import('../pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const IdiomsConfig = lazy(() => import('../features/vocab/idioms/IdiomsConfig').then(m => ({ default: m.IdiomsConfig })));
const OWSConfig = lazy(() => import('../features/vocab/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));
const LiveQuizRoom = lazy(() => import('../features/quiz/live/LiveQuizRoom').then(m => ({ default: m.LiveQuizRoom })));
const AsciiArtHub = lazy(() => import('../features/tools/ascii-art/AsciiArtHub'));
const NumberArt = lazy(() => import('../features/tools/ascii-art/number-art/NumberArt'));
const InvisibleInk = lazy(() => import('../features/tools/ascii-art/invisible-ink/InvisibleInk'));
const MyStego = lazy(() => import('../features/tools/ascii-art/stego/MyStego'));
const SynonymsConfig = lazy(() => import('../features/vocab/synonyms/SynonymsConfig').then(m => ({ default: m.SynonymsConfig })));
const SynonymsHub = lazy(() => import('../features/vocab/synonyms/SynonymsHub').then(m => ({ default: m.SynonymsHub })));
const OWSHub = lazy(() => import('../features/vocab/ows/OWSHub').then(m => ({ default: m.OWSHub })));
const IdiomsHub = lazy(() => import('../features/vocab/idioms/IdiomsHub').then(m => ({ default: m.IdiomsHub })));
const SynonymClusterList = lazy(() => import('../features/vocab/synonyms/components/SynonymClusterList').then(m => ({ default: m.SynonymClusterList })));

const BlueprintPreviewWrapper = lazy(() => import('../features/blueprints/components/BlueprintPreviewWrapper').then(m => ({ default: m.BlueprintPreviewWrapper })));
const ExamBlueprintsHub = lazy(() => import('../pages/ExamBlueprintsHubPage').then(m => ({ default: m.ExamBlueprintsHubPage })));

const AdminReportsQueue = lazy(() => import('../features/admin/components/AdminReportsQueue').then(m => ({ default: m.AdminReportsQueue })));
const AdminHomePage = lazy(() => import('../pages/AdminHomePage').then(m => ({ default: m.AdminHomePage })));
const AppConfigHub = lazy(() => import('../features/admin/app-config/pages/AppConfigHub').then(m => ({ default: m.AppConfigHub })));
const AdminManageMaterials = lazy(() => import('../features/admin/components/AdminManageMaterials').then(m => ({ default: m.AdminManageMaterials })));
const AdminUploadGK = lazy(() => import("../features/admin/components/AdminUploadGK").then(m => ({ default: m.AdminUploadGK })));
const AdminUploadOWS = lazy(() => import("../features/admin/components/AdminUploadOWS").then(m => ({ default: m.AdminUploadOWS })));
const AdminUploadIdioms = lazy(() => import("../features/admin/components/AdminUploadIdioms").then(m => ({ default: m.AdminUploadIdioms })));
const AdminUploadSynonyms = lazy(() => import("../features/admin/components/AdminUploadSynonyms").then(m => ({ default: m.AdminUploadSynonyms })));
const AdminEnrichmentControlCenter = lazy(() => import("../features/admin/enrichment/pages/AdminEnrichmentControlCenter").then(m => ({ default: m.AdminEnrichmentControlCenter })));
const AdminUploadMaterials = lazy(() => import('../features/admin/components/AdminUploadMaterials').then(m => ({ default: m.AdminUploadMaterials })));
const AdminContentStudio = lazy(() => import("../features/admin/content/pages/AdminContentStudio").then(m => ({ default: m.AdminContentStudio })));

const AdminTestSeriesDashboard = lazy(() => import('../features/admin/test-series/pages/AdminTestSeriesDashboard').then(m => ({ default: m.AdminTestSeriesDashboard })));
const ExamCategoriesPage = lazy(() => import('../features/mock-tests/pages/ExamCategoriesPage').then(m => ({ default: m.ExamCategoriesPage })));
const TestSeriesPage = lazy(() => import('../features/mock-tests/pages/TestSeriesPage').then(m => ({ default: m.TestSeriesPage })));
const TestsListPage = lazy(() => import('../features/mock-tests/pages/TestsListPage').then(m => ({ default: m.TestsListPage })));
const TestDetailPage = lazy(() => import('../features/mock-tests/pages/TestDetailPage').then(m => ({ default: m.TestDetailPage })));
const ExamPlaceholderPage = lazy(() => import('../features/mock-tests/pages/ExamPlaceholderPage').then(m => ({ default: m.ExamPlaceholderPage })));
const AdminNotifications = lazy(() => import('../features/notifications/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

const SynonymQuizSession = lazy(() => import('../features/vocab/synonyms/components/SynonymQuizSession').then(m => ({ default: m.SynonymQuizSession })));
const SynonymPhase1Session = lazy(() => import('../features/vocab/synonyms/components/SynonymPhase1Session').then(m => ({ default: m.SynonymPhase1Session })));

const QuizResult = lazy(() => import('../features/quiz/components/QuizResult').then(m => ({ default: m.QuizResult })));
const MockQuizResult = lazy(() => import('../features/quiz/components/MockQuizResult').then(m => ({ default: m.MockQuizResult })));
const SynonymFlashcardSession = lazy(() => import("../features/vocab/synonyms/components/SynonymFlashcardSession").then(m => ({ default: m.SynonymFlashcardSession })));
const GodQuizResult = lazy(() => import('../features/quiz/components/GodQuizResult').then(m => ({ default: m.GodQuizResult })));
const FlashcardSummary = lazy(() => import('../features/flashcards/components/FlashcardSummary').then(m => ({ default: m.FlashcardSummary })));
const AboutUs = lazy(() => import('../features/about/components/AboutUs').then(m => ({ default: m.AboutUs })));
const DeveloperProfile = lazy(() => import('../features/about/components/DeveloperProfile').then(m => ({ default: m.DeveloperProfile })));
const AalokProfile = lazy(() => import('../features/about/components/AalokProfile').then(m => ({ default: m.AalokProfile })));
const TeamMemberProfile = lazy(() => import('../features/about/components/TeamMemberProfile').then(m => ({ default: m.TeamMemberProfile })));

const TermsOfUse = lazy(() => import('../pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ToolsHome = lazy(() => import('../features/tools/ToolsHome'));

const AIHome = lazy(() => import('../features/ai/AIHome').then(m => ({ default: m.AIHome })));

const AIChatPage = lazy(() => import('../features/ai/chat/AIChatPage').then(m => ({ default: m.AIChatPage })));
const AITalkPage = lazy(() => import('../features/ai/talk/AITalkPage').then(m => ({ default: m.AITalkPage })));

const QuizPdfPptGenerator = lazy(() => import('../features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator').then(module => ({ default: module.QuizPdfPptGenerator })));
const FlashcardMaker = lazy(() => import('../features/tools/flashcard-maker/FlashcardMaker'));
const BilingualPdfMaker = lazy(() => import('../features/tools/bilingual-pdf-maker/BilingualPdfMaker'));
const TextExporter = lazy(() => import('../features/tools/text-exporter/TextExporter'));

// Immersive Session Views (No standard layout)
const LearningSession = lazy(() => import('../features/quiz/learning/LearningSession').then(m => ({ default: m.LearningSession })));
const MockSession = lazy(() => import('../features/quiz/mock/MockSession').then(m => ({ default: m.MockSession })));
const GodModeSession = lazy(() => import('../features/quiz/mock/GodModeSession').then(m => ({ default: m.GodModeSession })));
const IdiomSession = lazy(() => import('../features/vocab/idioms/components/IdiomSession').then(m => ({ default: m.IdiomSession })));
const OWSSession = lazy(() => import('../features/vocab/ows/components/OWSSession').then(m => ({ default: m.OWSSession })));

// Vocab Libraries
const VocabLibraryPage = lazy(() => import('../features/vocab/components/VocabLibrary').then(m => ({ default: m.VocabLibrary })));

const DeckSessionGuard = lazy(() => import('../features/vocab/components/DeckSessionGuard').then(m => ({ default: m.DeckSessionGuard })));
const DeckSession = lazy(() => import('../features/vocab/components/DeckSession').then(m => ({ default: m.DeckSession })));
const VocabResult = lazy(() => import('../features/vocab/components/VocabResult').then(m => ({ default: m.VocabResult })));



// Auth & User Management
import AuthPage from '../features/auth/components/AuthPage';
const ProfilePage = lazy(() => import('../features/auth/components/ProfilePage'));
const SettingsPage = lazy(() => import('../features/auth/components/SettingsPage'));
const DeleteAccountPage = lazy(() => import('../features/settings/components/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })));
const SubscriptionPage = lazy(() => import('../features/auth/components/SubscriptionPage'));
const SupportPage = lazy(() => import('../features/auth/components/SupportPage'));

/**
 * The inner routing logic wrapped in the QuizContext context.
 *
 * Maps URL paths to components and connects navigation actions from the `useQuizContext` hook.
 */
import { AppPreferencesPage } from '@/features/settings';
import { MyReportsPage } from '@/features/settings';
import { QuizSessionGuard } from '@/features/quiz';
import { ResultGuard } from '@/features/quiz';
import { supabase } from '../lib/supabase';
import { ShareGatekeeper } from '@/features/quiz';

const AppRoutesContent: React.FC = () => {
    // Destructure all necessary state and actions from the global store
    const {
        state,
        enterHome, enterConfig, enterEnglishHome, enterIdiomsConfig, enterOWSConfig,
        enterSynonymsConfig,

        enterProfile, enterLogin, goToIntro, startQuiz,
         nextQuestion, prevQuestion, jumpToQuestion, submitSessionResults,
        restartQuiz, goHome, pauseQuiz, resumeQuiz, saveTimer, answerQuestion, toggleBookmark, useFiftyFifty,
        syncGlobalTimer
    } = useQuizContext();

    const { user, signOut } = useAuth();

    const handleQuizComplete = async (results: any, quizId: string) => {
        try {
            await submitSessionResults(results);
            navTo(ROUTES.RESULT.view(quizId));
        } catch (error) {
            useNotificationStore.getState().showToast({
                variant: 'error',
                message: 'Submission failed. Your progress is saved locally. Please try again.',
                duration: 5000
            });
        }
    };

    const navigate = useNavigate();
    const flashcardStore = useFlashcardStore();
    const location = useLocation();

    // Handle hardware back button for Android Native Build
    useHardwareBackButton();

    // Helper: Standardized navigation wrapper
    const navTo = (path: string) => navigate(path);
    // Helper: Reset state and go to Dashboard
    const navHome = () => { goHome(); navigate(ROUTES.DASHBOARD); };
const handleReattempt = async (quizId: string, mode: string) => {
        try {
            const { showToast } = useNotificationStore.getState();
            showToast({
                variant: 'info',
                title: 'Cloning Quiz',
                message: 'Preparing your retake...'
            });

            const { data, error } = await supabase.rpc('clone_shared_quiz', {
                p_original_quiz_id: quizId,
                p_name_suffix: ' (Retake)'
            });
            if (error) throw error;
            if (data && data.new_quiz_id) {
                navigate(`/quiz/session/${mode}/${data.new_quiz_id}`);
            }
        } catch (err: any) {
            console.error('Error reattempting quiz:', err);
            const { showToast } = useNotificationStore.getState();
            showToast({
                variant: 'error',
                title: 'Retake Failed',
                message: 'Could not create a retake session.'
            });
        }
    };

    return (
        <Suspense fallback={
            location.pathname === '/'
                ? <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950" />
                : <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950"><SynapticLoader size="xl" /></div>
        }>
            <Routes>
                {/* --- Public / Landing Route --- */}
                <Route path={ROUTES.ONBOARDING} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><OnboardingFlow /></NavigationManager>} />

                <Route path={ROUTES.HOME} element={
                    <NavigationManager type={RouteAccessType.GUEST_ONLY}>
                        <AuthPage onBack={() => {}} />
                    </NavigationManager>
                } />
                <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
                <Route path={ROUTES.SIGNUP} element={<Navigate to={ROUTES.HOME} replace />} />

                {/* --- Standard Application Routes (Wrapped in QuizLayout) --- */}
                <Route element={<QuizLayout />}>
                    <Route path={ROUTES.DASHBOARD} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><Dashboard /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.MCQS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><McqsQuizHome onBack={() => { navigate(ROUTES.DASHBOARD); }} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ENGLISH} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><EnglishHub /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.PROFILE.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><ProfilePage onNavigateToSettings={() => navigate(ROUTES.SETTINGS.ROOT)} onSignOut={() => navigate(ROUTES.DASHBOARD)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.SETTINGS.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SettingsPage onBack={() => navigate(ROUTES.PROFILE.ROOT)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.SETTINGS.MY_REPORTS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><PerformanceAnalytics /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.SETTINGS.DELETE_ACCOUNT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><DeleteAccountPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.PROFILE.SUBSCRIPTION} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SubscriptionPage onBack={() => navigate(ROUTES.PROFILE.ROOT)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.PROFILE.PREFERENCES} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><AppPreferencesPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.SYNONYMS.CONFIG} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SynonymsConfig onBack={() => { navigate(ROUTES.ENGLISH); }} onStart={(data: any, filters: any, mode: any) => { flashcardStore.startSynonyms(data, filters, mode); navigate(ROUTES.VOCAB.SYNONYMS.SESSION.root); }} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.IDIOMS.CONFIG} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><IdiomsConfig onBack={() => { navigate(ROUTES.ENGLISH); }} onStart={(data: any, filters: any, mode: any) => { flashcardStore.startIdioms(data as any, filters, mode as "basic" | "review"); navigate(ROUTES.VOCAB.IDIOMS.SESSION.root); }} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.OWS.CONFIG} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><OWSConfig onBack={() => { navigate(ROUTES.ENGLISH); }} onStart={(data: any, filters: any, mode: any) => { flashcardStore.startOWS(data, filters, mode as "basic" | "review"); navigate(ROUTES.VOCAB.OWS.SESSION.root); }} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.TEST_SERIES.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><ExamCategoriesPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.TEST_SERIES.CATEGORY(':categoryId')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><TestSeriesPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.TEST_SERIES.SERIES(':seriesId')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><TestsListPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.TEST_SERIES.TEST(':testId')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><TestDetailPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.TEST_SERIES.COMING_SOON} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><ExamPlaceholderPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.PROFILE.SUPPORT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SupportPage onBack={() => navigate(ROUTES.PROFILE.ROOT)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.QUIZ.LIBRARY} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><QuizLibrary /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.QUIZ.ANALYTICS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><PerformanceAnalytics /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.QUIZ.BOOKMARKS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><BookmarksPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.SYNONYMS.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SynonymsHub onBack={() => navigate(ROUTES.ENGLISH)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.OWS.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><OWSHub onBack={() => navigate(ROUTES.ENGLISH)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.VOCAB.IDIOMS.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><IdiomsHub onBack={() => navigate(ROUTES.ENGLISH)} /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.DEVELOPER_PROFILE} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><DeveloperProfile /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.DEVELOPER_PROFILE_AALOK} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><AalokProfile /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.DEVELOPER_PROFILE_DYNAMIC(':id')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><TeamMemberProfile /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.TERMS_OF_USE} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><TermsOfUse /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.PRIVACY_POLICY} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><PrivacyPolicy /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ABOUT.ROOT} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><AboutUs /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.RESULT.ROOT} element={
                        <ErrorBoundary><ResultGuard>
                            {state.mode === 'mock' ? (
                            <Suspense fallback={<SynapticLoader />}><MockQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        ) : state.mode === 'god' ? (
                            <Suspense fallback={<SynapticLoader />}><GodQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        ) : (
                            <Suspense fallback={<SynapticLoader />}><QuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        )
                    }
                        </ResultGuard></ErrorBoundary>
                    } />

                    <Route path={ROUTES.FLASHCARDS.SUMMARY} element={
                        <Suspense fallback={<SynapticLoader />}><FlashcardSummary
                            totalCards={flashcardStore.idioms.length || flashcardStore.ows.length || flashcardStore.synonyms.length || 0}
                            filters={flashcardStore.filters || {} as any}
                            swipeStats={flashcardStore.swipeStats}
                            mode={flashcardStore.mode}
                            flashcardType={flashcardStore.type}
                            onRestart={() => {
                                flashcardStore.resetSession();
                                const dest = flashcardStore.type === 'ows' ? '/vocab/ows/config' : flashcardStore.type === 'synonyms' ? '/vocab/synonyms/config' : '/vocab/idioms/config';
                                navTo(dest);
                            }}
                            onHome={() => {
                                const dest = flashcardStore.type === 'ows' ? '/vocab/ows/config' : flashcardStore.type === 'synonyms' ? '/vocab/synonyms/config' : '/vocab/idioms/config';
                                navTo(dest);
                            }}
                            backText={flashcardStore.type === 'ows' ? 'Back To OWS Config' : flashcardStore.type === 'synonyms' ? 'Back To Synonyms Config' : 'Back To Idioms Config'}
                        /></Suspense>
                    } />


                    {/* School Routes */}
                    <Route path={ROUTES.COMMUNITY} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary fallbackMessage="The Community feed is temporarily unavailable."><Suspense fallback={<SynapticLoader />}><CommunityFeed /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.MESSAGES} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary fallbackMessage="Messages are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ChatRooms /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.SOCIAL.REELS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary fallbackMessage="Reels are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ReelsFeed /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.SOCIAL.REELS_COMMENTS(':id')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary fallbackMessage="Comments are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ReelCommentsPage /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.SOCIAL.SEARCH} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary fallbackMessage="Search is temporarily unavailable."><Suspense fallback={<SynapticLoader />}><CommunitySearch /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.SOCIAL.USER_PROFILE(':username')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary><Suspense fallback={<SynapticLoader />}><UserProfile /></Suspense></ErrorBoundary></NavigationManager>} />
                    <Route path={ROUTES.SOCIAL.POST(':id')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><ErrorBoundary><Suspense fallback={<SynapticLoader />}><PostPage /></Suspense></ErrorBoundary></NavigationManager>} />

                    <Route path={ROUTES.SCHOOL} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SchoolHomePage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.SCHOOL_ROUTES.DOWNLOAD} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SchoolDownloads /></Suspense></NavigationManager>} />
<Route path={ROUTES.TOOLS} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><ToolsHome /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.NOTIFICATION} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><NotificationsPage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.AI} element={<Suspense fallback={<SynapticLoader />}><AIHome /></Suspense>} />

                    <Route path={ROUTES.AI_ROUTES.CHAT} element={<Suspense fallback={<SynapticLoader />}><AIChatPage /></Suspense>} />
                    <Route path={ROUTES.AI_ROUTES.TALK} element={<Suspense fallback={<SynapticLoader />}><AITalkPage /></Suspense>} />
                    <Route path={ROUTES.TOOLS_ROUTES.BILINGUAL_PDF_MAKER} element={<Suspense fallback={<SynapticLoader />}><BilingualPdfMaker /></Suspense>} />
                    <Route path={ROUTES.TOOLS_ROUTES.TEXT_EXPORTER} element={<Suspense fallback={<SynapticLoader />}><TextExporter /></Suspense>} />
                    <Route path={ROUTES.TOOLS_ROUTES.QUIZ_PDF_PPT_GENERATOR} element={<Suspense fallback={<SynapticLoader />}><QuizPdfPptGenerator /></Suspense>} />
                </Route>

                {/* --- Immersive Session Routes (No Layout, Fullscreen) --- */}


                    {/* Vocab Libraries */}
                    <Route path={ROUTES.VOCAB.OWS.LIBRARY} element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="ows" onBack={() => navTo(`${ROUTES.ENGLISH}?tab=vocabows`)} onStartDeck={(id) => { navTo(ROUTES.VOCAB.OWS.SESSION.dynamic(id)); }} /></Suspense>} />
                    <Route path={ROUTES.VOCAB.IDIOMS.LIBRARY} element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="idiom" onBack={() => navTo(`${ROUTES.ENGLISH}?tab=vocabidiom`)} onStartDeck={(id) => { navTo(ROUTES.VOCAB.IDIOMS.SESSION.dynamic(id)); }} /></Suspense>} />
                    <Route path={ROUTES.VOCAB.SYNONYMS.LIBRARY} element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="synonym" onBack={() => navTo(`${ROUTES.ENGLISH}?tab=vocabsynonyms`)} onStartDeck={(id) => { navTo(ROUTES.VOCAB.SYNONYMS.SESSION.dynamic(id)); }} /></Suspense>} />


                    <Route path={ROUTES.VOCAB.OWS.SESSION.dynamic(':deckId')} element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="ows"><DeckSession /></DeckSessionGuard></Suspense>} />
                    <Route path={ROUTES.VOCAB.IDIOMS.SESSION.dynamic(':deckId')} element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="idiom"><DeckSession /></DeckSessionGuard></Suspense>} />
                    <Route path={ROUTES.VOCAB.SYNONYMS.SESSION.dynamic(':deckId')} element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="synonym"><DeckSession /></DeckSessionGuard></Suspense>} />

                    <Route path={ROUTES.VOCAB.OWS.RESULT(':deckId')} element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="ows" /></Suspense>} />
                    <Route path={ROUTES.VOCAB.IDIOMS.RESULT(':deckId')} element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="idiom" /></Suspense>} />
                    <Route path={ROUTES.VOCAB.SYNONYMS.RESULT(':deckId')} element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="synonym" /></Suspense>} />

<Route path={ROUTES.VOCAB.IDIOMS.CONFIG} element={
                        <Suspense fallback={<SynapticLoader />}><IdiomsConfig
                            onBack={() => { enterEnglishHome(); navTo(`${ROUTES.ENGLISH}?tab=vocabidiom`); }}
                            onStart={(data, filters, mode) => {
                                flashcardStore.startIdioms(data as any, filters, mode as 'basic' | 'review');
                                navTo(ROUTES.VOCAB.IDIOMS.SESSION.root);
                            }}
                        /></Suspense>
                    } />

                    <Route path={ROUTES.VOCAB.OWS.CONFIG} element={
                        <Suspense fallback={<SynapticLoader />}><OWSConfig
                            onBack={() => { enterEnglishHome(); navTo(`${ROUTES.ENGLISH}?tab=vocabows`); }}
                            onStart={(data, filters, mode) => {
                                flashcardStore.startOWS(data, filters, mode as 'basic' | 'review');
                                navTo(ROUTES.VOCAB.OWS.SESSION.root);
                            }}
                        /></Suspense>
                    } />



                    <Route path={ROUTES.SHARE.ROOT} element={<Suspense fallback={<SynapticLoader />}><ShareGatekeeper /></Suspense>} />

                    <Route path={ROUTES.QUIZ.CONFIG} element={
                        <Suspense fallback={<SynapticLoader />}><QuizConfig
                            onBack={() => { navTo(ROUTES.MCQS); }}
                            onStart={(questions, filters, mode, quizName) => {
                                // Note: QuizConfig uses saveQuiz directly and navigates, so this might not be hit, but we pass random UUID just in case
                                startQuiz(questions, filters || ({} as any), mode, crypto.randomUUID(), quizName);
                                navTo(`/quiz/session/${mode}/${state.quizId}`);
                            }}
                        /></Suspense>
                    } />


                {/* Learning Mode: Interactive per-question session */}
                <Route path={ROUTES.QUIZ.live(':id')} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><LiveQuizRoom /></Suspense></NavigationManager>} />

                <Route path={ROUTES.QUIZ.SESSION.learning(':quizId')} element={
                    <QuizSessionGuard>
                        <LearningSession
                            questions={state.activeQuestions}
                            filters={state.filters || {} as any}
                            remainingTimes={state.remainingTimes}
                            isPaused={Boolean(state.isPaused)}
                            currentIndex={state.currentQuestionIndex}
                            answers={state.answers}
                            bookmarks={state.bookmarks}
                            timeTaken={state.timeTaken}
                            onAnswer={answerQuestion}
                            onNext={nextQuestion}
                            onPrev={prevQuestion}
                            onJump={jumpToQuestion}
                            onToggleBookmark={toggleBookmark}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                            onGoHome={navHome}
                            onPause={pauseQuiz}
                            onResume={resumeQuiz}
                            onSaveTimer={saveTimer}
                            onFiftyFifty={useFiftyFifty}
                            quizName={state.quizName}
                            hiddenOptions={state.hiddenOptions || {}}
                        />
                    </QuizSessionGuard>
                } />

                {/* Mock Mode: Timed exam simulation */}
                <Route path={ROUTES.QUIZ.SESSION.mock(':quizId')} element={
                    <QuizSessionGuard>
                        <MockSession
                            questions={state.activeQuestions}
                            initialTime={state.quizTimeRemaining}
                            onPause={(timeLeft) => {
                                syncGlobalTimer(timeLeft);
                                pauseQuiz();
                                setTimeout(() => navTo(`${ROUTES.QUIZ.LIBRARY}?tab=created`), 100);
                            }}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                        />
                    </QuizSessionGuard>
                } />

                {/* God Mode: Stricter timed blueprint simulation */}
                <Route path={ROUTES.QUIZ.SESSION.god(':quizId')} element={
                    <QuizSessionGuard>
                        <GodModeSession
                            questions={state.activeQuestions}
                            initialTime={state.quizTimeRemaining}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                        />
                    </QuizSessionGuard>
                } />

                {/* Flashcard Sessions */}
                <Route path={ROUTES.VOCAB.IDIOMS.SESSION.root} element={
                    <IdiomSession
                        data={flashcardStore.idioms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={navHome}
                        onFinish={() => { flashcardStore.finishSession(); navTo(ROUTES.FLASHCARDS.SUMMARY); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />



                <Route path={ROUTES.VOCAB.SYNONYMS.SESSION.root} element={
                    <SynonymFlashcardSession
                        data={flashcardStore.synonyms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo(ROUTES.VOCAB.SYNONYMS.ROOT)}
                        onFinish={() => { flashcardStore.finishSession(); navTo(ROUTES.FLASHCARDS.SUMMARY); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                <Route path={ROUTES.VOCAB.SYNONYMS.PHASE1} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SynonymPhase1Session /></Suspense></NavigationManager>} />
                <Route path={ROUTES.VOCAB.SYNONYMS.LIST} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SynonymClusterList data={flashcardStore.synonyms} onSelectWord={(word) => { flashcardStore.jumpToCard(flashcardStore.synonyms.findIndex(w => w.id === word.id) || 0); navTo(ROUTES.VOCAB.SYNONYMS.SESSION.root); }} onExit={() => navTo(ROUTES.VOCAB.SYNONYMS.ROOT)} /></Suspense></NavigationManager>} />
                <Route path={ROUTES.VOCAB.SYNONYMS.QUIZ} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><SynonymQuizSession onExit={() => navTo(ROUTES.VOCAB.SYNONYMS.ROOT)} /></Suspense></NavigationManager>} />


                <Route path={ROUTES.VOCAB.OWS.SESSION.root} element={
                    <OWSSession
                        data={flashcardStore.ows}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo(ROUTES.VOCAB.OWS.CONFIG)}
                        onFinish={() => { flashcardStore.finishSession(); navTo(ROUTES.FLASHCARDS.SUMMARY); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                                                                <Route path={ROUTES.TOOLS_ROUTES.FLASHCARD_MAKER} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><FlashcardMaker /></Suspense></NavigationManager>} />
                <Route path={ROUTES.TOOLS_ROUTES.ASCII_ART_HUB} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><AsciiArtHub /></Suspense></NavigationManager>} />
                <Route path={ROUTES.TOOLS_ROUTES.ASCII_ART_NUMBER} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><NumberArt /></Suspense></NavigationManager>} />
                <Route path={ROUTES.TOOLS_ROUTES.ASCII_ART_INVISIBLE_INK} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><InvisibleInk /></Suspense></NavigationManager>} />
                <Route path={ROUTES.TOOLS_ROUTES.ASCII_ART_STEGO} element={<NavigationManager type={RouteAccessType.AUTHENTICATED}><Suspense fallback={<SynapticLoader />}><MyStego /></Suspense></NavigationManager>} />

                {/* Fallback Route */}
                <Route path={ROUTES.FALLBACK} element={<Navigate to={ROUTES.HOME} replace />} />

                    <Route path={ROUTES.ADMIN.ROOT} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminHomePage /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.APP_CONFIG} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AppConfigHub /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.REPORTS} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminReportsQueue /></Suspense></NavigationManager>} />
                                        <Route path={ROUTES.ADMIN.MATERIALS} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminManageMaterials /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.UPLOAD} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminUploadMaterials /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.UPLOAD_GK} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminUploadGK /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.UPLOAD_OWS} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminUploadOWS /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.UPLOAD_IDIOMS} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminUploadIdioms /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.UPLOAD_SYNONYMS} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminUploadSynonyms /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.ENRICHMENT} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminEnrichmentControlCenter /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.TEST_SERIES} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminTestSeriesDashboard /></Suspense></NavigationManager>} />
                    <Route path={ROUTES.ADMIN.CONTENT} element={<NavigationManager type={RouteAccessType.ADMIN}><Suspense fallback={<SynapticLoader />}><AdminContentStudio /></Suspense></NavigationManager>} />
              <Route path={ROUTES.ADMIN.NOTIFICATIONS} element={
            <NavigationManager type={RouteAccessType.ADMIN}>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><SynapticLoader size="md" /></div>}>
                <AdminNotifications />
              </Suspense>
            </NavigationManager>
          } />
        </Routes>
        </Suspense>
    );
};

/**
 * The root Routes component.
 * Wraps the application routes with the QuizProvider context.
 */
export const AppRoutes: React.FC = () => {
    return (
        <QuizProvider>
            <AppRoutesContent />
        </QuizProvider>
    );
};
