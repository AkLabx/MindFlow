import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QuizProvider, useQuizContext } from '../features/quiz/context/QuizContext';
import { useFlashcardStore } from '../features/quiz/stores/useFlashcardStore';
import { QuizLayout } from '../features/quiz/QuizLayout';
import { useAuth } from '../features/auth/context/AuthContext';
import { SynapticLoader } from '../components/ui/SynapticLoader';

// Lazy Loaded Components for Code Splitting
// Groups: Main UI, Quiz Flow, Flashcard Flow, Auth Flow
const LandingPage = lazy(() => import('../features/quiz/components/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('../features/quiz/components/Dashboard').then(m => ({ default: m.Dashboard })));
const EnglishQuizHome = lazy(() => import('../features/quiz/components/EnglishQuizHome').then(m => ({ default: m.EnglishQuizHome })));
const QuizConfig = lazy(() => import('../features/quiz/components/QuizConfig').then(m => ({ default: m.QuizConfig })));
const SavedQuizzes = lazy(() => import('../features/quiz/components/SavedQuizzes').then(m => ({ default: m.SavedQuizzes })));
const AttemptedQuizzes = lazy(() => import('../features/quiz/components/AttemptedQuizzes').then(m => ({ default: m.AttemptedQuizzes })));
const PerformanceAnalytics = lazy(() => import('../features/quiz/components/PerformanceAnalytics').then(m => ({ default: m.PerformanceAnalytics })));
const BookmarksPage = lazy(() => import('../features/quiz/components/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const IdiomsConfig = lazy(() => import('../features/idioms/IdiomsConfig').then(m => ({ default: m.IdiomsConfig })));
const OWSConfig = lazy(() => import('../features/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));
const LiveQuizRoom = lazy(() => import('../features/quiz/live/LiveQuizRoom').then(m => ({ default: m.LiveQuizRoom })));
const SynonymsConfig = lazy(() => import('../features/synonyms/SynonymsConfig').then(m => ({ default: m.SynonymsConfig })));
const SynonymFlashcardSession = lazy(() => import('../features/synonyms/components/SynonymFlashcardSession').then(m => ({ default: m.SynonymFlashcardSession })));
const SynonymClusterList = lazy(() => import('../features/synonyms/components/SynonymClusterList').then(m => ({ default: m.SynonymClusterList })));

const BlueprintPreviewWrapper = lazy(() => import('../features/quiz/components/BlueprintPreviewWrapper').then(m => ({ default: m.BlueprintPreviewWrapper })));
const ExamBlueprintsHub = lazy(() => import('../features/quiz/components/ExamBlueprintsHub').then(m => ({ default: m.ExamBlueprintsHub })));
const AdminNotifications = lazy(() => import('../features/notifications/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));

const SynonymQuizSession = lazy(() => import('../features/synonyms/components/SynonymQuizSession').then(m => ({ default: m.SynonymQuizSession })));
const SynonymPhase1Session = lazy(() => import('../features/synonyms/components/SynonymPhase1Session').then(m => ({ default: m.SynonymPhase1Session })));

const QuizResult = lazy(() => import('../features/quiz/components/QuizResult').then(m => ({ default: m.QuizResult })));
const FlashcardSummary = lazy(() => import('../features/flashcards/components/FlashcardSummary').then(m => ({ default: m.FlashcardSummary })));
const AboutUs = lazy(() => import('../features/about/components/AboutUs').then(m => ({ default: m.AboutUs })));
const DeveloperProfile = lazy(() => import('../features/about/components/DeveloperProfile').then(m => ({ default: m.DeveloperProfile })));
const TermsOfUse = lazy(() => import('../pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ToolsHome = lazy(() => import('../features/tools/ToolsHome'));
const ExamBlueprintsHub = lazy(() => import('../features/quiz/components/ExamBlueprintsHub'));

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
const FlashcardSession = lazy(() => import('../features/flashcards/components/FlashcardSession').then(m => ({ default: m.FlashcardSession })));
const OWSSession = lazy(() => import('../features/ows/components/OWSSession').then(m => ({ default: m.OWSSession })));

// Auth & User Management
const AuthPage = lazy(() => import('../features/auth/components/AuthPage'));
const ProfilePage = lazy(() => import('../features/auth/components/ProfilePage'));
const SettingsPage = lazy(() => import('../features/auth/components/SettingsPage'));
const SubscriptionPage = lazy(() => import('../features/auth/components/SubscriptionPage'));
const SupportPage = lazy(() => import('../features/auth/components/SupportPage'));

/**
 * The inner routing logic wrapped in the QuizContext context.
 *
 * Maps URL paths to components and connects navigation actions from the `useQuizContext` hook.
 */
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
    const navigate = useNavigate();
    const flashcardStore = useFlashcardStore();
    const location = useLocation();

    // Helper: Standardized navigation wrapper
    const navTo = (path: string) => navigate(path);
    // Helper: Reset state and go to Dashboard
    const navHome = () => { goHome(); navigate('/dashboard'); };

    return (
        <Suspense fallback={
            location.pathname === '/'
                ? <div className="min-h-screen w-full bg-white dark:bg-slate-900" />
                : <div className="min-h-screen flex items-center justify-center"><SynapticLoader size="xl" /></div>
        }>
            <Routes>
                {/* --- Public / Landing Route --- */}
                <Route path="/" element={
                    <LandingPage
                        onGetStarted={() => { enterHome(); navTo('/dashboard'); }}
                        onLoginClick={() => { enterLogin(); navTo('/login'); }}
                        user={user}
                        onProfileClick={() => { enterProfile(); navTo('/profile'); }}
                        onSignOut={signOut}
                    />
                } />

                {/* --- Standard Application Routes (Wrapped in QuizLayout) --- */}
                <Route element={<QuizLayout />}>
                                        <Route path="/blueprints" element={<ExamBlueprintsHub />} />
                    <Route path="/dashboard" element={
                        <Dashboard
                            onStartQuiz={() => { enterConfig(); navTo('/quiz/config'); }}
                            onEnglish={() => { enterEnglishHome(); navTo('/english'); }}
                            onBackToIntro={() => { navTo('/dashboard'); }}
                            onSavedQuizzes={() => navTo('/quiz/saved')}
                        />
                    } />
                    <Route path="/about/developer-profile" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <DeveloperProfile />
                        </Suspense>
                    } />
                    <Route path="/about/terms-of-use" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <TermsOfUse />
                        </Suspense>
                    } />
                    <Route path="/about" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <AboutUs />
                        </Suspense>
                    } />
                    <Route path="/privacy-policy" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <PrivacyPolicy />
                        </Suspense>
                    } />



                    <Route path="/english" element={
                        <EnglishQuizHome
                            onBack={() => { enterHome(); navTo('/dashboard'); }}
                            onIdiomsClick={() => { enterIdiomsConfig(); navTo('/idioms/config'); }}
                            onOWSClick={() => { enterOWSConfig(); navTo('/ows/config'); }}
                            onSynonymsClick={() => { enterSynonymsConfig(); navTo('/synonyms/config'); }}
                        />
                    } />

                    <Route path="/quiz/saved" element={<SavedQuizzes />} />
                    <Route path="/quiz/attempted" element={<AttemptedQuizzes />} />
                    <Route path="/quiz/analytics" element={<PerformanceAnalytics />} />
                    <Route path="/quiz/bookmarks" element={<BookmarksPage />} />








                    <Route path="/synonyms/config" element={
                        <SynonymsConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data: any, filters: any) => {
                                flashcardStore.startSynonyms(data, filters);
                                navTo('/synonyms/session');
                            }}
                        />
                    } />





                    <Route path="/profile" element={
                        <ProfilePage
                            onNavigateToSettings={() => navTo('/settings')}
                            onSignOut={() => { navTo('/dashboard'); }}
                        />
                    } />

                    <Route path="/settings" element={
                        <SettingsPage onBack={() => navTo('/profile')} />
                    } />

                    <Route path="/profile/subscription" element={
                        <SubscriptionPage onBack={() => navTo('/profile')} />
                    } />

                    <Route path="/profile/support" element={
                        <SupportPage onBack={() => navTo('/profile')} />
                    } />

                    <Route path="/login" element={
                        <AuthPage onBack={() => { navTo('/dashboard'); }} />
                    } />

                    <Route path="/result" element={
                        <QuizResult
                            score={state.score}
                            total={state.activeQuestions.length}
                            questions={state.activeQuestions}
                            answers={state.answers}
                            timeTaken={state.timeTaken}
                            bookmarks={state.bookmarks}
                            onRestart={() => { restartQuiz(); navTo('/quiz/config'); }}
                            onGoHome={navHome}
                        />
                    } />

                    <Route path="/flashcards/summary" element={
                        <FlashcardSummary
                            totalCards={flashcardStore.idioms.length || flashcardStore.ows.length || flashcardStore.synonyms.length || 0}
                            filters={flashcardStore.filters || {} as any}
                            onRestart={() => {
                                flashcardStore.resetSession();
                                const dest = flashcardStore.type === 'ows' ? '/ows/config' : flashcardStore.type === 'synonyms' ? '/synonyms/config' : '/idioms/config';
                                navTo(dest);
                            }}
                            onHome={() => {
                                const dest = flashcardStore.type === 'ows' ? '/ows/config' : flashcardStore.type === 'synonyms' ? '/synonyms/config' : '/idioms/config';
                                navTo(dest);
                            }}
                            backText={flashcardStore.type === 'ows' ? 'Back To OWS Config' : flashcardStore.type === 'synonyms' ? 'Back To Synonyms Config' : 'Back To Idioms Config'}
                        />
                    } />

                    <Route path="/tools" element={<ToolsHome />} />
                    <Route path="/ai" element={<AIHome />} />

                    <Route path="/ai/chat" element={<AIChatPage />} />
                    <Route path="/ai/talk" element={<AITalkPage />} />
                    <Route path="/tools/bilingual-pdf-maker" element={<BilingualPdfMaker />} />
                    <Route path="/tools/text-exporter" element={<TextExporter />} />
                    <Route path="/tools/quiz-pdf-ppt-generator" element={<QuizPdfPptGenerator />} />
                </Route>

                {/* --- Immersive Session Routes (No Layout, Fullscreen) --- */}

                    <Route path="/idioms/config" element={
                        <IdiomsConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data, filters) => {
                                flashcardStore.startIdioms(data as any, filters);
                                navTo('/flashcards/session');
                            }}
                        />
                    } />

                    <Route path="/ows/config" element={
                        <OWSConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data, filters) => {
                                flashcardStore.startOWS(data, filters);
                                navTo('/ows/session');
                            }}
                        />
                    } />


                    <Route path="/quiz/config" element={
                        <QuizConfig
                            onBack={() => { goHome(); navTo('/dashboard'); }}
                            onStart={(questions, filters, mode) => {
                                startQuiz(questions, filters, mode);
                                navTo(mode === 'mock' ? '/quiz/session/mock' : '/quiz/session/learning');
                            }}
                        />
                    } />


                {/* Learning Mode: Interactive per-question session */}
                <Route path="/quiz/live/:id" element={<LiveQuizRoom />} />

                <Route path="/quiz/session/learning" element={
                    <LearningSession
                        questions={state.activeQuestions}
                        filters={state.filters || {} as any}
                        remainingTimes={state.remainingTimes}
                        isPaused={state.isPaused}
                        currentIndex={state.currentQuestionIndex}
                        answers={state.answers}
                        bookmarks={state.bookmarks}
                        timeTaken={state.timeTaken}
                        onAnswer={answerQuestion}
                        onNext={nextQuestion}
                        onPrev={prevQuestion}
                        onJump={jumpToQuestion}
                        onToggleBookmark={toggleBookmark}
                        onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}
                        onGoHome={navHome}
                        onPause={pauseQuiz}
                        onResume={resumeQuiz}
                        onSaveTimer={saveTimer}
                        onFiftyFifty={useFiftyFifty}
                        hiddenOptions={state.hiddenOptions}
                    />
                } />

                {/* Mock Mode: Timed exam simulation */}
                <Route path="/quiz/session/mock" element={
                    <MockSession
                        questions={state.activeQuestions}
                        initialTime={state.quizTimeRemaining}
                        onPause={(timeLeft) => {
                            syncGlobalTimer(timeLeft);
                            pauseQuiz();
                            setTimeout(() => navTo('/quiz/saved'), 100);
                        }}
                        onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}
                    />
                } />

                {/* Flashcard Sessions */}
                <Route path="/flashcards/session" element={
                    <FlashcardSession
                        idioms={flashcardStore.idioms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={navHome}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />



                <Route path="/synonyms/session" element={
                    <SynonymFlashcardSession
                        data={flashcardStore.synonyms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo('/synonyms/config')}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                <Route path="/synonyms/phase1" element={<SynonymPhase1Session />} />
                <Route path="/synonyms/list" element={<SynonymClusterList data={flashcardStore.synonyms} onSelectWord={(word) => { flashcardStore.jumpToCard(flashcardStore.synonyms.findIndex(w => w.id === word.id) || 0); navTo('/synonyms/session'); }} onExit={() => navTo('/synonyms/config')} />} />
                <Route path="/synonyms/quiz" element={<SynonymQuizSession onExit={() => navTo('/synonyms/config')} />} />


                <Route path="/ows/session" element={
                    <OWSSession
                        data={flashcardStore.ows}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo('/ows/config')}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                                <Route path="/tools/flashcard-maker" element={<FlashcardMaker />} />

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/admin/notifications" element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><SynapticLoader size="md" /></div>}>
              <AdminNotifications />
            </Suspense>
          } />
        (</Routes>)
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
