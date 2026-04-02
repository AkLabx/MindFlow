import React, { useState, useEffect } from 'react';
import { ChevronLeft, BarChart2, TrendingUp, CheckCircle2, XCircle, Clock, Target, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../lib/db';
import { QuizHistoryRecord } from '../types';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { cn } from '../../../utils/cn';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';

export const PerformanceAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<QuizHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);

    const handleResetAnalytics = async () => {
        if (window.confirm("Are you sure you want to reset all analytics data? This action cannot be undone.")) {
            try {
                await db.clearQuizHistory();
                setHistory([]);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error("Failed to reset analytics:", error);
                alert("Failed to reset analytics. Please try again.");
            }
        }
    };

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const records = await db.getQuizHistory();
                // Sort by date descending
                setHistory(records.sort((a, b) => b.date - a.date));
            } catch (error) {
                console.error("Failed to load quiz history:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();

        // Listen for sync completion to refresh data and avoid stale cache
        const handleSyncComplete = () => {
            loadHistory();
        };
        window.addEventListener('mindflow-sync-complete', handleSyncComplete);

        return () => {
            window.removeEventListener('mindflow-sync-complete', handleSyncComplete);
        };
    }, []);

    // Aggregate Data
    const totalQuizzes = history.length;
    const totalQuestionsAttempted = history.reduce((acc, r) => acc + (r.totalCorrect + r.totalIncorrect), 0);
    const totalQuestionsSeen = history.reduce((acc, r) => acc + r.totalQuestions, 0);
    const totalCorrect = history.reduce((acc, r) => acc + r.totalCorrect, 0);
    const averageAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 0;

    // Aggregate Subject Stats
    const subjectTotals: Record<string, { attempted: number; correct: number; incorrect: number; skipped: number }> = {};
    history.forEach(record => {
        Object.entries(record.subjectStats).forEach(([subject, stats]) => {
            if (!subjectTotals[subject]) {
                subjectTotals[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0 };
            }
            subjectTotals[subject].attempted += stats.attempted;
            subjectTotals[subject].correct += stats.correct;
            subjectTotals[subject].incorrect += stats.incorrect;
            subjectTotals[subject].skipped += stats.skipped;
        });
    });

    // Calculate Weak Topics
    const weakTopicsList: { subject: string; accuracy: number; attempted: number }[] = [];
    Object.entries(subjectTotals).forEach(([subject, stats]) => {
        const attempts = stats.attempted; // Assuming attempted includes correct + incorrect
        if (attempts >= 5) {
            const accuracy = (stats.correct / attempts) * 100;
            weakTopicsList.push({ subject, accuracy, attempted: attempts });
        }
    });

    // Sort by lowest accuracy first, then take top ones for a dedicated section
    weakTopicsList.sort((a, b) => a.accuracy - b.accuracy);
    const weakTopics = weakTopicsList.filter(t => t.accuracy < 70); // Show topics below 70% as weak, or just top 3

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <SynapticLoader size="lg" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <>
                <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                        <BarChart2 className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                        Complete your first quiz to start seeing your performance analytics and detailed report cards.
                    </p>
                    <Button onClick={() => navigate('/quiz/config')} className="bg-indigo-600 hover:bg-indigo-700">
                        Start a Quiz
                    </Button>
                    <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:text-indigo-400 font-medium">
                        Back to Dashboard
                    </button>
                </div>
                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed bottom-4 right-4 z-[60] animate-fade-in">
                        <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span>Analytics reset successfully.</span>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your detailed learning report card.</p>
                </div>
            </div>
            <button
                onClick={handleResetAnalytics}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold"
                title="Reset Analytics"
            >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Analytics</span>
            </button>
        </div>

        {/* Toast Notification */}
        {showToast && (
            <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>Analytics reset successfully.</span>
                </div>
            </div>
        )}

            {/* High-level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-indigo-50 to-white border-indigo-100 dark:border-indigo-900/30">
                    <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-3xl font-black text-indigo-900">{totalQuizzes}</span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wider">Total Quizzes</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="text-3xl font-black text-emerald-900">{averageAccuracy}%</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400/80 uppercase tracking-wider">Avg Accuracy</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                    <span className="text-3xl font-black text-amber-900">{totalCorrect}</span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400/80 uppercase tracking-wider">Total Correct</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-rose-50 to-white border-rose-100">
                    <AlertCircle className="w-6 h-6 text-rose-600 mb-2" />
                    <span className="text-3xl font-black text-rose-900">{totalQuestionsSeen - totalQuestionsAttempted}</span>
                    <span className="text-xs font-medium text-rose-600/80 uppercase tracking-wider">Total Skipped</span>
                </Card>
            </div>

            {/* Subject-wise Performance */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Subject Mastery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(subjectTotals).map(([subject, stats]) => {
                        const subjAccuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
                        return (
                            <Card key={subject} className="p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{subject}</h3>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-bold",
                                        subjAccuracy >= 80 ? "bg-emerald-100 text-emerald-800" :
                                        subjAccuracy >= 60 ? "bg-amber-100 text-amber-800" :
                                        "bg-rose-100 text-rose-800"
                                    )}>
                                        {subjAccuracy}% Accuracy
                                    </span>
                                </div>
                                <ProgressBar value={subjAccuracy} variant={subjAccuracy >= 80 ? 'success' : subjAccuracy >= 60 ? 'warning' : 'danger'} className="mb-4" />

                                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                        <div className="font-bold text-gray-900 dark:text-white">{stats.attempted}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Attempt</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                                        <div className="font-bold text-emerald-700 dark:text-emerald-400">{stats.correct}</div>
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 uppercase">Right</div>
                                    </div>
                                    <div className="bg-rose-50 rounded-lg p-2">
                                        <div className="font-bold text-rose-700">{stats.incorrect}</div>
                                        <div className="text-[10px] text-rose-600/80 uppercase">Wrong</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                        <div className="font-bold text-gray-500 dark:text-gray-400">{stats.skipped}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Skip</div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Recent Sessions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Recent Activity
                </h2>
                <Card className="overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                        {history.slice(0, 10).map((record) => (
                            <div key={record.id} className="p-4 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">{record.difficulty}</span>
                                        <span>•</span>
                                        <span>{formatTime(record.totalTimeSpent)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "text-xl font-black",
                                        record.overallAccuracy >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                                        record.overallAccuracy >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600"
                                    )}>
                                        {record.overallAccuracy}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {record.totalCorrect} / {record.totalQuestions}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
