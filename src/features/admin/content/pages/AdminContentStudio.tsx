import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckSquare, Settings } from 'lucide-react';
import { AdminReviewQueue } from "../components/AdminReviewQueue";
import { AdminIngestionJob } from '../components/AdminIngestionJob';

export const AdminContentStudio: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ingest' | 'review' | 'profiles'>('ingest');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content Studio</span>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Ingestion Plane</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 flex gap-6">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'ingest'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Ingestion Job
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'review'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <CheckSquare className="w-4 h-4" />
                        Review Queue
                    </button>
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'profiles'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Prompt Profiles
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'ingest' && <AdminIngestionJob />}
                {activeTab === 'review' && <AdminReviewQueue />}
                {activeTab === 'profiles' && <div className="p-12 text-center text-slate-500">Prompt Profiles (Phase 4) coming soon...</div>}
            </main>
        </div>
    );
};
