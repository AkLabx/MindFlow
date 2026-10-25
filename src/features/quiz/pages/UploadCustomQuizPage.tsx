import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { db } from '../../../lib/db';
import { Question } from '../types';
import { ArrowLeft, Copy, UploadCloud, Play, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button/Button';

export interface CustomQuizBank {
  id: string;
  name: string;
  createdAt: number;
  questions: Question[];
}

const AI_PROMPT = `Convert the following questions into a JSON array matching exactly this TypeScript interface. Ensure every object is part of a single root JSON array. Do not include markdown code block wrappers like \`\`\`json in your final output, just raw JSON.

Interface:
{
  "id": "string", // Generate a random UUID for each
  "question": "string", // The question text
  "options": ["string"], // Exactly 4 options
  "correct": "string", // Must perfectly match one of the options
  "explanation": {
    "summary": "string" // Short explanation of why it is correct
  },
  "properties": {
    "difficulty": "Medium",
    "questionType": "MCQ"
  },
  "classification": {
    "subject": "Custom",
    "topic": "Custom"
  },
  "tags": ["custom"]
}

Questions to convert:
[PASTE YOUR QUESTIONS HERE]`;

export const UploadCustomQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const startQuiz = useQuizSessionStore((state) => state.startQuiz);

  const [jsonInput, setJsonInput] = useState('');
  const [banks, setBanks] = useState<CustomQuizBank[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const storedBanks = await db.getCustomBanks();
      setBanks(storedBanks);
    } catch (err) {
      console.error('Failed to load custom banks:', err);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateAndImport = async () => {
    setError(null);
    try {
      if (!jsonInput.trim()) {
        throw new Error('Input is empty.');
      }

      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of questions.');
      }

      if (parsed.length === 0) {
        throw new Error('Array is empty.');
      }

      // Basic validation
      parsed.forEach((q: any, index: number) => {
        if (!q.id) q.id = crypto.randomUUID();
        if (!q.question) throw new Error(`Question at index ${index} is missing "question" field.`);
        if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`Question at index ${index} must have an "options" array with at least 2 items.`);
        if (!q.correct) throw new Error(`Question at index ${index} is missing "correct" answer.`);
        if (!q.options.includes(q.correct)) throw new Error(`Question at index ${index}: correct answer must exactly match one of the options.`);
      });

      const newBank: CustomQuizBank = {
        id: crypto.randomUUID(),
        name: `Custom Quiz - ${new Date().toLocaleDateString()}`,
        createdAt: Date.now(),
        questions: parsed,
      };

      await db.saveCustomBank(newBank);
      setJsonInput('');
      loadBanks();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    await db.deleteCustomBank(id);
    loadBanks();
  };

  const handlePlay = (bank: CustomQuizBank) => {
    // Generate fresh session ID to avoid saving over the bank itself
    const sessionId = crypto.randomUUID();
    const mockFilters: any = { subject: ['Custom'], difficulty: ['All'], selectedExams: [], selectedTopics: [] };

    // Start standard learning mode
    startQuiz(bank.questions, mockFilters, 'learning', sessionId, bank.name);
    navigate('/quiz/session/learning/' + sessionId);
  };

  return (
    <div className="flex flex-col min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] bg-slate-50 dark:bg-[#0B1120]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mcqs')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Upload Custom Quiz</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-8">

        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Local Storage Only</p>
            <p>Custom quizzes are saved strictly in your browser's IndexedDB. They are not synced to the cloud. Clearing your browser cache or site data will permanently delete these quizzes.</p>
          </div>
        </div>

        {/* Smart Import Section */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Smart Import (AI)</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            Use ChatGPT or Gemini to automatically convert your raw text questions into our required JSON format.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              onClick={handleCopyPrompt}
              variant={copied ? "primary" : "outline"}
              className="flex items-center gap-2"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Prompt Copied!" : "Copy AI Prompt"}
            </Button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Paste AI Generated JSON Here
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
              placeholder={`[\n  {\n    "question": "..."\n  }\n]`}
            />

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm font-medium">
                Validation Error: {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-auto">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="secondary" className="w-full sm:w-auto flex items-center gap-2 pointer-events-none">
                  <UploadCloud className="w-4 h-4" />
                  Upload .json File
                </Button>
              </div>

              <Button
                onClick={validateAndImport}
                disabled={!jsonInput.trim()}
                variant="primary"
                className="w-full sm:w-auto px-8"
              >
                Load Questions
              </Button>
            </div>
          </div>
        </section>

        {/* Bank List Section */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Custom Banks</h2>

          {banks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <p className="text-slate-500 dark:text-slate-400">No custom question banks found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banks.map((bank) => (
                <div key={bank.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">{bank.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {bank.questions.length} questions • {new Date(bank.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <Button
                      onClick={() => handlePlay(bank)}
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Play Quiz
                    </Button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                      title="Delete Bank"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
