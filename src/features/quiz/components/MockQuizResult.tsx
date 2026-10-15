import React, { useMemo } from 'react';
import { Question } from '../../../types/models';
import { cn } from '../../../utils/cn';
import { Card } from '../../../components/ui/Card';
import { Clock, BarChart2 } from 'lucide-react';
import { QuizResultBase } from './QuizResultBase';

export interface MockQuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks?: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

export const MockQuizResult: React.FC<MockQuizResultProps> = ({
  score,
  total,
  questions,
  answers,
  timeTaken,
  bookmarks,
  onRestart,
  onGoHome
}) => {
  const totalTime = useMemo(() => Object.values(timeTaken).reduce((acc, curr) => acc + curr, 0) / 1000, [timeTaken]);

  const stats = useMemo(() => {
      let correct = 0, incorrect = 0, unattempted = 0;

      questions.forEach(q => {
          if (!answers[q.id]) {
              unattempted++;
          } else if (answers[q.id] === q.correct) {
              correct++;
          } else {
              incorrect++;
          }
      });

      return {
          correct, incorrect, unattempted,
          avgTimePerQuestion: questions.length > 0 ? totalTime / questions.length : 0,
      };
  }, [questions, answers, totalTime]);

  const accuracy = (stats.correct / total) * 100 || 0;

  const formatSecs = (secs: number) => {
      if (!secs || isNaN(secs)) return '0s';
      if (secs < 60) return `${Math.round(secs)}s`;
      return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
  };

  const analyticsSlot = (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Total Time</h3>
                        <p className="text-sm text-slate-500">Duration of the mock exam</p>
                    </div>
                </div>
                <div className="text-3xl font-black text-slate-800 dark:text-white">
                    {formatSecs(totalTime)}
                </div>
            </Card>

            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg text-cyan-600 dark:text-cyan-400">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Average Pace</h3>
                        <p className="text-sm text-slate-500">Time spent per question</p>
                    </div>
                </div>
                <div className="text-3xl font-black text-slate-800 dark:text-white">
                    {formatSecs(stats.avgTimePerQuestion)}
                </div>
            </Card>
        </div>

        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Question Time Breakdown
                </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {questions.map((q, idx) => {
                    const time = (timeTaken[q.id] || 0) / 1000;
                    const isSlow = time > stats.avgTimePerQuestion * 1.5 && time > 20;
                    const statusColor = answers[q.id] === q.correct ? 'text-emerald-500' : (answers[q.id] ? 'text-red-500' : 'text-slate-400');

                    return (
                        <div key={q.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0", statusColor === 'text-emerald-500' ? 'bg-emerald-100 dark:bg-emerald-900/30' : statusColor === 'text-red-500' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800')}>
                                    {idx + 1}
                                </div>
                                <div className="truncate text-sm text-slate-600 dark:text-slate-300 pr-4">
                                    {q.question}
                                </div>
                            </div>
                            <div className={cn(
                                "flex items-center gap-1.5 font-mono text-sm font-medium shrink-0",
                                isSlow ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                            )}>
                                <Clock className="w-3.5 h-3.5" />
                                {formatSecs(time)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    </div>
  );

  return (
    <QuizResultBase
        quizName="Mock Exam"
        score={score}
        total={total}
        accuracy={accuracy}
        timeSpent={totalTime}
        stats={stats}
        questions={questions}
        answers={answers}
        bookmarks={bookmarks}
        onRestart={onRestart}
        onGoHome={onGoHome}
        analyticsSlot={analyticsSlot}
        themeColor="emerald"
    />
  );
};
