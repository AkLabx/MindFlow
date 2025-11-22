
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Home, CheckCircle2, XCircle, Bookmark, Filter } from 'lucide-react';
import { Question } from '../types';
import { Button } from '../../../components/Button/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { QuizQuestionDisplay } from './QuizQuestionDisplay';
import { QuizExplanation } from './QuizExplanation';
import { cn } from '../../../utils/cn';

interface QuizReviewProps {
  questions: Question[];
  userAnswers: { [key: string]: string };
  bookmarkedQuestions: string[];
  onBackToScore: () => void;
  onGoHome: () => void;
  initialFilter?: 'All' | 'Correct' | 'Incorrect' | 'Bookmarked';
}

export const QuizReview: React.FC<QuizReviewProps> = ({
  questions,
  userAnswers,
  bookmarkedQuestions,
  onBackToScore,
  onGoHome,
  initialFilter = 'All'
}) => {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Calculate counts for tabs
  const counts = useMemo(() => {
    const c = {
      All: questions.length,
      Correct: 0,
      Incorrect: 0,
      Bookmarked: bookmarkedQuestions.length,
    };
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (ans === q.correct) c.Correct++;
      else if (ans) c.Incorrect++; // Assuming skipped are not incorrect for this count, or include skipped?
    });
    // Often "Incorrect" in review includes skipped/unanswered. Let's check standard behavior.
    // Usually Unanswered is separate or lumped with Incorrect. Let's stick to Incorrect = wrong answer.
    return c;
  }, [questions, userAnswers, bookmarkedQuestions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const ans = userAnswers[q.id];
      if (filter === 'All') return true;
      if (filter === 'Correct') return ans === q.correct;
      if (filter === 'Incorrect') return ans !== q.correct; // Includes skipped if we consider != correct
      if (filter === 'Bookmarked') return bookmarkedQuestions.includes(q.id);
      return true;
    });
  }, [filter, questions, userAnswers, bookmarkedQuestions]);

  // Reset index when filter changes
  useEffect(() => {
    setReviewIndex(0);
  }, [filter]);

  const currentQuestion = filteredQuestions[reviewIndex];
  const currentAns = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isCorrect = currentQuestion && currentAns === currentQuestion.correct;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 sticky top-4 z-30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="ghost" size="sm" onClick={onBackToScore} className="text-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Score
                </Button>
                <div className="h-6 w-px bg-gray-200"></div>
                <h2 className="font-bold text-gray-800">Review Mode</h2>
            </div>

            <div className="flex-1 w-full md:w-auto overflow-x-auto">
                <SegmentedControl 
                    options={['All', 'Correct', 'Incorrect', 'Bookmarked']}
                    selectedOptions={[filter]}
                    onOptionToggle={(opt) => setFilter(opt)}
                    counts={counts}
                />
            </div>

            <Button variant="outline" size="sm" onClick={onGoHome} className="w-full md:w-auto justify-center">
                <Home className="w-4 h-4 mr-2" /> Home
            </Button>
        </div>
      </div>

      {/* Content */}
      {currentQuestion ? (
        <div className="space-y-6 pb-20">
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 relative overflow-hidden">
                
                {/* Status Banner */}
                <div className={cn(
                    "absolute top-0 left-0 w-full h-1.5",
                    isCorrect ? "bg-green-500" : (currentAns ? "bg-red-500" : "bg-gray-300")
                )} />

                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                            Q {questions.findIndex(q => q.id === currentQuestion.id) + 1}
                        </span>
                        {currentAns ? (
                             isCorrect ? (
                                 <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                     <CheckCircle2 className="w-3 h-3" /> Correct
                                 </span>
                             ) : (
                                 <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                     <XCircle className="w-3 h-3" /> Incorrect
                                 </span>
                             )
                        ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                Skipped
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">ID: {currentQuestion.id}</span>
                </div>

                <QuizQuestionDisplay 
                    question={currentQuestion}
                    selectedAnswer={currentAns} // Pass user answer to highlight
                    onAnswerSelect={() => {}} // Read only
                    zoomLevel={1}
                />
            </div>

            {/* Explanation */}
            <QuizExplanation explanation={currentQuestion.explanation} />

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button 
                        onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
                        disabled={reviewIndex === 0}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-500">
                        {reviewIndex + 1} of {filteredQuestions.length}
                    </span>
                    <Button 
                        onClick={() => setReviewIndex(i => Math.min(filteredQuestions.length - 1, i + 1))}
                        disabled={reviewIndex === filteredQuestions.length - 1}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500">There are no questions in the "{filter}" category.</p>
            <Button variant="outline" className="mt-6" onClick={() => setFilter('All')}>
                View All Questions
            </Button>
        </div>
      )}
    </div>
  );
};
