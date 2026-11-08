import React, { useState } from 'react';
import { FileText, CheckSquare, Settings, Sparkles } from 'lucide-react';
import { AdminReviewQueue } from "../components/AdminReviewQueue";
import { AdminIngestionJob } from '../components/AdminIngestionJob';

export const AdminContentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingest' | 'review' | 'profiles'>('ingest');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            AI Content Ingestion Plane
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Extract, vectorize, and review exam questions from PDF sources via pgmq and Gemini pipelines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('ingest')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ingest'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Ingestion Pipeline
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'review'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Review Queue
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profiles'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Prompt Profiles
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'ingest' && <AdminIngestionJob />}
        {activeTab === 'review' && <AdminReviewQueue />}
        {activeTab === 'profiles' && (
          <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Prompt Engineering Profiles</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Custom prompt configurations mapped to <code className="font-mono">public.ai_prompts</code> for OCR and MCQ enrichment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminContentStudio;
