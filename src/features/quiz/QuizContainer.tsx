
import React, { useState, useContext } from 'react';
import { useQuiz } from './hooks/useQuiz';
import { QuizResult } from './components/QuizResult';
import { QuizConfig } from './components/QuizConfig';
import { LandingPage } from './components/LandingPage';
import { ActiveQuizSession } from './components/ActiveQuizSession';
import { Fireballs } from '../../components/Background/Fireballs';
import { Button } from '../../components/Button/Button';
import { ArrowRight, ListChecks, FileText, BookOpen, ArrowLeft } from 'lucide-react';
import { InitialFilters } from './types';
import { SettingsContext } from '../../context/SettingsContext';

export const QuizContainer: React.FC = () => {
  const {
    state,
    currentQuestion,
    totalQuestions,
    enterHome,
    enterConfig,
    goToIntro,
    startQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleBookmark,
    toggleReview,
    useFiftyFifty,
    finishQuiz,
    restartQuiz,
    goHome
  } = useQuiz();

  const { areBgAnimationsEnabled } = useContext(SettingsContext);

  // Keep track of filters just for Breadcrumbs display
  const [currentFilters, setCurrentFilters] = useState<InitialFilters>({
      subject: [], topic: [], subTopic: [], difficulty: [], questionType: [], examName: [], examYear: [], tags: []
  });

  // 0. Intro / Landing Page
  if (state.status === 'intro') {
    return <LandingPage onGetStarted={enterHome} />;
  }

  // Helper to render content based on state
  const renderContent = () => {
    // 1. Dashboard / Home Page
    if (state.status === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-10 py-10 relative z-10">
          
          {/* Back to Intro Navigation */}
          <div className="w-full max-w-6xl mx-auto px-4">
             <Button 
                variant="ghost" 
                onClick={goToIntro} 
                className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
             >
               <ArrowLeft className="w-4 h-4" /> Back to Intro
             </Button>
          </div>

          {/* Hero Section */}
          <div className="relative text-center max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl sm:text-9xl font-black text-gray-200/60 whitespace-nowrap select-none -z-10 pointer-events-none opacity-50">
              MindFlow
            </div>
            
            <h1 className="text-4xl sm:text-7xl font-extrabold text-gray-900 leading-tight mb-6 drop-shadow-sm">
              Master Your Subjects,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-orange-500">
                One Quiz at a Time.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-sm bg-white/30 backdrop-blur-sm rounded-xl p-2">
              Build custom quizzes from a vast question bank, generate study materials, and track your progress like never before.
            </p>
            
            <Button 
              size="lg" 
              onClick={enterConfig} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-1 relative z-20"
            >
              Start a New Quiz <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-6xl mx-auto px-4">
            {/* Card 1 - Indigo Theme */}
            <div 
              onClick={enterConfig}
              className="bg-white p-8 rounded-3xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#818cf8,0px_20px_30px_rgba(99,102,241,0.3)] hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-indigo-100 group-hover:shadow-indigo-200">
                <ListChecks className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors">Build a Custom Quiz</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
                Use powerful filters to create targeted quizzes based on subject, topic, difficulty, and more.
              </p>
            </div>

            {/* Card 2 - Orange Theme */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 relative overflow-hidden group cursor-pointer z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#fb923c,0px_20px_30px_rgba(249,115,22,0.3)] hover:border-orange-300"
            >
              <div className="absolute top-6 -right-12 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-black tracking-wider w-48 py-1.5 text-center rotate-45 shadow-md z-10 uppercase group-hover:shadow-orange-300/50">
                Paid Services
              </div>
              
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-orange-100 group-hover:shadow-orange-200">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">Content Creation</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
                Generate downloadable PPT, PDF, or JSON files from your selected questions for offline study.
              </p>
            </div>

            {/* Card 3 - Blue Theme */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 cursor-pointer group z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#60a5fa,0px_20px_30px_rgba(59,130,246,0.3)] hover:border-blue-300"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-blue-100 group-hover:shadow-blue-200">
                <BookOpen className="w-6 h-6 text-indigo-600 group-hover:text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">User Guide</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
                Explore all the features of MindFlow and learn how to make the most of your study sessions.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 2. Configuration Page
    if (state.status === 'config') {
      return (
        <div className="relative z-10">
           <QuizConfig 
            onStart={(questions, filters) => {
                if (filters) setCurrentFilters(filters);
                startQuiz(questions);
            }} 
            onBack={goHome}
          />
        </div>
      );
    }

    // 3. Result Page
    if (state.status === 'result') {
      return (
        <div className="relative z-10">
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

    // 4. Active Quiz Page
    return (
      <div className="relative z-10 max-w-6xl mx-auto">
        <ActiveQuizSession 
            question={currentQuestion}
            questionIndex={state.currentQuestionIndex}
            totalQuestions={totalQuestions}
            allQuestions={state.activeQuestions}
            userAnswers={state.answers}
            timeTaken={state.timeTaken}
            hiddenOptions={state.hiddenOptions}
            bookmarks={state.bookmarks}
            markedForReview={state.markedForReview}
            score={state.score}
            
            onAnswer={answerQuestion}
            onNext={nextQuestion}
            onPrev={prevQuestion}
            onJump={jumpToQuestion}
            onToggleBookmark={toggleBookmark}
            onToggleReview={toggleReview}
            onUseFiftyFifty={useFiftyFifty}
            onFinish={finishQuiz}
            onGoHome={goHome}
            
            filters={currentFilters}
        />
      </div>
    );
  };

  return (
    <>
      {areBgAnimationsEnabled && <Fireballs />}
      {renderContent()}
    </>
  );
};
