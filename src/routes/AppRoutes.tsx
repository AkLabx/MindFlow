import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QuizProvider, useQuizContext } from '../features/quiz/context/QuizContext';
import { QuizLayout } from '../features/quiz/QuizLayout';
import { useAuth } from '../features/auth/context/AuthContext';

// Lazy Loaded Components for Code Splitting
// Groups: Main UI, Quiz Flow, Flashcard Flow, Auth Flow
const LandingPage = lazy(() => import('../features/quiz/components/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('../features/quiz/components/Dashboard').then(m => ({ default: m.Dashboard })));
const EnglishQuizHome = lazy(() => import('../features/quiz/components/EnglishQuizHome').then(m => ({ default: m.EnglishQuizHome })));
const VocabQuizHome = lazy(() => import('../features/quiz/components/VocabQuizHome').then(m => ({ default: m.VocabQuizHome })));
const QuizConfig = lazy(() => import('../features/quiz/components/QuizConfig').then(m => ({ default: m.QuizConfig })));
const SavedQuizzes = lazy(() => import('../features/quiz/components/SavedQuizzes').then(m => ({ default: m.SavedQuizzes })));
const IdiomsConfig = lazy(() => import('../features/idioms/IdiomsConfig').then(m => ({ default: m.IdiomsConfig })));
const OWSConfig = lazy(() => import('../features/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));
const QuizResult = lazy(() => import('../features/quiz/components/QuizResult').then(m => ({ default: m.QuizResult })));
const FlashcardSummary = lazy(() => import('../features/flashcards/components/FlashcardSummary').then(m => ({ default: m.FlashcardSummary })));
const ToolsHome = lazy(() => import('../features/tools/ToolsHome'));
const FlashcardMaker = lazy(() => import('../features/tools/flashcard-maker/FlashcardMaker'));

// Immersive Session Views (No standard layout)
const LearningSession = lazy(() => import('../features/quiz/learning/LearningSession').then(m => ({ default: m.LearningSession })));
const MockSession = lazy(() => import('../features/quiz/mock/MockSession').then(m => ({ default: m.MockSession })));
const FlashcardSession = lazy(() => import('../features/flashcards/components/FlashcardSession').then(m => ({ default: m.FlashcardSession })));
const OWSSession = lazy(() => import('../features/ows/components/OWSSession').then(m => ({ default: m.OWSSession })));

// Auth & User Management
const AuthPage = lazy(() => import('../features/auth/components/AuthPage'));
const ProfilePage = lazy(() => import('../features/auth/components/ProfilePage'));
const SettingsPage = lazy(() => import('../features/auth/components/SettingsPage'));

/**
 * The inner routing logic wrapped in the QuizContext context.
 *
 * Maps URL paths to components and connects navigation actions from the `useQuizContext` hook.
 */
const AppRoutesContent: React.FC = () => {
    // Destructure all necessary state and actions from the global store
    const {
        state,
        enterHome, enterConfig, enterEnglishHome, enterVocabHome, enterIdiomsConfig, enterOWSConfig,
        enterProfile, enterLogin, goToIntro, startQuiz, startFlashcards, startOWSFlashcards,
        finishFlashcards, nextQuestion, prevQuestion, jumpToQuestion, submitSessionResults,
        restartQuiz, goHome, pauseQuiz, resumeQuiz, saveTimer, answerQuestion, toggleBookmark, useFiftyFifty,
        syncGlobalTimer
    } = useQuizContext();

    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Helper: Standardized navigation wrapper
    const navTo = (path: string) => navigate(path);
    // Helper: Reset state and go to Dashboard
    const navHome = () => { goHome(); navigate('/dashboard'); };

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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
                    <Route path="/dashboard" element={
                        <Dashboard
                            onStartQuiz={() => { enterConfig(); navTo('/quiz/config'); }}
                            onEnglish={() => { enterEnglishHome(); navTo('/english'); }}
                            onBackToIntro={() => { goToIntro(); navTo('/'); }}
                            onSavedQuizzes={() => navTo('/quiz/saved')}
                        />
                    } />

                    <Route path="/english" element={
                        <EnglishQuizHome
                            onBack={() => { enterHome(); navTo('/dashboard'); }}
                            onVocabClick={() => { enterVocabHome(); navTo('/vocab'); }}
                        />
                    } />

                    <Route path="/vocab" element={
                        <VocabQuizHome
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onIdiomsClick={() => { enterIdiomsConfig(); navTo('/idioms/config'); }}
                            onOWSClick={() => { enterOWSConfig(); navTo('/ows/config'); }}
                        />
                    } />

                    <Route path="/quiz/saved" element={<SavedQuizzes />} />

                    <Route path="/quiz/config" element={
                        <QuizConfig
                            onBack={() => { goHome(); navTo('/dashboard'); }}
                            onStart={(questions, filters, mode) => {
                                startQuiz(questions, filters, mode);
                                navTo(mode === 'mock' ? '/quiz/session/mock' : '/quiz/session/learning');
                            }}
                        />
                    } />

                    <Route path="/idioms/config" element={
                        <IdiomsConfig
                            onBack={() => { enterVocabHome(); navTo('/vocab'); }}
                            onStart={(data, filters) => {
                                startFlashcards(data as any, filters);
                                navTo('/flashcards/session');
                            }}
                        />
                    } />

                    <Route path="/ows/config" element={
                        <OWSConfig
                            onBack={() => { enterVocabHome(); navTo('/vocab'); }}
                            onStart={(data, filters) => {
                                startOWSFlashcards(data, filters);
                                navTo('/ows/session');
                            }}
                        />
                    } />

                    <Route path="/profile" element={
                        <ProfilePage onNavigateToSettings={() => navTo('/settings')} />
                    } />

                    <Route path="/settings" element={
                        <SettingsPage onBack={() => navTo('/profile')} />
                    } />

                    <Route path="/login" element={
                        <AuthPage onBack={() => { goToIntro(); navTo('/'); }} />
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
                            totalCards={state.activeOWS?.length || state.activeIdioms?.length || 0}
                            filters={state.filters || {} as any}
                            onRestart={() => { restartQuiz(); navTo(state.activeOWS ? '/ows/config' : '/idioms/config'); }}
                            onHome={navHome}
                        />
                    } />

                    <Route path="/tools" element={<ToolsHome />} />
                    <Route path="/tools/flashcard-maker" element={<FlashcardMaker />} />
                </Route>

                {/* --- Immersive Session Routes (No Layout, Fullscreen) --- */}

                {/* Learning Mode: Interactive per-question session */}
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
                        idioms={state.activeIdioms || []}
                        currentIndex={state.currentQuestionIndex}
                        onNext={nextQuestion}
                        onPrev={prevQuestion}
                        onExit={navHome}
                        onFinish={() => { finishFlashcards(); navTo('/flashcards/summary'); }}
                        filters={state.filters || {} as any}
                        onJump={jumpToQuestion}
                    />
                } />

                <Route path="/ows/session" element={
                    <OWSSession
                        data={state.activeOWS || []}
                        currentIndex={state.currentQuestionIndex}
                        onNext={nextQuestion}
                        onPrev={prevQuestion}
                        onExit={navHome}
                        onFinish={() => { finishFlashcards(); navTo('/flashcards/summary'); }}
                        filters={state.filters || {} as any}
                        onJump={jumpToQuestion}
                    />
                } />

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
