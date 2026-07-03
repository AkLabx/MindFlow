import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { useEnrichmentAdmin } from '../hooks/useEnrichmentAdmin';

import { PipelineHealthCards } from '../components/PipelineHealthCards';
import { QuotaDefensePanel } from '../components/QuotaDefensePanel';
import { ProgressMatrix } from '../components/ProgressMatrix';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { ActionPanel } from '../components/ActionPanel';
import { DLQInspector } from '../components/DLQInspector';

export const AdminEnrichmentControlCenter: React.FC = () => {
    const navigate = useNavigate();
    const {
        metrics,
        isMetricsLoading,
        isMetricsError,
        dlq,
        emergencyStop,
        resume,
        forceSingleRecord,
        forceManualBatch,
        retryDlq,
        archiveDlq,
        archiveAllDlq
    } = useEnrichmentAdmin();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMetricsLoading && !metrics) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <SynapticLoader size="xl" />
            </div>
        );
    }

    if (isMetricsError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-md">
                    <h2 className="text-xl font-bold mb-2">Metrics Unavailable</h2>
                    <p className="text-sm">Could not connect to the Enrichment Control Center RPCs. Ensure migrations are applied.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Return to Admin Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Brain className="w-6 h-6 text-indigo-500" />
                            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Enrichment Center</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Row 1: Pipeline Health */}
                <PipelineHealthCards metrics={metrics} />

                {/* Row 2: Quota Defense */}
                <QuotaDefensePanel metrics={metrics} />

                {/* Row 3: Progress Matrix */}
                <ProgressMatrix metrics={metrics} />

                {/* Row 4: Telemetry */}
                <TelemetryPanel metrics={metrics} />

                {/* Row 5: Action Panel */}
                <ActionPanel
                    isPipelineActive={metrics?.pipeline_active || false}
                    onPause={emergencyStop}
                    onResume={resume}
                    onEmergencyStop={emergencyStop}
                    onForceManualBatch={forceManualBatch}
                    onForceSingleRecord={(wordId, task) => forceSingleRecord({wordId, task})}
                    isMobile={isMobile}
                />

                {/* Row 6: DLQ Inspector */}
                <DLQInspector
                    dlqJobs={dlq}
                    onRetry={retryDlq}
                    onArchive={archiveDlq}
                    onArchiveAll={archiveAllDlq}
                    isMobile={isMobile}
                />
            </main>
        </div>
    );
};
