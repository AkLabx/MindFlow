import React, { useMemo } from 'react';
import { Question } from '../../../types/models';
import { cn } from '../../../utils/cn';
import { Card } from '../../../components/ui/Card';
import { Clock, Crosshair, Zap } from 'lucide-react';
import { QuizResultBase } from './QuizResultBase';

export interface GodQuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks?: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

export const GodQuizResult: React.FC<GodQuizResultProps> = ({
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
            <Card className="p-6 border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">Execution Time</h3>
                        <p className="text-sm text-slate-400">Total duration of the run</p>
                    </div>
                </div>
                <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    {formatSecs(totalTime)}
                </div>
            </Card>

            <Card className="p-6 border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                        <Crosshair className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">Reaction Pace</h3>
                        <p className="text-sm text-slate-400">Average time per target</p>
                    </div>
                </div>
                <div className="text-4xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                    {formatSecs(stats.avgTimePerQuestion)}
                </div>
            </Card>
        </div>

        <Card className="p-0 overflow-hidden border border-slate-800 bg-slate-900 text-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <h3 className="font-bold text-amber-400 uppercase tracking-wider text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Tactical Time Breakdown
                </h3>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {questions.map((q, idx) => {
                    const time = (timeTaken[q.id] || 0) / 1000;
                    const isDanger = time > stats.avgTimePerQuestion * 2 && time > 30;
                    const statusColor = answers[q.id] === q.correct ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : (answers[q.id] ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-slate-400 border-slate-600 bg-slate-800');

                    return (
                        <div key={q.id} className="p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-black shrink-0", statusColor)}>
                                    {idx + 1}
                                </div>
                                <div className="truncate text-sm font-medium text-slate-300 group-hover:text-white transition-colors pr-4">
                                    {q.question}
                                </div>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 font-mono text-sm font-bold shrink-0 px-3 py-1 rounded-md",
                                isDanger ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400"
                            )}>
                                <Clock className="w-4 h-4" />
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
        quizName="God Mode Run"
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
        themeColor="amber"
    />
  );
};
