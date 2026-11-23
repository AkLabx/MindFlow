import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MonitorPlay } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';

/**
 * Legacy placeholder route bridge (`DEC-0021` / `OLD-012`).
 * Redirects any direct `/exam/:testId` hit to the canonical live CBT runner route
 * and eliminates raw `navigate(-1)` (`DEC-0002`).
 */
export const ExamPlaceholderPage: React.FC = () => {
    const navigate = useNavigate();
    const { testId } = useParams<{ testId?: string }>();

    if (testId) {
        return <Navigate to={ROUTES.TEST_SERIES.EXAM_RUNNER(testId)} replace />;
    }

    return (
        <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto">
                    <MonitorPlay className="w-8 h-8 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Prepared Mock Tests Hub
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Select any published BPSC mock test from the test series catalog to launch the live timed CBT exam runner.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light');
                        navigate(ROUTES.TEST_SERIES.BPSC, { replace: true });
                    }}
                    className="min-h-[44px] min-w-[44px] scroll-mb-28 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Browse Mock Tests</span>
                </button>
            </div>
        </div>
    );
};
