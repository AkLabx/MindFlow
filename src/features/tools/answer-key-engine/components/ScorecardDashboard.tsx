import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  BarChart3, 
  TrendingUp, 
  ArrowLeft, 
  Filter, 
  Sparkles, 
  ShieldAlert, 
  Award,
  Layers,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Lock
} from 'lucide-react';
import { CandidateRankings, ParsedExamResult, ParsedQuestion } from '../types';
import { AnswerKeyService } from '../services/answerKeyService';
import { FEATURES } from '@/config/features';

interface ScorecardDashboardProps {
  result: ParsedExamResult;
  rankings?: CandidateRankings | null;
  onReset: () => void;
}

export const ScorecardDashboard: React.FC<ScorecardDashboardProps> = ({
  result,
  rankings,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'ranks' | 'stats' | 'ai'>('scorecard');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'wrong' | 'unattempted' | 'correct'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const { candidateDetails, metrics, sectionDetails, questionResponses, category } = result;

  // Filtered Questions
  const filteredQuestions = questionResponses.filter((q: ParsedQuestion) => {
    // Section match
    if (sectionFilter !== 'all' && q.sectionId !== sectionFilter) return false;

    // Status match
    if (questionFilter === 'wrong') return q.status === 'answered' && !q.isCorrect;
    if (questionFilter === 'unattempted') return q.status === 'unattempted';
    if (questionFilter === 'correct') return q.status === 'answered' && q.isCorrect;
    return true;
  });

  const maskedRoll = AnswerKeyService.maskRollNumber(candidateDetails.rollNumber);
  const maskedName = AnswerKeyService.maskName(candidateDetails.candidateName);

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Check Another Answer Key"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {maskedName}
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="font-mono">{maskedRoll}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {candidateDetails.examDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {candidateDetails.shiftName}
              </span>
              {candidateDetails.venueName && (
                <span className="flex items-center gap-1 truncate max-w-xs">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {candidateDetails.venueName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Another Key
          </button>
        </div>
      </div>

      {/* Honest Presentation Disclaimer Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Community Disclaimer:</strong> This scorecard and analysis is calculated directly from your official TCS iON response sheet. Ranks and predictions are estimates based on MindFlow participant submissions.
          </span>
        </div>
      </div>

      {/* 2. Navigation Tabs (Phased Matrix) */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            activeTab === 'scorecard'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Scorecard & Review
        </button>

        <button
          onClick={() => setActiveTab('ranks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            activeTab === 'ranks'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Rank Matrix
          {!FEATURES.EXAM_ANALYTICS.PHASE_2_RANKS && !rankings && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Phase 2
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            activeTab === 'stats'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Shift & Normalization
          {!FEATURES.EXAM_ANALYTICS.PHASE_3_STATS && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Phase 3
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Weakness Insights
          {!FEATURES.EXAM_ANALYTICS.PHASE_4_AI_INSIGHTS && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Phase 4
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: SCORECARD & REVIEW (MVP Active Feature) */}
      {activeTab === 'scorecard' && (
        <div className="space-y-6">
          {/* Main KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {/* Raw Score */}
            <div className="col-span-2 md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-800/60 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total Raw Score
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {metrics.rawScore}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  / 200
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {metrics.rawScore >= 135 ? '🔥 High Competency Range' : metrics.rawScore >= 115 ? '👍 Safe Attempt Zone' : '⚡ Focused Revision Recommended'}
              </p>
            </div>

            {/* Accuracy */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Accuracy
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {metrics.overallAccuracy}%
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {metrics.totalCorrect} / {metrics.totalCorrect + metrics.totalWrong} Attempted
              </div>
            </div>

            {/* Correct */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  Correct
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {metrics.totalCorrect}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                +{(metrics.totalCorrect * 2).toFixed(1)} Marks
              </div>
            </div>

            {/* Wrong & Unattempted */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">
                  Negative
                </span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {metrics.totalWrong}
              </div>
              <div className="mt-2 text-xs text-rose-500">
                -{(metrics.totalWrong * 0.5).toFixed(1)} Marks Lost
              </div>
            </div>
          </div>

          {/* Sectional Breakdown Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Subject-wise Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(sectionDetails).map(sec => (
                <div
                  key={sec.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {sec.name}
                    </h4>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {sec.score}
                    </span>
                    <span className="text-xs text-slate-400">/ 50</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sec.correct}</span>
                      <p className="text-[10px] text-slate-400">Right</p>
                    </div>
                    <div>
                      <span className="text-rose-500 font-bold">{sec.wrong}</span>
                      <p className="text-[10px] text-slate-400">Wrong</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">{sec.accuracy}%</span>
                      <p className="text-[10px] text-slate-400">Accuracy</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question-by-Question Review Module */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  Detailed Question Review
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredQuestions.length} of {questionResponses.length} questions
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'wrong', 'unattempted', 'correct'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setQuestionFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      questionFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSectionFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium shrink-0 ${
                  sectionFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All Subjects
              </button>
              {Object.values(sectionDetails).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSectionFilter(s.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium shrink-0 ${
                    sectionFilter === s.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {filteredQuestions.map(q => (
                <div key={q.questionId + '_' + q.questionIndex} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      Q{q.questionIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-900 dark:text-white capitalize">
                          {q.sectionId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {q.questionId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Chosen: <span className="font-semibold text-slate-700 dark:text-slate-300">{q.chosenOptionId ? `Option ${q.chosenOptionId}` : 'None'}</span>
                        {' • '}
                        Official: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Option {q.correctOptionId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.status === 'unattempted' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        0
                      </span>
                    ) : q.isCorrect ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        +2.0
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        -0.5
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: RANK MATRIX (Phase 2 Skeleton) */}
      {activeTab === 'ranks' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                Live Submissions Rank Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time competitive standings calculated across MindFlow submissions.
              </p>
            </div>
            {rankings ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                Live Data
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
                Phase 2 Engine
              </span>
            )}
          </div>

          {rankings ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 uppercase">Overall Rank</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                  #{rankings.overall.rank}
                </div>
                <div className="text-xs text-slate-400 mt-1">Out of {rankings.overall.total_candidates} candidates</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 uppercase">{rankings.category.category} Category Rank</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  #{rankings.category.rank}
                </div>
                <div className="text-xs text-slate-400 mt-1">Out of {rankings.category.total_candidates} candidates</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 uppercase">Shift Rank</span>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
                  #{rankings.shift.rank}
                </div>
                <div className="text-xs text-slate-400 mt-1">Out of {rankings.shift.total_candidates} shift candidates</div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Rank Matrix Activating in Phase 2
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your scorecard data has been securely saved to our indexed database. As candidate submissions arrive, Overall, Category, Shift, and Sectional ranks will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SHIFT & NORMALIZATION (Phase 3 Skeleton) */}
      {activeTab === 'stats' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Shift Difficulty & Normalization
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mathematical modeling based on Mean, Median, and TCS multi-shift formula.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              Phase 3 Engine
            </span>
          </div>

          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Insufficient Shift Sample Data (डेटा कम है)
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              MindFlow requires at least <strong>30 verified submissions</strong> per shift before calculating normalized projections to maintain statistical integrity. Once the threshold is met, your expected normalized score will unlock.
            </p>
          </div>
        </div>
      )}

      {/* 6. TAB 4: AI WEAKNESS INSIGHTS (Phase 4 Skeleton) */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Syllabus Weakness Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Deep analysis connecting your incorrect answers with MindFlow Practice Drills.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              Phase 4 Engine
            </span>
          </div>

          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              AI Drill Generator (Coming Soon)
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              In Phase 4, MindFlow AI will analyze every incorrect question from your response sheet and automatically curate targeted 10-question practice drills to fix conceptual blind spots.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
