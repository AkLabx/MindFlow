
import React, { useContext, useState } from 'react';
import { useQuiz } from './hooks/useQuiz';
import { QuizResult } from './components/QuizResult';
import { QuizConfig } from './components/QuizConfig';
import { LandingPage } from './components/LandingPage';
import { LearningSession } from './learning/LearningSession';
import { MockSession } from './mock/MockSession';
import { EnglishQuizHome } from './components/EnglishQuizHome';
import { VocabQuizHome } from './components/VocabQuizHome';
import { IdiomsConfig } from './components/IdiomsConfig';
import { FlashcardSession } from './components/Flashcard/FlashcardSession';
import { FlashcardSummary } from './components/Flashcard/FlashcardSummary';
import { Fireballs } from '../../components/Background/Fireballs';
import { Button } from '../../components/Button/Button';
import { ArrowRight, ListChecks, FileText, BookOpen, ArrowLeft, Download, Languages } from 'lucide-react';
import { SettingsContext } from '../../context/SettingsContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { MainLayout, TabID } from '../../layouts/MainLayout';
import { SettingsModal } from './components/ui/SettingsModal';

export const QuizContainer: React.FC = () => {
  const {
    state,
    currentQuestion,
    totalQuestions,
    enterHome,
    enterConfig,
    enterEnglishHome,
    enterVocabHome,
    enterIdiomsConfig,
    goToIntro,
    startQuiz,
    startFlashcards,
    finishFlashcards,
    // Legacy action creators - now handled inside sessions mostly, but kept for flashcards
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    submitSessionResults, // New action
    restartQuiz,
    goHome
  } = useQuiz();

  const { areBgAnimationsEnabled } = useContext(SettingsContext);
  const { canInstall, triggerInstall } = usePWAInstall();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Determine active tab for the bottom bar
  const getActiveTab = (): TabID => {
    switch (state.status) {
      case 'english-home':
      case 'vocab-home':
      case 'idioms-config':
        return 'explore';
      case 'config':
        return 'create';
      case 'flashcards-complete':
        return 'profile'; 
      default:
        return 'home';
    }
  };

  // Handle Tab Navigation
  const handleTabChange = (tab: TabID) => {
    switch (tab) {
      case 'home':
        enterHome();
        break;
      case 'explore':
        enterEnglishHome();
        break;
      case 'create':
        enterConfig();
        break;
      case 'profile':
        setIsSettingsOpen(true);
        break;
    }
  };

  // 0. Intro / Landing Page (Standalone)
  if (state.status === 'intro') {
    return (
      <>
        {areBgAnimationsEnabled && <Fireballs />}
        <LandingPage onGetStarted={enterHome} />
      </>
    );
  }

  // 1. Immersive Modes (No Header/Footer)
  if (state.status === 'quiz') {
    // Route to specific session based on mode
    if (state.mode === 'learning') {
        return (
            <LearningSession 
                questions={state.activeQuestions}
                filters={state.filters || {} as any}
                onComplete={submitSessionResults}
                onGoHome={goHome}
            />
        );
    } else if (state.mode === 'mock') {
        return (
            <MockSession 
                questions={state.activeQuestions}
                onComplete={submitSessionResults}
            />
        );
    }
  }

  if (state.status === 'flashcards') {
    return (
      <div className="relative z-10">
          <FlashcardSession 
              idioms={state.activeIdioms || []}
              currentIndex={state.currentQuestionIndex}
              onNext={nextQuestion}
              onPrev={prevQuestion}
              onExit={goHome}
              onFinish={finishFlashcards}
              filters={state.filters || {} as any}
              onJump={jumpToQuestion}
          />
      </div>
    );
  }

  // Result Page (Immersive to allow QuizReview to handle its own layout without app header/footer interference)
  if (state.status === 'result') {
    return (
      <div className="min-h-screen bg-gray-50 animate-in fade-in duration-300">
          <QuizResult 
            score={state.score} 
            total={totalQuestions} 
            questions={state.activeQuestions}
            answers={state.answers}
            timeTaken={state.timeTaken}
            bookmarks={state.bookmarks}
            onRestart={restartQuiz} 
            onGoHome={goHome}
          />
      </div>
    );
  }

  // 2. Content for Layout Pages
  const renderLayoutContent = () => {
    switch (state.status) {
      case 'english-home':
        return <EnglishQuizHome onBack={enterHome} onVocabClick={enterVocabHome} />;
        
      case 'vocab-home':
        return <VocabQuizHome onBack={enterEnglishHome} onIdiomsClick={enterIdiomsConfig} />;
        
      case 'idioms-config':
        return (
          <IdiomsConfig 
              onBack={enterVocabHome}
              onStart={(data, filters) => {
                  startFlashcards(data as any, filters || {
                    subject: [], topic: [], subTopic: [], difficulty: [], 
                    questionType: [], examName: [], examYear: [], examDateShift: [], tags: []
                  });
              }}
          />
        );

      case 'flashcards-complete':
        return (
          <FlashcardSummary 
              totalCards={state.activeIdioms?.length || 0}
              filters={state.filters || {} as any}
              onRestart={restartQuiz}
              onHome={goHome}
          />
        );

      case 'config':
        return (
           <QuizConfig 
            onStart={(questions, filters, mode) => {
                startQuiz(questions, filters || {
                  subject: [], topic: [], subTopic: [], difficulty: [], 
                  questionType: [], examName: [], examYear: [], examDateShift: [], tags: []
                }, mode || 'learning');
            }} 
            onBack={goHome}
          />
        );

      // Default: Dashboard ('idle')
      default:
        return (
          <div className="flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 relative z-10 animate-fade-in">
              
              {/* Hero Section */}
              <div className="relative text-center max-w-4xl mx-auto mt-6">
                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight mb-4 drop-shadow-sm">
                  Master Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                    Knowledge.
                  </span>
                </h1>
                
                <p className="text-base text-gray-600 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                  Adaptive quizzes, detailed analytics, and instant feedback to help you learn faster.
                </p>
                
                <div className="flex items-center justify-center gap-3 relative z-20">
                  <Button 
                    size="lg" 
                    onClick={enterConfig} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-indigo-200 transition-all transform active:scale-95"
                  >
                    Start Quiz
                  </Button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Card 1 - Custom Quiz */}
                <div 
                  onClick={enterConfig}
                  className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-indigo-300"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ListChecks className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Custom Quiz</h3>
                  <p className="text-gray-500 text-xs font-medium">
                    Filter by subject, topic, and difficulty.
                  </p>
                </div>

                {/* Card 2 - English */}
                <div 
                  onClick={enterEnglishHome}
                  className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-rose-300"
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Languages className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">English Zone</h3>
                  <p className="text-gray-500 text-xs font-medium">
                    Vocab, Grammar & Mock Tests.
                  </p>
                </div>

                {/* Card 3 - Content */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden group cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-orange-300">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Study Material</h3>
                  <p className="text-gray-500 text-xs font-medium">
                    Download PDFs and notes.
                  </p>
                </div>

                {/* Card 4 - Guide */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-blue-300">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">User Guide</h3>
                  <p className="text-gray-500 text-xs font-medium">
                    Learn how to use the app.
                  </p>
                </div>
              </div>
              
              <div className="w-full text-center pb-4">
                 <button onClick={goToIntro} className="text-xs text-gray-400 hover:text-indigo-500 font-semibold uppercase tracking-widest">
                    Back to Intro
                 </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <MainLayout 
      activeTab={getActiveTab()} 
      onTabChange={handleTabChange}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      {areBgAnimationsEnabled && <Fireballs />}
      
      {/* Global Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {renderLayoutContent()}
    </MainLayout>
  );
};
