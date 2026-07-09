import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MonitorPlay, Timer, LayoutPanelLeft, Save, WifiOff, RotateCcw } from 'lucide-react';

export const ExamPlaceholderPage: React.FC = () => {
    const navigate = useNavigate();
    const { testId } = useParams<{ testId: string }>();

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-indigo-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full max-h-screen bg-indigo-600 rounded-full blur-[150px] opacity-20 z-0 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl rounded-[32px] p-8 sm:p-12 border border-slate-800 shadow-2xl relative z-10"
            >

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider mb-10"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Test
                </button>

                <div className="flex items-center justify-center w-20 h-20 bg-indigo-500/10 rounded-[20px] border border-indigo-500/20 mb-8 mx-auto">
                    <MonitorPlay className="w-10 h-10 text-indigo-400" />
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                        MindFlow <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Exam Engine</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium">
                        The next phase of MindFlow introduces a professional Computer Based Test (CBT) environment.
                    </p>
                </div>

                <div className="bg-slate-950/50 rounded-[24px] p-6 sm:p-8 border border-slate-800 mb-10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 text-center">Coming in Phase 4</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0"><MonitorPlay className="w-5 h-5"/></div>
                            Official CBT Interface
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 shrink-0"><Timer className="w-5 h-5"/></div>
                            Precision Timer
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-fuchsia-400 shrink-0"><LayoutPanelLeft className="w-5 h-5"/></div>
                            Question Palette
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0"><Save className="w-5 h-5"/></div>
                            Auto-save Progress
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-rose-400 shrink-0"><WifiOff className="w-5 h-5"/></div>
                            Offline Recovery
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 shrink-0"><RotateCcw className="w-5 h-5"/></div>
                            Resume Attempt
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-slate-500 text-sm font-medium">
                        (Test ID: <span className="font-mono text-slate-600">{testId}</span>)
                    </p>
                </div>

            </motion.div>
        </div>
    );
};
