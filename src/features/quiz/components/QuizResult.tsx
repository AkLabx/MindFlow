import React, { useMemo } from 'react';
import { Question } from '../../../types/models';
import { cn } from '../../../utils/cn';
import { Card } from '../../../components/ui/Card';
import { Clock, CheckCircle2, XCircle, Zap, List } from 'lucide-react';
import { QuizResultBase } from './QuizResultBase';

export interface QuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks?: string[];
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
  // --- Analytics Calculations (from original QuizResult) ---
  const totalTime = useMemo(() => Object.values(timeTaken).reduce((acc, curr) => acc + curr, 0) / 1000, [timeTaken]);
  
  const stats = useMemo(() => {
      let correct = 0, incorrect = 0, unattempted = 0;
      let totalCorrectTime = 0, totalIncorrectTime = 0, totalSkippedTime = 0;

      questions.forEach(q => {
          const t = (timeTaken[q.id] || 0) / 1000;
          if (!answers[q.id]) {
              unattempted++;
              totalSkippedTime += t;
          } else if (answers[q.id] === q.correct) {
              correct++;
              totalCorrectTime += t;
          } else {
              incorrect++;
              totalIncorrectTime += t;
          }
      });

      return {
          correct, incorrect, unattempted,
          totalCorrectTime, totalIncorrectTime, totalSkippedTime,
          avgCorrect: correct > 0 ? totalCorrectTime / correct : 0,
          avgIncorrect: incorrect > 0 ? totalIncorrectTime / incorrect : 0,
          avgOverall: questions.length > 0 ? totalTime / questions.length : 0,
          timeWastedSkipped: totalSkippedTime,
      };
  }, [questions, answers, timeTaken, totalTime]);

  const accuracy = (stats.correct / total) * 100 || 0;

  const subjectPerformance = useMemo(() => {
      const perf: Record<string, { total: number, correct: number, attempted: number, timeSpent: number }> = {};
      questions.forEach(q => {
          const subj = q.subject || q.classification?.subject || 'General';
          if (!perf[subj]) perf[subj] = { total: 0, correct: 0, attempted: 0, timeSpent: 0 };
          perf[subj].total++;
          const t = (timeTaken[q.id] || 0) / 1000;
          perf[subj].timeSpent += t;
          if (answers[q.id]) {
              perf[subj].attempted++;
              if (answers[q.id] === q.correct) perf[subj].correct++;
          }
      });
      return Object.entries(perf).map(([name, data]) => ({
          name,
          ...data,
          accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0
      })).sort((a, b) => b.total - a.total);
  }, [questions, answers, timeTaken]);

  const formatSecs = (secs: number) => {
      if (!secs || isNaN(secs)) return '0s';
      if (secs < 60) return `${Math.round(secs)}s`;
      return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
  };

  const analyticsSlot = (
    <div className="space-y-6">
        {/* Time Analysis */}
        <Card className="p-0 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" /> Time Management
                </h3>
            </div>
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Spent</span>
                        <span className="text-base font-bold text-gray-900 dark:text-white">{formatSecs(totalTime)}</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">100%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Correct</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatSecs(stats.totalCorrectTime)}</span>
                        <span className="text-xs font-medium text-emerald-400/70 dark:text-emerald-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalCorrectTime / totalTime) * 100) : 0}%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Incorrect</span>
                        <span className="text-base font-bold text-rose-600 dark:text-rose-400">{formatSecs(stats.totalIncorrectTime)}</span>
                        <span className="text-xs font-medium text-rose-400/70 dark:text-rose-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalIncorrectTime / totalTime) * 100) : 0}%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Skipped</span>
                        <span className="text-base font-bold text-amber-600 dark:text-amber-400">{formatSecs(stats.totalSkippedTime)}</span>
                        <span className="text-xs font-medium text-amber-400/70 dark:text-amber-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalSkippedTime / totalTime) * 100) : 0}%</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <TimeMetricBox label="Avg / Question" value={formatSecs(stats.avgOverall)} icon={<Zap className="w-4 h-4 text-indigo-500" />} />
                <TimeMetricBox label="Avg Correct" value={formatSecs(stats.avgCorrect)} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
                <TimeMetricBox label="Avg Incorrect" value={formatSecs(stats.avgIncorrect)} icon={<XCircle className="w-4 h-4 text-rose-500" />} />
                <TimeMetricBox label="Skipped Wasted" value={formatSecs(stats.timeWastedSkipped)} icon={<Clock className="w-4 h-4 text-amber-500" />} />
            </div>
        </Card>

        {/* Subject Table */}
        <Card className="p-0 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-500" /> Sectional Summary
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="p-4">Subject</th>
                            <th className="p-4 text-center">Questions</th>
                            <th className="p-4 text-center">Attempted</th>
                            <th className="p-4 text-center">Correct</th>
                            <th className="p-4 text-center">Accuracy</th>
                            <th className="p-4 text-right">Time Spent</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {subjectPerformance.map((sub) => (
                            <tr key={sub.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900 dark:text-white">{sub.name}</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-400">{sub.total}</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-400">{sub.attempted}</td>
                                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">{sub.correct}</td>
                                <td className="p-4 text-center">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-bold",
                                        sub.accuracy >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                        sub.accuracy >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                    )}>
                                        {sub.accuracy}%
                                    </span>
                                </td>
                                <td className="p-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                                    {formatSecs(sub.timeSpent)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );

  return (
    <QuizResultBase
        quizName="Practice Quiz"
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
        themeColor="indigo"
    />
  );
};

const TimeMetricBox = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="p-5 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {icon} {label}
        </div>
        <div className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
        </div>
    </div>
);
