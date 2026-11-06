import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  Link as LinkIcon, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { CandidateCategory, CandidateRankings, ExamConfig, ParsedExamResult } from './types';
import { AnswerKeyService, SUPPORTED_EXAMS } from './services/answerKeyService';
import { ScorecardDashboard } from './components/ScorecardDashboard';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AnswerKeyCalculator: React.FC = () => {
  const navigate = useNavigate();
  const { activeExamId } = useExamContextStore();
  const { showToast } = useNotificationStore();

  // Find default exam matching user's active exam context
  const defaultExam = SUPPORTED_EXAMS.find(e => 
    e.id === activeExamId || 
    (activeExamId && activeExamId.toLowerCase().includes('chsl') && e.id.includes('chsl'))
  ) || SUPPORTED_EXAMS[0];

  const [selectedExam, setSelectedExam] = useState<ExamConfig>(defaultExam);
  const [selectedCategory, setSelectedCategory] = useState<CandidateCategory>('UR');
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [parsedResult, setParsedResult] = useState<ParsedExamResult | null>(null);
  const [candidateRankings, setCandidateRankings] = useState<CandidateRankings | null>(null);

  // Hydrate cached scorecard on initial mount if available (0ms offline hydration)
  useEffect(() => {
    const cached = AnswerKeyService.getCachedScorecard();
    if (cached) {
      setParsedResult(cached);
    }
  }, []);

  const handleCalculateScore = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let result: ParsedExamResult;

      if (inputMode === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please paste your official SSC / TCS iON answer key link.');
        }
        result = await AnswerKeyService.parseUrlViaEdge(urlInput, selectedExam, selectedCategory);
      } else {
        if (!uploadedFile) {
          throw new Error('Please select or drop an answer key HTML file.');
        }
        const fileContent = await uploadedFile.text();
        result = AnswerKeyService.parseHtmlOffline(fileContent, selectedExam, selectedCategory);
      }

      setParsedResult(result);

      // Asynchronously attempt to save to Supabase and query rankings
      AnswerKeyService.saveSubmissionToCloud(result, selectedExam.id).then(async (submissionId) => {
        if (submissionId) {
          const ranks = await AnswerKeyService.fetchCandidateRankings(submissionId);
          if (ranks) setCandidateRankings(ranks);
        }
      });

      showToast({
        variant: 'success',
        title: 'Scorecard Ready',
        message: `Successfully calculated score: ${result.metrics.rawScore} marks.`,
        duration: 4000,
      });
    } catch (err: any) {
      console.error('Answer key parsing failed:', err);
      setErrorMessage(err.message || 'Failed to process answer key. Please check your link or file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleReset = () => {
    setParsedResult(null);
    setCandidateRankings(null);
    setUrlInput('');
    setUploadedFile(null);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Top Ambient Wash */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* If result exists, show the Dashboard */}
        {parsedResult ? (
          <ScorecardDashboard
            result={parsedResult}
            rankings={candidateRankings}
            onReset={handleReset}
          />
        ) : (
          /* Calculator Input Form */
          <div className="space-y-6">
            {/* Header with Logical Back Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tools')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs"
                title="Return to Tools"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Answer Key & Score Calculator
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Pro
                  </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Instant raw marks, accuracy breakdown, and question diagnostics from your official response sheet.
                </p>
              </div>
            </div>

            {/* Main Form Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Exam & Category Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Select Target Exam
                  </label>
                  <select
                    value={selectedExam.id}
                    onChange={(e) => {
                      const found = SUPPORTED_EXAMS.find(ex => ex.id === e.target.value);
                      if (found) setSelectedExam(found);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {SUPPORTED_EXAMS.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.examName} ({ex.organizingBody})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Candidate Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as CandidateCategory)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {(['UR', 'OBC', 'EWS', 'SC', 'ST', 'PwD', 'ESM'] as CandidateCategory[]).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Toggle (URL vs Offline HTML) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Input Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('url');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      inputMode === 'url'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Paste URL Link
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('file');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      inputMode === 'file'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload HTML (Offline)
                  </button>
                </div>
              </div>

              {/* Input Area */}
              {inputMode === 'url' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Response Sheet URL (TCS iON / Eduquity)
                  </label>
                  <input
                    type="url"
                    placeholder="https://ssc.digialm.com/... or https://sscexams.cbexams.com/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono transition-all"
                  />
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Tokens are never stored or logged. We calculate scores securely via encrypted edge isolation.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Select or Drop Answer Key HTML File
                  </label>
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/30 transition-all">
                    <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {uploadedFile ? uploadedFile.name : 'Click to select or drag and drop your HTML file'}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Runs 100% locally in your browser. 0ms instant offline parsing.
                    </span>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Error Message Box (Prescribing Fix per Constitution Rule 7) */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="text-rose-600/80 dark:text-rose-400/80">
                      <strong>How to fix:</strong> Make sure the copied URL begins with <code className="font-mono bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded">https://ssc.digialm.com/</code> or download your response sheet as an HTML file using Ctrl+S and use the file upload option.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                onClick={handleCalculateScore}
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-sm hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Response Sheet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Calculate Marks & Section Breakdown</span>
                  </>
                )}
              </button>
            </div>

            {/* User Education Guide */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                How to copy your Answer Key URL link:
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>Log in to the official SSC candidate response sheet portal (TCS iON).</li>
                <li>Click on <strong>"Click here to generate it"</strong> to view your response sheet with questions.</li>
                <li>Copy the complete URL link from your browser's address bar.</li>
                <li>Paste it in the box above and click <strong>Calculate Marks</strong>.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
