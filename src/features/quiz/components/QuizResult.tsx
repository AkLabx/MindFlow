
import React, { useState, useMemo } from 'react';
import { Trophy, RotateCcw, Home, Target, Clock, CheckCircle2, XCircle, List, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { Question } from '../types';
import { DonutChart } from './ui/DonutChart';
import { QuizReview } from './QuizReview';
import { cn } from '../../../utils/cn';

interface QuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ 
  score, 
  total, 
  questions,
  answers,
  timeTaken,
  bookmarks,
  onRestart,
  onGoHome
}) => {
  const [view, setView] = useState<'score' | 'review'>('score');
  const [reviewFilter, setReviewFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Bookmarked'>('All');

  // --- Calculations ---
  const { correct, incorrect, unanswered, attempted } = useMemo(() => {
      let c = 0, i = 0, a = 0;
      questions.forEach(q => {
          const ans = answers[q.id];
          if (ans) {
              a++;
              if (ans === q.correct) c++; else i++;
          }
      });
      return { correct: c, incorrect: i, attempted: a, unanswered: total - a };
  }, [questions, answers, total]);

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  
  // Fix: Explicitly cast Object.values to number[] to avoid TS error about arithmetic operation
  const totalTime = (Object.values(timeTaken) as number[]).reduce((a, b) => a + b, 0);
  const formattedTime = `${Math.floor(totalTime / 60)}m ${Math.round(totalTime % 60)}s`;

  // Time Analysis
  const timeAnalysis = useMemo(() => {
      let correctTime = 0, correctCount = 0;
      let incorrectTime = 0, incorrectCount = 0;
      
      questions.forEach(q => {
          const t = timeTaken[q.id] || 0;
          const ans = answers[q.id];
          if (ans) {
              if (ans === q.correct) { correctTime += t; correctCount++; }
              else { incorrectTime += t; incorrectCount++; }
          }
      });
      return {
          avgCorrect: correctCount > 0 ? Math.round(correctTime / correctCount) : 0,
          avgIncorrect: incorrectCount > 0 ? Math.round(incorrectTime / incorrectCount) : 0
      };
  }, [questions, answers, timeTaken]);

  // Subject Performance
  const subjectPerformance = useMemo(() => {
      const stats: Record<string, { total: number, correct: number }> = {};
      questions.forEach(q => {
          const sub = q.classification.subject;
          if (!stats[sub]) stats[sub] = { total: 0, correct: 0 };
          stats[sub].total++;
          if (answers[q.id] === q.correct) stats[sub].correct++;
      });
      return Object.entries(stats)
        .map(([name, data]) => ({ name, ...data, accuracy: Math.round((data.correct / data.total) * 100) }))
        .sort((a, b) => b.accuracy - a.accuracy);
  }, [questions, answers]);

  // Message
  let title = "Good Effort!";
  if (accuracy >= 90) title = "Quiz Master!";
  else if (accuracy >= 75) title = "Great Job!";
  else if (accuracy < 50) title = "Keep Practicing";

  // --- View: Review Mode ---
  if (view === 'review') {
      return (
          <QuizReview 
            questions={questions}
            userAnswers={answers}
            timeTaken={timeTaken}
            bookmarkedQuestions={bookmarks}
            onBackToScore={() => setView('score')}
            onGoHome={onGoHome || onRestart}
            initialFilter={reviewFilter}
          />
      );
  }

  // --- View: Score Dashboard ---
  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      
      {/* Hero Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              
              <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Trophy className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
                  <p className="text-indigo-100 font-medium">You completed the quiz in {formattedTime}</p>
              </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Donut Chart */}
              <div className="flex flex-col items-center justify-center">
                  <DonutChart correct={correct} incorrect={incorrect} unanswered={unanswered} size={180} />
                  <div className="flex gap-4 mt-4 text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> {correct} Correct</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> {incorrect} Wrong</div>
                  </div>
              </div>

              {/* KPI Grid */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-semibold">
                          <Target className="w-4 h-4" /> Total Score
                      </div>
                      <div className="text-2xl font-black text-gray-900">{score} <span className="text-sm text-gray-400 font-medium">/ {total}</span></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Attempted
                      </div>
                      <div className="text-2xl font-black text-gray-900">{attempted} <span className="text-sm text-gray-400 font-medium">/ {total}</span></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-semibold">
                          <Clock className="w-4 h-4" /> Avg. Time (Correct)
                      </div>
                      <div className="text-2xl font-black text-green-600">{timeAnalysis.avgCorrect}s</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-semibold">
                          <Clock className="w-4 h-4" /> Avg. Time (Wrong)
                      </div>
                      <div className="text-2xl font-black text-red-600">{timeAnalysis.avgIncorrect}s</div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Actions Column */}
          <div className="space-y-4 order-2 md:order-1">
             <h3 className="font-bold text-gray-900 text-lg">Actions</h3>
             
             <button 
                onClick={() => { setReviewFilter('All'); setView('review'); }}
                className="w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
             >
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><List className="w-5 h-5" /></div>
                    <span className="font-semibold text-gray-700">Review All Questions</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
             </button>

             <button 
                onClick={() => { setReviewFilter('Incorrect'); setView('review'); }}
                disabled={incorrect === 0}
                className={cn(
                    "w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all flex items-center justify-between group",
                    incorrect === 0 ? "opacity-50 cursor-not-allowed" : "hover:border-red-300 hover:shadow-md"
                )}
             >
                 <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg text-red-600"><XCircle className="w-5 h-5" /></div>
                    <span className="font-semibold text-gray-700">Review Incorrect</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
             </button>

             <div className="grid grid-cols-2 gap-3 pt-4">
                 <Button onClick={onRestart} variant="outline" className="justify-center">
                    <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                 </Button>
                 <Button onClick={onGoHome} variant="outline" className="justify-center text-gray-700">
                    <Home className="w-4 h-4 mr-2" /> Home
                 </Button>
             </div>
          </div>

          {/* Subject Performance Column */}
          <div className="md:col-span-2 order-1 md:order-2">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Performance by Subject</h3>
              <div className="space-y-4">
                  {subjectPerformance.map(sub => (
                      <div key={sub.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-end mb-2">
                              <span className="font-semibold text-gray-700">{sub.name}</span>
                              <span className={cn("font-bold", sub.accuracy >= 80 ? "text-green-600" : sub.accuracy >= 50 ? "text-yellow-600" : "text-red-600")}>
                                  {sub.accuracy}%
                              </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", 
                                    sub.accuracy >= 80 ? "bg-green-500" : sub.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${sub.accuracy}%` }}
                              />
                          </div>
                          <div className="mt-2 text-xs text-gray-400 flex justify-between">
                              <span>{sub.correct} / {sub.total} Correct</span>
                              <span>Target: 80%</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
};
