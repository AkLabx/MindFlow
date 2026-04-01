const fs = require('fs');
const file = 'src/features/quiz/components/QuizResult.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update stats
code = code.replace(
  /avgIncorrect: incorrectCount > 0 \? Math\.round\(incorrectTime \/ incorrectCount\) : 0,\s+timeWastedSkipped: Math\.round\(skippedTime\)\s+};/m,
  `avgIncorrect: incorrectCount > 0 ? Math.round(incorrectTime / incorrectCount) : 0,
          timeWastedSkipped: Math.round(skippedTime),
          totalCorrectTime: Math.round(correctTime),
          totalIncorrectTime: Math.round(incorrectTime),
          totalSkippedTime: Math.round(skippedTime)
      };`
);

// 2. Remove Section 1
code = code.replace(
  /\{\/\* Section 1: Overview Scorecard \*\/\}[\s\S]*?\{\/\* Section 2: Visual Attempt Breakdown & Review Navigation \*\/\}/m,
  `{/* Section 2: Visual Attempt Breakdown & Review Navigation */}`
);

code = code.replace(
  /\{\/\* Section 2: Visual Attempt Breakdown & Review Navigation \*\/\}/m,
  `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Section 2: Visual Attempt Breakdown & Review Navigation */}`
);

// 3. Move View Solutions button
code = code.replace(
  /<div className="flex gap-3">\s*<Button onClick=\{onRestart\} variant="outline"/m,
  `<div className="flex gap-3">
              <Button
                  onClick={() => { setReviewFilter('All'); setView('review'); }}
                  variant="primary"
                  className="flex items-center group"
              >
                  View Solutions <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={onRestart} variant="outline"`
);

// Remove "View Solutions" and "Review Mistakes" from the Attempt Analysis card
code = code.replace(
  /<div className="mt-8 space-y-3">[\s\S]*?<\/div>\s*<\/Card>/m,
  `</Card>`
);

// 4. Add Top 4 Metrics inside Attempt Analysis
code = code.replace(
  /<Target className="w-5 h-5 text-indigo-500" \/> Attempt Analysis\s*<\/h3>/m,
  `<Target className="w-5 h-5 text-indigo-500" /> Attempt Analysis
                      </h3>

                      {/* Top 4 Metrics (Moved inside) */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Score</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-gray-900 dark:text-white">{score}</span>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">/ {total}</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Accuracy</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy}</span>
                                  <span className="text-sm text-indigo-400/50 dark:text-indigo-400/50">%</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Attempted</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-gray-900 dark:text-white">{attempted}</span>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">/ {total}</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /></span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formattedTime}</span>
                              </div>
                          </div>
                      </div>`
);

// 5. Add Tabular Breakdown
code = code.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">/m,
  `<div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          {/* New Tabular Breakdown */}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/50">`
);

fs.writeFileSync(file, code);
